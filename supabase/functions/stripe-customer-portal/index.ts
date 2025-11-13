/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

/**
 * Stripe Customer Portal Session Creator
 * 
 * Creates a Stripe Customer Portal session for subscription management
 * 
 * @author Stripe Integration
 * @version 1.0.0
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createRemoteJWKSet, decodeJwt, jwtVerify } from 'https://esm.sh/jose@5.3.0';

// Stripe SDK for Deno
const Stripe = (await import('https://esm.sh/stripe@14.21.0')).default;

interface PortalRequest {
  returnUrl: string;
  userId?: string;
  authToken?: string;
}

async function verifyClerkToken(token: string): Promise<{ userId: string | null }> {
  const decoded = decodeJwt(token);
  const issuer = decoded.iss;

  if (!issuer) {
    throw new Error('Token missing issuer');
  }

  const jwksUrl = `${issuer.replace(/\/$/, '')}/.well-known/jwks.json`;
  const jwks = createRemoteJWKSet(new URL(jwksUrl));

  const { payload } = await jwtVerify(token, jwks, {
    issuer,
  });

  return {
    userId: typeof payload.sub === 'string' ? payload.sub : null,
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    
    if (!stripeSecretKey) {
      console.error('STRIPE_SECRET_KEY not configured');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Stripe not configured' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2024-06-20',
    });

    // Parse request body
    const { returnUrl, authToken }: PortalRequest = await req.json();
    
    if (!returnUrl) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Return URL is required' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get Supabase client to find Stripe customer ID
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || Deno.env.get('SUPABASE_PROJECT_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Supabase not configured' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Validate Clerk token and get user ID
    let userId: string | null = null;
    
    if (!authToken) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Authentication token required' 
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    try {
      const verified = await verifyClerkToken(authToken);
      userId = verified.userId;
    } catch (error) {
      console.error('Clerk JWT verification failed:', error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid authentication token' 
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!userId) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid authentication token' 
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Find user's Stripe customer ID
    const { data: subscription, error: subError } = await supabase
      .from('user_subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .single();

    if (subError || !subscription?.stripe_customer_id) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'No active subscription found. Please subscribe first.' 
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Create Stripe Customer Portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: returnUrl,
    });

    console.log(`Created Stripe customer portal session: ${session.id} for customer: ${subscription.stripe_customer_id}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        url: session.url 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Stripe customer portal error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Failed to create customer portal session',
        details: error.toString()
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

