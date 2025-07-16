
import { emailAuditService } from "./emailAuditService.ts";

export class EmailTemplateService {
  
  private async loadTemplate(templateName: string): Promise<string> {
    const templatePath = `./templates/${templateName}.html`;
    try {
      const template = await Deno.readTextFile(templatePath);
      return template;
    } catch (error) {
      console.error(`Failed to load email template: ${templateName}`, error);
      throw new Error(`Email template not found: ${templateName}`);
    }
  }

  private replaceTemplateVariables(template: string, variables: Record<string, string>): string {
    let result = template;
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{ \.${key} }}`, 'g');
      result = result.replace(regex, value);
    }
    return result;
  }

  async sendEmailConfirmation(email: string, confirmationUrl: string, userId?: string): Promise<boolean> {
    try {
      const template = await this.loadTemplate('email-confirmation');
      const html = this.replaceTemplateVariables(template, {
        ConfirmationURL: confirmationUrl
      });

      const result = await emailAuditService.sendEmailAndLog({
        userId,
        recipient: email,
        templateName: 'email-confirmation',
        subject: 'Confirm Your Email Address',
        htmlContent: html
      });

      return result.success;
    } catch (error) {
      console.error('Error sending confirmation email:', error);
      return false;
    }
  }

  async sendPasswordReset(email: string, resetUrl: string, userId?: string): Promise<boolean> {
    try {
      const template = await this.loadTemplate('password-reset');
      const html = this.replaceTemplateVariables(template, {
        ConfirmationURL: resetUrl
      });

      const result = await emailAuditService.sendEmailAndLog({
        userId,
        recipient: email,
        templateName: 'password-reset',
        subject: 'Reset Your Password',
        htmlContent: html
      });

      return result.success;
    } catch (error) {
      console.error('Error sending password reset email:', error);
      return false;
    }
  }

  async sendLoginCode(email: string, code: string, userId?: string): Promise<boolean> {
    try {
      const template = await this.loadTemplate('login-code');
      const html = this.replaceTemplateVariables(template, {
        Token: code
      });

      const result = await emailAuditService.sendEmailAndLog({
        userId,
        recipient: email,
        templateName: 'login-code',
        subject: 'Your Login Code',
        htmlContent: html
      });

      return result.success;
    } catch (error) {
      console.error('Error sending login code email:', error);
      return false;
    }
  }

  async sendWelcomeEmail(email: string, userName: string, userRole: string, loginUrl: string, userId?: string): Promise<boolean> {
    try {
      const template = await this.loadTemplate('welcome');
      const html = this.replaceTemplateVariables(template, {
        UserName: userName,
        UserRole: userRole,
        LoginURL: loginUrl
      });

      const result = await emailAuditService.sendEmailAndLog({
        userId,
        recipient: email,
        templateName: 'welcome',
        subject: 'Welcome to Luxmed!',
        htmlContent: html
      });

      return result.success;
    } catch (error) {
      console.error('Error sending welcome email:', error);
      return false;
    }
  }

  // New template-based methods with audit logging
  async sendInviteUser(
    email: string, 
    inviterName: string, 
    invitationType: string, 
    workplaceName: string, 
    confirmationUrl: string,
    userId?: string
  ): Promise<boolean> {
    try {
      const template = await this.loadTemplate('invite-user');
      const html = this.replaceTemplateVariables(template, {
        InviterName: inviterName,
        InvitationType: invitationType,
        WorkplaceName: workplaceName,
        ConfirmationURL: confirmationUrl
      });

      const result = await emailAuditService.sendEmailAndLog({
        userId,
        recipient: email,
        templateName: 'invite-user',
        subject: `You're invited to join ${workplaceName}`,
        htmlContent: html
      });

      return result.success;
    } catch (error) {
      console.error('Error sending invite user email:', error);
      return false;
    }
  }

  async sendConnectionInvitation(
    email: string,
    inviterName: string,
    inviterTitle: string,
    inviterRole: string,
    confirmationUrl: string,
    userId?: string
  ): Promise<boolean> {
    try {
      const template = await this.loadTemplate('connection-invitation');
      const html = this.replaceTemplateVariables(template, {
        InviterName: inviterName,
        InviterTitle: inviterTitle,
        InviterRole: inviterRole,
        ConfirmationURL: confirmationUrl
      });

      const result = await emailAuditService.sendEmailAndLog({
        userId,
        recipient: email,
        templateName: 'connection-invitation',
        subject: `Connection request from ${inviterName}`,
        htmlContent: html
      });

      return result.success;
    } catch (error) {
      console.error('Error sending connection invitation email:', error);
      return false;
    }
  }

  async sendConnectionResponse(
    email: string,
    responderName: string,
    responderTitle: string,
    responderRole: string,
    dashboardUrl: string,
    userId?: string
  ): Promise<boolean> {
    try {
      const template = await this.loadTemplate('connection-response');
      const html = this.replaceTemplateVariables(template, {
        ResponderName: responderName,
        ResponderTitle: responderTitle,
        ResponderRole: responderRole,
        DashboardURL: dashboardUrl
      });

      const result = await emailAuditService.sendEmailAndLog({
        userId,
        recipient: email,
        templateName: 'connection-response',
        subject: `${responderName} accepted your connection`,
        htmlContent: html
      });

      return result.success;
    } catch (error) {
      console.error('Error sending connection response email:', error);
      return false;
    }
  }

  async sendChangeEmail(email: string, newEmail: string, confirmationUrl: string, userId?: string): Promise<boolean> {
    try {
      const template = await this.loadTemplate('change-email');
      const html = this.replaceTemplateVariables(template, {
        NewEmail: newEmail,
        ConfirmationURL: confirmationUrl
      });

      const result = await emailAuditService.sendEmailAndLog({
        userId,
        recipient: email,
        templateName: 'change-email',
        subject: 'Confirm Email Change',
        htmlContent: html
      });

      return result.success;
    } catch (error) {
      console.error('Error sending change email:', error);
      return false;
    }
  }

  async sendReauthentication(email: string, code: string, userId?: string): Promise<boolean> {
    try {
      const template = await this.loadTemplate('reauthentication');
      const html = this.replaceTemplateVariables(template, {
        Token: code
      });

      const result = await emailAuditService.sendEmailAndLog({
        userId,
        recipient: email,
        templateName: 'reauthentication',
        subject: 'Reauthentication Required',
        htmlContent: html
      });

      return result.success;
    } catch (error) {
      console.error('Error sending reauthentication email:', error);
      return false;
    }
  }

  // Method to send templated emails with variables
  async sendTemplatedEmail(
    templateName: string,
    recipientEmail: string,
    variables: Record<string, any>,
    userId?: string
  ): Promise<boolean> {
    try {
      const template = await this.loadTemplate(templateName);
      const html = this.replaceTemplateVariables(template, variables);

      const result = await emailAuditService.sendEmailAndLog({
        userId,
        recipient: recipientEmail,
        templateName,
        subject: variables.Subject || `Message from Luxmed`,
        htmlContent: html
      });

      return result.success;
    } catch (error) {
      console.error(`Error sending templated email ${templateName}:`, error);
      return false;
    }
  }
}

export const emailTemplateService = new EmailTemplateService();
