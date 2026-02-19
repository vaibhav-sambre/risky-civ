const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

// Serve static files from the root directory
app.use(express.static(__dirname));

// API Endpoint for health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Risky Civ Server is running' });
});

// Fallback to index.html for SPA routing (if needed in future)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
    console.log(`Risky Civ server listening on port ${port}`);
});
