import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin } from 'lucide-react';
import Link from 'next/link';
import { Address } from '@/interface';

interface AddressSectionProps {
  userAddresses: Address[];
  selectedUserAddressId: string | null;
  onSetDefaultAddress: (addressId: string) => void;
}

export const AddressSection = ({
  userAddresses,
  selectedUserAddressId,
  onSetDefaultAddress,
}: AddressSectionProps) => {
  return (
    <Card className="shadow-md border border-gray-100 rounded-xl p-0">
      <CardHeader className="flex flex-row items-center gap-2 border-b pb-2">
        <MapPin className="text-primary" />
        <CardTitle className="text-lg font-bold">Địa chỉ giao hàng</CardTitle>
      </CardHeader>
      <CardContent>
        {userAddresses.length === 0 ? (
          <div className="flex items-center justify-between">
            <p className="text-gray-500">Bạn chưa có địa chỉ nào.</p>
            <Link href="/profile">
              <Button size="sm" variant="outline">+ Thêm địa chỉ</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {userAddresses.map(addr => (
              <div
                key={addr.id}
                className={`border p-3 rounded-lg flex justify-between items-center cursor-pointer transition
                  ${addr.isDefault ? 'border-blue-500 bg-blue-50' : 'hover:border-blue-200'}
                `}
                onClick={() => onSetDefaultAddress(addr.id!)}
              >
                <div>
                  <p className="font-medium flex items-center gap-2">
                    {addr.label || `Địa chỉ ${addr.id?.substring(0, 5)}`}
                    {addr.isDefault && (
                      <span className="ml-1 text-xs font-semibold text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded">
                        Mặc định
                      </span>
                    )}
                    {selectedUserAddressId === addr.id && (
                      <span className="ml-1 text-green-500">
                        <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
                          <path stroke="#22c55e" strokeWidth="2" d="M5 13l4 4L19 7"/>
                        </svg>
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-gray-600">
                    {`${addr.street}, ${addr.ward}, ${addr.district}, ${addr.city}`}
                  </p>
                </div>
                {!addr.isDefault && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={e => {
                      e.stopPropagation();
                      onSetDefaultAddress(addr.id!);
                    }}
                  >
                    Chọn
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
        {!selectedUserAddressId && (
          <div className="mt-2 text-sm text-red-500 flex items-center gap-2">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
              <path stroke="#ef4444" strokeWidth="2" d="M12 8v4m0 4h.01M21 12c0 5-4 9-9 9s-9-4-9-9 4-9 9-9 9 4 9 9Z"/>
            </svg>
            Vui lòng chọn địa chỉ giao hàng để tiếp tục.
          </div>
        )}
      </CardContent>
    </Card>
  );
};