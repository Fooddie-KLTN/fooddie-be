import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';

interface OrderNoteSectionProps {
  orderNote: string;
  onOrderNoteChange: (note: string) => void;
}

export const OrderNoteSection = ({ orderNote, onOrderNoteChange }: OrderNoteSectionProps) => {
  return (
    <Card className="shadow-md border border-gray-100 rounded-xl p-0">
      <CardHeader>
        <CardTitle className="text-lg font-bold">Ghi chú cho đơn hàng (tuỳ chọn)</CardTitle>
      </CardHeader>
      <CardContent>
        <Textarea
          id="order-note"
          className="w-full border rounded-lg p-2 focus:outline-primary"
          rows={3}
          value={orderNote}
          onChange={e => onOrderNoteChange(e.target.value)}
          placeholder="Nhập ghi chú cho cửa hàng, ví dụ: không hành, giao giờ trưa..."
        />
      </CardContent>
    </Card>
  );
};