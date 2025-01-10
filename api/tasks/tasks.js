// api/tasks/[...tasks].js
import admin from '../config/firebase';

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

// Verify Firebase ID token
async function verifyToken(req) {
    const token = req.headers.authorization?.split('Bearer ')[1];
    if (!token) throw new Error('No token provided');
    
    const decodedToken = await admin.auth().verifyIdToken(token);
    return decodedToken;
}

export default async function handler(req, res) {
    // Handle CORS
    if (handleCors(req, res)) return;

    try {
        // Verify token for all requests except OPTIONS
        const user = await verifyToken(req);
        const { path } = req.query;
        const taskId = path?.[1];

        switch (req.method) {
            case 'GET':
                // Get all tasks
                const snapshot = await admin.database()
                    .ref(`tasks/${user.uid}`)
                    .once('value');
                return res.status(200).json(snapshot.val() || {});

            case 'POST':
                // Create new task
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

                return res.status(200).json({
                    id: newTaskRef.key,
                    text,
                    completed: false
                });

            case 'PUT':
                // Update task
                if (!taskId) {
                    return res.status(400).json({ error: 'Task ID is required' });
                }

                const { completed } = req.body;
                await admin.database()
                    .ref(`tasks/${user.uid}/${taskId}`)
                    .update({ completed });
                    
                return res.status(200).json({ success: true });

            case 'DELETE':
                // Delete task
                if (!taskId) {
                    return res.status(400).json({ error: 'Task ID is required' });
                }

                await admin.database()
                    .ref(`tasks/${user.uid}/${taskId}`)
                    .remove();
                    
                return res.status(200).json({ success: true });

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
}