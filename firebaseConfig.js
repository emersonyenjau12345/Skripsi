import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getAuth, 
  initializeAuth, 
  inMemoryPersistence, 
  browserLocalPersistence, 
  setPersistence 
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";
import { getMessaging, getToken, onMessage } from "firebase/messaging"; 
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: "AIzaSyAHq8UCcbYTGXCHySX75F5-45b_faSywGA",
  authDomain: "coneksiaplikasi.firebaseapp.com",
  databaseURL: "https://coneksiaplikasi-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "coneksiaplikasi",
  storageBucket: "coneksiaplikasi.firebasestorage.app",
  messagingSenderId: "226840353263",
  appId: "1:226840353263:web:b5cd2f26efd5ebfae3fe1a"
};


// Cek apakah Firebase sudah diinisialisasi sebelumnya
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Deteksi apakah aplikasi berjalan di React Native atau Web
const isReactNative = typeof navigator !== "undefined" && navigator.product === "ReactNative";

// Inisialisasi Firebase Auth
let auth;
if (isReactNative) {
  try {
    auth = initializeAuth(app, { persistence: inMemoryPersistence });
  } catch (error) {
    auth = getAuth(app);
  }
} else {
  auth = getAuth(app);
  setPersistence(auth, browserLocalPersistence).catch(console.error);
}

// Inisialisasi Firestore & Realtime Database
const db = getFirestore(app);
const realtimeDb = getDatabase(app);

// Inisialisasi Firebase Cloud Messaging (Hanya untuk Web)
let messaging = null;
if (typeof window !== "undefined" && "Notification" in window) {
  messaging = getMessaging(app);
}

export { app, auth, db, realtimeDb, messaging, getToken, onMessage };
