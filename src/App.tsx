
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
    
    // Set a global variable to confirm the app is loading
    window.addEventListener('load', () => {
      console.log('Window fully loaded');
    });
  }, []);
  
  // Log before render but outside JSX
  console.log("App rendering TenantProvider and AppRoutes");
  
  return (
    <div className="app-container">
      {/* Debug element at app level */}
      <div className="fixed bottom-0 left-0 right-0 bg-green-500 text-white p-2 z-[9999] text-center">
        App Component Loaded
      </div>
      
      <TenantProvider>
        <AppRoutes />
      </TenantProvider>
    </div>
  );
}

export default App;
