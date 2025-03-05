
// Find the export default function section and add this Debug button component nearby

// At the bottom of the file, add this debug component
function SessionDebugButton() {
  const isLocalDev = process.env.NODE_ENV === 'development';
  
  if (!isLocalDev) return null;
  
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button 
        onClick={() => {
          // This uses the function we added to window in supabase.ts
          if ((window as any).clearAllSupabaseStorage) {
            (window as any).clearAllSupabaseStorage();
            alert('All Supabase storage cleared. Reload the page to see effects.');
          } else {
            alert('clearAllSupabaseStorage function not found');
          }
        }}
        className="bg-red-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-red-700"
      >
        Clear Auth Storage
      </button>
    </div>
  );
}

// Export the function that was implemented previously
export default SessionDebugButton;
