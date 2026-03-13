const Admin = require('../models/Admin');

exports.getLogin = (req, res) => {
  if (req.session.isAdmin) {
    return res.redirect('/dashboard');
  }
  res.render('login', { error: null });
};

exports.postLogin = async (req, res) => {
  const { username, password } = req.body;
  
  // Real app: search DB and compare hashed password.
  // For simplicity based on .env config:
  if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
    req.session.isAdmin = true;
    res.redirect('/dashboard');
  } else {
    res.render('login', { error: 'Invalid credentials' });
  }
};

exports.logout = (req, res) => {
  req.session.destroy();
  res.redirect('/login');
};

exports.ensureAuthenticated = (req, res, next) => {
  if (req.session.isAdmin) {
    return next();
  }
  res.redirect('/login');
};
