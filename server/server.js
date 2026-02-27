const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose'); // This is the library that talks to MongoDB
require('dotenv').config();

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// 1. Connect to MongoDB Atlas
const uri = process.env.MONGO_URI; 
mongoose.connect(uri)
  .then(() => console.log("🚀 Successfully connected to MongoDB Atlas!"))
  .catch(err => console.error("❌ Database connection error:", err));

app.get('/', (req, res) => {
  res.send('ArcadeHub Server is online and connected to the Database!');
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
// Add this near your other imports
const authRoutes = require('./routes/auth');

// Add this below your existing app.use(express.json())
app.use('/api/auth', authRoutes);