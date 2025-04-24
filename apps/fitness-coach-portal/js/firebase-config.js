/**
 * Firebase Configuration
 * Replace with your Firebase project credentials
 */
const firebaseConfig = {
    apiKey: "AIzaSyCHxp5gn_XWdIa-FGTQOVeqm-X_2DLif4o",
    authDomain: "slot-booking-c28d8.firebaseapp.com",
    projectId: "slot-booking-c28d8",
    storageBucket: "slot-booking-c28d8.appspot.com",
    messagingSenderId: "208015740505",
    appId: "1:208015740505:web:c44451b8162388823fab48",
    measurementId: "G-2CBM0QEYW3",
    databaseURL: "https://slot-booking-c28d8-default-rtdb.firebaseio.com/"
};
  
  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);
  
  // Create references to Firebase services
  const auth = firebase.auth();
  const database = firebase.database();
  
  console.log("Firebase initialized");