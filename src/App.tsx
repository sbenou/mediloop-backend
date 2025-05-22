
import { useEffect } from 'react'
import './App.css'
import AppRoutes from './AppRoutes';
import { TenantProvider } from './contexts/TenantContext';

function App() {
  return (
    <TenantProvider>
      <AppRoutes />
    </TenantProvider>
  );
}

export default App;
