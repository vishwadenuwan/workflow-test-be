const fs = require('fs').promises;
const path = require('path');

class FileWriterNode {
    constructor(id, config) {
        this.id = id;
        this.config = config;
        this.filePath = config.filePath || 'res.txt';
    }

    async execute(input) {
        try {
            console.log('FileWriter received input:', input);

            // Simple message extraction
            const content = typeof input === 'string' 
                ? input 
                : input?.message || JSON.stringify(input, null, 2);

            console.log('Content to write:', content);

            // Write file
            await fs.writeFile(this.filePath, content, 'utf8');
            console.log(`Successfully wrote to file: ${this.filePath}`);

            return {
                success: true,
                filePath: this.filePath,
                message: content
            };
        } catch (error) {
            console.error('FileWriter Error:', error);
            return {
                success: false,
                error: error.message,
                filePath: this.filePath
            };
        }
    }
}

module.exports = { FileWriterNode };
