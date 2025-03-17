"use client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from "firebase/auth";
import Link from "next/link";
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { auth } from "../../firebaseconfig";
import { useAuth } from "./auth-context";
import { authService } from "@/api/auth";
import { FirebaseError } from "firebase/app";

type FormType = "login" | "register" | "activate" | "forgotPassword";

type AuthModalContextType = {
  openModal: (form: FormType) => void;
  closeModal: () => void;
};

/**
 * @description: Tạo ModalContext để wrap xung quanh children, áp dụng mở modal login ở bất kỳ component nào
 * @param {React.ReactNode} children
 * **/

const AuthModalContext = createContext<AuthModalContextType | null>(
  null,
);

/**
 * @description: Xử lý logic mở modal login và register
 * @param {React.ReactNode} children
 * **/

export function AuthModalProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [formType, setFormType] = useState<FormType>("login");
  const isDesktop = useMediaQuery("(min-width: 768px)");

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
    forgotPassword: "Quên mật khẩu"
  };
  const formDescriptions = {
    login: "Đăng nhập vào tài khoản của bạn",
    register: "Tạo tài khoản mới",
    activate: "Kích hoạt tài khoản của bạn",
    forgotPassword: "Khổi phục mật khẩu của bạn"
  };

  // Close modal when user is authenticated
  useEffect(() => {
    onAuthStateChanged(auth, () => closeModal());
  }, []);

  return (
    <AuthModalContext.Provider value={{ openModal, closeModal }}>
      {children}
      <ModalContainer open={isOpen} onOpenChange={setIsOpen}>
        <ModalContent
          className="px-6 py-8 bg-background"
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
          {formType === "activate" && <ActivateForm />}
          {formType === "forgotPassword" && <ForgetPasswordForm />}
        </ModalContent>
      </ModalContainer>
    </AuthModalContext.Provider>
  );
}

// Custom hook để sử dụng AuthModalContext
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
  const { handleAuth } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  // Thêm state để lưu thông báo lỗi
  const [errorMessage, setErrorMessage] = useState("");

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");
    try {
      await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const token = await userCredential.user.getIdToken();

      await authService.login(token);
      await handleAuth(userCredential);
      
    } catch (error: unknown) {
      if (error instanceof FirebaseError) {
        switch (error.code) {
          case "auth/user-not-found":
            setErrorMessage("Email không tồn tại");
            break;
          case "auth/wrong-password":
            setErrorMessage("Mật khẩu không đúng");
            break;
          case "auth/invalid-email":
            setErrorMessage("Email không hợp lệ");
            break;
          default:
            setErrorMessage("Đã xảy ra lỗi. Vui lòng thử lại.");
        }
      } else {
        setErrorMessage("Đã xảy ra lỗi. Vui lòng thử lại.");
      }
      console.error("Login error:", error);
      setIsLoading(false);
    }
  };

  return (
    <form>
      <div className="grid gap-5">
        <SocialLoginButtons
          handleAuth={handleAuth}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
        />
        <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
          <span className="relative z-10 bg-background px-2 text-muted-foreground text-md">
            Hoặc đăng nhập
          </span>
        </div>
        <div className="grid gap-6">
          <div className="grid gap-2">
            <Label htmlFor="email-register" className="text-lg">
              Email
            </Label>
            <Input
              id="email-register"
              type="email"
              placeholder="Nhập Email"
              className="placeholder:text-base"
              required
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password" className="text-lg">
              Mật khẩu
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="Nhập mật khẩu"
              className="placeholder:text-base"
              required
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
            {/* Hiển thị thông báo lỗi */}
            {errorMessage && (
              <p className="text-center text-sm text-red-500 mt-2">{errorMessage}</p>
            )}
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember-login"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked === true)}
                  disabled={isLoading}
                />
                <label
                  htmlFor="remember-login"
                  className="text-md font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Ghi nhớ đăng nhập
                </label>
              </div>
              <Link
                href="#"
                className="ml-auto text-md text-primary underline-offset-4 hover:underline"
                onClick={() => openModal("forgotPassword")}
              >
                Quên mật khẩu ?
              </Link>
            </div>
          </div>
          <Button
            type="submit"
            onClick={handleEmailLogin}
            className="w-full text-lg border border-transparent hover:border-primary hover:text-primary"
            disabled={isLoading}
          >
            {isLoading ? "Đang xử lý..." : "Đăng nhập"}
          </Button>
        </div>
        <div className="text-center text-base text-primary">
          Bạn chưa có tài khoản ?{" "}
          <Button
            onClick={() => openModal("register")}
            variant="link"
            className="text-base hover:underline hover:underline-offset-2 font-semibold"
            disabled={isLoading}
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
  const { handleAuth } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  // Thêm state để lưu thông báo lỗi
  const [errorMessage, setErrorMessage] = useState("");

  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== repeatPassword) {
      setErrorMessage("Mật khẩu không khớp");
      return;
    }
    setIsLoading(true);
    setErrorMessage("");
    try {
      const result = await authService.register({ email, password, name });
      if ((result as { message: string }).message === "User registered successfully") {
        openModal("login"); // Chuyển sang form đăng nhập sau khi đăng ký thành công
      } else {
        setErrorMessage((result as { message: string }).message || "Đăng ký thất bại");
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        setErrorMessage(error.message || "Đăng ký thất bại");
      }
      else
      setErrorMessage( "Đã xảy ra lỗi. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <form>
      <div className="grid gap-6">
        <SocialLoginButtons
          handleAuth={handleAuth}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
        />
        <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
          <span className="relative z-10 bg-background px-2 text-muted-foreground text-md">
            Hoặc đăng ký
          </span>
        </div>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="fullname" className="text-lg">
              Họ tên
            </Label>
            <Input
              id="fullname"
              type="text"
              placeholder="Nhập họ và tên"
              className="placeholder:text-base"
              required
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email-login" className="text-lg">
              Email
            </Label>
            <Input
              id="email-login"
              type="email"
              placeholder="Nhập Email"
              className="placeholder:text-base"
              required
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password" className="text-lg">
              Mật khẩu
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="Nhập mật khẩu"
              className="placeholder:text-base"
              required
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="repassword" className="text-lg">
              Nhập lại mật khẩu
            </Label>
            <Input
              id="repassword"
              type="password"
              placeholder="Nhập mật khẩu"
              className="placeholder:text-base input:text-base"
              required
              onChange={(e) => setRepeatPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>
          {/* Hiển thị thông báo lỗi */}
          {errorMessage && (
            <p className="text-center text-sm text-red-800 mt-2">{errorMessage}</p>
          )}
          <Button
            onClick={handleEmailRegister}
            type="submit"
            className="w-full mt-4 text-lg border border-transparent hover:border-primary hover:text-primary"
            disabled={isLoading}
          >
            {isLoading ? "Đang xử lý..." : "Đăng ký"}
          </Button>
        </div>
        <div className="text-center text-base text-primary">
          Bạn đã có tài khoản ?{" "}
          <Button
            onClick={() => openModal("login")}
            variant="link"
            className="text-base hover:underline hover:underline-offset-2 font-semibold"
            disabled={isLoading}
          >
            Đăng nhập
          </Button>
        </div>
      </div>
    </form>
  );
};
const ForgetPasswordForm = () => {
  const { openModal } = useAuthModal();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleForgetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");
    try {
      const result = await authService.forgetPassword(email) as { success: boolean, error?: string };
      if (result.success) {
        setMessage("Đã gửi yêu cầu khôi phục mật khẩu. Vui lòng kiểm tra email của bạn.");
      } else {
        if (result.error === "user-not-found") {
          setMessage("Email không tồn tại");
        } else {
          setMessage(result.error || "Có lỗi xảy ra. Vui lòng thử lại.");
        }
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        setMessage(error.message);
      }
      else
      setMessage("Có lỗi xảy ra. Vui lòng thử lại.");
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
            className="placeholder:text-base"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
          />
        </div>
        {/* Hiển thị thông báo với màu sắc khác nhau */}
        {message && (
          <p
            className={`text-center text-sm mt-2 ${message.includes("Đã gửi") ? "text-green-500" : "text-red-500"
              }`}
          >
            {message}
          </p>
        )}
        <Button
          type="submit"
          className="w-full mt-4 text-lg border border-transparent hover:border-primary hover:text-primary"
          disabled={isLoading}
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
          disabled={isLoading}
        >
          Đăng nhập
        </Button>
      </div>
    </div>
  );
};
const ActivateForm = () => {
  const [isLoading, setIsLoading] = useState(false);

  const handleActivate = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Implement activation logic here
    setIsLoading(false);
  };

  return (
    <form onSubmit={handleActivate}>
      <div className="grid gap-5">
        <div className="grid gap-2">
          <Input
            id="code"
            type="text"
            placeholder="Nhập mã kích hoạt"
            className="placeholder:text-base"
            required
            disabled={isLoading}
          />
        </div>
        <Button
          type="submit"
          className="w-full text-lg border border-transparent hover:border-primary hover:text-primary"
          disabled={isLoading}
        >
          {isLoading ? "Đang xử lý..." : "Kích hoạt"}
        </Button>
      </div>
    </form>
  );
};
