import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

const FoodHeader = () => {
  return (
    <Link href="/" className="inline-flex items-center text-gray-600 hover:text-primary mb-6">
      <ArrowLeft className="h-4 w-4 mr-2" />
      Trở về trang chủ
    </Link>
  );
};

export default FoodHeader;