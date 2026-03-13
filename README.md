# 🎮 XOJA Shopbot - Telegram Top-Up Bot

**XOJA Shopbot** is a premium, manual game top-up service that streamlines the process of purchasing in-game currency. It features a fully internationalized Telegram Bot for users and a comprehensive Web Admin Panel plus a Telegram Admin Menu for administrators.

## 🚀 Key Features

### 🤖 Telegram Bot (User Side)
- **🌍 Multilingual Support**: 100% localized in **Uzbek (uz)**, **Russian (ru)**, and **English (en)**.
- **✨ Premium UI**: Sleek buttons, emojis, and clear instructions for a high-end experience.
- **🛠 Smart Ordering**:
  1. Select a game (PUBG Mobile, Mobile Legends, Free Fire, etc.).
  2. Provide Player ID.
  3. Choose a top-up package.
  4. Secure payment via bank transfer (Uzcard/Humo).
  5. Upload payment screenshot for verification.
- **📦 Internationalized Order History**: View the latest 5 orders with localized status labels (⏳ pending, ✅ completed, ❌ rejected).
- **💬 Dynamic Notifications**: Users receive status updates in their selected language.
- **📞 Integrated Support**: Quick access to support via Telegram (@xojaorg) and Phone (+998 95 093 97 17).

### 🌐 Web Admin Panel
- **📊 Real-time Dashboard**: Track Total Orders, Pending, Completed, Total Users, and Revenue.
- **📦 Order Management**:
  - View full order details and user information.
  - **📸 Screenshot Viewer**: Verify payments directly in the browser.
  - One-click Approve/Reject with instant user notification.
- **🕹 Product Management**: Dynamic creation and management of game packages.
- **🔒 Secure Access**: Session-based authentication for authorized admins.

### 🛠 Telegram Admin Menu
- **🔔 Real-time Notifications**: Admins receive instant localized alerts for every new order, including the payment screenshot.
- **📲 Mobile Management**: Approve or reject orders directly within Telegram.
- **💎 Quick Product Management**: Add or delete game packages on the go.
- **📈 Live Stats**: Access dashboard metrics via simple commands.

## 🛠 Tech Stack
- **Backend**: Node.js, Express.js
- **Bot Framework**: Telegraf (Telegram Bot API)
- **Database**: MongoDB (Mongoose ORM)
- **Frontend**: EJS (Template Engine), Vanilla CSS
- **Authentication**: Express Session

## 📦 Project Structure
- `/bot`: Core bot logic, wizards, and internationalization (`i18n.js`).
- `/controllers`: Logic for orders, products, and admin authentication.
- `/models`: MongoDB schemas (User, Order, Product, Admin).
- `/routes`: Web routing for the admin panel.
- `/views`: Premium EJS templates for the dashboard.
- `/config`: Database connection setup.

## ⚙️ Setup & Installation

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v14+)
- [MongoDB](https://www.mongodb.com/) (Local or Atlas)
- Telegram Bot Token from [@BotFather](https://t.me/BotFather)

### 2. Installation
```bash
git clone <repository-url>
cd telegram-top-up-bot
npm install
```

### 3. Configuration
Create a `.env` file in the root directory (using `.env.example` as a template):
```env
BOT_TOKEN=your_telegram_bot_token_here
MONGODB_URI=your_mongodb_connection_string
PORT=3000
SESSION_SECRET=your_secure_session_secret
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_admin_password
ADMIN_IDS=12345678,87654321 # Telegram IDs allowed to use admin commands and receive alerts
```

### 4. Running the Project
```bash
# Start both the web server and the bot
npm start
```
The web dashboard will be available at `http://localhost:3000`.

## 🚢 Deployment (VPS - Ubuntu/Debian)
1. **Manage with PM2**: `sudo npm install -g pm2`
2. **Start App**: `pm2 start server.js --name "xoja-shopbot"`
3. **Setup Nginx**: (Optional) Use Nginx as a reverse proxy for SSL and domain access.

## 📄 License
This project is licensed under the ISC License.
