"use client";
import React, { useState } from "react";
import { initializeApp } from "firebase/app";
import { authService } from "@/apis/auth";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, FacebookAuthProvider } from "firebase/auth";
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_WEB_API_KEY,              // API key của dự án Firebase
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,      // Tên miền xác thực (vd: your-app.firebaseapp.com)
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,        // ID dự án
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID, // ID gửi thông báo
};


// Khởi tạo Firebase App và Auth
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
const facebookProvider = new FacebookAuthProvider();

export default function TestModalPage() {
  // State quản lý hiển thị cho 2 modal
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  return (
    <div className="p-5">
      <h1 className="text-2xl font-bold mb-4">Trang Test Modal</h1>
      <button
        onClick={() => setShowLoginModal(true)}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
      >
        Mở Modal Đăng nhập
      </button>
      <button
        onClick={() => setShowRegisterModal(true)}
        className="bg-green-500 text-white px-4 py-2 rounded ml-4 hover:bg-green-600 transition"
      >
        Mở Modal Đăng ký
      </button>

      {/* Modal Đăng nhập */}
      {showLoginModal && (
        <ModalWrapper onClose={() => setShowLoginModal(false)}>
          <LoginModalContent onClose={() => setShowLoginModal(false)} />
        </ModalWrapper>
      )}

      {/* Modal Đăng ký */}
      {showRegisterModal && (
        <ModalWrapper onClose={() => setShowRegisterModal(false)}>
          <RegisterModalContent onClose={() => setShowRegisterModal(false)} />
        </ModalWrapper>
      )}
    </div>
  );
}

/**
 * ModalWrapper: thành phần bọc ngoài nội dung Modal.
 */
function ModalWrapper({ children, onClose }) {
  return (
    <div className="fixed top-0 left-0 w-screen h-screen bg-black/50 flex items-center justify-center z-[9999]">
      <div className="bg-white rounded p-5 min-w-[300px] relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-xl bg-transparent border-0"
        >
          ✕
        </button>
        {children}
      </div>
    </div>
  );
}

/**
 * Nội dung modal Đăng nhập
 */
function LoginModalContent({ onClose }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
// In LoginModalContent/RegisterModalContent:
const handleAuth = async (userCredential) => {
  try {
    // Get Firebase token
    const token = await userCredential.user.getIdToken();
    // Send to backend
    const response = await authService.login(token);
    
    // Store user data
    localStorage.setItem('user', JSON.stringify(response.user));
    localStorage.setItem('token', token);
    
    onClose();
  } catch (error) {
    console.error('Authentication error:', error);
  }
}
  // Hàm đăng nhập bằng email/mật khẩu
  const handleEmailLogin = async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await handleAuth(userCredential);
      console.log("Đăng nhập thành công:", userCredential.user);
      onClose(); // Đóng modal sau khi đăng nhập thành công
    } catch (error) {
      console.error("Lỗi đăng nhập:", error.message);
    }
  };

  // Hàm đăng nhập bằng Google
  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      console.log("Đăng nhập Google:", result.user);
      await handleAuth(result);
      onClose();
    } catch (error) {
      console.error("Lỗi đăng nhập Google:", error.message);
    }
  };

  // Hàm đăng nhập bằng Facebook
  const handleFacebookLogin = async () => {
    try {
      const result = await signInWithPopup(auth, facebookProvider);
      console.log("Đăng nhập Facebook:", result.user);
      await handleAuth(result);
      onClose();
    } catch (error) {
      console.error("Lỗi đăng nhập Facebook:", error.message);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">Đăng nhập</h2>
      <div className="mb-4">
        <button
          onClick={handleGoogleLogin}
          className="mr-2 mb-2 px-3 py-1.5 bg-red-500 text-white rounded hover:bg-red-600 transition"
        >
          Đăng nhập bằng Google
        </button>
        <button
          onClick={handleFacebookLogin}
          className="mr-2 mb-2 px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          Đăng nhập bằng Facebook
        </button>
      </div>
      <div className="flex flex-col gap-2">
        <input
          type="email"
          placeholder="Nhập Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border p-2 rounded"
        />
        <input
          type="password"
          placeholder="Nhập mật khẩu"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border p-2 rounded"
        />
      </div>
      <button
        onClick={handleEmailLogin}
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
      >
        Đăng nhập
      </button>
    </div>
  );
}

/**
 * Nội dung modal Đăng ký
 */
function RegisterModalContent({ onClose }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  // Gửi token Firebase lên BE
  const handleAuth = async (userCredential) => {
    try {
      // Get Firebase token
      const token = await userCredential.user.getIdToken();
      
      // Send to backend
      const response = await authService.login(token);
      
      // Store user data
      localStorage.setItem('user', JSON.stringify(response.user));
      localStorage.setItem('token', token);
      
      onClose();
    } catch (error) {
      console.error('Authentication error:', error);
    }
  }
  
  
  // Hàm đăng ký bằng email/mật khẩu
  const handleEmailRegister = async () => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log("Đăng ký thành công:", userCredential.user);
      await handleAuth(userCredential);
      // Nếu muốn cập nhật thêm tên người dùng, có thể sử dụng updateProfile
      // await updateProfile(userCredential.user, { displayName: name });
      onClose();
    } catch (error) {
      console.error("Lỗi đăng ký:", error.message);
    }
  };

  // Hàm đăng ký bằng Google (thực tế người dùng sẽ được đăng nhập qua Google)
  const handleGoogleRegister = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      console.log("Đăng nhập/Đăng ký Google:", result.user);
      await handleAuth(result);
      onClose();
    } catch (error) {
      console.error("Lỗi Google:", error.message);
    }
  };

  // Hàm đăng ký bằng Facebook (tương tự)
  const handleFacebookRegister = async () => {
    try {
      const result = await signInWithPopup(auth, facebookProvider);
      console.log("Đăng nhập/Đăng ký Facebook:", result.user);
      await handleAuth(result);
      onClose();
    } catch (error) {
      console.error("Lỗi Facebook:", error.message);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">Đăng ký</h2>
      <div className="mb-4">
        <button
          onClick={handleGoogleRegister}
          className="mr-2 mb-2 px-3 py-1.5 bg-red-500 text-white rounded hover:bg-red-600 transition"
        >
          Đăng nhập bằng Google
        </button>
        <button
          onClick={handleFacebookRegister}
          className="mr-2 mb-2 px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          Đăng nhập bằng Facebook
        </button>
      </div>
      <div className="flex flex-col gap-2">
        <input
          type="text"
          placeholder="Nhập họ và tên"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border p-2 rounded"
        />
        <input
          type="email"
          placeholder="Nhập Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border p-2 rounded"
        />
        <input
          type="password"
          placeholder="Nhập mật khẩu"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border p-2 rounded"
        />
      </div>
      <button
        onClick={handleEmailRegister}
        className="mt-4 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition"
      >
        Đăng ký
      </button>
    </div>
  );
}