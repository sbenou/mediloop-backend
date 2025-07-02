import { config } from "../config/env.ts";
import { postgresService } from "./postgresService.ts";

// Email templates stored as constants (since we're not using Deno KV)
const emailTemplates = {
  'confirm-signup': `
    <!DOCTYPE html>
    <html>
    <body style="margin: 0; padding: 20px; background-color: #f4f4f5; font-family: Arial, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; padding: 40px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
            <!-- Header with Logo Placeholder -->
            <div style="text-align: center; margin-bottom: 30px;">
                <img src="{{SiteURL}}/logo.png" alt="Logo" style="max-height: 50px; margin-bottom: 20px;">
                <h1 style="color: #18181b; font-size: 24px; margin: 0;">Welcome to Our Platform!</h1>
            </div>

            <!-- Main Content -->
            <div style="color: #52525b; font-size: 16px; line-height: 24px; margin-bottom: 30px;">
                <p>Hello {{Email}},</p>
                <p>Thank you for signing up! To get started, please confirm your email address by clicking the button below:</p>
            </div>

            <!-- Action Button -->
            <div style="text-align: center; margin: 30px 0;">
                <a href="{{ConfirmationURL}}" style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">Confirm Email Address</a>
            </div>

            <!-- Alternative Link -->
            <div style="margin-bottom: 30px; text-align: center;">
                <p style="color: #71717a; font-size: 14px;">If the button doesn't work, copy and paste this link in your browser:</p>
                <p style="color: #3b82f6; font-size: 14px; word-break: break-all;">{{ConfirmationURL}}</p>
            </div>

            <!-- Security Notice -->
            <div style="border-top: 1px solid #e4e4e7; padding-top: 20px; margin-top: 20px;">
                <p style="color: #71717a; font-size: 14px; margin: 0;">For security reasons, this link will expire in 24 hours. If you didn't create an account with us, you can safely ignore this email.</p>
            </div>

            <!-- Footer -->
            <div style="text-align: center; margin-top: 30px; color: #71717a; font-size: 14px;">
                <p style="margin: 5px 0;">© 2024 Mediloop. All rights reserved.</p>
                <p style="margin: 5px 0;">
                    <a href="{{SiteURL}}/privacy" style="color: #3b82f6; text-decoration: none;">Privacy Policy</a> • 
                    <a href="{{SiteURL}}/terms" style="color: #3b82f6; text-decoration: none;">Terms of Service</a>
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
                <img src="{{SiteURL}}/logo.png" alt="Logo" style="max-height: 50px; margin-bottom: 20px;">
                <h1 style="color: #18181b; font-size: 24px; margin: 0;">You're Invited to Join Our Platform!</h1>
            </div>

            <!-- Main Content -->
            <div style="color: #52525b; font-size: 16px; line-height: 24px; margin-bottom: 30px;">
                <p>Hello,</p>
                <p>You have been invited by <strong>{{InviterName}}</strong> to join <strong>{{WorkplaceName}}</strong> as a {{InvitationType}} on our platform.</p>
                <p>To accept this invitation and create your account, please click the button below:</p>
            </div>

            <!-- Action Button -->
            <div style="text-align: center; margin: 30px 0;">
                <a href="{{ConfirmationURL}}" style="display: inline-block; background-color: #10b981; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">Accept Invitation</a>
            </div>

            <!-- Alternative Link -->
            <div style="margin-bottom: 30px; text-align: center;">
                <p style="color: #71717a; font-size: 14px;">If the button doesn't work, copy and paste this link in your browser:</p>
                <p style="color: #3b82f6; font-size: 14px; word-break: break-all;">{{ConfirmationURL}}</p>
            </div>

            <!-- Invitation Details -->
            <div style="margin: 30px 0; padding: 20px; background-color: #f8fafc; border-radius: 6px; border-left: 4px solid #10b981;">
                <h3 style="color: #18181b; font-size: 16px; margin: 0 0 10px 0;">Invitation Details:</h3>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="color: #52525b; font-size: 14px; padding: 2px 10px 2px 0; text-align: right; font-weight: bold; vertical-align: top; width: 40%;">Invited by:</td>
                        <td style="color: #52525b; font-size: 14px; padding: 2px 0; text-align: left; vertical-align: top;">{{InviterName}}</td>
                    </tr>
                    <tr>
                        <td style="color: #52525b; font-size: 14px; padding: 2px 10px 2px 0; text-align: right; font-weight: bold; vertical-align: top; width: 40%;">Organization:</td>
                        <td style="color: #52525b; font-size: 14px; padding: 2px 0; text-align: left; vertical-align: top;">{{WorkplaceName}}</td>
                    </tr>
                    <tr>
                        <td style="color: #52525b; font-size: 14px; padding: 2px 10px 2px 0; text-align: right; font-weight: bold; vertical-align: top; width: 40%;">Role:</td>
                        <td style="color: #52525b; font-size: 14px; padding: 2px 0; text-align: left; vertical-align: top;">{{InvitationType}}</td>
                    </tr>
                </table>
            </div>

            <!-- Security Notice -->
            <div style="border-top: 1px solid #e4e4e7; padding-top: 20px; margin-top: 20px;">
                <p style="color: #71717a; font-size: 14px; margin: 0;">This invitation will expire in 7 days. If you didn't expect this invitation or have any questions, please contact {{InviterName}} directly.</p>
            </div>

            <!-- Footer -->
            <div style="text-align: center; margin-top: 30px; color: #71717a; font-size: 14px;">
                <p style="margin: 5px 0;">© 2024 Mediloop. All rights reserved.</p>
                <p style="margin: 5px 0;">
                    <a href="{{SiteURL}}/privacy" style="color: #3b82f6; text-decoration: none;">Privacy Policy</a> • 
                    <a href="{{SiteURL}}/terms" style="color: #3b82f6; text-decoration: none;">Terms of Service</a>
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
                <img src="{{SiteURL}}/logo.png" alt="Logo" style="max-height: 50px; margin-bottom: 20px;">
                <h1 style="color: #18181b; font-size: 24px; margin: 0;">Healthcare Connection Request</h1>
            </div>

            <!-- Main Content -->
            <div style="color: #52525b; font-size: 16px; line-height: 24px; margin-bottom: 30px;">
                <p>Hello,</p>
                <p><strong>{{InviterTitle}} {{InviterName}}</strong> ({{InviterRole}}) would like to connect with you on our platform.</p>
                <p>This connection will allow you to share medical information securely and facilitate better healthcare coordination.</p>
                <p><strong>Note:</strong> You will need to create an account to accept this connection request if you don't have one already.</p>
            </div>

            <!-- Action Button -->
            <div style="text-align: center; margin: 30px 0;">
                <a href="{{ConfirmationURL}}" style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">View Connection Request</a>
            </div>

            <!-- Alternative Link -->
            <div style="margin-bottom: 30px; text-align: center;">
                <p style="color: #71717a; font-size: 14px;">If the button doesn't work, copy and paste this link in your browser:</p>
                <p style="color: #3b82f6; font-size: 14px; word-break: break-all;">{{ConfirmationURL}}</p>
            </div>

            <!-- Connection Details -->
            <div style="margin: 30px 0; padding: 20px; background-color: #f8fafc; border-radius: 6px; border-left: 4px solid #3b82f6;">
                <h3 style="color: #18181b; font-size: 16px; margin: 0 0 10px 0;">Connection Details:</h3>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="color: #52525b; font-size: 14px; padding: 2px 10px 2px 0; text-align: right; font-weight: bold; vertical-align: top; width: 40%;">Requesting connection:</td>
                        <td style="color: #52525b; font-size: 14px; padding: 2px 0; text-align: left; vertical-align: top;">{{InviterTitle}} {{InviterName}}</td>
                    </tr>
                    <tr>
                        <td style="color: #52525b; font-size: 14px; padding: 2px 10px 2px 0; text-align: right; font-weight: bold; vertical-align: top; width: 40%;">Role:</td>
                        <td style="color: #52525b; font-size: 14px; padding: 2px 0; text-align: left; vertical-align: top;">{{InviterRole}}</td>
                    </tr>
                </table>
            </div>

            <!-- Security Notice -->
            <div style="border-top: 1px solid #e4e4e7; padding-top: 20px; margin-top: 20px;">
                <p style="color: #71717a; font-size: 14px; margin: 0;">This connection request will expire in 7 days. You can accept or decline this request by clicking the link above.</p>
            </div>

            <!-- Footer -->
            <div style="text-align: center; margin-top: 30px; color: #71717a; font-size: 14px;">
                <p style="margin: 5px 0;">© 2024 Mediloop. All rights reserved.</p>
                <p style="margin: 5px 0;">
                    <a href="{{SiteURL}}/privacy" style="color: #3b82f6; text-decoration: none;">Privacy Policy</a> • 
                    <a href="{{SiteURL}}/terms" style="color: #3b82f6; text-decoration: none;">Terms of Service</a>
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
                <img src="{{SiteURL}}/logo.png" alt="Logo" style="max-height: 50px; margin-bottom: 20px;">
                <h1 style="color: #18181b; font-size: 24px; margin: 0;">Connection Accepted!</h1>
            </div>

            <!-- Main Content -->
            <div style="color: #52525b; font-size: 16px; line-height: 24px; margin-bottom: 30px;">
                <p>Hello,</p>
                <p><strong>{{ResponderTitle}} {{ResponderName}}</strong> ({{ResponderRole}}) has accepted your connection request!</p>
                <p>You can now communicate securely and coordinate healthcare through our platform.</p>
                <p>Click the button below to access your dashboard and start collaborating.</p>
            </div>

            <!-- Action Button -->
            <div style="text-align: center; margin: 30px 0;">
                <a href="{{DashboardURL}}" style="display: inline-block; background-color: #10b981; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">Go to Dashboard</a>
            </div>

            <!-- Connection Details -->
            <div style="margin: 30px 0; padding: 20px; background-color: #f8fafc; border-radius: 6px; border-left: 4px solid #10b981;">
                <h3 style="color: #18181b; font-size: 16px; margin: 0 0 10px 0;">Connection Details:</h3>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="color: #52525b; font-size: 14px; padding: 2px 10px 2px 0; text-align: right; font-weight: bold; vertical-align: top; width: 40%;">Connected with:</td>
                        <td style="color: #52525b; font-size: 14px; padding: 2px 0; text-align: left; vertical-align: top;">{{ResponderTitle}} {{ResponderName}}</td>
                    </tr>
                    <tr>
                        <td style="color: #52525b; font-size: 14px; padding: 2px 10px 2px 0; text-align: right; font-weight: bold; vertical-align: top; width: 40%;">Role:</td>
                        <td style="color: #52525b; font-size: 14px; padding: 2px 0; text-align: left; vertical-align: top;">{{ResponderRole}}</td>
                    </tr>
                    <tr>
                        <td style="color: #52525b; font-size: 14px; padding: 2px 10px 2px 0; text-align: right; font-weight: bold; vertical-align: top; width: 40%;">Status:</td>
                        <td style="color: #52525b; font-size: 14px; padding: 2px 0; text-align: left; vertical-align: top;">Connected</td>
                    </tr>
                </table>
            </div>

            <!-- Security Notice -->
            <div style="border-top: 1px solid #e4e4e7; padding-top: 20px; margin-top: 20px;">
                <p style="color: #71717a; font-size: 14px; margin: 0;">This connection enables secure communication and healthcare information sharing between both parties.</p>
            </div>

            <!-- Footer -->
            <div style="text-align: center; margin-top: 30px; color: #71717a; font-size: 14px;">
                <p style="margin: 5px 0;">© 2024 Mediloop. All rights reserved.</p>
                <p style="margin: 5px 0;">
                    <a href="{{SiteURL}}/privacy" style="color: #3b82f6; text-decoration: none;">Privacy Policy</a> • 
                    <a href="{{SiteURL}}/terms" style="color: #3b82f6; text-decoration: none;">Terms of Service</a>
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
                        {{Token}}
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
                <p>Follow this link to confirm the update of your email from {{Email}} to {{NewEmail}}:</p>
            </div>

            <!-- Action Button -->
            <div style="text-align: center; margin: 30px 0;">
                <a href="{{ConfirmationURL}}" style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">Change Email</a>
            </div>

            <!-- Alternative Link -->
            <div style="margin-bottom: 30px; text-align: center;">
                <p style="color: #71717a; font-size: 14px;">If the button doesn't work, copy and paste this link in your browser:</p>
                <p style="color: #3b82f6; font-size: 14px; word-break: break-all;">{{ConfirmationURL}}</p>
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
                <a href="{{ConfirmationURL}}" style="display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">
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
                <p style="word-break: break-all; color: #3b82f6;">{{ConfirmationURL}}</p>
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
                        {{Token}}
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
  `,
  'medication-order': `
    <!DOCTYPE html>
    <html>
    <body style="margin: 0; padding: 20px; background-color: #f4f4f5; font-family: Arial, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; padding: 40px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
            <!-- Header with Logo Placeholder -->
            <div style="text-align: center; margin-bottom: 30px;">
                <img src="{{SiteURL}}/logo.png" alt="Logo" style="max-height: 50px; margin-bottom: 20px;">
                <h1 style="color: #18181b; font-size: 24px; margin: 0;">Your Medication Order Confirmation</h1>
            </div>

            <!-- Main Content -->
            <div style="color: #52525b; font-size: 16px; line-height: 24px; margin-bottom: 30px;">
                <p>Hello,</p>
                <p>Thank you for your order! Your medication order has been confirmed and is being processed.</p>
            </div>

            <!-- Order Details -->
            <div style="margin: 30px 0; padding: 20px; background-color: #f8fafc; border-radius: 6px; border-left: 4px solid #10b981;">
                <h3 style="color: #18181b; font-size: 16px; margin: 0 0 15px 0;">Order Details:</h3>
                <div style="margin-bottom: 15px;">
                    {{#each items}}
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <span style="color: #52525b;">{{name}} x {{quantity}}</span>
                        <span style="color: #52525b; font-weight: bold;">€{{price}}</span>
                    </div>
                    {{/each}}
                </div>
                <div style="border-top: 1px solid #e4e4e7; padding-top: 15px; margin-top: 15px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <span style="color: #52525b;">Delivery Fee:</span>
                        <span style="color: #52525b;">€{{DeliveryFee}}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 18px;">
                        <span style="color: #18181b;">Total:</span>
                        <span style="color: #18181b;">€{{total}}</span>
                    </div>
                </div>
            </div>

            <!-- Delivery Info -->
            <div style="margin: 30px 0; padding: 20px; background-color: #f0f9ff; border-radius: 6px;">
                <h3 style="color: #18181b; font-size: 16px; margin: 0 0 10px 0;">Delivery Information:</h3>
                <p style="color: #52525b; font-size: 14px; margin: 0;">Your order will be processed and you will be notified when it's ready for delivery. Expected delivery time is 24-48 hours.</p>
            </div>

            <!-- Support Notice -->
            <div style="border-top: 1px solid #e4e4e7; padding-top: 20px; margin-top: 20px;">
                <p style="color: #71717a; font-size: 14px; margin: 0;">If you have any questions about your order, please contact our support team.</p>
            </div>

            <!-- Footer -->
            <div style="text-align: center; margin-top: 30px; color: #71717a; font-size: 14px;">
                <p style="margin: 5px 0;">© 2024 Mediloop. All rights reserved.</p>
                <p style="margin: 5px 0;">
                    <a href="{{SiteURL}}/privacy" style="color: #3b82f6; text-decoration: none;">Privacy Policy</a> • 
                    <a href="{{SiteURL}}/terms" style="color: #3b82f6; text-decoration: none;">Terms of Service</a>
                </p>
            </div>
        </div>
    </body>
    </html>
  `
};

export class EmailTemplateService {
  private resendApiKey: string;

  constructor() {
    this.resendApiKey = Deno.env.get('RESEND_API_KEY') || '';
    if (!this.resendApiKey) {
      console.warn('RESEND_API_KEY not configured - email sending will not work');
    }
  }

  private replaceVariables(template: string, variables: Record<string, any>): string {
    let html = template;
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      html = html.replace(regex, String(value));
    }
    return html;
  }

  async sendTemplatedEmail(templateName: string, recipientEmail: string, variables: Record<string, any>): Promise<boolean> {
    try {
      console.log(`Sending templated email: ${templateName} to ${recipientEmail}`);
      
      // Get template from our stored templates
      const template = emailTemplates[templateName as keyof typeof emailTemplates];
      if (!template) {
        throw new Error(`Template '${templateName}' not found`);
      }

      // Replace template variables
      const html = this.replaceVariables(template, variables);

      // Get template config from database
      const client = await postgresService.getClient();
      
      const templateResult = await client.queryObject(
        'SELECT subject FROM email_templates WHERE name = $1 AND is_active = true',
        [templateName]
      );

      const subject = templateResult.rows[0]?.subject || 'Notification';

      // Create email log entry
      const logResult = await client.queryObject(
        `INSERT INTO email_logs (template_name, recipient_email, subject, variables, status) 
         VALUES ($1, $2, $3, $4, 'sending') 
         RETURNING id`,
        [templateName, recipientEmail, subject, JSON.stringify(variables)]
      );

      const logId = logResult.rows[0]?.id;

      postgresService.releaseClient(client);

      // Send email using Resend
      const emailResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.resendApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'Mediloop <onboarding@resend.dev>',
          to: [recipientEmail],
          subject,
          html
        })
      });

      if (!emailResponse.ok) {
        const errorText = await emailResponse.text();
        console.error('Resend API error:', errorText);
        
        // Update log with error
        if (logId) {
          const client2 = await postgresService.getClient();
          await client2.queryObject(
            'UPDATE email_logs SET status = $1, error_message = $2 WHERE id = $3',
            ['failed', errorText, logId]
          );
          postgresService.releaseClient(client2);
        }
        
        throw new Error(`Failed to send email: ${errorText}`);
      }

      const emailResult = await emailResponse.json();
      console.log('Email sent successfully:', emailResult);

      // Update log with success
      if (logId) {
        const client3 = await postgresService.getClient();
        await client3.queryObject(
          'UPDATE email_logs SET status = $1, sent_at = $2 WHERE id = $3',
          ['sent', new Date().toISOString(), logId]
        );
        postgresService.releaseClient(client3);
      }

      return true;
    } catch (error) {
      console.error('Error sending templated email:', error);
      return false;
    }
  }

  // Legacy email methods - updated to use templates
  async sendEmailConfirmation(email: string, confirmationUrl: string): Promise<boolean> {
    return await this.sendTemplatedEmail('confirm-signup', email, {
      SiteURL: config.SITE_URL || '',
      Email: email,
      ConfirmationURL: confirmationUrl
    });
  }

  async sendPasswordReset(email: string, resetUrl: string): Promise<boolean> {
    return await this.sendTemplatedEmail('reset-password', email, {
      ConfirmationURL: resetUrl
    });
  }

  async sendLoginCode(email: string, code: string): Promise<boolean> {
    return await this.sendTemplatedEmail('magic-link', email, {
      Token: code
    });
  }

  async sendWelcomeEmail(email: string, userName: string, userRole: string, loginUrl: string): Promise<boolean> {
    // For welcome emails, we'll use the confirmation template for now
    return await this.sendTemplatedEmail('confirm-signup', email, {
      SiteURL: config.SITE_URL || '',
      Email: email,
      ConfirmationURL: loginUrl
    });
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
      SiteURL: config.SITE_URL || '',
      InviterName: inviterName,
      InvitationType: invitationType,
      WorkplaceName: workplaceName,
      ConfirmationURL: confirmationUrl
    });
  }

  async sendConnectionInvitation(
    email: string,
    inviterName: string,
    inviterTitle: string,
    inviterRole: string,
    confirmationUrl: string
  ): Promise<boolean> {
    return await this.sendTemplatedEmail('connection-invitation', email, {
      SiteURL: config.SITE_URL || '',
      InviterName: inviterName,
      InviterTitle: inviterTitle,
      InviterRole: inviterRole,
      RecipientEmail: email,
      ConfirmationURL: confirmationUrl
    });
  }

  async sendConnectionResponse(
    email: string,
    responderName: string,
    responderTitle: string,
    responderRole: string,
    dashboardUrl: string
  ): Promise<boolean> {
    return await this.sendTemplatedEmail('connection-response', email, {
      SiteURL: config.SITE_URL || '',
      ResponderName: responderName,
      ResponderTitle: responderTitle,
      ResponderRole: responderRole,
      DashboardURL: dashboardUrl
    });
  }

  async sendChangeEmail(email: string, newEmail: string, confirmationUrl: string): Promise<boolean> {
    return await this.sendTemplatedEmail('change-email', email, {
      Email: email,
      NewEmail: newEmail,
      ConfirmationURL: confirmationUrl
    });
  }

  async sendReauthentication(email: string, code: string): Promise<boolean> {
    return await this.sendTemplatedEmail('reauthentication', email, {
      Token: code
    });
  }

  async sendMedicationOrderEmail(
    email: string,
    items: Array<{name: string, quantity: number, price: number}>,
    total: number,
    deliveryFee: number = 5.00
  ): Promise<boolean> {
    return await this.sendTemplatedEmail('medication-order', email, {
      SiteURL: config.SITE_URL || '',
      items,
      total: total.toFixed(2),
      DeliveryFee: deliveryFee.toFixed(2)
    });
  }
}

export const emailTemplateService = new EmailTemplateService();
