const https = require('https');
require('dotenv').config();

const apiKey = process.env.GEMINI_API_KEY_2;
const prompt = "test";
const requestBody = JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.3, maxOutputTokens: 1024 }
});

const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:streamGenerateContent?alt=sse&key=${apiKey}`;
const parsedUrl = new URL(url);

const options = {
    hostname: parsedUrl.hostname,
    path: parsedUrl.pathname + parsedUrl.search,
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(requestBody),
    },
};

const req = https.request(options, (res) => {
    console.log('Status:', res.statusCode);
    res.on('data', (d) => process.stdout.write(d));
});

req.on('error', (e) => console.error('Error:', e));
req.write(requestBody);
req.end();
