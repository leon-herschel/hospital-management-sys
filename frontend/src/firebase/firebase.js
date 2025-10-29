// AIAssistant.jsx
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";
import { getFunctions } from "firebase/functions";
import { getAI, getGenerativeModel, GoogleAIBackend } from "firebase/ai";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
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