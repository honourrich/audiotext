import { EpisodeService } from './episodeService';

// Helper function to migrate localStorage data to Supabase
export const migrateLocalStorageToSupabase = async (userId: string) => {
  try {
    // Check if migration has already been done
    const migrationKey = `migration_completed_${userId}`;
    const migrationCompleted = localStorage.getItem(migrationKey);
    
    if (migrationCompleted) {
      console.log('Migration already completed for user:', userId);
      return;
    }

    // Migrate episodes
    await EpisodeService.migrateFromLocalStorage(userId);
    
    // Mark migration as completed
    localStorage.setItem(migrationKey, 'true');
    
    console.log('Successfully migrated localStorage data to Supabase');
  } catch (error) {
    console.error('Error during migration:', error);
    throw error;
  }
};

// Helper function to check if user has data in localStorage
export const hasLocalStorageData = (): boolean => {
  const episodes = localStorage.getItem('episodes');
  return !!episodes && episodes !== '[]';
};

// Helper function to clear localStorage after successful migration
export const clearLocalStorageAfterMigration = () => {
  localStorage.removeItem('episodes');
  console.log('Cleared localStorage data after successful migration');
};
