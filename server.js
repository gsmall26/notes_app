// server.js
require('dotenv').config();
const path = require('path');
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');

const connectDB = require('./config/db');
const noteRoutes = require('./routes/noteRoutes');

const app = express();

// Connect DB
connectDB();

// Middleware
app.use(morgan('dev'));
app.use(cors());
app.use(express.json()); // parse JSON bodies

// API routes
app.use('/api/notes', noteRoutes);

// Serve static frontend
app.use(express.static(path.join(__dirname, 'public')));

// Fallback: send index.html for root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 404 for unknown API routes (basic)
app.use('/api', (req, res) => {
  res.status(404).json({ success: false, message: 'API route not found' });
});

// Global error handler (optional, basic)
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, message: 'Server error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
