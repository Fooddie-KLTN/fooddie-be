import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";
import Link from "next/link";

// Star rating component
const StarRating = ({ rating }: { rating: number }) => {
    const safeRating = Number(rating) || 0;
    return (
        <div className="flex items-center">
            {[1, 2, 3, 4, 5].map((star) => (
                <Star
                    key={star}
                    className={`h-4 w-4 ${star <= Math.round(safeRating)
                            ? "fill-yellow-400 text-yellow-400"
                            : "fill-gray-200 text-gray-200"
                        }`}
                />
            ))}
            <span className="ml-1 text-sm">{safeRating.toFixed(1)}</span>
        </div>
    );
};


interface ReviewsSectionProps {
    rating?: number;
    foodId: string;
    previewReviews?: {
        id: string;
        userName: string;
        rating: number;
        comment: string;
        date: string;
    }[];
}

export default function ReviewsSection({
    rating = 0,
    foodId,
    previewReviews = []
}: ReviewsSectionProps) {
    // Generate sample reviews if none provided
    const displayReviews = previewReviews.length > 0 ? previewReviews : [
        {
            id: "r1",
            userName: "Nguyễn Văn A",
            rating: 5,
            comment: "Món ăn rất ngon, giao hàng nhanh và đóng gói cẩn thận.",
            date: "2025-03-28"
        },
        {
            id: "r2",
            userName: "Trần Thị B",
            rating: 4,
            comment: "Chất lượng tốt, nhưng giao hàng hơi chậm một chút.",
            date: "2025-03-25"
        }
    ];

    return (
        <div className="py-6 border-t">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">Đánh giá và nhận xét</h3>
                <div className="flex items-center space-x-2">
                    <div className="flex items-center">
                        <StarRating rating={rating} />
                    </div>
                    <span className="text-gray-500">( đánh giá)</span>
                </div>
            </div>

            <div className="space-y-4 mb-4">
                {displayReviews.map(review => (
                    <div key={review.id} className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                            <div className="font-medium">{review.userName}</div>
                            <div className="flex items-center">
                            <StarRating rating={review.rating} />
                            </div>
                        </div>
                        <p className="text-sm text-gray-700">{review.comment}</p>
                        <div className="text-xs text-gray-500 mt-2">
                            {new Date(review.date).toLocaleDateString('vi-VN')}
                        </div>
                    </div>
                ))}
            </div>

            <Link href={`/food/${foodId}/reviews`}>
                <Button variant="outline" className="w-full">
                    Xem tất cả đánh giá
                </Button>
            </Link>
        </div>
    );
}