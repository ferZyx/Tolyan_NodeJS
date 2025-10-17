# Улучшения надёжности бота

В этом обновлении были добавлены следующие улучшения для повышения стабильности и надёжности бота.

## Что изменилось?

### 1. Защита от зависания polling

**Проблема:** Бот периодически зависал и переставал получать updates от Telegram.

**Решение:**

- ✅ Добавлены глобальные error handlers для `polling_error` и `webhook_error`
- ✅ Все необработанные ошибки (`uncaughtException`, `unhandledRejection`) теперь логируются
- ✅ При критических ошибках отправляется уведомление админу в Telegram
- ✅ Бот продолжает работать даже после ошибок в handlers

**Файлы:** `app.js:34-54`, `app.js:115-140`

---

### 2. Защита command handlers

**Проблема:** Ошибка в любом command handler могла сломать весь бот.

**Решение:**

- ✅ Создан `utils/safeHandler.js` - обёртка для безопасной обработки команд
- ✅ Все command handlers обёрнуты в `safeHandler()`
- ✅ Ошибки логируются с указанием handler name и user ID
- ✅ Пользователь получает сообщение об ошибке вместо молчания

**Файлы:** `utils/safeHandler.js`, `handlers/commandHandler.js`

**Пример использования:**

```javascript
// Старый способ (небезопасно)
bot.onText(/^\/start/i, startCommandController);

// Новый способ (безопасно)
bot.onText(/^\/start/i, safeHandler(startCommandController, 'start'));
```

---

### 3. Health Check endpoint

**Проблема:** Невозможно было автоматически проверить, жив ли бот.

**Решение:**

- ✅ Добавлен `/bot/health` endpoint
- ✅ Проверяет: статус бота, подключение к БД, uptime, время последнего update
- ✅ Возвращает HTTP 200 если всё OK, 503 если есть проблемы

**Файл:** `router.js:16-34`

**Использование:**

```bash
curl http://localhost:5001/bot/health
```

**Ответ:**

```json
{
  "status": "healthy",
  "mode": "polling",
  "healthy": true,
  "checks": {
    "bot": true,
    "database": true,
    "uptime": 3600,
    "timeSinceLastActivity": 5
  },
  "timestamp": "2025-10-17T12:00:00.000Z"
}
```

Можно настроить внешний мониторинг (UptimeRobot, Healthchecks.io) для проверки этого endpoint.

---

### 4. Мониторинг активности бота

**Проблема:** Не было способа узнать, когда бот последний раз получал updates.

**Решение:**

- ✅ Создан `utils/botHealthMonitor.js` для отслеживания активности
- ✅ Обновляется при каждом message или callback_query
- ✅ Health check предупреждает, если нет активности > 5 минут

**Файлы:** `utils/botHealthMonitor.js`, `app.js:57-58`

---

### 5. Поддержка Webhook режима

**Проблема:** Polling может зависать, webhook более надёжный для production.

**Решение:**

- ✅ Добавлена возможность переключения между polling и webhook
- ✅ Настройка через `.env` (`BOT_MODE=polling|webhook`)
- ✅ Webhook endpoint: `POST /bot/webhook`
- ✅ Автоматическая установка webhook при старте
- ✅ Graceful shutdown с удалением webhook

**Файлы:** `config.js`, `app.js:21-31`, `router.js:36-56`

**Как использовать:**

См. подробную инструкцию в `MIGRATION.md`

---

### 6. Graceful Shutdown

**Проблема:** При остановке бота могли теряться данные или connections.

**Решение:**

- ✅ При получении `SIGTERM` или `SIGINT` бот корректно закрывается
- ✅ Останавливает HTTP server
- ✅ Удаляет webhook (если в webhook режиме)
- ✅ Останавливает polling (если в polling режиме)
- ✅ Закрывает подключение к MongoDB

**Файл:** `app.js:142-175`

---

### 7. Улучшенная PM2 конфигурация

**Проблема:** PM2 не был оптимально настроен для автоматического восстановления.

**Решение:**

- ✅ Добавлен `max_restarts: 10` - не будет бесконечно перезапускаться при ошибках
- ✅ Добавлен `min_uptime: "10s"` - перезапуск только если прожил > 10 секунд
- ✅ Добавлен `restart_delay: 4000` - задержка 4 сек между перезапусками
- ✅ Добавлен `kill_timeout: 5000` - даёт 5 сек на graceful shutdown

**Файл:** `ecosystem.config.cjs`

---

## Как протестировать улучшения?

### 1. Проверка health check

```bash
# Запустить бота
npm start

# В другом терминале
curl http://localhost:5001/bot/health
```

### 2. Проверка error handling

Временно добавьте ошибку в любой handler и попробуйте вызвать команду:

```javascript
// В любом контроллере
export async function testCommandController(msg) {
    throw new Error('Test error!');
}
```

- Бот должен продолжить работать
- Пользователь получит сообщение об ошибке
- Ошибка будет залогирована
- Админ получит уведомление (если `DEBUG=false`)

### 3. Проверка graceful shutdown

```bash
# Запустить бота
npm start

# Нажать Ctrl+C

# В логах должно быть:
# SIGINT received. Starting graceful shutdown...
# HTTP server closed
# Polling stopped (или Webhook removed)
# Database connection closed
# Graceful shutdown completed
```

---

## Что делать при проблемах?

### Бот перестал отвечать

1. Проверить health check: `curl http://localhost:5001/bot/health`
2. Проверить логи: `pm2 logs tolyan-bot`
3. Проверить статус PM2: `pm2 status`
4. Перезапустить: `pm2 restart tolyan-bot`

### Ошибки в логах

1. Все ошибки теперь логируются с полной информацией
2. Проверить файл `error_logs.log`
3. Проверить MongoDB логи в базе данных
4. Если `DEBUG=false`, проверить канал логов в Telegram

### Проблемы с webhook

См. troubleshooting в `MIGRATION.md`

---

## Дополнительные файлы

- `.env.example` - пример конфигурации с новыми переменными
- `MIGRATION.md` - инструкция по миграции на webhook
- `utils/safeHandler.js` - helper для безопасных handlers
- `utils/botHealthMonitor.js` - мониторинг активности бота

---

## Следующие шаги

### Рекомендуется:

1. ✅ Протестировать бота в текущем polling режиме
2. ✅ Настроить внешний мониторинг для `/bot/health`
3. ✅ Подготовить домен и SSL для webhook
4. ✅ Мигрировать на webhook (см. `MIGRATION.md`)
5. ✅ Настроить алерты в случае проблем

### Опционально:

- Добавить метрики (Prometheus, Grafana)
- Настроить rate limiting для API endpoints
- Добавить unit тесты для критичных handlers
- Настроить CI/CD для автоматического деплоя

---

**Готово!** Бот теперь намного стабильнее и надёжнее.
