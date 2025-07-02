const fs = require('fs');
const config = JSON.parse(fs.readFileSync('./config/app.json', 'utf8'));

exports.config = config;