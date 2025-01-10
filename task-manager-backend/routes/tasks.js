// routes/tasks.js
const express = require('express');
const admin = require('../config/firebase');
const { verifyToken } = require('./auth');
const router = express.Router();

// Get all tasks
router.get('/', verifyToken, async (req, res) => {
    try {
        const snapshot = await admin.database()
            .ref(`tasks/${req.user.uid}`)
            .once('value');
        res.json(snapshot.val() || {});
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create task
router.post('/', verifyToken, async (req, res) => {
    try {
        const { text } = req.body;
        if (!text) {
            return res.status(400).json({ error: 'Task text is required' });
        }

        const tasksRef = admin.database().ref(`tasks/${req.user.uid}`);
        const newTaskRef = tasksRef.push();
        
        await newTaskRef.set({
            text,
            completed: false,
            timestamp: admin.database.ServerValue.TIMESTAMP
        });

        res.json({
            id: newTaskRef.key,
            text,
            completed: false
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update task
router.put('/:taskId', verifyToken, async (req, res) => {
    try {
        const { taskId } = req.params;
        const { completed } = req.body;
        
        await admin.database()
            .ref(`tasks/${req.user.uid}/${taskId}`)
            .update({ completed });
            
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete task
router.delete('/:taskId', verifyToken, async (req, res) => {
    try {
        const { taskId } = req.params;
        await admin.database()
            .ref(`tasks/${req.user.uid}/${taskId}`)
            .remove();
            
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;