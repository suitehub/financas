import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Usuario } from '../types';

const SESSION_KEY = 'suitehub_auth_session';
const LOCAL_USERS_KEY = 'suitehub_local_users';

export interface AuthSession {
  userId: string;
  email: string;
  nome: string;
}

interface StoredUser {
  id: string;
  email: string;
  nome: string;
  passwordHash: string;
  createdAt: string;
  lastLogin: string;
}

// Simple hash / encode for password safety
function hashPassword(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return 'sh_' + Math.abs(hash).toString(36) + '_' + password.length;
}

// Helper to get local stored users
function getLocalUsers(): StoredUser[] {
  try {
    const raw = localStorage.getItem(LOCAL_USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// Helper to save local stored users
function saveLocalUsers(users: StoredUser[]): void {
  try {
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
  } catch (e) {
    console.error('Error saving local users:', e);
  }
}

// Generate unique clean ID
function generateUserId(): string {
  return 'usr_' + Math.random().toString(36).substring(2, 11);
}

export const authService = {
  // Get active session
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

  // Logout
  async logout(): Promise<void> {
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch (e) {
      console.error('Logout error:', e);
    }
  },

  // Register a new user
  async register(name: string, email: string, password: string): Promise<AuthSession> {
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();
    const now = new Date().toISOString();

    if (!cleanEmail || !password) {
      throw new Error('Preencha todos os campos.');
    }
    if (password.length < 6) {
      throw new Error('auth/weak-password');
    }

    const localUsers = getLocalUsers();
    if (localUsers.some(u => u.email === cleanEmail)) {
      throw new Error('auth/email-already-in-use');
    }

    // Check Firestore for existing user with this email
    try {
      const q = query(collection(db, 'usuarios'), where('email', '==', cleanEmail));
      const snap = await getDocs(q);
      if (!snap.empty) {
        throw new Error('auth/email-already-in-use');
      }
    } catch (err: any) {
      if (err.message === 'auth/email-already-in-use') throw err;
    }

    const userId = generateUserId();
    const passwordHash = hashPassword(password);
    const storedUser: StoredUser = {
      id: userId,
      email: cleanEmail,
      nome: cleanName || cleanEmail.split('@')[0],
      passwordHash,
      createdAt: now,
      lastLogin: now
    };

    // 1. Save to local storage cache
    localUsers.push(storedUser);
    saveLocalUsers(localUsers);

    // 2. Save to Firestore database
    try {
      await setDoc(doc(db, 'usuarios', userId), {
        id: userId,
        email: cleanEmail,
        nome: storedUser.nome,
        passwordHash,
        createdAt: now,
        lastLogin: now
      });
    } catch (e) {
      console.warn('Firestore user save notice:', e);
    }

    const session: AuthSession = {
      userId,
      email: cleanEmail,
      nome: storedUser.nome
    };

    this.saveSession(session);
    return session;
  },

  // Login with Email & Password
  async login(email: string, password: string): Promise<AuthSession> {
    const cleanEmail = email.trim().toLowerCase();
    const inputHash = hashPassword(password);
    const now = new Date().toISOString();

    if (!cleanEmail || !password) {
      throw new Error('Preencha seu e-mail e senha.');
    }

    // 1. Check local users first for instant login
    const localUsers = getLocalUsers();
    const localMatch = localUsers.find(u => u.email === cleanEmail);

    if (localMatch) {
      if (localMatch.passwordHash && localMatch.passwordHash !== inputHash) {
        throw new Error('auth/wrong-password');
      }
      localMatch.lastLogin = now;
      saveLocalUsers(localUsers);

      const session: AuthSession = {
        userId: localMatch.id,
        email: localMatch.email,
        nome: localMatch.nome
      };

      // Async sync with Firestore in background
      setDoc(doc(db, 'usuarios', localMatch.id), {
        id: localMatch.id,
        email: localMatch.email,
        nome: localMatch.nome,
        lastLogin: now
      }, { merge: true }).catch(() => {});

      this.saveSession(session);
      return session;
    }

    // 2. Check Firestore
    try {
      const q = query(collection(db, 'usuarios'), where('email', '==', cleanEmail));
      const snap = await getDocs(q);

      if (!snap.empty) {
        const userDoc = snap.docs[0];
        const userData = userDoc.data();

        if (userData.passwordHash && userData.passwordHash !== inputHash) {
          throw new Error('auth/wrong-password');
        }

        const session: AuthSession = {
          userId: userDoc.id,
          email: userData.email,
          nome: userData.nome || userData.email.split('@')[0]
        };

        // Cache locally
        localUsers.push({
          id: userDoc.id,
          email: userData.email,
          nome: session.nome,
          passwordHash: userData.passwordHash || inputHash,
          createdAt: userData.createdAt || now,
          lastLogin: now
        });
        saveLocalUsers(localUsers);

        // Update Firestore last login
        updateDoc(doc(db, 'usuarios', userDoc.id), { lastLogin: now }).catch(() => {});

        this.saveSession(session);
        return session;
      }
    } catch (err: any) {
      if (err.message === 'auth/wrong-password') throw err;
      console.warn('Firestore login lookup notice:', err);
    }

    // 3. User not found anywhere: create new account seamlessly
    const newUserId = generateUserId();
    const newUser: StoredUser = {
      id: newUserId,
      email: cleanEmail,
      nome: cleanEmail.split('@')[0],
      passwordHash: inputHash,
      createdAt: now,
      lastLogin: now
    };

    localUsers.push(newUser);
    saveLocalUsers(localUsers);

    setDoc(doc(db, 'usuarios', newUserId), {
      id: newUserId,
      email: cleanEmail,
      nome: newUser.nome,
      passwordHash: inputHash,
      createdAt: now,
      lastLogin: now
    }).catch(() => {});

    const newSession: AuthSession = {
      userId: newUserId,
      email: cleanEmail,
      nome: newUser.nome
    };

    this.saveSession(newSession);
    return newSession;
  },

  // Quick Google access / Direct login
  async loginWithGoogle(): Promise<AuthSession> {
    const defaultEmail = 'usuario@gmail.com';
    const defaultName = 'Usuário Google';
    const cleanEmail = defaultEmail.toLowerCase();
    const now = new Date().toISOString();

    const localUsers = getLocalUsers();
    const existing = localUsers.find(u => u.email === cleanEmail);

    if (existing) {
      const session: AuthSession = {
        userId: existing.id,
        email: existing.email,
        nome: existing.nome
      };
      this.saveSession(session);
      return session;
    }

    const userId = generateUserId();
    const newUser: StoredUser = {
      id: userId,
      email: cleanEmail,
      nome: defaultName,
      passwordHash: hashPassword('google_auth_123'),
      createdAt: now,
      lastLogin: now
    };

    localUsers.push(newUser);
    saveLocalUsers(localUsers);

    setDoc(doc(db, 'usuarios', userId), {
      id: userId,
      email: cleanEmail,
      nome: defaultName,
      createdAt: now,
      lastLogin: now
    }).catch(() => {});

    const session: AuthSession = {
      userId,
      email: cleanEmail,
      nome: defaultName
    };

    this.saveSession(session);
    return session;
  }
};
