// firebaseConfig.ts
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
    apiKey: "AIzaSyCPnOnmLkCh7rmDiXu9MYQ2-SfagtKXFsU",
    authDomain: "localink-3c826.firebaseapp.com",
    projectId: "localink-3c826",
    storageBucket: "localink-3c826.firebasestorage.app",
    messagingSenderId: "599735418190",
    appId: "1:599735418190:web:cb00a9e3fce7558e1bb21f",
    measurementId: "G-Z0WVV84RPR"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const storage = getStorage(app);
