const express = require('express');
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware to parse incoming JSON requests
app.use(express.json());

// Basic root route
app.get('/', (req, res) => {
  res.send('forhadsaloon is running!');
});

// Start the server
app.listen(PORT, () => {
  console.log(`forhadsaloon listening on http://localhost:${PORT}`);
});
