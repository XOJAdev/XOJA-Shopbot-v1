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

// Health Check Route (Uptime Monitoring)
app.get('/health', (req, res) => res.send('XOJA Shopbot running'));
app.get('/ping', (req, res) => res.status(200).send('pong'));

// Routes
app.use('/', adminRoutes);

// Routes
app.use('/', adminRoutes);

// Telegram Bot Webhook / Polling setup
const WEBHOOK_URL = process.env.WEBHOOK_URL; // e.g. https://your-app.onrender.com

if (WEBHOOK_URL) {
    const secretPath = `/webhook/${bot.token}`;
    app.use(bot.webhookCallback(secretPath));
    bot.telegram.setWebhook(`${WEBHOOK_URL}${secretPath}`)
        .then(() => console.log(`Webhook set to ${WEBHOOK_URL}${secretPath}`))
        .catch(err => console.error('Error setting webhook:', err));
} else {
    // Fallback to Long Polling (Local Development)
    bot.launch().then(() => {
        console.log('Telegram Bot is running (Polling)...');
    }).catch(err => {
        console.error('Failed to launch Telegram Bot:', err);
    });
}

// Enable graceful stop for bot
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

// Start Express server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
