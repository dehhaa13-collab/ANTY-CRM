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

// ====== GROQ API KEY ======
const GROQ_API_KEY = 'gsk_PASTE_YOUR_API_KEY_HERE'; // <-- Вставь свой Groq API Key
// ==========================

// --- Toggle (3 режима) ---
const toggleFree = document.getElementById('toggleFree');
const togglePhoto = document.getElementById('togglePhoto');
const toggleManual = document.getElementById('toggleManual');
const toggleSlider = document.getElementById('toggleSlider');
const freeFormSection = document.getElementById('freeFormSection');
const photoFormSection = document.getElementById('photoFormSection');
const manualFormSection = document.getElementById('manualFormSection');

const toggleBtns = [toggleFree, togglePhoto, toggleManual];
const sections = [freeFormSection, photoFormSection, manualFormSection];

toggleFree.addEventListener('click', () => switchMode('free'));
togglePhoto.addEventListener('click', () => switchMode('photo'));
toggleManual.addEventListener('click', () => switchMode('manual'));

function switchMode(mode) {
    hideStatus();
    const modeMap = { free: 0, photo: 1, manual: 2 };
    const idx = modeMap[mode] ?? 0;

    // Slider position
    toggleSlider.className = 'toggle-slider pos-' + idx;

    // Active button
    toggleBtns.forEach((btn, i) => {
        btn.classList.toggle('active', i === idx);
    });

    // Sections
    sections.forEach((sec, i) => {
        sec.classList.toggle('hidden', i !== idx);
    });
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

// AUTO-FORMAT для номера телефона (ручной ввод)
const manualPhoneInput = document.getElementById('manualPhone');
if (manualPhoneInput) {
    manualPhoneInput.addEventListener('blur', function() {
        if (this.value.trim()) {
            this.value = normalizePhone(this.value.trim());
        }
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

    const icons = {
        'Новая': '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v8"/><path d="M8 12h8"/></svg>',
        'В работе': '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
        'Завершено': '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>'
    };

    badge.innerHTML = (icons[status] || icons['Новая']) + '<span>' + status + '</span>';
    
    // Снимаем старые классы
    badge.className = 'preview-status';
    
    // Добавляем специфичный класс
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
    let phone = document.getElementById('manualPhone').value.trim();
    if (phone) phone = normalizePhone(phone);
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

// =============================================
// ИИ ПО ФОТО
// =============================================

const photoCameraInput = document.getElementById('photoCameraInput');
const photoGalleryInput = document.getElementById('photoGalleryInput');
const photoPreviewWrap = document.getElementById('photoPreviewWrap');
const photoPreviewImg = document.getElementById('photoPreviewImg');
const photoRemoveBtn = document.getElementById('photoRemoveBtn');
const photoUploadArea = document.getElementById('photoUploadArea');
const photoAnalyzing = document.getElementById('photoAnalyzing');
const photoResult = document.getElementById('photoResult');
const photoResultCar = document.getElementById('photoResultCar');
const photoResultPlate = document.getElementById('photoResultPlate');
const addBtnPhoto = document.getElementById('addBtnPhoto');

let currentPhotoBase64 = null;
let currentPhotoFile = null;

// Handle both camera and gallery inputs
photoCameraInput.addEventListener('change', handlePhotoSelect);
photoGalleryInput.addEventListener('change', handlePhotoSelect);

async function handlePhotoSelect(e) {
    const file = e.target.files[0];
    if (!file) return;

    currentPhotoFile = file;

    // Read and show preview
    const reader = new FileReader();
    reader.onload = async function(ev) {
        const dataUrl = ev.target.result;
        currentPhotoBase64 = dataUrl.split(',')[1];

        // Show preview, hide upload area
        photoPreviewImg.src = dataUrl;
        photoPreviewWrap.classList.remove('hidden');
        photoUploadArea.classList.add('hidden');

        // Hide previous result
        photoResult.classList.add('hidden');
        photoResultCar.value = '';
        photoResultPlate.value = '';

        // Analyze
        await analyzePhoto(currentPhotoBase64);
    };
    reader.readAsDataURL(file);

    // Reset input so re-selecting same file works
    e.target.value = '';
}

// Remove photo
photoRemoveBtn.addEventListener('click', () => {
    resetPhotoSection();
});

function resetPhotoSection() {
    currentPhotoBase64 = null;
    currentPhotoFile = null;
    photoPreviewWrap.classList.add('hidden');
    photoResult.classList.add('hidden');
    photoAnalyzing.classList.add('hidden');
    photoUploadArea.classList.remove('hidden');
    photoResultCar.value = '';
    photoResultPlate.value = '';
    // Remove highlighting
    document.getElementById('photoFieldCar').classList.remove('preview-field--empty');
    document.getElementById('photoFieldPlate').classList.remove('preview-field--empty');
}

async function analyzePhoto(base64) {
    if (!GROQ_API_KEY || GROQ_API_KEY === 'gsk_PASTE_YOUR_API_KEY_HERE') {
        showStatus('error', 'Groq API Key не настроен. Откройте app.js и укажите GROQ_API_KEY.');
        return;
    }

    // Show spinner
    photoAnalyzing.classList.remove('hidden');

    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + GROQ_API_KEY
            },
            body: JSON.stringify({
                model: 'meta-llama/llama-4-scout-17b-16e-instruct',
                messages: [
                    {
                        role: 'system',
                        content: 'Ты помощник для автосервиса. Посмотри на фото автомобиля и верни ТОЛЬКО JSON без пояснений:\n{\n  "car": "марка и модель авто или null",\n  "plate": "госномер в формате AA 1234 BB или null"\n}\nЕсли что-то не видно на фото — верни null для этого поля.'
                    },
                    {
                        role: 'user',
                        content: [
                            {
                                type: 'image_url',
                                image_url: {
                                    url: 'data:image/jpeg;base64,' + base64
                                }
                            },
                            {
                                type: 'text',
                                text: 'Определи марку, модель и госномер автомобиля на фото.'
                            }
                        ]
                    }
                ],
                max_tokens: 200,
                temperature: 0.1
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || `Groq API error: ${response.status}`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || '';

        // Parse JSON from response
        let parsed;
        try {
            // Try extracting JSON from possible markdown wrapper
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content);
        } catch {
            showStatus('error', 'Не удалось распознать ответ ИИ. Заполните вручную.');
            photoResult.classList.remove('hidden');
            highlightPhotoFields();
            return;
        }

        // Fill result fields
        photoResultCar.value = (parsed.car && parsed.car !== 'null') ? parsed.car : '';
        photoResultPlate.value = (parsed.plate && parsed.plate !== 'null') ? parsed.plate.toUpperCase() : '';

        // Show result card
        photoResult.classList.remove('hidden');
        highlightPhotoFields();

        if (!photoResultCar.value && !photoResultPlate.value) {
            showStatus('error', 'Не удалось распознать, заполните вручную');
        }

    } catch (err) {
        showStatus('error', 'Ошибка распознавания: ' + err.message);
        photoResult.classList.remove('hidden');
        highlightPhotoFields();
    } finally {
        photoAnalyzing.classList.add('hidden');
    }
}

function highlightPhotoFields() {
    const carField = document.getElementById('photoFieldCar');
    const plateField = document.getElementById('photoFieldPlate');
    carField.classList.toggle('preview-field--empty', !photoResultCar.value.trim());
    plateField.classList.toggle('preview-field--empty', !photoResultPlate.value.trim());
}

// Remove highlighting on input
photoResultCar.addEventListener('input', highlightPhotoFields);
photoResultPlate.addEventListener('input', highlightPhotoFields);

// Submit photo data
addBtnPhoto.addEventListener('click', async () => {
    const car = photoResultCar.value.trim();
    const plate = photoResultPlate.value.trim().toUpperCase();

    if (!car && !plate) {
        showStatus('error', 'Заполните хотя бы одно поле');
        return;
    }

    const payload = {
        date: formatDate(new Date()),
        name: '',
        phone: '',
        car: car,
        plate: plate,
        problem: '',
        visitDate: '',
        price: '',
        status: 'Новая',
    };

    const success = await sendToSheet(payload, addBtnPhoto);
    if (success) {
        resetPhotoSection();
    }
});
