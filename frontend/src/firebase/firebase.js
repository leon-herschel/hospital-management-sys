import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAmUGhT2dr_mtVmanMGgXJN0laJEoXuXEo",
  authDomain: "hospitalsys-2e54c.firebaseapp.com",
  databaseURL: "https://hospitalsys-2e54c-default-rtdb.firebaseio.com",
  projectId: "hospitalsys-2e54c",
  storageBucket: "hospitalsys-2e54c.appspot.com",
  messagingSenderId: "900558939756",
  appId: "1:900558939756:web:dedcbc6c05bc8ad1261a49",
  measurementId: "G-P3H4BL6T1G",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
export const database = getDatabase(app);
export { auth };
