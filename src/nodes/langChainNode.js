const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

class LangChainNode {
    constructor(nodeId, config = {}) {
        this.nodeId = nodeId;
        this.config = {
            apiKey: config.apiKey || "AIzaSyC3ui8CPbCe4SRgi4ud2jP-s848D8kH7xY",
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
        console.log("input", input);
        try {
            // Handle different input types
            let inputText = '';
            if (typeof input === 'string') {
                inputText = input;
            } else if (input && typeof input === 'object') {
                if (input.type === 'email') {
                    inputText = input.content;
                } else if (input.message) {
                    inputText = input.message;
                } else {
                    inputText = JSON.stringify(input);
                }
            }

            console.log("Processing input:", inputText);
            const result = await this.model.generateContent(inputText + "\n" + this.config.prompt);
            const response = await result.response;
            return { message: response.text() };
        } catch (error) {
            console.error('Gemini API Error:', error);
            return { message: 'Error processing with Gemini', error: error.message };
        }
    }
}

module.exports = { LangChainNode };
