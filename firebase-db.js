
// firebase-db.js
import { ref, set, push, remove, update } from 'firebase/database';
import { db } from './firebase-config';

export const addTask = async (userId, taskText) => {
    try {
        const tasksRef = ref(db, `tasks/${userId}`);
        const newTaskRef = push(tasksRef);
        await set(newTaskRef, {
            text: taskText,
            completed: false,
            timestamp: Date.now()
        });
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const toggleTask = async (userId, taskId, completed) => {
    try {
        const taskRef = ref(db, `tasks/${userId}/${taskId}`);
        await update(taskRef, { completed });
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const deleteTask = async (userId, taskId) => {
    try {
        const taskRef = ref(db, `tasks/${userId}/${taskId}`);
        await remove(taskRef);
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
};