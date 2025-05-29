import { Card, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export const EmptyCart = () => {
  return (
    <Card className="text-center p-10 shadow-lg border border-gray-200 rounded-lg">
      <CardTitle className="mb-4 text-2xl font-semibold">Giỏ hàng của bạn đang trống</CardTitle>
      <p className="text-gray-600 mb-6">Có vẻ như bạn chưa thêm sản phẩm nào vào giỏ hàng.</p>
      <Link href="/">
        <Button className="hover:text-primary" size="lg">Bắt đầu mua sắm</Button>
      </Link>
    </Card>
  );
};