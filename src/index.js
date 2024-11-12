require('dotenv').config();
const express = require('express');
const { BrighterShoresAssistant } = require('./brighterShoresAssistant');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(express.json());
app.use(cors());

// Initialize the assistant outside of the route handler so it can be reused
let assistant;

async function initializeAssistant() {
    console.log('Initializing Brighter Shores Assistant...');
    assistant = new BrighterShoresAssistant();
    await assistant.initialize();
}

// POST endpoint to ask questions
app.post('/api/ask', async (req, res) => {
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
        res.json({ message: 'Knowledge base refreshed successfully' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Add this after your other middleware
if (process.env.NODE_ENV === 'production') {
  // Serve static files from the frontend build directory
  app.use(express.static(path.join(__dirname, '../frontend/dist')));

  // Handle React routing, return all requests to React app
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist', 'index.html'));
  });
}

const PORT = process.env.PORT || 3000;

// Start the server and initialize the assistant
async function main() {
    try {
        await initializeAssistant();
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

main();
