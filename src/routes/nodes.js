const express = require('express');

function nodeRouter(workflowEngine) {
    const router = express.Router();

    router.post('/create', async (req, res) => {
        try {
            const nodeData = req.body;
            const flow = await workflowEngine.addNodeToFlow(nodeData);
            res.json({ success: true, flow });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    router.post('/connect', async (req, res) => {
        try {
            const edgeData = req.body;
            const flow = await workflowEngine.addEdgeToFlow(edgeData);
            res.json({ success: true, flow });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    router.post('/execute', async (req, res) => {
        try {
            await workflowEngine.initializeFromFlow();
            const result = await workflowEngine.executeWorkflow(req.body.startNodeId);
            res.json({ success: true, result });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    router.get('/flow', async (req, res) => {
        const flow = await workflowEngine.loadFlowFile();
        res.json(flow);
    });

    // Update node configuration
    router.put('/update/:nodeId', async (req, res) => {
        try {
            const { nodeId } = req.params;
            const { config } = req.body;
            
            const updatedNode = await workflowEngine.updateNode(nodeId, config);
            
            // Emit socket event for real-time updates
            if (workflowEngine.io) {
                workflowEngine.io.emit('nodeUpdated', {
                    nodeId,
                    config,
                    timestamp: new Date().toISOString()
                });
            }

            res.json({ success: true, node: updatedNode });
        } catch (error) {
            console.error('Error updating node:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });

    return router;
}

module.exports = { nodeRouter };
