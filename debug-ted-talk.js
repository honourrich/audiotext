// Debug TED talk video caption extraction
const videoId = '-moW9jvvMr4'; // TED talk

async function debugCaptionExtraction() {
  console.log('Fetching video page...');
  
  const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    }
  });
  
  const html = await response.text();
  console.log('Page length:', html.length);
  
  // Look for captionTracks
  const captionRegex = /"captionTracks":\s*\[(.*?)\]/s;
  const match = html.match(captionRegex);
  
  if (match) {
    console.log('\n✅ FOUND captionTracks!\n');
    console.log('Raw caption tracks data:');
    console.log(match[1].substring(0, 500));
    console.log('\n...\n');
    
    // Find all baseUrl entries
    const baseUrlRegex = /"baseUrl":"([^"]+)"/g;
    const urls = [...match[1].matchAll(baseUrlRegex)];
    
    console.log(`\nFound ${urls.length} caption URLs`);
    
    if (urls.length > 0) {
      // Try the first URL
      let captionUrl = urls[0][1]
        .replace(/\\u0026/g, '&')
        .replace(/\\u003d/g, '=')
        .replace(/\\/g, '');
      
      console.log('\nFirst caption URL:', captionUrl.substring(0, 200) + '...');
      
      console.log('\nTrying to fetch captions...');
      const captionResponse = await fetch(captionUrl);
      console.log('Caption response status:', captionResponse.status);
      
      if (captionResponse.ok) {
        const text = await captionResponse.text();
        console.log('Caption text length:', text.length);
        console.log('First 500 chars:', text.substring(0, 500));
      } else {
        console.log('❌ Failed to fetch captions');
      }
    }
  } else {
    console.log('❌ NO captionTracks found in HTML');
    
    // Search for any caption-related text
    const captionSearchTerms = ['caption', 'subtitle', 'transcript'];
    captionSearchTerms.forEach(term => {
      const count = (html.match(new RegExp(term, 'gi')) || []).length;
      console.log(`Found "${term}" ${count} times`);
    });
  }
}

debugCaptionExtraction().catch(console.error);

