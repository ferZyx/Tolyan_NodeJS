# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Tolyan is a Telegram bot for students and teachers at Kostanay Engineering and Economics University (KSU). The bot provides schedule information for students (by group) and teachers, with bilingual support (Russian and Kazakh). It includes a web API for schedule access and runs scheduled tasks for data updates and statistics logging.

## Technology Stack

- **Runtime**: Node.js 18.x (ES modules)
- **Framework**: Express.js for REST API
- **Bot Library**: node-telegram-bot-api
- **Database**: MongoDB with Mongoose ODM
- **Logging**: Winston (console, file, daily rotate, MongoDB, custom Telegram transport)
- **Localization**: i18next (Russian and Kazakh)
- **Scheduling**: node-cron
- **Process Manager**: PM2 (see ecosystem.config.cjs)

## Development Commands

```bash
# Install dependencies
npm install

# Run in development mode (with nodemon auto-restart)
npm run dev

# Run in production mode
npm start

# Run with PM2 (production)
pm2 start ecosystem.config.cjs
pm2 status
pm2 logs tolyan-bot
pm2 restart tolyan-bot
pm2 stop tolyan-bot
```

## Environment Configuration

Required environment variables in `.env`:
- `DEBUG` - Set to "true" for development (disables Telegram notifications)
- `DB_URI` - MongoDB connection string
- `TG_TOKEN` - Telegram bot token
- `LOG_CHANEL_ID` - Telegram channel ID for bot notifications
- `LOGGER_TG_TOKEN` - Telegram token for logger bot
- `BOT_ID` - Bot's Telegram ID
- `KSU_HELPER_URL` - Base URL for KSU schedule API

All variables are validated at startup in `config.js`.

## Architecture

### Application Initialization (`app.js`)

The application follows this startup sequence:
1. Initialize Telegram bot with polling
2. Initialize Express server on port 5001
3. Connect to MongoDB
4. Initialize i18next with Russian and Kazakh translations
5. Setup all handlers (commands, callbacks, documents, new members, messages)
6. Setup cron jobs for daily tasks

### Handler System

The bot uses a handler-based architecture:
- **`handlers/commandHandler.js`** - Registers all bot text commands with regex patterns. Commands support both Russian/Kazakh text buttons and `/command` format
- **`handlers/callbackHandler.js`** - Handles inline keyboard callback queries
- **`handlers/adminCommandHandler.js`** - Admin-only commands with middleware protection
- **`handlers/documentHandler.js`** - Handles document uploads
- **`handlers/newChatMemberHandler.js`** - Welcomes new chat members
- **`handlers/anyMessageHandler.js`** - Catch-all message handler

### Controller-Service Pattern

Controllers (`controllers/`) handle user interactions and call services:
- **Command Controllers** (`controllers/commands/`) - Handle specific bot commands
- **Admin Commands** (`controllers/commands/adminCommands/`) - Data update commands (faculties, programs, groups, profiles, departments, teachers)
- **Main Controllers** - `ScheduleController`, `ProfileController`, `SearchGroupController`, `SearchTeacherController`, `TeacherScheduleController`

Services (`services/`) handle business logic and database operations:
- Each model has a corresponding service (e.g., `userService.js`, `groupService.js`, `scheduleService.js`)
- Services abstract database queries and external API calls

### Models

Mongoose models in `models/`:
- **User data**: `user.js`, `user-activity.js`, `user-regiistration-stat.js`
- **Academic data**: `group.js`, `teacher.js`, `teacherProfile.js`, `faculty.js`, `department.js`, `program.js`
- **Schedule data**: `schedule.js`, `teacherSchedule.js`
- **System**: `Log.js`, `blackList.js`

### Middleware

Bot middlewares (`middlewares/bot/`):
- `commandAntiSpamMiddleware.js` - Prevents command spam
- `callbackAntiSpamMiddleware.js` - Prevents callback query spam
- `isAdminMiddleware.js` - Protects admin commands

Express middleware:
- `errorMiddleware.js` - Global error handler

### REST API (`router.js`)

Express routes under `/bot` prefix:
- `POST /bot/log` - Log arbitrary data
- `GET /bot/get_user_schedule` - Fetch student/teacher schedules by userId (falls back to cached data if external API fails)
- `GET /bot/get_user_activity_logs` - Paginated activity logs with level filtering

### External API Integration

The bot fetches schedules from `KSU_HELPER_URL`:
- Student schedules: `/epxress/api/schedule/get_schedule_by_groupId/{groupId}/{language}`
- Teacher schedules: `/express/api/teacherSchedule/get_teacher_schedule/{teacherId}`

**Fallback Strategy**: If external API fails, the bot serves cached schedules from MongoDB (`scheduleService` and `teacherScheduleService`).

### Scheduled Tasks (Cron)

Three cron jobs in `cron/`:
1. **`dailyDataUpdate.js`** - Runs at 5:00 AM daily, updates faculties, programs, groups, profiles, departments, and teachers from KSU API
2. **`userDailyStatisticsLogging.js`** - Logs daily user statistics
3. **`loggingPathUpdate.js`** - Manages log file rotation

### Localization

The bot supports Russian (ru) and Kazakh (kz):
- Translation files: `locales/ru.json`, `locales/kz.json`
- Initialized in `locales/init.js`
- Use `i18next.t('key')` for translations, with language determined by user preferences

Command handlers recognize both Russian and Kazakh button texts (e.g., "Расписание студента" and "Студенттің кестесі").

### Logging

Winston logger configured in `logging/logging.js`:
- Console output with timestamps
- File logging: `logs.log` (all levels), `error_logs.log` (errors only)
- Daily rotating files in `logs/` directory (30-day retention, 20MB max size)
- Custom Telegram transport (`customTransport.js`) for warnings in production (disabled in DEBUG mode)

Use `log.info()`, `log.warn()`, `log.error()` throughout the codebase.

### Anti-Spam Protection

User request tracking via `userLastRequest` object in `app.js`:
- Stores timestamp of last command/callback per user
- Middlewares enforce rate limits
- Prevents bot abuse

## Common Patterns

### Adding a New Command

1. Create controller in `controllers/commands/yourCommandController.js`
2. Export handler function that takes `(msg, match)` parameters
3. Register in `handlers/commandHandler.js` with regex pattern
4. Add Russian and Kazakh translations to `locales/` files
5. Consider adding anti-spam middleware if needed

### Adding a New Service Method

1. Identify the relevant service in `services/`
2. Add method following async/await pattern
3. Use try-catch for error handling
4. Log errors with `log.error()`

### Error Handling

- Bot command errors should catch and log without crashing
- Express routes use `errorMiddleware.js` for centralized error handling
- Critical errors send Telegram notifications to `LOG_CHANEL_ID` (via logger)

## Important Notes

- The bot uses **ES modules** (`"type": "module"` in package.json), so use `import/export` syntax
- Always use absolute paths when reading files (e.g., `locales/ru.json`)
- Bot commands are case-insensitive (use `/i` flag in regex)
- The Express server and Telegram bot run in the same process
- PM2 manages the process with auto-restart enabled