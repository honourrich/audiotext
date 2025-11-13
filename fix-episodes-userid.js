// Script to add userId to existing episodes in localStorage
function fixEpisodesUserId() {
  console.log('🔧 Fixing episodes: Adding userId to episodes without it...');
  
  const storedEpisodes = localStorage.getItem('episodes');
  if (!storedEpisodes) {
    console.log('No episodes found in localStorage');
    return;
  }
  
  try {
    const episodes = JSON.parse(storedEpisodes);
    let updatedCount = 0;
    
    // Get current user ID from Clerk (you'll need to run this in browser console)
    // For now, we'll use a placeholder - user should update this
    const currentUserId = prompt('Enter your Clerk user ID (check browser console for user.id):') || '';
    
    if (!currentUserId) {
      console.log('⚠️  No userId provided. Episodes will be updated when you add userId manually.');
      return;
    }
    
    const updatedEpisodes = episodes.map(episode => {
      if (!episode.userId) {
        console.log(`Adding userId to episode: "${episode.title}"`);
        updatedCount++;
        return {
          ...episode,
          userId: currentUserId
        };
      }
      return episode;
    });
    
    if (updatedCount > 0) {
      localStorage.setItem('episodes', JSON.stringify(updatedEpisodes));
      console.log(`✅ Updated ${updatedCount} episodes with userId`);
      console.log('🔄 Triggering usage update...');
      window.dispatchEvent(new CustomEvent('usageUpdated'));
    } else {
      console.log('✅ All episodes already have userId');
    }
  } catch (error) {
    console.error('Error fixing episodes:', error);
  }
}

// Run the fix
fixEpisodesUserId();
