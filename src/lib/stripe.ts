/**
 * Stripe Integration Utilities
 * 
 * Handles Stripe Checkout and Customer Portal interactions
 */

import { loadStripe } from '@stripe/stripe-js';
import { supabase } from '@/lib/supabase';

// Initialize Stripe
const getStripe = () => {
  const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
  if (!publishableKey) {
    console.error('VITE_STRIPE_PUBLISHABLE_KEY is not set');
    return null;
  }
  return loadStripe(publishableKey);
};

const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Create a Stripe checkout session and redirect to checkout
 */
export async function createCheckoutSession(
  planName: string,
  userEmail: string | undefined,
  authToken: string | undefined
): Promise<void> {
  try {
    if (!authToken) {
      throw new Error('Missing authorization token. Please sign in again.');
    }

    const { data, error } = await supabase.functions.invoke<{
      success: boolean;
      url?: string;
      sessionId?: string;
      error?: string;
    }>('stripe-checkout', {
      body: {
        planName,
        userEmail,
        authToken,
      },
      headers: supabaseAnonKey ? { apikey: supabaseAnonKey } : undefined,
    });

    if (error || !data?.success) {
      throw new Error(data?.error || error?.message || 'Failed to create checkout session');
    }

    const { url, sessionId } = data;

    if (url) {
      // Redirect to Stripe Checkout
      window.location.href = url;
    } else {
      throw new Error('No checkout URL returned');
    }
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
}

/**
 * Create a Stripe Customer Portal session and redirect
 */
export async function createCustomerPortalSession(
  returnUrl: string,
  authToken: string | undefined
): Promise<void> {
  try {
    if (!authToken) {
      throw new Error('Missing authorization token. Please sign in again.');
    }

    const { data, error } = await supabase.functions.invoke<{
      success: boolean;
      url?: string;
      error?: string;
    }>('stripe-customer-portal', {
      body: {
        returnUrl,
        authToken,
      },
      headers: supabaseAnonKey ? { apikey: supabaseAnonKey } : undefined,
    });

    if (error || !data?.success) {
      throw new Error(data?.error || error?.message || 'Failed to create customer portal session');
    }

    const { url } = data;

    if (url) {
      // Redirect to Stripe Customer Portal
      window.location.href = url;
    } else {
      throw new Error('No portal URL returned');
    }
  } catch (error) {
    console.error('Error creating customer portal session:', error);
    throw error;
  }
}

export { getStripe };

