
import { ChangeEvent, FormEvent } from 'react';
import { Restaurant, RestaurantStatus } from '@/interface';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';

interface CommonInfoFormProps {
    restaurant: Partial<Restaurant>;
    handleInputChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    handleSubmit: (e: FormEvent<HTMLFormElement>) => void;
    saving: boolean;
    loading: boolean; // Pass loading state if needed for disabling button
    authLoading: boolean; // Pass auth loading state
    // Add handlers for file inputs if implemented
    // handleAvatarUpload: (e: ChangeEvent<HTMLInputElement>) => void;
    // handleBackgroundUpload: (e: ChangeEvent<HTMLInputElement>) => void;
}

export function CommonInfoForm({
    restaurant,
    handleInputChange,
    handleSubmit,
    saving,
    loading,
    authLoading
    // handleAvatarUpload,
    // handleBackgroundUpload
}: CommonInfoFormProps) {
    return (
        <form onSubmit={handleSubmit}>
            <Card className="shadow-lg border border-gray-100">
                <CardHeader>
                    <CardTitle className="text-xl font-semibold">Edit Common Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                    {/* Restaurant Name */}
                    <div>
                        <Label htmlFor="name" className="text-sm font-medium">Restaurant Name *</Label>
                        <Input
                            id="name"
                            name="name"
                            value={restaurant.name ?? ''}
                            onChange={handleInputChange}
                            placeholder="Your restaurant's name"
                            className="mt-1"
                            required
                            disabled={saving}
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <Label htmlFor="description" className="text-sm font-medium">Description</Label>
                        <Textarea
                            id="description"
                            name="description"
                            value={restaurant.description ?? ''}
                            onChange={handleInputChange}
                            placeholder="Tell customers about your restaurant"
                            className="mt-1"
                            rows={4}
                            disabled={saving}
                        />
                    </div>

                    {/* Address */}
                    <div>
                        <Label htmlFor="address" className="text-sm font-medium">Address *</Label>
                        <Input
                            id="address"
                            name="address"
                            value={restaurant.address ?? ''}
                            onChange={handleInputChange}
                            placeholder="Street, Ward, District, City"
                            className="mt-1"
                            required
                            disabled={saving}
                        />
                        {/* Consider using separate fields or a map component for better address handling */}
                    </div>

                    {/* Phone Number */}
                    <div>
                        <Label htmlFor="phoneNumber" className="text-sm font-medium">Phone Number</Label>
                        <Input
                            id="phoneNumber"
                            name="phoneNumber"
                            type="tel"
                            value={restaurant.phoneNumber ?? ''}
                            onChange={handleInputChange}
                            placeholder="Contact phone number"
                            className="mt-1"
                            disabled={saving}
                        />
                    </div>

                    {/* Opening Hours */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="openTime" className="text-sm font-medium">Opening Time</Label>
                            <Input
                                id="openTime"
                                name="openTime"
                                type="time"
                                value={restaurant.openTime ?? ''}
                                onChange={handleInputChange}
                                className="mt-1"
                                disabled={saving}
                            />
                        </div>
                        <div>
                            <Label htmlFor="closeTime" className="text-sm font-medium">Closing Time</Label>
                            <Input
                                id="closeTime"
                                name="closeTime"
                                type="time"
                                value={restaurant.closeTime ?? ''}
                                onChange={handleInputChange}
                                className="mt-1"
                                disabled={saving}
                            />
                        </div>
                    </div>

                    {/* Avatar Image */}
                    <div>
                        <Label htmlFor="avatar" className="text-sm font-medium">Avatar Image</Label>
                        {restaurant.avatar && (
                            <img src={restaurant.avatar} alt="Avatar Preview" className="mt-2 h-20 w-20 rounded-full object-cover border" />
                        )}
                        <Input
                            id="avatar"
                            name="avatar-upload" // Use a different name for the file input
                            type="file"
                            accept="image/*"
                            // onChange={handleAvatarUpload} // Add your upload handler here
                            className="mt-1"
                            disabled={saving}
                        />
                        <p className="text-xs text-gray-500 mt-1">Upload a square image for the best look.</p>
                    </div>

                    {/* Background Image */}
                    <div>
                        <Label htmlFor="backgroundImage" className="text-sm font-medium">Background Image</Label>
                        {restaurant.backgroundImage && (
                            <img src={restaurant.backgroundImage} alt="Background Preview" className="mt-2 h-32 w-full object-cover rounded border" />
                        )}
                        <Input
                            id="backgroundImage"
                            name="background-upload" // Use a different name
                            type="file"
                            accept="image/*"
                            // onChange={handleBackgroundUpload} // Add your upload handler here
                            className="mt-1"
                            disabled={saving}
                        />
                        <p className="text-xs text-gray-500 mt-1">Upload a landscape image (e.g., 1200x400).</p>
                    </div>

                    {/* Display Status (Read-only) */}
                    {restaurant.status && (
                        <div>
                            <Label className="text-sm font-medium">Current Status</Label>
                            <p className={`mt-1 text-sm font-semibold ${
                                restaurant.status === RestaurantStatus.APPROVED ? 'text-green-600' :
                                restaurant.status === RestaurantStatus.PENDING ? 'text-yellow-600' :
                                'text-red-600'
                            }`}>
                                {restaurant.status.toUpperCase()}
                            </p>
                            {restaurant.status === RestaurantStatus.PENDING && <p className="text-xs text-gray-500">Your restaurant is awaiting approval.</p>}
                            {restaurant.status === RestaurantStatus.REJECTED && <p className="text-xs text-gray-500">Your restaurant request was rejected. Contact support for details.</p>}
                        </div>
                    )}

                </CardContent>
                <CardFooter className="flex justify-end pt-6 border-t mt-6">
                    <Button type="submit" disabled={saving || loading || authLoading}>
                        {saving ? "Saving..." : "Save Common Info"}
                    </Button>
                </CardFooter>
            </Card>
        </form>
    );
}