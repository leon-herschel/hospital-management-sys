import admin from 'firebase-admin';
import { createRequire } from 'module'; 

const require = createRequire(import.meta.url);
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://hospital-management-syst-315f8-default-rtdb.asia-southeast1.firebasedatabase.app/"
});

const db = admin.database();
export default db;