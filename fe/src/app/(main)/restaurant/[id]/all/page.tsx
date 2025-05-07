'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Restaurant, FoodPreview } from '@/interface';
import { RestaurantHeader } from '../_components/header'; // Assuming header component exists
import FoodGrid from '../../../_components/ui/food-grid'; // Assuming FoodGrid component exists
import { Card } from '@/components/ui/card';
import { RestaurantSkeleton } from '../_components/skeleton'; // Assuming skeleton component exists

// Mock function to fetch all foods for a restaurant (replace with actual API call)
async function fetchAllRestaurantFoods(restaurantId: string): Promise<{ restaurant: Restaurant | null, foods: FoodPreview[] }> {
    console.log(`Fetching all foods for restaurant ID: ${restaurantId}`);
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // --- Replace with actual API call ---
    // Find the restaurant details (using sample data for now)
    const foundRestaurant = sampleRestaurants.find(r => r.id === restaurantId);
    // Find all foods for that restaurant (using sample data for now)
    const foundFoods = sampleFoodItems.filter(f => f.restaurant.id === restaurantId);
    // --- End Replace ---

    if (!foundRestaurant) {
        console.error(`Restaurant with ID ${restaurantId} not found.`);
        return { restaurant: null, foods: [] };
    }

    return {
        restaurant: foundRestaurant,
        foods: foundFoods
    };
}

// Sample Data (Replace with imports or context if available)
const sampleRestaurants: Restaurant[] = [
    { id: "hub-1", name: "Burger Hub", description: "Nơi phục vụ burger ngon nhất thành phố.", distance: "1.5 km", deliveryTime: "15-25", avatar: 'https://source.unsplash.com/random/200x200/?restaurantlogo', backgroundImage: 'https://source.unsplash.com/random/1200x400/?restaurantinterior' },
    { id: "palace-1", name: "Pizza Palace", description: "Pizza truyền thống với hương vị tuyệt vời.", distance: "2.0 km", deliveryTime: "20-35", avatar: 'https://source.unsplash.com/random/200x200/?restaurantlogo', backgroundImage: 'https://source.unsplash.com/random/1200x400/?restaurantinterior' },
    { id: "sushi-1", name: "Sushi Master", description: "Sushi tươi ngon, được làm từ nguyên liệu chất lượng.", distance: "1.8 km", deliveryTime: "25-40", avatar: 'https://source.unsplash.com/random/200x200/?restaurantlogo', backgroundImage: 'https://source.unsplash.com/random/1200x400/?restaurantinterior' },
];
const sampleFoodItems: FoodPreview[] = [
    { id: "1", name: "Hamburger Phô Mai Cổ Điển", description: "Bánh burger bò với phô mai cheddar.", price: 89000, image: "https://source.unsplash.com/random/300x200/?cheeseburger", category: { id: "1", name: "Burgers" }, rating: 4.8, popular: true, restaurant: { id: "hub-1", name: "Burger Hub", deliveryTime: "15-25" }, status: "available" },
    { id: "2", name: "Pizza Margherita", description: "Pizza truyền thống với sốt cà chua và phô mai mozzarella.", price: 120000, image: "https://source.unsplash.com/random/300x200/?pizza", category: { id: "2", name: "Pizza" }, rating: 4.5, popular: true, restaurant: { id: "palace-1", name: "Pizza Palace", deliveryTime: "20-35" }, status: "available" },
    { id: "3", name: "Combo Sushi", description: "Hỗn hợp nigiri và cuộn maki tươi.", price: 180000, image: "https://source.unsplash.com/random/300x200/?sushi", category: { id: "3", name: "Sushi" }, rating: 4.9, popular: true, restaurant: { id: "sushi-1", name: "Sushi Master", deliveryTime: "25-40" }, status: "available" },
    { id: "4", name: "Burger Gà Giòn", description: "Burger gà rán giòn tan.", price: 79000, image: "https://source.unsplash.com/random/300x200/?chickenburger", category: { id: "1", name: "Burgers" }, rating: 4.6, popular: false, restaurant: { id: "hub-1", name: "Burger Hub", deliveryTime: "15-25" }, status: "available" },
    { id: "5", name: "Pizza Hải Sản", description: "Pizza với tôm, mực, và nghêu.", price: 150000, image: "https://source.unsplash.com/random/300x200/?seafoodpizza", category: { id: "2", name: "Pizza" }, rating: 4.7, popular: true, restaurant: { id: "palace-1", name: "Pizza Palace", deliveryTime: "20-35" }, status: "available" },
];
// --- End Sample Data ---

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
                const { restaurant: fetchedRestaurant, foods: fetchedFoods } = await fetchAllRestaurantFoods(restaurantId);
                if (!fetchedRestaurant) {
                    throw new Error("Restaurant not found.");
                }
                setRestaurant(fetchedRestaurant);
                setFoods(fetchedFoods);
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