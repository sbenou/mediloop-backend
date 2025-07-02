
import React from 'react';
import UnifiedLayoutTemplate from '@/components/layout/UnifiedLayoutTemplate';

const Privacy = () => {
  return (
    <UnifiedLayoutTemplate>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
        <p className="text-muted-foreground mb-8">Last updated: March 2024</p>
        
        <div className="prose max-w-none space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Information We Collect</h2>
            <p>
              We collect information you provide directly to us, such as when you create an account, 
              use our services, or contact us for support. This may include:
            </p>
            <ul className="list-disc pl-6 mt-2">
              <li>Personal identification information (name, email, phone number)</li>
              <li>Health information (with your explicit consent)</li>
              <li>Payment information (processed securely through third-party providers)</li>
              <li>Usage data and preferences</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-2xl font-semibold mb-4">2. How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul className="list-disc pl-6 mt-2">
              <li>Provide, maintain, and improve our services</li>
              <li>Process transactions and send related information</li>
              <li>Send technical notices and security alerts</li>
              <li>Respond to your comments and questions</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-2xl font-semibold mb-4">3. Information Sharing</h2>
            <p>
              We do not sell, trade, or otherwise transfer your personal information to third parties 
              without your explicit consent, except as described in this policy. We may share 
              information with:
            </p>
            <ul className="list-disc pl-6 mt-2">
              <li>Healthcare providers involved in your care (with your consent)</li>
              <li>Service providers who assist in our operations</li>
              <li>Legal authorities when required by law</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Data Security</h2>
            <p>
              We implement appropriate security measures to protect your personal information 
              against unauthorized access, alteration, disclosure, or destruction. This includes 
              encryption, secure servers, and regular security assessments.
            </p>
          </section>
          
          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Your Rights</h2>
            <p>Under GDPR and other applicable laws, you have the right to:</p>
            <ul className="list-disc pl-6 mt-2">
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Delete your data (right to be forgotten)</li>
              <li>Object to processing</li>
              <li>Data portability</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy, please contact our Data Protection 
              Officer at privacy@luxmed.com or write to us at:
            </p>
            <address className="mt-2 not-italic">
              Luxmed Privacy Team<br />
              123 Medical Street<br />
              Luxembourg City, Luxembourg
            </address>
          </section>
        </div>
      </div>
    </UnifiedLayoutTemplate>
  );
};

export default Privacy;
