'use client';

import { useState, useEffect } from 'react';
import { Restaurant, FoodPreview, RestaurantStatus } from '@/interface';
import { RestaurantSkeleton } from './_components/skeleton';
import { RestaurantHeader } from './_components/header';
import { RestaurantInfo } from './_components/info';
import { RestaurantMenu } from './_components/menu';
import { useParams } from 'next/navigation';
import { guestService } from '@/api/guest';
import { useGeo } from '@/context/geolocation-context';



// Format price helper function
const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(price);
};

export default function RestaurantPage() {

    const { id } = useParams();
    const { location } = useGeo(); 

    const restaurantId = id as string;

    const [loading, setLoading] = useState(true);
    const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
    const [foods, setFoods] = useState<FoodPreview[]>([]);

    useEffect(() => {
        const getRestaurantData = async () => {
            try {
                if (!id) {
                    console.error('No restaurant ID provided');
                    return;
                }
                const data = await guestService.restaurant.getRestaurantById(restaurantId, location?.lat, location?.lng);
                setRestaurant(data);
                if (data.status !== RestaurantStatus.APPROVED) {
                    console.warn('Restaurant is not active:', data.status);
                }
                if (!data.foods || data.foods.length === 0) {
                    console.warn('No foods found for this restaurant');
                }
                setFoods(data.foods || []);
            } catch (error) {
                console.error('Failed to fetch restaurant data:', error);
            } finally {
                setLoading(false);
            }
        };

        getRestaurantData();
    }, [restaurantId]);

    if (loading) {
        return <RestaurantSkeleton />;
    }

    if (!restaurant) {
        return <div className="container py-10">Restaurant not found</div>;
    }

    return (
        <div className="pb-10 px-10">
            <RestaurantHeader restaurant={restaurant} />

            <div className="container mt-6">
                <RestaurantInfo restaurant={restaurant} />
                <h2 className="text-2xl font-bold mb-4">Thực đơn</h2>
                <p className="text-gray-500 mb-4">Chọn món ăn yêu thích của bạn từ thực đơn dưới đây.</p>
                
                <RestaurantMenu foods={foods} formatPrice={formatPrice} />
            </div>
        </div>
    );
}