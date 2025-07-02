
import React from 'react';
import UnifiedLayoutTemplate from '@/components/layout/UnifiedLayoutTemplate';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const Contact = () => {
  return (
    <UnifiedLayoutTemplate>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Contact Us</h1>
        <p className="text-muted-foreground mb-8">Get in touch with our team</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Send us a message</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input placeholder="Your name" />
              <Input type="email" placeholder="Your email" />
              <Input placeholder="Subject" />
              <Textarea placeholder="Your message" rows={5} />
              <Button className="w-full">Send Message</Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold">Email</h4>
                <p className="text-muted-foreground">support@luxmed.com</p>
              </div>
              <div>
                <h4 className="font-semibold">Phone</h4>
                <p className="text-muted-foreground">+352 123 456 789</p>
              </div>
              <div>
                <h4 className="font-semibold">Address</h4>
                <p className="text-muted-foreground">123 Medical Street<br />Luxembourg City, Luxembourg</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </UnifiedLayoutTemplate>
  );
};

export default Contact;
