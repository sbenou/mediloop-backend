
import React from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import NotificationTestPanel from '@/components/testing/NotificationTestPanel';

const TestNotifications = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 w-full bg-gray-50">
        <div className="container mx-auto py-8 px-4">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Notification System Testing
            </h1>
            <p className="text-gray-600">
              Comprehensive testing suite for debugging connection request notifications
            </p>
          </div>
          
          <NotificationTestPanel />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default TestNotifications;
