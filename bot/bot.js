const { Telegraf, Scenes, session, Markup } = require('telegraf');
const User = require('../models/User');
const Order = require('../models/Order');
const crypto = require('crypto');
const { MongoClient } = require('mongodb');
const { session: mdbSession } = require('telegraf-session-mongodb');

const Product = require('../models/Product');

const { t, getMainMenu, dictionary } = require('./i18n');

const bot = new Telegraf(process.env.BOT_TOKEN);

// Global error handler
bot.catch((err, ctx) => {
    console.error(`Error for ${ctx.updateType} (update_id: ${ctx.update.update_id}):`, err);
    if (ctx.from) {
        console.error(`Error from user ${ctx.from.id} (@${ctx.from.username || 'N/A'})`);
    }
});

// User Language Middleware
bot.use(async (ctx, next) => {
    try {
        if (ctx.from) {
            const user = await User.findOne({ telegram_user_id: ctx.from.id });
            ctx.userLang = (user && user.language_code) ? user.language_code : 'en';
        } else {
            ctx.userLang = 'en';
        }
    } catch (e) {
        console.error("Middleware Error:", e);
        ctx.userLang = 'en';
    }
    return next();
});


// --- User Flow Scene ---
// --- User Flow Scene Helpers ---

const notifyAdmins = async (ctx, order, photoFileId = null) => {
    const adminIdsStr = process.env.ADMIN_IDS || '';
    const adminIds = adminIdsStr.split(',').map(id => id.trim()).filter(id => id !== '');
    if (adminIds.length === 0) {
        console.warn("No ADMIN_IDS configured for notifications.");
        return;
    }

    const orderData = {
        orderId: order.order_id,
        game: order.game,
        playerId: order.player_id,
        amount: order.amount,
        price: order.price,
        username: (order.username ? `@${order.username}` : 'N/A').replace(/_/g, '\\_'), // Basic escaping for safety
        userId: order.telegram_user_id
    };

    console.log(`Notifying ${adminIds.length} admins for order ${order.order_id} (Status: ${order.status})`);

    for (const adminId of adminIds) {
        try {
            const adminUser = await User.findOne({ telegram_user_id: Number(adminId) });
            const adminLang = adminUser?.language_code || 'en';
            
            // Format order summary with HTML to avoid Markdown parsing hell with underscores
            const adminMsg = `<b>🔔 Yangi buyurtma qabul qilindi!</b>\n\n` +
                           `📦 <b>ID</b>: <code>${order.order_id}</code>\n` +
                           `🕹 <b>Oʻyin</b>: ${order.game}\n` +
                           `🆔 <b>Player</b>: <code>${order.player_id}</code>\n` +
                           `💎 <b>Paket</b>: ${order.amount}\n` +
                           `💰 <b>Narxi</b>: ${order.price}\n` +
                           `👤 <b>User</b>: @${order.username || 'N/A'} (ID: ${order.telegram_user_id})`;

            if (photoFileId) {
                await ctx.telegram.sendPhoto(adminId, photoFileId, {
                    caption: adminMsg,
                    parse_mode: 'HTML'
                });
            } else {
                await ctx.telegram.sendMessage(adminId, adminMsg, {
                    parse_mode: 'HTML'
                });
            }
        } catch (notificationErr) {
            console.error(`Failed to notify admin ${adminId}:`, notificationErr);
        }
    }
};

bot.on('my_chat_member', (ctx) => {
    const status = ctx.myChatMember.new_chat_member.status;
    const user = ctx.from.id;
    const username = ctx.from.username || 'N/A';
    console.log(`[STATUS] User ${user} (@${username}) status changed to: ${status}`);
    return;
});

const topupStep1 = async (ctx) => {
    const lang = ctx.userLang;
    const text = ctx.message?.text;
    if (!text) return;

    // If /start or /topup is sent while already at Step 1, just continue showing the games
    // No need to "re-enter" or exit unless we want to let global handlers take over.
    // However, we want to ensure it doesn't enter FALLBACK logic.
    if (['/start', '/topup'].includes(text)) {
        // Just proceed to show products
    } else if (text !== t(lang, 'btn_topup')) {
        // FALLBACK: If we receive a game name here (due to session lag/duplicate button sync), move to next step
        const gameExists = await Product.exists({ game: text, isActive: true });
        if (gameExists) {
            ctx.wizard.state.order = {};
            ctx.wizard.state.order.game = text;
            ctx.wizard.selectStep(1);
            return topupStep2(ctx); 
        }
    }

    ctx.wizard.state.order = {};
    const products = await Product.find({ isActive: true }).distinct('game');
    if (products.length === 0) {
        await ctx.reply(t(lang, 'no_games'), Markup.keyboard(getMainMenu(lang)).resize());
        return ctx.scene.leave();
    }

    const buttons = [];
    for (let i = 0; i < products.length; i += 2) {
        const row = [products[i]];
        if (products[i+1]) row.push(products[i+1]);
        buttons.push(row);
    }
    buttons.push([t(lang, 'btn_back_main')]);

    await ctx.reply(t(lang, 'select_game'), Markup.keyboard(buttons).resize());
    return ctx.wizard.next();
};

const topupStep2 = async (ctx) => {
    const lang = ctx.userLang;
    const text = ctx.message?.text;
    if (!text) return;
    
    if (text === t(lang, 'btn_cancel') || text === t(lang, 'btn_back_main') || text === '/cancel' || text === '/start') {
        if (text === '/start') {
            await ctx.scene.leave();
            return ctx.start(); // Re-trigger greeting
        }
        await ctx.reply(t(lang, 'topup_cancelled'), Markup.keyboard(getMainMenu(lang)).resize());
        return ctx.scene.leave();
    }

    const gameExists = await Product.exists({ game: text, isActive: true });
    if (!gameExists) {
        await ctx.reply(t(lang, 'invalid_game'));
        return;
    }
    ctx.wizard.state.order.game = text;

    const options = await Product.find({ game: text, isActive: true }).sort({ price: 1 });
    if (options.length === 0) {
        await ctx.reply(t(lang, 'no_packages'), Markup.keyboard(getMainMenu(lang)).resize());
        return ctx.scene.leave();
    }

    const buttons = options.map(opt => [`${opt.package} - ${opt.price} so'm`]);
    buttons.push([t(lang, 'btn_back'), t(lang, 'btn_back_main')]);

    await ctx.reply(t(lang, 'ask_amount'), Markup.keyboard(buttons).resize());
    return ctx.wizard.next();
};

const topupStep3 = async (ctx) => {
    const lang = ctx.userLang;
    const text = ctx.message?.text;
    if (!text) return;
    
    if (text === t(lang, 'btn_back_main') || text === '/cancel' || text === '/start') {
        if (text === '/start') {
            await ctx.scene.leave();
            return ctx.start();
        }
        await ctx.reply(t(lang, 'topup_cancelled'), Markup.keyboard(getMainMenu(lang)).resize());
        return ctx.scene.leave();
    }

    if (text === t(lang, 'btn_back')) {
        ctx.wizard.selectStep(0);
        return topupStep1(ctx);
    }

    if (!text || !text.includes(' - ')) {
        return ctx.reply(t(lang, 'invalid_game')); // Packages should be from buttons
    }

    ctx.wizard.state.order.amount_price = text;
    const [amount, price] = text.split(' - ');
    ctx.wizard.state.order.amount = amount;
    ctx.wizard.state.order.price = price;

    await ctx.reply(t(lang, 'ask_player_id', { game: ctx.wizard.state.order.game }), Markup.keyboard([[t(lang, 'btn_back'), t(lang, 'btn_back_main')]]).resize());
    return ctx.wizard.next();
};

const topupStep4 = async (ctx) => {
    const lang = ctx.userLang;
    const text = ctx.message?.text;
    if (!text) return;
    
    if (text === t(lang, 'btn_back_main') || text === '/cancel' || text === '/start') {
        if (text === '/start') {
            await ctx.scene.leave();
            return ctx.start();
        }
        await ctx.reply(t(lang, 'topup_cancelled'), Markup.keyboard(getMainMenu(lang)).resize());
        return ctx.scene.leave();
    }

    if (text === t(lang, 'btn_back')) {
        const game = ctx.wizard.state.order.game;
        const options = await Product.find({ game: game, isActive: true }).sort({ price: 1 });
        const buttons = options.map(opt => [`${opt.package} - ${opt.price} so'm`]);
        buttons.push([t(lang, 'btn_back'), t(lang, 'btn_back_main')]);

        ctx.wizard.selectStep(2); 
        await ctx.reply(t(lang, 'ask_amount'), Markup.keyboard(buttons).resize());
        return; 
    }

    if (!text) return ctx.reply(t(lang, 'provide_text'));
    
    const game = ctx.wizard.state.order.game;
    ctx.wizard.state.order.player_id = text;

    const orderId = 'ORD-' + crypto.randomBytes(4).toString('hex').toUpperCase();
    ctx.wizard.state.order.orderId = orderId;

    try {
        const order = await Order.create({
            order_id: orderId,
            telegram_user_id: ctx.from.id,
            username: ctx.from.username || '',
            game: game,
            player_id: text,
            amount: ctx.wizard.state.order.amount,
            price: ctx.wizard.state.order.price,
            status: 'pending'
        });
        
        // REMOVED redundant notification from here. Only notify on payment.

    } catch (err) {
        console.error("Error creating pending order:", err);
        await ctx.reply(t(lang, 'order_error'));
        return ctx.scene.leave();
    }

    await ctx.reply(t(lang, 'order_summary', { 
        game: game, 
        playerId: text, 
        amount: ctx.wizard.state.order.amount, 
        price: ctx.wizard.state.order.price,
        orderId
    }), Markup.keyboard([[t(lang, 'btn_back'), t(lang, 'btn_back_main')]]).resize());
    return ctx.wizard.next();
};

const topupStep5 = async (ctx) => {
    // Only process messages (expecting photo or text commands)
    if (!ctx.message) return;
    
    const lang = ctx.userLang;
    const text = ctx.message?.text;
    
    if (text === t(lang, 'btn_back_main') || text === '/cancel' || text === '/start') {
        if (text === '/start') {
            await ctx.scene.leave();
            return ctx.start();
        }
        await ctx.reply(t(lang, 'topup_cancelled'), Markup.keyboard(getMainMenu(lang)).resize());
        return ctx.scene.leave();
    }

    if (ctx.message?.text === t(lang, 'btn_back')) {
        ctx.wizard.selectStep(3);
        await ctx.reply(t(lang, 'ask_player_id', { game: ctx.wizard.state.order.game }), Markup.keyboard([[t(lang, 'btn_back'), t(lang, 'btn_back_main')]]).resize());
        return;
    }

    if (!ctx.message?.photo) {
        await ctx.reply(t(lang, 'invalid_photo'));
        return;
    }

    const photoFileId = ctx.message.photo[ctx.message.photo.length - 1].file_id;
    const orderId = ctx.wizard.state.order?.orderId;

    if (!orderId) {
        console.error("Session data lost! Order ID missing for user:", ctx.from.id);
        await ctx.reply(t(lang, 'order_error'), Markup.keyboard(getMainMenu(lang)).resize());
        return ctx.scene.leave();
    }

    try {
        const order = await Order.findOneAndUpdate({ order_id: orderId }, {
            screenshot_file_id: photoFileId,
            status: 'paid'
        }, { new: true });

        await ctx.reply(t(lang, 'order_received', { orderId }), Markup.keyboard(getMainMenu(lang)).resize());
        
        // Notify admins about PAYMENT
        if (order) {
            notifyAdmins(ctx, order, photoFileId);
        }

    } catch (err) {
        console.error("Error finalizing order with screenshot:", err);
        await ctx.reply(t(lang, 'order_error'), Markup.keyboard(getMainMenu(lang)).resize());
    }

    return ctx.scene.leave();
};

// --- Wizard Scene Definition ---
const topupWizard = new Scenes.WizardScene(
    'TOPUP_WIZARD',
    topupStep1,
    topupStep2,
    topupStep3,
    topupStep4,
    topupStep5
);

bot.command('cancel', (ctx) => {
    ctx.scene.leave();
    ctx.reply(t(ctx.userLang, 'topup_cancelled'), Markup.keyboard(getMainMenu(ctx.userLang)).resize());
});

// --- Admin Add Product Scene ---
const addProductWizard = new Scenes.WizardScene(
    'ADD_PRODUCT_WIZARD',
    async (ctx) => {
        ctx.wizard.state.product = {};
        await ctx.reply('🕹 Which game are you adding this product for? (e.g. PUBG Mobile, Free Fire)\nOr click Cancel below.', Markup.keyboard([['❌ Cancel']]).resize());
        return ctx.wizard.next();
    },
    async (ctx) => {
        if(ctx.message?.text === '/cancel' || ctx.message?.text === '❌ Cancel') { ctx.reply('Cancelled.', Markup.keyboard(getAdminMenu()).resize()); return ctx.scene.leave(); }
        ctx.wizard.state.product.game = ctx.message?.text;
        await ctx.reply('📦 What is the package name/amount? (e.g. 60 UC, 100 Diamonds)\nOr click Cancel below.', Markup.keyboard([['❌ Cancel']]).resize());
        return ctx.wizard.next();
    },
    async (ctx) => {
        if(ctx.message?.text === '/cancel' || ctx.message?.text === '❌ Cancel') { ctx.reply('Cancelled.', Markup.keyboard(getAdminMenu()).resize()); return ctx.scene.leave(); }
        ctx.wizard.state.product.package = ctx.message?.text;
        await ctx.reply('💲 What is the price in UZS (so\'m)? (Number only, e.g. 15000)\nOr click Cancel below.', Markup.keyboard([['❌ Cancel']]).resize());
        return ctx.wizard.next();
    },
    async (ctx) => {
        if(ctx.message?.text === '/cancel' || ctx.message?.text === '❌ Cancel') { ctx.reply('Cancelled.', Markup.keyboard(getAdminMenu()).resize()); return ctx.scene.leave(); }
        
        const price = parseFloat(ctx.message?.text);
        if (isNaN(price)) {
            await ctx.reply('Invalid number. Please enter a valid number for the price (e.g. 15000):');
            return;
        }

        ctx.wizard.state.product.price = price;
        
        try {
            await Product.create({
                game: ctx.wizard.state.product.game,
                package: ctx.wizard.state.product.package,
                price: ctx.wizard.state.product.price,
                isActive: true
            });
            await ctx.reply(`✅ Product successfully added!\nGame: ${ctx.wizard.state.product.game}\nPackage: ${ctx.wizard.state.product.package}\nPrice: ${price} so'm`, Markup.keyboard(getAdminMenu()).resize());
        } catch(err) {
            console.error(err);
            await ctx.reply('❌ Error saving product.', Markup.keyboard(getAdminMenu()).resize());
        }
        
        return ctx.scene.leave();
    }
);

const stage = new Scenes.Stage([topupWizard, addProductWizard]);

// Persistent Session Setup
const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/telegram_top_up_botz');
const dbName = process.env.DB_NAME || 'shopbot';
const db = client.db(dbName);
console.log(`Bot Session Store using DB: ${db.databaseName}`);

// Ensure client is connected
client.connect().then(() => console.log('✅ Bot Session MongoDB Client Connected')).catch(err => console.error('❌ Bot Session MongoDB Client Connect Error:', err));

bot.use(mdbSession(db, { collectionName: 'telegraf-sessions' }));
bot.use(stage.middleware());

// --- User Commands ---
bot.start(async (ctx) => {
    console.log("Received /start command from user:", ctx.from.id);
    try {
        // Find existing user
        const user = await User.findOne({ telegram_user_id: ctx.from.id });
        console.log("User lookup result:", user ? "Found" : "Not Found");
        
        // If user already has a language selected, just greet them
        if (user && user.language_code && ['en', 'ru', 'uz'].includes(user.language_code)) {
            await ctx.reply(
                t(user.language_code, 'welcome'),
                Markup.keyboard(getMainMenu(user.language_code)).resize()
            );
        } else {
            // Ask for language selection inline
            await ctx.reply('🌐 Please select your language / Пожалуйста, выберите язык / Iltimos, tilni tanlang:',
                Markup.inlineKeyboard([
                    Markup.button.callback('🇺🇿 O\'zbekcha', 'lang_uz'),
                    Markup.button.callback('🇷🇺 Русский', 'lang_ru'),
                    Markup.button.callback('🇬🇧 English', 'lang_en')
                ])
            );
        }
    } catch (err) {
        console.error("Start Command Error:", err);
    }
});

// Language Select Actions
const handleLangSelection = async (ctx, langStr) => {
    try {
        await ctx.answerCbQuery();
        await User.findOneAndUpdate(
            { telegram_user_id: ctx.from.id },
            { 
                username: ctx.from.username,
                first_name: ctx.from.first_name,
                language_code: langStr
            },
            { upsert: true }
        );
        ctx.userLang = langStr;
        
        // Delete the inline message and send the welcome message
        await ctx.deleteMessage();
        await ctx.reply(
            t(langStr, 'welcome'),
            Markup.keyboard(getMainMenu(langStr)).resize()
        );
    } catch (e) {
        console.error(e);
    }
};

bot.action('lang_en', (ctx) => handleLangSelection(ctx, 'en'));
bot.action('lang_ru', (ctx) => handleLangSelection(ctx, 'ru'));
bot.action('lang_uz', (ctx) => handleLangSelection(ctx, 'uz'));

// Helper for slash command fallback, just in case
bot.command('topup', (ctx) => {
    ctx.scene.enter('TOPUP_WIZARD');
});

// Helper configuration to hear commands in all languages
const getHearsArray = (key) => {
    return [dictionary.en[key], dictionary.ru[key], dictionary.uz[key]];
};

// --- Text Button Handlers ---
bot.hears(getHearsArray('btn_lang'), (ctx) => {
    ctx.reply('🌐 Please select your language / Пожалуйста, выберите язык / Iltimos, tilni tanlang:',
        Markup.inlineKeyboard([
            Markup.button.callback('🇺🇿 O\'zbekcha', 'lang_uz'),
            Markup.button.callback('🇷🇺 Русский', 'lang_ru'),
            Markup.button.callback('🇬🇧 English', 'lang_en')
        ])
    );
});

bot.hears(getHearsArray('btn_topup'), (ctx) => {
    ctx.scene.enter('TOPUP_WIZARD');
});

bot.hears(getHearsArray('btn_back_main'), async (ctx) => {
    try {
        await ctx.scene.leave();
    } catch (e) {}
    const lang = ctx.userLang || 'en';
    await ctx.reply(t(lang, 'welcome'), Markup.keyboard(getMainMenu(lang)).resize());
});

bot.hears(getHearsArray('btn_orders'), async (ctx) => {
    try {
        const lang = ctx.userLang;
        const orders = await Order.find({ telegram_user_id: ctx.from.id }).sort({ created_at: -1 }).limit(5);
        if (orders.length === 0) return ctx.reply(t(lang, 'no_orders'));
        
        let msg = t(lang, 'latest_orders_title');
        orders.forEach(o => {
            const statusLabel = t(lang, `status_${o.status}`);
            msg += t(lang, 'order_item', {
                id: o.order_id,
                status: statusLabel,
                game: o.game,
                amount: o.amount
            });
        });
        await ctx.reply(msg);
    } catch (err) {
        ctx.reply('Error fetching your orders.');
    }
});

bot.hears(getHearsArray('btn_support'), async (ctx) => {
    await ctx.reply(t(ctx.userLang, 'support_text'));
});
// --- Admin Menu Keyboard ---
const getAdminMenu = (lang) => {
    return [
        ['📦 Pending Orders', '🕹 Manage Products'],
        ['📊 Dashboard', t(lang, 'btn_back_main')]
    ];
};

// --- Admin Commands & Interactive Features ---

// Strict isAdmin checking
const isAdmin = (ctx, next) => {
    let adminIds = [];
    if (process.env.ADMIN_IDS) {
        // Parse a comma separated env var string to array of Numbers
        adminIds = process.env.ADMIN_IDS.split(',').map(id => Number(id.trim()));
    }
    
    if (!adminIds.includes(ctx.from.id)) {
        console.warn(`Unauthorized admin attempt by ${ctx.from.id} (@${ctx.from.username})`);
        return ctx.reply('❌ You do not have permission to use admin commands.', Markup.keyboard(getMainMenu(ctx.userLang)).resize());
    }
    console.log(`Admin ${ctx.from.id} authenticated.`);
    return next(); 
};

// Admin Main Menu Trigger
bot.command('admin', isAdmin, (ctx) => {
    ctx.reply('👨‍💻 Welcome to the Admin Panel.\nSelect an action below:', Markup.keyboard(getAdminMenu(ctx.userLang)).resize());
});

bot.hears(getHearsArray('btn_back_main'), (ctx) => {
    ctx.reply(t(ctx.userLang, 'welcome'), Markup.keyboard(getMainMenu(ctx.userLang)).resize());
});

bot.hears('🕹 Manage Products', isAdmin, async (ctx) => {
    // Allows admin to view all products briefly and provides an inline button to start the creation wizard
    try {
        const products = await Product.find().sort({ game: 1 });
        
        if (products.length === 0) {
            return ctx.reply('🕹 **Current Products:**\n\nNo products available.', {
                parse_mode: 'Markdown',
                ...Markup.inlineKeyboard([[Markup.button.callback('➕ Add New Product', 'admin_add_product')]])
            });
        }

        await ctx.reply('🕹 **Current Products:**\nSelect a product to manage or add a new one:', {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard([[Markup.button.callback('➕ Add New Product', 'admin_add_product')]])
        });
        
        for (const p of products) {
            const txt = `• ${p.game}: ${p.package} - ${p.price} so'm [${p.isActive ? 'Active' : 'Inactive'}]`;
            await ctx.reply(txt, Markup.inlineKeyboard([
                [Markup.button.callback(`🗑 Delete ${p.package}`, `delete_prod_${p._id}`)]
            ]));
        }

    } catch (err) {
        ctx.reply('Error fetching products.');
    }
});

bot.action(/delete_prod_(.+)/, isAdmin, async (ctx) => {
    const prodId = ctx.match[1];
    try {
        const product = await Product.findByIdAndDelete(prodId);
        if (!product) return ctx.answerCbQuery('Product not found.', { show_alert: true });
        
        await ctx.answerCbQuery('Product deleted!');
        await ctx.deleteMessage();
        await ctx.reply(`✅ Product deleted: ${product.game} - ${product.package}`);
    } catch (err) {
        console.error(err);
        ctx.answerCbQuery('Error deleting product.');
    }
});

// Admin Dashboard stats
bot.hears('📊 Dashboard', isAdmin, async (ctx) => {
    try {
        const totalOrders = await Order.countDocuments();
        const pendingOrders = await Order.countDocuments({ status: 'pending' });
        const paidOrders = await Order.countDocuments({ status: 'paid' });
        const completedOrdersCount = await Order.countDocuments({ status: 'completed' });
        const totalUsers = await User.countDocuments();
        
        // Month stats
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0,0,0,0);
        
        const monthlyOrders = await Order.find({ 
            status: 'completed', 
            created_at: { $gte: startOfMonth } 
        });
        
        let monthlyRevenue = 0;
        monthlyOrders.forEach(o => {
            const num = parseFloat(o.price.replace(/[^0-9.-]+/g,""));
            if(!isNaN(num)) monthlyRevenue += num;
        });

        // Top Products
        const topProducts = await Order.aggregate([
            { $match: { status: 'completed' } },
            { $group: { _index: { game: "$game", amount: "$amount" }, count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 3 }
        ]);

        let topProductsTxt = '';
        topProducts.forEach((p, i) => {
            topProductsTxt += `${i+1}. ${p._index.game} (${p._index.amount}) — ${p.count} keys\n`;
        });

        const txt = `<b>📊 Admin Dashboard</b>\n\n` +
                    `👥 <b>Total Users:</b> ${totalUsers}\n` +
                    `📦 <b>Total Orders:</b> ${totalOrders}\n` +
                    `⏳ <b>Pending (Unpaid):</b> ${pendingOrders}\n` +
                    `💳 <b>Paid (To Process):</b> ${paidOrders}\n` +
                    `✅ <b>Completed:</b> ${completedOrdersCount}\n\n` +
                    `💰 <b>Current Month Revenue:</b> ${monthlyRevenue.toLocaleString()} so'm\n\n` +
                    `🔥 <b>Top Products:</b>\n${topProductsTxt || 'No orders yet.'}`;
        
        await ctx.replyWithHTML(txt);
    } catch (err) {
        console.error(err);
        ctx.reply('Error fetching dashboard stats.');
    }
});

bot.action('admin_add_product', isAdmin, async (ctx) => {
    await ctx.answerCbQuery();
    ctx.scene.enter('ADD_PRODUCT_WIZARD');
});

// Pending Orders Interactive
bot.hears('📦 Pending Orders', isAdmin, async (ctx) => {
    try {
        console.log(`Admin ${ctx.from.id} requested pending orders.`);
        // Show BOTH paid (to process) and pending (unpaid) to give admin full view
        const orders = await Order.find({ status: { $in: ['paid', 'pending'] } }).sort({ created_at: -1 }).limit(20);
        
        console.log(`Found ${orders.length} orders for admin review.`);
        
        if (orders.length === 0) {
            return ctx.reply('✅ There are no pending or paid orders!', Markup.keyboard(getAdminMenu(ctx.userLang)).resize());
        }
        
        await ctx.reply(`Found ${orders.length} recent pending/paid orders:`, Markup.keyboard(getAdminMenu(ctx.userLang)).resize());

        for (const o of orders) {
            try {
                // Fix: Sanitize content and use HTML for admin reviews to avoid Markdown parsing bugs
                let msg = `📦 <b>Order ID</b>: <code>${o.order_id}</code>\n` +
                          `🚦 <b>Status</b>: ${o.status.toUpperCase()}\n` +
                          `🕹 <b>Game</b>: ${o.game}\n` +
                          `🆔 <b>Player</b>: <code>${o.player_id}</code>\n` +
                          `💰 <b>Package</b>: ${o.amount}\n` +
                          `💲 <b>Price</b>: ${o.price}\n` +
                          `👤 <b>User</b>: @${o.username || o.telegram_user_id}`;
                
                if (o.status === 'paid' && o.screenshot_file_id) {
                    await ctx.replyWithPhoto(o.screenshot_file_id, { 
                        caption: msg,
                        parse_mode: 'HTML',
                        ...Markup.inlineKeyboard([
                            [Markup.button.callback('✅ Complete', `approve_${o.order_id}`)],
                            [Markup.button.callback('❌ Reject', `reject_${o.order_id}`)]
                        ])
                    });
                } else {
                    await ctx.reply(msg + "\n\n<i>(Waiting for screenshot)</i>", { parse_mode: 'HTML' });
                }
            } catch (itemErr) {
                console.error(`Error rendering order ${o.order_id}:`, itemErr);
                await ctx.reply(`❌ Error displaying order ${o.order_id}. Skipping...`);
            }
        }
    } catch (err) {
         console.error('CRITICAL: Pending Orders command failed:', err);
         ctx.reply('Error fetching pending orders. Please check logs.');
    }
});

// Interactive Handlers for Approval/Rejection
bot.action(/approve_(.+)/, isAdmin, async (ctx) => {
    const orderId = ctx.match[1];
    try {
        const order = await Order.findOneAndUpdate({ order_id: orderId }, { status: 'completed' });
        if (!order) return ctx.answerCbQuery('Order not found or already processed.', { show_alert: true });
        
        await ctx.answerCbQuery('Order Completed!');
        await ctx.editMessageCaption(`✅ <b>ORDER COMPLETED</b>\n\nOrder ID: <code>${orderId}</code>\nGame: ${order.game}\nPlayer: <code>${order.player_id}</code>`, { parse_mode: 'HTML' });
        
        // Notify user
        try {
            const targetUser = await User.findOne({ telegram_user_id: order.telegram_user_id });
            const targetLang = targetUser?.language_code || 'en';
            await ctx.telegram.sendMessage(order.telegram_user_id, t(targetLang, 'order_completed', { orderId }));
        } catch (e) {
            console.error('Failed to notify user:', e);
        }
    } catch (err) {
        console.error(err);
        ctx.answerCbQuery('Error processing request.');
    }
});

bot.action(/reject_(.+)/, isAdmin, async (ctx) => {
    const orderId = ctx.match[1];
    try {
        const order = await Order.findOneAndUpdate({ order_id: orderId }, { status: 'rejected' });
        if (!order) return ctx.answerCbQuery('Order not found or already processed.', { show_alert: true });
        
        await ctx.answerCbQuery('Order Rejected!');
        await ctx.editMessageCaption(`❌ <b>ORDER REJECTED</b>\n\nOrder ID: <code>${orderId}</code>\nGame: ${order.game}\nPlayer: <code>${order.player_id}</code>`, { parse_mode: 'HTML' });
        
        // Notify user
        try {
            const targetUser = await User.findOne({ telegram_user_id: order.telegram_user_id });
            const targetLang = targetUser?.language_code || 'en';
            await ctx.telegram.sendMessage(order.telegram_user_id, t(targetLang, 'order_rejected', { orderId }));
        } catch (e) {
            console.error('Failed to notify user:', e);
        }
    } catch (err) {
        console.error(err);
        ctx.answerCbQuery('Error processing request.');
    }
});

module.exports = bot;
