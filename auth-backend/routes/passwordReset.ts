
import { Router } from "https://deno.land/x/oak@v12.6.1/mod.ts"
import { enhancedJwtService } from "../services/enhancedJwtService.ts"
import { databaseService } from "../services/databaseService.ts"
import { updatedEmailService } from "../services/updatedEmailService.ts"
import { kvStore } from "../services/kvStore.ts"

const passwordResetRoutes = new Router()

// Generate 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// Get client IP helper
function getClientIP(ctx: any): string {
  const forwarded = ctx.request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  return ctx.request.ip || 'unknown'
}

// Request password reset with OTP
passwordResetRoutes.post('/request-password-reset-otp', async (ctx) => {
  try {
    const body = await ctx.request.body({ type: "json" }).value
    const { email } = body
    
    if (!email) {
      ctx.response.status = 400
      ctx.response.body = { error: 'Email is required' }
      return
    }

    console.log('Password reset OTP requested for:', email)

    // Check if user exists
    try {
      await databaseService.getUserByEmail(email)
    } catch (error) {
      console.log('User not found for password reset:', email)
      // Return success anyway for security (don't reveal if email exists)
      ctx.response.body = { 
        success: true, 
        message: 'If an account exists with this email, you will receive a password reset code.' 
      }
      return
    }

    // Generate OTP
    const otp = generateOTP()
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
    
    // Store OTP in KV store
    const otpKey = `password_reset_otp:${email}`
    await kvStore.set(otpKey, {
      otp,
      email,
      expiresAt: expiresAt.toISOString(),
      attempts: 0
    }, 15 * 60) // 15 minutes TTL

    // Send OTP email
    try {
      await updatedEmailService.sendLoginCode(email, otp)
      console.log('Password reset OTP sent to:', email)
    } catch (error) {
      console.error('Failed to send password reset OTP:', error)
      ctx.response.status = 500
      ctx.response.body = { error: 'Failed to send password reset code' }
      return
    }

    ctx.response.body = { 
      success: true, 
      message: 'Password reset code sent to your email' 
    }
  } catch (error) {
    console.error('Password reset OTP request error:', error)
    ctx.response.status = 500
    ctx.response.body = { error: 'Internal server error' }
  }
})

// Verify OTP and reset password
passwordResetRoutes.post('/reset-password-with-otp', async (ctx) => {
  try {
    const body = await ctx.request.body({ type: "json" }).value
    const { email, otp, newPassword } = body
    
    if (!email || !otp || !newPassword) {
      ctx.response.status = 400
      ctx.response.body = { error: 'Email, OTP, and new password are required' }
      return
    }

    console.log('Password reset with OTP attempted for:', email)

    // Get stored OTP
    const otpKey = `password_reset_otp:${email}`
    const storedData = await kvStore.get(otpKey)
    
    if (!storedData) {
      ctx.response.status = 400
      ctx.response.body = { error: 'Invalid or expired OTP' }
      return
    }

    // Check attempts
    if (storedData.attempts >= 3) {
      await kvStore.delete(otpKey)
      ctx.response.status = 400
      ctx.response.body = { error: 'Too many attempts. Please request a new code.' }
      return
    }

    // Verify OTP
    if (storedData.otp !== otp) {
      // Increment attempts
      await kvStore.set(otpKey, {
        ...storedData,
        attempts: storedData.attempts + 1
      }, 15 * 60)
      
      ctx.response.status = 400
      ctx.response.body = { error: 'Invalid OTP' }
      return
    }

    // Check expiration
    if (new Date() > new Date(storedData.expiresAt)) {
      await kvStore.delete(otpKey)
      ctx.response.status = 400
      ctx.response.body = { error: 'OTP has expired' }
      return
    }

    // Update password
    try {
      await databaseService.updateUserPassword(email, newPassword)
      await kvStore.delete(otpKey) // Clean up OTP
      
      console.log('Password reset successful for:', email)
      
      // Revoke all existing tokens for security
      const user = await databaseService.getUserByEmail(email)
      await enhancedJwtService.revokeAllUserTokens(user.id, 'PASSWORD_RESET')
      
      ctx.response.body = { 
        success: true, 
        message: 'Password reset successful' 
      }
    } catch (error) {
      console.error('Failed to update password:', error)
      ctx.response.status = 500
      ctx.response.body = { error: 'Failed to update password' }
    }
  } catch (error) {
    console.error('Password reset with OTP error:', error)
    ctx.response.status = 500
    ctx.response.body = { error: 'Internal server error' }
  }
})

// Request password reset with email link
passwordResetRoutes.post('/request-password-reset-link', async (ctx) => {
  try {
    const body = await ctx.request.body({ type: "json" }).value
    const { email } = body
    
    if (!email) {
      ctx.response.status = 400
      ctx.response.body = { error: 'Email is required' }
      return
    }

    console.log('Password reset link requested for:', email)

    // Check if user exists
    let user
    try {
      user = await databaseService.getUserByEmail(email)
    } catch (error) {
      console.log('User not found for password reset:', email)
      // Return success anyway for security
      ctx.response.body = { 
        success: true, 
        message: 'If an account exists with this email, you will receive a password reset link.' 
      }
      return
    }

    // Generate reset token
    const resetToken = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour
    
    // Store reset token
    const tokenKey = `password_reset_token:${resetToken}`
    await kvStore.set(tokenKey, {
      email,
      userId: user.id,
      expiresAt: expiresAt.toISOString(),
      used: false
    }, 60 * 60) // 1 hour TTL

    // Create reset URL
    const resetUrl = `${Deno.env.get('FRONTEND_URL') || 'http://localhost:5173'}/reset-password/new?token=${resetToken}&email=${encodeURIComponent(email)}`

    // Send reset email
    try {
      await updatedEmailService.sendPasswordReset(email, resetUrl)
      console.log('Password reset link sent to:', email)
    } catch (error) {
      console.error('Failed to send password reset email:', error)
      ctx.response.status = 500
      ctx.response.body = { error: 'Failed to send password reset email' }
      return
    }

    ctx.response.body = { 
      success: true, 
      message: 'Password reset link sent to your email' 
    }
  } catch (error) {
    console.error('Password reset link request error:', error)
    ctx.response.status = 500
    ctx.response.body = { error: 'Internal server error' }
  }
})

// Reset password with token (from email link)
passwordResetRoutes.post('/reset-password-with-token', async (ctx) => {
  try {
    const body = await ctx.request.body({ type: "json" }).value
    const { token, newPassword } = body
    
    if (!token || !newPassword) {
      ctx.response.status = 400
      ctx.response.body = { error: 'Token and new password are required' }
      return
    }

    console.log('Password reset with token attempted')

    // Get stored token data
    const tokenKey = `password_reset_token:${token}`
    const tokenData = await kvStore.get(tokenKey)
    
    if (!tokenData) {
      ctx.response.status = 400
      ctx.response.body = { error: 'Invalid or expired reset token' }
      return
    }

    // Check if token was already used
    if (tokenData.used) {
      ctx.response.status = 400
      ctx.response.body = { error: 'Reset token has already been used' }
      return
    }

    // Check expiration
    if (new Date() > new Date(tokenData.expiresAt)) {
      await kvStore.delete(tokenKey)
      ctx.response.status = 400
      ctx.response.body = { error: 'Reset token has expired' }
      return
    }

    // Update password
    try {
      await databaseService.updateUserPassword(tokenData.email, newPassword)
      
      // Mark token as used
      await kvStore.set(tokenKey, {
        ...tokenData,
        used: true,
        usedAt: new Date().toISOString()
      }, 60 * 60)
      
      console.log('Password reset successful for:', tokenData.email)
      
      // Revoke all existing tokens for security
      await enhancedJwtService.revokeAllUserTokens(tokenData.userId, 'PASSWORD_RESET')
      
      ctx.response.body = { 
        success: true, 
        message: 'Password reset successful' 
      }
    } catch (error) {
      console.error('Failed to update password:', error)
      ctx.response.status = 500
      ctx.response.body = { error: 'Failed to update password' }
    }
  } catch (error) {
    console.error('Password reset with token error:', error)
    ctx.response.status = 500
    ctx.response.body = { error: 'Internal server error' }
  }
})

// Verify reset token (for frontend validation)
passwordResetRoutes.get('/verify-reset-token/:token', async (ctx) => {
  try {
    const token = ctx.params.token
    
    if (!token) {
      ctx.response.status = 400
      ctx.response.body = { error: 'Token is required' }
      return
    }

    // Get stored token data
    const tokenKey = `password_reset_token:${token}`
    const tokenData = await kvStore.get(tokenKey)
    
    if (!tokenData) {
      ctx.response.status = 400
      ctx.response.body = { valid: false, error: 'Invalid token' }
      return
    }

    // Check if token was already used
    if (tokenData.used) {
      ctx.response.status = 400
      ctx.response.body = { valid: false, error: 'Token already used' }
      return
    }

    // Check expiration
    if (new Date() > new Date(tokenData.expiresAt)) {
      await kvStore.delete(tokenKey)
      ctx.response.status = 400
      ctx.response.body = { valid: false, error: 'Token expired' }
      return
    }

    ctx.response.body = { 
      valid: true, 
      email: tokenData.email,
      expiresAt: tokenData.expiresAt
    }
  } catch (error) {
    console.error('Token verification error:', error)
    ctx.response.status = 500
    ctx.response.body = { error: 'Internal server error' }
  }
})

export { passwordResetRoutes }
