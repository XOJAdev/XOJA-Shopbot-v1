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

// Diagnostic logging for Fly.io environment
console.log('--- Environment Diagnostics ---');
console.log(`FLY_APP_NAME: ${process.env.FLY_APP_NAME || 'Not set'}`);
console.log(`NODE_ENV: ${process.env.NODE_ENV || 'Not set'}`);
console.log(`Initial PORT from env: ${process.env.PORT || 'Not set'}`);

// Port configuration (Fly.io usually expects 8080)
const PORT = process.env.PORT || 8080;

// Connect to Database
connectDB().catch(err => {
    console.error('CRITICAL: Initial database connection failed.');
    // Note: The app stays alive to allow for recovery or manual inspection
});

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

// Telegram Bot Webhook setup
const isFly = !!process.env.FLY_APP_NAME;
let APP_URL = process.env.WEBHOOK_URL || (isFly ? `https://${process.env.FLY_APP_NAME}.fly.dev` : process.env.RENDER_EXTERNAL_URL);

// Clean up APP_URL (remove trailing slash)
if (APP_URL && APP_URL.endsWith('/')) {
    APP_URL = APP_URL.slice(0, -1);
}

if (APP_URL) {
    const webhookPath = '/telegram-webhook';
    const webhookUrl = `${APP_URL}${webhookPath}`;
    
    console.log(`Diagnostic: Calculated Webhook URL: ${webhookUrl}`);

    // Explicit webhook route
    app.post(webhookPath, (req, res) => {
        bot.handleUpdate(req.body);
        res.sendStatus(200);
    });

    bot.telegram.setWebhook(webhookUrl)
        .then(() => console.log(`🚀 Telegram Webhook set to ${webhookUrl} (Env: ${isFly ? 'Fly.io' : 'Other'})`))
        .catch(err => console.error('❌ Error setting webhook:', err));
} else {
    // Fallback to Long Polling (Local Development)
    bot.launch().then(() => {
        console.log('🤖 Telegram Bot is running (Polling)...');
    }).catch(err => {
        if (err.response && err.response.error_code === 409) {
            console.error('❌ Conflict: Another bot instance is running. Stop local instances or set WEBHOOK_URL.');
        } else {
            console.error('❌ Failed to launch Telegram Bot:', err);
        }
    });
}

// Enable graceful stop for bot (only if running)
const stopBot = (signal) => {
    try {
        if (bot && bot.polling && bot.polling.started) {
            bot.stop(signal);
        }
    } catch (e) {
        // Silently ignore if bot already stopped or not running in polling mode
    }
};

process.once('SIGINT', () => stopBot('SIGINT'));
process.once('SIGTERM', () => stopBot('SIGTERM'));

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception thrown:', err);
});

// Start Express server
app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT} (Binding: 0.0.0.0)`);
    
    // Render Keep-Alive (Self-ping every 14 minutes) - legacy support
    const RENDER_EXTERNAL_URL = process.env.RENDER_EXTERNAL_URL || process.env.RENDER_URL;
    if (RENDER_EXTERNAL_URL) {
        const pingUrl = RENDER_EXTERNAL_URL.endsWith('/') ? `${RENDER_EXTERNAL_URL}ping` : `${RENDER_EXTERNAL_URL}/ping`;
        setInterval(async () => {
            try {
                await axios.get(pingUrl);
                console.log('Keep-alive ping sent successfully');
            } catch (err) {
                console.error('Keep-alive ping failed:', err.message);
            }
        }, 14 * 60 * 1000);
    }
});
