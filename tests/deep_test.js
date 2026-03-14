const fs = require('fs');
const path = require('path');

const parserCode = fs.readFileSync(path.join(__dirname, '..', 'js', 'parser.js'), 'utf8');
eval(parserCode);

const complexCases = [
    {
        name: "Пустая строка",
        input: "\n\n   \t",
        expected: { name: '', phone: '', car: '', plate: '', problem: '', visitDate: '', price: ''}
    },
    {
        name: "Кейс с огромным текстом и кучей пунктуации",
        input: "!! !! !!! Вася,,, \n\n\n\n приехал на.... BMW - - - - -- X5!!!! Стучит компрессор,,,,,,,, телефон 067-123-45-67... номер авто СВ 1234 АМ !!!",
        expectedName: "Вася",
        expectedCar: "BMW"
    },
    {
        name: "Проверка на Injection / RegExp DoS (long text without matches)",
        input: "а".repeat(10000)
    },
    {
        name: "Конфликтующие бренды и имена",
        input: "Мерседес пригнал Ауди для ремонта Тойоты. Зовут Хонда, телефон 0881234567."
    },
    {
        name: "Опечатки в номере телефона",
        input: "телефон +38 0(67)-123--4567" // Too many dashes
    },
    {
        name: "XSS попытка в тексте (проверка что парсер не падает на спецсимволах HTML)",
        input: "<script>alert(1)</script> Вася <div>Audi</div>"
    },
    {
        name: "Проверка извлечения цены в разных форматах",
        input: "Дали 100$, 200 евро, 300 грн" // Should pick one
    },
    {
        name: "Супер короткие инпуты",
        input: "1"
    },
    {
        name: "Проверка извлечения даты, которая похожа на телефон",
        input: "Приедет 06.07.2024 телефон 0670670670"
    }
];

console.log("=== DEEP STABILITY TEST ===");

let passed = 0;
let failed = 0;
let errors = 0;

complexCases.forEach((tc, i) => {
    try {
        const start = performance.now();
        const result = parseText(tc.input);
        const duration = performance.now() - start;
        
        console.log(`\nTest #${i + 1}: ${tc.name}`);
        console.log(`Execution time: ${duration.toFixed(2)}ms`); // Check for ReDoS
        if (duration > 100) {
            console.log("⚠️ WARNING: Slow execution (Potential ReDoS)");
        }
        
        console.log("Result:", JSON.stringify(result, null, 2));
        passed++;
    } catch (e) {
        console.log(`\n❌ Error in Test #${i + 1}: ${tc.name}`);
        console.error(e);
        errors++;
    }
});

console.log(`\n=== TEST SUMMARY ===`);
console.log(`Passed: ${passed}/${complexCases.length}`);
console.log(`Errors (Crashes): ${errors}`);
