// Backend API Route Example - JWT Verification with Clerk
// This would be used in your Node.js/Express backend

import { ClerkExpressRequireAuth } from '@clerk/clerk-sdk-node';
import express from 'express';

const app = express();

// Middleware to verify Clerk JWT tokens
app.use('/api/protected', ClerkExpressRequireAuth());

// Protected route example - Get user episodes
app.get('/api/episodes', async (req, res) => {
  try {
    const userId = req.auth.userId; // Clerk user ID from verified JWT
    
    // Fetch episodes belonging to this user only
    const episodes = await db.episodes.findMany({
      where: { userId: userId },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json({ episodes });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch episodes' });
  }
});

// Protected route example - Create new episode
app.post('/api/episodes', async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { title, audioUrl, youtubeUrl } = req.body;
    
    // Check user's subscription limits
    const user = await db.users.findUnique({
      where: { clerkId: userId },
      include: { subscription: true }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Check episode limits based on subscription
    const episodeCount = await db.episodes.count({
      where: { 
        userId: userId,
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        }
      }
    });
    
    const limits = {
      free: 2,
      starter: 10,
      pro: 50,
      unlimited: Infinity
    };
    
    if (episodeCount >= limits[user.subscription.plan]) {
      return res.status(403).json({ 
        error: 'Episode limit reached for your subscription plan' 
      });
    }
    
    // Create new episode
    const episode = await db.episodes.create({
      data: {
        title,
        audioUrl,
        youtubeUrl,
        userId: userId,
        status: 'processing'
      }
    });
    
    // Trigger AI processing (queue job)
    await processEpisodeQueue.add('process-episode', { episodeId: episode.id });
    
    res.json({ episode });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create episode' });
  }
});

// Webhook handler for Stripe subscription updates
app.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook signature verification failed.`);
  }
  
  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      const subscription = event.data.object;
      
      // Update user subscription in database
      await db.users.update({
        where: { stripeCustomerId: subscription.customer },
        data: {
          subscription: {
            upsert: {
              create: {
                stripeSubscriptionId: subscription.id,
                plan: subscription.items.data[0].price.lookup_key,
                status: subscription.status,
                currentPeriodEnd: new Date(subscription.current_period_end * 1000)
              },
              update: {
                plan: subscription.items.data[0].price.lookup_key,
                status: subscription.status,
                currentPeriodEnd: new Date(subscription.current_period_end * 1000)
              }
            }
          }
        }
      });
      break;
      
    case 'customer.subscription.deleted':
      const deletedSub = event.data.object;
      
      // Downgrade user to free plan
      await db.users.update({
        where: { stripeCustomerId: deletedSub.customer },
        data: {
          subscription: {
            update: {
              plan: 'free',
              status: 'canceled'
            }
          }
        }
      });
      break;
  }
  
  res.json({ received: true });
});

// User creation webhook from Clerk
app.post('/api/webhooks/clerk', async (req, res) => {
  const { type, data } = req.body;
  
  if (type === 'user.created') {
    // Create user record in your database
    await db.users.create({
      data: {
        clerkId: data.id,
        email: data.email_addresses[0].email_address,
        firstName: data.first_name,
        lastName: data.last_name,
        subscription: {
          create: {
            plan: 'free',
            status: 'active'
          }
        }
      }
    });
  }
  
  res.json({ success: true });
});

export default app;