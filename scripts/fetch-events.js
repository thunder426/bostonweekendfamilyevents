const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs');
const path = require('path');

const client = new Anthropic();

const EVENTS_FILE = path.join(__dirname, '..', 'data', 'events.json');

async function fetchEvents() {
  const today = new Date();
  const twoWeeksOut = new Date(today);
  twoWeeksOut.setDate(today.getDate() + 30);

  const dateRange = `${today.toISOString().split('T')[0]} to ${twoWeeksOut.toISOString().split('T')[0]}`;

  console.log(`Searching for Boston family events: ${dateRange}...`);

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 8000,
    tools: [{ type: 'web_search_20250305' }],
    messages: [
      {
        role: 'user',
        content: `Search the web for family-friendly weekend events in the Boston, Massachusetts area happening between ${dateRange}.

Look for events in these categories:
- Farm events (Drumlin Farm, Verrill Farm, Smolak Farms, Davis Farmland, Lookout Farm, etc.)
- Museum events (Boston Children's Museum, Museum of Science, New England Aquarium, Discovery Museum, etc.)
- Outdoor events (Franklin Park Zoo, Boston Harbor Islands, parks, nature walks, etc.)
- Festivals, fairs, and seasonal events
- Free community events for families

Search multiple sources including:
- Boston event calendars and family blogs
- Venue websites directly
- Community event listings

For each event, provide:
- title, venue name, location (city, MA), category (farm/museum/outdoor)
- description (2-3 sentences, family-focused)
- date and endDate (YYYY-MM-DD format, weekends preferred)
- time (e.g. "10:00 AM – 4:00 PM")
- price (specific pricing with age breakdowns)
- ageRange (e.g. "All ages", "Ages 0-8")
- website URL (real, verified URL from search results)
- tags (array of relevant keywords)
- recurring (boolean - is this a regular event?)

Return ONLY a valid JSON array of event objects. No markdown, no explanation, just the JSON array. Use this exact schema for each event:
{
  "id": <number>,
  "title": "<string>",
  "venue": "<string>",
  "location": "<string>",
  "category": "<farm|museum|outdoor>",
  "description": "<string>",
  "date": "<YYYY-MM-DD>",
  "endDate": "<YYYY-MM-DD>",
  "time": "<string>",
  "price": "<string>",
  "ageRange": "<string>",
  "website": "<string>",
  "image": "",
  "tags": ["<string>"],
  "recurring": <boolean>
}

Find at least 10-15 real events with accurate details. Leave "image" as empty string.`
      }
    ]
  });

  // Extract the text response (skip web search tool results)
  let jsonText = '';
  for (const block of response.content) {
    if (block.type === 'text') {
      jsonText += block.text;
    }
  }

  // Clean up — strip markdown fences if present
  jsonText = jsonText.trim();
  if (jsonText.startsWith('```')) {
    jsonText = jsonText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }

  let events;
  try {
    events = JSON.parse(jsonText);
  } catch (e) {
    console.error('Failed to parse AI response as JSON.');
    console.error('Raw response:', jsonText.substring(0, 500));
    throw new Error('Invalid JSON from AI response');
  }

  if (!Array.isArray(events) || events.length === 0) {
    throw new Error('AI returned empty or non-array result');
  }

  // Assign placeholder images based on category
  const placeholderImages = {
    farm: 'https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=600&h=400&fit=crop',
    museum: 'https://images.unsplash.com/photo-1566140967404-b8b3932483f5?w=600&h=400&fit=crop',
    outdoor: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600&h=400&fit=crop'
  };

  events = events.map((event, i) => ({
    ...event,
    id: i + 1,
    image: event.image || placeholderImages[event.category] || placeholderImages.outdoor
  }));

  // Write to file
  fs.writeFileSync(EVENTS_FILE, JSON.stringify(events, null, 2), 'utf-8');
  console.log(`Saved ${events.length} events to ${EVENTS_FILE}`);

  return events;
}

// Allow running directly or importing
if (require.main === module) {
  fetchEvents()
    .then(events => {
      console.log(`Done! Found ${events.length} events.`);
    })
    .catch(err => {
      console.error('Error fetching events:', err.message);
      process.exit(1);
    });
}

module.exports = { fetchEvents };
