// api/auth/[...auth].js
import admin from '../config/firebase';
import fetch from 'node-fetch';

const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY;

const corsHeaders = {
    'Access-Control-Allow-Credentials': true,
    'Access-Control-Allow-Origin': '*', // Update this with your domain in production
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Helper function to handle CORS
function handleCors(req, res) {
    if (req.method === 'OPTIONS') {
        res.status(200).send('');
        return true;
    }
    Object.entries(corsHeaders).forEach(([key, value]) => {
        res.setHeader(key, value);
    });
    return false;
}

export default async function handler(req, res) {
    // Handle CORS
    if (handleCors(req, res)) return;

    const { path } = req.query;
    const endpoint = path?.[0] || '';

    try {
        switch (endpoint) {
            case 'login':
                if (req.method === 'POST') {
                    const { email, password } = req.body;

                    // Authenticate with Firebase Auth REST API
                    const response = await fetch(
                        `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`,
                        {
                            method: 'POST',
                            body: JSON.stringify({
                                email,
                                password,
                                returnSecureToken: true
                            }),
                            headers: { 'Content-Type': 'application/json' }
                        }
                    );

                    const data = await response.json();
                    
                    if (!response.ok) {
                        throw new Error(data.error?.message || 'Login failed');
                    }

                    // Get additional user info
                    const userRecord = await admin.auth().getUserByEmail(email);

                    return res.status(200).json({
                        token: data.idToken,
                        idToken: data.idToken,
                        user: {
                            uid: userRecord.uid,
                            email: userRecord.email
                        }
                    });
                }
                break;

            case 'register':
                if (req.method === 'POST') {
                    const { email, password } = req.body;
                    
                    const userRecord = await admin.auth().createUser({
                        email,
                        password,
                        emailVerified: false
                    });

                    return res.status(200).json({
                        success: true,
                        message: 'User registered successfully'
                    });
                }
                break;

            default:
                return res.status(404).json({ error: 'Endpoint not found' });
        }
    } catch (error) {
        console.error('Auth error:', error);
        return res.status(500).json({ error: error.message });
    }
}