"use client";

import {
  FacebookNegativeIcon,
  GoogleLoginIcon,
} from "@/components/icon";
import { Button } from "@/components/ui/button";
import {
  AuthProvider,
  signInWithPopup,
  UserCredential,
} from "firebase/auth";
import {
  auth,
  facebookProvider,
  googleProvider,
} from "../../../firebaseconfig";

interface SocialLoginButtonsProps {
  handleAuth: (userCredential: UserCredential) => Promise<void>;
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
}

export const SocialLoginButtons = ({
  handleAuth,
  isLoading,
  setIsLoading,
}: SocialLoginButtonsProps) => {
  const handleSocialAuth = async (
    provider: AuthProvider,
  ): Promise<void> => {
    setIsLoading(true);
    try {
      const result = await signInWithPopup(auth, provider);
      const token = await result.user.getIdToken();
      localStorage.setItem("token", token);
      await handleAuth(result);
    } catch (error) {
      console.error("Social auth error:", error);
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <Button
        onClick={() => handleSocialAuth(googleProvider)}
        variant="outline"
        className="w-full text-base"
        disabled={isLoading}
      >
        <GoogleLoginIcon />
        Đăng nhập bằng Google
      </Button>
      <Button
        onClick={() => handleSocialAuth(facebookProvider)}
        variant="outline"
        className="w-full text-base bg-facebook text-white hover:bg-[#1877F2d1] hover:text-white"
        style={{ backgroundColor: "#1877F2" }}
        disabled={isLoading}
      >
        <FacebookNegativeIcon />
        Đăng nhập bằng Facebook
      </Button>
    </div>
  );
};
