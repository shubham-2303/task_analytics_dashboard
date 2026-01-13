const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/task-analytics';
mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Import routes
const taskRoutes = require('./routes/task.routes');
app.use('/api', taskRoutes);

// Basic route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Task Analytics Backend API',
    endpoints: {
      upload: 'POST /api/upload',
      tasks: 'GET /api/tasks',
      analytics: 'GET /api/analytics'
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📡 Endpoints:`);
  console.log(`   http://localhost:${PORT}/`);
  console.log(`   http://localhost:${PORT}/api/tasks`);
  console.log(`   http://localhost:${PORT}/api/analytics`);
});