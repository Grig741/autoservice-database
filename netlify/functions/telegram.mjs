// Telegram bot @autoservice_databaase_bot as a Netlify Function (webhook).
// URL: https://<your-site>.netlify.app/.netlify/functions/telegram
//
// Env vars (Netlify → Site configuration → Environment variables):
//   BOT_TOKEN       token from @BotFather
//   ADMIN_ID        your Telegram id — leads and messages go there
//   WEBHOOK_SECRET  any random string, e.g. svc_9f3k2m7q
//   DEMO_URL        optional; by default <this site>/demo.html
//   FILTERS_DEMO_URL optional; by default <this site>/filters-demo.html
//
// One-time setup after deploy: open in the browser
//   https://<your-site>.netlify.app/.netlify/functions/telegram?setup=<WEBHOOK_SECRET>
// It registers this URL as the bot's webhook.
//
// Projects: journal (start=site_ru|site_en|site_hy) and filters (start=filters or filters_ru|en|hy).
// "Мои проекты" button lists both projects with their demo and request buttons.
// Flow: visitor comes from the site (t.me/<bot>?start=site_ru|site_en|site_hy),
// leaves a request (name → shop/city → phone → comment), it is sent to ADMIN_ID.
// Other user messages are forwarded to ADMIN_ID. The admin answers with Reply
// on a message that contains #id<user> — the answer goes to that user.
import { getStore } from '@netlify/blobs';

const env = (k) => (globalThis.Netlify?.env?.get(k) ?? process.env[k] ?? '').trim();

const TX = {
  ru: {
    hello: 'Здравствуйте! Это бот «Журнала заявок» — программы для автосервиса.\n\nОставьте заявку, и мы свяжемся с вами, покажем программу и настроим её под ваш сервис.',
    btn_order: 'Оставить заявку', btn_question: 'Задать вопрос', btn_demo: 'Открыть демо',
    ask_name: 'Как вас зовут?',
    ask_shop: 'Как называется ваш автосервис и в каком городе он находится?',
    ask_phone: 'Ваш номер телефона? Нажмите кнопку ниже или напишите номер.',
    btn_phone: 'Отправить мой номер',
    ask_note: 'Что хотите добавить? Например, сколько у вас мастеров или что нужно в программе. Если нечего — нажмите «Пропустить».',
    btn_skip: 'Пропустить',
    done: 'Спасибо! Заявка отправлена, мы скоро свяжемся с вами.\n\nЕсли появятся вопросы — просто напишите сюда.',
    ask_question: 'Напишите ваш вопрос одним сообщением — мы ответим здесь.',
    sent: 'Сообщение отправлено. Ответим здесь, как только сможем.',
    cancel: 'Хорошо, отменили. Напишите /start, чтобы начать заново.',
    hello_filters: 'Здравствуйте! Это бот «Склада фильтров» — программы для учёта фильтров в автосервисе.\n\nПодбор фильтра по машине, продажа сразу списывает остаток, отчёт по прибыли и список закупки.\n\nОставьте заявку, и мы подключим склад для вашего сервиса.',
    btn_projects: 'Мои проекты',
    projects: 'Мои проекты для автосервисов:\n\n1. Журнал заявок — клиенты, машины и VIN, работы, запчасти, закупка и цена продажи.\n\n2. Склад фильтров — остатки фильтров, подбор по машине, продажи и прибыль, что докупить.\n\nВыберите проект: посмотрите демо или оставьте заявку.',
    p_journal: 'Журнал заявок', p_filters: 'Склад фильтров',
    demo_journal: 'Демо: Журнал заявок', demo_filters: 'Демо: Склад фильтров',
    order_journal: 'Заявка: Журнал заявок', order_filters: 'Заявка: Склад фильтров',
  },
  en: {
    hello: 'Hello! This is the Service Log bot — software for auto repair shops.\n\nLeave a request and we’ll contact you, show you the app and set it up for your shop.',
    btn_order: 'Leave a request', btn_question: 'Ask a question', btn_demo: 'Open the demo',
    ask_name: 'What’s your name?',
    ask_shop: 'What is your shop called and which city is it in?',
    ask_phone: 'Your phone number? Tap the button below or type it.',
    btn_phone: 'Send my number',
    ask_note: 'Anything to add? For example, how many mechanics you have or what you need in the app. If not, tap “Skip”.',
    btn_skip: 'Skip',
    done: 'Thank you! Your request has been sent, we’ll contact you soon.\n\nIf you have questions, just write here.',
    ask_question: 'Write your question in one message — we’ll reply here.',
    sent: 'Message sent. We’ll reply here as soon as we can.',
    cancel: 'OK, cancelled. Send /start to begin again.',
    hello_filters: 'Hello! This is the Filter Stock bot — software for tracking filters in an auto repair shop.\n\nFind a filter by car, a sale deducts the stock automatically, profit report and a reorder list.\n\nLeave a request and we’ll set up the stock for your shop.',
    btn_projects: 'My projects',
    projects: 'My projects for auto repair shops:\n\n1. Service Log — clients, cars and VIN, jobs, parts, purchase and selling price.\n\n2. Filter Stock — filter stock, search by car, sales and profit, what to reorder.\n\nPick a project: open the demo or leave a request.',
    p_journal: 'Service Log', p_filters: 'Filter Stock',
    demo_journal: 'Demo: Service Log', demo_filters: 'Demo: Filter Stock',
    order_journal: 'Request: Service Log', order_filters: 'Request: Filter Stock',
  },
  hy: {
    hello: 'Բարև Ձեզ։ Սա «Հայտերի մատյան» ծրագրի բոտն է՝ ծրագիր ավտոսերվիսների համար։\n\nԹողեք հայտ, և մենք կկապվենք ձեզ հետ, ցույց կտանք ծրագիրը և կկարգավորենք այն ձեր սերվիսի համար։',
    btn_order: 'Թողնել հայտ', btn_question: 'Հարց տալ', btn_demo: 'Բացել դեմոն',
    ask_name: 'Ինչպե՞ս է ձեր անունը',
    ask_shop: 'Ինչպե՞ս է կոչվում ձեր ավտոսերվիսը և ո՞ր քաղաքում է այն գտնվում',
    ask_phone: 'Ձեր հեռախոսահամարը։ Սեղմեք ներքևի կոճակը կամ գրեք համարը։',
    btn_phone: 'Ուղարկել իմ համարը',
    ask_note: 'Ի՞նչ կցանկանայիք ավելացնել։ Օրինակ՝ քանի վարպետ ունեք կամ ինչ է պետք ծրագրում։ Եթե ոչինչ, սեղմեք «Բաց թողնել»։',
    btn_skip: 'Բաց թողնել',
    done: 'Շնորհակալություն։ Հայտն ուղարկված է, շուտով կկապվենք ձեզ հետ։\n\nՀարցեր ունենալու դեպքում պարզապես գրեք այստեղ։',
    ask_question: 'Գրեք ձեր հարցը մեկ հաղորդագրությամբ՝ կպատասխանենք այստեղ։',
    sent: 'Հաղորդագրությունն ուղարկված է։ Կպատասխանենք այստեղ որքան հնարավոր է շուտ։',
    cancel: 'Լավ, չեղարկվեց։ Գրեք /start՝ նորից սկսելու համար։',
    hello_filters: 'Բարև Ձեզ։ Սա «Ֆիլտրերի պահեստ» ծրագրի բոտն է՝ ավտոսերվիսում ֆիլտրերի հաշվառման համար։\n\nՖիլտրի ընտրություն ըստ մեքենայի, վաճառքն ինքնաբերաբար նվազեցնում է մնացորդը, շահույթի հաշվետվություն և գնումների ցուցակ։\n\nԹողեք հայտ, և մենք կմիացնենք պահեստը ձեր սերվիսի համար։',
    btn_projects: 'Իմ նախագծերը',
    projects: 'Իմ նախագծերը ավտոսերվիսների համար․\n\n1. Հայտերի մատյան՝ հաճախորդներ, մեքենաներ և VIN, աշխատանքներ, պահեստամասեր, գնման և վաճառքի գին։\n\n2. Ֆիլտրերի պահեստ՝ ֆիլտրերի մնացորդ, ընտրություն ըստ մեքենայի, վաճառք և շահույթ, ինչ գնել։\n\nԸնտրեք նախագիծը՝ դիտեք դեմոն կամ թողեք հայտ։',
    p_journal: 'Հայտերի մատյան', p_filters: 'Ֆիլտրերի պահեստ',
    demo_journal: 'Դեմո՝ Հայտերի մատյան', demo_filters: 'Դեմո՝ Ֆիլտրերի պահեստ',
    order_journal: 'Հայտ՝ Հայտերի մատյան', order_filters: 'Հայտ՝ Ֆիլտրերի պահեստ',
  },
};

async function tg(method, body) {
  const r = await fetch(`https://api.telegram.org/bot${env('BOT_TOKEN')}/${method}`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
  });
  const j = await r.json().catch(() => ({}));
  if (!j.ok) console.error('telegram', method, JSON.stringify(j));
  return j;
}

const store = () => globalThis.__testStore ?? getStore('bot-state');
async function loadState(uid) { try { return (await store().get(String(uid), { type: 'json' })) || {}; } catch (e) { console.error(e); return {}; } }
async function saveState(uid, s) { try { await store().setJSON(String(uid), s); } catch (e) { console.error(e); } }

function who(u) {
  const name = [u.first_name, u.last_name].filter(Boolean).join(' ');
  return `${name} (${u.username ? '@' + u.username : 'без username'}) #id${u.id}`;
}
function guessLang(u) {
  const c = (u.language_code || '').toLowerCase();
  return c.startsWith('hy') ? 'hy' : c.startsWith('en') ? 'en' : 'ru';
}
const PRODUCTS = ['journal', 'filters'];
function demoUrl(product) {
  const base = globalThis.__origin || '';
  if (product === 'filters') return env('FILTERS_DEMO_URL') || (base ? base + '/filters-demo.html' : '');
  return env('DEMO_URL') || (base ? base + '/demo.html' : '');
}
const helloText = (l, product) => product === 'filters' ? TX[l].hello_filters : TX[l].hello;
function menu(l, product = 'journal') {
  const t = TX[l];
  const rows = [[{ text: t.btn_order, callback_data: 'order_' + product }], [{ text: t.btn_question, callback_data: 'question' }]];
  const demo = demoUrl(product);
  if (demo) rows.push([{ text: t.btn_demo, url: demo }]);
  rows.push([{ text: t.btn_projects, callback_data: 'projects' }]);
  rows.push([{ text: 'RU', callback_data: 'lang_ru' }, { text: 'EN', callback_data: 'lang_en' }, { text: 'ՀՅ', callback_data: 'lang_hy' }]);
  return { inline_keyboard: rows };
}
function projectsMenu(l) {
  const t = TX[l], rows = [];
  for (const p of PRODUCTS) {
    const demo = demoUrl(p);
    if (demo) rows.push([{ text: t['demo_' + p], url: demo }]);
    rows.push([{ text: t['order_' + p], callback_data: 'order_' + p }]);
  }
  rows.push([{ text: t.btn_question, callback_data: 'question' }]);
  return { inline_keyboard: rows };
}
const say = (chat_id, text, reply_markup) => tg('sendMessage', reply_markup ? { chat_id, text, reply_markup } : { chat_id, text });
const removeKb = { remove_keyboard: true };

async function onUpdate(up) {
  const ADMIN = Number(env('ADMIN_ID'));

  // ---- inline buttons ----
  if (up.callback_query) {
    const q = up.callback_query, u = q.from, chat = q.message.chat.id;
    await tg('answerCallbackQuery', { callback_query_id: q.id });
    const s = await loadState(u.id); const l = TX[s.lang] ? s.lang : guessLang(u);
    if (q.data.startsWith('lang_')) {
      s.lang = q.data.slice(5); await saveState(u.id, s);
      return say(chat, helloText(s.lang, s.product), menu(s.lang, s.product || 'journal'));
    }
    if (q.data === 'projects') { s.lang = l; await saveState(u.id, s); return say(chat, TX[l].projects, projectsMenu(l)); }
    if (q.data === 'order' || q.data.startsWith('order_')) {
      const p = PRODUCTS.includes(q.data.slice(6)) ? q.data.slice(6) : (s.product || 'journal');
      s.lang = l; s.product = p; s.step = 'name'; s.lead = { product: p }; await saveState(u.id, s);
      return say(chat, TX[l].ask_name);
    }
    if (q.data === 'question') { s.lang = l; s.step = null; await saveState(u.id, s); return say(chat, TX[l].ask_question); }
    return;
  }

  const m = up.message;
  if (!m || m.chat.type !== 'private') return;
  const u = m.from, chat = m.chat.id, text = (m.text || '').trim();

  // ---- admin replies to a client ----
  if (u.id === ADMIN && m.reply_to_message) {
    const src = m.reply_to_message.text || m.reply_to_message.caption || '';
    const id = (src.match(/#id(\d+)/) || [])[1];
    if (!id) return say(chat, 'Чтобы ответить клиенту, нажмите Reply на его заявку или сообщение (там, где есть #id).');
    const r = await tg('copyMessage', { chat_id: Number(id), from_chat_id: chat, message_id: m.message_id });
    return say(chat, r.ok ? 'Отправлено ✅' : 'Не удалось отправить: ' + (r.description || 'ошибка'));
  }

  const s = await loadState(u.id);

  // ---- commands ----
  if (text.startsWith('/start')) {
    const arg = text.split(/\s+/)[1] || '';
    const fromSite = /^site_(ru|en|hy)$/.exec(arg);
    const fromFilters = /^filters(?:_(ru|en|hy))?$/.exec(arg);
    const argLang = fromSite ? fromSite[1] : fromFilters ? fromFilters[1] : null;
    s.lang = argLang || (TX[s.lang] ? s.lang : guessLang(u));
    s.product = fromFilters ? 'filters' : 'journal';
    s.step = null; s.lead = null; await saveState(u.id, s);
    await say(chat, helloText(s.lang, s.product), menu(s.lang, s.product));
    if (u.id !== ADMIN) await say(ADMIN, `Новый посетитель в боте${arg ? ` (${fromFilters ? 'Склад фильтров' : 'Журнал заявок'}, ${arg})` : ''}: ${who(u)}`);
    return;
  }
  const l = TX[s.lang] ? s.lang : guessLang(u);
  if (text === '/cancel') { s.step = null; s.lead = null; await saveState(u.id, s); return say(chat, TX[l].cancel, removeKb); }

  // ---- lead form ----
  if (s.step === 'name' && text) { s.lead = { ...(s.lead || {}), name: text }; s.step = 'shop'; await saveState(u.id, s); return say(chat, TX[l].ask_shop); }
  if (s.step === 'shop' && text) {
    s.lead.shop = text; s.step = 'phone'; await saveState(u.id, s);
    return say(chat, TX[l].ask_phone, { keyboard: [[{ text: TX[l].btn_phone, request_contact: true }]], resize_keyboard: true, one_time_keyboard: true });
  }
  if (s.step === 'phone' && (m.contact || text)) {
    s.lead.phone = m.contact ? m.contact.phone_number : text; s.step = 'note'; await saveState(u.id, s);
    return say(chat, TX[l].ask_note, { keyboard: [[{ text: TX[l].btn_skip }]], resize_keyboard: true, one_time_keyboard: true });
  }
  if (s.step === 'note' && text) {
    const lead = s.lead || {}; const note = text === TX[l].btn_skip ? '' : text;
    s.step = null; s.lead = null; await saveState(u.id, s);
    await say(ADMIN, '🟥 НОВАЯ ЗАЯВКА\n\n' +
      `Проект: ${lead.product === 'filters' ? 'Склад фильтров' : 'Журнал заявок'}\n` +
      `Имя: ${lead.name || '-'}\nСервис / город: ${lead.shop || '-'}\nТелефон: ${lead.phone || '-'}\nКомментарий: ${note || '-'}\nЯзык: ${l}\n\n` +
      `Telegram: ${who(u)}\nОтветьте на это сообщение (Reply), и ответ уйдёт клиенту.`);
    return say(chat, TX[l].done, removeKb);
  }

  // ---- anything else goes to the admin ----
  if (u.id === ADMIN) return;
  if (text) await say(ADMIN, `✉️ ${who(u)}:\n\n${text}\n\nОтветьте Reply, чтобы ответить клиенту.`);
  else {
    await say(ADMIN, `✉️ ${who(u)} прислал файл ниже.\nОтветьте Reply на ЭТО сообщение, чтобы ответить клиенту.`);
    await tg('copyMessage', { chat_id: ADMIN, from_chat_id: chat, message_id: m.message_id });
  }
  return say(chat, TX[l].sent);
}

export default async (req) => {
  const url = new URL(req.url);
  globalThis.__origin = url.origin;
  const secret = env('WEBHOOK_SECRET');

  // one-time setup: GET ?setup=<WEBHOOK_SECRET>
  if (req.method === 'GET') {
    if (!secret || url.searchParams.get('setup') !== secret) return new Response('ok');
    const hook = `${url.origin}${url.pathname}`;
    const r = await tg('setWebhook', { url: hook, secret_token: secret, drop_pending_updates: true, allowed_updates: ['message', 'callback_query'] });
    return new Response(r.ok ? `Webhook set: ${hook}` : `Error: ${JSON.stringify(r)}`, { headers: { 'content-type': 'text/plain; charset=utf-8' } });
  }

  if (req.method !== 'POST') return new Response('ok');
  if (secret && req.headers.get('x-telegram-bot-api-secret-token') !== secret) return new Response('forbidden', { status: 403 });
  try { await onUpdate(await req.json()); } catch (e) { console.error(e); }
  return new Response('ok'); // always 200 so Telegram doesn't retry forever
};
