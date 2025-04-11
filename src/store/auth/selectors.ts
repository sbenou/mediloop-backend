
import { selector } from 'recoil';
import { authState } from './atoms';

export const isAuthenticatedSelector = selector({
  key: 'isAuthenticated',
  get: ({ get }) => {
    const auth = get(authState);
    // Consider authenticated if we have a user object
    return !!auth.user;
  },
});

export const userRoleSelector = selector({
  key: 'userRole',
  get: ({ get }) => {
    const auth = get(authState);
    
    // First check the profile role as the highest priority source of truth
    if (auth.profile?.role) {
      // Always normalize 'user' role to 'patient'
      return auth.profile.role === 'user' ? 'patient' : auth.profile.role;
    }
    
    // Fallback to user metadata if available
    if (auth.user?.user_metadata?.role) {
      const metadataRole = auth.user.user_metadata.role;
      return metadataRole === 'user' ? 'patient' : metadataRole;
    }
    
    // Default to patient if authenticated but no role found
    return auth.user ? 'patient' : null;
  },
});

export const userPermissionsSelector = selector({
  key: 'userPermissions',
  get: ({ get }) => {
    const auth = get(authState);
    // Return permissions
    return auth.permissions || [];
  },
});

export const isLoadingSelector = selector({
  key: 'isAuthLoading',
  get: ({ get }) => {
    const auth = get(authState);
    return auth.isLoading;
  },
});

export const isPharmacistSelector = selector({
  key: 'isPharmacist',
  get: ({ get }) => {
    const auth = get(authState);
    // Check for 'pharmacist' role in multiple places
    if (auth.profile?.role === 'pharmacist') {
      return true;
    }
    
    // Also check user metadata as fallback
    if (auth.user?.user_metadata?.role === 'pharmacist') {
      return true;
    }
    
    return false;
  },
});
