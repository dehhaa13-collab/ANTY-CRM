/**
 * Google Apps Script для CRM автосервиса «Авто Холод».
 * 
 * ИНСТРУКЦИЯ ПО УСТАНОВКЕ:
 * 1. Открой Google Таблицу.
 * 2. Расширения → Apps Script
 * 3. Удали весь старый код и вставь этот файл целиком.
 * 4. Нажми «Развернуть» → «Новое развёртывание».
 *    - ЧТОБЫ ОБНОВИТЬ: Управление развертываниями → Редактировать(✏️) → Версия: Новая версия.
 * 
 * ПОСЛЕ ВСТАВКИ КОДА:
 * 1. Выбери функцию «setupMainSheet» и нажми ▶️ — она оформит основной лист.
 * 2. Затем выбери «createAnalytics» и нажми ▶️ — создаст лист аналитики.
 */

// =============================================
// КОНФИГУРАЦИЯ: порядок колонок
// =============================================

const HEADERS = [
  "№",                   // A — автонумерация
  "Дата и время",        // B
  "Имя клиента",         // C
  "Телефон",             // D
  "Марка авто",          // E
  "Госномер",            // F
  "VIN",                 // G
  "Пробег",              // H
  "Проблема",            // I
  "Выполненные работы",  // J
  "Сумма",               // K
  "Статус",              // L
  "Добавил"              // M
];

const DATA_SHEET_NAME = '📋 Заявки';

// =============================================
// ПРИЁМ ЗАЯВОК (doPost)
// =============================================

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(DATA_SHEET_NAME) || ss.getSheets()[0];

    // 1. Если лист пустой — ставим красивые заголовки
    if (sheet.getLastRow() === 0) {
      setupSheetHeaders_(sheet);
    }

    // 2. Объединяем даты
    let dateTime = data.date || '';
    // Если пришло из фото-режима — используем photoDate
    if (data.photoDate) dateTime = data.photoDate;
    // Если пришла visitDate — тоже подставляем
    if (data.visitDate && !dateTime) dateTime = data.visitDate;

    // 3. Номер строки
    const rowNum = sheet.getLastRow(); // строка номер (header = 1, первая запись = 2, значит номер = lastRow)

    // 4. Формируем строку данных в новом порядке
    const newRowData = [
      rowNum,                                 // A: №
      dateTime,                               // B: Дата и время
      data.name      || '',                   // C: Имя клиента
      data.phone     || '',                   // D: Телефон
      data.car       || '',                   // E: Марка авто
      data.plate ? "'" + data.plate : '',     // F: Госномер (как текст)
      data.vin ? "'" + data.vin : '',         // G: VIN (как текст)
      data.mileage   || '',                   // H: Пробег
      data.problem   || '',                   // I: Проблема
      data.works     || '',                   // J: Выполн. работы
      data.price     || '',                   // K: Сумма
      data.status    || 'Новая',              // L: Статус
      data.author    || ''                    // M: Добавил
    ];

    // 5. Добавляем строку
    sheet.appendRow(newRowData);
    
    const lastRow = sheet.getLastRow();
    const range = sheet.getRange(lastRow, 1, 1, HEADERS.length);

    // 6. Форматируем добавленную строку
    range.setFontFamily("Arial").setFontSize(11).setVerticalAlignment("middle");

    // Высота строки
    sheet.setRowHeight(lastRow, 32);

    // Чередование фонов (зебра)
    const zebra = lastRow % 2 === 0 ? '#f8fafc' : '#ffffff';
    range.setBackground(zebra);

    // Выравнивание
    sheet.getRange(lastRow, 1).setHorizontalAlignment("center").setFontColor('#94a3b8');  // №
    sheet.getRange(lastRow, 2).setHorizontalAlignment("center");  // Дата
    sheet.getRange(lastRow, 4).setHorizontalAlignment("center");  // Телефон
    sheet.getRange(lastRow, 6).setHorizontalAlignment("center").setFontWeight("bold");  // Госномер
    sheet.getRange(lastRow, 7).setHorizontalAlignment("center");  // VIN
    sheet.getRange(lastRow, 8).setHorizontalAlignment("center");  // Пробег
    sheet.getRange(lastRow, 11).setHorizontalAlignment("center").setFontWeight("bold");  // Сумма
    sheet.getRange(lastRow, 12).setHorizontalAlignment("center").setFontWeight("bold");  // Статус
    sheet.getRange(lastRow, 13).setHorizontalAlignment("center");  // Добавил

    // Wrap текст на длинных полях
    sheet.getRange(lastRow, 9).setWrapStrategy(SpreadsheetApp.WrapStrategy.WRAP);  // Проблема
    sheet.getRange(lastRow, 10).setWrapStrategy(SpreadsheetApp.WrapStrategy.WRAP); // Работы

    // Рамки (тонкие, светлые)
    range.setBorder(true, true, true, true, true, true, "#e2e8f0", SpreadsheetApp.BorderStyle.SOLID);
    
    // Покраска статуса
    paintStatus_(sheet.getRange(lastRow, 12), data.status || 'Новая');

    return ContentService
      .createTextOutput(JSON.stringify({ result: 'ok' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ result: 'error', message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// =============================================
// ПОКРАСКА СТАТУСА
// =============================================

function paintStatus_(cell, status) {
  if (status === 'Новая') {
    cell.setBackground("#dbeafe").setFontColor("#1d4ed8");
  } else if (status === 'В работе') {
    cell.setBackground("#fef3c7").setFontColor("#b45309");
  } else if (status === 'Завершено') {
    cell.setBackground("#d1fae5").setFontColor("#047857");
  } else {
    cell.setBackground("#ffffff").setFontColor("#334155");
  }
}

// =============================================
// КРАСИВАЯ ШАПКА + ОФОРМЛЕНИЕ (основной лист)
// =============================================

/**
 * Запусти эту функцию ОДИН раз — она оформит основной лист.
 * Данные не удаляются!
 */
function setupMainSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheets()[0];

  // Переименовываем лист
  sheet.setName(DATA_SHEET_NAME);

  setupSheetHeaders_(sheet);
  addConditionalFormatting_(sheet);
  addFilter_(sheet);
}

function setupSheetHeaders_(sheet) {
  // ---------- Заголовки ----------
  const headerRange = sheet.getRange(1, 1, 1, HEADERS.length);
  headerRange.setValues([HEADERS]);

  // Стиль заголовков: антрацитовый фон, белый жирный текст
  headerRange.setBackground("#0f172a");
  headerRange.setFontColor("#f1f5f9");
  headerRange.setFontWeight("bold");
  headerRange.setFontSize(11);
  headerRange.setFontFamily("Arial");
  headerRange.setHorizontalAlignment("center");
  headerRange.setVerticalAlignment("middle");

  // Увеличенная высота шапки
  sheet.setRowHeight(1, 40);

  // Закрепляем строку + 2 первые колонки
  sheet.setFrozenRows(1);
  sheet.setFrozenColumns(2);

  // ---------- Ширины колонок ----------
  sheet.setColumnWidth(1,  50);   // №
  sheet.setColumnWidth(2, 150);   // Дата и время
  sheet.setColumnWidth(3, 160);   // Имя клиента
  sheet.setColumnWidth(4, 140);   // Телефон
  sheet.setColumnWidth(5, 170);   // Марка авто
  sheet.setColumnWidth(6, 120);   // Госномер
  sheet.setColumnWidth(7, 170);   // VIN
  sheet.setColumnWidth(8, 100);   // Пробег
  sheet.setColumnWidth(9, 250);   // Проблема
  sheet.setColumnWidth(10, 280);  // Выполненные работы
  sheet.setColumnWidth(11, 110);  // Сумма
  sheet.setColumnWidth(12, 120);  // Статус
  sheet.setColumnWidth(13, 150);  // Добавил

  // Нижняя рамка шапки (двойная линия)
  headerRange.setBorder(null, null, true, null, null, null, "#334155", SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
}

// ---------- Условное форматирование статусов ----------

function addConditionalFormatting_(sheet) {
  // Очищаем старые правила
  sheet.clearConditionalFormatRules();

  const statusCol = sheet.getRange("L2:L1000");
  const rules = [];

  // Новая — голубой
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo("Новая")
    .setBackground("#dbeafe").setFontColor("#1d4ed8").setBold(true)
    .setRanges([statusCol]).build());

  // В работе — жёлтый
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo("В работе")
    .setBackground("#fef3c7").setFontColor("#b45309").setBold(true)
    .setRanges([statusCol]).build());

  // Завершено — зелёный
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo("Завершено")
    .setBackground("#d1fae5").setFontColor("#047857").setBold(true)
    .setRanges([statusCol]).build());

  // Зебра — чередование строк (для всех колонок)
  const allCols = sheet.getRange("A2:M1000");
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied("=ISEVEN(ROW())")
    .setBackground("#f8fafc")
    .setRanges([allCols]).build());

  sheet.setConditionalFormatRules(rules);
}

// ---------- Фильтр на все колонки ----------

function addFilter_(sheet) {
  // Убираем существующий фильтр если есть
  const existing = sheet.getFilter();
  if (existing) existing.remove();

  // Ставим фильтр на все колонки
  const lastRow = Math.max(sheet.getLastRow(), 2);
  const filterRange = sheet.getRange(1, 1, lastRow, HEADERS.length);
  filterRange.createFilter();
}

function doGet(e) {
  return ContentService
    .createTextOutput('CRM API v3 — Авто Холод. Листы: 📋 Заявки + 📊 Аналитика.')
    .setMimeType(ContentService.MimeType.TEXT);
}

// =============================================
// 📊 АНАЛИТИКА — автоматический лист
// =============================================

/**
 * Запусти эту функцию ОДИН РАЗ вручную из редактора скриптов (▶️),
 * чтобы создать лист аналитики.
 */
function createAnalytics() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const dataSheet = ss.getSheetByName(DATA_SHEET_NAME) || ss.getSheets()[0];
  setupAnalyticsSheet(ss, dataSheet.getName());
}

function setupAnalyticsSheet(ss, dataSheetName) {
  const SHEET_NAME = '📊 Аналитика';
  
  let old = ss.getSheetByName(SHEET_NAME);
  if (old) ss.deleteSheet(old);
  
  const s = ss.insertSheet(SHEET_NAME);
  const dn = dataSheetName;
  
  // Ширины колонок
  s.setColumnWidth(1, 40);
  s.setColumnWidth(2, 260);
  s.setColumnWidth(3, 180);
  s.setColumnWidth(4, 180);
  s.setColumnWidth(5, 180);
  s.setColumnWidth(6, 180);
  
  // Фон
  s.getRange('A1:F200').setBackground('#f8fafc').setFontFamily('Arial');
  
  let row = 1;
  
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
  
  // ===== БЛОК 1: ОБЩИЕ ПОКАЗАТЕЛИ =====
  // НОВЫЙ ПОРЯДОК: Дата = B, Имя = C, Проблема = I, Сумма = K, Статус = L, Добавил = M
  row = makeBlockHeader_(s, row, '📋  ОБЩИЕ ПОКАЗАТЕЛИ', '#1e40af', 5);
  
  const kpiLabels = ['Заявок сегодня', 'Заявок за неделю', 'Заявок за месяц', 'Уникальных клиентов'];
  const kpiFormulas = [
    '=SUMPRODUCT((LEFT(\'' + dn + '\'!B2:B,10)=TEXT(TODAY(),"DD.MM.YYYY"))*1)',
    '=SUMPRODUCT((IFERROR(DATEVALUE(MID(\'' + dn + '\'!B2:B,4,2)&"/"&LEFT(\'' + dn + '\'!B2:B,2)&"/"&MID(\'' + dn + '\'!B2:B,7,4)),0)>=TODAY()-WEEKDAY(TODAY(),2)+1)*(IFERROR(DATEVALUE(MID(\'' + dn + '\'!B2:B,4,2)&"/"&LEFT(\'' + dn + '\'!B2:B,2)&"/"&MID(\'' + dn + '\'!B2:B,7,4)),0)<=TODAY())*(\'' + dn + '\'!B2:B<>""))',
    '=SUMPRODUCT((MID(\'' + dn + '\'!B2:B,4,2)=TEXT(TODAY(),"MM"))*(MID(\'' + dn + '\'!B2:B,7,4)=TEXT(TODAY(),"YYYY"))*(\'' + dn + '\'!B2:B<>""))',
    '=IFERROR(SUMPRODUCT(((MID(\'' + dn + '\'!B2:B,4,2)=TEXT(TODAY(),"MM"))*(MID(\'' + dn + '\'!B2:B,7,4)=TEXT(TODAY(),"YYYY"))*(\'' + dn + '\'!C2:C<>""))/COUNTIFS(\'' + dn + '\'!C2:C,\'' + dn + '\'!C2:C,MID(\'' + dn + '\'!B2:B,4,2),TEXT(TODAY(),"MM"),MID(\'' + dn + '\'!B2:B,7,4),TEXT(TODAY(),"YYYY"))),0)'
  ];
  
  for (let i = 0; i < 4; i++) {
    s.getRange(row, 2 + i).setValue(kpiLabels[i]).setFontSize(12).setFontColor('#475569');
  }
  row++;
  
  for (let i = 0; i < 4; i++) {
    s.getRange(row, 2 + i).setFormula(kpiFormulas[i])
      .setFontSize(28).setFontWeight('bold').setFontColor('#1e293b')
      .setHorizontalAlignment('center').setNumberFormat('0');
  }
  s.setRowHeight(row, 50);
  row += 2;
  
  // ===== БЛОК 2: ВЫРУЧКА =====
  row = makeBlockHeader_(s, row, '💰  ВЫРУЧКА', '#047857', 5);
  
  const revLabels = ['Сегодня', 'За неделю', 'За месяц'];
  const revFormulas = [
    '=SUMPRODUCT((LEFT(\'' + dn + '\'!B2:B,10)=TEXT(TODAY(),"DD.MM.YYYY"))*(\'' + dn + '\'!K2:K))',
    '=SUMPRODUCT((IFERROR(DATEVALUE(MID(\'' + dn + '\'!B2:B,4,2)&"/"&LEFT(\'' + dn + '\'!B2:B,2)&"/"&MID(\'' + dn + '\'!B2:B,7,4)),0)>=TODAY()-WEEKDAY(TODAY(),2)+1)*(IFERROR(DATEVALUE(MID(\'' + dn + '\'!B2:B,4,2)&"/"&LEFT(\'' + dn + '\'!B2:B,2)&"/"&MID(\'' + dn + '\'!B2:B,7,4)),0)<=TODAY())*(\'' + dn + '\'!K2:K))',
    '=SUMPRODUCT((MID(\'' + dn + '\'!B2:B,4,2)=TEXT(TODAY(),"MM"))*(MID(\'' + dn + '\'!B2:B,7,4)=TEXT(TODAY(),"YYYY"))*(\'' + dn + '\'!K2:K))'
  ];
  
  for (let i = 0; i < 3; i++) {
    s.getRange(row, 2 + i).setValue(revLabels[i]).setFontSize(12).setFontColor('#475569');
  }
  row++;
  
  for (let i = 0; i < 3; i++) {
    s.getRange(row, 2 + i).setFormula(revFormulas[i])
      .setFontSize(28).setFontWeight('bold').setFontColor('#047857')
      .setHorizontalAlignment('center').setNumberFormat('#,##0');
  }
  s.setRowHeight(row, 50);
  row += 2;
  
  // ===== БЛОК 3: АКТИВНОСТЬ РАБОТНИКОВ =====
  row = makeBlockHeader_(s, row, '👷  АКТИВНОСТЬ РАБОТНИКОВ (за месяц)', '#7c3aed', 5);
  
  const wHeaders = ['Работник', 'Заявок', 'Завершено'];
  s.getRange(row, 2, 1, 3).setValues([wHeaders])
    .setBackground('#334155').setFontColor('#f8fafc').setFontWeight('bold')
    .setFontSize(12).setHorizontalAlignment('center');
  row++;
  
  const wStart = row;
  const workers = ['Влад Врабий', 'Олег Деде', 'Серёжа Деде', 'Лена Деде', 'Илья Степанов'];
  
  workers.forEach((name, i) => {
    const r = wStart + i;
    s.getRange(r, 2, 1, 3).setBackground(i % 2 === 0 ? '#f1f5f9' : '#ffffff');
    s.getRange(r, 2).setValue(name).setFontSize(12).setFontColor('#334155');
    
    // Заявок — колонка M = Добавил
    s.getRange(r, 3)
      .setFormula('=SUMPRODUCT((\'' + dn + '\'!M2:M="' + name + '")*(MID(\'' + dn + '\'!B2:B,4,2)=TEXT(TODAY(),"MM"))*(MID(\'' + dn + '\'!B2:B,7,4)=TEXT(TODAY(),"YYYY")))')
      .setFontSize(14).setFontWeight('bold').setHorizontalAlignment('center').setNumberFormat('0');
    
    // Завершено — L = Статус
    s.getRange(r, 4)
      .setFormula('=SUMPRODUCT((\'' + dn + '\'!M2:M="' + name + '")*(\'' + dn + '\'!L2:L="Завершено")*(MID(\'' + dn + '\'!B2:B,4,2)=TEXT(TODAY(),"MM"))*(MID(\'' + dn + '\'!B2:B,7,4)=TEXT(TODAY(),"YYYY")))')
      .setFontSize(14).setFontWeight('bold').setHorizontalAlignment('center').setNumberFormat('0');
  });
  
  s.getRange(wStart - 1, 2, workers.length + 1, 3)
    .setBorder(true, true, true, true, true, true, '#cbd5e1', SpreadsheetApp.BorderStyle.SOLID);
  
  row = wStart + workers.length + 1;
  
  // ===== БЛОК 4: ЧАСТЫЕ ПОЛОМКИ =====
  row = makeBlockHeader_(s, row, '🔧  ТОП-5 ЧАСТЫХ ПРОБЛЕМ (за месяц)', '#dc2626', 5);
  
  s.getRange(row, 2, 1, 2).setValues([['Проблема / Симптом', 'Количество']])
    .setBackground('#334155').setFontColor('#f8fafc').setFontWeight('bold')
    .setFontSize(12).setHorizontalAlignment('center');
  row++;
  
  const pStart = row;
  
  for (let i = 0; i < 5; i++) {
    const r = pStart + i;
    s.getRange(r, 2, 1, 2).setBackground(i % 2 === 0 ? '#f1f5f9' : '#ffffff');
    
    // Проблема = колонка I
    s.getRange(r, 2)
      .setFormula('=IFERROR(INDEX(SORTN(UNIQUE(FILTER(\'' + dn + '\'!I2:I, \'' + dn + '\'!I2:I<>"", MID(\'' + dn + '\'!B2:B,4,2)=TEXT(TODAY(),"MM"), MID(\'' + dn + '\'!B2:B,7,4)=TEXT(TODAY(),"YYYY"))), 5, 0, COUNTIF(FILTER(\'' + dn + '\'!I2:I, \'' + dn + '\'!I2:I<>"", MID(\'' + dn + '\'!B2:B,4,2)=TEXT(TODAY(),"MM"), MID(\'' + dn + '\'!B2:B,7,4)=TEXT(TODAY(),"YYYY")), UNIQUE(FILTER(\'' + dn + '\'!I2:I, \'' + dn + '\'!I2:I<>"", MID(\'' + dn + '\'!B2:B,4,2)=TEXT(TODAY(),"MM"), MID(\'' + dn + '\'!B2:B,7,4)=TEXT(TODAY(),"YYYY")))), ' + (i + 1) + '), "—")')
      .setFontSize(12).setFontColor('#334155').setWrapStrategy(SpreadsheetApp.WrapStrategy.WRAP);
    
    s.getRange(r, 3)
      .setFormula('=IFERROR(COUNTIFS(\'' + dn + '\'!I2:I, B' + r + ', MID(\'' + dn + '\'!B2:B,4,2), TEXT(TODAY(),"MM"), MID(\'' + dn + '\'!B2:B,7,4), TEXT(TODAY(),"YYYY")), "—")')
      .setFontSize(14).setFontWeight('bold').setHorizontalAlignment('center').setNumberFormat('0');
  }
  
  s.getRange(pStart - 1, 2, 6, 2)
    .setBorder(true, true, true, true, true, true, '#cbd5e1', SpreadsheetApp.BorderStyle.SOLID);
  
  row = pStart + 6;
  
  // Подпись
  s.getRange(row, 2, 1, 5).merge()
    .setValue('Данные обновляются автоматически на основе листа «📋 Заявки».')
    .setFontSize(10).setFontColor('#94a3b8').setFontStyle('italic')
    .setHorizontalAlignment('center');
  
  s.setFrozenRows(1);
  s.protect().setDescription('Аналитика — только для чтения').setWarningOnly(true);
  s.setHiddenGridlines(true);
}

function makeBlockHeader_(sheet, row, title, color, colSpan) {
  sheet.getRange(row, 2, 1, colSpan).merge().setValue(title)
    .setBackground(color).setFontColor('#ffffff')
    .setFontSize(13).setFontWeight('bold')
    .setHorizontalAlignment('left')
    .setVerticalAlignment('middle');
  sheet.setRowHeight(row, 36);
  return row + 1;
}
