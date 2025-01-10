// config/firebase.js
const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://portfolio-415e1-default-rtdb.asia-southeast1.firebasedatabase.app"
});

module.exports = admin;