import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const EmailTemplatePreview = () => {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('confirm-signup');

  // Sample data for template variables
  const templateData = {
    'confirm-signup': {
      SiteURL: 'https://localhost:5173',
      Email: 'john.doe@example.com',
      ConfirmationURL: 'https://localhost:5173/auth/confirm?token=sample-token'
    },
    'invite-user': {
      SiteURL: 'https://localhost:5173',
      InviterName: 'Dr. Sarah Wilson',
      InvitationType: 'staff member',
      WorkplaceName: 'Mediloop Clinic',
      ConfirmationURL: 'https://localhost:5173/auth/invite?token=sample-token'
    },
    'connection-invitation': {
      SiteURL: 'https://localhost:5173',
      InviterName: 'Dr. Michael Johnson',
      InviterTitle: 'Dr.',
      InviterRole: 'doctor',
      RecipientEmail: 'patient@example.com',
      HasAccount: false, // This determines if user has account or not
      ConfirmationURL: 'https://localhost:5173/connections/accept?token=sample-token',
      SignupURL: 'https://localhost:5173/signup?ref=connection&token=sample-token'
    },
    'connection-response': {
      SiteURL: 'https://localhost:5173',
      ResponderName: 'John Doe',
      ResponderTitle: 'Mr.',
      ResponderRole: 'patient',
      Status: 'accepted',
      HasAccount: true, // This determines if user has account or not
      DashboardURL: 'https://localhost:5173/dashboard',
      AcceptURL: 'https://localhost:5173/connections/accept?token=sample-token',
      DeclineURL: 'https://localhost:5173/connections/decline?token=sample-token'
    },
    'magic-link': {
      Token: '123456'
    },
    'change-email': {
      Email: 'old.email@example.com',
      NewEmail: 'new.email@example.com',
      ConfirmationURL: 'https://localhost:5173/auth/change-email?token=sample-token'
    },
    'reset-password': {
      ConfirmationURL: 'https://localhost:5173/reset-password?token=sample-token'
    },
    'reauthentication': {
      Token: '123456'
    }
  };

  // Template content matching exactly the Mediloop templates with proper styling
  const templates = {
    'confirm-signup': `
      <!DOCTYPE html>
      <html>
      <body style="margin: 0; padding: 20px; background-color: #f4f4f5; font-family: Arial, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; padding: 40px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
              <!-- Header with Logo Placeholder -->
              <div style="text-align: center; margin-bottom: 30px;">
                  <img src="${templateData['confirm-signup'].SiteURL}/logo.png" alt="Logo" style="max-height: 50px; margin-bottom: 20px;">
                  <h1 style="color: #18181b; font-size: 24px; margin: 0;">Welcome to Our Platform!</h1>
              </div>

              <!-- Main Content -->
              <div style="color: #52525b; font-size: 16px; line-height: 24px; margin-bottom: 30px;">
                  <p>Hello ${templateData['confirm-signup'].Email},</p>
                  <p>Thank you for signing up! To get started, please confirm your email address by clicking the button below:</p>
              </div>

              <!-- Action Button -->
              <div style="text-align: center; margin: 30px 0;">
                  <a href="${templateData['confirm-signup'].ConfirmationURL}" style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">Confirm Email Address</a>
              </div>

              <!-- Alternative Link -->
              <div style="margin-bottom: 30px; text-align: center;">
                  <p style="color: #71717a; font-size: 14px;">If the button doesn't work, copy and paste this link in your browser:</p>
                  <p style="color: #3b82f6; font-size: 14px; word-break: break-all;">${templateData['confirm-signup'].ConfirmationURL}</p>
              </div>

              <!-- Security Notice -->
              <div style="border-top: 1px solid #e4e4e7; padding-top: 20px; margin-top: 20px;">
                  <p style="color: #71717a; font-size: 14px; margin: 0;">For security reasons, this link will expire in 24 hours. If you didn't create an account with us, you can safely ignore this email.</p>
              </div>

              <!-- Footer -->
              <div style="text-align: center; margin-top: 30px; color: #71717a; font-size: 14px;">
                  <p style="margin: 5px 0;">© 2024 Mediloop. All rights reserved.</p>
                  <p style="margin: 5px 0;">
                      <a href="${templateData['confirm-signup'].SiteURL}/privacy" style="color: #3b82f6; text-decoration: none;">Privacy Policy</a> • 
                      <a href="${templateData['confirm-signup'].SiteURL}/terms" style="color: #3b82f6; text-decoration: none;">Terms of Service</a>
                  </p>
              </div>
          </div>
      </body>
      </html>
    `,
    'invite-user': `
      <!DOCTYPE html>
      <html>
      <body style="margin: 0; padding: 20px; background-color: #f4f4f5; font-family: Arial, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; padding: 40px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
              <!-- Header with Logo Placeholder -->
              <div style="text-align: center; margin-bottom: 30px;">
                  <img src="${templateData['invite-user'].SiteURL}/logo.png" alt="Logo" style="max-height: 50px; margin-bottom: 20px;">
                  <h1 style="color: #18181b; font-size: 24px; margin: 0;">You're Invited to Join Our Platform!</h1>
              </div>

              <!-- Main Content -->
              <div style="color: #52525b; font-size: 16px; line-height: 24px; margin-bottom: 30px;">
                  <p>Hello,</p>
                  <p>You have been invited by <strong>${templateData['invite-user'].InviterName}</strong> to join <strong>${templateData['invite-user'].WorkplaceName}</strong> as a ${templateData['invite-user'].InvitationType} on our platform.</p>
                  <p>To accept this invitation and create your account, please click the button below:</p>
              </div>

              <!-- Action Button -->
              <div style="text-align: center; margin: 30px 0;">
                  <a href="${templateData['invite-user'].ConfirmationURL}" style="display: inline-block; background-color: #10b981; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">Accept Invitation</a>
              </div>

              <!-- Alternative Link -->
              <div style="margin-bottom: 30px; text-align: center;">
                  <p style="color: #71717a; font-size: 14px;">If the button doesn't work, copy and paste this link in your browser:</p>
                  <p style="color: #3b82f6; font-size: 14px; word-break: break-all;">${templateData['invite-user'].ConfirmationURL}</p>
              </div>

              <!-- Invitation Details -->
              <div style="margin: 30px 0; padding: 20px; background-color: #f8fafc; border-radius: 6px; border-left: 4px solid #10b981;">
                  <h3 style="color: #18181b; font-size: 16px; margin: 0 0 10px 0;">Invitation Details:</h3>
                  <p style="color: #52525b; font-size: 14px; margin: 5px 0;"><strong>Invited by:</strong> ${templateData['invite-user'].InviterName}</p>
                  <p style="color: #52525b; font-size: 14px; margin: 5px 0;"><strong>Organization:</strong> ${templateData['invite-user'].WorkplaceName}</p>
                  <p style="color: #52525b; font-size: 14px; margin: 5px 0;"><strong>Role:</strong> ${templateData['invite-user'].InvitationType}</p>
              </div>

              <!-- Security Notice -->
              <div style="border-top: 1px solid #e4e4e7; padding-top: 20px; margin-top: 20px;">
                  <p style="color: #71717a; font-size: 14px; margin: 0;">This invitation will expire in 7 days. If you didn't expect this invitation or have any questions, please contact ${templateData['invite-user'].InviterName} directly.</p>
              </div>

              <!-- Footer -->
              <div style="text-align: center; margin-top: 30px; color: #71717a; font-size: 14px;">
                  <p style="margin: 5px 0;">© 2024 Mediloop. All rights reserved.</p>
                  <p style="margin: 5px 0;">
                      <a href="${templateData['invite-user'].SiteURL}/privacy" style="color: #3b82f6; text-decoration: none;">Privacy Policy</a> • 
                      <a href="${templateData['invite-user'].SiteURL}/terms" style="color: #3b82f6; text-decoration: none;">Terms of Service</a>
                  </p>
              </div>
          </div>
      </body>
      </html>
    `,
    'connection-invitation': `
      <!DOCTYPE html>
      <html>
      <body style="margin: 0; padding: 20px; background-color: #f4f4f5; font-family: Arial, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; padding: 40px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
              <!-- Header with Logo Placeholder -->
              <div style="text-align: center; margin-bottom: 30px;">
                  <img src="${templateData['connection-invitation'].SiteURL}/logo.png" alt="Logo" style="max-height: 50px; margin-bottom: 20px;">
                  <h1 style="color: #18181b; font-size: 24px; margin: 0;">Healthcare Connection Request</h1>
              </div>

              <!-- Main Content -->
              <div style="color: #52525b; font-size: 16px; line-height: 24px; margin-bottom: 30px;">
                  <p>Hello,</p>
                  <p><strong>${templateData['connection-invitation'].InviterTitle} ${templateData['connection-invitation'].InviterName}</strong> (${templateData['connection-invitation'].InviterRole}) would like to connect with you on our platform.</p>
                  <p>This connection will allow you to share medical information securely and facilitate better healthcare coordination.</p>
                  ${!templateData['connection-invitation'].HasAccount 
                    ? '<p><strong>Note:</strong> You will need to create an account to accept this connection request.</p>'
                    : '<p>Since you already have an account with us, you can review and respond to this connection request.</p>'
                  }
              </div>

              <!-- Action Button -->
              <div style="text-align: center; margin: 30px 0;">
                  <a href="${templateData['connection-invitation'].HasAccount ? templateData['connection-invitation'].ConfirmationURL : templateData['connection-invitation'].SignupURL}" 
                     style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">
                     ${templateData['connection-invitation'].HasAccount ? 'View Connection Request' : 'Create Account & Connect'}
                  </a>
              </div>

              <!-- Alternative Link -->
              <div style="margin-bottom: 30px; text-align: center;">
                  <p style="color: #71717a; font-size: 14px;">If the button doesn't work, copy and paste this link in your browser:</p>
                  <p style="color: #3b82f6; font-size: 14px; word-break: break-all;">
                    ${templateData['connection-invitation'].HasAccount ? templateData['connection-invitation'].ConfirmationURL : templateData['connection-invitation'].SignupURL}
                  </p>
              </div>

              <!-- Connection Details -->
              <div style="margin: 30px 0; padding: 20px; background-color: #f8fafc; border-radius: 6px; border-left: 4px solid #3b82f6;">
                  <h3 style="color: #18181b; font-size: 16px; margin: 0 0 10px 0;">Connection Details:</h3>
                  <p style="color: #52525b; font-size: 14px; margin: 5px 0;"><strong>Requesting connection:</strong> ${templateData['connection-invitation'].InviterTitle} ${templateData['connection-invitation'].InviterName}</p>
                  <p style="color: #52525b; font-size: 14px; margin: 5px 0;"><strong>Role:</strong> ${templateData['connection-invitation'].InviterRole}</p>
                  <p style="color: #52525b; font-size: 14px; margin: 5px 0;"><strong>Account status:</strong> ${templateData['connection-invitation'].HasAccount ? 'Existing user' : 'New user (account creation required)'}</p>
              </div>

              <!-- Security Notice -->
              <div style="border-top: 1px solid #e4e4e7; padding-top: 20px; margin-top: 20px;">
                  <p style="color: #71717a; font-size: 14px; margin: 0;">
                    This connection request will expire in 7 days. 
                    ${templateData['connection-invitation'].HasAccount 
                      ? 'You can accept or decline this request by clicking the link above.'
                      : 'To accept this invitation, you will need to create an account first.'
                    }
                  </p>
              </div>

              <!-- Footer -->
              <div style="text-align: center; margin-top: 30px; color: #71717a; font-size: 14px;">
                  <p style="margin: 5px 0;">© 2024 Mediloop. All rights reserved.</p>
                  <p style="margin: 5px 0;">
                      <a href="${templateData['connection-invitation'].SiteURL}/privacy" style="color: #3b82f6; text-decoration: none;">Privacy Policy</a> • 
                      <a href="${templateData['connection-invitation'].SiteURL}/terms" style="color: #3b82f6; text-decoration: none;">Terms of Service</a>
                  </p>
              </div>
          </div>
      </body>
      </html>
    `,
    'connection-response': `
      <!DOCTYPE html>
      <html>
      <body style="margin: 0; padding: 20px; background-color: #f4f4f5; font-family: Arial, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; padding: 40px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
              <!-- Header with Logo Placeholder -->
              <div style="text-align: center; margin-bottom: 30px;">
                  <img src="${templateData['connection-response'].SiteURL}/logo.png" alt="Logo" style="max-height: 50px; margin-bottom: 20px;">
                  <h1 style="color: #18181b; font-size: 24px; margin: 0;">
                    ${templateData['connection-response'].Status === 'accepted' ? 'Connection Accepted!' : 'Connection Request Response'}
                  </h1>
              </div>

              <!-- Main Content -->
              <div style="color: #52525b; font-size: 16px; line-height: 24px; margin-bottom: 30px;">
                  <p>Hello,</p>
                  ${templateData['connection-response'].Status === 'accepted' 
                    ? `<p><strong>${templateData['connection-response'].ResponderTitle} ${templateData['connection-response'].ResponderName}</strong> (${templateData['connection-response'].ResponderRole}) has accepted your connection request!</p>
                       <p>You can now communicate securely and coordinate healthcare through our platform.</p>
                       <p>Click the button below to access your dashboard and start collaborating.</p>`
                    : `<p>You have a connection request from <strong>${templateData['connection-response'].ResponderTitle} ${templateData['connection-response'].ResponderName}</strong> (${templateData['connection-response'].ResponderRole}) that requires your response.</p>
                       <p>Please choose to accept or decline this connection request.</p>
                       ${!templateData['connection-response'].HasAccount 
                         ? '<p><strong>Note:</strong> You will need to create an account to respond to this request.</p>'
                         : ''
                       }`
                  }
              </div>

              <!-- Action Buttons -->
              ${templateData['connection-response'].Status === 'accepted' && templateData['connection-response'].HasAccount
                ? `<div style="text-align: center; margin: 30px 0;">
                     <a href="${templateData['connection-response'].DashboardURL}" style="display: inline-block; background-color: #10b981; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">Go to Dashboard</a>
                   </div>`
                : templateData['connection-response'].Status === 'accepted' && !templateData['connection-response'].HasAccount
                ? `<div style="text-align: center; margin: 30px 0;">
                     <a href="${templateData['connection-response'].SiteURL}/signup?ref=connection" style="display: inline-block; background-color: #10b981; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">Create Account to Connect</a>
                   </div>`
                : templateData['connection-response'].HasAccount
                ? `<div style="text-align: center; margin: 30px 0; display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
                     <a href="${templateData['connection-response'].AcceptURL}" style="display: inline-block; background-color: #10b981; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">Accept Connection</a>
                     <a href="${templateData['connection-response'].DeclineURL}" style="display: inline-block; background-color: #ef4444; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">Decline Connection</a>
                   </div>`
                : `<div style="text-align: center; margin: 30px 0;">
                     <a href="${templateData['connection-response'].SiteURL}/signup?ref=connection" style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">Create Account to Respond</a>
                   </div>`
              }

              <!-- Connection Details -->
              <div style="margin: 30px 0; padding: 20px; background-color: #f8fafc; border-radius: 6px; border-left: 4px solid ${templateData['connection-response'].Status === 'accepted' ? '#10b981' : '#3b82f6'};">
                  <h3 style="color: #18181b; font-size: 16px; margin: 0 0 10px 0;">Connection Details:</h3>
                  <p style="color: #52525b; font-size: 14px; margin: 5px 0;"><strong>${templateData['connection-response'].Status === 'accepted' ? 'Connected with:' : 'Request from:'}</strong> ${templateData['connection-response'].ResponderTitle} ${templateData['connection-response'].ResponderName}</p>
                  <p style="color: #52525b; font-size: 14px; margin: 5px 0;"><strong>Role:</strong> ${templateData['connection-response'].ResponderRole}</p>
                  <p style="color: #52525b; font-size: 14px; margin: 5px 0;"><strong>Status:</strong> ${templateData['connection-response'].Status === 'accepted' ? 'Connected' : 'Pending your response'}</p>
                  <p style="color: #52525b; font-size: 14px; margin: 5px 0;"><strong>Account:</strong> ${templateData['connection-response'].HasAccount ? 'Existing user' : 'Account creation required'}</p>
              </div>

              <!-- Security Notice -->
              <div style="border-top: 1px solid #e4e4e7; padding-top: 20px; margin-top: 20px;">
                  <p style="color: #71717a; font-size: 14px; margin: 0;">
                    ${templateData['connection-response'].Status === 'accepted' 
                      ? 'This connection enables secure communication and healthcare information sharing between both parties.'
                      : 'This connection request will expire in 7 days if no action is taken.'
                    }
                  </p>
              </div>

              <!-- Footer -->
              <div style="text-align: center; margin-top: 30px; color: #71717a; font-size: 14px;">
                  <p style="margin: 5px 0;">© 2024 Mediloop. All rights reserved.</p>
                  <p style="margin: 5px 0;">
                      <a href="${templateData['connection-response'].SiteURL}/privacy" style="color: #3b82f6; text-decoration: none;">Privacy Policy</a> • 
                      <a href="${templateData['connection-response'].SiteURL}/terms" style="color: #3b82f6; text-decoration: none;">Terms of Service</a>
                  </p>
              </div>
          </div>
      </body>
      </html>
    `,
    'magic-link': `
      <!DOCTYPE html>
      <html>
      <body style="margin: 0; padding: 20px; background-color: #f4f4f5; font-family: Arial, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; padding: 40px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
              <!-- Header -->
              <div style="text-align: center; margin-bottom: 30px;">
                  <h1 style="color: #18181b; font-size: 24px; margin: 0;">Your Login Code</h1>
              </div>

              <!-- Main Content -->
              <div style="color: #52525b; font-size: 16px; line-height: 24px; margin-bottom: 30px;">
                  <p>Hello,</p>
                  <p>Here is your login code to access your account:</p>
                  <div style="text-align: center; margin: 30px 0;">
                      <div style="font-size: 32px; font-weight: bold; color: #3b82f6; letter-spacing: 4px; padding: 20px; background-color: #f8fafc; border-radius: 6px;">
                          ${templateData['magic-link'].Token}
                      </div>
                  </div>
                  <p>Enter this code on the login page to continue.</p>
              </div>

              <!-- Security Notice -->
              <div style="margin: 30px 0; padding: 20px; background-color: #f8fafc; border-radius: 6px;">
                  <p style="color: #64748b; font-size: 14px; margin: 0;">
                      For security reasons, this code will expire in 5 minutes. If you didn't request this code, please ignore this email.
                  </p>
              </div>

              <!-- Footer -->
              <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e4e4e7;">
                  <p style="color: #71717a; font-size: 14px; margin: 5px 0;">
                      © 2024 Mediloop. All rights reserved.
                  </p>
              </div>
          </div>
      </body>
      </html>
    `,
    'change-email': `
      <!DOCTYPE html>
      <html>
      <body style="margin: 0; padding: 20px; background-color: #f4f4f5; font-family: Arial, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; padding: 40px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
              <!-- Header -->
              <div style="text-align: center; margin-bottom: 30px;">
                  <h1 style="color: #18181b; font-size: 24px; margin: 0;">Confirm Change of Email</h1>
              </div>

              <!-- Main Content -->
              <div style="color: #52525b; font-size: 16px; line-height: 24px; margin-bottom: 30px;">
                  <p>Hello,</p>
                  <p>Follow this link to confirm the update of your email from ${templateData['change-email'].Email} to ${templateData['change-email'].NewEmail}:</p>
              </div>

              <!-- Action Button -->
              <div style="text-align: center; margin: 30px 0;">
                  <a href="${templateData['change-email'].ConfirmationURL}" style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">Change Email</a>
              </div>

              <!-- Alternative Link -->
              <div style="margin-bottom: 30px; text-align: center;">
                  <p style="color: #71717a; font-size: 14px;">If the button doesn't work, copy and paste this link in your browser:</p>
                  <p style="color: #3b82f6; font-size: 14px; word-break: break-all;">${templateData['change-email'].ConfirmationURL}</p>
              </div>

              <!-- Security Notice -->
              <div style="border-top: 1px solid #e4e4e7; padding-top: 20px; margin-top: 20px;">
                  <p style="color: #71717a; font-size: 14px; margin: 0;">For security reasons, this link will expire in 24 hours. If you didn't request this email change, please contact our support team immediately.</p>
              </div>

              <!-- Footer -->
              <div style="text-align: center; margin-top: 30px; color: #71717a; font-size: 14px;">
                  <p style="margin: 5px 0;">© 2024 Mediloop. All rights reserved.</p>
              </div>
          </div>
      </body>
      </html>
    `,
    'reset-password': `
      <!DOCTYPE html>
      <html>
      <body style="margin: 0; padding: 20px; background-color: #f4f4f5; font-family: Arial, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; padding: 40px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
              <!-- Header -->
              <div style="text-align: center; margin-bottom: 30px;">
                  <h1 style="color: #18181b; font-size: 24px; margin: 0;">Reset Your Password</h1>
              </div>

              <!-- Main Content -->
              <div style="color: #52525b; font-size: 16px; line-height: 24px; margin-bottom: 30px;">
                  <p>Hello,</p>
                  <p>We received a request to reset the password for your account. If you didn't make this request, you can safely ignore this email.</p>
                  <p>To reset your password, click the button below:</p>
              </div>

              <!-- Reset Button -->
              <div style="text-align: center; margin: 30px 0;">
                  <a href="${templateData['reset-password'].ConfirmationURL}" style="display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">
                      Reset Password
                  </a>
              </div>

              <!-- Security Notice -->
              <div style="margin: 30px 0; padding: 20px; background-color: #f8fafc; border-radius: 6px;">
                  <p style="color: #64748b; font-size: 14px; margin: 0;">
                      For security reasons, this password reset link will expire in 1 hour. If you need to reset your password after that, please request a new link.
                  </p>
              </div>

              <!-- Alternative Link -->
              <div style="margin: 20px 0; color: #52525b; font-size: 14px;">
                  <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
                  <p style="word-break: break-all; color: #3b82f6;">${templateData['reset-password'].ConfirmationURL}</p>
              </div>

              <!-- Footer -->
              <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e4e4e7;">
                  <p style="color: #71717a; font-size: 14px; margin: 5px 0;">
                      If you didn't request a password reset, please contact our support team immediately.
                  </p>
                  <p style="color: #71717a; font-size: 14px; margin: 5px 0;">
                      © 2024 Mediloop. All rights reserved.
                  </p>
              </div>
          </div>
      </body>
      </html>
    `,
    'reauthentication': `
      <!DOCTYPE html>
      <html>
      <body style="margin: 0; padding: 20px; background-color: #f4f4f5; font-family: Arial, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; padding: 40px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
              <!-- Header -->
              <div style="text-align: center; margin-bottom: 30px;">
                  <h1 style="color: #18181b; font-size: 24px; margin: 0;">Confirm Reauthentication</h1>
              </div>

              <!-- Main Content -->
              <div style="color: #52525b; font-size: 16px; line-height: 24px; margin-bottom: 30px;">
                  <p>Hello,</p>
                  <p>For security purposes, we need to verify your identity. Please enter the code below to confirm your reauthentication:</p>
                  <div style="text-align: center; margin: 30px 0;">
                      <div style="font-size: 32px; font-weight: bold; color: #3b82f6; letter-spacing: 4px; padding: 20px; background-color: #f8fafc; border-radius: 6px;">
                          ${templateData['reauthentication'].Token}
                      </div>
                  </div>
                  <p>Enter this code to continue with your account verification.</p>
              </div>

              <!-- Security Notice -->
              <div style="margin: 30px 0; padding: 20px; background-color: #f8fafc; border-radius: 6px;">
                  <p style="color: #64748b; font-size: 14px; margin: 0;">
                      For security reasons, this code will expire in 10 minutes. If you didn't request this verification, please contact our support team immediately.
                  </p>
              </div>

              <!-- Footer -->
              <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e4e4e7;">
                  <p style="color: #71717a; font-size: 14px; margin: 5px 0;">
                      © 2024 Mediloop. All rights reserved.
                  </p>
              </div>
          </div>
      </body>
      </html>
    `
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Email Template Preview</h1>
          <p className="text-muted-foreground">
            Preview how the email templates will look when sent to users
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Template Selector */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Templates</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {Object.keys(templates).map((templateKey) => (
                  <Button
                    key={templateKey}
                    variant={selectedTemplate === templateKey ? "default" : "outline"}
                    className="w-full justify-start"
                    onClick={() => setSelectedTemplate(templateKey)}
                  >
                    {templateKey.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Button>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Template Preview */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Preview: {selectedTemplate.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-100 p-4 rounded-lg">
                  <div
                    style={{ backgroundColor: '#f4f4f5', padding: '20px', fontFamily: 'Arial, sans-serif' }}
                    dangerouslySetInnerHTML={{ 
                      __html: templates[selectedTemplate as keyof typeof templates] 
                    }}
                  />
                </div>
                
                {/* Template Variables */}
                <div className="mt-6">
                  <h3 className="text-sm font-medium mb-3">Template Variables Used:</h3>
                  <div className="bg-gray-50 p-3 rounded text-sm">
                    <pre className="text-xs">
                      {JSON.stringify(templateData[selectedTemplate as keyof typeof templateData], null, 2)}
                    </pre>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailTemplatePreview;
