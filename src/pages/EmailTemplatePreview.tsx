import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const EmailTemplatePreview = () => {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('welcome');

  // Sample data for template variables
  const templateData = {
    welcome: {
      UserName: 'John Doe',
      UserRole: 'patient',
      LoginURL: 'https://localhost:5173/login'
    },
    'email-confirmation': {
      ConfirmationURL: 'https://localhost:5173/auth/confirm?token=sample-token'
    },
    'password-reset': {
      ConfirmationURL: 'https://localhost:5173/reset-password?token=sample-token'
    },
    'login-code': {
      Token: '123456'
    }
  };

  // Template content (simplified HTML for preview)
  const templates = {
    welcome: `
      <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; padding: 40px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #18181b; font-size: 24px; margin: 0;">Welcome to Mediloop!</h1>
        </div>
        <div style="color: #52525b; font-size: 16px; line-height: 24px; margin-bottom: 30px;">
          <p>Hello ${templateData.welcome.UserName},</p>
          <p>Welcome to Mediloop! Your account has been successfully created and verified.</p>
          <p>You can now access all the features available to ${templateData.welcome.UserRole} users.</p>
        </div>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${templateData.welcome.LoginURL}" style="display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">
            Get Started
          </a>
        </div>
        <div style="margin: 30px 0; padding: 20px; background-color: #f8fafc; border-radius: 6px;">
          <h3 style="color: #374151; font-size: 16px; margin: 0 0 10px 0;">What's next?</h3>
          <ul style="color: #64748b; font-size: 14px; margin: 0; padding-left: 20px;">
            <li>Complete your profile setup</li>
            <li>Explore the dashboard</li>
            <li>Connect with healthcare professionals</li>
            <li>Start managing your health journey</li>
          </ul>
        </div>
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e4e4e7;">
          <p style="color: #71717a; font-size: 14px; margin: 5px 0;">
            Need help? Contact our support team anytime.
          </p>
          <p style="color: #71717a; font-size: 14px; margin: 5px 0;">
            © 2024 Mediloop. All rights reserved.
          </p>
        </div>
      </div>
    `,
    'email-confirmation': `
      <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; padding: 40px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #18181b; font-size: 24px; margin: 0;">Confirm Your Email</h1>
        </div>
        <div style="color: #52525b; font-size: 16px; line-height: 24px; margin-bottom: 30px;">
          <p>Hello,</p>
          <p>Thank you for signing up! Please confirm your email address by clicking the button below:</p>
        </div>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${templateData['email-confirmation'].ConfirmationURL}" style="display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">
            Confirm Email Address
          </a>
        </div>
        <div style="margin: 20px 0; color: #52525b; font-size: 14px;">
          <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #3b82f6;">${templateData['email-confirmation'].ConfirmationURL}</p>
        </div>
        <div style="margin: 30px 0; padding: 20px; background-color: #f8fafc; border-radius: 6px;">
          <p style="color: #64748b; font-size: 14px; margin: 0;">
            For security reasons, this confirmation link will expire in 24 hours. If you didn't create an account, you can safely ignore this email.
          </p>
        </div>
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e4e4e7;">
          <p style="color: #71717a; font-size: 14px; margin: 5px 0;">
            © 2024 Mediloop. All rights reserved.
          </p>
        </div>
      </div>
    `,
    'password-reset': `
      <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; padding: 40px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #18181b; font-size: 24px; margin: 0;">Reset Your Password</h1>
        </div>
        <div style="color: #52525b; font-size: 16px; line-height: 24px; margin-bottom: 30px;">
          <p>Hello,</p>
          <p>We received a request to reset the password for your account. If you didn't make this request, you can safely ignore this email.</p>
          <p>To reset your password, click the button below:</p>
        </div>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${templateData['password-reset'].ConfirmationURL}" style="display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">
            Reset Password
          </a>
        </div>
        <div style="margin: 20px 0; color: #52525b; font-size: 14px;">
          <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #3b82f6;">${templateData['password-reset'].ConfirmationURL}</p>
        </div>
        <div style="margin: 30px 0; padding: 20px; background-color: #f8fafc; border-radius: 6px;">
          <p style="color: #64748b; font-size: 14px; margin: 0;">
            For security reasons, this password reset link will expire in 1 hour. If you need to reset your password after that, please request a new link.
          </p>
        </div>
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e4e4e7;">
          <p style="color: #71717a; font-size: 14px; margin: 5px 0;">
            If you didn't request a password reset, please contact our support team immediately.
          </p>
          <p style="color: #71717a; font-size: 14px; margin: 5px 0;">
            © 2024 Mediloop. All rights reserved.
          </p>
        </div>
      </div>
    `,
    'login-code': `
      <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; padding: 40px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #18181b; font-size: 24px; margin: 0;">Your Login Code</h1>
        </div>
        <div style="color: #52525b; font-size: 16px; line-height: 24px; margin-bottom: 30px;">
          <p>Hello,</p>
          <p>Here is your login code to access your account:</p>
          <div style="text-align: center; margin: 30px 0;">
            <div style="font-size: 32px; font-weight: bold; color: #3b82f6; letter-spacing: 4px; padding: 20px; background-color: #f8fafc; border-radius: 6px;">
              ${templateData['login-code'].Token}
            </div>
          </div>
          <p>Enter this code on the login page to continue.</p>
        </div>
        <div style="margin: 30px 0; padding: 20px; background-color: #f8fafc; border-radius: 6px;">
          <p style="color: #64748b; font-size: 14px; margin: 0;">
            For security reasons, this code will expire in 1 hour. If you didn't request this code, please ignore this email.
          </p>
        </div>
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e4e4e7;">
          <p style="color: #71717a; font-size: 14px; margin: 5px 0;">
            © 2024 Mediloop. All rights reserved.
          </p>
        </div>
      </div>
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
