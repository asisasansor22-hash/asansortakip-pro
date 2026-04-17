import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyAWU95hhLKUKc_bTX5fqlLjDyPtOJ8w5r4',
  authDomain: 'asansortakipv3.firebaseapp.com',
  databaseURL:
    'https://asansortakipv3-default-rtdb.europe-west1.firebasedatabase.app',
  projectId: 'asansortakipv3',
  storageBucket: 'asansortakipv3.firebasestorage.app',
  messagingSenderId: '1037552972911',
  appId: '1:1037552972911:web:bd2daac0919f1062d8899a',
  measurementId: 'G-Z6GPHV36QW',
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const FIREBASE_DB_URL = firebaseConfig.databaseURL;

async function getToken() {
  const user = auth.currentUser;
  if (!user) return null;
  try {
    return await user.getIdToken();
  } catch {
    return null;
  }
}

export async function firebaseLogin(email, password) {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, user: result.user };
  } catch (e) {
    if (
      e.code === 'auth/user-not-found' ||
      e.code === 'auth/invalid-credential'
    ) {
      try {
        const result2 = await createUserWithEmailAndPassword(
          auth,
          email,
          password,
        );
        return { success: true, user: result2.user };
      } catch (e2) {
        return { success: false, error: e2.message };
      }
    }
    return { success: false, error: e.message };
  }
}

export async function firebaseLogout() {
  try {
    await signOut(auth);
  } catch {}
}

export function onAuthChange(cb) {
  return onAuthStateChanged(auth, cb);
}

export { auth };

export async function dbGet(key) {
  try {
    const token = await getToken();
    let url = FIREBASE_DB_URL + '/asansor/' + key + '.json';
    if (token) url += '?auth=' + token;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return null;
    const data = await res.json();
    return data !== null && data !== undefined ? data : null;
  } catch {
    return null;
  }
}

export async function dbSet(key, value) {
  try {
    const token = await getToken();
    let url = FIREBASE_DB_URL + '/asansor/' + key + '.json';
    if (token) url += '?auth=' + token;
    await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(value),
    });
  } catch {}
}
