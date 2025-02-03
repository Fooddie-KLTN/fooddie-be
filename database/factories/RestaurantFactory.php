<?php

namespace Database\Factories;

use App\Models\Restaurant;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class RestaurantFactory extends Factory
{
    protected $model = Restaurant::class;

    public function definition()
    {
        return [
            'user_id' => User::factory(),
            'name' => $this->faker->company,
            'phone' => $this->faker->phoneNumber,
            'email' => $this->faker->unique()->safeEmail,
            'avatar' => $this->faker->imageUrl(200, 200, 'restaurant'),
            'cover' => $this->faker->imageUrl(800, 400, 'restaurant'),
            'description' => $this->faker->sentence(20),
            'address' => $this->faker->address,
            'license_number' => $this->faker->unique()->uuid,
            'status' => $this->faker->randomElement(['active', 'inactive']),
        ];
    }
}
