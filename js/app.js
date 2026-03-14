/**
 * app.js — Основная логика приложения.
 * Связывает UI, парсер и отправку в Google Sheets.
 */

// ====== КОНФИГУРАЦИЯ ======
// Вставь сюда URL твоего Google Apps Script Web App
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzmo-DrXxAGzsXqNLS0ohEKY1M-PFo1zzfZlRB8dH2h0rMsJ-JNBNwhZD8l6060sE7Ylw/exec';
// ==========================

// --- Общие элементы ---
const statusEl = document.getElementById('status');

// --- Инициализация календаря ---
document.addEventListener('DOMContentLoaded', () => {
    if (typeof flatpickr !== 'undefined') {
        flatpickr('.date-picker-input', {
            locale: 'ru',
            dateFormat: 'd.m.Y',
            disableMobile: true, // чтобы на телефонах тоже был красивый UI, а не системное колесо
            allowInput: true
        });
    }
});

// --- Toggle ---
const toggleFree = document.getElementById('toggleFree');
const toggleManual = document.getElementById('toggleManual');
const toggleSlider = document.getElementById('toggleSlider');
const freeFormSection = document.getElementById('freeFormSection');
const manualFormSection = document.getElementById('manualFormSection');

toggleFree.addEventListener('click', () => switchMode('free'));
toggleManual.addEventListener('click', () => switchMode('manual'));

function switchMode(mode) {
    hideStatus();
    if (mode === 'free') {
        toggleFree.classList.add('active');
        toggleManual.classList.remove('active');
        toggleSlider.classList.remove('right');
        freeFormSection.classList.remove('hidden');
        manualFormSection.classList.add('hidden');
    } else {
        toggleFree.classList.remove('active');
        toggleManual.classList.add('active');
        toggleSlider.classList.add('right');
        freeFormSection.classList.add('hidden');
        manualFormSection.classList.remove('hidden');
    }
}

// =============================================
// AUTO-UPPERCASE для номера авто
// =============================================
const manualPlateInput = document.getElementById('manualPlate');
if (manualPlateInput) {
    manualPlateInput.addEventListener('input', function() {
        const pos = this.selectionStart;
        this.value = this.value.toUpperCase();
        this.setSelectionRange(pos, pos);
    });
}

// =============================================
// ВОЛЬНАЯ ФОРМА (ИИ парсинг)
// =============================================

const inputText = document.getElementById('inputText');
const parseBtn = document.getElementById('parseBtn');
const addBtn = document.getElementById('addBtn');
const preview = document.getElementById('preview');
const previewWarning = document.getElementById('previewWarning');

const previewName = document.getElementById('previewName');
const previewPhone = document.getElementById('previewPhone');
const previewCar = document.getElementById('previewCar');
const previewPlate = document.getElementById('previewPlate');
const previewProblem = document.getElementById('previewProblem');
const previewDate = document.getElementById('previewDate');
const previewPrice = document.getElementById('previewPrice');

const previewFields = [
    { input: previewName, wrapper: document.getElementById('fieldName'), key: 'name' },
    { input: previewPhone, wrapper: document.getElementById('fieldPhone'), key: 'phone' },
    { input: previewCar, wrapper: document.getElementById('fieldCar'), key: 'car' },
    { input: previewPlate, wrapper: document.getElementById('fieldPlate'), key: 'plate' },
    { input: previewProblem, wrapper: document.getElementById('fieldProblem'), key: 'problem' },
    { input: previewDate, wrapper: document.getElementById('fieldDate'), key: 'visitDate' },
    { input: previewPrice, wrapper: document.getElementById('fieldPrice'), key: 'price' },
];

// --- Живой парсинг при вводе (с дебаунсом) ---
let debounceTimer = null;
inputText.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        const text = inputText.value.trim();
        if (!text) {
            preview.classList.add('hidden');
            return;
        }
        const parsed = parseText(text);
        showPreview(parsed);
    }, 400);
});

// --- Кнопка "Распознать" ---
parseBtn.addEventListener('click', () => {
    const text = inputText.value.trim();
    if (!text) return;

    const parsed = parseText(text);
    showPreview(parsed);

    // Прокрутим к превью
    preview.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
});

function updatePreviewStatus(status) {
    const badge = document.getElementById('previewStatusBadge');
    if (!badge) return;

    badge.textContent = (status === 'В работе' ? '🟡 ' : status === 'Завершено' ? '🟢 ' : '🔵 ') + status;
    
    // Снимаем старые классы
    badge.className = 'preview-status';
    
    // Добавляем специфичный класс если нужно (в CSS я сделал общие стили для синего, 
    // давай добавим вариации в CSS или будем менять инлайном)
    // Лучше добавим классы в CSS
    badge.classList.add('status-' + (status === 'В работе' ? 'working' : status === 'Завершено' ? 'done' : 'new'));
    
    // Маленькая анимация
    badge.style.transform = 'scale(1.1)';
    setTimeout(() => badge.style.transform = 'scale(1)', 200);
}

function showPreview(data) {
    previewName.value = data.name || '';
    previewPhone.value = data.phone || '';
    previewCar.value = data.car || '';
    previewPlate.value = data.plate || '';
    previewProblem.value = data.problem || '';
    previewDate.value = data.visitDate || '';
    previewPrice.value = data.price || '';

    // По умолчанию всегда "Новая" для вольной формы
    updatePreviewStatus('Новая');

    highlightEmptyFields();
    preview.classList.remove('hidden');
}

function highlightEmptyFields() {
    let hasEmpty = false;

    for (const field of previewFields) {
        if (!field.input.value.trim()) {
            field.wrapper.classList.add('preview-field--empty');
            hasEmpty = true;
        } else {
            field.wrapper.classList.remove('preview-field--empty');
        }
    }

    if (hasEmpty) {
        previewWarning.classList.remove('hidden');
    } else {
        previewWarning.classList.add('hidden');
    }
}

// Убираем подсветку при вводе в поле
for (const field of previewFields) {
    field.input.addEventListener('input', () => {
        if (field.input.value.trim()) {
            field.wrapper.classList.remove('preview-field--empty');
        }
        highlightEmptyFields();
    });
}

// --- Кнопка "Добавить в таблицу" (вольная форма) ---
addBtn.addEventListener('click', async () => {
    // Читаем данные из редактируемого превью (не из парсера!)
    const phoneVal = previewPhone.value.trim();
    const payload = {
        date: formatDate(new Date()),
        name: previewName.value.trim(),
        phone: phoneVal ? "'" + phoneVal : "",
        car: previewCar.value.trim(),
        plate: previewPlate.value.trim().toUpperCase(),
        problem: previewProblem.value.trim(),
        visitDate: previewDate.value.trim(),
        price: previewPrice.value.trim(),
        status: 'Новая',
    };

    const success = await sendToSheet(payload, addBtn);
    if (success) {
        inputText.value = '';
        preview.classList.add('hidden');
        // Очищаем поля превью
        for (const field of previewFields) {
            field.input.value = '';
            field.wrapper.classList.remove('preview-field--empty');
        }
        previewWarning.classList.add('hidden');
    }
});

// =============================================
// РУЧНОЙ ВВОД
// =============================================

let manualStatusValue = 'Новая';
const manualStatusBtns = document.querySelectorAll('#manualStatusToggle .status-btn');

manualStatusBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        if (btn.classList.contains('active')) return;
        
        manualStatusBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        manualStatusValue = btn.dataset.status;
        
        // Эффект "нажатия"
        btn.style.transform = 'scale(0.95)';
        setTimeout(() => btn.style.transform = 'scale(1.02)', 100);
    });
});

const addBtnManual = document.getElementById('addBtnManual');

addBtnManual.addEventListener('click', async () => {
    const name = document.getElementById('manualName').value.trim();
    const phone = document.getElementById('manualPhone').value.trim();
    const car = document.getElementById('manualCar').value.trim();
    const plate = document.getElementById('manualPlate').value.trim().toUpperCase();
    const problem = document.getElementById('manualProblem').value.trim();
    const visitDateRaw = document.getElementById('manualVisitDate').value;
    const price = document.getElementById('manualPrice').value.trim();
    const statusVal = manualStatusValue;

    // Хотя бы одно поле должно быть заполнено
    if (!name && !phone && !car && !problem) {
        showStatus('error', 'Заполните хотя бы одно поле');
        return;
    }

    // Берём дату как есть (Она уже в формате dd.mm.yyyy из-за Flatpickr)
    let visitDate = visitDateRaw;

    const payload = {
        date: formatDate(new Date()),
        name: name,
        phone: phone ? "'" + phone : "",
        car: car,
        plate: plate,
        problem: problem,
        visitDate: visitDate,
        price: price,
        status: statusVal,
    };

    const success = await sendToSheet(payload, addBtnManual);
    if (success) {
        document.getElementById('manualName').value = '';
        document.getElementById('manualPhone').value = '';
        document.getElementById('manualCar').value = '';
        document.getElementById('manualPlate').value = '';
        document.getElementById('manualProblem').value = '';
        document.getElementById('manualVisitDate').value = '';
        document.getElementById('manualPrice').value = '';
        
        // Сброс статуса
        manualStatusValue = 'Новая';
        manualStatusBtns.forEach(b => {
            if (b.dataset.status === 'Новая') b.classList.add('active');
            else b.classList.remove('active');
        });
    }
});

// =============================================
// ОБЩИЕ ФУНКЦИИ
// =============================================

async function sendToSheet(payload, button) {
    if (!GOOGLE_SCRIPT_URL) {
        showStatus('error', 'Google Script URL не настроен. Откройте app.js и укажите GOOGLE_SCRIPT_URL.');
        return false;
    }

    const originalText = button.textContent;
    button.disabled = true;
    button.textContent = 'Отправка...';
    hideStatus();
    showLoading('Отправка данных…');

    try {
        // Смена текста через 1.5с для визуального фидбека
        const textTimer = setTimeout(() => {
            setLoadingText('Добавляем в таблицу…');
        }, 1500);

        // Минимальное время показа загрузки (1.2с) + реальный запрос
        const minDelay = new Promise(r => setTimeout(r, 1200));

        await Promise.all([
            fetch(GOOGLE_SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            }),
            minDelay,
        ]);

        clearTimeout(textTimer);
        setLoadingText('Готово! ✓');

        // Короткая задержка чтобы пользователь увидел "Готово"
        await new Promise(r => setTimeout(r, 700));

        showStatus('success', 'Заявка добавлена в таблицу');
        return true;

    } catch (err) {
        showStatus('error', 'Ошибка: ' + err.message);
        return false;
    } finally {
        hideLoading();
        button.disabled = false;
        button.textContent = originalText;
    }
}

function showLoading(text) {
    const overlay = document.getElementById('loadingOverlay');
    const loadingText = document.getElementById('loadingText');
    loadingText.textContent = text || 'Загрузка…';
    overlay.classList.remove('hidden');
}

function setLoadingText(text) {
    document.getElementById('loadingText').textContent = text;
}

function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    overlay.classList.add('hidden');
}

function showStatus(type, message) {
    statusEl.textContent = message;
    statusEl.className = 'status ' + type;
    statusEl.classList.remove('hidden');
}

function hideStatus() {
    statusEl.classList.add('hidden');
}
