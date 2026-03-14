/**
 * Google Apps Script для CRM автосервиса.
 * 
 * ИНСТРУКЦИЯ ПО УСТАНОВКЕ:
 * 
 * 1. Создай Google Таблицу с колонками в первой строке:
 *    Дата заявки | Имя | Телефон | Авто | Номер авто | Проблема | Оставлено денег | Дата визита | Статус
 * 
 * 2. Открой: Расширения → Apps Script
 * 
 * 3. Удали весь код и вставь этот файл целиком
 * 
 * 4. Нажми «Развернуть» → «Новое развёртывание»
 *    - Тип: Веб-приложение
 *    - Выполнять как: Я
 *    - Доступ: Все
 * 
 * 5. Скопируй URL развёртывания и вставь его в app.js:
 *    const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/xxxxx/exec';
 * 
 * 6. Готово!
 */

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

    sheet.appendRow([
      data.date      || '',   // Дата заявки
      data.name      || '',   // Имя
      data.phone     || '',   // Телефон
      data.car       || '',   // Авто
      data.plate ? "'" + data.plate : '',  // Номер авто (как текст)
      data.problem   || '',   // Проблема
      data.price     || '',   // Оставлено денег
      data.visitDate || '',   // Дата визита
      data.status    || 'Новая', // Статус
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ result: 'ok' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ result: 'error', message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService
    .createTextOutput('CRM API работает')
    .setMimeType(ContentService.MimeType.TEXT);
}
