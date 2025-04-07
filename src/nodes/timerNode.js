class TimerNode {
    constructor(nodeId, config = {}) {
        this.nodeId = nodeId;
        this.config = {
            message: config.message || 'Timer triggered',
            interval: config.interval || 1000
        };
    }

    updateConfig(config) {
        this.config = {
            ...this.config,
            ...config
        };
    }

    async execute() {
        return { message: this.config.message };
    }
}

module.exports = { TimerNode };
