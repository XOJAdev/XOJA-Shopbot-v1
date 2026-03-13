const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');

// Dashboard overview
exports.getDashboard = async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    const pendingOrders = await Order.countDocuments({ status: 'pending' });
    const completedOrdersCount = await Order.countDocuments({ status: 'completed' });
    const totalUsers = await User.countDocuments();
    
    // Today's statistics
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayOrders = await Order.countDocuments({ created_at: { $gte: today } });
    const todayCompletedOrders = await Order.find({ status: 'completed', created_at: { $gte: today } });
    
    let todayRevenue = 0;
    todayCompletedOrders.forEach(o => {
        const num = parseFloat(o.price.replace(/[^0-9.-]+/g,""));
        if(!isNaN(num)) todayRevenue += num;
    });

    // Calculate total revenue from all completed orders
    const completedOrders = await Order.find({ status: 'completed' });
    let totalRevenue = 0;
    completedOrders.forEach(o => {
        const num = parseFloat(o.price.replace(/[^0-9.-]+/g,""));
        if(!isNaN(num)) totalRevenue += num;
    });

    res.render('dashboard', { 
        totalOrders, 
        pendingOrders, 
        completedOrders: completedOrdersCount, 
        totalRevenue,
        totalUsers,
        todayOrders,
        todayRevenue
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
};

// List orders
exports.getOrders = async (req, res) => {
  try {
    const statusFilter = req.query.status;
    let query = {};
    if (statusFilter && ['pending', 'completed', 'rejected'].includes(statusFilter)) {
      query.status = statusFilter;
    }

    const orders = await Order.find(query).sort({ created_at: -1 });
    res.render('orders', { orders, currentFilter: statusFilter || 'all' });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
};

// Update order status (used by API from frontend or form submission)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    if (!['pending', 'completed', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const order = await Order.findOneAndUpdate(
      { order_id: orderId },
      { status },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    
    // We send a success response indicating UI update. 
    // The Telegram bot will handle sending messages to users separately when admin uses bot,
    // OR we trigger bot message here if needed. 
    // If bot instance is available globally via app.locals, we can do it:
    if (status === 'completed' && req.app.locals.bot) {
      try {
        await req.app.locals.bot.telegram.sendMessage(
          order.telegram_user_id,
          `✅ Your top-up order (ID: ${order.order_id}) has been completed!`
        );
      } catch (err) {
        console.error('Failed to notify user via Telegram:', err);
      }
    } else if (status === 'rejected' && req.app.locals.bot) {
      try {
        await req.app.locals.bot.telegram.sendMessage(
          order.telegram_user_id,
          `❌ Your top-up order (ID: ${order.order_id}) has been rejected. Please contact admin.`
        );
      } catch (err) {
        console.error('Failed to notify user via Telegram:', err);
      }
    }

    res.redirect('/orders');

  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
};

// --- Product Management ---

exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find().sort({ game: 1, price: 1 });
    res.render('products', { products });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
};

exports.addProduct = async (req, res) => {
  try {
    const { game, package: pkgName, price } = req.body;
    await Product.create({
      game,
      package: pkgName,
      price: parseFloat(price)
    });
    res.redirect('/products');
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.redirect('/products');
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
};

// --- Screenshot Viewer ---
exports.viewScreenshot = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findOne({ order_id: orderId });
    if (!order || !order.screenshot_file_id) {
        return res.status(404).send('Screenshot not found');
    }

    if (!req.app.locals.bot) {
        return res.status(500).send('Bot instance not available');
    }

    // Use Telegraf built-in getFileLink to get temporary direct download URL from Telegram API
    const fileUrl = await req.app.locals.bot.telegram.getFileLink(order.screenshot_file_id);
    
    // Redirect admin browser directly to the Telegram image URL
    res.redirect(fileUrl.href);

  } catch (error) {
    console.error('Error fetching screenshot:', error);
    res.status(500).send('Error fetching screenshot from Telegram');
  }
};
