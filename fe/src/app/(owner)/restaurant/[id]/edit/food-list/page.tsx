"use client";

import { useEffect, useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FoodPreview } from "@/interface";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { userApi } from "@/api/user";
import { useAuth } from "@/context/auth-context";
import { Plus } from "lucide-react";

export default function FoodListPage() {
    const params = useParams();
    const router = useRouter();
    const { getToken } = useAuth();
    const restaurantId = Array.isArray(params.id) ? params.id[0] : params.id;
    const [foods, setFoods] = useState<FoodPreview[]>([]);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState<string | null>(null);

    const fetchFoods = async () => {
        if (!restaurantId) return;
        setLoading(true);
        await userApi.food.getFoodsByRestaurant(restaurantId)
            .then(fetchedFoods => { // fetchedFoods is the array of food items from the API
                const formattedFoods = fetchedFoods.map((food: FoodPreview) => ({
                    ...food,
                    price: parseFloat(food.price.toString()) // Convert price from string or number to number
                }));
                setFoods(formattedFoods);
            })
            .catch(() => setFoods([]))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        const token = getToken();
        if (!token) {
            router.push('/unauthorized');
            return;
        }
        setToken(token);
        if (!restaurantId) return;
        setLoading(true);
        fetchFoods();
    }, [restaurantId]);

    const handleToggle = async (foodId: string, checked: boolean) => {
        const newStatus = checked ? "available" : "unavailable";
        if (!token) return;
        await userApi.food.updateFoodStatus(token, foodId, newStatus);
        setFoods((prev) =>
            prev.map((food) =>
                food.id === foodId ? { ...food, status: newStatus } : food
            )
        );
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-2 md:px-0 relative">
            {/* Simplified header */}
            <div className="sticky top-0 z-30 flex items-center justify-between mb-8 px-4 md:px-8 py-4 mx-auto max-w-4xl">
                <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Danh sách món ăn</h1>
                <Button
                    onClick={() => router.push(`/restaurant/${restaurantId}/edit/food-list/create-food`)}
                    className="flex items-center gap-2 bg-primary text-white hover:text-primary transition-all px-5 py-2.5 rounded-lg shadow-md font-semibold text-base"
                >
                    <Plus size={20} />
                    <span>Thêm món</span>
                </Button>
            </div>
            <div className="border-b border-gray-200 mb-8 max-w-4xl mx-auto" />
            {loading ? (
                <div className="text-center text-base text-gray-500 mt-16 animate-pulse">Đang tải...</div>
            ) : (
                <div className="flex flex-col gap-6 max-w-4xl mx-auto">
                    {foods.map((food, idx) => (
                        <Card
                            key={food.id}
                            className="flex flex-col md:flex-row items-center gap-6 p-6 rounded-xl bg-white border border-gray-200 transition-all duration-200 animate-fade-in"
                            style={{ animationDelay: `${idx * 50}ms` }}
                        >
                            <div className="w-32 h-32 relative flex-shrink-0 overflow-hidden rounded-lg border border-gray-100 bg-gray-50">
                                <Image
                                    src={food.image}
                                    alt={food.name}
                                    width={128}
                                    height={128}
                                    className="object-cover w-full h-full"
                                />
                            </div>
                            <div className="flex-1 w-full flex flex-col justify-between">
                                <div>
                                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-1.5">
                                        <h2 className="font-semibold text-xl text-gray-800">{food.name}</h2>
                                        <Switch
                                            checked={food.status === "available"}
                                            onCheckedChange={(checked) => handleToggle(food.id!, checked)}
                                            id={`switch-${food.id}`}
                                        />
                                    </div>
                                    <p className="text-gray-600 text-sm mb-2.5 line-clamp-2">{food.description}</p>
                                    <div className="flex flex-wrap items-center gap-3 mb-2">
                                        <span className="text-primary font-semibold text-lg">{food.price.toLocaleString("vi-VN")}₫</span>
                                        {food.category && (
                                            <span className="bg-blue-50 text-blue-600 px-2.5 py-0.5 rounded-md text-xs font-medium">{food.category.name}</span>
                                        )}
                                        {food.tag && (
                                            <span className="bg-yellow-50 text-yellow-600 px-2.5 py-0.5 rounded-md text-xs font-medium">{food.tag}</span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex justify-end mt-4">
                                    <Button
                                        variant="outline"
                                        className="flex items-center gap-1.5 border-gray-300 text-gray-700 hover:bg-gray-100 transition rounded-lg px-4 py-1.5 text-sm font-medium"
                                        onClick={() => router.push(`/restaurant/${restaurantId}/edit/food-list/update-food/${food.id}`)}
                                    >
                                        <span>Sửa</span>
                                        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                                            <path d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-1.414.586H7v-3a2 2 0 01.586-1.414z"/>
                                        </svg>
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
            {/* Floating action button for mobile */}
            <Button
                onClick={() => router.push(`/restaurant/${restaurantId}/edit/food-list/create-food`)}
                className="fixed bottom-6 right-6 z-40 bg-primary text-white rounded-full shadow-lg p-3.5 md:hidden hover:bg-primary/90 transition"
                style={{ boxShadow: "0 6px 24px rgba(0,0,0,0.1)" }}
            >
                <Plus size={24} />
            </Button>
            {/* Fade-in animation */}
            <style jsx global>{`
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(20px);}
                    to { opacity: 1; transform: none;}
                }
                .animate-fade-in {
                    animation: fade-in 0.6s cubic-bezier(.4,0,.2,1) both;
                }
            `}</style>
        </div>
    );
}