const admin = require('../config/firebase');

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

async function verifyToken(req) {
    const token = req.headers.authorization?.split('Bearer ')[1];
    if (!token) throw new Error('No token provided');
    
    const decodedToken = await admin.auth().verifyIdToken(token);
    return decodedToken;
}

module.exports = async (req, res) => {
    if (handleCors(req, res)) return;

    try {
        const user = await verifyToken(req);
        const { pathname } = new URL(req.url, `http://${req.headers.host}`);
        const parts = pathname.split('/');
        const taskId = parts[parts.length - 1];

        switch (req.method) {
            case 'GET':
                const snapshot = await admin.database()
                    .ref(`tasks/${user.uid}`)
                    .once('value');
                return res.json(snapshot.val() || {});

            case 'POST':
                const { text } = req.body;
                if (!text) {
                    return res.status(400).json({ error: 'Task text is required' });
                }

                const tasksRef = admin.database().ref(`tasks/${user.uid}`);
                const newTaskRef = tasksRef.push();
                
                await newTaskRef.set({
                    text,
                    completed: false,
                    timestamp: admin.database.ServerValue.TIMESTAMP
                });

                return res.json({
                    id: newTaskRef.key,
                    text,
                    completed: false
                });

            case 'PUT':
                if (taskId === 'tasks') {
                    return res.status(400).json({ error: 'Task ID is required' });
                }

                const { completed } = req.body;
                await admin.database()
                    .ref(`tasks/${user.uid}/${taskId}`)
                    .update({ completed });
                    
                return res.json({ success: true });

            case 'DELETE':
                if (taskId === 'tasks') {
                    return res.status(400).json({ error: 'Task ID is required' });
                }

                await admin.database()
                    .ref(`tasks/${user.uid}/${taskId}`)
                    .remove();
                    
                return res.json({ success: true });

            default:
                return res.status(405).json({ error: 'Method not allowed' });
        }
    } catch (error) {
        console.error('Tasks error:', error);
        if (error.message === 'No token provided') {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        return res.status(500).json({ error: error.message });
    }
};