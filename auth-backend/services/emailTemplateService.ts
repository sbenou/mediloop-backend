
import { config } from "../config/env.ts"

export class EmailTemplateService {
  private supabaseUrl: string
  private supabaseServiceKey: string

  constructor() {
    this.supabaseUrl = config.SUPABASE_URL || Deno.env.get('SUPABASE_URL') || ''
    this.supabaseServiceKey = config.SUPABASE_SERVICE_ROLE_KEY || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    
    if (!this.supabaseUrl || !this.supabaseServiceKey) {
      console.warn('Supabase URL or Service Key not configured - email templates will not work')
    }
  }

  async sendTemplatedEmail(templateName: string, recipientEmail: string, variables: Record<string, any>): Promise<boolean> {
    try {
      console.log(`Sending templated email: ${templateName} to ${recipientEmail}`)
      
      const response = await fetch(`${this.supabaseUrl}/functions/v1/send-templated-email`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.supabaseServiceKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          templateName,
          recipientEmail,
          variables
        })
      })

      if (!response.ok) {
        const error = await response.text()
        console.error('Failed to send templated email:', error)
        return false
      }

      const result = await response.json()
      console.log('Templated email sent successfully:', result)
      return true
    } catch (error) {
      console.error('Error sending templated email:', error)
      return false
    }
  }

  // Legacy email methods - updated to use templates
  async sendEmailConfirmation(email: string, confirmationUrl: string): Promise<boolean> {
    return await this.sendTemplatedEmail('confirm-signup', email, {
      SiteURL: this.supabaseUrl.replace('/functions/v1', ''),
      Email: email,
      ConfirmationURL: confirmationUrl
    })
  }

  async sendPasswordReset(email: string, resetUrl: string): Promise<boolean> {
    return await this.sendTemplatedEmail('reset-password', email, {
      ConfirmationURL: resetUrl
    })
  }

  async sendLoginCode(email: string, code: string): Promise<boolean> {
    return await this.sendTemplatedEmail('magic-link', email, {
      Token: code
    })
  }

  async sendWelcomeEmail(email: string, userName: string, userRole: string, loginUrl: string): Promise<boolean> {
    // For welcome emails, we'll use the confirmation template for now
    return await this.sendTemplatedEmail('confirm-signup', email, {
      SiteURL: this.supabaseUrl.replace('/functions/v1', ''),
      Email: email,
      ConfirmationURL: loginUrl
    })
  }

  // New template-specific methods
  async sendInviteUser(
    email: string, 
    inviterName: string, 
    invitationType: string, 
    workplaceName: string, 
    confirmationUrl: string
  ): Promise<boolean> {
    return await this.sendTemplatedEmail('invite-user', email, {
      SiteURL: this.supabaseUrl.replace('/functions/v1', ''),
      InviterName: inviterName,
      InvitationType: invitationType,
      WorkplaceName: workplaceName,
      ConfirmationURL: confirmationUrl
    })
  }

  async sendConnectionInvitation(
    email: string,
    inviterName: string,
    inviterTitle: string,
    inviterRole: string,
    confirmationUrl: string
  ): Promise<boolean> {
    return await this.sendTemplatedEmail('connection-invitation', email, {
      SiteURL: this.supabaseUrl.replace('/functions/v1', ''),
      InviterName: inviterName,
      InviterTitle: inviterTitle,
      InviterRole: inviterRole,
      RecipientEmail: email,
      ConfirmationURL: confirmationUrl
    })
  }

  async sendConnectionResponse(
    email: string,
    responderName: string,
    responderTitle: string,
    responderRole: string,
    dashboardUrl: string
  ): Promise<boolean> {
    return await this.sendTemplatedEmail('connection-response', email, {
      SiteURL: this.supabaseUrl.replace('/functions/v1', ''),
      ResponderName: responderName,
      ResponderTitle: responderTitle,
      ResponderRole: responderRole,
      DashboardURL: dashboardUrl
    })
  }

  async sendChangeEmail(email: string, newEmail: string, confirmationUrl: string): Promise<boolean> {
    return await this.sendTemplatedEmail('change-email', email, {
      Email: email,
      NewEmail: newEmail,
      ConfirmationURL: confirmationUrl
    })
  }

  async sendReauthentication(email: string, code: string): Promise<boolean> {
    return await this.sendTemplatedEmail('reauthentication', email, {
      Token: code
    })
  }
}

export const emailTemplateService = new EmailTemplateService()
