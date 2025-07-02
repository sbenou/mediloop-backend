
import React from 'react';
import UnifiedLayoutTemplate from '@/components/layout/UnifiedLayoutTemplate';

const Pricing = () => {
  return (
    <UnifiedLayoutTemplate>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Pricing Plans</h1>
        <p className="text-muted-foreground mb-8">Choose the plan that works best for you</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="border rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-4">Basic</h3>
            <p className="text-2xl font-bold mb-4">€9.99/month</p>
            <p className="text-muted-foreground">Perfect for individuals getting started</p>
          </div>
          
          <div className="border rounded-lg p-6 border-primary">
            <h3 className="text-xl font-semibold mb-4">Professional</h3>
            <p className="text-2xl font-bold mb-4">€19.99/month</p>
            <p className="text-muted-foreground">Ideal for healthcare professionals</p>
          </div>
          
          <div className="border rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-4">Enterprise</h3>
            <p className="text-2xl font-bold mb-4">€49.99/month</p>
            <p className="text-muted-foreground">For large organizations and clinics</p>
          </div>
        </div>
      </div>
    </UnifiedLayoutTemplate>
  );
};

export default Pricing;
