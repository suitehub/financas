import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, initializeFirestore, doc, getDocFromServer } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyB2aoNmU8GHgVljLi60r7hRyAU9BXVkd84",
  authDomain: "gen-lang-client-0838871373.firebaseapp.com",
  projectId: "gen-lang-client-0838871373",
  storageBucket: "gen-lang-client-0838871373.firebasestorage.app",
  messagingSenderId: "428077416083",
  appId: "1:428077416083:web:3a359f6b311f1a47661766"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore with the custom databaseId if provided
const databaseId = "ai-studio-suitehubfinanas-c587fae7-271e-4847-91f2-78580d309bca";
export const db = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true,
}, databaseId);

export const auth = getAuth(app);

// Test connection on boot as per guidelines
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("Firebase Connection: OK");
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. Client is offline.");
    } else {
      console.warn("Firebase test connection warning (this is normal if DB is empty or permissions restrict root test document):", error);
    }
  }
}
testConnection();
