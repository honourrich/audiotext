/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

/**
 * Stripe Checkout Session Creator
 * 
 * Creates a Stripe checkout session for subscription plans
 * 
 * @author Stripe Integration
 * @version 1.0.0
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Stripe SDK for Deno
const Stripe = (await import('https://esm.sh/stripe@14.21.0')).default;
import { createRemoteJWKSet, decodeJwt, jwtVerify } from 'https://esm.sh/jose@5.3.0';

interface CheckoutRequest {
  planName: string;
  priceId?: string;
  userId?: string;
  userEmail?: string;
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
    const { planName, priceId, userEmail, authToken }: CheckoutRequest = await req.json();
    // Validate Clerk session token if provided
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

    let verifiedUserId: string | null = null;
    try {
      const { userId } = await verifyClerkToken(authToken);
      verifiedUserId = userId;
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

    
    if (!planName) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Plan name is required' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Determine price ID for the selected plan
    const proPriceEnv = Deno.env.get('STRIPE_PRO_PRICE_ID') || '';
    const proProductEnv = Deno.env.get('STRIPE_PRO_PRODUCT_ID') || '';

    const priceIdMap: Record<string, string> = {
      'Pro': proPriceEnv || priceId || proProductEnv,
      'Free': '', // Free plan doesn't need checkout
    };

    let stripePriceId = priceIdMap[planName];
    
    if (!stripePriceId) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Invalid plan: ${planName}` 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Allow providing a product ID and look up its active recurring price
    if (stripePriceId.startsWith('prod_')) {
      const prices = await stripe.prices.list({
        product: stripePriceId,
        active: true,
        limit: 5,
      });

      const recurringPrice = prices.data.find((p) => p.type === 'recurring') || prices.data[0];

      if (!recurringPrice) {
        return new Response(
          JSON.stringify({
            success: false,
            error: `No active price found for product ${stripePriceId}`,
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          },
        );
      }

      stripePriceId = recurringPrice.id;
    }

    // Get the base URL from request
    const origin = req.headers.get('Origin') || req.headers.get('Referer') || 'http://localhost:5173';
    const baseUrl = new URL(origin).origin;

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: stripePriceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/checkout/cancel`,
      customer_email: userEmail,
      metadata: {
        plan_name: planName,
        user_id: verifiedUserId ?? '',
      },
      subscription_data: {
        metadata: {
          plan_name: planName,
          user_id: verifiedUserId ?? '',
        },
      },
    });

    console.log(`Created Stripe checkout session: ${session.id} for plan: ${planName}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        sessionId: session.id,
        url: session.url 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Stripe checkout error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Failed to create checkout session',
        details: error.toString()
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

