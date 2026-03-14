const fs = require('fs');
const path = require('path');

// Load parser.js functions into global scope for Node.js testing
const parserCode = fs.readFileSync(path.join(__dirname, '..', 'js', 'parser.js'), 'utf8');
eval(parserCode);

const testCases = [
    {
        name: "Пустая строка",
        input: ""
    },
    {
        name: "Только пробелы",
        input: "   "
    },
    {
        name: "Абракадабра",
        input: "фывфывфыв 123 !@#"
    },
    {
        name: "Смешанный текст без данных",
        input: "Привет, как дела? Я просто пишу текст."
    },
    {
        name: "Конфликт брендов (должен взять первый)",
        input: "У меня Ауди, но хочу купить БМВ"
    },
    {
        name: "Цифры, похожие на телефон и дату одновременно",
        input: "06.07.2023 - это дата или телефон 0671234567?"
    },
    {
        name: "Слишком длинный текст",
        input: "Василий ".repeat(100) + " Audi A4 0671234567"
    },
    {
        name: "Опечатки в брендах",
        input: "Мерседессс Аудіи Таёта"
    },
    {
        name: "Телефон без плюса и кодов",
        input: "888123456"
    },
    {
        name: "Номер авто в тексте",
        input: "Машина СВ 1234 АМ завтра приедет"
    },
    {
        name: "Цена с валютой",
        input: "Заплатил 1500 грн за всё"
    }
];

console.log("=== STRESS TESTING PARSER ===");
testCases.forEach((tc, i) => {
    console.log(`\nTest #${i + 1}: ${tc.name}`);
    console.log(`Input: "${tc.input.length > 50 ? tc.input.substring(0, 50) + '...' : tc.input}"`);
    const result = parseText(tc.input);
    console.log("Result:", JSON.stringify(result, null, 2));
});
