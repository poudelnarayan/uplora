// Utility functions for onboarding

export const resetOnboarding = () => {
  localStorage.removeItem('onboarding_completed');
  localStorage.removeItem('onboarding_user_type');
  localStorage.removeItem('onboarding_team_name');
  localStorage.removeItem('onboarding_team_type');
  localStorage.removeItem('onboarding_connected_accounts');
  localStorage.removeItem('onboarding_selected_plan');
  // Legacy key from older onboarding versions
  localStorage.removeItem('onboarding_subscription');
  
  // Also clear user visited flags for testing
  const keys = Object.keys(localStorage);
  keys.forEach(key => {
    if (key.startsWith('user_visited_')) {
      localStorage.removeItem(key);
    }
  });
};

export const completeOnboarding = () => {
  localStorage.setItem('onboarding_completed', 'true');
};

export const isOnboardingCompleted = (): boolean => {
  return localStorage.getItem('onboarding_completed') === 'true';
};

export const getOnboardingData = () => {
  return {
    userType: localStorage.getItem('onboarding_user_type'),
    teamName: localStorage.getItem('onboarding_team_name'),
    teamType: localStorage.getItem('onboarding_team_type'),
    connectedAccounts: localStorage.getItem('onboarding_connected_accounts') 
      ? JSON.parse(localStorage.getItem('onboarding_connected_accounts')!) 
      : []
  };
};
