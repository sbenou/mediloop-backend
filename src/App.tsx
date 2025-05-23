
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
      console.log('Window fully loaded in App component');
    });
  }, []);
  
  // Log before render but outside JSX
  console.log("App rendering TenantProvider and AppRoutes");
  
  return (
    <div className="app-container relative min-h-screen">
      {/* Debug element at app level with extremely high z-index */}
      <div className="fixed bottom-0 left-0 right-0 bg-green-600 text-white p-4 text-center font-bold text-xl" 
           style={{ zIndex: 999998 }}>
        App Component Loaded Successfully
      </div>
      
      <TenantProvider>
        <AppRoutes />
      </TenantProvider>
    </div>
  );
}

export default App;
