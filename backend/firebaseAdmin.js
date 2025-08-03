import admin from "firebase-admin";

admin.initializeApp({
  databaseURL:
    "https://hospital-management-syst-315f8-default-rtdb.asia-southeast1.firebasedatabase.app/",
});

const db = admin.database();
export default db;
