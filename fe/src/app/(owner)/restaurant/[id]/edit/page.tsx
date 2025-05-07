'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { Restaurant, RestaurantStatus } from '@/interface';
// Remove direct UI imports if they are only used in child components now
// import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label';
// import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button'; // Keep Button if used outside form
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; // Keep Card if used for error/loading
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

// TODO: Import a header component when created
// import { RestaurantHeaderEdit } from './_components/RestaurantHeaderEdit';

// --- Mock API Functions (Keep as is for now) ---
async function fetchMyRestaurant(token: string): Promise<Restaurant | null> {
    console.log(token);
    // Fake fetch: simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
        id: 'rest_owner_123',
        name: 'My Awesome Cafe',
        phoneNumber: '0987654321',
        backgroundImage: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1200',
        address: '456 Owner St, District 10, City',
        avatar: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200&h=200',
        description: 'The best coffee and pastries in town. Owned by me!',
        openTime: '08:00',
        closeTime: '18:00',
        status: RestaurantStatus.APPROVED,
    };
}


// --- End Mock API Functions ---

export default function EditRestaurantPage() {
    const { user, getToken, loading: authLoading } = useAuth();
    const router = useRouter();
    const [, setRestaurant] = useState<Partial<Restaurant>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Add: Track if navigation has happened
    const [navigated, setNavigated] = useState(false);

    // Fetch restaurant data on load (Keep useEffect as is)
    useEffect(() => {
        if (authLoading) return;

        const loadRestaurant = async () => {
            setLoading(true);
            setError(null);
            try {
                const token = await getToken() ?? ''; // Use nullish coalescing
                const fetchedRestaurant = await fetchMyRestaurant(token);
                if (!fetchedRestaurant) {
                    toast.info("No restaurant found. You might need to create one first.");
                    setRestaurant({});
                } else {
                    setRestaurant(fetchedRestaurant);
                    // Navigate to statistics page after fetching
                    if (!navigated) {
                        setNavigated(true);
                        router.push(`${window.location.pathname}/statistics`);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch restaurant:", err);
                setError(err instanceof Error ? err.message : "An unknown error occurred.");
                toast.error("Failed to load restaurant data.");
            } finally {
                setLoading(false);
            }
        };

        loadRestaurant();
    }, [user, getToken, router, authLoading, navigated]); // Keep dependencies


    // Keep Loading state
    if (loading || authLoading) {
        return (
            <div className="container mx-auto px-4 py-10 flex flex-col items-center justify-center min-h-[300px]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-primary border-solid border-b-transparent mb-4"></div>
                <div className="text-center text-lg text-muted-foreground">Đang tải thông tin nhà hàng...</div>
            </div>
        );
    }

    // Keep Error state
    if (error) {
        return (
            <div className="container mx-auto px-4 py-10 text-center">
                <Card className="p-8 max-w-md mx-auto bg-red-50 border-red-200">
                    <CardHeader>
                        <CardTitle className="text-xl font-semibold text-red-700">Error Loading Management Page</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-red-600 mt-2">{error}</p>
                        {/* Optional: Add a retry button */}
                        <Button variant="destructive" onClick={() => window.location.reload()} className="mt-4">
                            Retry
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Render the main layout with Tabs and Components
    return (
        <div className="container mx-auto px-4 py-10 max-w-6xl"> {/* Optional: Wider container */}

        </div>
    );
}