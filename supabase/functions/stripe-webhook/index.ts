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
      event = await stripe.webhooks.constructEventAsync(body, signature, stripeWebhookSecret);
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
        // Get Clerk user ID from metadata (set during checkout)
        const clerkUserId = session.metadata?.user_id;

        console.log(`Checkout completed for customer: ${customerId}, subscription: ${subscriptionId}, email: ${customerEmail}, clerkUserId: ${clerkUserId}`);

        let userId: string | null = null;

        // First, try to use Clerk user ID from metadata (most reliable)
        if (clerkUserId) {
          userId = clerkUserId;
          console.log(`Using Clerk user ID from metadata: ${userId}`);
        } else if (customerEmail) {
          // Fallback: Find user by email in Supabase
          const { data: users, error: userError } = await supabase
            .from('users')
            .select('id, clerk_id, email')
            .eq('email', customerEmail)
            .limit(1);

          if (userError) {
            console.error('Error finding user:', userError);
          } else if (users && users.length > 0) {
            // Use clerk_id if available, otherwise use id
            userId = users[0].clerk_id || users[0].id;
            console.log(`Found user by email: ${userId} for email: ${customerEmail}`);
          } else {
            console.log(`No user found for email: ${customerEmail}`);
          }
        }

        if (!userId) {
          console.error('No user ID found - cannot create subscription. Email:', customerEmail, 'ClerkUserId:', clerkUserId);
          break;
        }

        // Get Pro plan ID
        const { data: proPlan, error: planError } = await supabase
          .from('subscription_plans')
          .select('id')
          .eq('name', 'Pro')
          .limit(1)
          .single();

        const planId = planError ? null : proPlan?.id;

        // Update or insert user subscription
        const { error: subError } = await supabase
          .from('user_subscriptions')
          .upsert({
            user_id: userId,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            plan_id: planId,
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
          console.log(`✅ Successfully created/updated subscription for user: ${userId}`);
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
        // Try to get Clerk user ID from subscription metadata (set during checkout)
        const clerkUserId = subscription.metadata?.user_id;
        
        // Safely parse current_period_end - handle null/undefined/invalid values
        let currentPeriodEnd: string | null = null;
        if (subscription.current_period_end && typeof subscription.current_period_end === 'number') {
          try {
            const date = new Date(subscription.current_period_end * 1000);
            if (!isNaN(date.getTime())) {
              currentPeriodEnd = date.toISOString();
            } else {
              console.warn(`Invalid current_period_end timestamp: ${subscription.current_period_end}`);
            }
          } catch (error) {
            console.error('Error parsing current_period_end:', error);
          }
        }

        console.log(`Subscription ${event.type}: ${subscriptionId} for customer: ${customerId}, status: ${status}, clerkUserId: ${clerkUserId}`);

        // Get Pro plan ID
        const { data: proPlan, error: planError } = await supabase
          .from('subscription_plans')
          .select('id')
          .eq('name', 'Pro')
          .limit(1)
          .single();

        const planId = planError ? null : proPlan?.id;

        // Find user by Stripe customer ID
        const { data: subscriptions, error: subQueryError } = await supabase
          .from('user_subscriptions')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .limit(1);

        let userId: string | null = null;

        if (subQueryError) {
          console.error('Error finding subscription:', subQueryError);
        } else if (subscriptions && subscriptions.length > 0) {
          userId = subscriptions[0].user_id;
        } else {
          // Subscription not found - try to create it using Clerk user ID from metadata
          if (clerkUserId) {
            console.log(`No subscription found for customer ${customerId}, creating new subscription using Clerk user ID: ${clerkUserId}`);
            userId = clerkUserId;
            
            // Create new subscription record
            const { error: createError } = await supabase
              .from('user_subscriptions')
              .insert({
                user_id: userId,
                stripe_customer_id: customerId,
                stripe_subscription_id: subscriptionId,
                plan_id: planId,
                plan_name: planName,
                status: status,
                current_period_end: currentPeriodEnd,
                updated_at: new Date().toISOString(),
              });

            if (createError) {
              console.error('Error creating subscription:', createError);
            } else {
              console.log(`✅ Created new subscription for user: ${userId}`);
            }
          } else {
            console.log(`No subscription found for Stripe customer: ${customerId} and no Clerk user ID in metadata - subscription may need to be created via checkout.session.completed first`);
          }
        }

        // Update existing subscription if found
        if (userId && subscriptions && subscriptions.length > 0) {
          // Prepare update object - only include fields that have values
          const updateData: any = {
            stripe_subscription_id: subscriptionId,
            plan_name: planName,
            status: status,
            updated_at: new Date().toISOString(),
          };

          if (planId) {
            updateData.plan_id = planId;
          }

          if (currentPeriodEnd) {
            updateData.current_period_end = currentPeriodEnd;
          }

          // Update subscription
          const { error: subError } = await supabase
            .from('user_subscriptions')
            .update(updateData)
            .eq('user_id', userId);

          if (subError) {
            console.error('Error updating subscription:', subError);
          } else {
            console.log(`✅ Updated subscription for user: ${userId}`);
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

