'use client';

import { useState, useEffect, useCallback } from 'react';
import { CommonInfoForm } from '../_components/commom';
import { Restaurant } from '@/interface';
import { useAuth } from '@/context/auth-context';
import { userApi } from '@/api/user';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';

export default function BasicInfoPage() {
    const { getToken, loading: authLoading } = useAuth();
    const params = useParams();
    const restaurantId = Array.isArray(params.id) ? params.id[0] : params.id;
    
    const [restaurant, setRestaurant] = useState<Partial<Restaurant>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [, setError] = useState<string | null>(null);

    // Fetch restaurant data
    useEffect(() => {
        if (authLoading) return;
        
        const loadRestaurant = async () => {
            setLoading(true);
            setError(null);
            
            try {
                const token = await getToken() ?? '';
                if (!token) {
                    setError("Failed to retrieve authentication token");
                    return;
                }
                
                const fetchedRestaurant = await userApi.restaurant.getMyRestaurant(token);
                
                if (!fetchedRestaurant) {
                    setError("Restaurant not found");
                    return;
                }
                
                setRestaurant(fetchedRestaurant);
            } catch (err) {
                console.error("Failed to fetch restaurant:", err);
                setError(err instanceof Error ? err.message : "An unknown error occurred");
                toast.error("Failed to load restaurant data");
            } finally {
                setLoading(false);
            }
        };

        loadRestaurant();
    }, [getToken, authLoading]);

    // Handle address selection from MapboxSearch
    const handleAddressSelect = useCallback((addressData: { full: string; latitude: number; longitude: number }) => {
        const addressParts = addressData.full.split(', ');
        const cityIndex = addressParts.length > 2 ? addressParts.length - 1 : addressParts.length - 1;
        const districtIndex = addressParts.length > 3 ? addressParts.length - 2 : 0;
        const wardIndex = addressParts.length > 4 ? addressParts.length - 3 : 0;
        
        setRestaurant(prev => ({
            ...prev,
            address: {
                street: addressParts.slice(0, wardIndex > 0 ? wardIndex : 0).join(', ') || addressData.full,
                ward: addressParts[wardIndex] || '',
                district: addressParts[districtIndex] || '',
                city: addressParts[cityIndex] || '',
                latitude: addressData.latitude,
                longitude: addressData.longitude
            },
            latitude: addressData.latitude,
            longitude: addressData.longitude
        }));
    }, []);

    // Handle input changes
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setRestaurant((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    // Handle form submit with actual API call
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSaving(true);
        
        try {
            const token = await getToken() ?? '';
            if (!token) {
                toast.error("Authentication token required");
                return;
            }
            
            const formData = new FormData();
            
            Object.entries(restaurant).forEach(([key, value]) => {
                if (key !== 'avatar' && key !== 'backgroundImage' && value !== undefined) {
                    formData.append(key, String(value));
                }
            });
            
            await userApi.restaurant.updateRestaurant(token, restaurantId!, formData);
            toast.success("Restaurant information updated successfully");
        } catch (err) {
            console.error("Failed to update restaurant:", err);
            toast.error("Failed to update restaurant information");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto py-8">
            <CommonInfoForm
                restaurant={restaurant}
                handleInputChange={handleInputChange}
                handleSubmit={handleSubmit}
                saving={saving}
                loading={loading}
                authLoading={authLoading}
                hideAddressInput={true}
                handleAddressSelect={handleAddressSelect}
            />
        </div>
    );
}