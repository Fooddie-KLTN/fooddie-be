"use client";
import { authService } from "@/api/auth"; // Keep authService for forgetPassword
import { Button } from "@/components/ui/button";
// Removed Checkbox import
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SocialLoginButtons } from "@/components/ui/social-login";
import { useMediaQuery } from "@/hooks/use-media-query";
// Removed Firebase imports
import Link from "next/link";
import React, {
  createContext,
  useContext,
  useEffect, // Keep useEffect if needed for other logic
  useState,
  useRef, // Added useRef
} from "react";
// Removed Firebase auth import
import { useAuth } from "./auth-context"; // Import useAuth
import { Eye, EyeOff } from "lucide-react";

type FormType = "login" | "register" | "activate" | "forgotPassword";

type AuthModalContextType = {
  openModal: (form: FormType) => void;
  closeModal: () => void;
};

const AuthModalContext = createContext<AuthModalContextType | null>(
  null,
);

export function AuthModalProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [formType, setFormType] = useState<FormType>("login");
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const { user, loading: authLoading } = useAuth(); // Get user state from AuthContext
  const drawerContentRef = useRef<HTMLDivElement>(null); // Added ref for DrawerContent

  const openModal = (form: FormType) => {
    setFormType(form);
    setIsOpen(true);
  };

  const closeModal = () => setIsOpen(false);
  const ModalContainer = isDesktop ? Dialog : Drawer;
  const ModalContent = isDesktop ? DialogContent : DrawerContent;
  const ModalHeader = isDesktop ? DialogTitle : DrawerTitle;
  const formTitles = {
    login: "Đăng nhập",
    register: "Đăng ký",
    activate: "Kích hoạt tài khoản",
    forgotPassword: "Quên mật khẩu",
  };
  const formDescriptions = {
    login: "Đăng nhập vào tài khoản của bạn",
    register: "Tạo tài khoản mới",
    activate: "Kích hoạt tài khoản của bạn",
    forgotPassword: "Khôi phục mật khẩu của bạn",
  };

  // Close modal when user is authenticated and auth is not loading
  useEffect(() => {
    if (user && !authLoading) {
      closeModal();
    }
  }, [user, authLoading]); // Depend on user and authLoading state

  // Handle keyboard visibility on mobile
  useEffect(() => {
    if (isDesktop || !isOpen) return; // Only needed for mobile drawer when open

    const handleResize = () => {
      if (drawerContentRef.current) {
        drawerContentRef.current.style.setProperty('bottom', `env(safe-area-inset-bottom)`);
      }
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", handleResize);
      handleResize();
    }

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", handleResize);
      }
    };
  }, [isDesktop, isOpen]);

  return (
    <AuthModalContext.Provider value={{ openModal, closeModal }}>
      {children}
      <ModalContainer open={isOpen} onOpenChange={setIsOpen}>
        <ModalContent
          ref={!isDesktop ? drawerContentRef : undefined} // Only apply ref to DrawerContent
          className={`px-6 py-8 bg-background ${!isDesktop ? '!min-h-[80vh]' : ''}`}
          style={{
            minHeight: !isDesktop ? '80vh' : 'auto',
          }}
          aria-describedby={"auth-modal"}
        >
          {isDesktop ? (
            <>
              <ModalHeader className="text-center text-exl">
                {formTitles[formType]}
              </ModalHeader>
              <DialogDescription className="sr-only">
                {formDescriptions[formType]}
              </DialogDescription>
            </>
          ) : (
            <DrawerHeader>
              <ModalHeader className="text-center text-exl">
                {formTitles[formType]}
              </ModalHeader>
            </DrawerHeader>
          )}
          {formType === "login" && <LoginForm />}
          {formType === "register" && <RegisterForm />}
          {formType === "forgotPassword" && <ForgetPasswordForm />}
        </ModalContent>
      </ModalContainer>
    </AuthModalContext.Provider>
  );
}

export const useAuthModal = () => {
  const context = useContext(AuthModalContext);
  if (!context) {
    throw new Error(
      "useAuthModal must be used within AuthModalProvider",
    );
  }
  return context;
};

const LoginForm = () => {
  const { openModal } = useAuthModal();
  const { handleEmailLogin, error: authError, loading: authLoading } = useAuth(); // Use context methods and state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null); // Local error for immediate feedback
  const [isLoading, setIsLoading] = useState(false); // Local loading state for the form submit
  const [isPasswordVisible, setIsPasswordVisible] = useState(false); // State for password visibility
  const passwordType = isPasswordVisible ? 'text' : 'password';
  const Icon = isPasswordVisible ? EyeOff : Eye;
  const buttonAriaLabel = isPasswordVisible ? 'Ẩn mật khẩu' : 'Hiển thị mật khẩu';

  // Update local error message when authError changes
  useEffect(() => {
    setErrorMessage(authError);
  }, [authError]);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null); // Clear previous errors
    try {
      await handleEmailLogin(email, password);
      // On success, the AuthProvider handles state update and reload/redirect.
      // The modal should close automatically via the useEffect in AuthModalProvider.
    } catch (error: unknown) {
      // handleEmailLogin already sets the error in AuthContext,
      // which updates the local errorMessage via useEffect.
      // If you need more specific messages here, you can set them.
      if (error instanceof Error) {
        setErrorMessage(error.message || "Đăng nhập thất bại. Vui lòng thử lại.");
      } else {
        setErrorMessage("Đã xảy ra lỗi không xác định.");
      }
      setIsLoading(false); // Ensure loading is stopped on error
    }
    // No need to manually set loading to false on success, as the component/modal will likely unmount/close.
    // If it doesn't unmount immediately, set it here:
    // setIsLoading(false);
  };

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(prevState => !prevState);
  };

  const combinedLoading = isLoading || authLoading; // Consider both form and context loading

  return (
    <form
      onSubmit={handleFormSubmit}
      onKeyDown={(e) => {
        if (e.key === "Enter" && !combinedLoading) {
          e.preventDefault();
          handleFormSubmit(e);
        }
      }}
    >
      <div className="grid gap-5">
        {/* Pass relevant props to SocialLoginButtons */}
        <SocialLoginButtons
          isLoading={combinedLoading} // Use combined loading state
          setIsLoading={setIsLoading} // Allow social buttons to set local loading if needed
        />
        <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
          <span className="relative z-10 bg-background px-2 text-muted-foreground text-md">
            Hoặc đăng nhập
          </span>
        </div>
        <div className="grid gap-6">
          <div className="grid gap-2">
            <Label htmlFor="email-login" className="text-lg"> {/* Changed ID */}
              Email
            </Label>
            <Input
              id="email-login" // Changed ID
              type="email"
              placeholder="Nhập Email"
              className="placeholder:text-lg text-lg"
              required
              value={email} // Controlled component
              onChange={(e) => setEmail(e.target.value)}
              disabled={combinedLoading}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password-login" className="text-lg"> {/* Changed ID */}
              Mật khẩu
            </Label>
            <div className="relative w-full">
              <Input
                id="password-login" // Changed ID
                type={passwordType}
                placeholder="Nhập mật khẩu"
                className="placeholder:text-lg text-lg"
                required
                value={password} // Controlled component
                onChange={(e) => setPassword(e.target.value)}
                disabled={combinedLoading}
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                // Định vị tuyệt đối icon bên trong div tương đối
                className="absolute inset-y-0 right-1 flex items-center pr-3 text-gray-500 hover:text-gray-700 focus:outline-none disabled:opacity-50"
                aria-label={buttonAriaLabel}
                disabled={combinedLoading} // Có thể disable nút toggle cùng lúc với input
              >
                <Icon className="h-5 w-5" />
              </button>
            </div>
            {/* Display error message */}
            {errorMessage && (
              <p className="text-center text-sm text-red-500 mt-2">
                {errorMessage}
              </p>
            )}
            <div className="flex items-center justify-end mt-2"> {/* Removed remember me */}
              <Link
                href="#"
                className="ml-auto text-md text-primary underline-offset-4 hover:underline"
                onClick={(e) => {
                  e.preventDefault(); // Prevent default link behavior
                  if (!combinedLoading) openModal("forgotPassword");
                }}
                aria-disabled={combinedLoading} // Indicate disabled state for accessibility
                tabIndex={combinedLoading ? -1 : 0} // Remove from tab order when disabled
              >
                Quên mật khẩu ?
              </Link>
            </div>
          </div>
          <Button
            type="submit"
            className="w-full text-lg border border-transparent hover:border-primary hover:text-primary"
            disabled={combinedLoading}
          >
            {combinedLoading ? "Đang xử lý..." : "Đăng nhập"}
          </Button>
        </div>
        <div className="text-center text-base text-primary">
          Bạn chưa có tài khoản ?{" "}
          <Button
            onClick={() => openModal("register")}
            variant="link"
            className="text-base hover:underline hover:underline-offset-2 font-semibold"
            disabled={combinedLoading}
            type="button"
          >
            Đăng ký
          </Button>
        </div>
      </div>
    </form>
  );
};

// Form đăng ký
const RegisterForm = () => {
  const { openModal } = useAuthModal();
  const { handleRegister, error: authError, loading: authLoading } = useAuth(); // Use context register function
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false); // Local loading state
  const [errorMessage, setErrorMessage] = useState<string | null>(null); // Local error state
  const [successMessage, setSuccessMessage] = useState<string | null>(null); // Success message state

  // Update local error message when authError changes (relevant if handleRegister sets context error)
  useEffect(() => {
    // Only set error if it's relevant to registration, otherwise authError might be from login attempts
    // We rely more on the catch block error here.
    // setErrorMessage(authError);
  }, [authError]);


  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null); // Clear previous messages
    setSuccessMessage(null);

    if (password !== repeatPassword) {
      setErrorMessage("Mật khẩu không khớp");
      return;
    }
    if (password.length < 6) { // Example validation
      setErrorMessage("Mật khẩu phải có ít nhất 6 ký tự.");
      return;
    }

    setIsLoading(true);

    try {
      await handleRegister({ email, password, name });
      // Registration successful
      setSuccessMessage("Đăng ký thành công! Bạn có thể đăng nhập ngay bây giờ.");
      // Optionally clear form or switch to login after a delay
      setTimeout(() => {
        openModal("login");
      }, 2000); // Switch to login after 2 seconds
    } catch (error: unknown) {
      if (error instanceof Error) {
        setErrorMessage(error.message || "Đăng ký thất bại. Vui lòng thử lại.");
      } else {
        setErrorMessage("Đã xảy ra lỗi không xác định khi đăng ký.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const combinedLoading = isLoading || authLoading;

  return (
    <form onSubmit={handleFormSubmit}>
      <div className="grid gap-6">
        {/* Pass relevant props to SocialLoginButtons */}
        <SocialLoginButtons
          isLoading={combinedLoading}
          setIsLoading={setIsLoading} // Allow social buttons to set local loading if needed
        />
        <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
          <span className="relative z-10 bg-background px-2 text-muted-foreground text-md">
            Hoặc đăng ký
          </span>
        </div>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="fullname-register" className="text-lg"> {/* Changed ID */}
              Họ tên
            </Label>
            <Input
              id="fullname-register" // Changed ID
              type="text"
              placeholder="Nhập họ và tên"
              className="placeholder:text-lg text-lg"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={combinedLoading}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email-register" className="text-lg"> {/* Changed ID */}
              Email
            </Label>
            <Input
              id="email-register" // Changed ID
              type="email"
              placeholder="Nhập Email"
              className="placeholder:text-lg text-lg"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={combinedLoading}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password-register" className="text-lg"> {/* Changed ID */}
              Mật khẩu
            </Label>
            <Input
              id="password-register" // Changed ID
              type="password"
              placeholder="Nhập mật khẩu (ít nhất 6 ký tự)"
              className="placeholder:text-lg text-lg"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={combinedLoading}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="repassword-register" className="text-lg"> {/* Changed ID */}
              Nhập lại mật khẩu
            </Label>
            <Input
              id="repassword-register" // Changed ID
              type="password"
              placeholder="Nhập lại mật khẩu"
              className="placeholder:text-lg text-lg"
              required
              value={repeatPassword}
              onChange={(e) => setRepeatPassword(e.target.value)}
              disabled={combinedLoading}
            />
          </div>
          {/* Display messages */}
          {errorMessage && (
            <p className="text-center text-sm text-red-500 mt-2">
              {errorMessage}
            </p>
          )}
          {successMessage && (
            <p className="text-center text-sm text-green-500 mt-2">
              {successMessage}
            </p>
          )}
          <Button
            type="submit"
            className="w-full mt-4 text-lg border border-transparent hover:border-primary hover:text-primary"
            disabled={combinedLoading || !!successMessage} // Disable after success message
          >
            {combinedLoading ? "Đang xử lý..." : "Đăng ký"}
          </Button>
        </div>
        <div className="text-center text-base text-primary">
          Bạn đã có tài khoản ?{" "}
          <Button
            onClick={() => openModal("login")}
            variant="link"
            className="text-base hover:underline hover:underline-offset-2 font-semibold"
            disabled={combinedLoading}
            type="button"
          >
            Đăng nhập
          </Button>
        </div>
      </div>
    </form>
  );
};

// --- ForgetPasswordForm and ActivateForm remain largely unchanged ---
// --- but ensure they use appropriate loading states and disable buttons ---

const ForgetPasswordForm = () => {
  const { openModal } = useAuthModal();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false); // Track success state

  const handleForgetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");
    setIsSuccess(false);
    try {
      // Assuming authService.forgetPassword returns a simple success/message object
      // Adjust based on actual return type if needed
      await authService.forgetPassword(email);
      setMessage(
        "Đã gửi yêu cầu khôi phục mật khẩu. Vui lòng kiểm tra email của bạn (kể cả thư mục spam).",
      );
      setIsSuccess(true); // Mark as success
    } catch (error: unknown) {
      if (error instanceof Error) {
        // Provide more specific error messages if possible based on backend response
        if (error.message.toLowerCase().includes('user not found')) {
          setMessage("Email không tồn tại trong hệ thống.");
        } else {
          setMessage(error.message || "Có lỗi xảy ra khi gửi yêu cầu. Vui lòng thử lại.");
        }
      } else {
        setMessage("Có lỗi không xác định xảy ra. Vui lòng thử lại.");
      }
      setIsSuccess(false); // Mark as not success
      console.error("Forget password error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid gap-5">
      <p className="text-center text-md text-muted-foreground">
        Nhập email của bạn để nhận liên kết khôi phục mật khẩu.
      </p>
      <form onSubmit={handleForgetPassword}>
        <div className="grid gap-2">
          <Label htmlFor="email-forget" className="text-lg">
            Email
          </Label>
          <Input
            id="email-forget"
            type="email"
            placeholder="Nhập Email"
            className="placeholder:text-lg text-lg" // Added text-base
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading || isSuccess} // Disable after success
          />
        </div>
        {/* Hiển thị thông báo với màu sắc khác nhau */}
        {message && (
          <p
            className={`text-center text-sm mt-2 ${isSuccess ? "text-green-600" : "text-red-600" // Adjusted colors
              }`}
          >
            {message}
          </p>
        )}
        <Button
          type="submit"
          className="w-full mt-4 text-lg border border-transparent hover:border-primary hover:text-primary"
          disabled={isLoading || isSuccess} // Disable after success
        >
          {isLoading ? "Đang xử lý..." : "Gửi yêu cầu"}
        </Button>
      </form>
      <div className="text-center text-base text-primary mt-4">
        Quay lại{" "}
        <Button
          onClick={() => openModal("login")}
          variant="link"
          className="text-base hover:underline hover:underline-offset-2 font-semibold"
          disabled={isLoading} // Only disable while loading, allow going back after success/error
          type="button" // Explicitly set type
        >
          Đăng nhập
        </Button>
      </div>
    </div>
  );
};

