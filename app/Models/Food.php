<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Food extends Model
{
    use HasFactory;

    // The $fillable property specifies which attributes should be mass-assignable.
    protected $fillable = [
        'name',
        'restaurant_id',
        'image',
        'price',
        'description',
        'category_id',
        'status',
        'quantity',
        'sold',
        'views',
        'likes',
        'dislikes',
        'rating',
        'discount',
    ];

    public function restaurant()
    {
        return $this->belongsTo(Restaurant::class);
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function orderItems()

    {
        return $this->hasMany(OrderItem::class);
    }

    public function reviews()
    {
        return $this->hasMany(Review::class);
    }
}
