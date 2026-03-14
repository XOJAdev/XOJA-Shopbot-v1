require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
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

// Health Check Routes (Uptime Monitoring)
app.get('/', (req, res) => res.send('XOJA Shopbot Alive 🤖'));
app.get('/health', (req, res) => res.send('XOJA Shopbot running'));
app.get('/ping', (req, res) => res.status(200).send('pong'));

// Routes
app.use('/', adminRoutes);

// Routes
app.use('/', adminRoutes);

// Telegram Bot Webhook setup
const WEBHOOK_URL = process.env.RENDER_EXTERNAL_URL || process.env.WEBHOOK_URL;

if (WEBHOOK_URL) {
    const webhookPath = '/telegram-webhook';
    
    // Explicit webhook route as requested
    app.post(webhookPath, (req, res) => {
        bot.handleUpdate(req.body);
        res.sendStatus(200);
    });

    bot.telegram.setWebhook(`${WEBHOOK_URL}${webhookPath}`)
        .then(() => console.log(`🚀 Webhook set to ${WEBHOOK_URL}${webhookPath}`))
        .catch(err => console.error('❌ Error setting webhook:', err));
} else {
    // Fallback to Long Polling (Local Development)
    bot.launch().then(() => {
        console.log('🤖 Telegram Bot is running (Polling)...');
    }).catch(err => {
        console.error('❌ Failed to launch Telegram Bot:', err);
    });
}

// Enable graceful stop for bot
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception thrown:', err);
    // Optional: Gracefully exit or monitor
});

// Start Express server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    
    // Render Keep-Alive (Self-ping every 14 minutes)
    const RENDER_EXTERNAL_URL = process.env.RENDER_EXTERNAL_URL || process.env.RENDER_URL;
    if (RENDER_EXTERNAL_URL) {
        console.log(`Keep-alive enabled for: ${RENDER_EXTERNAL_URL}`);
        const pingUrl = RENDER_EXTERNAL_URL.endsWith('/') ? `${RENDER_EXTERNAL_URL}ping` : `${RENDER_EXTERNAL_URL}/ping`;
        setInterval(async () => {
            try {
                await axios.get(pingUrl);
                console.log('Keep-alive ping sent successfully to', pingUrl);
            } catch (err) {
                console.error('Keep-alive ping failed:', err.message);
            }
        }, 14 * 60 * 1000); // 14 minutes
    }
});
