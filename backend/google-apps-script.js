/**
 * Google Apps Script для CRM автосервиса.
 * 
 * ИНСТРУКЦИЯ ПО УСТАНОВКЕ:
 * 1. Открой Google Таблицу.
 * 2. Расширения → Apps Script
 * 3. Удали весь старый код и вставь этот файл целиком.
 * 4. Нажми «Развернуть» → «Новое развёртывание» (обязательно НОВОЕ, а не просто сохранить).
 *    - ЧТОБЫ ОБНОВИТЬ СКРИПТ: Выбирай Управление развертываниями -> Редактировать(карандаш) -> Версия: Новая версия.
 * 
 * ВАЖНО: При поступлении первой заявки скрипт сам создаст красивые заголовки таблицы, если их нет!
 */

const HEADERS = [
  "Дата создания",      // A
  "Статус",             // B
  "Дата визита",        // C
  "Имя клиента",        // D
  "Телефон",            // E
  "Марка и модель",     // F
  "Госномер",           // G
  "VIN номер",          // H
  "Пробег",             // I
  "Симптомы / Проблема",// J
  "Выполненные работы", // K
  "Цена (Итог)"         // L
];

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

    // 1. Создаем красивые заголовки, если таблица пустая
    if (sheet.getLastRow() === 0) {
      setupSheetHeaders(sheet);
    }

    // 2. Объединяем Дату визита (ручной/вольный) с Дата/Время из ИИ по фото
    let finalVisitDate = data.visitDate || data.photoDate || '';

    // 3. Формируем строку данных в правильном порядке
    const newRowData = [
      data.date      || '',   // A: Дата создания
      data.status    || 'Новая', // B: Статус
      finalVisitDate,         // C: Дата визита
      data.name      || '',   // D: Имя
      data.phone     || '',   // E: Телефон
      data.car       || '',   // F: Авто
      data.plate ? "'" + data.plate : '',  // G: Госномер (как текст)
      data.vin ? "'" + data.vin : '',      // H: VIN (как текст)
      data.mileage   || '',   // I: Пробег
      data.problem   || '',   // J: Проблема
      data.works     || '',   // K: Выполненные работы
      data.price     || ''    // L: Цена
    ];

    // 4. Добавляем строку
    sheet.appendRow(newRowData);
    
    const lastRowIndex = sheet.getLastRow();
    const range = sheet.getRange(lastRowIndex, 1, 1, HEADERS.length);

    // 5. Форматируем добавленную строку (красивый вид)
    // Шрифты и выравнивание
    range.setFontFamily("Arial");
    range.setFontSize(11);
    range.setVerticalAlignment("middle");
    
    // Выравнивание конкретных ячеек
    sheet.getRange(lastRowIndex, 1).setHorizontalAlignment("center"); // Дата создания
    sheet.getRange(lastRowIndex, 2).setHorizontalAlignment("center").setFontWeight("bold"); // Статус
    sheet.getRange(lastRowIndex, 3).setHorizontalAlignment("center"); // Дата визита
    sheet.getRange(lastRowIndex, 5).setHorizontalAlignment("center"); // Телефон
    sheet.getRange(lastRowIndex, 7).setHorizontalAlignment("center").setFontWeight("bold"); // Госномер
    sheet.getRange(lastRowIndex, 8).setHorizontalAlignment("center"); // VIN
    sheet.getRange(lastRowIndex, 12).setHorizontalAlignment("center").setFontWeight("bold"); // Цена
    
    // Оборачивание текста (Wrap) для многострочных полей
    sheet.getRange(lastRowIndex, 10).setWrapStrategy(SpreadsheetApp.WrapStrategy.WRAP); // Проблема
    sheet.getRange(lastRowIndex, 11).setWrapStrategy(SpreadsheetApp.WrapStrategy.WRAP); // Работы

    // Рамки (Borders - светло-серые, тонкие)
    range.setBorder(true, true, true, true, true, true, "#e2e8f0", SpreadsheetApp.BorderStyle.SOLID);
    
    // Красим статус разными цветами для наглядности (если он пришел "Новая" и т.п.)
    updateStatusColor(sheet.getRange(lastRowIndex, 2), data.status);

    return ContentService
      .createTextOutput(JSON.stringify({ result: 'ok' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ result: 'error', message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Покраска статуса
function updateStatusColor(cell, status) {
  if (status === 'Новая') {
    cell.setBackground("#eff6ff").setFontColor("#2563eb");
  } else if (status === 'В работе') {
    cell.setBackground("#fffbeb").setFontColor("#d97706");
  } else if (status === 'Завершено') {
    cell.setBackground("#ecfdf5").setFontColor("#059669");
  } else {
    cell.setBackground("#ffffff").setFontColor("#333333");
  }
}

// Создание красивых заголовков и настройка ширин колонок
function setupSheetHeaders(sheet) {
  // Заголовки
  const headerRange = sheet.getRange(1, 1, 1, HEADERS.length);
  headerRange.setValues([HEADERS]);
  
  // Оформляем заголовки: темно-синий фон, белый жирный текст
  headerRange.setBackground("#1e293b");
  headerRange.setFontColor("#f8fafc");
  headerRange.setFontWeight("bold");
  headerRange.setFontSize(12);
  headerRange.setHorizontalAlignment("center");
  headerRange.setVerticalAlignment("middle");
  
  // Закрепляем первую строку (чтобы при скролле вниз заголовки оставались на месте)
  sheet.setFrozenRows(1);
  
  // Настраиваем ширину колонок для красоты
  sheet.setColumnWidth(1, 130); // Дата
  sheet.setColumnWidth(2, 130); // Статус
  sheet.setColumnWidth(3, 130); // Дата визита
  sheet.setColumnWidth(4, 160); // Имя
  sheet.setColumnWidth(5, 140); // Телефон
  sheet.setColumnWidth(6, 180); // Марка
  sheet.setColumnWidth(7, 120); // Госномер
  sheet.setColumnWidth(8, 160); // VIN
  sheet.setColumnWidth(9, 120); // Пробег
  sheet.setColumnWidth(10, 250); // Проблема (широкая)
  sheet.setColumnWidth(11, 280); // Работы (широкая)
  sheet.setColumnWidth(12, 120); // Цена
}

function doGet(e) {
  return ContentService
    .createTextOutput('CRM API работает. Версия с умным форматированием.')
    .setMimeType(ContentService.MimeType.TEXT);
}
