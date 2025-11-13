import { corsHeaders } from "@shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('Test API function called');
    
    // Check API key
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY') || Deno.env.get('VITE_OPENAI_API_KEY');
    
    const result = {
      success: true,
      apiKeyFound: !!openaiApiKey,
      apiKeyLength: openaiApiKey ? openaiApiKey.length : 0,
      apiKeyPrefix: openaiApiKey ? openaiApiKey.substring(0, 7) + '...' : 'none',
      availableEnvVars: Object.keys(Deno.env.toObject()).filter(key => 
        key.includes('OPENAI') || key.includes('API')
      ),
      timestamp: new Date().toISOString()
    };
    
    console.log('Test result:', result);
    
    return new Response(
      JSON.stringify(result),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Test API error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});