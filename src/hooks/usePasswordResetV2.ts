/**
 * Password Reset V2 Hook
 * Handles both OTP and email link password reset flows
 */

import { useState } from "react";
import { authClientV2, isRateLimitError } from "../lib/authClientV2";
import { featureFlags } from "../lib/featureFlags";

export type ResetMethod = "otp" | "email";

interface PasswordResetState {
  loading: boolean;
  error: string | null;
  success: boolean;
  isRateLimited: boolean;
  retryAfter?: number;
  otpSent: boolean;
  emailSent: boolean;
}

export function usePasswordResetV2() {
  const [state, setState] = useState<PasswordResetState>({
    loading: false,
    error: null,
    success: false,
    isRateLimited: false,
    otpSent: false,
    emailSent: false,
  });

  /**
   * Request password reset OTP
   */
  const requestOTP = async (phone: string) => {
    if (!featureFlags.isEnabled("usePasswordResetV2")) {
      throw new Error("Password Reset V2 is not enabled");
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const response = await authClientV2.requestPasswordResetOTP(phone);

      if (response.success) {
        setState({
          loading: false,
          error: null,
          success: false,
          isRateLimited: false,
          otpSent: true,
          emailSent: false,
        });
        return { success: true };
      } else {
        throw new Error(response.error || "Failed to send OTP");
      }
    } catch (error) {
      if (isRateLimitError(error)) {
        setState({
          loading: false,
          error: error.message,
          success: false,
          isRateLimited: true,
          retryAfter: error.retryAfter,
          otpSent: false,
          emailSent: false,
        });
      } else {
        setState({
          loading: false,
          error: error instanceof Error ? error.message : "Failed to send OTP",
          success: false,
          isRateLimited: false,
          otpSent: false,
          emailSent: false,
        });
      }
      return { success: false, error };
    }
  };

  /**
   * Verify OTP and reset password
   */
  const resetWithOTP = async (
    phone: string,
    otp: string,
    newPassword: string,
  ) => {
    if (!featureFlags.isEnabled("usePasswordResetV2")) {
      throw new Error("Password Reset V2 is not enabled");
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const response = await authClientV2.resetPasswordWithOTP(
        phone,
        otp,
        newPassword,
      );

      if (response.success) {
        setState({
          loading: false,
          error: null,
          success: true,
          isRateLimited: false,
          otpSent: false,
          emailSent: false,
        });
        return { success: true };
      } else {
        throw new Error(response.error || "Failed to reset password");
      }
    } catch (error) {
      if (isRateLimitError(error)) {
        setState({
          loading: false,
          error: error.message,
          success: false,
          isRateLimited: true,
          retryAfter: error.retryAfter,
          otpSent: true,
          emailSent: false,
        });
      } else {
        setState({
          loading: false,
          error:
            error instanceof Error ? error.message : "Failed to reset password",
          success: false,
          isRateLimited: false,
          otpSent: true,
          emailSent: false,
        });
      }
      return { success: false, error };
    }
  };

  /**
   * Request password reset email link
   */
  const requestEmailLink = async (email: string) => {
    if (!featureFlags.isEnabled("usePasswordResetV2")) {
      throw new Error("Password Reset V2 is not enabled");
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const response = await authClientV2.requestPasswordResetLink(email);

      if (response.success) {
        setState({
          loading: false,
          error: null,
          success: false,
          isRateLimited: false,
          otpSent: false,
          emailSent: true,
        });
        return { success: true };
      } else {
        throw new Error(response.error || "Failed to send reset link");
      }
    } catch (error) {
      if (isRateLimitError(error)) {
        setState({
          loading: false,
          error: error.message,
          success: false,
          isRateLimited: true,
          retryAfter: error.retryAfter,
          otpSent: false,
          emailSent: false,
        });
      } else {
        setState({
          loading: false,
          error:
            error instanceof Error
              ? error.message
              : "Failed to send reset link",
          success: false,
          isRateLimited: false,
          otpSent: false,
          emailSent: false,
        });
      }
      return { success: false, error };
    }
  };

  /**
   * Reset password using token from email link
   */
  const resetWithToken = async (token: string, newPassword: string) => {
    if (!featureFlags.isEnabled("usePasswordResetV2")) {
      throw new Error("Password Reset V2 is not enabled");
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const response = await authClientV2.resetPasswordWithToken(
        token,
        newPassword,
      );

      if (response.success) {
        setState({
          loading: false,
          error: null,
          success: true,
          isRateLimited: false,
          otpSent: false,
          emailSent: false,
        });
        return { success: true };
      } else {
        throw new Error(response.error || "Failed to reset password");
      }
    } catch (error) {
      if (isRateLimitError(error)) {
        setState({
          loading: false,
          error: error.message,
          success: false,
          isRateLimited: true,
          retryAfter: error.retryAfter,
          otpSent: false,
          emailSent: false,
        });
      } else {
        setState({
          loading: false,
          error:
            error instanceof Error ? error.message : "Failed to reset password",
          success: false,
          isRateLimited: false,
          otpSent: false,
          emailSent: false,
        });
      }
      return { success: false, error };
    }
  };

  /**
   * Clear error state
   */
  const clearError = () => {
    setState((prev) => ({ ...prev, error: null, isRateLimited: false }));
  };

  /**
   * Reset state
   */
  const reset = () => {
    setState({
      loading: false,
      error: null,
      success: false,
      isRateLimited: false,
      otpSent: false,
      emailSent: false,
    });
  };

  return {
    ...state,
    requestOTP,
    resetWithOTP,
    requestEmailLink,
    resetWithToken,
    clearError,
    reset,
  };
}
