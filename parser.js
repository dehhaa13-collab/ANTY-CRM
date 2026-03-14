/**
 * parser.js — Улучшенный парсинг свободного текста в структурированные данные.
 * Работает на регулярных выражениях (без AI).
 * Обрабатывает небрежный текст, опечатки, любой порядок слов.
 */

// =============================================================
// БАЗЫ ДАННЫХ
// =============================================================

const CAR_BRANDS = [
    // Латиница + кириллица + частые опечатки
    { names: ['audi', 'ауди', 'ауді'], canonical: 'Audi' },
    { names: ['bmw', 'бмв', 'бмвшка', 'бэха', 'beha'], canonical: 'BMW' },
    { names: ['mercedes', 'mercedes-benz', 'мерседес', 'мерс', 'мерін', 'мерцедес'], canonical: 'Mercedes' },
    { names: ['toyota', 'тойота', 'тоёта', 'тайота', 'land cruiser', 'ленд крузер', 'крузак', 'prado', 'прадо'], canonical: 'Toyota' },
    { names: ['honda', 'хонда'], canonical: 'Honda' },
    { names: ['nissan', 'ниссан', 'нисан', 'нісан'], canonical: 'Nissan' },
    { names: ['mazda', 'мазда'], canonical: 'Mazda' },
    { names: ['ford', 'форд'], canonical: 'Ford' },
    { names: ['chevrolet', 'шевроле', 'шеви', 'шевролет'], canonical: 'Chevrolet' },
    { names: ['hyundai', 'хюндай', 'хендай', 'хундай', 'хёндай', 'хендаі', 'хюндаі'], canonical: 'Hyundai' },
    { names: ['kia', 'киа', 'кіа'], canonical: 'Kia' },
    { names: ['volkswagen', 'фольксваген', 'фольцваген', 'vw', 'фв'], canonical: 'Volkswagen' },
    { names: ['skoda', 'шкода', 'škoda'], canonical: 'Skoda' },
    { names: ['renault', 'рено', 'ренаулт', 'ренó'], canonical: 'Renault' },
    { names: ['peugeot', 'пежо', 'пежот'], canonical: 'Peugeot' },
    { names: ['opel', 'опель'], canonical: 'Opel' },
    { names: ['volvo', 'вольво'], canonical: 'Volvo' },
    { names: ['subaru', 'субару', 'субарик'], canonical: 'Subaru' },
    { names: ['mitsubishi', 'мицубиши', 'митсубиси', 'мицубіші'], canonical: 'Mitsubishi' },
    { names: ['lexus', 'лексус'], canonical: 'Lexus' },
    { names: ['infiniti', 'инфинити', 'інфініті'], canonical: 'Infiniti' },
    { names: ['acura', 'акура'], canonical: 'Acura' },
    { names: ['porsche', 'порше', 'порш'], canonical: 'Porsche' },
    { names: ['jaguar', 'ягуар'], canonical: 'Jaguar' },
    { names: ['land rover', 'ленд ровер', 'ланд ровер'], canonical: 'Land Rover' },
    { names: ['range rover', 'рендж ровер', 'рейндж ровер'], canonical: 'Range Rover' },
    { names: ['jeep', 'джип'], canonical: 'Jeep' },
    { names: ['dodge', 'додж'], canonical: 'Dodge' },
    { names: ['chrysler', 'крайслер'], canonical: 'Chrysler' },
    { names: ['fiat', 'фиат', 'фіат'], canonical: 'Fiat' },
    { names: ['alfa romeo', 'альфа ромео'], canonical: 'Alfa Romeo' },
    { names: ['citroen', 'ситроен', 'сітроен'], canonical: 'Citroen' },
    { names: ['seat', 'сеат'], canonical: 'SEAT' },
    { names: ['suzuki', 'сузуки', 'сузукі'], canonical: 'Suzuki' },
    { names: ['daewoo', 'дэу', 'деу', 'дэво'], canonical: 'Daewoo' },
    { names: ['ssangyong', 'ссангйонг', 'санг йонг'], canonical: 'SsangYong' },
    { names: ['lada', 'лада', 'ваз'], canonical: 'Lada' },
    { names: ['газ', 'gaz'], canonical: 'ГАЗ' },
    { names: ['уаз', 'uaz'], canonical: 'УАЗ' },
    { names: ['заз', 'zaz'], canonical: 'ЗАЗ' },
    { names: ['geely', 'джили', 'джілі'], canonical: 'Geely' },
    { names: ['chery', 'чери', 'чері'], canonical: 'Chery' },
    { names: ['haval', 'хавал', 'хавейл'], canonical: 'Haval' },
    { names: ['great wall', 'грейт вол'], canonical: 'Great Wall' },
    { names: ['byd', 'бид', 'бід'], canonical: 'BYD' },
    { names: ['tesla', 'тесла'], canonical: 'Tesla' },
    { names: ['mini', 'мини', 'мінi'], canonical: 'Mini' },
    { names: ['dacia', 'дачия', 'дачія'], canonical: 'Dacia' },
    { names: ['cadillac', 'кадиллак', 'кадилак'], canonical: 'Cadillac' },
    { names: ['cupra', 'купра'], canonical: 'Cupra' },
    { names: ['ds', 'дс'], canonical: 'DS' },
    { names: ['lincoln', 'линкольн'], canonical: 'Lincoln' },
    { names: ['maserati', 'мазераті', 'мазерати'], canonical: 'Maserati' },
    { names: ['bentley', 'бентли', 'бентлі'], canonical: 'Bentley' },
    { names: ['ferrari', 'феррари', 'ферарі'], canonical: 'Ferrari' },
    { names: ['lamborghini', 'ламборгини', 'ламборгіні', 'ламбо'], canonical: 'Lamborghini' },
];

const PROBLEM_KEYWORDS = [
    // Многословные — длинные первыми для приоритета
    'не холодит', 'не работает кондиционер', 'не работает', 'не дует холодным',
    'не дует', 'не включается', 'не охлаждает', 'не морозит',
    'плохо холодит', 'плохо дует', 'плохо работает', 'слабо дует', 'слабо холодит',
    'перестал работать', 'перестал холодить', 'перестал дуть',
    'климат-контроль', 'климат контроль',
    'шумит компрессор', 'стучит компрессор', 'гудит компрессор',
    'шумит', 'гудит', 'свистит', 'стучит', 'трещит', 'дребезжит',
    'течёт', 'течет', 'капает', 'потёк', 'потек', 'протечка',
    'запах', 'воняет', 'пахнет', 'неприятный запах', 'запах в салоне',
    'заправка кондиционера', 'заправка', 'дозаправка', 'перезаправка',
    'диагностика', 'проверка', 'осмотр',
    'ремонт кондиционера', 'ремонт',
    'компрессор', 'радиатор', 'конденсор', 'конденсатор', 'испаритель',
    'фреон', 'хладагент', 'газ вышел', 'утечка фреона', 'утечка',
    'трубка', 'шланг', 'муфта', 'подшипник', 'сальник', 'прокладка',
    'кондиционер', 'кондёр', 'кондер', 'конд',
    'климат', 'печка', 'отопитель', 'вентилятор',
    'вибрация', 'дует тёплым', 'дует теплым', 'дует горячим',
    'греется', 'перегрев',
];

const DAY_NAMES = {
    'понедельник': 1, 'понеділок': 1,
    'вторник': 2, 'вівторок': 2,
    'среда': 3, 'среду': 3, 'середа': 3, 'середу': 3,
    'четверг': 4, 'четвер': 4,
    'пятница': 5, 'пятницу': 5, "п'ятниця": 5, "п'ятницю": 5,
    'суббота': 6, 'субботу': 6, 'субота': 6, 'суботу': 6,
    'воскресенье': 0, 'неділя': 0, 'неділю': 0,
};

// Кириллические имена (распространённые) — для уверенного распознавания
const COMMON_NAMES = [
    'александр', 'алексей', 'алекс', 'андрей', 'антон', 'артём', 'артем',
    'борис', 'вадим', 'валерий', 'василий', 'виктор', 'виталий', 'владимир', 'владислав',
    'геннадий', 'георгий', 'григорий', 'даниил', 'денис', 'дмитрий', 'дима',
    'евгений', 'женя', 'егор', 'иван', 'игорь', 'илья',
    'кирилл', 'константин', 'костя', 'леонид', 'максим', 'макс', 'михаил', 'миша',
    'никита', 'николай', 'коля', 'олег', 'павел', 'паша', 'пётр', 'петр',
    'роман', 'рома', 'руслан', 'сергей', 'серж', 'стас', 'станислав',
    'тарас', 'тимур', 'фёдор', 'федор', 'юрий', 'юра', 'ярослав', 'влад', 'вячеслав',
    'олександр', 'олексій', 'андрій', 'богдан', 'василь', 'віктор', 'віталій',
    'володимир', 'iван', 'ігор', 'максім', 'микола', 'петро', 'сергій',
    'анна', 'аня', 'елена', 'лена', 'ирина', 'катерина', 'мария', 'маша',
    'наталья', 'наташа', 'оксана', 'ольга', 'оля', 'светлана', 'света',
    'татьяна', 'таня', 'юлия', 'юля', 'галина', 'галя', 'марина', 'вера',
    'георги', 'димитър', 'иванов', 'петър', 'стоян', 'христо', 'янко',
    'красимир', 'красимира', 'стефан', 'тодор', 'никола',
];

// =============================================================
// ГЛАВНАЯ ФУНКЦИЯ ПАРСИНГА
// =============================================================

function parseText(text) {
    const result = {
        name: '',
        phone: '',
        car: '',
        plate: '',
        problem: '',
        visitDate: '',
        price: '',
    };

    if (!text || !text.trim()) return result;

    const normalized = text.trim();

    // Порядок важен: телефон, номер авто, авто, проблема, дата, цена — потом имя (из остатка)
    result.phone = extractPhone(normalized);
    result.plate = extractPlate(normalized);
    result.car = extractCar(normalized);
    result.visitDate = extractDate(normalized);
    result.problem = extractProblem(normalized, result);
    result.price = extractPrice(normalized);

    // Очистка: убрать номер авто из строки car (если он туда попал)
    if (result.plate && result.car) {
        const plateNoSpaces = result.plate.replace(/\s+/g, '');
        let car = result.car;
        // Убираем полный номер (с пробелами и без)
        car = car.replace(result.plate, '');
        car = car.replace(plateNoSpaces, '');
        // Убираем отдельные компоненты номера из хвоста строки авто
        // Например если car="BMW 330 АА 1234" а plate="АА 1234 ВВ"
        const plateParts = result.plate.split(/\s+/);
        for (const part of plateParts) {
            // Убираем с конца строки
            const escPart = part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            car = car.replace(new RegExp('\\s+' + escPart + '(?:\\s|$)', 'gi'), ' ');
        }
        // Убираем контекстные слова "номер авто", "госномер" и т.п.
        car = car.replace(/\s*(номер\s*авто|госномер|номера?)\s*/gi, ' ');
        // Убираем случайные слова-проблемы в конце (т.к. extractCar шагнул слишком далеко)
        car = car.replace(/\s+(сломался|сломалась|сломалось|стучит|течет|течёт)\s*$/gi, '');
        // Чистим лишние пробелы и запятые
        car = car.replace(/[,\s]+$/g, '').replace(/^[,\s]+/g, '').replace(/\s{2,}/g, ' ').trim();
        result.car = car;
    }
    // Также чистим problem-слова из car если они случайно попали
    if (result.car) {
        result.car = result.car.replace(/\s+(сломался|сломалась|сломалось|стучит|течет|течёт)\s*$/gi, '').trim();
    }

    result.name = extractName(normalized, result);

    return result;
}

// =============================================================
// ТЕЛЕФОН — с нормализацией
// =============================================================

function extractPhone(text) {
    // Убираем всё кроме цифр, +, пробелов, дефисов и скобок для поиска
    const phonePatterns = [
        // +380 (67) 123 45 67, +380671234567, +38 067 123 45 67
        /\+?\d{1,3}[\s.-]?\(?\d{2,3}\)?[\s.-]?\d{3}[\s.-]?\d{2}[\s.-]?\d{2}/,
        // +359 88 123 4567 (Bulgaria)
        /\+?359[\s.-]?\d{2}[\s.-]?\d{3}[\s.-]?\d{4}/,
        /\+?359[\s.-]?\d{2}[\s.-]?\d{3}[\s.-]?\d{2}[\s.-]?\d{2}/,
        // 0671234567 (local UA), 0887123456 (local BG)
        /\b0\d{9}\b/,
        // 067-123-45-67, 067 123 45 67
        /\b0\d{2}[\s.-]?\d{3}[\s.-]?\d{2}[\s.-]?\d{2}\b/,
        // Generic: 10-digit starting with reasonable prefix
        /\b\d{10}\b/,
        // 7-digit with dashes: 123-45-67
        /\b\d{3}[\s.-]\d{2}[\s.-]\d{2}\b/,
    ];

    for (const pattern of phonePatterns) {
        const match = text.match(pattern);
        if (match) {
            return normalizePhone(match[0].trim());
        }
    }
    return '';
}

function normalizePhone(raw) {
    // Убираем всё кроме цифр и +
    let digits = raw.replace(/[^\d+]/g, '');

    // Если начинается с +, оставляем как есть
    if (digits.startsWith('+')) {
        return formatPhoneDisplay(digits);
    }

    // Украина: 0 -> +380
    if (digits.startsWith('0') && digits.length === 10) {
        // Проверяем украинские коды (067, 050, 063, 066, 068, 073, 093, 095, 096, 097, 098, 099)
        const uaCode = digits.substring(1, 3);
        const uaCodes = ['50', '63', '66', '67', '68', '73', '91', '92', '93', '94', '95', '96', '97', '98', '99'];
        if (uaCodes.includes(uaCode)) {
            digits = '+380' + digits.substring(1);
            return formatPhoneDisplay(digits);
        }
        // Болгария: 0 -> +359
        const bgCodes = ['87', '88', '89', '98', '43', '44'];
        if (bgCodes.includes(uaCode)) {
            digits = '+359' + digits.substring(1);
            return formatPhoneDisplay(digits);
        }
    }

    // Болгария: 0 -> +359 (9-значные локальные)
    if (digits.startsWith('0') && digits.length === 10) {
        digits = '+359' + digits.substring(1);
        return formatPhoneDisplay(digits);
    }

    // 380... без плюса
    if (digits.startsWith('380') && digits.length === 12) {
        return formatPhoneDisplay('+' + digits);
    }

    // 359... без плюса
    if (digits.startsWith('359') && digits.length >= 12) {
        return formatPhoneDisplay('+' + digits);
    }

    // Если не распознали страну, форматируем как есть
    return raw.trim();
}

function formatPhoneDisplay(digits) {
    // +380671234567 -> +380 67 123 45 67
    if (digits.startsWith('+380') && digits.length === 13) {
        return digits.substring(0, 4) + ' ' +
               digits.substring(4, 6) + ' ' +
               digits.substring(6, 9) + ' ' +
               digits.substring(9, 11) + ' ' +
               digits.substring(11, 13);
    }
    // +359881234567 -> +359 88 123 45 67
    if (digits.startsWith('+359') && digits.length >= 13) {
        return digits.substring(0, 4) + ' ' +
               digits.substring(4, 6) + ' ' +
               digits.substring(6, 9) + ' ' +
               digits.substring(9, 11) + ' ' +
               digits.substring(11);
    }
    return digits;
}

// =============================================================
// АВТО — с нечётким поиском и каноническим названием
// =============================================================

function extractCar(text) {
    const lower = text.toLowerCase();
    let bestMatch = null;
    let bestPos = Infinity;

    // 1. Ищем точное совпадение
    for (const brand of CAR_BRANDS) {
        for (const name of brand.names) {
            const idx = lower.indexOf(name);
            if (idx !== -1 && idx < bestPos) {
                // Исключаем совпадение внутри другого слова (например, "лада" в "обладает")
                const before = idx > 0 ? lower[idx - 1] : ' ';
                const afterIdx = idx + name.length;
                const after = afterIdx < lower.length ? lower[afterIdx] : ' ';
                if (!/[а-яa-zёіїєґ]/i.test(before) && !/[а-яa-zёіїєґ]/i.test(after)) {
                    bestPos = idx;
                    bestMatch = { brand: brand, name: name, idx: idx };
                }
            }
        }
    }

    // 2. Если не нашли, пробуем нечёткий поиск для длинных марок (>= 4 букв)
    if (!bestMatch) {
        const words = lower.split(/[\s,;.!?]+/).filter(w => w.length >= 4);
        for (const word of words) {
            for (const brand of CAR_BRANDS) {
                for (const name of brand.names) {
                    if (name.length >= 4) {
                        const dist = levenshtein(word, name);
                        const maxDist = name.length <= 5 ? 1 : 2; // Для 4-5 букв макс 1 ошибка
                        if (dist <= maxDist) {
                            bestMatch = { brand: brand, name: name, idx: lower.indexOf(word) };
                            break;
                        }
                    }
                }
                if (bestMatch) break;
            }
            if (bestMatch) break;
        }
    }

    if (!bestMatch) return '';

    // 3. Извлекаем модель после марки (1-2 слова)
    const afterBrand = text.substring(bestMatch.idx + bestMatch.name.length).trim();
    const wordsAfter = afterBrand.split(/[\s,;.!?]+/).filter(w => w.trim());
    
    let modelParts = [];
    let basicStopWords = [
        'в', 'на', 'с', 'к', 'по', 'за', 'от', 'до', 'и', 'а', 'но', 'или', 'что', 'как', 'не',
        'сегодня', 'завтра', 'послезавтра', 'через',
        'года', 'год', 'року', 'рік', 'ремонт', 'диагностика', 'кондиционер', 'кондер', 'климат',
        'приедет', 'приеду', 'приїде', 'привезут', 'привезёт', 'привезет', 'будет', 'буду',
        'оставил', 'заплатил', 'дал', 'взял', 'цена', 'стоимость', 'вышло', 'итого', 'всего',
        'грн', 'гривен', 'гривна', 'гривны', 'uah', 'дол', 'долларов', 'руб', 'рублей', 'евро', 'eur', 'евриков',
        'лв', 'лева', 'лей', 'левов', 'bgn', 'злотых', 'zł', 'pln', 'крон', 'czk', 'kč',
        'лир', 'лира', 'try', '₺', 'фунтов', 'gbp', '£'
    ];
    let allStopWords = [...basicStopWords, ...Object.keys(DAY_NAMES), ...COMMON_NAMES];

    // Соберём отдельные слова проблем
    let problemWords = new Set();
    for (const phrase of PROBLEM_KEYWORDS) {
        for (const w of phrase.split(' ')) {
            if (w.length > 2) problemWords.add(w.toLowerCase());
        }
    }

    for (let i = 0; i < Math.min(3, wordsAfter.length); i++) {
        const word = wordsAfter[i];
        const wordLower = word.toLowerCase();
        
        // Год выпуска (обычно не часть модели, пропускаем)
        if (/^(19|20)\d{2}$/.test(wordLower)) break;
        
        // Телефон или дата
        if (/^\+?\d{5,}$/.test(wordLower) || /\d{1,2}[./-]\d{1,2}/.test(wordLower)) break;

        // Стоп-слово или имя
        if (allStopWords.includes(wordLower)) break;
        
        // Слово, относящееся к проблеме ("стучит", "компрессор", "течет")
        if (problemWords.has(wordLower)) break;
        
        modelParts.push(word);
        
        // Если слово содержит цифры (например A4, X5) - обычно это вся модель, можно остановиться,
        // но иногда бывает "Passat B8", так что берем до 2-3 слов.
    }

    const model = modelParts.join(' ');
    if (model) {
        return bestMatch.brand.canonical + ' ' + model;
    }
    
    return bestMatch.brand.canonical;
}

// Расстояние Левенштейна для нечёткого поиска
function levenshtein(a, b) {
    const m = a.length, n = b.length;
    const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            dp[i][j] = Math.min(
                dp[i - 1][j] + 1,
                dp[i][j - 1] + 1,
                dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
            );
        }
    }
    return dp[m][n];
}

// =============================================================
// ПРОБЛЕМА — более полное извлечение
// =============================================================

function extractProblem(text, parsed) {
    let lower = text.toLowerCase();
    
    // Убираем телефон из текста проблемы (заменяем на запятую для разбивки)
    if (parsed && parsed.phone) {
        const phoneDigits = parsed.phone.replace(/[^\d]/g, '');
        if (phoneDigits.length >= 7) {
            const rawPhoneRegex = new RegExp('[+]?[\\d\\s().-]{' + Math.max(7, phoneDigits.length - 3) + ',}');
            const phoneMatch = lower.match(rawPhoneRegex);
            if (phoneMatch) lower = lower.replace(phoneMatch[0], ',');
        }
    }
    
    // Убираем авто
    if (parsed && parsed.car) {
        lower = lower.replace(new RegExp(escapeRegex(parsed.car.toLowerCase()), 'gi'), ',');
        for (const brand of CAR_BRANDS) {
            for (const name of brand.names) {
                if (lower.includes(name)) {
                    lower = lower.replace(new RegExp(escapeRegex(name), 'gi'), ',');
                }
            }
        }
    }
    
    // Убираем маркеры дат
    const dateStopWords = ['сегодня', 'завтра', 'послезавтра', 'сьогодні', 'через'];
    for (const word of dateStopWords) {
        lower = lower.replace(new RegExp('\\b' + escapeRegex(word) + '\\b', 'gi'), ',');
    }

    const sortedKeywords = [...PROBLEM_KEYWORDS].sort((a, b) => b.length - a.length);
    
    // Слова, которые нужно убирать из начала фразы проблемы
    const problemLeadClean = /^(?:у\s+него|у\s+нее|у\s+них|он|она|они|там|какая-то|какой-то|что-то|просто|обратился|обратилась|звонил|звонила|позвонил|позвонила|жалуется|говорит|сказал|сказала|пришёл|пришел|пришла|приехал|приехала)\s+/gi;
    
    // Разбиваем на смысловые фразы
    const parts = lower.split(/[,.!?;]|(?:\s+и\s+)|\s+а\s+|\s+но\s+/);
    
    let bestParts = [];
    for (const part of parts) {
        for (const keyword of sortedKeywords) {
            if (part.includes(keyword)) {
                let cleanPart = part.trim();
                
                // Убираем глаголы-вступления в цикле (могут быть вложенные)
                let prev = '';
                while (prev !== cleanPart) {
                    prev = cleanPart;
                    cleanPart = cleanPart.replace(problemLeadClean, '').trim();
                }
                
                // Убираем известные имена из начала фразы
                const firstWord = cleanPart.split(/\s+/)[0];
                if (firstWord && COMMON_NAMES.includes(firstWord.toLowerCase())) {
                    cleanPart = cleanPart.substring(firstWord.length).trim();
                }
                
                // Убираем предлоги/частицы оставшиеся в начале
                cleanPart = cleanPart.replace(/^(?:с|на|к|от|за|по|у|в|что|насчет|насчёт|із|про)\s+/gi, '').trim();
                
                // Убираем "проблемой —" и подобное
                cleanPart = cleanPart.replace(/^(?:проблемой|проблема|жалобой)\s*[—–-]?\s*/gi, '').trim();
                
                if (cleanPart) {
                    bestParts.push(cleanPart);
                }
                break; 
            }
        }
    }

    if (bestParts.length > 0) {
        return bestParts.join(', ');
    }

    const contextPatterns = [
        /(?:проблема|жалоба|причина|описание)[\s:—–-]+([^,.\n]+)/i,
    ];

    for (const pattern of contextPatterns) {
        const match = lower.match(pattern);
        if (match) {
            return match[1].trim();
        }
    }

    return '';
}

// =============================================================
// ДАТА ВИЗИТА — улучшенная
// =============================================================

function extractDate(text) {
    const lower = text.toLowerCase();

    // "послезавтра" (проверяем раньше "завтра", т.к. содержит его)
    if (lower.includes('послезавтра') || lower.includes('післязавтра')) {
        const d = new Date();
        d.setDate(d.getDate() + 2);
        return formatDate(d);
    }

    // "сегодня"
    if (lower.includes('сегодня') || lower.includes('сьогодні') || lower.includes('днес')) {
        return formatDate(new Date());
    }

    // "завтра"
    if (lower.includes('завтра') || lower.includes('утре')) {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        return formatDate(d);
    }

    // "на следующей неделе" / "на наступному тижні"
    if ((lower.includes('следующ') && lower.includes('недел')) ||
        (lower.includes('наступн') && lower.includes('тижн')) ||
        lower.includes('на той неделе') || lower.includes('на тій неділі')) {
        // Следующий понедельник
        const d = new Date();
        const dayOfWeek = d.getDay();
        const daysUntilMonday = dayOfWeek === 0 ? 1 : (8 - dayOfWeek);
        d.setDate(d.getDate() + daysUntilMonday);
        return formatDate(d);
    }

    // "через N дней"
    const throughDays = lower.match(/через\s+(\d+)\s+(?:дн|день|дня)/);
    if (throughDays) {
        const d = new Date();
        d.setDate(d.getDate() + parseInt(throughDays[1]));
        return formatDate(d);
    }

    // "через неделю"
    if (lower.includes('через неделю') || lower.includes('через тиждень')) {
        const d = new Date();
        d.setDate(d.getDate() + 7);
        return formatDate(d);
    }

    // Дни недели: "в пятницу", "в среду", "у п'ятницю"
    for (const [dayName, dayNum] of Object.entries(DAY_NAMES)) {
        if (lower.includes(dayName)) {
            const d = getNextDayOfWeek(dayNum);
            return formatDate(d);
        }
    }

    // Конкретная дата: "15.03", "15/03", "15-03", "15.03.2025"
    const dateMatch = lower.match(/(\d{1,2})[./-](\d{1,2})(?:[./-](\d{2,4}))?/);
    if (dateMatch) {
        const day = parseInt(dateMatch[1]);
        const month = parseInt(dateMatch[2]) - 1;

        // Исключаем: если это больше похоже на телефон (длинная цифровая строка)
        const fullMatch = dateMatch[0];
        const beforeIdx = dateMatch.index > 0 ? text[dateMatch.index - 1] : ' ';
        const afterIdx = dateMatch.index + fullMatch.length < text.length ? text[dateMatch.index + fullMatch.length] : ' ';
        if (/\d/.test(beforeIdx) || /\d/.test(afterIdx)) {
            // Часть телефона — пропускаем
        } else if (day >= 1 && day <= 31 && month >= 0 && month <= 11) {
            const year = dateMatch[3] ? parseInt(dateMatch[3]) : new Date().getFullYear();
            const fullYear = year < 100 ? 2000 + year : year;
            return formatDate(new Date(fullYear, month, day));
        }
    }

    // "15 марта", "5 серпня", "10 март"
    const months = {
        'января': 0, 'февраля': 1, 'марта': 2, 'апреля': 3,
        'мая': 4, 'июня': 5, 'июля': 6, 'августа': 7,
        'сентября': 8, 'октября': 9, 'ноября': 10, 'декабря': 11,
        // Именительный падеж
        'январь': 0, 'февраль': 1, 'март': 2, 'апрель': 3,
        'май': 4, 'июнь': 5, 'июль': 6, 'август': 7,
        'сентябрь': 8, 'октябрь': 9, 'ноябрь': 10, 'декабрь': 11,
        // Украинский
        'січня': 0, 'лютого': 1, 'березня': 2, 'квітня': 3,
        'травня': 4, 'червня': 5, 'липня': 6, 'серпня': 7,
        'вересня': 8, 'жовтня': 9, 'листопада': 10, 'грудня': 11,
        // Болгарский
        'януари': 0, 'февруари': 1, 'март': 2, 'април': 3,
        'юни': 5, 'юли': 6, 'август': 7,
        'септември': 8, 'октомври': 9, 'ноември': 10, 'декември': 11,
    };

    for (const [monthName, monthNum] of Object.entries(months)) {
        const regex = new RegExp(`(\\d{1,2})\\s+${escapeRegex(monthName)}`, 'i');
        const match = lower.match(regex);
        if (match) {
            const day = parseInt(match[1]);
            if (day >= 1 && day <= 31) {
                return formatDate(new Date(new Date().getFullYear(), monthNum, day));
            }
        }
    }

    return '';
}

// =============================================================
// НОМЕР АВТОМОБИЛЯ (гос. номер / license plate)
// =============================================================

function extractPlate(text) {
    if (!text) return '';
    
    // 1. Поиск по маркерам ("номер авто СВ1234АМ") - самый надёжный способ
    const contextRe = /(?:номер(?:\s*авто|\s*машины)?|госномер|номера|держ\.?\s*номер|держномер|номерн(?:ой|ий)\s*знак|гос\.?\s*знак)[:\s]+([A-ZА-ЯІЇЄҐA-Za-zа-яіїєґ0-9][A-ZА-ЯІЇЄҐA-Za-zа-яіїєґ0-9\s\-]{3,10}[A-ZА-ЯІЇЄҐA-Za-zа-яіїєґ0-9])/i;
    const ctxMatch = text.match(contextRe);
    if (ctxMatch) {
        let words = ctxMatch[1].trim().split(/\s+/);
        let plateWords = [];
        for (let w of words) {
            // Останавливаемся, если слово - это предлог или глагол 
            if (/^(не|да|и|с|в|на|тут|там|к|по|за|от|до|для|сломался|приехал)$/i.test(w) || 
                (/^[а-яіїєґ]{4,}$/i.test(w) && w.toUpperCase() !== w)) {
                break;
            }
            plateWords.push(w);
        }
        let candidate = plateWords.join(' ').replace(/[\-]+/g, ' ').toUpperCase();
        candidate = candidate.replace(/[^A-ZА-ЯІЇЄҐ0-9]+$/, '').trim();
        if (candidate.replace(/\s+/g,'').length >= 4) return candidate;
    }

    // 2. Поиск стандартных шаблонов (без маркеров)
    // Строго через границы, от более сложных/длинных к простым
    const patPrefix = "(?:^|[\\s,;:\\-\\[])";
    const patSuffix = "(?=[.\\s,;:\\-\\]]|$)";
    
    const patterns = [
        // Немецкий / сложный EU (B AB 1234, M UX 4321)
        // 1-3 буквы, потом 1-2 буквы, потом 3-4 цифры
        new RegExp(patPrefix + "([A-ZА-ЯІЇЄҐA-Za-zа-яіїєґ]{1,3}[\\s\\-]+[A-ZА-ЯІЇЄҐA-Za-zа-яіїєґ]{1,2}[\\s\\-]+\\d{3,4})" + patSuffix, "i"),

        // UA/BG (AA 1234 BB, C 1234 XC, X 8888 BB) 
        new RegExp(patPrefix + "([A-ZА-ЯІЇЄҐA-Za-zа-яіїєґ]{1,3}[\\s\\-]*\\d{4}[\\s\\-]*[A-ZА-ЯІЇЄҐA-Za-zа-яіїєґ]{1,2})" + patSuffix, "i"),

        // Транзитные / Дипломатические (11 AA 1234, T1 12345)
        new RegExp(patPrefix + "(\\d{1,3}[\\s\\-]*[A-ZА-ЯІЇЄҐA-Za-zа-яіїєґ]{1,3}[\\s\\-]*\\d{3,4})" + patSuffix, "i"),
        new RegExp(patPrefix + "([A-ZА-ЯІЇЄҐA-Za-zа-яіїєґ]\\d{1,2}[\\s\\-]*[A-ZА-ЯІЇЄҐA-Za-zа-яіїєґ]{1,3}[\\s\\-]*\\d{3,4})" + patSuffix, "i"),

        // Польские / Чешские / Литовские (WX 12345, CZ 12345, ABC 123, GD 123AW)
        new RegExp(patPrefix + "([A-ZА-ЯІЇЄҐA-Za-zа-яіїєґ]{2,3}[\\s\\-]*\\d{3,5}[\\s\\-]*[A-ZА-ЯІЇЄҐA-Za-zа-яіїєґ]{0,2})" + patSuffix, "i")
    ];

    for (const pat of patterns) {
        let match = text.match(pat);
        if (match) {
            let candidate = match[1].replace(/[\\-]+/g, ' ').replace(/\\s{2,}/g, ' ').trim().toUpperCase();
            
            // Защита от предлогов и союзов на конце (В, НА, С, НЕ и т.д.)
            candidate = candidate.replace(/\s+(НЕ|ДА|И|С|В|НА|ТУТ|ТАМ|К|ПО|ЗА|ОТ|ДО|ДЛЯ)$/i, '').trim();

            // Фильтр от брендов ("BMW 330")
            const firstWord = candidate.split(' ')[0].toLowerCase();
            const isBrand = CAR_BRANDS.some(b => b.names.some(n => n === firstWord));
            if (!isBrand && candidate.replace(/\s+/g, '').length >= 4) {
                return candidate;
            }
        }
    }

    return '';
}

// =============================================================
// ЦЕНА / ДЕНЬГИ
// =============================================================

function extractPrice(text) {
    const lower = text.toLowerCase();
    
    // Все поддерживаемые валюты (с упором на Гривну и Евро)
    const currencySuffix = '(?:грн|гривен|гривна|гривны|г|₴|uah|евро|€|euro|eur|евриков|е|дол|долларов|\\$|usd|баксов|руб|рублей|р|₽|лв|лева|лей|левов|bgn|злотых|zł|pln|крон|czk|kč|лир|лира|try|₺|фунтов|gbp|£)';
    
    const pricePatterns = [
        new RegExp('(?:оставил|заплатил|дал|взял|цена|стоимость|вышло|итого|всего)\\s*(?:около|где-то)?\\s*\\d+\\s*' + currencySuffix + '?', 'i'),
        new RegExp('\\d+\\s*' + currencySuffix, 'i')
    ];

    for (const pattern of pricePatterns) {
        const match = lower.match(pattern);
        if (match) {
            return match[0].trim();
        }
    }
    
    return '';
}

// =============================================================
// ИМЯ — улучшенное извлечение
// =============================================================

function extractName(text, parsed) {
    // === ЭТАП 0: Ищем имя в ОРИГИНАЛЬНОМ тексте напрямую ===
    // Это самый надёжный способ — до того как мы что-то вырезаем
    const originalWords = text.replace(/[,.;:!?()«»\"\"''…—–-]/g, ' ').split(/\s+/);
    
    // Собираем множество «занятых» слов (марки, проблемы, дни недели и т.п.)
    const busyWords = new Set();
    
    // Слова из parsed.car
    if (parsed.car) {
        for (const w of parsed.car.toLowerCase().split(/\s+/)) busyWords.add(w);
    }
    // Слова из parsed.plate
    if (parsed.plate) {
        for (const w of parsed.plate.toLowerCase().split(/\s+/)) busyWords.add(w);
    }
    // Все варианты написания брендов
    for (const brand of CAR_BRANDS) {
        for (const n of brand.names) busyWords.add(n);
    }
    // Проблемные ключевые слова
    for (const phrase of PROBLEM_KEYWORDS) {
        for (const w of phrase.split(' ')) {
            if (w.length > 2) busyWords.add(w.toLowerCase());
        }
    }
    // Дни недели
    for (const d of Object.keys(DAY_NAMES)) busyWords.add(d);
    
    // Стоп-слова (глаголы, предлоги, служебные)
    const stopVerbs = [
        'приехал', 'приехала', 'приехали', 'обратился', 'обратилась',
        'звонил', 'звонила', 'позвонил', 'позвонила',
        'жалуется', 'говорит', 'сказал', 'сказала',
        'пришёл', 'пришел', 'пришла', 'привёз', 'привез', 'привезла',
        'приедет', 'приеду', 'привезут', 'привезёт', 'привезет',
        'будет', 'буду', 'хочет', 'просит', 'нужно', 'надо',
        'оставил', 'заплатил', 'дал', 'взял', 'стоит',
        'сегодня', 'завтра', 'послезавтра', 'вчера',
        'через', 'неделю', 'тиждень', 'кондиционер', 'кондер', 'кондей',
        'ремонт', 'заправка', 'диагностика', 'проблема', 'проблемой',
        'клиент', 'заказчик', 'мужчина', 'женщина',
        'номер', 'телефон', 'тел', 'авто', 'машина', 'автомобиль',
        'зовут', 'звать', 'імя', 'имя', 'насчет', 'насчёт',
        'грн', 'гривен', 'гривна', 'гривны', 'uah', 'дол', 'долларов', 'руб', 'рублей', 'евро', 'eur', 'евриков',
        'лв', 'лева', 'лей', 'левов', 'bgn', 'злотых', 'крон', 'лир', 'лира', 'фунтов',
    ];
    for (const w of stopVerbs) busyWords.add(w);
    
    // Предлоги / частицы
    const particles = ['в', 'на', 'с', 'к', 'по', 'за', 'от', 'до', 'и', 'а', 'но', 'или',
        'что', 'как', 'не', 'у', 'із', 'та', 'чи', 'ще', 'де', 'це', 'он', 'она',
        'него', 'нее', 'них', 'его', 'ее', 'её', 'их'];
    for (const w of particles) busyWords.add(w);
    
    // Этап 0a: ищем имена из COMMON_NAMES в оригинальном тексте
    for (const word of originalWords) {
        if (word.length >= 2 && COMMON_NAMES.includes(word.toLowerCase())) {
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        }
    }
    
    // Этап 0b: ищем слово с заглавной буквы, которое не занято
    for (const word of originalWords) {
        if (word.length < 2) continue;
        // Начинается с заглавной буквы?
        if (!/^[А-ЯA-ZЁІЇЄҐ]/.test(word)) continue;
        // Это кириллическое слово?
        if (!/^[А-Яа-яЁёІіЇїЄєҐґA-Za-z]+$/.test(word)) continue;
        
        const lower = word.toLowerCase();
        if (busyWords.has(lower)) continue;
        
        // Не бренд авто?
        const isBrand = CAR_BRANDS.some(b => b.names.includes(lower));
        if (isBrand) continue;
        
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    }
    
    // === ЭТАП 1: Fallback — вычитаем все найденное и ищем в остатке ===
    let remaining = text;

    // Убираем телефон
    if (parsed.phone) {
        remaining = remaining.replace(new RegExp(escapeRegex(parsed.phone), 'g'), ' ');
        const phoneDigits = parsed.phone.replace(/[^\d]/g, '');
        if (phoneDigits.length >= 7) {
            const phoneRaw = text.match(new RegExp('[+]?[\\d\\s().-]{' + Math.max(7, phoneDigits.length - 3) + ',}'));
            if (phoneRaw) {
                remaining = remaining.replace(phoneRaw[0], ' ');
            }
        }
    }

    // Убираем авто
    if (parsed.car) {
        remaining = remaining.replace(new RegExp(escapeRegex(parsed.car), 'gi'), ' ');
        for (const brand of CAR_BRANDS) {
            for (const name of brand.names) {
                if (remaining.toLowerCase().includes(name)) {
                    remaining = remaining.replace(new RegExp(escapeRegex(name), 'gi'), ' ');
                }
            }
        }
    }

    // Убираем проблему
    if (parsed.problem) {
        for (const keyword of parsed.problem.split(',')) {
            remaining = remaining.replace(new RegExp(escapeRegex(keyword.trim()), 'gi'), ' ');
        }
    }
    for (const keyword of PROBLEM_KEYWORDS) {
        remaining = remaining.replace(new RegExp(escapeRegex(keyword), 'gi'), ' ');
    }

    // Убираем цену
    if (parsed.price) {
        remaining = remaining.replace(new RegExp(escapeRegex(parsed.price), 'gi'), ' ');
    }

    // Убираем стоп-слова
    for (const word of [...stopVerbs, ...Object.keys(DAY_NAMES)]) {
        remaining = remaining.replace(new RegExp('\\b' + escapeRegex(word) + '\\b', 'gi'), ' ');
    }

    // Убираем предлоги/частицы
    for (const w of particles) {
        remaining = remaining.replace(new RegExp('\\b' + escapeRegex(w) + '\\b', 'gi'), ' ');
    }

    // Убираем даты и цифры
    remaining = remaining.replace(/\d{1,2}[./-]\d{1,2}(?:[./-]\d{2,4})?/g, ' ');
    remaining = remaining.replace(/\d+/g, ' ');

    // Чистим пунктуацию
    remaining = remaining.replace(/[,.\-;:!?()«»\"\"''…—–]/g, ' ').replace(/\s+/g, ' ').trim();

    // Ищем известное имя в остатке
    const words = remaining.split(/\s+/);
    for (const word of words) {
        if (COMMON_NAMES.includes(word.toLowerCase()) && word.length >= 2) {
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        }
    }

    // Ищем слово с заглавной буквы
    const capitalMatch = remaining.match(/\b[А-ЯA-ZЁІЇЄҐ][а-яa-zёіїєґ]{1,}\b/);
    if (capitalMatch) {
        const candidate = capitalMatch[0];
        const candidateLower = candidate.toLowerCase();
        const isBrand = CAR_BRANDS.some(b => b.names.includes(candidateLower));
        if (!isBrand && !busyWords.has(candidateLower)) {
            return candidate;
        }
    }

    return '';
}

// =============================================================
// УТИЛИТЫ
// =============================================================

function formatDate(date) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
}

function getNextDayOfWeek(dayOfWeek) {
    const today = new Date();
    const todayDay = today.getDay();
    let diff = dayOfWeek - todayDay;
    if (diff <= 0) diff += 7;
    const result = new Date(today);
    result.setDate(today.getDate() + diff);
    return result;
}

function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
