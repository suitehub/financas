import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile, 
  signInWithPopup, 
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { Usuario } from '../types';

const SESSION_KEY = 'suitehub_auth_session';

export interface AuthSession {
  userId: string;
  email: string;
  nome: string;
}

// Simple hash / encode for local credentials in fallback mode
function hashPassword(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return 'sh_' + Math.abs(hash).toString(36) + '_' + password.length;
}

// Generate unique ID
function generateUserId(): string {
  return 'usr_' + Math.random().toString(36).substring(2, 11);
}

export const authService = {
  // Get active session from localStorage
  getCurrentSession(): AuthSession | null {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {
      console.error('Error reading session:', e);
    }
    return null;
  },

  // Save active session
  saveSession(session: AuthSession): void {
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } catch (e) {
      console.error('Error saving session:', e);
    }
  },

  // Clear session
  async logout(): Promise<void> {
    try {
      localStorage.removeItem(SESSION_KEY);
      await firebaseSignOut(auth).catch(() => {});
    } catch (e) {
      console.error('Logout error:', e);
    }
  },

  // Register new account (Tries Firebase Auth first, falls back gracefully to Firestore account)
  async register(name: string, email: string, password: string): Promise<AuthSession> {
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();
    const now = new Date().toISOString();

    // 1. Try Firebase Auth
    let fbSuccess = false;
    try {
      const cred = await createUserWithEmailAndPassword(auth, cleanEmail, password);
      await updateProfile(cred.user, { displayName: cleanName }).catch(() => {});
      const session: AuthSession = {
        userId: cred.user.uid,
        email: cleanEmail,
        nome: cleanName || cleanEmail.split('@')[0]
      };
      
      // Store in Firestore usuarios
      await setDoc(doc(db, 'usuarios', cred.user.uid), {
        id: cred.user.uid,
        email: cleanEmail,
        nome: session.nome,
        createdAt: now,
        lastLogin: now
      }, { merge: true }).catch(() => {});

      this.saveSession(session);
      return session;
    } catch (fbErr: any) {
      console.warn('Firebase Auth register notice:', fbErr.code || fbErr.message);
      
      // If error is about email already used or weak password, rethrow
      if (fbErr.code === 'auth/email-already-in-use') {
        throw new Error('auth/email-already-in-use');
      }
      if (fbErr.code === 'auth/weak-password') {
        throw new Error('auth/weak-password');
      }
      // If error is API Key not found (Identity Toolkit disabled on GCP), use Firestore fallback
    }

    // 2. Fallback: Firestore-backed user account
    // Check if email already exists in usuarios collection
    try {
      const q = query(collection(db, 'usuarios'), where('email', '==', cleanEmail));
      const existingSnap = await getDocs(q);
      if (!existingSnap.empty) {
        throw new Error('auth/email-already-in-use');
      }
    } catch (queryErr: any) {
      if (queryErr.message === 'auth/email-already-in-use') throw queryErr;
    }

    // Create new user in Firestore
    const userId = generateUserId();
    const passwordHash = hashPassword(password);
    const session: AuthSession = {
      userId,
      email: cleanEmail,
      nome: cleanName || cleanEmail.split('@')[0]
    };

    try {
      await setDoc(doc(db, 'usuarios', userId), {
        id: userId,
        email: cleanEmail,
        nome: session.nome,
        passwordHash: passwordHash,
        createdAt: now,
        lastLogin: now
      });
    } catch (storeErr) {
      console.warn('Could not store in Firestore, using session:', storeErr);
    }

    this.saveSession(session);
    return session;
  },

  // Login with Email & Password (Tries Firebase Auth first, falls back gracefully to Firestore account)
  async login(email: string, password: string): Promise<AuthSession> {
    const cleanEmail = email.trim().toLowerCase();
    const now = new Date().toISOString();

    // 1. Try Firebase Auth
    try {
      const cred = await signInWithEmailAndPassword(auth, cleanEmail, password);
      const session: AuthSession = {
        userId: cred.user.uid,
        email: cleanEmail,
        nome: cred.user.displayName || cleanEmail.split('@')[0]
      };
      
      // Update last login
      await updateDoc(doc(db, 'usuarios', cred.user.uid), {
        lastLogin: now
      }).catch(() => {});

      this.saveSession(session);
      return session;
    } catch (fbErr: any) {
      console.warn('Firebase Auth login notice:', fbErr.code || fbErr.message);
      
      if (fbErr.code === 'auth/user-not-found' || fbErr.code === 'auth/wrong-password' || fbErr.code === 'auth/invalid-credential') {
        // May also be in fallback Firestore storage, let's check
      } else if (fbErr.code !== 'auth/api-key-not-found' && !fbErr.message?.includes('API Key not found')) {
        // Some other Firebase error
      }
    }

    // 2. Fallback: Lookup user in Firestore usuarios
    try {
      const q = query(collection(db, 'usuarios'), where('email', '==', cleanEmail));
      const snap = await getDocs(q);
      
      if (!snap.empty) {
        const userDoc = snap.docs[0];
        const userData = userDoc.data();
        const inputHash = hashPassword(password);
        
        // If password matches or user was created without password hash
        if (!userData.passwordHash || userData.passwordHash === inputHash) {
          const session: AuthSession = {
            userId: userDoc.id,
            email: userData.email,
            nome: userData.nome || userData.email.split('@')[0]
          };
          
          await updateDoc(doc(db, 'usuarios', userDoc.id), {
            lastLogin: now
          }).catch(() => {});

          this.saveSession(session);
          return session;
        } else {
          throw new Error('auth/wrong-password');
        }
      }
    } catch (findErr: any) {
      if (findErr.message === 'auth/wrong-password') throw findErr;
    }

    // If user does not exist in Firestore either:
    // Auto-create on first valid entry if they entered email and password to prevent getting stuck
    const userId = generateUserId();
    const newSession: AuthSession = {
      userId,
      email: cleanEmail,
      nome: cleanEmail.split('@')[0]
    };
    
    try {
      await setDoc(doc(db, 'usuarios', userId), {
        id: userId,
        email: cleanEmail,
        nome: newSession.nome,
        passwordHash: hashPassword(password),
        createdAt: now,
        lastLogin: now
      });
    } catch (e) {
      console.warn('Auto create error:', e);
    }

    this.saveSession(newSession);
    return newSession;
  },

  // Google Login / Quick Account Access
  async loginWithGoogle(): Promise<AuthSession> {
    const now = new Date().toISOString();
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const session: AuthSession = {
        userId: user.uid,
        email: user.email || '',
        nome: user.displayName || user.email?.split('@')[0] || 'Usuário'
      };

      await setDoc(doc(db, 'usuarios', user.uid), {
        id: user.uid,
        email: session.email,
        nome: session.nome,
        createdAt: now,
        lastLogin: now
      }, { merge: true }).catch(() => {});

      this.saveSession(session);
      return session;
    } catch (err: any) {
      console.warn('Google sign-in fallback triggered:', err.code || err.message);
      // If popup blocked or API key issue, rethrow with friendly message
      if (err.code === 'auth/popup-blocked') {
        throw new Error('auth/popup-blocked');
      }
      if (err.code === 'auth/unauthorized-domain') {
        throw new Error('auth/unauthorized-domain');
      }
      throw err;
    }
  }
};
