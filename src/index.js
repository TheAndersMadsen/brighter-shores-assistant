require('dotenv').config();
const express = require('express');
const { BrighterShoresAssistant } = require('./brighterShoresAssistant');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(express.json());
app.use(cors({
    origin: process.env.NODE_ENV === 'production' ? false : 'http://localhost:5173',
    methods: ['GET', 'POST', 'OPTIONS'],
    credentials: true
}));

// Initialize the assistant outside of the route handler so it can be reused
let assistant;
let isInitialized = false;

// Add a health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'Server is running' });
});

// Add an initialization status endpoint
app.get('/api/status', (req, res) => {
    res.json({ 
        initialized: isInitialized,
        message: isInitialized ? 'Assistant is ready' : 'Assistant is still initializing'
    });
});

// POST endpoint to ask questions
app.post('/api/ask', async (req, res) => {
    if (!isInitialized) {
        return res.status(503).json({ 
            error: 'Assistant is still initializing. Please try again in a few minutes.' 
        });
    }
    try {
        const { question } = req.body;
        
        if (!question) {
            return res.status(400).json({ error: 'Question is required' });
        }

        const response = await assistant.askQuestion(question);
        res.json({
            answer: response.answer,
            sources: response.sources
        });
        
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Add a new endpoint for force refresh
app.post('/api/refresh', async (req, res) => {
    try {
        await assistant.initialize(true);
        isInitialized = true;
        res.json({ message: 'Knowledge base refreshed successfully' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/ask/stream', async (req, res) => {
    console.log('Stream request received');
    if (!isInitialized) {
        return res.status(503).json({ 
            error: 'Assistant is still initializing. Please try again in a few minutes.' 
        });
    }

    try {
        const { question } = req.body;
        
        if (!question) {
            return res.status(400).json({ error: 'Question is required' });
        }

        // Set headers for SSE
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
        });

        // Stream the response
        await assistant.askQuestionStream(question, (chunk) => {
            console.log('Streaming chunk:', chunk);
            res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
        });

        // Get and send sources after the text stream is complete
        const sources = await assistant.getRelevantSources(question);
        res.write(`data: ${JSON.stringify({ sources })}\n\n`);
        
        // Send done signal
        res.write('data: [DONE]\n\n');
        res.end();

    } catch (error) {
        console.error('Stream error:', error);
        // If headers haven't been sent yet, send error response
        if (!res.headersSent) {
            res.status(500).json({ error: 'Internal server error' });
        } else {
            // If streaming has started, send error in stream format
            res.write(`data: ${JSON.stringify({ error: 'Internal server error' })}\n\n`);
            res.end();
        }
    }
});

if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../frontend/dist')));
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../frontend/dist', 'index.html'));
    });
}

const PORT = process.env.PORT || 3000;

// Start the server and initialize the assistant
async function main() {
    try {
        // Start the server first
        const server = app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });

        // Then initialize the assistant
        console.log('Initializing Brighter Shores Assistant...');
        assistant = new BrighterShoresAssistant();
        await assistant.initialize();
        isInitialized = true;  // Add this line to mark initialization as complete
        console.log('Assistant initialization complete!');
    } catch (error) {
        console.error('Error during initialization:', error.message);
        // Don't exit the process on error, just log it
        // process.exit(1);
    }
}

main();
