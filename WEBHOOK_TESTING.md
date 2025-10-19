# Тестирование Webhook

Этот документ описывает как протестировать webhook endpoints перед миграцией.

---

## Автоматическое Тестирование

Бот **автоматически тестирует webhook** при каждом запуске (в любом режиме - polling или webhook).

Просто запустите бота и смотрите логи:

```bash
pm2 restart tolyan-bot
pm2 logs tolyan-bot --lines 50
```

Вы увидите:

```
=== Starting webhook connectivity test ===
Testing webhook endpoint... http://localhost:5001/bot/webhook
✓ Webhook test SUCCESSFUL
Testing webhook endpoint... https://api.bii.kz/api/tolyan-bot/webhook
✓ Webhook test SUCCESSFUL
✓ All webhook endpoints are accessible
```

---

## Ручное Тестирование

### 1. Тест локального endpoint

```bash
curl -X POST http://localhost:5001/bot/webhook/test \
  -H "Content-Type: application/json" \
  -d '{"test": true, "message": "Testing local webhook"}'
```

**Ожидаемый ответ:**

```json
{
  "success": true,
  "mode": "polling",
  "message": "Test webhook endpoint is working",
  "timestamp": "2025-10-19T...",
  "receivedData": {
    "test": true,
    "message": "Testing local webhook"
  }
}
```

---

### 2. Тест внешнего endpoint (через nginx)

```bash
curl -X POST https://api.bii.kz/api/tolyan-bot/webhook/test \
  -H "Content-Type: application/json" \
  -d '{"test": true, "message": "Testing external webhook"}'
```

**Ожидаемый ответ:** тот же JSON, что и выше.

---

### 3. Тест Health Check

```bash
# Локальный
curl http://localhost:5001/bot/health

# Внешний
curl https://api.bii.kz/api/tolyan-bot/health
```

**Ожидаемый ответ:**

```json
{
  "status": "healthy",
  "mode": "polling",
  "healthy": true,
  "checks": {
    "bot": true,
    "database": true,
    "uptime": 123,
    "timeSinceLastActivity": 5
  },
  "timestamp": "2025-10-19T..."
}
```

---

## Проверка Готовности к Миграции

После того как webhook endpoints протестированы, бот автоматически проверит готовность:

```
--- Checking migration readiness ---
✓ Bot is READY for webhook migration!
💡 To migrate: set BOT_MODE=webhook in .env and restart
```

---

## Что Означают Ошибки?

### ❌ Connection refused

```
✗ Webhook test FAILED: Connection refused
```

**Причина:** Локальный сервер не запущен или порт 5001 заблокирован.

**Решение:**

1. Проверьте, запущен ли бот: `pm2 status`
2. Проверьте порты: `netstat -tulpn | grep 5001`
3. Проверьте firewall: `sudo ufw status`

---

### ❌ Timeout

```
✗ Webhook test FAILED: Timeout
```

**Причина:** Nginx не проксирует запросы или домен недоступен.

**Решение:**

1. Проверьте nginx конфигурацию: `sudo nginx -t`
2. Проверьте nginx логи: `sudo tail -f /var/log/nginx/error.log`
3. Перезагрузите nginx: `sudo systemctl reload nginx`
4. Проверьте DNS: `nslookup api.bii.kz`

---

### ❌ HTTP Error (404, 502, etc.)

```
✗ Webhook test FAILED: HTTP error
status: 502
```

**Причина:** Nginx конфигурация неверная или бот не отвечает.

**Решение:**

1. Проверьте nginx location блоки
2. Проверьте что бот запущен: `pm2 status`
3. Проверьте логи бота: `pm2 logs tolyan-bot`

---

## Проверка после Миграции на Webhook

После того как изменили `BOT_MODE=webhook`:

1. **Проверка webhook в Telegram:**

```bash
curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo"
```

Должно быть:

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

2. **Отправьте тестовое сообщение боту**

Бот должен ответить мгновенно. В логах должно появиться:

```
Webhook update received
mode: webhook
updateId: 123456789
hasMessage: true
```

---

## Мониторинг в Production

Для постоянного мониторинга настройте:

### UptimeRobot (бесплатно)

1. Зарегистрируйтесь на https://uptimerobot.com
2. Добавьте монитор:
   - **Type:** HTTP(s)
   - **URL:** https://api.bii.kz/api/tolyan-bot/health
   - **Monitoring Interval:** 5 minutes
3. Настройте алерты (email/SMS)

### Healthchecks.io (бесплатно)

1. Зарегистрируйтесь на https://healthchecks.io
2. Создайте новый check
3. Используйте URL для пинга из бота

---

## Частые Вопросы

**Q: Нужно ли останавливать polling для тестирования webhook?**

A: Нет! Бот может работать в polling режиме и одновременно тестировать webhook endpoints.

---

**Q: Безопасно ли тестировать webhook в production?**

A: Да! Тестовый endpoint (`/webhook/test`) не обрабатывает реальные updates от Telegram, только тестовые данные.

---

**Q: Что если тесты проходят локально, но не проходят внешне?**

A: Проблема в nginx или DNS. Проверьте nginx конфигурацию и убедитесь что домен доступен извне.

---

**Q: Можно ли вернуться на polling после миграции?**

A: Да! Просто измените `BOT_MODE=polling` в `.env` и перезапустите бота. Не забудьте удалить webhook через Telegram API.

---

## См. Также

- `MIGRATION.md` - полная инструкция по миграции
- `QUICK_MIGRATION_GUIDE.md` - быстрая шпаргалка
- `IMPROVEMENTS.md` - описание всех улучшений

---

**Готово!** Тестируйте смело, всё безопасно.
