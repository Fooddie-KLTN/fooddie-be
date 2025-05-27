import { Card } from "@/components/ui/card";
import { StarIcon, MapPinIcon, ClockIcon, ShoppingCartIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/cart-context";
import Image from "next/image";
import { FoodPreview } from "@/interface/index";

interface FoodCardProps {
    food: FoodPreview;
    formatPrice: (price: number) => string;
}

export default function FoodCard({ food, formatPrice }: FoodCardProps) {
    const { addToCart } = useCart();

    const handleAddToCart = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        // Add to cart using the food ID
        if (!food.id) {
            console.error("Food ID is missing");
            return;
        }
        addToCart(food.id);
    };

    const handleBuyNow = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        // Check if food ID is available
        if (!food.id) {
            console.error("Food ID is missing");
            return;
        }
        // Add to cart and redirect to checkout
        addToCart(food.id);

        // Redirect to checkout page
        window.location.href = "/checkout";
    };

    const handleOnClick = () => {
        // Redirect to food detail page
        window.location.href = `/food/${food.id}`;
    }
    
    // Calculate discounted price if applicable
    const finalPrice = food.discountPercent && food.discountPercent > 0
        ? Number(food.price) * (1 - food.discountPercent / 100)
        : Number(food.price);

    return (
        <Card className="overflow-hidden hover:shadow-lg transition-shadow group h-full max-w-sm cursor-pointer">
            <div className="relative h-48">
                <Image
                    src={food.image}
                    alt={food.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    onClick={handleOnClick}
                />
                
                {/* Popular badge */}
                {food.popular && (
                    <span className="absolute top-2 right-2 bg-primary text-white text-xs py-1 px-2 rounded-md z-10">
                        Popular
                    </span>
                )}
                
                {/* Discount badge */}
                {food.discountPercent && food.discountPercent > 0 && (
                    <span className="absolute top-2 left-2 bg-red-600 text-white text-xs py-1 px-2 rounded-md z-10">
                        -{food.discountPercent}%
                    </span>
                )}
                
                {/* Action buttons - positioned at bottom, visible on hover */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-3 py-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="grid grid-cols-2 gap-2">
                        <Button
                            onClick={handleAddToCart}
                            variant="outline"
                            size="sm"
                            className="flex items-center justify-center gap-1 bg-white/90 hover:text-primary hover:bg-white/80"
                        >
                            <ShoppingCartIcon className="h-3.5 w-3.5" />
                            Giỏ hàng
                        </Button>
                        <Button
                            onClick={handleBuyNow}
                            variant="default"
                            size="sm"
                            className="bg-primary hover:bg-white hover:text-primary"
                        >
                            Mua ngay
                        </Button>
                    </div>
                </div>
            </div>
            
            <div className="p-4" onClick={handleOnClick}>
                {/* Food name and rating */}
                <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg">{food.name}</h3>
                    <div className="flex items-center gap-1">
                        <StarIcon className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                        <span className="text-sm font-medium">{food.rating}</span>
                    </div>
                </div>
                <p className="text-sm text-gray-500 line-clamp-2 mb-3">{food.description}</p>
                <div className="flex justify-between items-center">
                    <div>
                        <span className="font-bold text-primary">{formatPrice(finalPrice)}</span>
                        {food.discountPercent && food.discountPercent > 0 && (
                            <span className="text-xs text-gray-400 line-through ml-2">
                                {formatPrice(Number(food.price))}
                            </span>
                        )}
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                            <MapPinIcon className="h-3 w-3" /> {food.restaurant?.name}
                        </p>
                        {food.restaurant?.deliveryTime && (
                            <p className="text-sm text-gray-500 flex items-center gap-1">
                                <ClockIcon className="h-3 w-3" /> {food.restaurant.deliveryTime} mins
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </Card>
    );
}