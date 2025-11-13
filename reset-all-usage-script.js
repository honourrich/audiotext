// JavaScript script to reset all usage via Supabase client
// Can be run in browser console or Node.js environment
// 
// WARNING: This will reset ALL usage data for ALL users
// Use this only for testing/development purposes

import { createClient } from '@supabase/supabase-js';

// Get your Supabase URL and anon key from environment variables or config
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function resetAllUsage() {
  try {
    console.log('🔄 Resetting all usage data...');
    
    // Update all usage records to zero
    const { data, error } = await supabase
      .from('user_usage')
      .update({
        total_minutes_processed: 0,
        gpt_prompts_used: 0,
        episodes_processed: 0,
        api_calls_made: 0,
        total_cost: 0.00,
        updated_at: new Date().toISOString()
      })
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Update all rows
    
    if (error) {
      console.error('❌ Error resetting usage:', error);
      throw error;
    }
    
    console.log('✅ Successfully reset all usage data');
    console.log('📊 Updated records:', data);
    
    // Verify the reset
    const { data: verification, error: verifyError } = await supabase
      .from('user_usage')
      .select('user_id, month_year, total_minutes_processed, gpt_prompts_used')
      .limit(10);
    
    if (verifyError) {
      console.error('❌ Error verifying reset:', verifyError);
    } else {
      console.log('📋 Sample records after reset:');
      console.table(verification);
    }
    
    // Get summary
    const { data: summary, error: summaryError } = await supabase
      .from('user_usage')
      .select('total_minutes_processed, gpt_prompts_used, episodes_processed');
    
    if (!summaryError && summary) {
      const totals = summary.reduce((acc, record) => ({
        minutes: acc.minutes + (record.total_minutes_processed || 0),
        prompts: acc.prompts + (record.gpt_prompts_used || 0),
        episodes: acc.episodes + (record.episodes_processed || 0),
      }), { minutes: 0, prompts: 0, episodes: 0 });
      
      console.log('📊 Summary after reset:');
      console.log('  Total minutes:', totals.minutes);
      console.log('  Total GPT prompts:', totals.prompts);
      console.log('  Total episodes:', totals.episodes);
    }
    
    return { success: true, data };
  } catch (error) {
    console.error('❌ Failed to reset usage:', error);
    return { success: false, error };
  }
}

// If running in browser console, you can call:
// resetAllUsage();

export default resetAllUsage;

