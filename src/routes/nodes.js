const express = require('express');

function nodeRouter(workflowEngine) {
    const router = express.Router();

    router.post('/create', (req, res) => {
        const { nodeId, type, config } = req.body;
        const node = workflowEngine.registerNode(nodeId, type, config);
        res.json({ success: true, nodeId: node.id });
    });

    router.post('/connect', (req, res) => {
        const { sourceId, targetId } = req.body;
        workflowEngine.connect(sourceId, targetId);
        res.json({ success: true });
    });

    router.post('/execute', async (req, res) => {
        const { startNodeId } = req.body;
        const result = await workflowEngine.executeWorkflow(startNodeId);
        res.json({ success: true, result });
    });

    return router;
}

module.exports = { nodeRouter };
