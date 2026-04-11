require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const jobRoutes = require('./routes/jobRoutes');
const resumeRoutes = require('./routes/resumeRoutes');

const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'https://applymatee.netlify.app', 'https://applymate.netlify.app', 'https://applmate-backend.onrender.com'], 
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/resume', resumeRoutes);
app.use('/api/ai', require('./routes/aiRoutes'));

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'ApplyMate API is running' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

const PORT = process.env.PORT || 5000;

let mongoURI = (process.env.MONGO_URI || 'mongodb://localhost:27017/applymate').replace(/^["']|["']$/g, '').trim();

// Strip out accidental "MONGO_URI=" prefix if user pasted the entire assignment statement
if (mongoURI.startsWith('MONGO_URI=')) {
  mongoURI = mongoURI.replace('MONGO_URI=', '');
}

// Log a safe partial snippet so they can see the typo in Render logs
console.log('Attempting to connect to MongoDB with scheme:', mongoURI.substring(0, 20) + '...');

// Database Connection
mongoose
  .connect(mongoURI)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  });
