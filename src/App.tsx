
import { useEffect } from 'react'
import './App.css'
import AppRoutes from './AppRoutes';
import { TenantProvider } from './contexts/TenantContext';

function App() {
  useEffect(() => {
    console.log("App component mounted");
  }, []);
  
  return (
    <TenantProvider>
      <AppRoutes />
    </TenantProvider>
  );
}

export default App;
