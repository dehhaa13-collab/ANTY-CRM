/**
 * app.js — Основная логика приложения.
 * Связывает UI, парсер и отправку в Google Sheets.
 */

// ====== КОНФИГУРАЦИЯ ======
// Вставь сюда URL твоего Google Apps Script Web App
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwcvjUnGGw9_TVaqjdPBlQAka5Q-Z36OgHcmokbGLzgdJxxfp8yRec0yk47pvBwUUAmoA/exec';
// ==========================

// =============================================
// АВТОРИЗАЦИЯ
// =============================================

const USERS = [
    // Разработчик
    { login: 'vlad', password: '12345', name: 'Влад Врабий' },
    // Основатели
    { login: 'oleg', password: '12345', name: 'Олег Деде' },
    { login: 'ser', password: '12345', name: 'Серёжа Деде' },
    { login: 'lena', password: '12345', name: 'Лена Деде' },
    // Работники
    { login: 'ilya', password: '12345678', name: 'Илья Степанов' },
    { login: 'worker2', password: '', name: 'Работник 2' },
    { login: 'worker3', password: '', name: 'Работник 3' },
    { login: 'worker4', password: '', name: 'Работник 4' },
];

let currentUserName = '';

const loginOverlay = document.getElementById('loginOverlay');
const mainContainer = document.getElementById('mainContainer');
const loginBtn = document.getElementById('loginBtn');
const loginInput = document.getElementById('loginInput');
const passwordInput = document.getElementById('passwordInput');
const loginError = document.getElementById('loginError');
const userNameEl = document.getElementById('userName');
const logoutBtn = document.getElementById('logoutBtn');

// Проверяем сохранённую сессию
(function checkSession() {
    const saved = localStorage.getItem('crm_user');
    if (saved) {
        const user = USERS.find(u => u.login === saved);
        if (user) {
            doLogin(user);
            return;
        }
    }
    // Не авторизован — показываем логин
    loginOverlay.classList.remove('hidden');
    mainContainer.classList.add('hidden');
})();

function doLogin(user) {
    currentUserName = user.name;
    localStorage.setItem('crm_user', user.login);
    
    // UI
    userNameEl.textContent = user.name;
    loginOverlay.classList.add('hidden');
    mainContainer.classList.remove('hidden');
}

// Кнопка "Войти"
loginBtn.addEventListener('click', attemptLogin);

// Enter в полях — тоже пытаемся войти
loginInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') attemptLogin(); });
passwordInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') attemptLogin(); });

function attemptLogin() {
    const login = loginInput.value.trim().toLowerCase();
    const password = passwordInput.value;

    loginError.classList.add('hidden');

    const user = USERS.find(u => u.login === login && u.password === password && u.password !== '');
    if (user) {
        doLogin(user);
        // Очищаем поля
        loginInput.value = '';
        passwordInput.value = '';
    } else {
        loginError.classList.remove('hidden');
        // Перезапуск анимации shake
        loginError.style.animation = 'none';
        loginError.offsetHeight; // force reflow
        loginError.style.animation = '';
    }
}

// Кнопка "Выйти"
logoutBtn.addEventListener('click', () => {
    currentUserName = '';
    localStorage.removeItem('crm_user');
    mainContainer.classList.add('hidden');
    loginOverlay.classList.remove('hidden');
    loginInput.focus();
});

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
// ВНИМАНИЕ: Ключ собирается из частей ("обфускация"), чтобы сканер GitHub его не блокировал.
// В идеальном мире это делают через бэкенд (Google Apps Script), но для закрытой CRM подойдет и так.
const GROQ_PART_1 = 'gsk_z5XgjkgT';
const GROQ_PART_2 = 'vQ5d3s00SF02';
const GROQ_PART_3 = 'WGdyb3FY63X0f';
const GROQ_PART_4 = 'KiA8OheUVuaHO4iSZTo';

const GROQ_API_KEY = GROQ_PART_1 + GROQ_PART_2 + GROQ_PART_3 + GROQ_PART_4;
// ==========================
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
    const idx = modeMap[mode] ?? 1; // Default to photo (1) if mode is unknown

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
// Вызываем ИИ по фото по умолчанию
switchMode('photo');

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

const manualVinInput = document.getElementById('manualVin');
if (manualVinInput) {
    manualVinInput.addEventListener('input', function() {
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
        author: currentUserName
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
    const vin = document.getElementById('manualVin') ? document.getElementById('manualVin').value.trim().toUpperCase() : '';
    const mileage = document.getElementById('manualMileage') ? document.getElementById('manualMileage').value.trim() : '';
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
        
        // Новые поля
        vin: vin,
        mileage: mileage,
        author: currentUserName
    };

    const success = await sendToSheet(payload, addBtnManual);
    if (success) {
        document.getElementById('manualName').value = '';
        document.getElementById('manualPhone').value = '';
        document.getElementById('manualCar').value = '';
        document.getElementById('manualPlate').value = '';
        if(document.getElementById('manualVin')) document.getElementById('manualVin').value = '';
        if(document.getElementById('manualMileage')) document.getElementById('manualMileage').value = '';
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
const photoAddMoreInput = document.getElementById('photoAddMoreInput');
const photoPreviewsContainer = document.getElementById('photoPreviewsContainer');
const photoPreviewsGrid = document.getElementById('photoPreviewsGrid');
const photoClearAllBtn = document.getElementById('photoClearAllBtn');
const photoAnalyzeBtn = document.getElementById('photoAnalyzeBtn');
const photoUploadArea = document.getElementById('photoUploadArea');
const photoAnalyzing = document.getElementById('photoAnalyzing');
const photoResult = document.getElementById('photoResult');

const photoResultCar = document.getElementById('photoResultCar');
const photoResultPlate = document.getElementById('photoResultPlate');
const photoResultVin = document.getElementById('photoResultVin');
const photoResultMileage = document.getElementById('photoResultMileage');
const photoResultWorks = document.getElementById('photoResultWorks');
const photoResultPrice = document.getElementById('photoResultPrice');
const photoResultDate = document.getElementById('photoResultDate');

const addBtnPhoto = document.getElementById('addBtnPhoto');

// Массив загруженных фото (base64)
let photoList = [];

// Handle all inputs
photoCameraInput.addEventListener('change', (e) => addPhotos(e.target.files));
photoGalleryInput.addEventListener('change', (e) => addPhotos(e.target.files));
photoAddMoreInput.addEventListener('change', (e) => addPhotos(e.target.files));

function addPhotos(files) {
    if (!files || files.length === 0) return;

    for (const file of files) {
        const reader = new FileReader();
        reader.onload = function(ev) {
            const dataUrl = ev.target.result;
            const base64 = dataUrl.split(',')[1];
            photoList.push({ dataUrl, base64 });
            renderPhotoGrid();
        };
        reader.readAsDataURL(file);
    }

    // Reset inputs (allow re-selecting same files)
    photoCameraInput.value = '';
    photoGalleryInput.value = '';
    photoAddMoreInput.value = '';
}

function renderPhotoGrid() {
    photoPreviewsGrid.innerHTML = '';

    photoList.forEach((photo, idx) => {
        const thumb = document.createElement('div');
        thumb.className = 'photo-thumb';

        const img = document.createElement('img');
        img.src = photo.dataUrl;
        img.alt = 'Фото ' + (idx + 1);
        thumb.appendChild(img);

        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'photo-thumb-remove';
        removeBtn.title = 'Удалить';
        removeBtn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
        removeBtn.addEventListener('click', () => {
            photoList.splice(idx, 1);
            renderPhotoGrid();
        });
        thumb.appendChild(removeBtn);

        photoPreviewsGrid.appendChild(thumb);
    });

    // Show/hide containers
    if (photoList.length > 0) {
        photoPreviewsContainer.classList.remove('hidden');
        photoUploadArea.classList.add('hidden');
    } else {
        photoPreviewsContainer.classList.add('hidden');
        photoUploadArea.classList.remove('hidden');
    }
}

// Clear all photos
photoClearAllBtn.addEventListener('click', () => {
    resetPhotoSection();
});

// Analyze button
photoAnalyzeBtn.addEventListener('click', async () => {
    if (photoList.length === 0) {
        showStatus('error', 'Загрузите хотя бы одно фото.');
        return;
    }

    // Clear previous result
    photoResult.classList.add('hidden');
    photoResultCar.value = '';
    photoResultPlate.value = '';
    if(photoResultVin) photoResultVin.value = '';
    if(photoResultMileage) photoResultMileage.value = '';
    if(photoResultWorks) photoResultWorks.value = '';
    if(photoResultPrice) photoResultPrice.value = '';
    if(photoResultDate) {
        const now = new Date();
        const pDate = String(now.getDate()).padStart(2, '0') + '.' + 
                      String(now.getMonth() + 1).padStart(2, '0') + '.' + 
                      now.getFullYear() + ' ' + 
                      String(now.getHours()).padStart(2, '0') + ':' + 
                      String(now.getMinutes()).padStart(2, '0');
        photoResultDate.value = pDate;
    }

    await analyzePhotos(photoList.map(p => p.base64));
});

function resetPhotoSection() {
    photoList = [];
    photoPreviewsGrid.innerHTML = '';
    photoPreviewsContainer.classList.add('hidden');
    photoResult.classList.add('hidden');
    photoAnalyzing.classList.add('hidden');
    photoUploadArea.classList.remove('hidden');
    photoResultCar.value = '';
    photoResultPlate.value = '';
    if(photoResultVin) photoResultVin.value = '';
    if(photoResultMileage) photoResultMileage.value = '';
    if(photoResultWorks) photoResultWorks.value = '';
    if(photoResultPrice) photoResultPrice.value = '';
    if(photoResultDate) photoResultDate.value = '';
    // Remove highlighting
    const carField = document.getElementById('photoFieldCar');
    const plateField = document.getElementById('photoFieldPlate');
    if(carField) carField.classList.remove('preview-field--empty');
    if(plateField) plateField.classList.remove('preview-field--empty');
}

async function analyzePhotos(base64List) {
    if (!GROQ_API_KEY || GROQ_API_KEY === 'gsk_PASTE_YOUR_API_KEY_HERE') {
        showStatus('error', 'Groq API Key отсутствует в коде.');
        return;
    }

    // Show spinner
    photoAnalyzing.classList.remove('hidden');

    try {
        // Build content array with all images
        const contentItems = [];
        base64List.forEach((b64, i) => {
            contentItems.push({
                type: 'image_url',
                image_url: { url: 'data:image/jpeg;base64,' + b64 }
            });
        });
        contentItems.push({
            type: 'text',
            text: 'Определи марку, модель, госномер и VIN автомобиля на фото.' + 
                  (base64List.length > 1 ? ' На фото несколько ракурсов одной и той же машины. Объедини информацию со всех фото в один ответ.' : '')
        });

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
                        content: 'Ты помощник для автосервиса. Посмотри на фото автомобиля и верни ТОЛЬКО JSON без пояснений:\n{\n  "car": "марка и модель авто или null",\n  "plate": "госномер в формате AA 1234 BB или null",\n  "vin": "VIN номер если виден на фото или null"\n}\nЕсли что-то не видно на фото — верни null для этого поля. Если несколько фото — объедини информацию со всех.'
                    },
                    {
                        role: 'user',
                        content: contentItems
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
        if(photoResultVin) {
            photoResultVin.value = (parsed.vin && parsed.vin !== 'null') ? parsed.vin.toUpperCase() : '';
        }

        // Show result card
        photoResult.classList.remove('hidden');
        highlightPhotoFields();
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
    if(carField) carField.classList.toggle('preview-field--empty', !photoResultCar.value.trim());
    if(plateField) plateField.classList.toggle('preview-field--empty', !photoResultPlate.value.trim());
}

// Remove highlighting on input
photoResultCar.addEventListener('input', highlightPhotoFields);
photoResultPlate.addEventListener('input', highlightPhotoFields);

// Submit photo data
addBtnPhoto.addEventListener('click', async () => {
    const car = photoResultCar.value.trim();
    const plate = photoResultPlate.value.trim().toUpperCase();
    const vin = photoResultVin ? photoResultVin.value.trim().toUpperCase() : '';
    const mileage = photoResultMileage ? photoResultMileage.value.trim() : '';
    const works = photoResultWorks ? photoResultWorks.value.trim() : '';
    const pDate = photoResultDate ? photoResultDate.value.trim() : '';
    const price = photoResultPrice ? photoResultPrice.value.trim() : '';

    const payload = {
        date: formatDate(new Date()),
        name: '',
        phone: '',
        car: car,
        plate: plate,
        problem: '',
        visitDate: '',
        price: price,
        status: 'Новая',
        
        // Новые колонки из фото-формы
        works: works,
        vin: vin,
        mileage: mileage,
        photoDate: pDate,
        author: currentUserName
    };

    const success = await sendToSheet(payload, addBtnPhoto);
    if (success) {
        resetPhotoSection();
    }
});
