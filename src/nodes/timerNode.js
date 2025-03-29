class TimerNode {
    constructor(id, config) {
        this.id = id;
        this.config = config;
        this.message = config.message || "Hello, I'm bob";
    }

    async execute() {
        return { message: this.message };
    }
}

module.exports = { TimerNode };
