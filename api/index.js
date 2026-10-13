const express = require('express');
const cors = require('cors');
const app = express();

app.use(express.json());
app.use(cors());

// Test API Route
app.get('/api/hello', (req, res) => {
  res.json({ message: "Node.js Backend is working perfectly!" });
});

module.exports = app;