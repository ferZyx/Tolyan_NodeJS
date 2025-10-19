# Миграция с Polling на Webhook

Это руководство поможет безопасно мигрировать Tolyan бота с polling режима на webhook.

## Содержание

1. [Зачем нужен webhook?](#зачем-нужен-webhook)
2. [Требования](#требования)
3. [Пошаговая инструкция](#пошаговая-инструкция)
4. [Настройка nginx](#настройка-nginx)
5. [Откат на polling](#откат-на-polling)
6. [Troubleshooting](#troubleshooting)

---

## Зачем нужен webhook?

### Преимущества webhook перед polling:

✅ **Более надёжная доставка** - Telegram сам отправляет updates, нет риска зависания polling
✅ **Меньше нагрузки** - нет постоянных HTTP запросов к Telegram API
✅ **Мгновенная доставка** - updates приходят без задержек
✅ **Масштабируемость** - легче работать с несколькими инстансами бота

### Недостатки:

❌ Требуется публичный HTTPS домен с SSL сертификатом
❌ Чуть сложнее в настройке

---

## Требования

Перед миграцией убедитесь, что у вас есть:

1. **Публичный домен с HTTPS** (например: `bot.yourdomain.com`)
2. **SSL сертификат** (можно получить бесплатно через Let's Encrypt)
3. **Nginx или другой reverse proxy** для проксирования запросов
4. **Открытый порт** на сервере (по умолчанию бот слушает `5001`)

---

## Пошаговая инструкция

### Шаг 1: Получение SSL сертификата

Если у вас ещё нет SSL сертификата, установите Certbot:

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install certbot python3-certbot-nginx

# Получить сертификат
sudo certbot --nginx -d bot.yourdomain.com
```

### Шаг 2: Настройка nginx

Создайте конфигурацию nginx для вашего бота:

```nginx
server {
    listen 80;
    server_name bot.yourdomain.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name bot.yourdomain.com;

    # SSL сертификаты (путь после certbot)
    ssl_certificate /etc/letsencrypt/live/bot.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/bot.yourdomain.com/privkey.pem;

    # SSL настройки
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Webhook endpoint - прокси на бота
    location /bot/webhook {
        proxy_pass http://localhost:5001/bot/webhook;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Health check endpoint (опционально, для мониторинга)
    location /bot/health {
        proxy_pass http://localhost:5001/bot/health;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

Проверьте конфигурацию и перезапустите nginx:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

### Шаг 3: Обновление .env файла

Добавьте или измените следующие переменные в `.env`:

```bash
# ВАЖНО: Сначала оставляем polling для тестирования!
BOT_MODE=polling

# Webhook настройки (для api.bii.kz)
WEBHOOK_DOMAIN=https://api.bii.kz
WEBHOOK_PATH=/api/tolyan-bot/webhook

# Остальные переменные остаются без изменений
DEBUG=false
DB_URI=your_mongodb_uri
TG_TOKEN=your_telegram_bot_token
# ... и т.д.
```

**ВАЖНО:**
- `WEBHOOK_DOMAIN` должен включать протокол `https://`
- `WEBHOOK_PATH` должен совпадать с `location` в nginx (`/api/tolyan-bot/webhook`)
- Сначала оставляем `BOT_MODE=polling` для тестирования!

### Шаг 4: Тестирование webhook в polling режиме

**НЕ меняем BOT_MODE! Оставляем polling.**

Запускаем бота и проверяем логи:

```bash
# Запустить через PM2
pm2 restart tolyan-bot
pm2 logs tolyan-bot --lines 50

# Или напрямую для тестирования
npm start
```

В логах вы должны увидеть:

```
Bot is running in POLLING mode.
Tolyan express started at 5001 port.
=== Starting webhook connectivity test ===
Testing webhook endpoint... http://localhost:5001/bot/webhook
✓ Webhook test SUCCESSFUL
Testing webhook endpoint... https://api.bii.kz/api/tolyan-bot/webhook
✓ Webhook test SUCCESSFUL
=== Webhook connectivity test results ===
✓ All webhook endpoints are accessible
--- Checking migration readiness ---
✓ Bot is READY for webhook migration!
💡 To migrate: set BOT_MODE=webhook in .env and restart
```

Если видите **"Bot is READY for webhook migration!"** - значит всё настроено правильно!

### Шаг 5: Финальная миграция на webhook

**Только после успешного теста из Шага 4!**

1. Остановить бота:

```bash
pm2 stop tolyan-bot
```

2. Изменить `.env`:

```bash
# Меняем режим на webhook
BOT_MODE=webhook
```

3. Запустить бота:

```bash
pm2 start tolyan-bot
pm2 logs tolyan-bot
```

В логах вы должны увидеть:

```
Bot will run in WEBHOOK mode. Webhook URL will be set after server starts.
Tolyan express started at 5001 port.
Webhook set successfully: https://api.bii.kz/api/tolyan-bot/webhook
=== Starting webhook connectivity test ===
✓ Webhook test SUCCESSFUL
```

### Шаг 7: Проверка webhook

Проверьте, что webhook установлен корректно:

```bash
curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo"
```

Ответ должен содержать:

```json
{
  "ok": true,
  "result": {
    "url": "https://api.bii.kz/api/tolyan-bot/webhook",
    "has_custom_certificate": false,
    "pending_update_count": 0
  }
}
```

### Шаг 8: Тестирование

1. Отправьте сообщение боту в Telegram
2. Проверьте логи: `pm2 logs tolyan-bot`
3. Убедитесь, что бот отвечает

**Health check:**

```bash
curl https://api.bii.kz/api/tolyan-bot/health
```

Должен вернуть:

```json
{
  "status": "healthy",
  "mode": "webhook",
  "healthy": true,
  "checks": {
    "bot": true,
    "database": true,
    "uptime": 123,
    "timeSinceLastActivity": 5
  },
  "timestamp": "2025-10-17T12:00:00.000Z"
}
```

---

## Настройка nginx

После того, как покажешь свою текущую nginx конфигурацию, я дам более точные рекомендации.

### Вариант 1: Бот на отдельном поддомене

```nginx
# Всё как в Шаге 2 выше
```

### Вариант 2: Бот на том же домене, что и основной сайт

```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    # ... SSL настройки ...

    # Основной сайт
    location / {
        # ваша текущая конфигурация
    }

    # Бот webhook
    location /bot/webhook {
        proxy_pass http://localhost:5001/bot/webhook;
        # ... proxy настройки ...
    }

    # Health check
    location /bot/health {
        proxy_pass http://localhost:5001/bot/health;
    }
}
```

---

## Откат на polling

Если что-то пошло не так, можно быстро откатиться на polling:

### Шаг 1: Остановить бота

```bash
pm2 stop tolyan-bot
```

### Шаг 2: Удалить webhook

```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/deleteWebhook"
```

### Шаг 3: Изменить .env

```bash
BOT_MODE=polling
# Закомментировать или удалить webhook настройки
# WEBHOOK_DOMAIN=...
# WEBHOOK_PATH=...
```

### Шаг 4: Перезапустить бота

```bash
pm2 restart tolyan-bot
pm2 logs tolyan-bot
```

В логах должно быть:

```
Bot is running in POLLING mode.
```

---

## Troubleshooting

### Проблема: Webhook не устанавливается

**Ошибка:** `Failed to set webhook`

**Решения:**

1. Проверьте, что домен доступен из интернета:
   ```bash
   curl https://bot.yourdomain.com/bot/health
   ```

2. Проверьте SSL сертификат:
   ```bash
   curl -v https://bot.yourdomain.com/bot/webhook
   ```

3. Убедитесь, что порт `5001` не заблокирован firewall

4. Проверьте логи nginx:
   ```bash
   sudo tail -f /var/log/nginx/error.log
   ```

### Проблема: Бот не отвечает на сообщения

**Решения:**

1. Проверьте логи бота:
   ```bash
   pm2 logs tolyan-bot --lines 100
   ```

2. Проверьте pending updates:
   ```bash
   curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo"
   ```

3. Если `pending_update_count > 0`, проверьте, что endpoint `/bot/webhook` возвращает `200 OK`

4. Проверьте nginx логи на наличие ошибок проксирования

### Проблема: Бот работает медленно

**Решения:**

1. Проверьте `timeSinceLastActivity` в `/bot/health`
2. Увеличьте timeout в nginx:
   ```nginx
   proxy_read_timeout 60;
   proxy_connect_timeout 60;
   ```

3. Проверьте нагрузку на сервер: `htop`

### Проблема: SSL ошибки

**Ошибка:** `SSL certificate problem`

**Решения:**

1. Обновите сертификат:
   ```bash
   sudo certbot renew
   sudo systemctl reload nginx
   ```

2. Проверьте срок действия:
   ```bash
   sudo certbot certificates
   ```

---

## Дополнительные рекомендации

### Мониторинг

Настройте внешний мониторинг health check endpoint:

1. **UptimeRobot** (бесплатно): https://uptimerobot.com
   - URL: `https://bot.yourdomain.com/bot/health`
   - Интервал: 5 минут

2. **Healthchecks.io** (бесплатно): https://healthchecks.io

### Логи

Для отладки webhook рекомендуется включить подробное логирование:

```bash
# В .env
DEBUG=true

# Перезапустить
pm2 restart tolyan-bot
```

### Автообновление SSL сертификата

Certbot автоматически настраивает cron для обновления. Проверьте:

```bash
sudo systemctl status certbot.timer
```

---

## Вопросы?

Если возникли проблемы:

1. Проверьте логи: `pm2 logs tolyan-bot`
2. Проверьте health endpoint: `curl https://bot.yourdomain.com/bot/health`
3. Проверьте webhook info через Telegram API
4. Откатитесь на polling, если критично

**Готово!** Бот теперь работает на webhook.
