// api/telegram/webhook.js
// Vercel serverless function — Telegram sends every update here via webhook.

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const API_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;

// ============================================================
//  EDIT YOUR TEXTS HERE — this is the only part you need to touch
// ============================================================
const TEXTS = {
  welcome: `👋 Welcome to *HyperQuant*!

I help you set up and manage automated trading bots on Hyperliquid.

Use the buttons below to get started 👇`,

  subscription: `💳 *Subscription Plans*

- *FREE* — 0.01% builder fee — 3 bots (Grid, DCA, Webhook/Signal, Combo)
- *DEMO* — 0.03% builder fee — 7-day trial of our flagship Quant Bot, running 3 built-in trading systems
- *Pro* — $65/mo — no builder fee — up to 10 bots, MVP Quant Bot engineered for steady, risk-managed performance
- *Unlimited* — $300/6mo — unlimited bots, MVP Quant Bot, priority support

Payments are coming soon — for now, message us here to reserve a plan.`,

  faq: `❓ *FAQ*

*What bots do you offer?*
Classic DCA, Grid and Combo bots — with the option to add indicators, signals and webhooks. Flexible trailing is supported too, including per-level trailing inside the Grid bot.

*Do you have access to my funds?*
No. You only create a trading *agent* on Hyperliquid and connect its API so our bots can trade on your behalf. We never hold your funds or private keys. A trading agent can't withdraw or transfer your funds — this is documented in Hyperliquid's own docs.

*What is the 0.01% builder fee?*
It's our service fee on top of Hyperliquid's own exchange fee (0.015%). It only applies on the FREE plan. The DEMO plan carries a separate 0.03% fee for trading with the Quant Bot.

*What is Quant Bot?*
Our proprietary bot, currently in its final testing stage. It combines 3 different market-analysis systems. As our flagship product, it deserves a deeper explanation — a dedicated guide is on the way, but feel free to ask us here in the meantime.

*How do I get started?*
Tap "🚀 Setup Guide" below.`,

  setup: `🚀 *Setup Guide*

1️⃣ Open our website: https://your-domain.com
2️⃣ Connect your wallet (e.g. MetaMask)
3️⃣ Create a trading *agent* — a limited-permission key that lets our bots trade for you, without custody of your funds
4️⃣ Come back here and pick a subscription plan to activate your bot

Stuck? Just send us a message here.`,

  unknown: `I didn't understand that 🤔 Use /start to open the menu.`,
};
// ============================================================

const MAIN_MENU = {
  inline_keyboard: [
    [{ text: '💳 Subscription', callback_data: 'menu_subscription' }],
    [{ text: '❓ FAQ', callback_data: 'menu_faq' }],
    [{ text: '🚀 Setup Guide', callback_data: 'menu_setup' }],
  ],
};

const BACK_MENU = {
  inline_keyboard: [[{ text: '⬅️ Back to menu', callback_data: 'menu_main' }]],
};

async function callTelegram(method, payload) {
  const res = await fetch(`${API_URL}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.json();
}

const sendMessage = (chatId, text, keyboard) =>
  callTelegram('sendMessage', {
    chat_id: chatId,
    text,
    parse_mode: 'Markdown',
    reply_markup: keyboard,
  });

const editMessage = (chatId, messageId, text, keyboard) =>
  callTelegram('editMessageText', {
    chat_id: chatId,
    message_id: messageId,
    text,
    parse_mode: 'Markdown',
    reply_markup: keyboard,
  });

const answerCallback = (callbackQueryId) =>
  callTelegram('answerCallbackQuery', { callback_query_id: callbackQueryId });

module.exports = async (req, res) => {
  // Quick browser check — Telegram only ever sends POST
  if (req.method !== 'POST') {
    res.status(200).send('Bot webhook is running ✅');
    return;
  }

  const update = req.body;

  try {
    // --- Regular text messages, e.g. /start ---
    if (update.message) {
      const chatId = update.message.chat.id;
      const text = update.message.text || '';

      if (text === '/start' || text === '/menu') {
        await sendMessage(chatId, TEXTS.welcome, MAIN_MENU);
      } else {
        await sendMessage(chatId, TEXTS.unknown, MAIN_MENU);
      }
    }

    // --- Button presses ---
    if (update.callback_query) {
      const cq = update.callback_query;
      const chatId = cq.message.chat.id;
      const messageId = cq.message.message_id;

      await answerCallback(cq.id); // stops the button's loading spinner

      switch (cq.data) {
        case 'menu_main':
          await editMessage(chatId, messageId, TEXTS.welcome, MAIN_MENU);
          break;
        case 'menu_subscription':
          await editMessage(chatId, messageId, TEXTS.subscription, BACK_MENU);
          break;
        case 'menu_faq':
          await editMessage(chatId, messageId, TEXTS.faq, BACK_MENU);
          break;
        case 'menu_setup':
          await editMessage(chatId, messageId, TEXTS.setup, BACK_MENU);
          break;
      }
    }

    res.status(200).send('OK');
  } catch (err) {
    console.error(err);
    res.status(200).send('OK'); // always 200, so Telegram doesn't retry forever
  }
};
