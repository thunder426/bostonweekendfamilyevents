Search the web for the latest family-friendly weekend events in the Boston, Massachusetts area. Find real, current events happening in the next 30 days.

Look for events in these categories:
- **Farm events**: Drumlin Farm, Verrill Farm, Smolak Farms, Davis Farmland, Lookout Farm, Wilson Farm, Hanson's Farm, Tougas Family Farm, etc.
- **Museum events**: Boston Children's Museum, Museum of Science, New England Aquarium, Discovery Museum, Plimoth Patuxet, Isabella Stewart Gardner Museum, MIT Museum, etc.
- **Outdoor events**: Franklin Park Zoo, Stone Zoo, Boston Harbor Islands, Middlesex Fells, Blue Hills, deCordova Sculpture Park, Boston Common, Arnold Arboretum, etc.
- **Festivals, fairs, and seasonal community events**

Search multiple sources to find real events with accurate details.

For each event found, structure it as a JSON object with these fields:
- `id` (number, sequential)
- `title` (string)
- `venue` (string, venue name)
- `location` (string, "City, MA")
- `category` (string, one of: "farm", "museum", "outdoor")
- `description` (string, 2-3 sentences, family-focused)
- `date` (string, "YYYY-MM-DD" format)
- `endDate` (string, "YYYY-MM-DD" format)
- `time` (string, e.g. "10:00 AM – 4:00 PM")
- `price` (string, with age breakdowns)
- `ageRange` (string, e.g. "All ages", "Ages 0-8")
- `website` (string, real verified URL)
- `image` (string, use "" empty string)
- `tags` (array of strings)
- `recurring` (boolean)

After gathering events, assign images using the venue-to-image mapping in `data/venue-images.json`. Match each event's venue name against the keys in that file and use the corresponding image URL. If a venue is not in the map, fetch the venue/event website to extract the og:image meta tag or hero image URL, then add it to `data/venue-images.json` for future reuse. If no real image can be found, use a relevant Wikimedia Commons image and add that to the map as well.

Write the complete JSON array to `data/events.json`, replacing the existing contents. Find at least 10-15 events.

After updating the file, report what you found, then automatically commit and push to deploy the changes:

1. Run `git add data/events.json`
2. Run `git commit -m "Update events for [date range]"` (use the actual date range you searched)
3. Run `git push`

This will trigger GitHub Pages to redeploy with the latest events.
