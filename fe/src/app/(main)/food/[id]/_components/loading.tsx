import React from 'react';

const LoadingState = () => {
  return (
    <div className="container mx-auto px-4 py-10 min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-xl">Đang tải thông tin món ăn...</p>
      </div>
    </div>
  );
};

export default LoadingState;