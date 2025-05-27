'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Restaurant, FoodPreview } from '@/interface';
import { RestaurantHeader } from '../_components/header'; // Assuming header component exists
import FoodGrid from '../../../_components/ui/food-grid'; // Assuming FoodGrid component exists
import { Card } from '@/components/ui/card';
import { RestaurantSkeleton } from '../_components/skeleton'; // Assuming skeleton component exists
import { guestService } from '@/api/guest';


export default function AllRestaurantFoodsPage() {
    const params = useParams();
    const restaurantId = params.id as string;

    const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
    const [foods, setFoods] = useState<FoodPreview[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!restaurantId) {
            setError("Restaurant ID is missing.");
            setLoading(false);
            return;
        }

        const loadData = async () => {
            setLoading(true);
            setError(null);
            try {
                const fetchedRestaurant = await guestService.restaurant.getRestaurantById(restaurantId);
                const fetchedFoods = await guestService.food.getFoodsByRestaurant(restaurantId, 1, 100); // Fetching all foods
                if (!fetchedRestaurant) {
                    throw new Error("Restaurant not found.");
                }
                setRestaurant(fetchedRestaurant);
                setFoods(fetchedFoods.items || []);
            } catch (err) {
                console.error("Failed to fetch restaurant foods:", err);
                setError(err instanceof Error ? err.message : "An unknown error occurred.");
                setRestaurant(null);
                setFoods([]);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [restaurantId]);

    const formatPrice = (price: number): string => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    };

    if (loading) {
        return <RestaurantSkeleton />; // Show skeleton while loading
    }

    if (error) {
        return (
            <div className="container mx-auto px-4 py-10 text-center">
                <Card className="p-8 max-w-md mx-auto">
                    <h2 className="text-xl font-semibold text-red-600">Lỗi tải dữ liệu</h2>
                    <p className="text-gray-600 mt-2">{error}</p>
                </Card>
            </div>
        );
    }

    if (!restaurant) {
        return (
            <div className="container mx-auto px-4 py-10 text-center">
                <Card className="p-8 max-w-md mx-auto">
                    <h2 className="text-xl font-semibold">Không tìm thấy nhà hàng</h2>
                    <p className="text-gray-600 mt-2">Không thể tìm thấy thông tin cho nhà hàng này.</p>
                </Card>
            </div>
        );
    }

    return (
        <div className="pb-10">
            <RestaurantHeader restaurant={restaurant} />

            <div className="container mx-auto px-4 mt-8">
                <FoodGrid
                    foods={foods}
                    formatPrice={formatPrice}
                    name={`Tất cả món ăn từ ${restaurant.name}`}
                />
            </div>
        </div>
    );
}