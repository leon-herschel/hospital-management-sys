import admin from "firebase-admin";

admin.initializeApp({
  databaseURL:
    "https://odyssey-test-db-default-rtdb.asia-southeast1.firebasedatabase.app",
});

const db = admin.database();
export default db;
