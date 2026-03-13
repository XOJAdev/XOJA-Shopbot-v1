require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path');
const connectDB = require('./config/db');
const adminRoutes = require('./routes/adminRoutes');
const bot = require('./bot/bot');

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to Database
connectDB();

// Setup EJS View Engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: process.env.SESSION_SECRET || 'secret123',
    resave: false,
    saveUninitialized: false
}));

// Provide bot instance to routes if needed
app.locals.bot = bot;

// Routes
app.use('/', adminRoutes);

// Start bot
bot.launch().then(() => {
    console.log('Telegram Bot is running...');
}).catch(err => {
    console.error('Failed to launch Telegram Bot:', err);
});

// Enable graceful stop for bot
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

// Start Express server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
