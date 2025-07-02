
import { useState } from 'react';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  template_key: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface EmailLog {
  id: string;
  template_name: string;
  recipient_email: string;
  subject: string;
  status: string;
  variables: Record<string, any>;
  sent_at: string | null;
  error_message: string | null;
  created_at: string;
}

export const useEmailTemplates = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendTemplatedEmail = async (
    templateName: string,
    recipientEmail: string,
    variables: Record<string, any>
  ) => {
    setLoading(true);
    setError(null);

    try {
      // Call your Deno backend service instead of Supabase edge function
      const response = await fetch('/api/send-templated-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          templateName,
          recipientEmail,
          variables
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send email');
      }

      return await response.json();
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to send email';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getEmailTemplates = async (): Promise<EmailTemplate[]> => {
    try {
      const response = await fetch('/api/email-templates');
      if (!response.ok) {
        throw new Error('Failed to fetch templates');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching templates:', error);
      return [];
    }
  };

  const getEmailLogs = async (limit = 50): Promise<EmailLog[]> => {
    try {
      const response = await fetch(`/api/email-logs?limit=${limit}`);
      if (!response.ok) {
        throw new Error('Failed to fetch logs');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching logs:', error);
      return [];
    }
  };

  // Helper methods for specific email types
  const sendConfirmationEmail = (email: string, confirmationUrl: string) => {
    return sendTemplatedEmail('confirm-signup', email, {
      SiteURL: window.location.origin,
      Email: email,
      ConfirmationURL: confirmationUrl
    });
  };

  const sendInviteUserEmail = (
    email: string,
    inviterName: string,
    invitationType: string,
    workplaceName: string,
    confirmationUrl: string
  ) => {
    return sendTemplatedEmail('invite-user', email, {
      SiteURL: window.location.origin,
      InviterName: inviterName,
      InvitationType: invitationType,
      WorkplaceName: workplaceName,
      ConfirmationURL: confirmationUrl
    });
  };

  const sendConnectionInvitation = (
    email: string,
    inviterName: string,
    inviterTitle: string,
    inviterRole: string,
    confirmationUrl: string
  ) => {
    return sendTemplatedEmail('connection-invitation', email, {
      SiteURL: window.location.origin,
      InviterName: inviterName,
      InviterTitle: inviterTitle,
      InviterRole: inviterRole,
      RecipientEmail: email,
      ConfirmationURL: confirmationUrl
    });
  };

  const sendConnectionResponse = (
    email: string,
    responderName: string,
    responderTitle: string,
    responderRole: string,
    dashboardUrl: string
  ) => {
    return sendTemplatedEmail('connection-response', email, {
      SiteURL: window.location.origin,
      ResponderName: responderName,
      ResponderTitle: responderTitle,
      ResponderRole: responderRole,
      DashboardURL: dashboardUrl
    });
  };

  const sendMagicLinkEmail = (email: string, token: string) => {
    return sendTemplatedEmail('magic-link', email, {
      Token: token
    });
  };

  const sendPasswordResetEmail = (email: string, resetUrl: string) => {
    return sendTemplatedEmail('reset-password', email, {
      ConfirmationURL: resetUrl
    });
  };

  return {
    loading,
    error,
    sendTemplatedEmail,
    getEmailTemplates,
    getEmailLogs,
    // Helper methods
    sendConfirmationEmail,
    sendInviteUserEmail,
    sendConnectionInvitation,
    sendConnectionResponse,
    sendMagicLinkEmail,
    sendPasswordResetEmail
  };
};
