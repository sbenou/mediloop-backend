
import React from 'react';

export function PlansTab() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Free Plan */}
      <div className="border rounded-lg p-6 bg-white shadow-sm">
        <h2 className="text-xl font-semibold mb-2">Free Plan</h2>
        <div className="text-3xl font-bold mb-4">$0<span className="text-lg text-muted-foreground">/month</span></div>
        <ul className="space-y-2 mb-6">
          <li className="flex items-center">
            <span className="text-green-500 mr-2">✓</span>
            <span>Basic features</span>
          </li>
          <li className="flex items-center">
            <span className="text-green-500 mr-2">✓</span>
            <span>Limited consultations</span>
          </li>
          <li className="flex items-center text-muted-foreground">
            <span className="text-red-500 mr-2">✗</span>
            <span>Premium support</span>
          </li>
        </ul>
        <button className="w-full py-2 border border-primary text-primary hover:bg-primary/5 rounded-md transition-colors">
          Current Plan
        </button>
      </div>
      
      {/* Pro Plan */}
      <div className="border rounded-lg p-6 bg-primary/5 shadow-md border-primary">
        <div className="absolute -mt-8 px-3 py-1 bg-primary text-white rounded-md">
          Recommended
        </div>
        <h2 className="text-xl font-semibold mb-2">Pro Plan</h2>
        <div className="text-3xl font-bold mb-4">$19.99<span className="text-lg text-muted-foreground">/month</span></div>
        <ul className="space-y-2 mb-6">
          <li className="flex items-center">
            <span className="text-green-500 mr-2">✓</span>
            <span>All basic features</span>
          </li>
          <li className="flex items-center">
            <span className="text-green-500 mr-2">✓</span>
            <span>Unlimited consultations</span>
          </li>
          <li className="flex items-center">
            <span className="text-green-500 mr-2">✓</span>
            <span>Premium support</span>
          </li>
          <li className="flex items-center">
            <span className="text-green-500 mr-2">✓</span>
            <span>Advanced analytics</span>
          </li>
        </ul>
        <button className="w-full py-2 bg-primary text-white hover:bg-primary/90 rounded-md transition-colors">
          Upgrade Now
        </button>
      </div>
      
      {/* Enterprise Plan */}
      <div className="border rounded-lg p-6 bg-white shadow-sm">
        <h2 className="text-xl font-semibold mb-2">Enterprise</h2>
        <div className="text-3xl font-bold mb-4">$99.99<span className="text-lg text-muted-foreground">/month</span></div>
        <ul className="space-y-2 mb-6">
          <li className="flex items-center">
            <span className="text-green-500 mr-2">✓</span>
            <span>All Pro features</span>
          </li>
          <li className="flex items-center">
            <span className="text-green-500 mr-2">✓</span>
            <span>Dedicated account manager</span>
          </li>
          <li className="flex items-center">
            <span className="text-green-500 mr-2">✓</span>
            <span>Custom integrations</span>
          </li>
          <li className="flex items-center">
            <span className="text-green-500 mr-2">✓</span>
            <span>White-label options</span>
          </li>
        </ul>
        <button className="w-full py-2 border border-gray-300 hover:bg-gray-50 rounded-md transition-colors">
          Contact Sales
        </button>
      </div>
    </div>
  );
}
