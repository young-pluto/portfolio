// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { router: authRouter } = require('./routes/auth');
const taskRouter = require('./routes/tasks');

const app = express();

app.use(cors({
    origin: ['http://localhost:5500', 'http://127.0.0.1:5500', 'https://www.builtbyapoorv.in', 'https://tasks.builtbyapoorv.in'],
    credentials: true
}));

app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/tasks', taskRouter);

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});