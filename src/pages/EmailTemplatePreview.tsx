
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const EmailTemplatePreview = () => {
  const [selectedTemplate, setSelectedTemplate] = useState('email-confirmation');

  const templates = {
    'email-confirmation': {
      title: 'Email Confirmation',
      subject: 'Confirm Your Email Address',
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Confirm Your Email</title>
        </head>
        <body style="margin: 0; padding: 20px; background-color: #f4f4f5; font-family: Arial, sans-serif;">
            <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; padding: 40px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
                <!-- Header -->
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #18181b; font-size: 24px; margin: 0;">Confirm Your Email</h1>
                </div>

                <!-- Main Content -->
                <div style="color: #52525b; font-size: 16px; line-height: 24px; margin-bottom: 30px;">
                    <p>Hello,</p>
                    <p>Thank you for signing up! Please confirm your email address by clicking the button below:</p>
                </div>

                <!-- Confirmation Button -->
                <div style="text-align: center; margin: 30px 0;">
                    <a href="https://example.com/confirm" style="display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">
                        Confirm Email Address
                    </a>
                </div>

                <!-- Alternative Link -->
                <div style="margin: 20px 0; color: #52525b; font-size: 14px;">
                    <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
                    <p style="word-break: break-all; color: #3b82f6;">https://example.com/confirm</p>
                </div>

                <!-- Security Notice -->
                <div style="margin: 30px 0; padding: 20px; background-color: #f8fafc; border-radius: 6px;">
                    <p style="color: #64748b; font-size: 14px; margin: 0;">
                        For security reasons, this confirmation link will expire in 24 hours. If you didn't create an account, you can safely ignore this email.
                    </p>
                </div>

                <!-- Footer -->
                <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e4e4e7;">
                    <p style="color: #71717a; font-size: 14px; margin: 5px 0;">
                        © 2024 Luxmed. All rights reserved.
                    </p>
                </div>
            </div>
        </body>
        </html>
      `
    },
    'password-reset': {
      title: 'Password Reset',
      subject: 'Reset Your Password',
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your Password</title>
        </head>
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
                    <a href="https://example.com/reset-password" style="display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">
                        Reset Password
                    </a>
                </div>

                <!-- Alternative Link -->
                <div style="margin: 20px 0; color: #52525b; font-size: 14px;">
                    <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
                    <p style="word-break: break-all; color: #3b82f6;">https://example.com/reset-password</p>
                </div>

                <!-- Security Notice -->
                <div style="margin: 30px 0; padding: 20px; background-color: #f8fafc; border-radius: 6px;">
                    <p style="color: #64748b; font-size: 14px; margin: 0;">
                        For security reasons, this password reset link will expire in 1 hour. If you need to reset your password after that, please request a new link.
                    </p>
                </div>

                <!-- Footer -->
                <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e4e4e7;">
                    <p style="color: #71717a; font-size: 14px; margin: 5px 0;">
                        If you didn't request a password reset, please contact our support team immediately.
                    </p>
                    <p style="color: #71717a; font-size: 14px; margin: 5px 0;">
                        © 2024 Luxmed. All rights reserved.
                    </p>
                </div>
            </div>
        </body>
        </html>
      `
    },
    'login-code': {
      title: 'Login Code',
      subject: 'Your Login Code',
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Your Login Code</title>
        </head>
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
                        <div style="font-size: 32px; font-weight: bold; color: #3b82f6; letter-spacing: 4px; padding: 20px; background-color: #f8fafc; border-radius: 6px;" role="textbox" aria-label="Login verification code">
                            ABC123
                        </div>
                    </div>
                    <p>Enter this code on the login page to continue.</p>
                </div>

                <!-- Security Notice -->
                <div style="margin: 30px 0; padding: 20px; background-color: #f8fafc; border-radius: 6px;">
                    <p style="color: #64748b; font-size: 14px; margin: 0;">
                        For security reasons, this code will expire in 1 hour. If you didn't request this code, please ignore this email.
                    </p>
                </div>

                <!-- Footer -->
                <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e4e4e7;">
                    <p style="color: #71717a; font-size: 14px; margin: 5px 0;">
                        © 2024 Luxmed. All rights reserved.
                    </p>
                </div>
            </div>
        </body>
        </html>
      `
    },
    'welcome': {
      title: 'Welcome Email',
      subject: 'Welcome to Luxmed!',
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to Luxmed</title>
        </head>
        <body style="margin: 0; padding: 20px; background-color: #f4f4f5; font-family: Arial, sans-serif;">
            <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; padding: 40px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
                <!-- Header -->
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #18181b; font-size: 24px; margin: 0;">Welcome to Luxmed!</h1>
                </div>

                <!-- Main Content -->
                <div style="color: #52525b; font-size: 16px; line-height: 24px; margin-bottom: 30px;">
                    <p>Hello John Doe,</p>
                    <p>Welcome to Luxmed! Your account has been successfully created and verified.</p>
                    <p>You can now access all the features available to patient users.</p>
                </div>

                <!-- Call to Action -->
                <div style="text-align: center; margin: 30px 0;">
                    <a href="https://example.com/login" style="display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">
                        Get Started
                    </a>
                </div>

                <!-- Features Info -->
                <div style="margin: 30px 0; padding: 20px; background-color: #f8fafc; border-radius: 6px;">
                    <h3 style="color: #374151; font-size: 16px; margin: 0 0 10px 0;">What's next?</h3>
                    <ul style="color: #64748b; font-size: 14px; margin: 0; padding-left: 20px;">
                        <li>Complete your profile setup</li>
                        <li>Explore the dashboard</li>
                        <li>Connect with healthcare professionals</li>
                        <li>Start managing your health journey</li>
                    </ul>
                </div>

                <!-- Footer -->
                <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e4e4e7;">
                    <p style="color: #71717a; font-size: 14px; margin: 5px 0;">
                        Need help? Contact our support team anytime.
                    </p>
                    <p style="color: #71717a; font-size: 14px; margin: 5px 0;">
                        © 2024 Luxmed. All rights reserved.
                    </p>
                </div>
            </div>
        </body>
        </html>
      `
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Email Template Preview</h1>
        <p className="text-gray-600">Preview all email templates used in the authentication system</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Template Selector */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Templates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {Object.entries(templates).map(([key, template]) => (
                <Button
                  key={key}
                  variant={selectedTemplate === key ? "default" : "outline"}
                  className="w-full justify-start"
                  onClick={() => setSelectedTemplate(key)}
                >
                  {template.title}
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Template Preview */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl">{templates[selectedTemplate].title}</CardTitle>
                <Badge variant="secondary" className="mt-2">
                  Subject: {templates[selectedTemplate].subject}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                <iframe
                  srcDoc={templates[selectedTemplate].html}
                  className="w-full h-[600px] border-0"
                  title={`${templates[selectedTemplate].title} Preview`}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EmailTemplatePreview;
