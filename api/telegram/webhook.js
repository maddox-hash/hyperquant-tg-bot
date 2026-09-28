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
- *Free* — 0.01% builder fee — 3 bots (Grid, DCA, Webhook/Signal, Combo)
- *Demo* — 0.03% builder fee — 7-day trial of our Quant Bot, running 3 built-in trading systems
- *PRO* — $65/mo — no builder fee — up to 10 bots, 3 Quant Bots engineered for steady, risk-managed performance
- *Unlimited* — $300/6mo — up to 20 bots, 5 Quant Bots, priority support
Payments are coming soon — for now, message us here to reserve a plan.`,

  // FAQ overview — only questions are shown
  faq: `❓ *FAQ*
Tap a question below to see the answer:`,

  // Individual FAQ answers
  faq_bots: `*What bots do you offer?*
Classic DCA, Grid and Combo bots — with the option to add indicators, signals and webhooks. Flexible trailing is supported too, including per-level trailing inside the Grid bot.

A *Custom Bot* is also in development — it will offer the most flexible settings.`,

  faq_funds: `*Do you have access to my funds?*
No. You only create a trading *agent* on Hyperliquid and connect its API so our bots can trade on your behalf. We never hold your funds or private keys. A trading agent can't withdraw or transfer your funds — this is documented in Hyperliquid's own docs.`,

  faq_fee: `*What is the 0.01% builder fee?*
It's our service fee on top of Hyperliquid's own exchange fee (0.015%). It only applies on the FREE plan. The DEMO plan carries a separate 0.03% fee for trading with the Quant Bot.`,

  faq_quant: `*What is Quant Bot?*
Our proprietary bot, currently in its final testing stage. It combines 3 different market-analysis systems. As our flagship product, it deserves a deeper explanation — a dedicated guide is on the way, but feel free to ask us here in the meantime.`,

  faq_start: `*How do I get started?*
Tap "🚀 Setup Guide" below or use the main menu.`,

  setup: `🚀 *Setup Guide*
1️⃣ Open our website through your wallet's built-in browser: [hyper-quantbot.vercel.app](https://hyper-quantbot.vercel.app/)
2️⃣ Connect your wallet (e.g. MetaMask or Rabby)
3️⃣ Create a trading *agent* — a limited-permission key that lets our bots trade for you, without custody of your funds
4️⃣ Approve the builder fee if you don’t have a paid subscription (0.01%, 0.03% for the Quant Bot on DEMO)
5️⃣ Choose your bot type (Grid / DCA / Combo / Quant) and configure it. Maximum leverage is limited to 3× for safety reasons
6️⃣ Launch the bot and start earning according to your strategy!

⚠️ *Note:* The MVP Quant Bot doesn't have flexible settings yet — it runs on built-in algorithms.
⚠️ *Note:* Backtesting is currently under development — always follow proper risk management.`,

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

const FAQ_MENU = {
  inline_keyboard: [
    [{ text: 'What bots do you offer?', callback_data: 'faq_bots' }],
    [{ text: 'Do you have access to my funds?', callback_data: 'faq_funds' }],
    [{ text: 'What is the 0.01% builder fee?', callback_data: 'faq_fee' }],
    [{ text: 'What is Quant Bot?', callback_data: 'faq_quant' }],
    [{ text: 'How do I get started?', callback_data: 'faq_start' }],
    [{ text: '⬅️ Back to menu', callback_data: 'menu_main' }],
  ],
};

const FAQ_BACK = {
  inline_keyboard: [
    [{ text: '⬅️ Back to FAQ', callback_data: 'menu_faq' }],
    [{ text: '🏠 Main menu', callback_data: 'menu_main' }],
  ],
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

const sendPhoto = (chatId, photoUrl, caption, keyboard) =>
  callTelegram('sendPhoto', {
    chat_id: chatId,
    photo: photoUrl,
    caption,
    parse_mode: 'Markdown',
    reply_markup: keyboard,
  });

const sendAnimation = (chatId, animationUrl, caption, keyboard) =>
  callTelegram('sendAnimation', {
    chat_id: chatId,
    animation: animationUrl,
    caption,
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

const deleteMessage = (chatId, messageId) =>
  callTelegram('deleteMessage', { chat_id: chatId, message_id: messageId });

const answerCallback = (callbackQueryId) =>
  callTelegram('answerCallbackQuery', { callback_query_id: callbackQueryId });

// Shows a text screen. A photo/GIF message can't be edited into text,
// so in that case we delete it and send a fresh message instead.
async function showScreen(cq, text, keyboard) {
  const chatId = cq.message.chat.id;
  const messageId = cq.message.message_id;

  if (!cq.message.text) {
    await deleteMessage(chatId, messageId);
    await sendMessage(chatId, text, keyboard);
  } else {
    await editMessage(chatId, messageId, text, keyboard);
  }
}

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
          await showScreen(cq, TEXTS.welcome, MAIN_MENU);
          break;
        case 'menu_subscription':
          await showScreen(cq, TEXTS.subscription, BACK_MENU);
          break;
        case 'menu_faq':
          await showScreen(cq, TEXTS.faq, FAQ_MENU);
          break;
        case 'menu_setup':
          await showScreen(cq, TEXTS.setup, BACK_MENU);
          break;

        // FAQ answers
        case 'faq_bots':
          // Sends photo + caption. Put bots.jpg into /public folder of your Vercel project.
          // The old FAQ menu message is deleted so the photo replaces it.
          await deleteMessage(chatId, messageId);
          await sendPhoto(
            chatId,
            'https://hyperquant-tg-bot.vercel.app/bots.jpg',
            TEXTS.faq_bots,
            FAQ_BACK
          );
          break;
        case 'faq_funds':
          await showScreen(cq, TEXTS.faq_funds, FAQ_BACK);
          break;
        case 'faq_fee':
          await showScreen(cq, TEXTS.faq_fee, FAQ_BACK);
          break;
        case 'faq_quant':
          // Sends GIF + caption. Put quantbot2.gif into /public folder of your Vercel project.
          await deleteMessage(chatId, messageId);
          await sendAnimation(
            chatId,
            'https://hyperquant-tg-bot.vercel.app/quantbot2.gif',
            TEXTS.faq_quant,
            FAQ_BACK
          );
          break;
        case 'faq_start':
          await showScreen(cq, TEXTS.faq_start, FAQ_BACK);
          break;
      }
    }

    res.status(200).send('OK');
  } catch (err) {
    console.error(err);
    res.status(200).send('OK'); // always 200, so Telegram doesn't retry forever
  }
};
