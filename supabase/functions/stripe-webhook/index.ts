/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

/**
 * Stripe Webhook Handler
 * 
 * Handles Stripe webhook events for subscription management
 * 
 * @author Stripe Integration
 * @version 1.0.0
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Stripe SDK for Deno
const Stripe = (await import('https://esm.sh/stripe@14.21.0')).default;

Deno.serve(async (req) => {
  try {
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    const stripeWebhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || Deno.env.get('SUPABASE_PROJECT_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!stripeSecretKey || !stripeWebhookSecret) {
      console.error('Stripe configuration missing');
      return new Response(
        JSON.stringify({ error: 'Stripe not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Supabase configuration missing');
      return new Response(
        JSON.stringify({ error: 'Supabase not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2024-06-20',
    });

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the raw body for signature verification
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      return new Response(
        JSON.stringify({ error: 'Missing stripe-signature header' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verify webhook signature
    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, stripeWebhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return new Response(
        JSON.stringify({ error: `Webhook signature verification failed: ${err.message}` }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Received Stripe webhook event: ${event.type}`);

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any;
        const customerId = session.customer;
        const subscriptionId = session.subscription;
        const planName = session.metadata?.plan_name || 'Pro';
        const customerEmail = session.customer_email || session.customer_details?.email;

        console.log(`Checkout completed for customer: ${customerId}, subscription: ${subscriptionId}`);

        // Find user by email in Supabase
        if (customerEmail) {
          const { data: users, error: userError } = await supabase
            .from('users')
            .select('id, clerk_id')
            .eq('email', customerEmail)
            .limit(1);

          if (userError) {
            console.error('Error finding user:', userError);
          } else if (users && users.length > 0) {
            const userId = users[0].id;

            // Update or insert user subscription
            const { error: subError } = await supabase
              .from('user_subscriptions')
              .upsert({
                user_id: userId,
                stripe_customer_id: customerId,
                stripe_subscription_id: subscriptionId,
                plan_name: planName,
                status: 'active',
                current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // Approximate, will be updated by subscription.updated
                updated_at: new Date().toISOString(),
              }, {
                onConflict: 'user_id',
              });

            if (subError) {
              console.error('Error updating subscription:', subError);
            } else {
              console.log(`Updated subscription for user: ${userId}`);
            }
          }
        }

        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as any;
        const customerId = subscription.customer;
        const subscriptionId = subscription.id;
        const status = subscription.status;
        const planName = subscription.metadata?.plan_name || 'Pro';
        const currentPeriodEnd = new Date(subscription.current_period_end * 1000).toISOString();

        console.log(`Subscription ${event.type}: ${subscriptionId} for customer: ${customerId}`);

        // Find user by Stripe customer ID
        const { data: users, error: userError } = await supabase
          .from('user_subscriptions')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .limit(1);

        if (userError) {
          console.error('Error finding subscription:', userError);
        } else if (users && users.length > 0) {
          const userId = users[0].user_id;

          // Update subscription
          const { error: subError } = await supabase
            .from('user_subscriptions')
            .update({
              stripe_subscription_id: subscriptionId,
              plan_name: planName,
              status: status,
              current_period_end: currentPeriodEnd,
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', userId);

          if (subError) {
            console.error('Error updating subscription:', subError);
          } else {
            console.log(`Updated subscription for user: ${userId}`);
          }
        }

        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as any;
        const customerId = subscription.customer;

        console.log(`Subscription deleted for customer: ${customerId}`);

        // Find user by Stripe customer ID
        const { data: users, error: userError } = await supabase
          .from('user_subscriptions')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .limit(1);

        if (userError) {
          console.error('Error finding subscription:', userError);
        } else if (users && users.length > 0) {
          const userId = users[0].user_id;

          // Downgrade to Free plan
          const { error: subError } = await supabase
            .from('user_subscriptions')
            .update({
              plan_name: 'Free',
              status: 'canceled',
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', userId);

          if (subError) {
            console.error('Error downgrading subscription:', subError);
          } else {
            console.log(`Downgraded user ${userId} to Free plan`);
          }
        }

        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as any;
        const subscriptionId = invoice.subscription;
        const customerId = invoice.customer;

        console.log(`Payment succeeded for subscription: ${subscriptionId}`);

        // Update subscription status if needed
        const { error: subError } = await supabase
          .from('user_subscriptions')
          .update({
            status: 'active',
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscriptionId);

        if (subError) {
          console.error('Error updating payment status:', subError);
        }

        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as any;
        const subscriptionId = invoice.subscription;

        console.log(`Payment failed for subscription: ${subscriptionId}`);

        // Update subscription status
        const { error: subError } = await supabase
          .from('user_subscriptions')
          .update({
            status: 'past_due',
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscriptionId);

        if (subError) {
          console.error('Error updating payment failure status:', subError);
        }

        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(
      JSON.stringify({ received: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Webhook processing failed',
        details: error.toString()
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

