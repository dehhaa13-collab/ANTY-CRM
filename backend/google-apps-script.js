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
  "Цена (Итог)",        // L
  "Добавил"              // M
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
      data.price     || '',   // L: Цена
      data.author    || ''    // M: Добавил
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
    sheet.getRange(lastRowIndex, 13).setHorizontalAlignment("center"); // Добавил
    
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
  sheet.setColumnWidth(13, 140); // Добавил
}

function doGet(e) {
  return ContentService
    .createTextOutput('CRM API работает. Версия с аналитикой.')
    .setMimeType(ContentService.MimeType.TEXT);
}

// =============================================
// 📊 АНАЛИТИКА — автоматический лист
// =============================================

/**
 * Запусти эту функцию ОДИН РАЗ вручную из редактора скриптов (▶️),
 * чтобы создать лист аналитики. Или он создастся сам при первой заявке.
 */
function createAnalytics() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const dataSheet = ss.getSheets()[0];
  setupAnalyticsSheet(ss, dataSheet.getName());
}

function setupAnalyticsSheet(ss, dataSheetName) {
  const SHEET_NAME = '📊 Аналитика';
  
  // Удаляем старый лист аналитики, если есть (пересоздаём)
  let old = ss.getSheetByName(SHEET_NAME);
  if (old) ss.deleteSheet(old);
  
  const s = ss.insertSheet(SHEET_NAME);
  
  // Ширины колонок
  s.setColumnWidth(1, 40);   // отступ
  s.setColumnWidth(2, 260);
  s.setColumnWidth(3, 180);
  s.setColumnWidth(4, 180);
  s.setColumnWidth(5, 180);
  s.setColumnWidth(6, 180);
  
  // Фон всего листа
  s.getRange('A1:F200').setBackground('#f8fafc').setFontFamily('Arial');
  
  let row = 1;
  const dn = dataSheetName; // имя листа с данными
  
  // ========== ЗАГОЛОВОК ==========
  s.getRange(row, 2, 1, 5).merge()
    .setValue('❄️ Авто Холод CRM — Аналитика')
    .setFontSize(20).setFontWeight('bold').setFontColor('#1e293b')
    .setHorizontalAlignment('center').setVerticalAlignment('middle');
  s.setRowHeight(row, 50);
  row += 1;
  
  s.getRange(row, 2, 1, 5).merge()
    .setValue('Данные обновляются автоматически')
    .setFontSize(11).setFontColor('#94a3b8')
    .setHorizontalAlignment('center');
  row += 2;
  
  // ========== БЛОК 1: ОБЩИЕ ПОКАЗАТЕЛИ ==========
  row = makeBlockHeader(s, row, '📋  ОБЩИЕ ПОКАЗАТЕЛИ', '#1e40af', 5);
  
  const kpiLabels = ['Заявок сегодня', 'Заявок за неделю', 'Заявок за месяц', 'Уникальных клиентов (месяц)'];
  const kpiFormulas = [
    // Сегодня: дата в формате DD.MM.YYYY совпадает с TODAY
    '=SUMPRODUCT((LEFT(\'' + dn + '\'!A2:A, 10)=TEXT(TODAY(),"DD.MM.YYYY"))*1)',
    // Неделя: дата >= начало недели 
    '=SUMPRODUCT((DATEVALUE(MID(\'' + dn + '\'!A2:A,4,2)&"/"&LEFT(\'' + dn + '\'!A2:A,2)&"/"&MID(\'' + dn + '\'!A2:A,7,4))>=TODAY()-WEEKDAY(TODAY(),2)+1)*(DATEVALUE(MID(\'' + dn + '\'!A2:A,4,2)&"/"&LEFT(\'' + dn + '\'!A2:A,2)&"/"&MID(\'' + dn + '\'!A2:A,7,4))<=TODAY())*(\'' + dn + '\'!A2:A<>""))',
    // Месяц: месяц и год совпадают
    '=SUMPRODUCT((MID(\'' + dn + '\'!A2:A,4,2)=TEXT(TODAY(),"MM"))*(MID(\'' + dn + '\'!A2:A,7,4)=TEXT(TODAY(),"YYYY"))*(\'' + dn + '\'!A2:A<>""))',
    // Уникальные клиенты за месяц (по имени) 
    '=IFERROR(SUMPRODUCT(((MID(\'' + dn + '\'!A2:A,4,2)=TEXT(TODAY(),"MM"))*(MID(\'' + dn + '\'!A2:A,7,4)=TEXT(TODAY(),"YYYY"))*(\'' + dn + '\'!D2:D<>""))/COUNTIFS(\'' + dn + '\'!D2:D,\'' + dn + '\'!D2:D,MID(\'' + dn + '\'!A2:A,4,2),TEXT(TODAY(),"MM"),MID(\'' + dn + '\'!A2:A,7,4),TEXT(TODAY(),"YYYY"))),0)'
  ];
  
  // Подписи
  s.getRange(row, 2).setValue(kpiLabels[0]).setFontSize(12).setFontColor('#475569');
  s.getRange(row, 3).setValue(kpiLabels[1]).setFontSize(12).setFontColor('#475569');
  s.getRange(row, 4).setValue(kpiLabels[2]).setFontSize(12).setFontColor('#475569');
  s.getRange(row, 5).setValue(kpiLabels[3]).setFontSize(12).setFontColor('#475569');
  row++;
  
  // Значения (крупные)
  for (let i = 0; i < 4; i++) {
    s.getRange(row, 2 + i)
      .setFormula(kpiFormulas[i])
      .setFontSize(28).setFontWeight('bold').setFontColor('#1e293b')
      .setHorizontalAlignment('center')
      .setNumberFormat('0');
  }
  s.setRowHeight(row, 50);
  row += 2;
  
  // ========== БЛОК 2: ВЫРУЧКА ==========
  row = makeBlockHeader(s, row, '💰  ВЫРУЧКА', '#047857', 5);
  
  const revLabels = ['Сегодня', 'За неделю', 'За месяц'];
  const revFormulas = [
    // Сумма за сегодня
    '=SUMPRODUCT((LEFT(\'' + dn + '\'!A2:A,10)=TEXT(TODAY(),"DD.MM.YYYY"))*(\'' + dn + '\'!L2:L))',
    // Сумма за неделю
    '=SUMPRODUCT((DATEVALUE(MID(\'' + dn + '\'!A2:A,4,2)&"/"&LEFT(\'' + dn + '\'!A2:A,2)&"/"&MID(\'' + dn + '\'!A2:A,7,4))>=TODAY()-WEEKDAY(TODAY(),2)+1)*(DATEVALUE(MID(\'' + dn + '\'!A2:A,4,2)&"/"&LEFT(\'' + dn + '\'!A2:A,2)&"/"&MID(\'' + dn + '\'!A2:A,7,4))<=TODAY())*(\'' + dn + '\'!L2:L))',
    // Сумма за месяц
    '=SUMPRODUCT((MID(\'' + dn + '\'!A2:A,4,2)=TEXT(TODAY(),"MM"))*(MID(\'' + dn + '\'!A2:A,7,4)=TEXT(TODAY(),"YYYY"))*(\'' + dn + '\'!L2:L))'
  ];
  
  s.getRange(row, 2).setValue(revLabels[0]).setFontSize(12).setFontColor('#475569');
  s.getRange(row, 3).setValue(revLabels[1]).setFontSize(12).setFontColor('#475569');
  s.getRange(row, 4).setValue(revLabels[2]).setFontSize(12).setFontColor('#475569');
  row++;
  
  for (let i = 0; i < 3; i++) {
    s.getRange(row, 2 + i)
      .setFormula(revFormulas[i])
      .setFontSize(28).setFontWeight('bold').setFontColor('#047857')
      .setHorizontalAlignment('center')
      .setNumberFormat('#,##0');
  }
  s.setRowHeight(row, 50);
  row += 2;
  
  // ========== БЛОК 3: АКТИВНОСТЬ РАБОТНИКОВ ==========
  row = makeBlockHeader(s, row, '👷  АКТИВНОСТЬ РАБОТНИКОВ (за месяц)', '#7c3aed', 5);
  
  // Таблица заголовков
  const workerHeaders = ['Работник', 'Заявок', 'Завершено'];
  const wHeaderRange = s.getRange(row, 2, 1, 3);
  wHeaderRange.setValues([workerHeaders]);
  wHeaderRange.setBackground('#334155').setFontColor('#f8fafc').setFontWeight('bold')
    .setFontSize(12).setHorizontalAlignment('center');
  row++;
  
  // Динамическая формула: sort unique workers
  // Используем SORT + UNIQUE и COUNTIFS
  const workerStartRow = row;
  const workers = ['Влад Врабий', 'Олег Деде', 'Серёжа Деде', 'Лена Деде', 'Илья Степанов'];
  
  workers.forEach((name, i) => {
    const r = workerStartRow + i;
    const bgColor = i % 2 === 0 ? '#f1f5f9' : '#ffffff';
    s.getRange(r, 2, 1, 3).setBackground(bgColor);
    
    s.getRange(r, 2).setValue(name).setFontSize(12).setFontColor('#334155');
    
    // Количество заявок за месяц  
    s.getRange(r, 3)
      .setFormula('=SUMPRODUCT((\'' + dn + '\'!M2:M="' + name + '")*(MID(\'' + dn + '\'!A2:A,4,2)=TEXT(TODAY(),"MM"))*(MID(\'' + dn + '\'!A2:A,7,4)=TEXT(TODAY(),"YYYY")))')
      .setFontSize(14).setFontWeight('bold').setHorizontalAlignment('center').setNumberFormat('0');
    
    // Количество завершённых за месяц
    s.getRange(r, 4)
      .setFormula('=SUMPRODUCT((\'' + dn + '\'!M2:M="' + name + '")*(\'' + dn + '\'!B2:B="Завершено")*(MID(\'' + dn + '\'!A2:A,4,2)=TEXT(TODAY(),"MM"))*(MID(\'' + dn + '\'!A2:A,7,4)=TEXT(TODAY(),"YYYY")))')
      .setFontSize(14).setFontWeight('bold').setHorizontalAlignment('center').setNumberFormat('0');
  });
  
  // Рамки таблицы
  s.getRange(workerStartRow - 1, 2, workers.length + 1, 3)
    .setBorder(true, true, true, true, true, true, '#cbd5e1', SpreadsheetApp.BorderStyle.SOLID);
  
  row = workerStartRow + workers.length + 1;
  
  // ========== БЛОК 4: ЧАСТЫЕ ПОЛОМКИ ==========
  row = makeBlockHeader(s, row, '🔧  ТОП-5 ЧАСТЫХ ПРОБЛЕМ (за месяц)', '#dc2626', 5);
  
  const probHeaders = ['Проблема / Симптом', 'Количество'];
  const pHeaderRange = s.getRange(row, 2, 1, 2);
  pHeaderRange.setValues([probHeaders]);
  pHeaderRange.setBackground('#334155').setFontColor('#f8fafc').setFontWeight('bold')
    .setFontSize(12).setHorizontalAlignment('center');
  row++;
  
  // Для топ-5 проблем нужно использовать вспомогательную логику
  // Формулы SORTN + UNIQUE + COUNTIF через ArrayFormula (Google Sheets specific)
  // Используем формулу QUERY для динамического получения топ-5
  const probStartRow = row;
  
  for (let i = 0; i < 5; i++) {
    const r = probStartRow + i;
    const bgColor = i % 2 === 0 ? '#f1f5f9' : '#ffffff';
    s.getRange(r, 2, 1, 2).setBackground(bgColor);
    
    // QUERY формула для получения i-й самой частой проблемы за текущий месяц
    // Используем INDEX + MATCH + LARGE подход
    s.getRange(r, 2)
      .setFormula('=IFERROR(INDEX(SORTN(UNIQUE(FILTER(\'' + dn + '\'!J2:J, \'' + dn + '\'!J2:J<>"", MID(\'' + dn + '\'!A2:A,4,2)=TEXT(TODAY(),"MM"), MID(\'' + dn + '\'!A2:A,7,4)=TEXT(TODAY(),"YYYY"))), 5, 0, COUNTIF(FILTER(\'' + dn + '\'!J2:J, \'' + dn + '\'!J2:J<>"", MID(\'' + dn + '\'!A2:A,4,2)=TEXT(TODAY(),"MM"), MID(\'' + dn + '\'!A2:A,7,4)=TEXT(TODAY(),"YYYY")), UNIQUE(FILTER(\'' + dn + '\'!J2:J, \'' + dn + '\'!J2:J<>"", MID(\'' + dn + '\'!A2:A,4,2)=TEXT(TODAY(),"MM"), MID(\'' + dn + '\'!A2:A,7,4)=TEXT(TODAY(),"YYYY")))), ' + (i + 1) + '), "—")')
      .setFontSize(12).setFontColor('#334155').setWrapStrategy(SpreadsheetApp.WrapStrategy.WRAP);
    
    s.getRange(r, 3)
      .setFormula('=IFERROR(COUNTIFS(\'' + dn + '\'!J2:J, B' + r + ', MID(\'' + dn + '\'!A2:A,4,2), TEXT(TODAY(),"MM"), MID(\'' + dn + '\'!A2:A,7,4), TEXT(TODAY(),"YYYY")), "—")')
      .setFontSize(14).setFontWeight('bold').setHorizontalAlignment('center').setNumberFormat('0');
  }
  
  s.getRange(probStartRow - 1, 2, 6, 2)
    .setBorder(true, true, true, true, true, true, '#cbd5e1', SpreadsheetApp.BorderStyle.SOLID);
  
  row = probStartRow + 6;
  
  // Подпись внизу
  s.getRange(row, 2, 1, 5).merge()
    .setValue('Данные обновляются автоматически на основе заявок из основного листа.')
    .setFontSize(10).setFontColor('#94a3b8').setFontStyle('italic')
    .setHorizontalAlignment('center');
  
  // Закрепляем первую строку
  s.setFrozenRows(1);
  
  // Защита листа от редактирования (предупреждение)
  const protection = s.protect().setDescription('Аналитика — только для чтения');
  protection.setWarningOnly(true);
  
  // Скрыть сетку для красоты
  s.setHiddenGridlines(true);
}

// Вспомогательная: красивый заголовок блока
function makeBlockHeader(sheet, row, title, color, colSpan) {
  const range = sheet.getRange(row, 2, 1, colSpan);
  range.merge().setValue(title)
    .setBackground(color).setFontColor('#ffffff')
    .setFontSize(13).setFontWeight('bold')
    .setHorizontalAlignment('left')
    .setVerticalAlignment('middle');
  sheet.setRowHeight(row, 36);
  
  // Скруглённые углы имитируем через чистые нижние строки
  return row + 1;
}
