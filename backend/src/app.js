// app.js
const express = require('express');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
const passport = require('passport');
require('dotenv').config();



const app = express();
const PORT = process.env.PORT || 4000;

// Database connection
const pool = require("./config/db-connection");
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('Database connection failed:', err.message);
    } else {
        console.log('Database connected at:', res.rows[0].now);
    }
});

// 1️⃣ CORS setup so cookies can be sent from frontend
app.use(cors({
    origin: "http://localhost:3000", // your React dev URL
    credentials: true
}));

// 2️⃣ Session middleware — needs to be BEFORE passport
app.use(session({
    secret: "TOPSECRETWORD", // keep in env in real apps
    resave: false,
    saveUninitialized: false
}));

// 3️⃣ Passport initialization
app.use(passport.initialize());
app.use(passport.session());

// 4️⃣ Middleware for parsing JSON
app.use(express.json());

// 5️⃣ Import and use routes
const userRoutes = require('./routes/UserRoutes');
const exerciseRoutes = require('./routes/ExerciseRoutes');
const exerciseBundleRoutes = require('./routes/ExerciseBundleRoutes');
const loginRoutes = require('./routes/LoginRoutes'); 
const AdminRoutes = require('./routes/AdminRoutes');

app.use('/api/admin', AdminRoutes);
app.use('/api', userRoutes);
app.use('/api', exerciseRoutes);
app.use('/api', exerciseBundleRoutes);
app.use('/api', loginRoutes); // ⬅️ mount login/logout/me

// 6️⃣ Start server
server = app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});

// Graceful shutdown function
const gracefulShutdown = async () => {
    console.log('Shutting down gracefully...');

    // Close database pool
    try {
        await pool.end();
        console.log('Database pool closed');
    } catch (error) {
        console.error('Error closing database pool:', error);
    }

    // Close server if running
    if (server) {
        server.close(() => {
            console.log('Server closed');
            process.exit(0);
        });
    } else {
        process.exit(0);
    }
};

module.exports = {
    app,
    gracefulShutdown,
};
