
import { selector } from 'recoil';
import { authState } from './atoms';

export const isAuthenticatedSelector = selector({
  key: 'isAuthenticated',
  get: ({ get }) => {
    const auth = get(authState);
    // Consider authenticated if we have both user and profile
    return !!auth.user && !!auth.profile;
  },
});

export const userRoleSelector = selector({
  key: 'userRole',
  get: ({ get }) => {
    const auth = get(authState);
    // Return role even during loading if we have it
    return auth.profile?.role || null;
  },
});

export const userPermissionsSelector = selector({
  key: 'userPermissions',
  get: ({ get }) => {
    const auth = get(authState);
    // Return permissions even during loading if we have them
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
    const profileRole = auth.profile?.role;
    
    // Enhanced check with detailed logging
    const result = typeof profileRole === 'string' && 
                  profileRole.toLowerCase() === 'pharmacist';
    
    console.log("[isPharmacistSelector] Check result:", { 
      profileRole, 
      result,
      typeOfRole: typeof profileRole,
      lowerCaseCheck: typeof profileRole === 'string' ? profileRole.toLowerCase() === 'pharmacist' : false 
    });
    
    return result;
  },
});
