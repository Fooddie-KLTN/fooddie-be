import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronDown, BanknoteIcon, CreditCard } from 'lucide-react';
import Image from 'next/image';

interface PaymentSectionProps {
  paymentMethod: string;
  showOnlineDropdown: boolean;
  onPaymentMethodChange: (method: string) => void;
  onToggleDropdown: () => void;
}

export const PaymentSection = ({
  paymentMethod,
  showOnlineDropdown,
  onPaymentMethodChange,
  onToggleDropdown,
}: PaymentSectionProps) => {
  return (
    <Card className="shadow-md border border-gray-100 rounded-xl p-0">
      <CardHeader className="flex flex-row items-center gap-2 border-b pb-2">
        <CreditCard className="text-primary" />
        <CardTitle className="text-lg font-bold">Phương thức thanh toán</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4 text-base">
          {/* COD */}
          <label
            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition
              ${paymentMethod === 'cod' ? 'border-green-500 bg-green-50' : 'hover:border-green-200'}
            `}
          >
            <input
              type="radio"
              name="paymentMethod"
              value="cod"
              checked={paymentMethod === 'cod'}
              onChange={() => onPaymentMethodChange('cod')}
              className="accent-green-500"
            />
            <span className="font-medium flex items-center gap-2">
              <BanknoteIcon className="object-contai w-5 h-5 text-green-500" />
              Tiền mặt khi nhận hàng
            </span>
          </label>
          
          {/* Online payment dropdown */}
          <div className="relative">
            <div
              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition select-none
                ${['momo', 'vnpay'].includes(paymentMethod) ? 'border-blue-500 bg-blue-50' : 'hover:border-blue-200'}
              `}
              onClick={onToggleDropdown}
              style={{ userSelect: 'none' }}
            >
              <input
                title='Thanh toán trực tuyến'
                type="radio"
                name="paymentMethod"
                value="online"
                checked={['momo', 'vnpay'].includes(paymentMethod)}
                readOnly
                className="accent-blue-500 pointer-events-none"
                tabIndex={-1}
              />
              <span className="font-medium flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-blue-500" />
                Thanh toán trực tuyến
                {paymentMethod === "momo" && <Image src="/assets/momo.png" alt="Momo" width={24} height={24} />}
                {paymentMethod === "vnpay" && <Image src="/assets/vnpay.png" alt="VNPAY" width={24} height={24} />}
                {(paymentMethod === "momo" || paymentMethod === "vnpay") && (
                  <span className="ml-1 text-xs text-green-600">({paymentMethod.toUpperCase()})</span>
                )}
              </span>
              <ChevronDown className={`h-4 w-4 ml-auto transition-transform ${showOnlineDropdown ? 'rotate-180' : ''}`} />
            </div>
            {showOnlineDropdown && (
              <div className="absolute left-0 z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg">
                <button
                  type="button"
                  className={`flex items-center gap-2 w-full px-3 py-2 text-left rounded-t-lg hover:bg-pink-50 transition
                    ${paymentMethod === 'momo' ? 'bg-pink-100' : ''}`}
                  onClick={() => {
                    onPaymentMethodChange('momo');
                  }}
                >
                  <Image src="/assets/momo.png" alt="Momo" width={24} height={24} className="object-contain" />
                  <span className="text-base font-medium">Ví điện tử Momo</span>
                </button>
                <button
                  type="button"
                  className={`flex items-center gap-2 w-full px-3 py-2 text-left rounded-b-lg hover:bg-green-50 transition
                    ${paymentMethod === 'vnpay' ? 'bg-green-100' : ''}`}
                  onClick={() => {
                    onPaymentMethodChange('vnpay');
                  }}
                >
                  <Image src="/assets/vnpay.png" alt="VNPAY" width={24} height={24} className="object-contain" />
                  <span className="text-base font-medium">VNPAY</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};