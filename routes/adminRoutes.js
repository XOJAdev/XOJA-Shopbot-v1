const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const orderController = require('../controllers/orderController');

// Auth routes
router.get('/login', authController.getLogin);
router.post('/login', authController.postLogin);
router.get('/logout', authController.logout);

// Dashboard
router.get('/', (req, res) => res.redirect('/dashboard'));
router.get('/dashboard', authController.ensureAuthenticated, orderController.getDashboard);

// Orders
router.get('/orders', authController.ensureAuthenticated, orderController.getOrders);
router.post('/orders/:orderId/status', authController.ensureAuthenticated, orderController.updateOrderStatus);
router.get('/orders/:orderId/screenshot', authController.ensureAuthenticated, orderController.viewScreenshot);

// Products
router.get('/products', authController.ensureAuthenticated, orderController.getProducts);
router.post('/products/add', authController.ensureAuthenticated, orderController.addProduct);
router.post('/products/:id/delete', authController.ensureAuthenticated, orderController.deleteProduct);

module.exports = router;
