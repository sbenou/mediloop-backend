
import { useEffect } from 'react'
import './App.css'
import AppRoutes from './AppRoutes';
import { TenantProvider } from './contexts/TenantContext';

function App() {
  useEffect(() => {
    console.log("App component mounted - checking for rendering issues");
    // Add a flag to help identify if this is running in the correct environment
    console.log("Environment check:", {
      isDev: process.env.NODE_ENV === 'development',
      isTest: process.env.NODE_ENV === 'test',
      isProd: process.env.NODE_ENV === 'production',
    });
  }, []);
  
  return (
    <div className="app-container">
      {console.log("App rendering TenantProvider and AppRoutes")}
      <TenantProvider>
        <AppRoutes />
      </TenantProvider>
    </div>
  );
}

export default App;
