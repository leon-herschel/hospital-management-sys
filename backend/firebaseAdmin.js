import admin from "firebase-admin";

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),

  databaseURL:
    "https://hospital-management-syst-315f8-default-rtdb.asia-southeast1.firebasedatabase.app/",
});

const db = admin.database();
export default db;
