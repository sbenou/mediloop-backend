
import { config } from "../config/env.ts"

export class EmailService {
  private resendApiKey: string

  constructor() {
    this.resendApiKey = config.RESEND_API_KEY || Deno.env.get('RESEND_API_KEY') || ''
    if (!this.resendApiKey) {
      console.warn('RESEND_API_KEY not configured - email sending will not work')
    }
  }

  private async loadTemplate(templateName: string): Promise<string> {
    const templatePath = `./templates/${templateName}.html`
    try {
      const template = await Deno.readTextFile(templatePath)
      return template
    } catch (error) {
      console.error(`Failed to load email template: ${templateName}`, error)
      throw new Error(`Email template not found: ${templateName}`)
    }
  }

  private replaceTemplateVariables(template: string, variables: Record<string, string>): string {
    let result = template
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{ \.${key} }}`, 'g')
      result = result.replace(regex, value)
    }
    return result
  }

  async sendEmailConfirmation(email: string, confirmationUrl: string): Promise<boolean> {
    try {
      const template = await this.loadTemplate('email-confirmation')
      const html = this.replaceTemplateVariables(template, {
        ConfirmationURL: confirmationUrl
      })

      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.resendApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'Luxmed <onboarding@resend.dev>',
          to: [email],
          subject: 'Confirm Your Email Address',
          html
        })
      })

      if (!response.ok) {
        const error = await response.text()
        console.error('Failed to send confirmation email:', error)
        return false
      }

      console.log('Email confirmation sent successfully to:', email)
      return true
    } catch (error) {
      console.error('Error sending confirmation email:', error)
      return false
    }
  }

  async sendPasswordReset(email: string, resetUrl: string): Promise<boolean> {
    try {
      const template = await this.loadTemplate('password-reset')
      const html = this.replaceTemplateVariables(template, {
        ConfirmationURL: resetUrl
      })

      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.resendApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'Luxmed <onboarding@resend.dev>',
          to: [email],
          subject: 'Reset Your Password',
          html
        })
      })

      if (!response.ok) {
        const error = await response.text()
        console.error('Failed to send password reset email:', error)
        return false
      }

      console.log('Password reset email sent successfully to:', email)
      return true
    } catch (error) {
      console.error('Error sending password reset email:', error)
      return false
    }
  }

  async sendLoginCode(email: string, code: string): Promise<boolean> {
    try {
      const template = await this.loadTemplate('login-code')
      const html = this.replaceTemplateVariables(template, {
        Token: code
      })

      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.resendApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'Luxmed <onboarding@resend.dev>',
          to: [email],
          subject: 'Your Login Code',
          html
        })
      })

      if (!response.ok) {
        const error = await response.text()
        console.error('Failed to send login code email:', error)
        return false
      }

      console.log('Login code email sent successfully to:', email)
      return true
    } catch (error) {
      console.error('Error sending login code email:', error)
      return false
    }
  }

  async sendWelcomeEmail(email: string, userName: string, userRole: string, loginUrl: string): Promise<boolean> {
    try {
      const template = await this.loadTemplate('welcome')
      const html = this.replaceTemplateVariables(template, {
        UserName: userName,
        UserRole: userRole,
        LoginURL: loginUrl
      })

      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.resendApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'Luxmed <onboarding@resend.dev>',
          to: [email],
          subject: 'Welcome to Luxmed!',
          html
        })
      })

      if (!response.ok) {
        const error = await response.text()
        console.error('Failed to send welcome email:', error)
        return false
      }

      console.log('Welcome email sent successfully to:', email)
      return true
    } catch (error) {
      console.error('Error sending welcome email:', error)
      return false
    }
  }
}

export const emailService = new EmailService()
