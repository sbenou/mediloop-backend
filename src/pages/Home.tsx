import React from 'react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-6">Welcome to MediHop Delivery</h1>
      <p className="text-lg mb-4">Your trusted pharmacy delivery service</p>
    </div>
  );
};

export default Home;