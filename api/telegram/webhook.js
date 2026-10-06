// api/telegram/webhook.js
// Vercel serverless function — Telegram sends every update here via webhook.
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const API_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;

// Placeholder payment address (USDT) — replace with the real per-user address later
const PAYMENT_ADDRESS = '0x8E5B541b59C43cCD688215C1c52CB6E4B885D5e9';

// Website with the bot builder
const SITE_URL = 'https://hyper-quantbot.vercel.app/';

// Placeholder support account — replace with the real one
const SUPPORT_USERNAME = 'support_username';

// Bot username for referral links (illusion only — no tracking)
const BOT_USERNAME = 'hyperquant_trade_bot';

// Underscores break Telegram's legacy Markdown, so escape them in dynamic text
const escapeMd = (s) => s.replace(/_/g, '\\_');

// ============================================================
//  EDIT YOUR TEXTS HERE — this is the only part you need to touch
// ============================================================
const TEXTS = {
  welcome: `👋 Welcome to *HyperQuant*!
I help you set up and manage automated trading bots on Hyperliquid.
Use the buttons below to get started 👇`,

  profile: (username, userId) => `👤 *My Profile*

👤 *Your account*
TG Nickname (for site): ${username ? '@' + escapeMd(username) : 'not set'}

📦 *Your subscription*
• Plan: *Free* — 0.01% builder fee
• Quant Bot: *Demo* — 0.03% builder fee
└ ⏳ 7-day trial starts when you create your first bot

🎁 *Referral program*
• Paid referrals: *0* (50% commission)
• Accumulated earnings: *$0*

━━━━━━━━━━━━━━
*Available plans*

🆓 *Free* — 0.01% builder fee
└ 3 bots (Grid, DCA, Webhook/Signal, Combo)

🧪 *Demo* — 0.03% builder fee
└ 7-day trial of our Quant Bot, running 3 built-in trading systems

⚡ *PRO* — $65/mo
└ No builder fee · up to 10 bots · 3 Quant Bots engineered for steady, risk-managed performance

👑 *Unlimited* — $300/6mo
└ Up to 20 bots · 5 Quant Bots · priority support`,

  // Referral link screen (illusion — link has no functional tracking)
  referral: (userId) => `🎁 *Your referral link*

Share this link with friends:
\`https://t.me/${BOT_USERNAME}?start=ref_${userId}\`

_Tap the link to copy it._

You receive *50%* of the subscription fee from every paid referral.
Paid referrals and earnings are shown in My Profile.`,

  // Payment screen
  payment: `💎 *Upgrade Plan*
Send *exactly* the amount of your plan in USDT. The network fee is not included — cover it on top so the full amount arrives:

- *PRO* — 65 USDT (1 month)
- *Unlimited* — 300 USDT (6 months)

🌐 *Network:* you can use any of these — Arbitrum, BNB Smart Chain (BEP-20), Ethereum (ERC-20) or Base.

🔐 This wallet is dedicated to you personally:
\`${PAYMENT_ADDRESS}\`
_Tap the address to copy it._

After sending, press "✅ I've paid".`,

  // Shown after pressing "I've paid"
  payment_check: `⏳ *Checking your payment…*

As soon as the payment is confirmed, your subscription will be upgraded automatically.

Having trouble? Contact support: @${escapeMd(SUPPORT_USERNAME)}`,

  // FAQ overview — only questions are shown
  faq: `❓ *FAQ*
Tap a question below to see the answer:`,

  // Individual FAQ answers
  faq_bots: `*What bots do you offer?*
Classic DCA, Grid and Combo bots — with the option to add indicators, signals and webhooks. Flexible trailing is supported too, including per-level trailing inside the Grid bot.

*Quant Bot* — combines 3 built-in strategies to make decisions on trade entries.

A *Custom Bot* is also in development — it will offer the most flexible settings.`,

  faq_funds: `*Do you have access to my funds?*
No. You only create a trading *agent* on Hyperliquid and connect its API so our bots can trade on your behalf. We never hold your funds or private keys. A trading agent can't withdraw or transfer your funds — this is documented in Hyperliquid's own docs.`,

  faq_fee: `*What is the 0.01% builder fee?*
It's our service fee on top of Hyperliquid's own exchange fee (0.015%). It only applies on the FREE plan. The DEMO plan carries a separate 0.03% fee for trading with the Quant Bot.`,

  faq_quant: `*What is Quant Bot?*
Our proprietary bot, currently in its final testing stage. It combines 3 different market-analysis systems. It helps find good entry points alongside a major player while avoiding traps. As a last resort, the position is protected by a flexible stop loss. Quant Bot combines a comprehensive view of the market using the best technical analysis tools (chart), order flow (+ Price Action), liquidations and trading volume. The bot reduces risk in "bad" trades or deliberately avoids them. The plan price will be raised in the future, as this kind of load requires additional servers to maintain.`,

  faq_start: `*How do I get started?*
Tap "🚀 Setup Guide" below or use the main menu.`,

  setup: `🚀 *Setup Guide*
1️⃣ Open our website through your wallet's built-in browser: [hyper-quantbot.vercel.app](https://hyper-quantbot.vercel.app/)
2️⃣ Connect your wallet (e.g. MetaMask or Rabby)
3️⃣ Create a trading *agent* — a limited-permission key that lets our bots trade for you, without custody of your funds
4️⃣ Approve the builder fee if you don’t have a paid subscription (0.01%, 0.03% for the Quant Bot on DEMO)
5️⃣ Sign / approve the *abstraction account* so the bot can see your available funds (otherwise the bot will not detect your balance)
6️⃣ Choose your bot type (Grid / DCA / Combo / Quant) and configure it. Maximum leverage is limited to 3× for safety reasons
7️⃣ Launch the bot and start earning according to your strategy!

⚠️ *Note:* The MVP Quant Bot doesn't have flexible settings yet — it runs on built-in algorithms.
⚠️ *Note:* Backtesting is currently under development — always follow proper risk management.`,

  unknown: `I didn't understand that 🤔 Use /start to open the menu.`,
};

// ============================================================

const MAIN_MENU = {
  inline_keyboard: [
    [{ text: '👤 My Profile', callback_data: 'menu_profile' }],
    [{ text: '❓ FAQ', callback_data: 'menu_faq' }],
    [{ text: '🚀 Setup Guide', callback_data: 'menu_setup' }],
    [{ text: '🤖 Create a bot', url: SITE_URL }],
  ],
};

const BACK_MENU = {
  inline_keyboard: [[{ text: '⬅️ Back to menu', callback_data: 'menu_main' }]],
};

const PROFILE_MENU = {
  inline_keyboard: [
    [{ text: '💎 Upgrade plan', callback_data: 'menu_pay' }],
    [{ text: '🎁 My referral link', callback_data: 'menu_referral' }],
    [{ text: '⬅️ Back to menu', callback_data: 'menu_main' }],
  ],
};

const REFERRAL_MENU = {
  inline_keyboard: [
    [{ text: '⬅️ Back to profile', callback_data: 'menu_profile' }],
    [{ text: '🏠 Main menu', callback_data: 'menu_main' }],
  ],
};

const PAY_MENU = {
  inline_keyboard: [
    [{ text: "✅ I've paid", callback_data: 'pay_done' }],
    [{ text: '⬅️ Back', callback_data: 'menu_profile' }],
  ],
};

const PAY_CHECK_MENU = {
  inline_keyboard: [
    [{ text: '💬 Contact support', url: `https://t.me/${SUPPORT_USERNAME}` }],
    [{ text: '🏠 Main menu', callback_data: 'menu_main' }],
  ],
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

const FAQ_START = {
  inline_keyboard: [
    [{ text: '🚀 Setup Guide', callback_data: 'menu_setup' }],
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

      // Accept /start, /start ref_xxx, /menu — referral payload is ignored (illusion only)
      if (text === '/start' || text.startsWith('/start ') || text === '/menu') {
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
      const userId = cq.from.id;
      const username = cq.from.username;

      await answerCallback(cq.id); // stops the button's loading spinner

      switch (cq.data) {
        case 'menu_main':
          await showScreen(cq, TEXTS.welcome, MAIN_MENU);
          break;
        case 'menu_profile':
          await showScreen(cq, TEXTS.profile(username, userId), PROFILE_MENU);
          break;
        case 'menu_referral':
          await showScreen(cq, TEXTS.referral(userId), REFERRAL_MENU);
          break;
        case 'menu_pay':
          await showScreen(cq, TEXTS.payment, PAY_MENU);
          break;
        case 'pay_done':
          // Shows "checking payment" screen. Real verification is not implemented yet.
          await showScreen(cq, TEXTS.payment_check, PAY_CHECK_MENU);
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
          // Sends screenshot + caption. Put 23.jpg into /public folder of your Vercel project.
          await deleteMessage(chatId, messageId);
          await sendPhoto(
            chatId,
            'https://hyperquant-tg-bot.vercel.app/23.jpg',
            TEXTS.faq_quant,
            FAQ_BACK
          );
          break;
        case 'faq_start':
          await showScreen(cq, TEXTS.faq_start, FAQ_START);
          break;
      }
    }

    res.status(200).send('OK');
  } catch (err) {
    console.error(err);
    res.status(200).send('OK'); // always 200, so Telegram doesn't retry forever
  }
};
