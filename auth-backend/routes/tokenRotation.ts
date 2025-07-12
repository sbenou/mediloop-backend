
import { Router } from "https://deno.land/x/oak@v12.6.1/mod.ts"
import { tokenRotationService } from "../services/tokenRotationService.ts"
import { enhancedJwtService } from "../services/enhancedJwtService.ts"

const tokenRotationRoutes = new Router()

// Client endpoint to check for rotated tokens
tokenRotationRoutes.get('/rotated-token', async (ctx) => {
  try {
    const authHeader = ctx.request.headers.get("Authorization")
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      ctx.response.status = 401
      ctx.response.body = { error: 'Authorization header required' }
      return
    }

    const token = authHeader.substring(7)
    const verification = await enhancedJwtService.verifyToken(token)
    
    if (!verification.valid || !verification.payload) {
      ctx.response.status = 401
      ctx.response.body = { error: 'Invalid token' }
      return
    }

    const rotatedToken = await tokenRotationService.getRotatedToken(verification.payload.sub)
    
    if (rotatedToken) {
      ctx.response.body = {
        hasRotatedToken: true,
        token: rotatedToken.token,
        expiresAt: rotatedToken.expiresAt,
        rotatedAt: rotatedToken.rotatedAt
      }
    } else {
      ctx.response.body = {
        hasRotatedToken: false
      }
    }
  } catch (error) {
    console.error('Error checking rotated token:', error)
    ctx.response.status = 500
    ctx.response.body = { error: 'Failed to check rotated token' }
  }
})

// Manual trigger for testing (admin only)
tokenRotationRoutes.post('/trigger-rotation', async (ctx) => {
  try {
    console.log('[Admin] Manual rotation trigger requested')
    await tokenRotationService.processScheduledRotations()
    ctx.response.body = { message: 'Rotation process triggered successfully' }
  } catch (error) {
    console.error('Error triggering rotation:', error)
    ctx.response.status = 500
    ctx.response.body = { error: 'Failed to trigger rotation' }
  }
})

export { tokenRotationRoutes }
