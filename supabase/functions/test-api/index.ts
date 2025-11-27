import { corsHeaders } from "@shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // SECURITY: This endpoint should only be used for internal testing
    // It no longer exposes API key information to prevent leaks
    
    // Check API key exists (but don't expose details)
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY') || Deno.env.get('VITE_OPENAI_API_KEY');
    
    const result = {
      success: true,
      apiKeyConfigured: !!openaiApiKey,
      // Removed: apiKeyLength, apiKeyPrefix, and availableEnvVars to prevent information leakage
      timestamp: new Date().toISOString(),
      message: 'API configuration check completed'
    };
    
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
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});