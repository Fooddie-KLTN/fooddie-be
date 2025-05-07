"use client";

import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  BookOpen,
  GraduationCap,
  Home,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="h-[calc(100vh-80px)] w-full flex flex-col items-center justify-center px-4 bg-slate-50">
      <div className="max-w-md text-center">
        <div className="mb-6 relative">
          <GraduationCap className="h-24 w-24 mx-auto text-primary" />
          <div className="absolute top-4 right-[calc(50%-60px)] rounded-full bg-red-500 h-8 w-8 flex items-center justify-center text-white font-bold">
            ?
          </div>
        </div>

        <h1 className="text-5xl font-bold text-gray-900 mb-2">404</h1>
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          Trang không tìm thấy
        </h2>

        <p className="text-gray-600 mb-8">
          Có vẻ như bạn đã đi lạc vào một khóa học không tồn tại. Hãy
          quay lại và tiếp tục hành trình học tập của bạn nhé!
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={() => router.back()}
            variant="outline"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại
          </Button>

          <Link href="/collection" passHref>
            <Button className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Khám phá khóa học
            </Button>
          </Link>

          <Link href="/" passHref>
            <Button
              variant="ghost"
              className="flex items-center gap-2"
            >
              <Home className="h-4 w-4" />
              Trang chủ
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
