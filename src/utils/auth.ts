
export const getOTPEmail = () => {
  console.log("Getting OTP email from available sources...");
  
  try {
    // Try to get email from location state first
    const params = new URLSearchParams(window.location.search);
    const stateEmail = history.state?.usr?.email;
    if (stateEmail) {
      console.log("Email found in location state:", stateEmail);
      return stateEmail;
    }

    // Fallback to localStorage
    const storedEmail = localStorage.getItem('otp_email');
    const expiryTime = localStorage.getItem('otp_email_expiry');

    if (storedEmail && expiryTime) {
      const expiry = parseInt(expiryTime);
      if (new Date().getTime() <= expiry) {
        console.log("Email found in localStorage:", storedEmail);
        return storedEmail;
      }
      console.log("Stored email expired");
    }

    console.log("No valid email found");
    return null;
  } catch (error) {
    console.error("Error retrieving OTP email:", error);
    return null;
  }
};
