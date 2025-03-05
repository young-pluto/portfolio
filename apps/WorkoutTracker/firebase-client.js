// apps/WorkoutTracker/firebase-client.js
async function initializeFirebase() {
    try {
      // Fetch Firebase config from our API
      const response = await fetch('/api/firebase-config');
      
      if (!response.ok) {
        throw new Error('Failed to load Firebase configuration');
      }
      
      const firebaseConfig = await response.json();
      
      // Initialize Firebase
      firebase.initializeApp(firebaseConfig);
      
      // Make auth and database available globally
      window.auth = firebase.auth();
      window.database = firebase.database();
      
      console.log('Firebase initialized successfully');
      
      // Initialize your app modules once Firebase is ready
      AuthModule.init();
    } catch (error) {
      console.error('Firebase initialization error:', error);
    }
  }
  
  // Initialize Firebase when the document is ready
  document.addEventListener('DOMContentLoaded', initializeFirebase);