
export const getOTPEmail = () => {
  console.log("Getting OTP email from available sources...");
  
  try {
    // Try to get email from URL search params first
    const params = new URLSearchParams(window.location.search);
    const emailParam = params.get('email');
    if (emailParam) {
      console.log("Email found in URL params:", emailParam);
      return emailParam;
    }
    
    // Try to get email from location state safely
    try {
      if (history.state && typeof history.state === 'object' && history.state.usr && typeof history.state.usr === 'object') {
        const stateEmail = history.state.usr.email;
        if (stateEmail) {
          console.log("Email found in location state:", stateEmail);
          return stateEmail;
        }
      }
    } catch (stateError) {
      console.warn("Error accessing location state:", stateError);
    }

    // Fallback to localStorage
    try {
      const storedEmail = localStorage.getItem('otp_email');
      const expiryTime = localStorage.getItem('otp_email_expiry');

      if (storedEmail && expiryTime) {
        const expiry = parseInt(expiryTime);
        if (!isNaN(expiry) && new Date().getTime() <= expiry) {
          console.log("Email found in localStorage:", storedEmail);
          return storedEmail;
        }
        console.log("Stored email expired");
        
        // Clear expired email
        localStorage.removeItem('otp_email');
        localStorage.removeItem('otp_email_expiry');
      }
    } catch (storageError) {
      console.warn("Error accessing localStorage:", storageError);
    }

    console.log("No valid email found");
    return null;
  } catch (error) {
    console.error("Error retrieving OTP email:", error);
    return null;
  }
};
