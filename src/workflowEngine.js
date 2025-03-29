const { TimerNode } = require('./nodes/timerNode');
const { LangChainNode } = require('./nodes/langChainNode');
const { FileWriterNode } = require('./nodes/fileWriterNode');

class WorkflowEngine {
    constructor() {
        this.nodes = new Map();
        this.connections = new Map();
    }

    registerNode(nodeId, type, config) {
        let node;
        console.log(`Registering node: ${nodeId} of type: ${type}`);
        switch(type) {
            case 'timer':
                node = new TimerNode(nodeId, config);
                break;
            case 'langchain':
                node = new LangChainNode(nodeId, config);
                break;
            case 'filewriter':
                // Add alternative name
                node = new FileWriterNode(nodeId, config);
                break;
            default:
                throw new Error(`Unknown node type: ${type}`);
        }
        this.nodes.set(nodeId, node);
        console.log(`Node registered successfully. Current nodes:`, Array.from(this.nodes.keys()));
        return node;
    }

    connect(sourceId, targetId) {
        this.connections.set(sourceId, targetId);
    }

    async executeWorkflow(startNodeId) {
        let currentNodeId = startNodeId;
        let data = null;
        //print all nodes and connections
        console.log('Nodes:', Array.from(this.nodes.keys()));
        console.log('Connections:', Array.from(this.connections.entries()));
        try {
            while (currentNodeId) {
                const node = this.nodes.get(currentNodeId);
                if (!node) {
                    console.log(`Node not found: ${currentNodeId}`);
                    break;
                }

                console.log(`Executing node: ${currentNodeId}`);
                console.log('Input data:', data);
                
                data = await node.execute(data);
                
                console.log('Output data:', data);
                currentNodeId = this.connections.get(currentNodeId);
            }

            return data;
        } catch (error) {
            console.error('Workflow execution error:', error);
            throw error;
        }
    }
}

module.exports = { WorkflowEngine };
