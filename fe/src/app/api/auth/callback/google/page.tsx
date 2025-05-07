"use client"; // Chỉ định đây là Client Component

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context'; // Điều chỉnh đường dẫn nếu cần
import { jwtDecode } from 'jwt-decode'; // Nhập jwt-decode
import { GoogleRegisterData } from '@/api/auth'; // Nhập interface

// Interface cho payload dự kiến của Google ID token
interface GoogleIdTokenPayload {
    iss: string; // Issuer Identifier
    azp: string; // Authorized party
    aud: string; // Audience
    sub: string; // Subject Identifier (Đây là Google User ID - googleId)
    email: string;
    email_verified: boolean; // Email đã được xác minh
    name: string; // Tên đầy đủ
    picture: string; // URL ảnh đại diện
    given_name: string; // Tên
    family_name: string; // Họ
    iat: number; // Issued at (Thời điểm cấp)
    exp: number; // Expiration time (Thời điểm hết hạn)
    nonce?: string; // Nonce nếu được yêu cầu và trả về
}

const GoogleCallbackContent: React.FC = () => {
    const router = useRouter();
    const { handleGoogleRegister } = useAuth(); // Sử dụng hàm xử lý đăng ký
    const [error, setError] = useState<string | null>(null); // State lưu lỗi
    const [isLoading, setIsLoading] = useState(true); // State chỉ báo đang tải

    useEffect(() => {
        const processAuth = async () => {
            setIsLoading(true); // Bắt đầu tải
            setError(null); // Xóa lỗi cũ

            // Lấy phần hash từ URL và phân tích tham số
            const hash = window.location.hash.substring(1);
            const params = new URLSearchParams(hash);

            const idToken = params.get('id_token'); // Lấy ID token
            const accessToken = params.get('access_token'); // Lấy access token
            const errorParam = params.get('error'); // Lấy tham số lỗi nếu có

            const storedNonce = localStorage.getItem('oauth_nonce'); // Lấy nonce đã lưu
            // Xóa state và nonce khỏi localStorage sau khi sử dụng
            localStorage.removeItem('oauth_state');
            localStorage.removeItem('oauth_nonce');

            // --- Kiểm tra lỗi từ Google ---
            if (errorParam) {
                console.error('Lỗi OAuth:', errorParam);
                setError(`Đăng nhập Google thất bại: ${errorParam}`);
                setIsLoading(false); // Dừng tải
                return; // Dừng xử lý
            }

            // --- Kiểm tra sự tồn tại của token ---
            if (!idToken || !accessToken) { // Kiểm tra cả hai token
                console.error('Không tìm thấy ID token hoặc Access token trong URL fragment');
                setError('Không thể lấy thông tin xác thực cần thiết từ Google.');
                setIsLoading(false); // Dừng tải
                return; // Dừng xử lý
            }

            // --- Giải mã ID Token & Chuẩn bị dữ liệu ---
            let googleData: GoogleRegisterData;
            try {
                // Giải mã ID token để lấy thông tin người dùng
                const decodedToken = jwtDecode<GoogleIdTokenPayload>(idToken);

                // Tùy chọn: Xác minh nonce nếu bạn đã lưu trữ một nonce trước đó
                if (storedNonce && decodedToken.nonce !== storedNonce) {
                    console.error('Nonce không khớp:', { received: decodedToken.nonce, stored: storedNonce });
                    throw new Error('Lỗi xác thực (nonce không khớp). Vui lòng thử đăng nhập lại.');
                }

                // Tùy chọn: Thêm các bước xác thực khác (ví dụ: kiểm tra 'aud' với client ID của bạn, kiểm tra 'iss', kiểm tra thời gian hết hạn 'exp')

                // Kiểm tra các trường thông tin bắt buộc trong token
                if (!decodedToken.sub || !decodedToken.email || !decodedToken.name) {
                    throw new Error('ID token thiếu thông tin người dùng bắt buộc (sub, email, name).');
                }

                // Chuẩn bị dữ liệu để gửi đến backend
                googleData = {
                    googleId: decodedToken.sub,
                    email: decodedToken.email,
                    name: decodedToken.name,
                    accessToken: accessToken, // Truyền access token
                };

            } catch (decodeError: unknown) {
                console.error('Giải mã hoặc xác thực ID token thất bại:', decodeError);
                // Xử lý lỗi giải mã/xác thực
                if (decodeError instanceof Error) {
                    setError(`Lỗi xử lý xác thực: ${decodeError.message}`);
                } else {
                    setError('Lỗi xử lý xác thực: Token nhận được không hợp lệ.');
                }
                setIsLoading(false); // Dừng tải
                return; // Dừng xử lý
            }

            // --- Gọi Backend để Đăng ký ---
            try {
                // Gọi hàm xử lý đăng ký từ context
                await handleGoogleRegister(googleData);
                // Chuyển hướng về trang chủ ngay lập tức khi thành công
                router.push('/');
            } catch (err: unknown) {
                console.error('Đăng ký backend thất bại:', err);
                // Xử lý lỗi từ backend
                if (err instanceof Error) {
                    setError(err.message || 'Đã xảy ra lỗi trong quá trình đăng ký.');
                } else {
                    setError('Đã xảy ra lỗi không xác định trong quá trình đăng ký.');
                }
                setIsLoading(false); // Dừng tải
            }
        };

        processAuth(); // Chạy hàm xử lý xác thực khi component mount
    }, [handleGoogleRegister, router]); // Dependencies của useEffect

    // --- Logic hiển thị ---
    if (isLoading) {
        // Hiển thị khi đang xử lý
        return <div className="flex justify-center items-center h-screen">Đang xử lý đăng ký Google...</div>;
    }

    if (error) {
        // Hiển thị khi có lỗi
        return (
            <div className="flex flex-col justify-center items-center h-screen text-red-600">
                <p className="text-xl font-semibold">Lỗi Đăng ký Google</p>
                <p className="mt-2 text-base">{error}</p>
                <button
                    onClick={() => router.push('/')} // Nút quay về trang chủ
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    aria-label="Quay lại trang chủ" // Nhãn trợ năng
                >
                    Về Trang chủ
                </button>
            </div>
        );
    }

    // Hiển thị khi hoàn tất (trước khi chuyển hướng)
    return <div className="flex justify-center items-center h-screen">Đang hoàn tất đăng ký...</div>;
};

// Component chính của trang callback
const GoogleCallbackPage: React.FC = () => {
    return (
        // Sử dụng Suspense để hiển thị fallback khi component con đang tải
        <Suspense fallback={<div className="flex justify-center items-center h-screen">Đang tải callback...</div>}>
            <GoogleCallbackContent />
        </Suspense>
    );
};

export default GoogleCallbackPage; // Xuất component trang