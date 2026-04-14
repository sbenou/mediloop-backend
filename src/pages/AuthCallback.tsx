
import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { persistV2SessionFromBackendLogin } from '@/lib/auth/v2SessionStorage'
import { authClient } from '@/services/authClient'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader } from 'lucide-react'
import { toast } from '@/components/ui/use-toast'
import { getDashboardRouteByRole } from '@/utils/auth/getDashboardRouteByRole'

const AuthCallback = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  useEffect(() => {
    const handleCallback = async () => {
      const token = searchParams.get('token')
      const error = searchParams.get('error')

      if (error) {
        toast({
          variant: 'destructive',
          title: 'Authentication failed',
          description: error
        })
        navigate('/login')
        return
      }

      if (token) {
        try {
          // Set the token
          authClient.handleOAuthCallback(token)
          
          // Verify the token and get user info
          const verification = await authClient.verifyToken()
          
          if (verification.valid && verification.payload?.sub) {
            persistV2SessionFromBackendLogin({
              accessToken: token,
              refreshToken: token,
              userId: verification.payload.sub,
            })
            toast({
              title: 'Login successful',
              description: 'Welcome! You have been successfully authenticated.'
            })
            
            const userRole = verification.payload?.role
            navigate(getDashboardRouteByRole(userRole))
          } else {
            throw new Error('Token verification failed')
          }
        } catch (error) {
          console.error('Auth callback error:', error)
          toast({
            variant: 'destructive',
            title: 'Authentication failed',
            description: 'Failed to complete authentication. Please try again.'
          })
          navigate('/login')
        }
      } else {
        toast({
          variant: 'destructive',
          title: 'Authentication failed',
          description: 'No authentication token received.'
        })
        navigate('/login')
      }
    }

    handleCallback()
  }, [searchParams, navigate])

  return (
    <div className="container mx-auto flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="space-y-1 text-center">
          <div className="flex flex-col items-center justify-center space-y-4">
            <Loader className="h-8 w-8 animate-spin text-primary" />
            <CardTitle className="text-2xl">Completing Authentication</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-muted-foreground">
            Please wait while we complete your authentication...
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export default AuthCallback
