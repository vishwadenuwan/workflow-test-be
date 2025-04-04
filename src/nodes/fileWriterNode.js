const fs = require('fs').promises;
const path = require('path');

class FileWriterNode {
    constructor(nodeId, config = {}) {
        this.nodeId = nodeId;
        this.config = {
            filePath: config.filePath || './output.txt',
            append: config.append || false
        };
    }

    updateConfig(config) {
        this.config = {
            ...this.config,
            ...config
        };
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
            await fs.writeFile(this.config.filePath, content, { flag: this.config.append ? 'a' : 'w', encoding: 'utf8' });
            console.log(`Successfully wrote to file: ${this.config.filePath}`);

            return {
                success: true,
                filePath: this.config.filePath,
                message: content
            };
        } catch (error) {
            console.error('FileWriter Error:', error);
            return {
                success: false,
                error: error.message,
                filePath: this.config.filePath
            };
        }
    }
}

module.exports = { FileWriterNode };
