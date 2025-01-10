const admin = require('../config/firebase');
const fetch = require('node-fetch');

const corsHeaders = {
    'Access-Control-Allow-Credentials': true,
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function handleCors(req, res) {
    if (req.method === 'OPTIONS') {
        res.writeHead(200, corsHeaders);
        res.end();
        return true;
    }
    Object.entries(corsHeaders).forEach(([key, value]) => {
        res.setHeader(key, value);
    });
    return false;
}

module.exports = async (req, res) => {
    if (handleCors(req, res)) return;

    try {
        const { pathname } = new URL(req.url, `http://${req.headers.host}`);
        const endpoint = pathname.split('/').pop();

        switch (endpoint) {
            case 'login':
                if (req.method === 'POST') {
                    const { email, password } = req.body;
                    const response = await fetch(
                        `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${process.env.FIREBASE_API_KEY}`,
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

                    const userRecord = await admin.auth().getUserByEmail(email);
                    return res.json({
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

                    return res.json({
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
};