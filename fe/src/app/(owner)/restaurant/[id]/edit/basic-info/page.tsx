'use client';

import { useState } from 'react';
import { CommonInfoForm } from '../_components/commom';
import { Restaurant, RestaurantStatus } from '@/interface';

export default function BasicInfoPage() {
    // Fake initial data for demonstration
    const [restaurant, setRestaurant] = useState<Partial<Restaurant>>({
        name: 'My Awesome Cafe',
        description: 'The best coffee and pastries in town. Owned by me!',
        address: '456 Owner St, District 10, City',
        phoneNumber: '0987654321',
        openTime: '08:00',
        closeTime: '18:00',
        avatar: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200&h=200',
        backgroundImage: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1200',
        status: RestaurantStatus.APPROVED,
    });
    const [saving, setSaving] = useState(false);

    // Handle input changes
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setRestaurant((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    // Handle form submit (fake)
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSaving(true);
        setTimeout(() => {
            setSaving(false);
            alert('Saved!');
        }, 1000);
    };

    return (
        <div className="max-w-2xl mx-auto py-8">
            <CommonInfoForm
                restaurant={restaurant}
                handleInputChange={handleInputChange}
                handleSubmit={handleSubmit}
                saving={saving}
                loading={false}
                authLoading={false}
            />
        </div>
    );
}