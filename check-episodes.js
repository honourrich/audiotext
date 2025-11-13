// Quick script to check localStorage episodes
const fs = require('fs');
const path = require('path');

// Simulate localStorage episodes data
const episodesJson = `[
  {
    "id": "episode_1729876543",
    "userId": "user_123",
    "title": "Transformers, the tech behind LLMs",
    "duration": 0,
    "sourceType": "youtube"
  }
]`;

try {
  const episodes = JSON.parse(episodesJson);
  const youtubeEpisodes = episodes.filter(e => e.sourceType === 'youtube');
  console.log('YouTube episodes:', JSON.stringify(youtubeEpisodes, null, 2));
} catch (e) {
  console.error('Error:', e.message);
}
