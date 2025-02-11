<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Food extends Model
{

    // The $fillable property specifies which attributes should be mass-assignable.
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'restaurant_id',
        'image',
        'price',
        'description',
        'category_id',
        'status',
        'quantity',
        'order',
    ];

    protected $attributes = [
        'status' => 'active',
        'quantity' => 0,
        'sold' => 0,
        'views' => 0,
        'likes' => 0,
        'dislikes' => 0,
        'rating' => 0,
        'discount' => 0,
        'order' => 0,
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'rating' => 'decimal:2',
        'quantity' => 'integer',
        'sold' => 'integer',
        'views' => 'integer',
        'likes' => 'integer',
        'dislikes' => 'integer',
        'discount' => 'integer',
        'order' => 'integer',
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
