const https = require('https');
require('dotenv').config();

const apiKey = process.env.GEMINI_API_KEY_2;
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

https.get(url, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        try {
            const models = JSON.parse(data).models.map(m => m.name);
            console.log(models);
        } catch (e) { console.log(data); }
    });
});
