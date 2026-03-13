const dictionary = {
    // English
    en: {
        welcome: '👋 Welcome to *XOJA Shopbot*!\n\nHere you can quickly and safely top up your favorite games. Choose an option below to continue.',
        btn_topup: '🎮 Top Up Game',
        btn_orders: '📦 My Orders',
        btn_support: '💬 Support',
        btn_lang: '🌐 Change Language',
        btn_cancel: '❌ Cancel',
        btn_back_main: '🏠 Back to Main Menu',
        select_game: '🎯 Please choose the game you want to top up:',
        no_games: '⚠️ Currently there are no games available for top-up. Please try again later.',
        topup_cancelled: '❌ Top-up process cancelled.',
        invalid_game: '⚠️ Please select a valid game using the buttons.',
        ask_player_id: '🎮 Game selected: *{game}*\n\nPlease enter your *Player ID* to continue.',
        provide_text: '⚠️ Please send your Player ID as text.',
        no_packages: '⚠️ No top-up packages are available for this game right now.',
        ask_amount: '💎 Please select the amount you want to top up:',
        order_summary: '🧾 *Order Summary*\n\n🎮 Game: {game}\n🆔 Player ID: {playerId}\n💎 Package: {amount}\n💰 Price: {price}\n\n💳 Please transfer *{price}* to the following bank account:\n\n👤 Owner: *Karimxoja Azimxojayev*\n🔢 Card: `9860 3501 4574 4735`\n\nAfter payment, send the *payment screenshot* here so XOJA Shopbot can process your order.',
        invalid_photo: '⚠️ Please send a valid payment screenshot.',
        order_received: '✅ *Order received!*\n\n🆔 Order ID: {orderId}\n⏳ XOJA Shopbot team will verify your payment and process your top-up shortly.',
        order_error: '❌ An error occurred while processing your order. Please try again later.',
        no_orders: '📭 You don’t have any recent orders yet.',
        latest_orders_title: '📦 Your latest 5 orders:\n\n',
        support_text: '💬 Need help?\n\nContact XOJA Shopbot support:\n👤 Telegram: @xojaorg\n📞 Phone: +998 95 093 97 17',
        order_completed: '✅ Your top-up has been completed! (Order ID: {orderId})',
        order_rejected: '❌ Your top-up order was rejected. Please contact support. (Order ID: {orderId})',
        admin_new_order_notif: '🔔 **New Order Received!**\n\n📦 **Order ID**: {orderId}\n🕹 **Game**: {game}\n🆔 **Player**: {playerId}\n💰 **Package**: {amount}\n💲 **Price**: {price}\n👤 **User**: @{username} (ID: {userId})',
        status_pending: 'pending ⏳',
        status_paid: 'paid 💳',
        status_completed: 'completed ✅',
        status_rejected: 'rejected ❌',
        order_item: 'ID: {id} | Status: {status}\nGame: {game} | Amount: {amount}\n\n'
    },

    // Russian
    ru: {
        welcome: '👋 Добро пожаловать в *XOJA Shopbot*!\n\nЗдесь вы можете быстро и безопасно пополнить свои любимые игры.\n\nВыберите действие ниже:',
        btn_topup: '🎮 Пополнить игру',
        btn_orders: '📦 Мои заказы',
        btn_support: '💬 Поддержка',
        btn_lang: '🌐 Сменить язык',
        btn_cancel: '❌ Отмена',
        btn_back_main: '🏠 В главное меню',
        select_game: '🎯 Пожалуйста, выберите игру для пополнения:',
        no_games: '⚠️ Сейчас нет доступных игр для пополнения.',
        topup_cancelled: '❌ Пополнение отменено.',
        invalid_game: '⚠️ Пожалуйста, выберите игру с помощью кнопок.',
        ask_player_id: '🎮 Вы выбрали игру: *{game}*\n\nПожалуйста, отправьте ваш *Player ID*.',
        provide_text: '⚠️ Пожалуйста, отправьте Player ID текстом.',
        no_packages: '⚠️ Для этой игры сейчас нет доступных пакетов.',
        ask_amount: '💎 Пожалуйста, выберите сумму пополнения:',
        order_summary: '🧾 *Детали заказа*\n\n🎮 Игра: {game}\n🆔 Player ID: {playerId}\n💎 Пакет: {amount}\n💰 Цена: {price}\n\n💳 Пожалуйста, переведите *{price}* на банковский счет:\n\n👤 Владелец: *Karimxoja Azimxojayev*\n🔢 Карта: `9860 3501 4574 4735`\n\nПосле оплаты отправьте *скриншот платежа*, чтобы XOJA Shopbot обработал ваш заказ.',
        invalid_photo: '⚠️ Пожалуйста, отправьте действительный скриншот оплаты.',
        order_received: '✅ *Заказ принят!*\n\n🆔 ID заказа: {orderId}\n⏳ Команда XOJA Shopbot скоро проверит оплату и выполнит пополнение.',
        order_error: '❌ Произошла ошибка при обработке заказа. Попробуйте позже.',
        no_orders: '📭 У вас пока нет заказов.',
        latest_orders_title: '📦 Ваши последние 5 заказов:\n\n',
        support_text: '💬 Нужна помощь?\n\nСвяжитесь с поддержкой XOJA Shopbot:\n👤 Telegram: @xojaorg\n📞 Тел: +998 95 093 97 17',
        order_completed: '✅ Ваше пополнение успешно завершено! (ID заказа: {orderId})',
        order_rejected: '❌ Ваш заказ на пополнение был отклонен. Пожалуйста, свяжитесь с поддержкой. (ID заказа: {orderId})',
        admin_new_order_notif: '🔔 **Получен новый заказ!**\n\n📦 **ID заказа**: {orderId}\n🕹 **Игра**: {game}\n🆔 **Игрок**: {playerId}\n💰 **Пакет**: {amount}\n💲 **Цена**: {price}\n👤 **Пользователь**: @{username} (ID: {userId})',
        status_pending: 'в ожидании ⏳',
        status_paid: 'оплачен 💳',
        status_completed: 'выполнен ✅',
        status_rejected: 'отклонен ❌',
        order_item: 'ID: {id} | Статус: {status}\nИгра: {game} | Сумма: {amount}\n\n'
    },

    // Uzbek
    uz: {
        welcome: '👋 *XOJA Shopbot* ga xush kelibsiz!\n\nBu yerda siz sevimli o‘yinlaringiz uchun donatni tez va xavfsiz tarzda amalga oshirishingiz mumkin.\n\nDavom etish uchun quyidagi menyudan tanlang:',
        btn_topup: '🎮 Donat qilish',
        btn_orders: '📦 Buyurtmalarim',
        btn_support: '💬 Yordam',
        btn_lang: '🌐 Tilni o‘zgartirish',
        btn_cancel: '❌ Bekor qilish',
        btn_back_main: '🏠 Asosiy menyuga qaytish',
        select_game: '🎯 Donat qilmoqchi bo‘lgan o‘yinni tanlang:',
        no_games: '⚠️ Hozircha donat qilish uchun o‘yinlar mavjud emas.',
        topup_cancelled: '❌ Donat jarayoni bekor qilindi.',
        invalid_game: '⚠️ Iltimos, tugmalar orqali to‘g‘ri o‘yinni tanlang.',
        ask_player_id: '🎮 Tanlangan o‘yin: *{game}*\n\nIltimos, o‘yin ichidagi *Player ID* raqamingizni yuboring.',
        provide_text: '⚠️ Iltimos, Player ID ni matn ko‘rinishida yuboring.',
        no_packages: '⚠️ Ushbu o‘yin uchun hozircha donat paketlari mavjud emas.',
        ask_amount: '💎 Donat miqdorini tanlang:',
        order_summary: '🧾 *Buyurtma ma’lumotlari*\n\n🎮 O‘yin: {game}\n🆔 Player ID: {playerId}\n💎 Paket: {amount}\n💰 Narxi: {price}\n\n💳 Iltimos, *{price}* ni quyidagi bank hisobiga o‘tkazing:\n\n👤 Egasi: *Karimxoja Azimxojayev*\n🔢 Karta: `9860 3501 4574 4735`\n\nTo‘lovni amalga oshirgach, *to‘lov skrinshotini* shu yerga yuboring. XOJA Shopbot buyurtmangizni tekshiradi.',
        invalid_photo: '⚠️ Iltimos, to‘lov skrinshotini rasm ko‘rinishida yuboring.',
        order_received: '✅ *Buyurtmangiz qabul qilindi!*\n\n🆔 Buyurtma ID: {orderId}\n⏳ XOJA Shopbot jamoasi to‘lovni tekshiradi va donat tez orada amalga oshiriladi.',
        order_error: '❌ Buyurtmani qayta ishlashda xatolik yuz berdi. Iltimos, keyinroq qayta urinib ko‘ring.',
        no_orders: '📭 Sizda hozircha buyurtmalar mavjud emas.',
        latest_orders_title: '📦 Oxirgi 5 ta buyurtmangiz:\n\n',
        support_text: '💬 Yordam kerakmi?\n\nXOJA Shopbot yordam xizmati bilan bog‘laning:\n👤 Telegram: @xojaorg\n📞 Tel: +998 95 093 97 17',
        order_completed: '✅ Hisobingizni to‘ldirish muvaffaqiyatli yakunlandi! (Buyurtma ID: {orderId})',
        order_rejected: '❌ Sizning buyurtmangiz rad etildi. Iltimos, qo‘llab-quvvatlash xizmati bilan bog‘laning. (Buyurtma ID: {orderId})',
        admin_new_order_notif: '🔔 **Yangi buyurtma qabul qilindi!**\n\n📦 **Buyurtma ID**: {orderId}\n🕹 **O‘yin**: {game}\n🆔 **Player**: {playerId}\n💎 **Paket**: {amount}\n💰 **Narxi**: {price}\n👤 **Foydalanuvchi**: @{username} (ID: {userId})',
        status_pending: 'kutilmoqda ⏳',
        status_paid: "to'langan 💳",
        status_completed: 'yakunlandi ✅',
        status_rejected: 'rad etildi ❌',
        order_item: 'ID: {id} | Holati: {status}\nO‘yin: {game} | Miqdor: {amount}\n\n'
    }
};

const t = (lang, key, params = {}) => {
    // defaults to English if not found
    let text = dictionary[lang] && dictionary[lang][key] ? dictionary[lang][key] : dictionary['en'][key];
    if (!text) return key;

    // Replace params like {game} with actual values
    for (const [k, v] of Object.entries(params)) {
        text = text.replace(new RegExp(`{${k}}`, 'g'), v);
    }
    return text;
};

// Returns keyboard depending on language
const getMainMenu = (lang) => {
    return [
        [{ text: t(lang, 'btn_topup') }],
        [{ text: t(lang, 'btn_orders') }, { text: t(lang, 'btn_support') }],
        [{ text: t(lang, 'btn_lang') }]
    ];
};

module.exports = { t, getMainMenu, dictionary };
