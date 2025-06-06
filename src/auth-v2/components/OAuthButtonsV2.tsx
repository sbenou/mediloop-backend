
import { Button } from '@/components/ui/button'
import { authClient } from '@/services/authClient'
import { useLocationDetection } from '@/hooks/useLocationDetection'
import { useLuxTrustAuth } from '@/hooks/useLuxTrustAuth'
import { toast } from '@/components/ui/use-toast'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/auth/useAuth'

export const OAuthButtonsV2 = () => {
  const { locationPreference } = useLocationDetection()
  const { authenticateWithLuxTrust, isAuthenticating } = useLuxTrustAuth()
  const { profile } = useAuth()
  const navigate = useNavigate()

  const handleGoogleAuth = () => {
    authClient.initiateGoogleAuth()
  }

  const handleFranceConnectAuth = () => {
    authClient.initiateFranceConnectAuth()
  }

  const handleLuxTrustAuth = async () => {
    try {
      const response = await authenticateWithLuxTrust()
      if (response?.success) {
        toast({
          title: 'LuxTrust Authentication Successful',
          description: 'You have been successfully authenticated with LuxTrust.',
        })
        // Redirect to dashboard after successful authentication
        navigate('/dashboard')
      }
    } catch (error) {
      console.error('LuxTrust authentication error:', error)
      toast({
        title: 'Authentication Failed',
        description: 'Failed to authenticate with LuxTrust. Please try again.',
        variant: 'destructive'
      })
    }
  }

  // Check if user is a professional (doctor/pharmacist)
  const isProfessional = profile?.role === 'doctor' || profile?.role === 'pharmacist'

  return (
    <div className="space-y-3">
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>
      
      <div className="space-y-2 mt-6">
        {/* For professionals: Only show country-specific auth */}
        {isProfessional ? (
          <>
            {/* LuxTrust - Only for Luxembourg professionals */}
            {locationPreference.isLuxembourg && (
              <Button
                variant="outline"
                type="button"
                className="w-full h-14"
                onClick={handleLuxTrustAuth}
                disabled={isAuthenticating}
              >
                <div className="mr-2 h-4 w-4 rounded bg-red-600 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">LT</span>
                </div>
                {isAuthenticating ? 'Authenticating...' : 'Continue with LuxTrust'}
              </Button>
            )}
            
            {/* FranceConnect - Only for France professionals */}
            {locationPreference.country === 'FR' && (
              <Button
                variant="outline"
                type="button"
                className="w-full h-14"
                onClick={handleFranceConnectAuth}
              >
                <div className="mr-2 h-4 w-4 rounded bg-blue-600 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">FC</span>
                </div>
                Continue with FranceConnect
              </Button>
            )}
            
            {/* If professional but not in supported country */}
            {!locationPreference.isLuxembourg && locationPreference.country !== 'FR' && (
              <div className="text-center text-sm text-muted-foreground p-4 border rounded">
                Professional authentication is available in Luxembourg (LuxTrust) and France (FranceConnect)
              </div>
            )}
          </>
        ) : (
          <>
            {/* For patients: Show all available options like test-luxembourg */}
            
            {/* Google - Always available */}
            <Button
              variant="outline"
              type="button"
              className="w-full h-14"
              onClick={handleGoogleAuth}
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Continue with Google
            </Button>
            
            {/* LuxTrust - Only for Luxembourg */}
            {locationPreference.isLuxembourg && (
              <Button
                variant="outline"
                type="button"
                className="w-full h-14"
                onClick={handleLuxTrustAuth}
                disabled={isAuthenticating}
              >
                <div className="mr-2 h-4 w-4 rounded bg-red-600 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">LT</span>
                </div>
                {isAuthenticating ? 'Authenticating...' : 'Continue with LuxTrust'}
              </Button>
            )}
            
            {/* FranceConnect - Only for France */}
            {locationPreference.country === 'FR' && (
              <Button
                variant="outline"
                type="button"
                className="w-full h-14"
                onClick={handleFranceConnectAuth}
              >
                <div className="mr-2 h-4 w-4 rounded bg-blue-600 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">FC</span>
                </div>
                Continue with FranceConnect
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
