const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

class LangChainNode {
    constructor(nodeId, config = {}) {
        this.nodeId = nodeId;
        this.config = {
            apiKey: config.apiKey || process.env.GOOGLE_API_KEY,
            model: config.model || 'gemini-1.5-pro',
            prompt: config.prompt || 'Hello, how are you?'
        };
        const genAI = new GoogleGenerativeAI(this.config.apiKey);
        this.model = genAI.getGenerativeModel({ model: this.config.model });
    }

    updateConfig(config) {
        this.config = {
            ...this.config,
            ...config
        };
    }

    async execute(input) {
        try {
            const result = await this.model.generateContent(input.message+"\n"+this.config.prompt);
            const response = await result.response;
            return { message: response.text() };
        } catch (error) {
            console.error('Gemini API Error:', error);
            return { message: 'Error processing with Gemini', error: error.message };
        }
    }
}

module.exports = { LangChainNode };
