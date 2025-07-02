
import React from 'react';
import UnifiedLayoutTemplate from '@/components/layout/UnifiedLayoutTemplate';

const Terms = () => {
  return (
    <UnifiedLayoutTemplate>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
        
        <div className="prose max-w-none space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
            <p>
              By accessing and using Luxmed's services, you accept and agree to be bound by the 
              terms and provision of this agreement. If you do not agree to abide by the above, 
              please do not use this service.
            </p>
          </section>
          
          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Use License</h2>
            <p>
              Permission is granted to temporarily download one copy of Luxmed's materials for 
              personal, non-commercial transitory viewing only. This is the grant of a license, 
              not a transfer of title.
            </p>
          </section>
          
          <section>
            <h2 className="text-2xl font-semibold mb-4">3. Medical Disclaimer</h2>
            <p>
              The information provided through Luxmed is for informational purposes only and 
              is not intended as a substitute for professional medical advice, diagnosis, or treatment. 
              Always seek the advice of your physician or other qualified health provider.
            </p>
          </section>
          
          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Privacy Policy</h2>
            <p>
              Your privacy is important to us. Our Privacy Policy explains how we collect, 
              use, and protect your information when you use our service.
            </p>
          </section>
          
          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Limitations</h2>
            <p>
              In no event shall Luxmed or its suppliers be liable for any damages (including, 
              without limitation, damages for loss of data or profit, or due to business interruption) 
              arising out of the use or inability to use Luxmed's materials.
            </p>
          </section>
          
          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Contact Information</h2>
            <p>
              If you have any questions about these Terms of Service, please contact us at 
              legal@luxmed.com.
            </p>
          </section>
        </div>
      </div>
    </UnifiedLayoutTemplate>
  );
};

export default Terms;
