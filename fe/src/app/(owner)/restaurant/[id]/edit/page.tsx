'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { Restaurant } from '@/interface';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useRouter, useParams } from 'next/navigation';
import { userApi } from '@/api/user';

// --- End API Functions ---

export default function EditRestaurantPage() {
    const { user, getToken, loading: authLoading } = useAuth();
    const router = useRouter();
    const params = useParams();
    const restaurantId = Array.isArray(params.id) ? params.id[0] : params.id;
    
    const [restaurant, setRestaurant] = useState<Partial<Restaurant>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [navigated, setNavigated] = useState(false);

    // Fetch restaurant data and verify ownership
    useEffect(() => {
        if (authLoading) return;
        
        // Redirect to login if user isn't authenticated
        if (!user) {
            toast.error("Please login to access restaurant management");
            router.push('/unauthorized');
            return;
        }

        const loadRestaurant = async () => {
            setLoading(true);
            setError(null);
            try {
                const token = await getToken() ?? '';
                if (!token) {
                    toast.error("Failed to retrieve authentication token");
                    router.push('/unauthorized');
                    return;
                }
                if (!restaurantId) {
                    toast.error("Restaurant ID is required");
                    router.push('/not-found');
                    return;
                }   
                const fetchedRestaurant = await userApi.restaurant.getMyRestaurant(token);
                
                if (!fetchedRestaurant) {
                    toast.error("Restaurant not found");
                    router.push('/not-found');
                    return;
                }
                
                // Check if current user is the owner
                if (fetchedRestaurant.owner?.id !== user.id) {
                    toast.error("You don't have permission to manage this restaurant");
                    router.push('/unauthorized');
                    return;
                }
                
                setRestaurant(fetchedRestaurant);
            } catch (err) {
                console.error("Failed to fetch restaurant:", err);
                setError(err instanceof Error ? err.message : "An unknown error occurred.");
                toast.error("Failed to load restaurant data.");
            } finally {
                setLoading(false);
            }
        };

        loadRestaurant();
    }, [user, getToken, router, authLoading, restaurantId]);

    useEffect(() => {
        if (restaurant && !navigated) {
            setNavigated(true);
            router.push(`${window.location.pathname}/statistics`);
        }
    }, [restaurant, navigated, router]);

    // Loading state
    if (loading || authLoading) {
        return (
            <div className="container mx-auto px-4 py-10 flex flex-col items-center justify-center min-h-[300px]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-primary border-solid border-b-transparent mb-4"></div>
                <div className="text-center text-lg text-muted-foreground">Đang tải thông tin nhà hàng...</div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="container mx-auto px-4 py-10 text-center">
                <Card className="p-8 max-w-md mx-auto bg-red-50 border-red-200">
                    <CardHeader>
                        <CardTitle className="text-xl font-semibold text-red-700">Error Loading Management Page</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-red-600 mt-2">{error}</p>
                        <Button variant="destructive" onClick={() => window.location.reload()} className="mt-4">
                            Retry
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Render the main layout
    return (
        <div className="container mx-auto px-4 py-10 max-w-6xl">
            {/* Content will be rendered by the layout */}
        </div>
    );
}