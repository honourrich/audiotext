// Find where YouTube stores caption data now
const videoId = '-moW9jvvMr4';

async function findCaptionData() {
  const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    }
  });
  
  const html = await response.text();
  
  // Try different patterns
  const patterns = [
    /"captions":\{[^}]*"playerCaptionsTracklistRenderer":\{[^}]*"captionTracks":\[/,
    /"playerCaptionsTracklistRenderer":\{/,
    /"captionTracks":\[/,
    /playerCaptionsTracklistRenderer/,
    /"timedtext"/
  ];
  
  console.log('Searching for caption data patterns...\n');
  
  patterns.forEach((pattern, i) => {
    const match = html.match(pattern);
    if (match) {
      console.log(`✅ Pattern ${i + 1} FOUND:`, pattern.toString());
      const startIndex = html.indexOf(match[0]);
      console.log('Context:', html.substring(startIndex, startIndex + 300));
      console.log('\n' + '='.repeat(60) + '\n');
    } else {
      console.log(`❌ Pattern ${i + 1} NOT found:`, pattern.toString());
    }
  });
  
  // Try to find ytInitialPlayerResponse
  console.log('\nLooking for ytInitialPlayerResponse...');
  const playerResponseMatch = html.match(/var ytInitialPlayerResponse = (\{.+?\});/s);
  if (playerResponseMatch) {
    console.log('✅ Found ytInitialPlayerResponse');
    try {
      const playerData = JSON.parse(playerResponseMatch[1]);
      console.log('Player data keys:', Object.keys(playerData));
      
      if (playerData.captions) {
        console.log('\n✅✅✅ FOUND CAPTIONS DATA!');
        console.log(JSON.stringify(playerData.captions, null, 2).substring(0, 1000));
      }
    } catch (e) {
      console.log('Failed to parse:', e.message);
    }
  } else {
    console.log('❌ ytInitialPlayerResponse not found');
  }
}

findCaptionData().catch(console.error);

