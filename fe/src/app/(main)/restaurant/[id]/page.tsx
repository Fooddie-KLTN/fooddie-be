'use client';

import { useState, useEffect } from 'react';
import { Restaurant, FoodPreview, RestaurantStatus } from '@/interface';
import { RestaurantSkeleton } from './_components/skeleton';
import { RestaurantHeader } from './_components/header';
import { RestaurantInfo } from './_components/info';
import { RestaurantMenu } from './_components/menu';
import { useParams } from 'next/navigation';


// Sample data for the restaurant and its foods
const sampleRestaurant: Restaurant = {
    id: '1',
    name: 'Nhà hàng Phố Đông',
    phoneNumber: '+84 123 456 789',
    backgroundImage: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1200',
    address: '123 Nguyễn Huệ, Quận 1, TP. HCM',
    avatar: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200&h=200',
    description: 'Nhà hàng Phố Đông mang đến những món ăn Á Đông đậm đà hương vị truyền thống, được chế biến từ nguyên liệu tươi ngon nhất. Không gian nhà hàng rộng rãi, sang trọng với phong cách hiện đại pha lẫn nét truyền thống Á Đông.',
    openTime: '07:00',
    closeTime: '22:00',
    status: RestaurantStatus.APPROVED,
    latitude: 10.782773,
    longitude: 106.700984,
    distance: '1.2 km',
    deliveryTime: '15-25'
};

const sampleFoods: FoodPreview[] = [
    {
        id: '1',
        name: 'Phở bò tái lăn',
        description: 'Phở bò với nước dùng đậm đà, thịt bò tái cùng các loại rau thơm',
        price: 75000,
        image: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=500',
        discountPercent: 0,
        rating: 4.8,
        popular: true,
        purchasedNumber: 1254,
        soldCount: 1254,
        restaurant: sampleRestaurant
    },
    {
        id: '2',
        name: 'Bún bò Huế',
        description: 'Bún bò Huế cay nồng với gia vị đặc trưng miền Trung',
        price: 85000,
        image: 'https://images.unsplash.com/photo-1625398407796-82650a8c135f?w=500',
        discountPercent: 10,
        rating: 4.7,
        popular: true,
        purchasedNumber: 968,
        soldCount: 968,
        restaurant: sampleRestaurant
    },
    {
        id: '3',
        name: 'Cơm gà Hải Nam',
        description: 'Cơm gà Hải Nam với gà luộc mềm, thơm và nước chấm đặc biệt',
        price: 68000,
        image: 'https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?w=500',
        discountPercent: 0,
        rating: 4.6,
        purchasedNumber: 746,
        soldCount: 746,
        restaurant: sampleRestaurant
    },
    {
        id: '4',
        name: 'Bánh xèo miền Trung',
        description: 'Bánh xèo giòn rụm với nhân tôm, thịt và giá đỗ',
        price: 65000,
        image: 'https://images.unsplash.com/photo-1632898395429-ac07567d576c?w=500',
        discountPercent: 15,
        rating: 4.5,
        purchasedNumber: 612,
        soldCount: 612,
        restaurant: sampleRestaurant
    },
    {
        id: '5',
        name: 'Nem nướng Nha Trang',
        description: 'Nem nướng thơm ngon kèm nước chấm đặc biệt và rau sống',
        price: 70000,
        image: 'https://images.unsplash.com/photo-1555126634-323283e090fa?w=500',
        discountPercent: 0,
        rating: 4.7,
        purchasedNumber: 587,
        soldCount: 587,
        restaurant: sampleRestaurant
    }
];

// Fake fetch function that returns sample data
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const fetchRestaurantData = async (id: string): Promise<{ restaurant: Restaurant, foods: FoodPreview[] }> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Return sample data
    return {
        restaurant: sampleRestaurant,
        foods: sampleFoods
    };
};

// Format price helper function
const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(price);
};

export default function RestaurantPage() {

    const { id } = useParams();
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
                const data = await fetchRestaurantData(restaurantId);
                setRestaurant(data.restaurant);
                setFoods(data.foods);
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