const fs = require('fs');
const path = require('path');

const parserCode = fs.readFileSync(path.join(__dirname, '..', 'js', 'parser.js'), 'utf8');
eval(parserCode);

const phoneCases = [
    // --- Ukraine ---
    { input: "0671234567", expected: "+380 67 123 45 67" },
    { input: "067 123 45 67", expected: "+380 67 123 45 67" },
    { input: "067-123-45-67", expected: "+380 67 123 45 67" },
    { input: "(067) 123-45-67", expected: "+380 67 123 45 67" },
    { input: "380671234567", expected: "+380 67 123 45 67" },
    { input: "+380671234567", expected: "+380 67 123 45 67" },
    { input: "80671234567", desc: "Часто пишут с 8 вместо +38", expected: "+380 67 123 45 67" },
    
    // --- Bulgaria ---
    { input: "0881234567", expected: "+359 88 123 45 67" },
    { input: "088 123 45 67", expected: "+359 88 123 45 67" },
    { input: "359881234567", expected: "+359 88 123 45 67" },
    { input: "+359881234567", expected: "+359 88 123 45 67" },
    { input: "0 88 123 4567", expected: "+359 88 123 45 67" },
    
    // --- Bad formatting ---
    { input: "мой номер 067  123  45  67", expected: "+380 67 123 45 67" },
    { input: "тел: 8(067)123-45-67", expected: "+380 67 123 45 67" }
];

console.log("=== PHONE PARSING TESTS ===");
phoneCases.forEach(tc => {
    const res = parseText(tc.input);
    const pass = res.phone === tc.expected;
    console.log(`${pass ? '✅' : '❌'} Input: "${tc.input}"`);
    if (!pass) {
        console.log(`   Expected: ${tc.expected}`);
        console.log(`   Got:      ${res.phone}`);
    }
});
