"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

const UnauthorizedPage = () => {
  const router = useRouter();

  const handleGoHome = () => {
    router.push('/');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center">
      <div className="p-8 bg-white rounded-lg shadow-lg max-w-md w-full">
        <ShieldAlert className="w-16 h-16 mx-auto text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Không có quyền truy cập</h1>
        <p className="text-gray-600 mb-6">
          Bạn không có quyền truy cập vào trang quản trị. Vui lòng liên hệ quản trị viên nếu bạn cần hỗ trợ.
        </p>
        <Button 
          className="flex items-center justify-center gap-2 w-full hover:outline-primary hover:text-primary" 
          onClick={handleGoHome}
        >
          <ArrowLeft className="w-4 h-4" />
          Quay về trang chủ
        </Button>
      </div>
    </div>
  );
};

export default UnauthorizedPage;