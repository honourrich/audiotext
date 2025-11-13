// Test timedtext API directly
const videoId = '-moW9jvvMr4'; // TED talk

async function testTimedtext() {
  const endpoints = [
    `https://www.youtube.com/api/timedtext?v=${videoId}&lang=en`,
    `https://www.youtube.com/api/timedtext?v=${videoId}&lang=en&fmt=srv3`,
    `https://www.youtube.com/api/timedtext?v=${videoId}&lang=en&fmt=json3`,
    `https://www.youtube.com/api/timedtext?v=${videoId}&lang=en&kind=asr`,
  ];
  
  for (const endpoint of endpoints) {
    console.log('\n' + '='.repeat(80));
    console.log('Testing:', endpoint);
    console.log('='.repeat(80));
    
    try {
      const response = await fetch(endpoint);
      console.log('Status:', response.status);
      console.log('Content-Type:', response.headers.get('content-type'));
      console.log('Content-Length:', response.headers.get('content-length'));
      
      if (response.ok) {
        const text = await response.text();
        console.log('Response length:', text.length);
        console.log('First 500 chars:', text.substring(0, 500));
        
        if (text.length > 100) {
          console.log('✅ This endpoint returned data!');
        }
      }
    } catch (error) {
      console.log('❌ Error:', error.message);
    }
  }
}

testTimedtext().catch(console.error);

