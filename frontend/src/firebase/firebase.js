// AIAssistant.jsx
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";
import { getFunctions } from "firebase/functions";
import { getAI, getGenerativeModel, GoogleAIBackend } from "firebase/ai";

const firebaseConfig = {
  apiKey: "AIzaSyC1w0tPJff953vbLjNDVCUBdFKZdw9m9lE",
  authDomain: "odyssey-test-db.firebaseapp.com",
  databaseURL: "https://odyssey-test-db-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "odyssey-test-db",
  storageBucket: "odyssey-test-db.firebasestorage.app",
  messagingSenderId: "795570037018",
  appId: "1:795570037018:web:b3bc4ac3fbdf3158e68ca3",
  measurementId: "G-ZK86LXT66J"
};

// Initialize Firebase
// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services

// Initialize Firebase services
export const auth = getAuth(app);
export const database = getDatabase(app);
export const functions = getFunctions(app);

// Initialize the Gemini AI
export const ai = getAI(app, { backend: new GoogleAIBackend() });

// Create a GenerativeModel instance
export const model = getGenerativeModel(ai, { model: "gemini-2.0-flash-exp" });

// Example: calling the model
export async function askAI(prompt) {
  const result = await model.generateContent(prompt);
  return result.response.text();
}

// Export the config if needed elsewhere
export { firebaseConfig };