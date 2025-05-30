
import { renderHook, act } from '@testing-library/react';
import { useLuxTrustAuth } from './useLuxTrustAuth';
import { toast } from '@/components/ui/use-toast';

// Mock toast
jest.mock('@/components/ui/use-toast');
const mockToast = toast as jest.MockedFunction<typeof toast>;

describe('useLuxTrustAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should authenticate with LuxTrust successfully', async () => {
    const { result } = renderHook(() => useLuxTrustAuth());

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isAuthenticating).toBe(false);

    await act(async () => {
      const response = await result.current.authenticateWithLuxTrust();
      expect(response).toBeTruthy();
      expect(response?.success).toBe(true);
      expect(response?.profile?.professionalId).toContain('LUX-DOC');
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.authResponse?.profile?.certificationLevel).toBe('professional');
    expect(mockToast).toHaveBeenCalledWith({
      title: 'LuxTrust Authentication Successful',
      description: 'Your professional credentials have been verified.',
    });
  });

  test('should handle authentication loading state', async () => {
    const { result } = renderHook(() => useLuxTrustAuth());

    let authPromise: Promise<any>;

    act(() => {
      authPromise = result.current.authenticateWithLuxTrust();
    });

    expect(result.current.isAuthenticating).toBe(true);

    await act(async () => {
      await authPromise;
    });

    expect(result.current.isAuthenticating).toBe(false);
  });

  test('should clear authentication', async () => {
    const { result } = renderHook(() => useLuxTrustAuth());

    // First authenticate
    await act(async () => {
      await result.current.authenticateWithLuxTrust();
    });

    expect(result.current.isAuthenticated).toBe(true);

    // Then clear
    act(() => {
      result.current.clearAuth();
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.authResponse).toBeNull();
  });
});
