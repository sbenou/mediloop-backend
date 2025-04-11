
import { selector } from 'recoil';
import { authState } from './atoms';

export const isAuthenticatedSelector = selector({
  key: 'isAuthenticated',
  get: ({ get }) => {
    const auth = get(authState);
    
    // Consider authenticated if we have a user object
    // AND either a profile object OR the auth is still loading
    return !!auth.user && (!!auth.profile || auth.isLoading);
  },
});

export const userRoleSelector = selector({
  key: 'userRole',
  get: ({ get }) => {
    const auth = get(authState);
    // Enhanced debugging for role extraction
    console.log("[userRoleSelector][DEBUG] Auth state:", {
      hasUser: !!auth.user,
      hasProfile: !!auth.profile,
      profileRole: auth.profile?.role,
      profileType: auth.profile ? typeof auth.profile.role : 'undefined'
    });
    
    // More robust role extraction with fallbacks
    return auth.profile?.role || null;
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
    // More robust check for the pharmacist role with detailed logging
    const profileRole = auth.profile?.role;
    const isPharmacist = profileRole === 'pharmacist';
    
    console.log("[isPharmacistSelector][DEBUG] Pharmacist role check:", {
      profileExists: !!auth.profile,
      profileRole: profileRole,
      roleType: typeof profileRole,
      isPharmacist: isPharmacist,
      directCheck: auth.profile?.role === 'pharmacist',
      roleEquals: profileRole === 'pharmacist'
    });
    
    return isPharmacist;
  },
});
