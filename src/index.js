const express = require('express');
const { WorkflowEngine } = require('./workflowEngine');
const { nodeRouter } = require('./routes/nodes');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173", // Your React app's URL
        methods: ["GET", "POST"]
    }
});

app.use(express.json());
app.use(cors());

const workflowEngine = new WorkflowEngine();

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('Client connected');

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

// Make io accessible to workflowEngine
workflowEngine.setSocketIO(io);

app.use('/api/nodes', nodeRouter(workflowEngine));

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
