// routes/auth.js
const express = require('express');
const admin = require('../config/firebase');
const router = express.Router();
const fetch = require('node-fetch'); // Add this at the top

// Add this constant at the top of the file
const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY;


router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // First verify credentials with Firebase Auth REST API
        const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`, {
            method: 'POST',
            body: JSON.stringify({
                email,
                password,
                returnSecureToken: true
            }),
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error?.message || 'Login failed');
        }

        // Successfully got the ID token
        const idToken = data.idToken;
        const userRecord = await admin.auth().getUserByEmail(email);
        
        res.json({ 
            token: idToken,  // Use the ID token from Firebase Auth
            idToken: idToken, // Send it twice for clarity
            user: {
                uid: userRecord.uid,
                email: userRecord.email
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(401).json({ error: 'Invalid credentials' });
    }
});

// Keep your existing register endpoint
router.post('/register', async (req, res) => {
    try {
        const { email, password } = req.body;
        const userRecord = await admin.auth().createUser({
            email,
            password,
            emailVerified: false
        });
        res.json({ 
            success: true,
            message: 'User registered successfully'
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(400).json({ error: error.message });
    }
});

const verifyToken = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split('Bearer ')[1];
        if (!token) throw new Error('No token provided');
        
        const decodedToken = await admin.auth().verifyIdToken(token);
        req.user = decodedToken;
        next();
    } catch (error) {
        console.error('Token verification error:', error);
        res.status(401).json({ error: 'Unauthorized' });
    }
};

module.exports = { router, verifyToken };