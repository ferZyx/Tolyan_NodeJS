# Исправление ошибок webhook и graceful shutdown

## Обнаруженные проблемы

### 1. Ошибка при graceful shutdown (TypeError: Cannot read properties of undefined)

**Проблема:**
```
TypeError: Cannot read properties of undefined (reading 'close')
at gracefulShutdown (file:///var/www/tolyan/Tolyan_NodeJS/app.js:185:29)
```

**Причина:**
В файле `app.js` на строке 185 использовался `db.connection.close()`, но класс `Database` в `db/connection.js` не имеет свойства `connection`. База данных подключается через `mongoose.connect()`, поэтому нужно использовать `mongoose.connection.close()`.

**Решение:**
- Добавлен импорт `mongoose` в `app.js`
- Заменен `db.connection.close()` на `mongoose.connection.close()`
- Добавлена проверка состояния подключения перед закрытием: `mongoose.connection.readyState !== 0`
- Добавлена отмена retry таймеров webhook manager при shutdown

### 2. Webhook не устанавливается после рестарта

**Проблема:**
После рестарта PM2 webhook иногда не устанавливается успешно, и бот перестает получать обновления. В логах видно:
```
Bot will run in WEBHOOK mode. Webhook URL will be set after server starts.
```
Но после этого нет сообщения "Webhook set successfully".

**Причина:**
- Telegram API может быть временно недоступен
- Сетевые проблемы при запуске
- Таймауты при установке webhook
- Отсутствие механизма повторных попыток

**Решение:**
Создан новый утилитарный класс `WebhookRetryManager` (`utils/webhookRetry.js`) со следующими возможностями:

#### Основные функции:

1. **Автоматический retry с exponential backoff:**
   - До 5 попыток установки webhook
   - Задержки: 2s, 4s, 8s, 16s, 32s (максимум 60s)
   - Автоматическая проверка успешности установки через `getWebHookInfo()`

2. **Мониторинг здоровья webhook:**
   - Периодическая проверка каждые 5 минут
   - Обнаружение несоответствия URL
   - Мониторинг ошибок Telegram
   - Отслеживание накопления pending updates

3. **Уведомления администратора:**
   - При первой неудачной попытке
   - При превышении лимита повторных попыток
   - При обнаружении большого количества pending updates (>50)
   - При критических проблемах

4. **Graceful shutdown:**
   - Отмена всех pending retry таймеров
   - Корректная очистка ресурсов

#### Использование:

```javascript
import WebhookRetryManager from './utils/webhookRetry.js';

// Инициализация
const webhookRetryManager = new WebhookRetryManager(bot);

// Установка webhook с автоматическим retry
await webhookRetryManager.setWebhookWithRetry('https://api.bii.kz/api/tolyan-bot/webhook');

// Периодический мониторинг (каждые 5 минут)
setInterval(async () => {
    await webhookRetryManager.monitorWebhookHealth();
}, 5 * 60 * 1000);

// При shutdown
webhookRetryManager.cancelRetry();
```

## Изменения в коде

### app.js

1. **Импорты:**
   - Добавлен `import mongoose from "mongoose"`
   - Добавлен `import WebhookRetryManager from "./utils/webhookRetry.js"`

2. **Инициализация webhook manager:**
```javascript
let webhookRetryManager = null;
if (config.BOT_MODE === 'webhook') {
    webhookRetryManager = new WebhookRetryManager(bot);
}
```

3. **Установка webhook (заменено):**
```javascript
// БЫЛО:
if (config.BOT_MODE === 'webhook') {
    try {
        const webhookUrl = `${config.WEBHOOK_DOMAIN}${config.WEBHOOK_PATH}`;
        await bot.setWebHook(webhookUrl);
        log.info(`Webhook set successfully: ${webhookUrl}`);
    } catch (e) {
        log.error('Failed to set webhook!', { stack: e.stack });
        // ...
    }
}

// СТАЛО:
if (config.BOT_MODE === 'webhook' && webhookRetryManager) {
    const webhookUrl = `${config.WEBHOOK_DOMAIN}${config.WEBHOOK_PATH}`;
    await webhookRetryManager.setWebhookWithRetry(webhookUrl);

    // Setup periodic webhook health monitoring (every 5 minutes)
    setInterval(async () => {
        await webhookRetryManager.monitorWebhookHealth();
    }, 5 * 60 * 1000);
}
```

4. **Graceful shutdown (исправлено):**
```javascript
// БЫЛО:
await db.connection.close();
log.info('Database connection closed');

// СТАЛО:
if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
    log.info('Database connection closed');
}

// Cancel any pending webhook retries
if (webhookRetryManager) {
    webhookRetryManager.cancelRetry();
    log.info('Webhook retry manager stopped');
}
```

### utils/webhookRetry.js (новый файл)

Создан полностью новый класс `WebhookRetryManager` с методами:

- `setWebhookWithRetry(webhookUrl)` - установка webhook с retry
- `_attemptWebhookSetup()` - внутренний метод попытки установки
- `_scheduleRetry()` - планирование следующей попытки
- `monitorWebhookHealth()` - мониторинг здоровья webhook
- `cancelRetry()` - отмена pending retry
- `getStatus()` - получение текущего статуса

## Применение в других проектах

Чтобы применить это решение в другом проекте:

### 1. Скопировать файл webhook retry manager
```bash
cp utils/webhookRetry.js /path/to/other/project/utils/
```

### 2. Добавить в основной файл приложения:

```javascript
import mongoose from "mongoose"
import WebhookRetryManager from "./utils/webhookRetry.js"

// После создания bot
let webhookRetryManager = null;
if (config.BOT_MODE === 'webhook') {
    webhookRetryManager = new WebhookRetryManager(bot);
}

// При запуске сервера
if (config.BOT_MODE === 'webhook' && webhookRetryManager) {
    const webhookUrl = `${config.WEBHOOK_DOMAIN}${config.WEBHOOK_PATH}`;
    await webhookRetryManager.setWebhookWithRetry(webhookUrl);

    // Optional: periodic health monitoring
    setInterval(async () => {
        await webhookRetryManager.monitorWebhookHealth();
    }, 5 * 60 * 1000);
}

// В graceful shutdown
if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
    log.info('Database connection closed');
}

if (webhookRetryManager) {
    webhookRetryManager.cancelRetry();
    log.info('Webhook retry manager stopped');
}
```

### 3. Убедиться что в config есть:
- `BOT_MODE` - 'webhook' или 'polling'
- `WEBHOOK_DOMAIN` - домен для webhook
- `WEBHOOK_PATH` - путь для webhook
- `LOG_CHANEL_ID` - ID канала для уведомлений
- `DEBUG` - режим отладки

## Тестирование

### Проверка retry механизма:

1. Временно сделать webhook URL недоступным
2. Запустить бот
3. Проверить логи - должны быть попытки retry с увеличивающимися задержками
4. Восстановить доступность webhook
5. Проверить что webhook установился автоматически

### Проверка graceful shutdown:

1. Запустить бот: `pm2 start ecosystem.config.cjs`
2. Проверить что webhook установлен
3. Перезапустить: `pm2 restart tolyan-bot`
4. Проверить логи - не должно быть ошибок типа "Cannot read properties of undefined"
5. Проверить что webhook установился после рестарта

### Проверка health monitoring:

1. Запустить бот и дождаться установки webhook
2. Подождать 5+ минут
3. Проверить логи - должны быть записи "Webhook health check passed"
4. Если webhook URL станет недоступен, должно быть автоматическое обнаружение и retry

## Мониторинг в production

### Логи для отслеживания:

```bash
# Проверка статуса webhook
pm2 logs tolyan-bot | grep -i webhook

# Проверка ошибок
pm2 logs tolyan-bot --err

# Проверка retry попыток
pm2 logs tolyan-bot | grep -i "retry"

# Проверка graceful shutdown
pm2 logs tolyan-bot | grep -i "graceful"
```

### Метрики для мониторинга:

- Количество retry попыток
- Количество pending updates в webhook
- Время последней успешной установки webhook
- Ошибки при graceful shutdown

## Известные ограничения

1. **Максимум 5 попыток:** После 5 неудачных попыток retry прекращается. Требуется ручное вмешательство или рестарт.

2. **Health monitoring каждые 5 минут:** Можно настроить частоту, но слишком частые проверки могут создать нагрузку на Telegram API.

3. **Уведомления только в production:** В DEBUG режиме уведомления администратору отключены.

## Потенциальные улучшения

1. Добавить webhook status endpoint в API для внешнего мониторинга
2. Интегрировать с системами мониторинга (Prometheus, Grafana)
3. Добавить автоматический рестарт при критических ошибках
4. Добавить метрики в базу данных для исторического анализа
5. Добавить telegram команду для проверки статуса webhook
