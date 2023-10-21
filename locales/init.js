import i18next from 'i18next';

import fs from 'fs/promises'
import log from "../logging/logging.js";

const ruTranslation = JSON.parse(String(await fs.readFile('locales/ru.json')));
const kzTranslation = JSON.parse(String(await fs.readFile('locales/kz.json')));

export async function i18nextInit(){
    await i18next.init({
        lng: 'ru', // Устанавливаем язык по умолчанию
        resources: {
            ru: {translation: ruTranslation},
            kz: {translation: kzTranslation},
            // Другие языковые ресурсы по мере необходимости
        },
    })
    log.info("i18next инициализирован!")
}