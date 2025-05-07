"use client";

import React, { useState } from "react";
// Removed: import { GoogleLogin, CredentialResponse } from "@react-oauth/google";
// Keep Facebook imports if you intend to use react-facebook-login for it
// import FacebookLogin, { ReactFacebookLoginInfo } from 'react-facebook-login/dist/facebook-login-render-props';
import { GoogleLoginIcon, } from "@/components/icon"; // Assuming Facebook icon is needed
import { Button } from "@/components/ui/button";

// Define the props for the component
interface SocialLoginButtonsProps {
  // We don't need handleGoogleLogin here anymore, the callback page handles it.
  // Keep handleFacebookLogin if using the library for FB.
  // handleFacebookLogin: (accessToken: string) => Promise<void>;
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>; // Keep if needed for Facebook or general form state
}

// Helper function to generate a random string for state and nonce
const generateRandomString = (length: number): string => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

export const SocialLoginButtons: React.FC<SocialLoginButtonsProps> = ({
  isLoading,
 // setIsLoading, // Keep if used by Facebook login or parent form
  // handleFacebookLogin, // Keep if using FB library
}) => {
  const [errorMessage, setErrorMessage] = useState<string>("");

  // --- Environment Variable Check ---
  const googleClientId = process.env.NEXT_PUBLIC_CLIENT_ID;
  //const facebookAppId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID; // Keep if using FB
  const googleRedirectUri = process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI;

  // --- Manual Google Sign-In ---
  const handleManualGoogleSignIn = (): void => {
    // Use early returns for checks
    if (!googleClientId) {
        setErrorMessage("Lỗi cấu hình: Google Client ID bị thiếu.");
        console.error("Google Client ID (NEXT_PUBLIC_CLIENT_ID) is not configured.");
        return;
    }
    if (!googleRedirectUri) {
        setErrorMessage("Lỗi cấu hình: Google Redirect URI bị thiếu.");
        console.error("Google Redirect URI (NEXT_PUBLIC_GOOGLE_REDIRECT_URI) is not configured.");
        return;
    }

    setErrorMessage(""); // Clear previous errors
    // setIsLoading(true); // Optional: Indicate action started, though redirect is fast

    // 1. Generate state and nonce
    const state = generateRandomString(32); // Increased length for security
    const nonce = generateRandomString(32); // Increased length for security

    // 2. Store state and nonce in localStorage to verify after redirect
    try {
      localStorage.setItem('oauth_state', state); // <-- Should be set here
      localStorage.setItem('oauth_nonce', nonce);
    } catch (error) {
      console.error("Error saving state/nonce to local storage:", error);
      setErrorMessage("Không thể khởi tạo đăng nhập Google. Vui lòng kiểm tra cài đặt trình duyệt.");
      // setIsLoading(false); // Reset loading if needed
      return;
    }

    // 3. Construct the Google OAuth URL
    const oauth2Endpoint = 'https://accounts.google.com/o/oauth2/v2/auth';
    const params = new URLSearchParams({
      client_id: googleClientId,
      redirect_uri: googleRedirectUri,
      response_type: 'token id_token', // Request both access token and ID token
      scope: 'openid email profile', // Standard scopes for login info
      state: state,
      nonce: nonce, // Include nonce for ID token replay protection
      // prompt: 'select_account', // Optional: Always ask user to select account
    });

    const googleAuthUrl = `${oauth2Endpoint}?${params.toString()}`;

    // 4. Redirect the user's browser to Google's authorization page
    window.location.assign(googleAuthUrl); // <-- Redirect happens after setting
  };


  // --- Facebook Login Handlers (Example if using react-facebook-login) ---
  // const handleFacebookResponse = async (response: ReactFacebookLoginInfo): Promise<void> => {
  //   if (!facebookAppId) return; // Should not happen if button is rendered
  //   if (response.accessToken) {
  //     setErrorMessage("");
  //     setIsLoading(true);
  //     try {
  //       // await handleFacebookLogin(response.accessToken); // Call context function
  //       // Success handled by AuthContext
  //     } catch (error: unknown) {
  //       setErrorMessage(error instanceof Error ? error.message : "Đã xảy ra lỗi không xác định khi đăng nhập bằng Facebook.");
  //       console.error("Backend Facebook login error:", error);
  //       setIsLoading(false);
  //     }
  //   } else {
  //     setErrorMessage("Đăng nhập Facebook thất bại hoặc đã bị hủy bỏ.");
  //     console.warn("Facebook login failed or was cancelled:", response.status);
  //     setIsLoading(false); // Ensure loading is reset if FB login fails/cancels
  //   }
  // };

  // --- Render Logic ---
  const isGoogleConfigured = googleClientId && googleRedirectUri;
  // const isFacebookConfigured = !!facebookAppId; // Check if FB App ID exists

  return (
    <div className="flex w-full flex-col items-center gap-4">
      {/* Google Login Button (Manual Redirect) */}
      {isGoogleConfigured ? (
        <Button
          type="button"
          onClick={handleManualGoogleSignIn}
          variant="outline"
          className="flex w-full max-w-[300px] items-center justify-center gap-2 text-base"
          disabled={isLoading} // Disable if another process (like FB login) is loading
          aria-label="Đăng nhập bằng Google"
        >
          <GoogleLoginIcon className="h-5 w-5" aria-hidden="true" />
          <span>Đăng nhập bằng Google</span>
        </Button>
      ) : (
        <p className="text-sm text-red-500">Đăng nhập Google chưa được cấu hình.</p>
      )}

      {/* Facebook Login Button (Example using react-facebook-login) */}
      {/* {isFacebookConfigured ? (
        <FacebookLogin
          appId={facebookAppId}
          autoLoad={false}
          fields="name,email,picture" // Adjust fields as needed by your backend
          callback={handleFacebookResponse}
          render={renderProps => (
            <Button
              type="button"
              onClick={renderProps.onClick}
              variant="outline"
              className="flex w-full max-w-[300px] items-center justify-center gap-2 border-[#1877F2] bg-[#1877F2] text-base text-white hover:bg-[#1877F2d1] hover:text-white"
              disabled={isLoading || renderProps.isProcessing}
              aria-label="Đăng nhập bằng Facebook"
            >
              <FacebookNegativeIcon className="h-5 w-5" aria-hidden="true" />
              <span>
                {isLoading || renderProps.isProcessing ? "Đang xử lý..." : "Đăng nhập bằng Facebook"}
              </span>
            </Button>
          )}
        />
       ) : (
         <p className="text-sm text-red-500">Đăng nhập Facebook chưa được cấu hình.</p>
       )} */}

      {/* Display error messages */}
      {errorMessage && (
        <p className="mt-2 text-center text-sm text-red-500">{errorMessage}</p>
      )}
    </div>
  );
};