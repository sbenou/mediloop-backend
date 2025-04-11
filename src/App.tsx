
import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import AppRoutes from './AppRoutes';
import { RecoilRoot } from 'recoil';
import { AuthInit } from './components/auth/AuthInit';
import { Toaster } from './components/ui/toaster';
import { AuthDebuggerSimple } from './components/auth/AuthDebuggerSimple';

function App() {
  return (
    <RecoilRoot>
      <Router>
        <AuthInit />
        <AuthDebuggerSimple />
        <AppRoutes />
        <Toaster />
      </Router>
    </RecoilRoot>
  );
}

export default App;
