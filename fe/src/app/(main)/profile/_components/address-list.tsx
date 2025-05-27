import React from 'react';
import { Button } from '@/components/ui/button';
import { Address } from '@/interface';

// Helper function (can be moved to a utils file)
const getAddressString = (address: Address | null | undefined) => {
    if (!address) return "No address selected";
    return `${address.street || ''}, ${address.ward || ''}, ${address.district || ''}, ${address.city || ''}`;
};

interface AddressListProps {
    addresses: Address[];
    onEdit: (address: Address) => void;
    onDelete: (addressId: string) => void;
    saving: boolean;
}

export const AddressList: React.FC<AddressListProps> = ({ addresses, onEdit, onDelete, saving }) => {
    return (
        <div className="space-y-4">
            {addresses.length === 0 && <p className="text-sm text-gray-500">Không có địa chỉ được lưu.</p>}
            {addresses.map((address) => (
                <div key={address.id} className={`border p-3 rounded-md flex justify-between items-start ${address.isDefault ? 'border-blue-300 bg-blue-50' : ''}`}>
                    <div>
                        <p className="font-medium">
                            {address.label ? `${address.label}` : `Address ${address.id ? address.id.substring(0, 5) : ''}`}
                            {address.isDefault && <span className="ml-2 text-xs font-semibold text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded">Mặc định</span>}
                        </p>
                        <p className="text-sm text-gray-600">{getAddressString(address)}</p>
                    </div>
                    <div className="flex space-x-1 flex-shrink-0 ml-2">
                        <Button type="button" variant="outline" size="sm" onClick={() => onEdit(address)} disabled={saving}>Chỉnh sửa</Button>
                        {/* Prevent deleting the last address */}
                        <Button type="button" variant="destructive" size="sm" onClick={() => address.id && onDelete(address.id)} disabled={saving || addresses.length <= 1}>Xóa</Button>
                    </div>
                </div>
            ))}
            {/* Consider adding drag-and-drop handles here if implementing reordering */}
        </div>
    );
};