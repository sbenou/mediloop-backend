import { emailTemplateService } from "./emailTemplateService.ts"

// Updated EmailService that uses the new template system but maintains backward compatibility
export class UpdatedEmailService {
  private resendApiKey: string

  constructor() {
    this.resendApiKey = Deno.env.get('RESEND_API_KEY') || ''
    if (!this.resendApiKey) {
      console.warn('RESEND_API_KEY not configured - email sending will not work')
    }
  }

  // Keep legacy methods for backward compatibility but route them through template system
  async sendEmailConfirmation(email: string, confirmationUrl: string): Promise<boolean> {
    return await emailTemplateService.sendEmailConfirmation(email, confirmationUrl)
  }

  async sendPasswordReset(email: string, resetUrl: string): Promise<boolean> {
    return await emailTemplateService.sendPasswordReset(email, resetUrl)
  }

  async sendLoginCode(email: string, code: string): Promise<boolean> {
    return await emailTemplateService.sendLoginCode(email, code)
  }

  async sendWelcomeEmail(email: string, userName: string, userRole: string, loginUrl: string): Promise<boolean> {
    return await emailTemplateService.sendWelcomeEmail(email, userName, userRole, loginUrl)
  }

  // New template-based methods
  async sendInviteUser(
    email: string, 
    inviterName: string, 
    invitationType: string, 
    workplaceName: string, 
    confirmationUrl: string
  ): Promise<boolean> {
    return await emailTemplateService.sendInviteUser(email, inviterName, invitationType, workplaceName, confirmationUrl)
  }

  async sendConnectionInvitation(
    email: string,
    inviterName: string,
    inviterTitle: string,
    inviterRole: string,
    confirmationUrl: string
  ): Promise<boolean> {
    return await emailTemplateService.sendConnectionInvitation(email, inviterName, inviterTitle, inviterRole, confirmationUrl)
  }

  async sendConnectionResponse(
    email: string,
    responderName: string,
    responderTitle: string,
    responderRole: string,
    dashboardUrl: string
  ): Promise<boolean> {
    return await emailTemplateService.sendConnectionResponse(email, responderName, responderTitle, responderRole, dashboardUrl)
  }

  async sendChangeEmail(email: string, newEmail: string, confirmationUrl: string): Promise<boolean> {
    return await emailTemplateService.sendChangeEmail(email, newEmail, confirmationUrl)
  }

  async sendReauthentication(email: string, code: string): Promise<boolean> {
    return await emailTemplateService.sendReauthentication(email, code)
  }
}

export const updatedEmailService = new UpdatedEmailService()
