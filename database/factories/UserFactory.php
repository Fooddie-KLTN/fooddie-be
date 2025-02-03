<?php

namespace Database\Factories;

use App\Enums\UserRole;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class UserFactory extends Factory
{
    protected static ?string $password;

    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'email_verified_at' => now(),
            'password' => static::$password ??= Hash::make('password'),
            'remember_token' => Str::random(10),
            
            // Thêm các trường mới
            'role' => UserRole::USER,
            'address' => fake()->address(),
            'phone_number' => fake()->phoneNumber(),
            'profile_photo_path' => null, // Hoặc fake()->imageUrl()
            'status' => fake()->boolean(90), // 90% chance là true
            'birthday' => fake()->dateTimeBetween('-60 years', '-18 years')->format('Y-m-d'),
        ];
    }

    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => [
            'email_verified_at' => null,
        ]);
    }

    // Thêm các state cho role
    public function asAdmin(): static
    {
        return $this->state(fn (array $attributes) => [
            'role' => UserRole::ADMIN,
        ]);
    }

    public function asShipper(): static
    {
        return $this->state(fn (array $attributes) => [
            'role' => UserRole::SHIPPER,
        ]);
    }

    // State cho trạng thái cụ thể
    public function active(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => true,
        ]);
    }

    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => false,
        ]);
    }
}