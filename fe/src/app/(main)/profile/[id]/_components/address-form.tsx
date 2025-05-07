import React, { ChangeEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Province, District, Ward } from '@/interface';

interface AddressFormProps {
    addressLabel: string;
    streetAddress: string;
    selectedProvince: number | null;
    selectedDistrict: number | null;
    selectedWard: number | null;
    isDefaultAddress: boolean;
    provinces: Province[];
    districts: District[];
    wards: Ward[];
    isLoadingProvinces: boolean;
    isLoadingDistricts: boolean;
    isLoadingWards: boolean;
    saving: boolean;
    isEditing: boolean; // To change button text
    onAddressLabelChange: (e: ChangeEvent<HTMLInputElement>) => void;
    onStreetAddressChange: (e: ChangeEvent<HTMLInputElement>) => void;
    onProvinceChange: (value: string) => void;
    onDistrictChange: (value: string) => void;
    onWardChange: (value: string) => void;
    onIsDefaultChange: (e: ChangeEvent<HTMLInputElement>) => void;
    onSave: () => void;
    onCancel: () => void;
}

export const AddressForm: React.FC<AddressFormProps> = ({
    addressLabel, streetAddress, selectedProvince, selectedDistrict, selectedWard, isDefaultAddress,
    provinces, districts, wards, isLoadingProvinces, isLoadingDistricts, isLoadingWards, saving, isEditing,
    onAddressLabelChange, onStreetAddressChange, onProvinceChange, onDistrictChange, onWardChange,
    onIsDefaultChange, onSave, onCancel
}) => {
    const isSaveDisabled = saving || !selectedProvince || !selectedDistrict || !selectedWard || !streetAddress;

    return (
        <div className="border p-4 rounded-md mb-6 space-y-4 bg-gray-50">
            <h3 className="text-lg font-medium">{isEditing ? 'Edit Address' : 'Add New Address'}</h3>
            <div>
                <Label htmlFor="addressLabel" className="text-sm font-medium">Label (Optional)</Label>
                <Input
                    id="addressLabel"
                    name="addressLabel"
                    value={addressLabel}
                    onChange={onAddressLabelChange}
                    placeholder="e.g., Home, Work"
                    className="mt-1"
                    disabled={saving}
                />
            </div>
            <div>
                <Label htmlFor="province" className="text-sm font-medium">Province/City *</Label>
                <Select
                    value={selectedProvince?.toString() ?? ''}
                    onValueChange={onProvinceChange}
                    disabled={isLoadingProvinces || saving}
                >
                    <SelectTrigger id="province" className="mt-1">
                        <SelectValue placeholder={isLoadingProvinces ? "Loading..." : "Select Province/City"} />
                    </SelectTrigger>
                    <SelectContent>
                        {provinces.map((province) => (
                            <SelectItem key={province.id} value={province.id.toString()}>
                                {province.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div>
                <Label htmlFor="district" className="text-sm font-medium">District *</Label>
                <Select
                    value={selectedDistrict?.toString() ?? ''}
                    onValueChange={onDistrictChange}
                    disabled={!selectedProvince || isLoadingDistricts || districts.length === 0 || saving}
                >
                    <SelectTrigger id="district" className="mt-1">
                        <SelectValue placeholder={isLoadingDistricts ? "Loading..." : (districts.length === 0 && selectedProvince ? "No districts found" : "Select District")} />
                    </SelectTrigger>
                    <SelectContent>
                        {districts.map((district) => (
                            <SelectItem key={district.id} value={district.id.toString()}>
                                {district.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div>
                <Label htmlFor="ward" className="text-sm font-medium">Ward *</Label>
                <Select
                    value={selectedWard?.toString() ?? ''}
                    onValueChange={onWardChange}
                    disabled={!selectedDistrict || isLoadingWards || wards.length === 0 || saving}
                >
                    <SelectTrigger id="ward" className="mt-1">
                        <SelectValue placeholder={isLoadingWards ? "Loading..." : (wards.length === 0 && selectedDistrict ? "No wards found" : "Select Ward")} />
                    </SelectTrigger>
                    <SelectContent>
                        {wards.map((ward) => (
                            <SelectItem key={ward.id} value={ward.id.toString()}>
                                {ward.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div>
                <Label htmlFor="streetAddress" className="text-sm font-medium">Street Address (Number, Street Name) *</Label>
                <Input
                    id="streetAddress"
                    name="streetAddress"
                    value={streetAddress}
                    onChange={onStreetAddressChange}
                    placeholder="e.g., 123 Example St"
                    className="mt-1"
                    disabled={saving}
                />
            </div>
            <div className="flex items-center space-x-2">
                <input
                    title='Set as default address'
                    type="checkbox"
                    id="isDefaultAddress"
                    checked={isDefaultAddress}
                    onChange={onIsDefaultChange}
                    disabled={saving}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <Label htmlFor="isDefaultAddress" className="text-sm font-medium">Set as default address</Label>
            </div>
            <div className="flex justify-end space-x-2 pt-2">
                <Button type="button" variant="ghost" onClick={onCancel} disabled={saving}>Cancel</Button>
                <Button type="button" onClick={onSave} disabled={isSaveDisabled}>
                    {isEditing ? 'Update Address' : 'Add Address'}
                </Button>
            </div>
        </div>
    );
};