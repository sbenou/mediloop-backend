
import React from 'react';
import UnifiedLayoutTemplate from '@/components/layout/UnifiedLayoutTemplate';

const About = () => {
  return (
    <UnifiedLayoutTemplate>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">About Luxmed</h1>
        <div className="prose max-w-none">
          <p className="text-lg mb-6">
            Luxmed is a comprehensive healthcare platform designed to connect patients, 
            doctors, and pharmacists in Luxembourg and beyond.
          </p>
          
          <h2 className="text-2xl font-semibold mb-4">Our Mission</h2>
          <p className="mb-6">
            To revolutionize healthcare delivery by providing seamless digital solutions 
            that improve patient outcomes and streamline healthcare processes.
          </p>
          
          <h2 className="text-2xl font-semibold mb-4">What We Offer</h2>
          <ul className="list-disc pl-6 mb-6">
            <li>Telemedicine consultations</li>
            <li>Digital prescription management</li>
            <li>Pharmacy network integration</li>
            <li>Patient health records</li>
            <li>Appointment scheduling</li>
          </ul>
          
          <h2 className="text-2xl font-semibold mb-4">Our Values</h2>
          <p>
            We believe in putting patients first, maintaining the highest standards of 
            privacy and security, and fostering innovation in healthcare technology.
          </p>
        </div>
      </div>
    </UnifiedLayoutTemplate>
  );
};

export default About;
