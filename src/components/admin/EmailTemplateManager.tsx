
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useEmailTemplates } from '@/hooks/useEmailTemplates';
import { toast } from 'sonner';

const EmailTemplateManager = () => {
  const { 
    loading, 
    error, 
    sendTemplatedEmail, 
    getEmailTemplates, 
    getEmailLogs 
  } = useEmailTemplates();
  
  const [templates, setTemplates] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [variables, setVariables] = useState('{}');

  useEffect(() => {
    loadTemplates();
    loadLogs();
  }, []);

  const loadTemplates = async () => {
    try {
      const data = await getEmailTemplates();
      setTemplates(data);
    } catch (err) {
      toast.error('Failed to load templates');
    }
  };

  const loadLogs = async () => {
    try {
      const data = await getEmailLogs();
      setLogs(data);
    } catch (err) {
      toast.error('Failed to load email logs');
    }
  };

  const handleSendEmail = async () => {
    if (!selectedTemplate || !recipientEmail) {
      toast.error('Please select a template and enter recipient email');
      return;
    }

    try {
      const parsedVariables = JSON.parse(variables);
      await sendTemplatedEmail(selectedTemplate, recipientEmail, parsedVariables);
      toast.success('Email sent successfully!');
      loadLogs(); // Refresh logs
      setRecipientEmail('');
      setVariables('{}');
    } catch (err: any) {
      toast.error(err.message || 'Failed to send email');
    }
  };

  const getTemplateVariables = (templateName: string) => {
    const templateVariables = {
      'confirm-signup': { SiteURL: 'https://localhost:5173', Email: 'user@example.com', ConfirmationURL: 'https://localhost:5173/confirm' },
      'invite-user': { SiteURL: 'https://localhost:5173', InviterName: 'Dr. Smith', InvitationType: 'staff member', WorkplaceName: 'Medical Center', ConfirmationURL: 'https://localhost:5173/invite' },
      'connection-invitation': { SiteURL: 'https://localhost:5173', InviterName: 'Dr. Johnson', InviterTitle: 'Dr.', InviterRole: 'doctor', RecipientEmail: 'patient@example.com', ConfirmationURL: 'https://localhost:5173/connect' },
      'connection-response': { SiteURL: 'https://localhost:5173', ResponderName: 'John Doe', ResponderTitle: 'Mr.', ResponderRole: 'patient', DashboardURL: 'https://localhost:5173/dashboard' },
      'magic-link': { Token: '123456' },
      'change-email': { Email: 'old@example.com', NewEmail: 'new@example.com', ConfirmationURL: 'https://localhost:5173/change-email' },
      'reset-password': { ConfirmationURL: 'https://localhost:5173/reset-password' },
      'reauthentication': { Token: '123456' }
    };
    
    return templateVariables[templateName as keyof typeof templateVariables] || {};
  };

  const handleTemplateChange = (templateName: string) => {
    setSelectedTemplate(templateName);
    setVariables(JSON.stringify(getTemplateVariables(templateName), null, 2));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Send Test Email</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="template">Template</Label>
            <Select value={selectedTemplate} onValueChange={handleTemplateChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select a template" />
              </SelectTrigger>
              <SelectContent>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.name}>
                    {template.name.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="email">Recipient Email</Label>
            <Input
              id="email"
              type="email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder="recipient@example.com"
            />
          </div>

          <div>
            <Label htmlFor="variables">Template Variables (JSON)</Label>
            <Textarea
              id="variables"
              value={variables}
              onChange={(e) => setVariables(e.target.value)}
              placeholder='{"key": "value"}'
              rows={8}
              className="font-mono text-sm"
            />
          </div>

          <Button 
            onClick={handleSendEmail} 
            disabled={loading || !selectedTemplate || !recipientEmail}
          >
            {loading ? 'Sending...' : 'Send Email'}
          </Button>

          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Email Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {logs.map((log) => (
              <div key={log.id} className="flex items-center justify-between p-3 border rounded">
                <div>
                  <div className="font-medium">{log.template_name}</div>
                  <div className="text-sm text-gray-600">{log.recipient_email}</div>
                  <div className="text-xs text-gray-500">{new Date(log.created_at).toLocaleString()}</div>
                </div>
                <div className={`px-2 py-1 rounded text-xs ${
                  log.status === 'sent' ? 'bg-green-100 text-green-800' :
                  log.status === 'failed' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {log.status}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailTemplateManager;
