const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

class LangChainNode {
    constructor(id, config) {
        this.id = id;
        this.config = config;
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        this.model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    }

    async execute(input) {
        try {
            const result = await this.model.generateContent(input.message);
            const response = await result.response;
            return { message: response.text() };
        } catch (error) {
            console.error('Gemini API Error:', error);
            return { message: 'Error processing with Gemini', error: error.message };
        }
    }
}

module.exports = { LangChainNode };
