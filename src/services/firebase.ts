// services/firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

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

// Exporta Auth e Firestore
export const auth = getAuth(app);
export const db = getFirestore(app);
