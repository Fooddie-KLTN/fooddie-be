'use client';

import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useAuth } from '@/context/auth-context';
import { Province, District, Ward, UserProfile, Address } from '@/interface';
import { toast } from 'sonner';
import { AddressForm } from './_components/address-form';
import { AddressList } from './_components/address-list';
import { PersonalInfoCard } from './_components/personal-info-card';


// --- Mock Functions (Keep or replace with actual API calls) ---
async function fetchUserProfile(userId: string, token?: string): Promise<UserProfile | null> {
    console.log(`Fetching profile for user ID: ${userId}, token: ${token}`);
    await new Promise(resolve => setTimeout(resolve, 1000));
    // Removed currentAddress from mock as it's derived from addresses array
    const mockProfile: UserProfile = {
        id: userId,
        name: "Olivia Rhyne",
        email: "olivia@example.com",
        phone: "0912345678",
        avatar: "https://source.unsplash.com/random/200x200/?profile",
        birthday: "1995-08-15",
        addresses: [
            { id: "addr_home_123", label: "Home", street: "123 Đường ABC", wardId: 1, districtId: 1, provinceId: 1, wardName: "Phường XYZ", districtName: "Quận Test", provinceName: "Tỉnh Demo", isDefault: true },
            { id: "addr_work_456", label: "Work", street: "456 Cao ốc DEF", wardId: 2, districtId: 2, provinceId: 1, wardName: "Phường KLM", districtName: "Quận Sample", provinceName: "Tỉnh Demo" },
        ],
    };
    return mockProfile;
}

async function updateUserProfile(userId: string, data: Partial<UserProfile>, token?: string): Promise<boolean> {
    console.log(`Updating profile for user ID: ${userId}, token: ${token}`, data);
    await new Promise(resolve => setTimeout(resolve, 1500));
    return true;
}
// --- End Mock Functions ---

export default function ProfileSettingsPage() {
    const params = useParams();
    const userId = params.id as string;
    const { user, getToken } = useAuth();

    // --- State ---
    const [profile, setProfile] = useState<Partial<Omit<UserProfile, 'addresses'>>>({});
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Address Form State
    const [isEditingAddress, setIsEditingAddress] = useState<string | null>(null); // 'new' or address ID
    // Removed currentAddress state

    // Address Dropdown/Input State
    const [provinces, setProvinces] = useState<Province[]>([]);
    const [districts, setDistricts] = useState<District[]>([]);
    const [wards, setWards] = useState<Ward[]>([]);
    const [selectedProvince, setSelectedProvince] = useState<number | null>(null);
    const [selectedDistrict, setSelectedDistrict] = useState<number | null>(null);
    const [selectedWard, setSelectedWard] = useState<number | null>(null);
    const [streetAddress, setStreetAddress] = useState<string>('');
    const [addressLabel, setAddressLabel] = useState<string>('');
    const [isDefaultAddress, setIsDefaultAddress] = useState<boolean>(false);

    // Address Dropdown Loading State
    const [isLoadingProvinces, setIsLoadingProvinces] = useState(false);
    const [isLoadingDistricts, setIsLoadingDistricts] = useState(false);
    const [isLoadingWards, setIsLoadingWards] = useState(false);
    // --- End State ---

    // --- Effects ---
    // Fetch Profile
    useEffect(() => {
        if (!userId) {
            setError("Unauthorized or invalid user ID.");
            setLoading(false);
            return;
        }
        const loadProfile = async () => {
            setLoading(true);
            setError(null);
            try {
                const fetchedProfile = await fetchUserProfile(userId); // Add token if needed
                if (!fetchedProfile) throw new Error("Profile not found.");
                const { addresses: fetchedAddresses, ...restProfile } = fetchedProfile;
                setProfile(restProfile);
                setAddresses(fetchedAddresses || []);
            } catch (err) {
                console.error("Failed to fetch profile:", err);
                setError(err instanceof Error ? err.message : "An unknown error occurred.");
                setProfile({}); setAddresses([]);
            } finally { setLoading(false); }
        };
        loadProfile();
    }, [userId]); // Removed getToken dependency unless used directly here

    // Fetch Provinces
    useEffect(() => {
        const fetchProvinces = async () => {
            setIsLoadingProvinces(true);
            try {
                const response = await fetch('https://vnprovinces.pythonanywhere.com/api/provinces/?basic=true&limit=100');
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const data = await response.json();
                setProvinces(Array.isArray(data) ? data : (data?.results ?? []));
            } catch (error) { console.error("Failed to fetch provinces:", error); setProvinces([]); }
            finally { setIsLoadingProvinces(false); }
        };
        fetchProvinces();
    }, []);

    // Fetch Districts
    useEffect(() => {
        if (!selectedProvince) {
            setDistricts([]); setSelectedDistrict(null); setWards([]); setSelectedWard(null); return;
        }
        const fetchDistricts = async () => {
            setIsLoadingDistricts(true);
            setDistricts([]); setSelectedDistrict(null); setWards([]); setSelectedWard(null);
            try {
                const response = await fetch(`https://vnprovinces.pythonanywhere.com/api/districts/?province_id=${selectedProvince}&basic=true&limit=100`);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const data = await response.json();
                setDistricts(data?.results ?? []);
            } catch (error) { console.error("Failed to fetch districts:", error); setDistricts([]); }
            finally { setIsLoadingDistricts(false); }
        };
        fetchDistricts();
    }, [selectedProvince]);

    // Fetch Wards
    useEffect(() => {
        if (!selectedDistrict) {
            setWards([]); setSelectedWard(null); return;
        }
        const fetchWards = async () => {
            setIsLoadingWards(true);
            setWards([]); setSelectedWard(null);
            try {
                const response = await fetch(`https://vnprovinces.pythonanywhere.com/api/wards/?district_id=${selectedDistrict}&basic=true&limit=100`);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const data = await response.json();
                setWards(data?.results ?? []);
            } catch (error) { console.error("Failed to fetch wards:", error); setWards([]); }
            finally { setIsLoadingWards(false); }
        };
        fetchWards();
    }, [selectedDistrict]);
    // --- End Effects ---

    // --- Handlers ---
    const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setProfile(prev => ({ ...prev, [name]: value }));
    };

    // Address Form Handlers
    const handleProvinceChange = (value: string) => {
        const provinceId = parseInt(value, 10);
        setSelectedProvince(isNaN(provinceId) ? null : provinceId);
        setSelectedDistrict(null); setSelectedWard(null); setDistricts([]); setWards([]);
    };
    const handleDistrictChange = (value: string) => {
        const districtId = parseInt(value, 10);
        setSelectedDistrict(isNaN(districtId) ? null : districtId);
        setSelectedWard(null); setWards([]);
    };
    const handleWardChange = (value: string) => {
        const wardId = parseInt(value, 10);
        setSelectedWard(isNaN(wardId) ? null : wardId);
    };
    const handleStreetAddressChange = (e: ChangeEvent<HTMLInputElement>) => setStreetAddress(e.target.value);
    const handleAddressLabelChange = (e: ChangeEvent<HTMLInputElement>) => setAddressLabel(e.target.value);
    const handleIsDefaultChange = (e: ChangeEvent<HTMLInputElement>) => setIsDefaultAddress(e.target.checked);

    const resetAddressForm = () => {
        setIsEditingAddress(null);
        setSelectedProvince(null); setSelectedDistrict(null); setSelectedWard(null);
        setStreetAddress(''); setAddressLabel(''); setIsDefaultAddress(false);
        setDistricts([]); setWards([]);
    };

    const handleAddNewAddressClick = () => {
        resetAddressForm();
        setIsEditingAddress('new');
    };

    const handleEditAddressClick = (address: Address) => {
        setIsEditingAddress(address.id);
        setSelectedProvince(address.provinceId ?? null);
        setSelectedDistrict(address.districtId ?? null); // Districts/Wards will fetch
        setSelectedWard(address.wardId ?? null);
        setStreetAddress(address.street ?? '');
        setAddressLabel(address.label ?? '');
        setIsDefaultAddress(address.isDefault ?? false);
    };

    const handleCancelEditAddress = () => {
        resetAddressForm();
    };

    const handleSaveAddress = () => {
        if (!selectedProvince || !selectedDistrict || !selectedWard || !streetAddress) {
            toast.error("Please fill in all required address details.");
            return;
        }
        const newAddressData: Address = {
            id: isEditingAddress === 'new' ? `temp_${Date.now()}` : isEditingAddress!,
            label: addressLabel, street: streetAddress, wardId: selectedWard, districtId: selectedDistrict, provinceId: selectedProvince,
            wardName: wards.find(w => w.id === selectedWard)?.name,
            districtName: districts.find(d => d.id === selectedDistrict)?.name,
            provinceName: provinces.find(p => p.id === selectedProvince)?.name,
            isDefault: isDefaultAddress,
        };

        let updatedAddresses = [...addresses];
        if (newAddressData.isDefault) {
            updatedAddresses = updatedAddresses.map(addr => ({ ...addr, isDefault: false }));
        }
        if (isEditingAddress === 'new') {
            updatedAddresses.push(newAddressData);
        } else {
            const index = updatedAddresses.findIndex(addr => addr.id === isEditingAddress);
            if (index > -1) updatedAddresses[index] = newAddressData;
        }
        const hasDefault = updatedAddresses.some(addr => addr.isDefault);
        if (!hasDefault && updatedAddresses.length > 0) {
            updatedAddresses[0].isDefault = true; // Ensure one is default
        }
        setAddresses(updatedAddresses);
        resetAddressForm();
        toast.info("Address updated locally. Save changes to persist.");
    };

    const handleDeleteAddress = (addressId: string) => {
        const updatedAddresses = addresses.filter(addr => addr.id !== addressId);
        const wasDefault = addresses.find(addr => addr.id === addressId)?.isDefault;
        if (wasDefault && updatedAddresses.length > 0) {
            const hasDefault = updatedAddresses.some(addr => addr.isDefault);
            if (!hasDefault) updatedAddresses[0].isDefault = true; // Ensure one is default
        }
        setAddresses(updatedAddresses);
        toast.info("Address removed locally. Save changes to persist.");
    };

    // Main Form Submit
    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!userId || !!isEditingAddress) return; // Prevent save while editing address
        setSaving(true); setError(null);
        try {
            const token = await getToken();
            if (!token) throw new Error("Authentication token not found.");
            const updatedData: Partial<UserProfile> = {
                ...profile, id: userId,
                addresses: addresses.map(addr => ({
                    ...addr,
                    // Generate a unique ID for new addresses instead of undefined
                    id: addr.id.startsWith('temp_') ? `new_${Date.now()}_${Math.random().toString(36).substring(2, 9)}` : addr.id
                }))
            };
            const success = await updateUserProfile(userId, updatedData, token);
            if (success) {
                toast.success("Profile updated successfully!");
                // Optionally re-fetch profile here if backend assigns new IDs
            } else { throw new Error("Failed to update profile."); }
        } catch (err) {
            console.error("Failed to save profile:", err);
            const message = err instanceof Error ? err.message : "An unknown error occurred.";
            setError(message); toast.error(`Failed to save profile: ${message}`);
        } finally { setSaving(false); }
    };
    // --- End Handlers ---

    // --- Render Logic ---
    if (loading) return <div className="container mx-auto px-4 py-10 text-center">Loading profile...</div>;
    if (error && !loading) return (
        <div className="container mx-auto px-4 py-10 text-center">
            <Card className="p-8 max-w-md mx-auto bg-red-50 border-red-200">
                <h2 className="text-xl font-semibold text-red-700">Error Loading Profile</h2>
                <p className="text-red-600 mt-2">{error}</p>
            </Card>
        </div>
    );

    return (
        <div className="container mx-auto px-4 py-10 max-w-3xl">
            <h1 className="text-3xl font-bold mb-8">Profile Settings</h1>
            <form onSubmit={handleSubmit}>
                {/* Use PersonalInfoCard Component */}
                <PersonalInfoCard
                    profile={profile}
                    user={user}
                    onInputChange={handleInputChange}
                    saving={saving}
                />

                {/* Addresses Section */}
                <Card className="shadow-lg border border-gray-100">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-xl font-semibold">Delivery Addresses</CardTitle>
                        {/* Show Add button only when not editing/adding */}
                        {!isEditingAddress && (
                            <Button type="button" variant="outline" size="sm" onClick={handleAddNewAddressClick} disabled={saving}>
                                Add New Address
                            </Button>
                        )}
                    </CardHeader>
                    <CardContent>
                        {/* Use AddressForm Component when adding/editing */}
                        {isEditingAddress && (
                            <AddressForm
                                addressLabel={addressLabel}
                                streetAddress={streetAddress}
                                selectedProvince={selectedProvince}
                                selectedDistrict={selectedDistrict}
                                selectedWard={selectedWard}
                                isDefaultAddress={isDefaultAddress}
                                provinces={provinces}
                                districts={districts}
                                wards={wards}
                                isLoadingProvinces={isLoadingProvinces}
                                isLoadingDistricts={isLoadingDistricts}
                                isLoadingWards={isLoadingWards}
                                saving={saving}
                                isEditing={isEditingAddress !== 'new'}
                                onAddressLabelChange={handleAddressLabelChange}
                                onStreetAddressChange={handleStreetAddressChange}
                                onProvinceChange={handleProvinceChange}
                                onDistrictChange={handleDistrictChange}
                                onWardChange={handleWardChange}
                                onIsDefaultChange={handleIsDefaultChange}
                                onSave={handleSaveAddress}
                                onCancel={handleCancelEditAddress}
                            />
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
                        <Button type="submit" disabled={saving || loading || !!isEditingAddress}>
                            {saving ? "Saving Changes..." : "Save All Changes"}
                        </Button>
                    </CardFooter>
                </Card>
            </form>
        </div>
    );
}