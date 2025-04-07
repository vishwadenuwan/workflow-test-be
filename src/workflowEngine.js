const { TimerNode } = require('./nodes/timerNode');
const { LangChainNode } = require('./nodes/langChainNode');
const { FileWriterNode } = require('./nodes/fileWriterNode');
const fs = require('fs').promises;
const path = require('path');

class WorkflowEngine {
    constructor() {
        this.nodes = new Map();
        this.connections = new Map();
        this.flowPath = path.join(__dirname, 'flow.json');
        this.io = null;
    }

    setSocketIO(io) {
        this.io = io;
    }

    async registerNode(nodeId, type, config) {
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
                node = new FileWriterNode(nodeId, config);
                break;
            default:
                throw new Error(`Unknown node type: ${type}`);
        }
        this.nodes.set(nodeId, node);
        console.log(`Node registered successfully. Current nodes:`, Array.from(this.nodes.keys()));
        
        return node;
    }

    async connect(sourceId, targetId) {
        this.connections.set(sourceId, targetId);
    }

    async addNodeToFlow(nodeData) {
        const flow = await this.loadFlowFile();
        flow.nodes.push({
            id: nodeData.nodeId,
            type: nodeData.type,
            config: nodeData.config
        });
        await fs.writeFile(this.flowPath, JSON.stringify(flow, null, 2));
        return flow;
    }

    async addEdgeToFlow(edgeData) {
        const flow = await this.loadFlowFile();
        flow.edges.push({
            source: edgeData.sourceId,
            target: edgeData.targetId
        });
        await fs.writeFile(this.flowPath, JSON.stringify(flow, null, 2));
        return flow;
    }

    async loadFlowFile() {
        try {
            const flowData = await fs.readFile(this.flowPath, 'utf8');
            return JSON.parse(flowData);
        } catch (error) {
            return { nodes: [], edges: [] };
        }
    }

    async initializeFromFlow() {
        const flow = await this.loadFlowFile();
        this.nodes.clear();
        this.connections.clear();

        for (const node of flow.nodes) {
            await this.registerNode(node.id, node.type, node.config);
        }

        for (const edge of flow.edges) {
            this.connections.set(edge.source, edge.target);
        }
    }

    async executeWorkflow(startNodeId) {
        await this.initializeFromFlow();
        
        let currentNodeId = startNodeId;
        let data = null;
        console.log('Nodes:', Array.from(this.nodes.keys()));
        console.log('Connections:', Array.from(this.connections.entries()));
        try {
            while (currentNodeId) {
                const node = this.nodes.get(currentNodeId);
                if (!node) {
                    console.log(`Node not found: ${currentNodeId}`);
                    break;
                }

                // Emit node execution start event
                if (this.io) {
                    this.io.emit('nodeExecutionStart', {
                        nodeId: currentNodeId,
                        timestamp: new Date().toISOString()
                    });
                }

                console.log(`Executing node: ${currentNodeId}`);
                console.log('Input data:', data);
                
                try {
                    data = await node.execute(data);
                    
                    // Emit node execution success event
                    if (this.io) {
                        this.io.emit('nodeExecutionSuccess', {
                            nodeId: currentNodeId,
                            timestamp: new Date().toISOString(),
                            output: data
                        });
                    }
                } catch (error) {
                    // Emit node execution error event
                    if (this.io) {
                        this.io.emit('nodeExecutionError', {
                            nodeId: currentNodeId,
                            timestamp: new Date().toISOString(),
                            error: error.message
                        });
                    }
                    throw error;
                }

                currentNodeId = this.connections.get(currentNodeId);
            }

            return data;
        } catch (error) {
            console.error('Workflow execution failed:', error);
            throw error;
        }
    }

    async updateNode(nodeId, config) {
        // Initialize nodes from flow file first
        await this.initializeFromFlow();
        
        const node = this.nodes.get(nodeId);
        if (!node) {
            throw new Error(`Node not found: ${nodeId}`);
        }

        // Update node configuration
        node.updateConfig(config);

        // Update flow.json
        const flow = await this.loadFlowFile();
        const nodeIndex = flow.nodes.findIndex(n => n.id === nodeId);
        if (nodeIndex !== -1) {
            flow.nodes[nodeIndex].config = config;
            await fs.writeFile(this.flowPath, JSON.stringify(flow, null, 2));
        }

        return node;
    }
}

module.exports = { WorkflowEngine };
