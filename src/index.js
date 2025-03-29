const express = require('express');
const { WorkflowEngine } = require('./workflowEngine');
const { nodeRouter } = require('./routes/nodes');

const app = express();
app.use(express.json());

const workflowEngine = new WorkflowEngine();

app.use('/api/nodes', nodeRouter(workflowEngine));

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
