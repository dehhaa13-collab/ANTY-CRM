const fs = require('fs');
eval(fs.readFileSync('./parser.js', 'utf8'));

console.log(parseText("Вася на Toyota Camry приедет завтра. 0671234567"));
console.log(parseText("Audi A4 2015 года, 0671234567"));
console.log(parseText("БМВ Х5 стучит компрессор +380501112233"));
