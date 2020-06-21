const express = require('express');
const colors = require('colors'); // eslint-disable-line no-unused-vars
const dotenv = require('dotenv').config({ path: './config/config.env' }); // eslint-disable-line no-unused-vars
const connectDB = require('./config/db');

const app = express();

// Connect Database
connectDB();

// Init Middleware
// Make sure you can parse data in req.body
app.use(express.json({ extended: false }));

// test API endpoint
app.get('/', (req, res) => res.send('API Running'));

// Define Routes
app.use('/api/users', require('./routes/api/users'));
app.use('/api/posts', require('./routes/api/posts'));
app.use('/api/auth', require('./routes/api/auth'));
app.use('/api/profile', require('./routes/api/profile'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () =>
  console.log(
    `Server running in ${process.env.NODE_ENV} mode on port ${PORT}`.yellow.bold
  )
);
