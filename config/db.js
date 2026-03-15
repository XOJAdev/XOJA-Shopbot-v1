const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host} (DB: ${conn.connection.name})`);
  } catch (err) {
    console.error(`Error connecting to MongoDB: ${err.message}`);
    // We don't exit here, allowing the app to potentially retry or stay alive for recovery
    throw err;
  }
};

module.exports = connectDB;
