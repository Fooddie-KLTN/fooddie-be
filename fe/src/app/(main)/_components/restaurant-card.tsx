import React, { useState, useEffect } from 'react';
import { Restaurant, FoodPreview } from '@/interface';
import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Clock, Star, ChevronRight, ChevronLeft, ArrowRight, ShoppingBag } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/cart-context';

interface RestaurantCardProps {
    restaurants: Restaurant[];
    getFoods: (restaurantId: string) => FoodPreview[];
}

const RestaurantCard: React.FC<RestaurantCardProps> = ({ restaurants, getFoods }) => {
    const router = useRouter();
    const { addToCart } = useCart();
    const [activeIndex, setActiveIndex] = useState(0);
    const [isChanging, setIsChanging] = useState(false);
    const [direction, setDirection] = useState<'left' | 'right' | null>(null);
    const [showFoods, setShowFoods] = useState(false);

    const activeRestaurant = restaurants[activeIndex];

    const foods = activeRestaurant ? getFoods(activeRestaurant.id) : [];

    // Reset animations when restaurant changes
    useEffect(() => {
        setShowFoods(false);
        const timer = setTimeout(() => {
            setShowFoods(true);
        }, 300);
        return () => clearTimeout(timer);
    }, [activeIndex]);

    if (!activeRestaurant) return null; // or a loading state

    const nextRestaurant = () => {
        setIsChanging(true);
        setDirection('right');
        setActiveIndex((prevIndex) => (prevIndex + 1) % restaurants.length);
        setTimeout(() => setIsChanging(false), 500);
    };

    const prevRestaurant = () => {
        setIsChanging(true);
        setDirection('left');
        setActiveIndex((prevIndex) => (prevIndex - 1 + restaurants.length) % restaurants.length);
        setTimeout(() => setIsChanging(false), 500);
    };

    const handleFoodClick = (foodId: string | undefined) => {
        if (!foodId) return;
        router.push(`/food/${foodId}`);
    };

    const handleAddToCart = (e: React.MouseEvent, food: FoodPreview) => {
        e.stopPropagation(); // Prevent triggering parent onClick
        if (food.id) {
            addToCart(food.id);
        }
    };

    const handleBuyNow = (e: React.MouseEvent, food: FoodPreview) => {
        e.stopPropagation(); // Prevent triggering parent onClick
        if (food.id) {
            addToCart(food.id);
            // Navigate to cart/checkout page
            router.push('/checkout');
        }
    };

    return (
        <div className="w-full min-h-[500px] bg-white rounded-xl overflow-hidden shadow-xl border border-gray-100 flex flex-col md:flex-row">
            {/* Restaurant Info (Left Side) */}
            <div className="md:w-1/2 relative">
                {/* Background Image */}
                <div className="relative h-96 md:h-full">
                    <div className={`
                    w-full h-full transition-all duration-500 ease-in-out
                    ${isChanging ? 'scale-110 opacity-40' : 'scale-100 opacity-100'}
                `}>
                        <Image
                            src={activeRestaurant.backgroundImage || `https://source.unsplash.com/random/800x600/?restaurant-${activeRestaurant.id}`}
                            alt={activeRestaurant.name}
                            width={800}
                            height={800}
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-black/20"></div>
                </div>

                {/* Restaurant Info Overlay */}
                <div className="absolute inset-0 flex flex-col justify-end p-6 text-white">
                    <div className="absolute top-4 right-4 bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center animate-pulse">
                        <Star className="w-4 h-4 mr-1 fill-current" /> 4.8
                    </div>

                    <div className="mb-auto">
                        <div className="flex space-x-2 mb-2">
                            {restaurants.map((_, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setActiveIndex(idx)}
                                    className={`w-2 h-2 rounded-full transition-all duration-300 
                    ${idx === activeIndex ? 'bg-white scale-125' : 'bg-white/50 scale-100'}
                    hover:bg-white hover:scale-110
                  `}
                                    aria-label={`View restaurant ${idx + 1}`}
                                />
                            ))}
                        </div>
                    </div>

                    <div className={`
            transition-all duration-500 ease-out
            ${isChanging
                            ? `opacity-0 transform ${direction === 'right' ? 'translate-x-20' : '-translate-x-20'}`
                            : 'opacity-100 translate-x-0'
                        }
          `}>
                        <h1 className="text-3xl font-bold mb-2">{activeRestaurant.name}</h1>
                        <p className="text-gray-200 mb-4 line-clamp-3">{activeRestaurant.description}</p>

                        <div className="flex flex-wrap gap-4 mb-6">
                            <span className="flex items-center">
                                <MapPin className="w-5 h-5 mr-1 text-red-400" />
                                {activeRestaurant.distance}
                            </span>
                            <span className="flex items-center">
                                <Clock className="w-5 h-5 mr-1 text-yellow-400" />
                                {activeRestaurant.deliveryTime} phút
                            </span>
                        </div>

                        <div className="flex flex-wrap gap-2 mb-6">
                            <span className="bg-orange-500/20 text-orange-300 text-xs px-3 py-1 rounded-full transform transition-transform hover:scale-105">Fast Food</span>
                            <span className="bg-blue-500/20 text-blue-300 text-xs px-3 py-1 rounded-full transform transition-transform hover:scale-105">Delivery</span>
                            <span className="bg-green-500/20 text-green-300 text-xs px-3 py-1 rounded-full transform transition-transform hover:scale-105">Top Rated</span>
                        </div>

                        <Link
                            href={`/restaurant/${activeRestaurant.id}`}
                            className="bg-orange-500 hover:bg-orange-600 text-white py-3 px-6 rounded-lg text-center font-medium transition-all duration-300 inline-flex items-center justify-center w-full md:w-auto
                hover:shadow-lg hover:scale-105 active:scale-95"
                        >
                            Xem cửa hàng <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
                        </Link>
                    </div>
                </div>

                {/* Navigation Buttons */}
                <div className="absolute top-1/2 left-0 -translate-y-1/2 flex justify-between w-full px-4 z-10">
                    <button
                        onClick={prevRestaurant}
                        className="bg-black/30 hover:bg-black/50 text-white p-2 rounded-full transition-all duration-300 hover:scale-110 active:scale-90 hover:shadow-lg"
                        aria-label="Previous restaurant"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                        onClick={nextRestaurant}
                        className="bg-black/30 hover:bg-black/50 text-white p-2 rounded-full transition-all duration-300 hover:scale-110 active:scale-90 hover:shadow-lg"
                        aria-label="Next restaurant"
                    >
                        <ChevronRight className="w-6 h-6" />
                    </button>
                </div>
            </div>

            {/* Foods (Right Side) */}
            <div className="md:w-1/2 max-h-[800px] overflow-y-auto p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-800">Menu nổi tiếng</h2>
                    <Link
                        href={`/restaurant/${activeRestaurant.id}`}
                        className="text-orange-500 flex items-center text-sm font-medium hover:underline group transition-all"
                    >
                        View all <ChevronRight className="w-4 h-4 ml-1 transition-transform duration-300 group-hover:translate-x-1" />
                    </Link>
                </div>

                <div className="space-y-4">
                    {foods.length > 0 ? (
                        foods.map((food, index) => (
                            <div

                                onClick={() => handleFoodClick(food.id)}
                                key={food.id}
                                className={`flex border border-gray-100 rounded-xl p-3 hover:shadow-md transition-all duration-500 
                  hover:-translate-y-1 hover:border-orange-200 cursor-pointer
                  ${showFoods ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
                                style={{ transitionDelay: `${index * 150}ms` }}
                            >
                                <div className="h-24 w-24 rounded-lg overflow-hidden flex-shrink-0 relative group">
                                    <Image
                                        src={food.image}
                                        alt={food.name}
                                        width={96}
                                        height={96}
                                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                                    />
                                    <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                                </div>
                                <div className="ml-4 flex-grow">
                                    <div className="flex justify-between items-center mt-3">
                                        <p className="text-red-600 font-medium">
                                            {new Intl.NumberFormat('vi-VN').format(Number(food.price))} VND
                                        </p>
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={(e) => handleAddToCart(e, food)}
                                                className="bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-sm 
                    hover:bg-orange-600 hover:text-white transition-all duration-300
                    active:scale-95 hover:shadow-md flex items-center"
                                            >
                                                <ShoppingBag className="w-3 h-3 mr-1" />
                                                Thêm vào giỏ
                                            </button>
                                            <button
                                                onClick={(e) => handleBuyNow(e, food)}
                                                className="bg-red-500 text-white px-3 py-1 rounded-full text-sm 
                    hover:bg-red-600 transition-all duration-300
                    active:scale-95 hover:shadow-md"
                                            >
                                                Mua ngay
                                            </button>
                                        </div>
                                    </div>                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-10 text-gray-500 animate-pulse">
                           Không có món ăn nào trong menu của nhà hàng này.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RestaurantCard;