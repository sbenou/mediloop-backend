
// Remove the logo part from the Link element
{showBackLink ? (
  <button 
    onClick={handleBackClick} 
    className="flex items-center text-primary hover:text-primary/80"
  >
    <ArrowLeft className="h-4 w-4 mr-2" />
    Back
  </button>
) : null}
