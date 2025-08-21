// src/services/firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage"; // ✅ Importa Storage

// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyB0x8sDTWZBt6o4Vsq-7T2dDAGsqm-U3DI",
  authDomain: "bebidafacil-23cce.firebaseapp.com",
  projectId: "bebidafacil-23cce",
  storageBucket: "bebidafacil-23cce.appspot.com",
  messagingSenderId: "287901500943",
  appId: "1:287901500943:web:22367e5e61f15f33ee857a",
  measurementId: "G-6H9PBL1B87"
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);

// Exporta Auth, Firestore e Storage
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app); // ✅ Exporta Storage
