const fs = require('fs');

const filename = 'gestoprueba.json';
const content = fs.readFileSync(filename, 'utf8');
const data = JSON.parse(content);
//Cada item del array es un frame
console.log(data.length)