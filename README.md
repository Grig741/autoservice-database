# Сайт + Telegram-бот на Netlify

Внутри:
- site/index.html — лендинг (RU / EN / HY), кнопки ведут в @autoservice_databaase_bot
- site/demo.html — демо-программа на вымышленных данных
- netlify/functions/telegram.mjs — бот (вебхук), состояние диалога хранится в Netlify Blobs

## Деплой (один раз)
1. Залейте эту папку в GitHub-репозиторий (node_modules не нужен).
2. Netlify → Add new site → Import from GitHub → выберите репозиторий. Настройки сборки подтянутся из netlify.toml.
   (Перетаскивание на app.netlify.com/drop не подойдёт: так функции не деплоятся.)
3. Site configuration → Environment variables → добавьте:
   BOT_TOKEN      = токен от @BotFather
   ADMIN_ID       = ваш Telegram ID
   WEBHOOK_SECRET = любая строка из латиницы и цифр, например svc_9f3k2m7q
4. Deploys → Trigger deploy (чтобы переменные подхватились).
5. Откройте в браузере:
   https://ВАШ-САЙТ.netlify.app/.netlify/functions/telegram?setup=ВАШ_WEBHOOK_SECRET
   Должно появиться «Webhook set: …». Всё, бот работает.

## Как пользоваться
- Заявки и сообщения клиентов приходят вам в Telegram.
- Ответить клиенту: Reply на его заявку/сообщение → ваш ответ уйдёт ему.
- Если бот запускали где-то ещё (Railway, локально) — остановите его там.
