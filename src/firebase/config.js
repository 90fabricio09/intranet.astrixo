import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyC9XNi10PClFX6nPomARiYqL2bW7OWiApM",
  authDomain: "astrixo.firebaseapp.com",
  projectId: "astrixo",
  storageBucket: "astrixo.firebasestorage.app",
  messagingSenderId: "661275030080",
  appId: "1:661275030080:web:628b1758950fa8b22065a5",
  measurementId: "G-E1873Z74BV"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar serviços
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;

