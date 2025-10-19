# Быстрая Инструкция по Миграции на Webhook

## Текущая Ситуация

Бот работает в **polling** режиме. Webhook настроен для **безопасного тестирования** перед миграцией.

---

## Шаг 1: Обновить nginx конфигурацию

Добавьте в ваш nginx конфиг для `api.bii.kz`:

```nginx
# Tolyan Bot Webhook endpoint
location /api/tolyan-bot/webhook {
    proxy_pass http://localhost:5001/bot/webhook;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;

    proxy_read_timeout 60;
    proxy_connect_timeout 60;
}

# Tolyan Bot Health check
location /api/tolyan-bot/health {
    proxy_pass http://localhost:5001/bot/health;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

Перезагрузите nginx:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

## Шаг 2: Обновить .env

Добавьте webhook настройки (но **оставьте BOT_MODE=polling**):

```bash
# Режим (пока оставляем polling для тестирования!)
BOT_MODE=polling

# Webhook настройки
WEBHOOK_DOMAIN=https://api.bii.kz
WEBHOOK_PATH=/api/tolyan-bot/webhook
```

---

## Шаг 3: Протестировать webhook

Перезапустите бота:

```bash
pm2 restart tolyan-bot
pm2 logs tolyan-bot --lines 50
```

**Смотрите в логи!** Должны увидеть:

```
✓ Webhook test SUCCESSFUL (local)
✓ Webhook test SUCCESSFUL (external)
✓ All webhook endpoints are accessible
✓ Bot is READY for webhook migration!
💡 To migrate: set BOT_MODE=webhook in .env and restart
```

✅ Если видите это - **всё готово к миграции!**

❌ Если видите ошибки - **НЕ мигрируйте**, сначала исправьте проблемы.

---

## Шаг 4: Миграция на webhook

**Только после успешного теста из Шага 3!**

1. Остановите бота:

```bash
pm2 stop tolyan-bot
```

2. Измените `.env`:

```bash
# Меняем на webhook
BOT_MODE=webhook
```

3. Запустите бота:

```bash
pm2 start tolyan-bot
pm2 logs tolyan-bot
```

4. Проверьте логи:

```
Webhook set successfully: https://api.bii.kz/api/tolyan-bot/webhook
✓ Webhook test SUCCESSFUL
```

5. Отправьте тестовое сообщение боту - должен ответить.

---

## Шаг 5: Проверка webhook через Telegram API

```bash
curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo"
```

Должно быть:

```json
{
  "ok": true,
  "result": {
    "url": "https://api.bii.kz/api/tolyan-bot/webhook",
    "pending_update_count": 0
  }
}
```

---

## Откат на Polling (если что-то пошло не так)

1. Остановите бота:

```bash
pm2 stop tolyan-bot
```

2. Удалите webhook:

```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/deleteWebhook"
```

3. Измените `.env`:

```bash
BOT_MODE=polling
```

4. Запустите бота:

```bash
pm2 start tolyan-bot
```

---

## Преимущества Webhook

✅ Более надёжная доставка updates
✅ Меньше нагрузки на сервер
✅ Мгновенная доставка сообщений
✅ Легче масштабируется

---

## Мониторинг

После миграции настройте мониторинг health endpoint:

- **UptimeRobot**: https://uptimerobot.com
- **URL для мониторинга**: https://api.bii.kz/api/tolyan-bot/health
- **Интервал**: 5 минут

---

## Важные Заметки

- **ВСЕГДА** тестируйте webhook в polling режиме перед миграцией
- Бот автоматически тестирует webhook при каждом запуске
- Логи покажут готовность к миграции
- Миграция занимает **меньше минуты** (если всё протестировано)
- Откат на polling **так же быстр**

---

## Контакты для Помощи

Если возникли проблемы:

1. Проверьте логи: `pm2 logs tolyan-bot`
2. Проверьте nginx: `sudo tail -f /var/log/nginx/error.log`
3. Проверьте health: `curl https://api.bii.kz/api/tolyan-bot/health`
4. См. полную документацию: `MIGRATION.md`

---

**Готово!** Следуйте инструкции пошагово, и миграция пройдёт гладко.
