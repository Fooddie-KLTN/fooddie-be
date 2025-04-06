import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function NotFoundCard() {
  return (
    <div className="container mx-auto px-4 py-10 min-h-screen flex items-center justify-center">
      <Card className="p-8 max-w-md w-full text-center">
        <h2 className="text-2xl font-bold mb-4">Không tìm thấy món ăn</h2>
        <p className="text-gray-500 mb-6">Món ăn bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.</p>
        <Link href="/food">
          <Button className="food-button w-full">Xem danh sách món ăn</Button>
        </Link>
      </Card>
    </div>
  );
}