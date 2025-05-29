'use client';

import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useAuth } from '@/context/auth-context';
import {  UserProfile, Address } from '@/interface';
import { toast } from 'sonner';
import { AddressList } from '@/app/(main)/profile/_components/address-list';
import { PersonalInfoCard } from './_components/personal-info-card';
import { userApi } from '@/api/user';

const MapboxSearch = dynamic(() => import('@/components/mapbox-search'), {
    ssr: false,
    loading: () => <div className="h-12 rounded-md bg-gray-100 animate-pulse"></div>
});

function parseAddress(full: string) {
    const parts = full.split(',').map(p => p.trim());
    return {
        street: parts[0] || '',
        ward: parts[1] && parts[2] ? `${parts[1]}, ${parts[2]}` : (parts[1] || ''),
        district: parts[3] || '',
        city: parts[4] || '',
    };
}

export default function ProfileSettingsPage() {

    const { user, getToken } = useAuth();
    const userId = user?.id;

    // --- State ---
    const [profile, setProfile] = useState<Partial<Omit<UserProfile, 'addresses'>>>({});
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Address Form State
    const [isEditingAddress, setIsEditingAddress] = useState<boolean>(false);
    const [mapboxAddress, setMapboxAddress] = useState<{
        full: string;
        latitude?: number;
        longitude?: number;
    } | null>(null);
    const [addressLabel, setAddressLabel] = useState<string>('');
    const [isDefaultAddress, setIsDefaultAddress] = useState<boolean>(false);
    const [editingAddressId, setEditingAddressId] = useState<string | null>(null);

    // Avatar State
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

    // --- Effects ---
    // Fetch Profile
    useEffect(() => {
        const loadProfile = async () => {
            setLoading(true);
            setError(null);
            try {
                const token = await getToken();
                if (!token) throw new Error("Authentication token not found.");
                const fetchedProfile = await userApi.getMe(token);
                if (!fetchedProfile) throw new Error("Profile not found.");
                const { address: fetchedAddresses, ...restProfile } = fetchedProfile;
                setProfile(restProfile);
                setAddresses(fetchedAddresses || []);
            } catch (err) {
                console.error("Failed to fetch profile:", err);
                setError(err instanceof Error ? err.message : "An unknown error occurred.");
                setProfile({}); setAddresses([]);
            } finally { setLoading(false); }
        };
        loadProfile();
    }, [getToken]);

    // --- Handlers ---
    const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setProfile(prev => ({ ...prev, [name]: value }));
    };

    const handleAddressLabelChange = (e: ChangeEvent<HTMLInputElement>) => setAddressLabel(e.target.value);
    const handleIsDefaultChange = (e: ChangeEvent<HTMLInputElement>) => setIsDefaultAddress(e.target.checked);

    const resetAddressForm = () => {
        setIsEditingAddress(false);
        setMapboxAddress(null);
        setAddressLabel('');
        setIsDefaultAddress(false);
        setEditingAddressId(null);
    };

    const handleAddNewAddressClick = () => {
        resetAddressForm();
        setIsEditingAddress(true);
    };

    const handleEditAddressClick = (address: Address) => {
        setMapboxAddress({
            full: `${address.street}, ${address.ward}, ${address.district}, ${address.city}`,
            latitude: address.latitude,
            longitude: address.longitude,
        });
        setAddressLabel(address.label || '');
        setIsDefaultAddress(!!address.isDefault);
        setEditingAddressId(address.id || ""); // <--- Track which address is being edited
        setIsEditingAddress(true);
    };

    const handleCancelEditAddress = () => {
        resetAddressForm();
    };

    const handleMapboxAddressSelect = (addressData: { full: string; latitude: number; longitude: number }) => {
        setMapboxAddress(addressData);
    };

    const handleSaveAddress = () => {
        if (!mapboxAddress?.full) {
            toast.error("Please select an address on the map.");
            return;
        }
        const { street, ward, district, city } = parseAddress(mapboxAddress.full);

        const newAddressData: Address = {
            id: editingAddressId || `temp_${Date.now()}`,
            street: street || '',
            ward: ward || '',
            district: district || '',
            city: city || '',
            latitude: mapboxAddress.latitude,
            longitude: mapboxAddress.longitude,
            isDefault: isDefaultAddress,
            label: addressLabel,
        };

        let updatedAddresses = [...addresses];
        if (newAddressData.isDefault) {
            updatedAddresses = updatedAddresses.map(addr => ({ ...addr, isDefault: false }));
        }

        if (editingAddressId) {
            // Replace the address being edited
            updatedAddresses = updatedAddresses.map(addr =>
                addr.id === editingAddressId ? newAddressData : addr
            );
        } else {
            // Add new address
            updatedAddresses.push(newAddressData);
        }

        // Ensure at least one default
        const hasDefault = updatedAddresses.some(addr => addr.isDefault);
        if (!hasDefault && updatedAddresses.length > 0) {
            updatedAddresses[0].isDefault = true;
        }
        setAddresses(updatedAddresses);
        resetAddressForm();
        toast.info(editingAddressId ? "Address updated locally. Save changes to persist." : "Address added locally. Save changes to persist.");
    };

    const handleDeleteAddress = (addressId: string) => {
        const updatedAddresses = addresses.filter(addr => addr.id !== addressId);
        const wasDefault = addresses.find(addr => addr.id === addressId)?.isDefault;
        if (wasDefault && updatedAddresses.length > 0) {
            const hasDefault = updatedAddresses.some(addr => addr.isDefault);
            if (!hasDefault) updatedAddresses[0].isDefault = true;
        }
        setAddresses(updatedAddresses);
        toast.info("Address removed locally. Save changes to persist.");
    };

    // Handle avatar file input
    const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
        }
    };

    // Main Form Submit
    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!userId || isEditingAddress) return;
        setSaving(true); setError(null);
        try {
            const token = await getToken();
            if (!token) throw new Error("Authentication token not found.");

            let avatarUrl = profile.avatar || '';
            // Upload avatar to GCS if a new file is selected
            if (avatarFile) {
                const apiRequestBody = {
                    fileName: avatarFile.name,
                    fileType: avatarFile.type,
                    folder: "user-avatars",
                    isPublic: true,
                };
                const signedUrlResponse = await fetch("/api/gcs-upload", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(apiRequestBody),
                });
                if (!signedUrlResponse.ok) {
                    const errorData = await signedUrlResponse.json().catch(() => ({ message: "Không thể lấy URL tải lên." }));
                    throw new Error(errorData.message || `Lỗi khi lấy URL tải lên: ${signedUrlResponse.statusText}`);
                }
                const { url: signedUrl, publicUrl } = await signedUrlResponse.json();
                if (!signedUrl || !publicUrl) throw new Error("Không nhận được URL hợp lệ từ máy chủ.");

                // Upload the file to GCS
                const gcsUploadResponse = await fetch(signedUrl, {
                    method: "PUT",
                    body: avatarFile,
                    headers: {
                        "Content-Type": avatarFile.type,
                        "x-goog-acl": "public-read",
                    },
                });
                if (!gcsUploadResponse.ok) {
                    const gcsErrorText = await gcsUploadResponse.text();
                    console.error("GCS Upload Error Text:", gcsErrorText);
                    throw new Error(`Tải ảnh lên GCS thất bại: ${gcsUploadResponse.statusText}`);
                }
                avatarUrl = publicUrl;
            }

            const updatedData: Partial<UserProfile> = {
                name: profile.name || '',
                phone: profile.phone || '',
                birthday: profile.birthday || '',
                avatar: avatarUrl,
                address: addresses.map(addr => ({
                    street: addr.street,
                    ward: addr.ward,
                    district: addr.district,
                    city: addr.city,
                    latitude: addr.latitude,
                    longitude: addr.longitude,
                    isDefault: addr.isDefault,
                    label: addr.label,
                }))
            };

            const success = await userApi.updateMe(token, updatedData);
            if (success) {
                toast.success("Profile updated successfully!");
                setAvatarFile(null);
            } else {
                throw new Error("Failed to update profile.");
            }
        } catch (err) {
            console.error("Failed to save profile:", err);
            const message = err instanceof Error ? err.message : "An unknown error occurred.";
            setError(message); toast.error(`Failed to save profile: ${message}`);
        } finally { setSaving(false); }
    };
    // --- End Handlers ---

    // --- Render Logic ---
    if (loading) return <div className="container mx-auto px-4 py-10 text-center">Đang tải hồ sơ...</div>;
    if (error && !loading) return (
        <div className="container mx-auto px-4 py-10 text-center">
            <Card className="p-8 max-w-md mx-auto bg-red-50 border-red-200">
                <h2 className="text-xl font-semibold text-red-700">Lỗi khi tải hồ sơ</h2>
                <p className="text-red-600 mt-2">{error}</p>
            </Card>
        </div>
    );

    return (
        <div className="container mx-auto px-4 py-10 max-w-3xl">
            <h1 className="text-3xl font-bold mb-8">Cài đặt hồ sơ</h1>
            <form onSubmit={handleSubmit}>
                <PersonalInfoCard
                    profile={profile}
                    user={user}
                    onInputChange={handleInputChange}
                    onAvatarChange={handleAvatarChange}
                    avatarPreview={avatarPreview}
                    saving={saving}
                />

                {/* Addresses Section */}
                <Card className="shadow-lg border border-gray-100">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-xl font-semibold">Địa chỉ giao hàng</CardTitle>
                        {/* Show Add button only when not editing/adding */}
                        {!isEditingAddress && (
                            <Button type="button" variant="outline" size="sm" onClick={handleAddNewAddressClick} disabled={saving}>
                                Thêm địa chỉ mới
                            </Button>
                        )}
                    </CardHeader>
                    <CardContent>
                        {/* Show MapboxSearch when adding a new address */}
                        {isEditingAddress && (
                            <div className="border p-4 rounded-md mb-6 space-y-4 bg-gray-50">
                                <h3 className="text-lg font-medium">Thêm địa chỉ mới</h3>
                                <MapboxSearch
                                    onAddressSelect={handleMapboxAddressSelect}
                                    initialAddress={mapboxAddress?.full || ''}
                                    height="350px"
                                    className="rounded-md border border-gray-300"
                                    placeholder="Tìm địa chỉ của bạn..."
                                />
                                {mapboxAddress?.full && (
                                    <div className="mt-4">
                                        <p className="text-sm"><span className="font-medium">Đã chọn:</span> {mapboxAddress.full}</p>
                                    </div>
                                )}
                                <div>
                                    <label className="block text-sm font-medium mb-1" htmlFor="addressLabel">Nhãn (Không bắt buộc)</label>
                                    <input
                                        id="addressLabel"
                                        name="addressLabel"
                                        value={addressLabel}
                                        onChange={handleAddressLabelChange}
                                        placeholder="ví dụ: Nhà riêng, Cơ quan"
                                        className="mt-1 border rounded px-2 py-1 w-full"
                                        disabled={saving}
                                    />
                                </div>
                                <div className="flex items-center space-x-2">
                                    <input
                                        title='Đặt làm địa chỉ mặc định'
                                        type="checkbox"
                                        id="isDefaultAddress"
                                        checked={isDefaultAddress}
                                        onChange={handleIsDefaultChange}
                                        disabled={saving}
                                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                    />
                                    <label htmlFor="isDefaultAddress" className="text-sm font-medium">Đặt làm địa chỉ mặc định</label>
                                </div>
                                <div className="flex justify-end space-x-2 pt-2">
                                    <Button type="button" variant="ghost" onClick={handleCancelEditAddress} disabled={saving}>Hủy</Button>
                                    <Button type="button" onClick={handleSaveAddress} disabled={!mapboxAddress?.full || saving}>
                                        {editingAddressId ? "Cập nhật địa chỉ" : "Thêm địa chỉ"}
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Use AddressList Component when not editing/adding */}
                        {!isEditingAddress && (
                            <AddressList
                                addresses={addresses}
                                onEdit={handleEditAddressClick}
                                onDelete={handleDeleteAddress}
                                saving={saving}
                            />
                        )}
                    </CardContent>
                    <CardFooter className="flex justify-end pt-6 border-t mt-6">
                        {/* Disable Save All when address form is open */}
                        <Button type="submit" disabled={saving || loading || isEditingAddress} className="bg-primary text-white hover:text-primary disabled:opacity-50">
                            {saving ? "Đang lưu thay đổi..." : "Lưu tất cả thay đổi"}
                        </Button>
                    </CardFooter>
                </Card>
            </form>
        </div>
    );
}