// api/config/firebase.js
const admin = require('firebase-admin');

if (!admin.apps.length) {
    try {
        // Parse the service account JSON from environment variable
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://portfolio-415e1-default-rtdb.asia-southeast1.firebasedatabase.app"
        });
    } catch (error) {
        console.error('Firebase admin initialization error:', error);
    }
}

module.exports = admin;