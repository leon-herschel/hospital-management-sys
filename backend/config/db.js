import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyAmUGhT2dr_mtVmanMGgXJN0laJEoXuXEo",
  authDomain: "hospitalsys-2e54c.firebaseapp.com",
  projectId: "hospitalsys-2e54c",
  storageBucket: "hospitalsys-2e54c.appspot.com",
  messagingSenderId: "900558939756",
  appId: "1:900558939756:web:dedcbc6c05bc8ad1261a49",
  measurementId: "G-P3H4BL6T1G",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const database = getDatabase(app);
