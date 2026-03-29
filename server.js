require('dotenv').config();
const express = require('express');
const path = require('path');
const { fetchEvents } = require('./scripts/fetch-events');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files (index.html, css/, js/, data/)
app.use(express.static(path.join(__dirname)));

// API: Get current events
app.get('/api/events', (req, res) => {
  try {
    delete require.cache[require.resolve('./data/events.json')];
    const events = require('./data/events.json');
    res.json(events);
  } catch {
    res.json([]);
  }
});

// API: Refresh events using AI
let isRefreshing = false;

app.post('/api/refresh', async (req, res) => {
  if (isRefreshing) {
    return res.status(429).json({
      error: 'A refresh is already in progress. Please wait.'
    });
  }

  isRefreshing = true;
  console.log('Starting AI event refresh...');

  try {
    const events = await fetchEvents();
    isRefreshing = false;
    res.json({
      success: true,
      count: events.length,
      message: `Found ${events.length} events!`
    });
  } catch (err) {
    isRefreshing = false;
    console.error('Refresh failed:', err.message);
    res.status(500).json({
      error: 'Failed to fetch events. Check your API key and try again.'
    });
  }
});

// API: Refresh status
app.get('/api/refresh/status', (req, res) => {
  res.json({ refreshing: isRefreshing });
});

app.listen(PORT, () => {
  console.log(`Boston Weekend Events running at http://localhost:${PORT}`);
});
