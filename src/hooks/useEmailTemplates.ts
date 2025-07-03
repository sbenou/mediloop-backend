
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
      const response = await fetch('http://localhost:8000/api/send-templated-email', {
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
      const response = await fetch('http://localhost:8000/api/email-templates');
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
      const response = await fetch(`http://localhost:8000/api/email-logs?limit=${limit}`);
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

  // New method for medication order emails
  const sendMedicationOrderEmail = (
    email: string,
    items: Array<{name: string, quantity: number, price: number}>,
    total: number
  ) => {
    return sendTemplatedEmail('medication-order', email, {
      SiteURL: window.location.origin,
      items,
      total: total.toFixed(2),
      DeliveryFee: '5.00'
    });
  };

  // Updated method for login emails - now calls Deno backend
  const sendLoginEmail = async (email: string, otp: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:8000/api/send-login-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          otp
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send login email');
      }

      return await response.json();
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to send login email';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
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
    sendPasswordResetEmail,
    sendMedicationOrderEmail,
    sendLoginEmail, // New method for login emails
  };
};
