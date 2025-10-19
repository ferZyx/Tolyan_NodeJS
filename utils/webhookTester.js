/**
 * Webhook Testing Utility
 *
 * Тестирует доступность webhook endpoint при запуске бота.
 * Работает в любом режиме (polling или webhook).
 */

import axios from 'axios';
import log from '../logging/logging.js';
import config from '../config.js';

class WebhookTester {
    /**
     * Тестирует webhook endpoint
     * @param {string} webhookUrl - Полный URL webhook endpoint
     * @returns {Promise<Object>} Результат теста
     */
    async testWebhook(webhookUrl) {
        const testData = {
            test: true,
            mode: config.BOT_MODE,
            timestamp: new Date().toISOString(),
            source: 'webhookTester'
        };

        try {
            log.info('Testing webhook endpoint...', { webhookUrl });

            const response = await axios.post(`${webhookUrl}/test`, testData, {
                timeout: 10000,
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.status === 200 && response.data.success) {
                log.info('✓ Webhook test SUCCESSFUL', {
                    webhookUrl,
                    responseTime: response.headers['x-response-time'],
                    mode: response.data.mode
                });

                return {
                    success: true,
                    message: 'Webhook endpoint is accessible',
                    url: webhookUrl,
                    response: response.data
                };
            } else {
                log.warn('✗ Webhook test returned unexpected response', {
                    webhookUrl,
                    status: response.status,
                    data: response.data
                });

                return {
                    success: false,
                    message: 'Webhook endpoint returned unexpected response',
                    url: webhookUrl,
                    status: response.status
                };
            }
        } catch (error) {
            // Проверяем тип ошибки
            if (error.code === 'ECONNREFUSED') {
                log.error('✗ Webhook test FAILED: Connection refused', {
                    webhookUrl,
                    error: 'Local server may not be started or port is blocked'
                });
            } else if (error.code === 'ETIMEDOUT') {
                log.error('✗ Webhook test FAILED: Timeout', {
                    webhookUrl,
                    error: 'Request timed out - check nginx/network configuration'
                });
            } else if (error.response) {
                log.error('✗ Webhook test FAILED: HTTP error', {
                    webhookUrl,
                    status: error.response.status,
                    statusText: error.response.statusText
                });
            } else {
                log.error('✗ Webhook test FAILED: Unknown error', {
                    webhookUrl,
                    error: error.message,
                    stack: error.stack
                });
            }

            return {
                success: false,
                message: error.message,
                url: webhookUrl,
                error: {
                    code: error.code,
                    message: error.message
                }
            };
        }
    }

    /**
     * Тестирует webhook endpoint при запуске приложения
     * Использует WEBHOOK_DOMAIN из конфига или тестирует локально
     */
    async testOnStartup() {
        log.info('=== Starting webhook connectivity test ===');

        const results = [];

        // 1. Всегда тестируем локальный endpoint
        const localUrl = `http://localhost:${config.WEBHOOK_PORT}/bot/webhook`;
        const localResult = await this.testWebhook(localUrl);
        results.push({ type: 'local', ...localResult });

        // 2. Если указан WEBHOOK_DOMAIN, тестируем внешний URL
        if (config.WEBHOOK_DOMAIN) {
            // Убираем trailing slash если есть
            const domain = config.WEBHOOK_DOMAIN.replace(/\/$/, '');
            const path = config.WEBHOOK_PATH || '/bot/webhook';
            const externalUrl = `${domain}${path}`;

            const externalResult = await this.testWebhook(externalUrl);
            results.push({ type: 'external', ...externalResult });
        } else {
            log.info('WEBHOOK_DOMAIN not configured - skipping external webhook test');
        }

        // Суммарный результат
        const allSuccessful = results.every(r => r.success);
        const someSuccessful = results.some(r => r.success);

        log.info('=== Webhook connectivity test results ===', {
            allSuccessful,
            someSuccessful,
            results: results.map(r => ({
                type: r.type,
                url: r.url,
                success: r.success,
                message: r.message
            }))
        });

        if (allSuccessful) {
            log.info('✓ All webhook endpoints are accessible');
        } else if (someSuccessful) {
            log.warn('⚠ Some webhook endpoints are not accessible');
        } else {
            log.error('✗ All webhook endpoints are NOT accessible');
        }

        return {
            allSuccessful,
            someSuccessful,
            results
        };
    }

    /**
     * Проверяет готовность к миграции на webhook
     */
    async checkMigrationReadiness() {
        log.info('=== Checking webhook migration readiness ===');

        const checks = {
            webhookDomainConfigured: !!config.WEBHOOK_DOMAIN,
            webhookPathConfigured: !!config.WEBHOOK_PATH,
            localEndpointAccessible: false,
            externalEndpointAccessible: false
        };

        // Тест локального endpoint
        const localUrl = `http://localhost:${config.WEBHOOK_PORT}/bot/webhook`;
        const localResult = await this.testWebhook(localUrl);
        checks.localEndpointAccessible = localResult.success;

        // Тест внешнего endpoint (если настроен)
        if (config.WEBHOOK_DOMAIN) {
            const domain = config.WEBHOOK_DOMAIN.replace(/\/$/, '');
            const path = config.WEBHOOK_PATH || '/bot/webhook';
            const externalUrl = `${domain}${path}`;

            const externalResult = await this.testWebhook(externalUrl);
            checks.externalEndpointAccessible = externalResult.success;
        }

        // Определяем готовность
        const isReady =
            checks.webhookDomainConfigured &&
            checks.webhookPathConfigured &&
            checks.localEndpointAccessible &&
            checks.externalEndpointAccessible;

        log.info('Migration readiness check results:', {
            isReady,
            checks
        });

        if (isReady) {
            log.info('✓ Bot is READY for webhook migration!');
            log.info('  To migrate: Change BOT_MODE=webhook in .env and restart');
        } else {
            log.warn('⚠ Bot is NOT ready for webhook migration');
            if (!checks.webhookDomainConfigured) {
                log.warn('  - WEBHOOK_DOMAIN is not configured in .env');
            }
            if (!checks.localEndpointAccessible) {
                log.warn('  - Local webhook endpoint is not accessible');
            }
            if (!checks.externalEndpointAccessible) {
                log.warn('  - External webhook endpoint is not accessible');
            }
        }

        return {
            isReady,
            checks
        };
    }
}

export default new WebhookTester();
