const express = require('express');
const session = require('express-session');
const cors = require('cors');
const path = require('path');
const authRoutes = require('./routes/auth');
const doctorRoutes = require('./routes/doctor');
const bloodRoutes = require('./routes/blood');
const accidentRoutes = require('./routes/accident');
// const patientRoutes = require('./routes/patient'); // Comment out or remove

const app = express();

// Middleware
app.use(express.json());
app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET || "@smarthealthcare123",
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: false,
    httpOnly: true,
    sameSite: "strict",
    maxAge: 1000 * 60 * 60 * 24 * 365 * 100
  },
}));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/doctor', doctorRoutes);
app.use('/api/blood', bloodRoutes);
app.use('/api/accident', accidentRoutes);
// app.use('/api/patient', patientRoutes); // Comment out or remove

module.exports = app;