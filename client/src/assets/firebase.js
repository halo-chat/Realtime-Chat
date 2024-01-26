import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import {getStorage} from "firebase/storage"
import {getFirestore} from "firebase/firestore"
const firebaseConfig = {
  apiKey: "AIzaSyDKK16TWPOtGyVUyr2Fo-ddZRKLHePQ1d8",
  authDomain: "chatapp-762a4.firebaseapp.com",
  projectId: "chatapp-762a4",
  storageBucket: "chatapp-762a4.appspot.com",
  messagingSenderId: "415504200715",
  appId: "1:415504200715:web:2fcb453479d47b3dc2430e",
  measurementId: "G-FE5X2Q9S0K",
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth();
export const storage = getStorage()
export const db = getFirestore()
