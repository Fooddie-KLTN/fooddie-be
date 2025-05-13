import React, { ChangeEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserProfile } from '@/interface';
import { BackendUser } from '@/api/auth';

interface PersonalInfoCardProps {
    profile: Partial<Omit<UserProfile, 'addresses'>>;
    user: BackendUser | null; // Pass the auth user for fallback display
    onInputChange: (e: ChangeEvent<HTMLInputElement>) => void;
    saving: boolean;
}

export const PersonalInfoCard: React.FC<PersonalInfoCardProps> = ({
    profile,
    onInputChange,
    saving,
}) => {
    return (
        <Card className="shadow-lg border border-gray-100 mb-8">
            <CardHeader>
                <CardTitle className="text-xl font-semibold">Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-center space-x-4">
                    <Avatar className="h-20 w-20">
                        <AvatarImage src={profile.avatar || ''} alt={profile.name || 'User'} />
                        <AvatarFallback>{(profile.name || 'U').substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    {/* Consider adding avatar upload functionality here */}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="name" className="text-sm font-medium">Full Name</Label>
                        <Input
                            id="name"
                            name="name"
                            value={profile.name ?? ''}
                            onChange={onInputChange}
                            placeholder="Your full name"
                            className="mt-1"
                            disabled={saving}
                        />
                    </div>
                    <div>
                        <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            value={profile.email ?? ''}
                            readOnly
                            placeholder="your.email@example.com"
                            className="mt-1 bg-gray-100 cursor-not-allowed"
                            disabled
                        />
                    </div>
                    <div>
                        <Label htmlFor="phone" className="text-sm font-medium">Phone Number</Label>
                        <Input
                            id="phone"
                            name="phone"
                            value={profile.phone ?? ''}
                            onChange={onInputChange}
                            placeholder="Your phone number"
                            className="mt-1"
                            disabled={saving}
                        />
                    </div>
                    <div>
                        <Label htmlFor="birthday" className="text-sm font-medium">Birthday</Label>
                        <Input
                            id="birthday"
                            name="birthday"
                            type="date"
                            value={profile.birthday ? profile.birthday.split('T')[0] : ''}
                            onChange={onInputChange}
                            className="mt-1"
                            disabled={saving}
                        />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};