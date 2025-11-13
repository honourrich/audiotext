// Script to fix existing episodes that don't have duration data
// This will estimate duration from transcript length

function estimateDurationFromTranscript(transcript) {
    if (!transcript) return 0;
    
    // Average speaking rate is about 150 words per minute
    const wordsPerMinute = 150;
    const wordCount = transcript.trim().split(/\s+/).length;
    const estimatedMinutes = wordCount / wordsPerMinute;
    
    return Math.floor(estimatedMinutes * 60); // Convert to seconds
}

function fixExistingEpisodes() {
    console.log('Fixing existing episodes...');
    
    // Get episodes from localStorage
    const storedEpisodes = localStorage.getItem('episodes');
    if (!storedEpisodes) {
        console.log('No episodes found in localStorage');
        return;
    }
    
    try {
        const episodes = JSON.parse(storedEpisodes);
        console.log(`Found ${episodes.length} episodes`);
        
        let updatedCount = 0;
        const updatedEpisodes = episodes.map(episode => {
            // If episode doesn't have duration or duration is 0, estimate it
            if (!episode.duration || episode.duration === 0 || episode.duration === '00:00') {
                const estimatedDuration = estimateDurationFromTranscript(episode.transcript);
                if (estimatedDuration > 0) {
                    console.log(`Updating episode "${episode.title}" with estimated duration: ${estimatedDuration} seconds`);
                    updatedCount++;
                    return {
                        ...episode,
                        duration: estimatedDuration
                    };
                }
            }
            return episode;
        });
        
        // Save updated episodes back to localStorage
        localStorage.setItem('episodes', JSON.stringify(updatedEpisodes));
        
        console.log(`Updated ${updatedCount} episodes with estimated durations`);
        console.log('Episodes updated successfully!');
        
        // Dispatch event to update the UI
        window.dispatchEvent(new CustomEvent('episodesUpdated'));
        
    } catch (error) {
        console.error('Error fixing episodes:', error);
    }
}

// Run the fix
fixExistingEpisodes();
