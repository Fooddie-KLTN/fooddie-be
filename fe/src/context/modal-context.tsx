// contexts/auth-modal-context.tsx
"use client";

import {
  FacebookNegativeIcon,
  GoogleLoginIcon,
} from "@/components/icon";
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
import { useMediaQuery } from "@/hooks/use-media-query";
import Link from "next/link";
import { createContext, useContext, useState } from "react";
import { useAuth } from "./auth-context";
import { auth, googleProvider, facebookProvider} from "../../firebaseconfig";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { authService } from "@/apis/auth";

type FormType = "login" | "register" | "activate";


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
  };
  const formDescriptions = {
    login: "Đăng nhập vào tài khoản của bạn",
    register: "Tạo tài khoản mới",
    activate: "Kích hoạt tài khoản của bạn",
  };
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
  
  const { openModal, closeModal } = useAuthModal();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // Hàm xử lý chung sau khi đăng nhập thành công
    const handleAuth = async (userCredential: any) => {
      try {
        // Lấy token từ Firebase
        const token = await userCredential.user.getIdToken();
        // Gọi API BE để xác nhận token và lấy thông tin người dùng
        const response = await authService.login(token);
        // Lưu thông tin user, token vào localStorage (có thể lưu ở state hoặc context tùy theo dự án)
        localStorage.setItem("user", JSON.stringify(response.user));
        localStorage.setItem("token", token);
        closeModal();
      } catch (error) {
        console.error("Authentication error:", error);
      }
    };
     // Đăng nhập bằng Email/Mật khẩu
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await handleAuth(userCredential);
    } catch (error: any) {
      console.error("Lỗi đăng nhập:", error.message);
    }
  };

  // Đăng nhập bằng Google
  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await handleAuth(result);
    } catch (error: any) {
      console.error("Lỗi đăng nhập Google:", error.message);
    }
  };

  // Đăng nhập bằng Facebook
  const handleFacebookLogin = async () => {
    try {
      const result = await signInWithPopup(auth, facebookProvider);
      await handleAuth(result);
    } catch (error: any) {
      console.error("Lỗi đăng nhập Facebook:", error.message);
    }
  };
  return (
    <form>
      <div className="grid gap-5">
        <div className="flex flex-col gap-4">
          <Button variant="outline" className="w-full text-base" onClick={handleGoogleLogin}>
            <GoogleLoginIcon />
            Đăng nhập bằng Google
          </Button>
          <Button
            onClick={handleFacebookLogin}
            variant="outline"
            className="w-full text-base bg-[#1877F2] text-white hover:bg-[#1877F2d1] hover:text-white"
          >
            <FacebookNegativeIcon />
            Đăng nhập bằng Facebook
          </Button>
        </div>
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
            />
          </div>
          <div className="grid gap-2">
            <div className="flex items-center">
              <Label htmlFor="password" className="text-lg">
                Mật khẩu
              </Label>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="Nhập mật khẩu"
              className="placeholder:text-base"
              required
              onChange={(e) => setPassword(e.target.value)}
            />
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center space-x-2">
                <Checkbox id="remember-login" />
                <label
                  htmlFor="remember-login"
                  className="text-md font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Ghi nhớ đăng nhập
                </label>
              </div>
              <Link
                href="#"
                className="ml-auto text-md text-primary underline-offset-4 hover:underline"
              >
                Quên mật khẩu ?
              </Link>
            </div>
          </div>
          <Button
            type="submit"
            onClick={handleEmailLogin}
            className="w-full text-lg border border-transparent hover:border-primary hover:text-primary"
          >
            Đăng nhập
          </Button>
        </div>
        <div className="text-center text-base text-primary">
          Bạn chưa có tài khoản ?{" "}
          <Button
            onClick={() => openModal("register")}
            variant="link"
            className="text-base hover:underline hover:underline-offset-2 font-semibold"
          >
            Đăng ký
          </Button>
        </div>
      </div>
    </form>
  );
};
const RegisterForm = () => {
  const { closeModal, openModal } = useAuthModal();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repassword, setRepassword] = useState("");

  
  // Hàm xử lý chung sau khi đăng ký/đăng nhập qua social
  const handleAuth = async (userCredential: any) => {
    if (repassword !== password) {
      console.error("Authentication error: Password not match");
      return;
    }
    try {
      const token = await userCredential.user.getIdToken();
      // Gọi API BE để xử lý đăng ký hoặc đăng nhập qua token Firebase
      const response = await authService.login(token);
      localStorage.setItem("user", JSON.stringify(response.user));
      localStorage.setItem("token", token);
      closeModal();
    } catch (error) {
      console.error("Authentication error:", error);
    }
  };

  // Đăng ký bằng Email/Mật khẩu
  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await handleAuth(userCredential);
    } catch (error: any) {
      console.error("Lỗi đăng ký:", error.message);
    }
  };

  // Đăng ký/Đăng nhập bằng Google
  const handleGoogleRegister = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await handleAuth(result);
    } catch (error: any) {
      console.error("Lỗi Google:", error.message);
    }
  };

  // Đăng ký/Đăng nhập bằng Facebook
  const handleFacebookRegister = async () => {
    try {
      const result = await signInWithPopup(auth, facebookProvider);
      await handleAuth(result);
    } catch (error: any) {
      console.error("Lỗi Facebook:", error.message);
    }
  };
    return (
    <form>
      <div className="grid gap-6">
        <div className="flex flex-col gap-4">
          <Button
          onClick={handleGoogleRegister}
          variant="outline" className="w-full text-base">
            <GoogleLoginIcon />
            Đăng nhập bằng Google
          </Button>
          <Button
          onClick={handleFacebookRegister}
            variant="outline"
            className="w-full text-base bg-[#1877F2] text-white hover:bg-[#1877F2d1] hover:text-white"
          >
            <FacebookNegativeIcon />
            Đăng nhập bằng Facebook
          </Button>
        </div>
        <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
          <span className="relative z-10 bg-background px-2 text-muted-foreground text-md">
            Hoặc đăng nhập
          </span>
        </div>
        <div className="grid gap-5">
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
            />
          </div>
          <div className="grid gap-2">
            <div className="flex items-center">
              <Label htmlFor="password" className="text-lg">
                Mật khẩu
              </Label>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="Nhập mật khẩu"
              className="placeholder:text-base"
              required
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <div className="flex items-center">
              <Label htmlFor="repassword" className="text-lg">
                Nhập lại mật khẩu
              </Label>
            </div>
            <Input
              id="repassword"
              type="password"
              placeholder="Nhập mật khẩu"
              className="placeholder:text-base input:text-base"
              required
              onChange={(e) => setRepassword(e.target.value)}
            />
          </div>
          <Button
            onClick={handleEmailRegister}
            type="submit"
            className="w-full text-lg border border-transparent hover:border-primary hover:text-primary"
          >
            Đăng ký
          </Button>
        </div>
        <div className="text-center text-base text-primary">
          Bạn đã có tài khoản ?{" "}
          <Button
            onClick={() => openModal("login")}
            variant="link"
            className="text-base hover:underline hover:underline-offset-2 font-semibold"
          >
            Đăng nhập
          </Button>
        </div>
      </div>
    </form>
  );
};
const ActivateForm = () => (
  <form>
    <div className="grid gap-5">
      <div className="grid gap-2">
        <Input
          id="code"
          type="text"
          placeholder="Nhập mã kích hoạt"
          className="placeholder:text-base"
          required
        />
      </div>
      <Button
        type="submit"
        className="w-full text-lg border border-transparent hover:border-primary hover:text-primary"
      >
        Kích hoạt
      </Button>
    </div>
  </form>
);
