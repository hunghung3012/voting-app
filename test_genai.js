require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');

async function run() {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY_2 });
        const responseStream = await ai.models.generateContentStream({
            model: "gemini-3.5-flash",
            contents: "say hi",
        });
        for await (const chunk of responseStream) {
            console.log("CHUNK:", chunk.text);
        }
    } catch(e) {
        console.error(e);
    }
}
run();
