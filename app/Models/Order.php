<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use app\Enums\Status;
class Order extends Model
{
    //
    use SoftDeletes;


    protected $fillable = [
        'user_id',
        'restaurant_id',
        'status',
        'total',
        'note',
        'phone',
        'payment_method',
        'payment_status',
        'delivered_at',
        'date',
        'promo_code',
    ];

    protected $attributes = [
        'status' => Status::PENDING,
        'payment_status' => 'unpaid',
        'payment_method' => 'cash',
        'total' => 0,
    ];

    protected $casts = [
        'total' => 'decimal:2',
        'date' => 'date',
        'delivered_at' => 'datetime',
    ];


    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function restaurant()
    {
        return $this->belongsTo(Restaurant::class);
    }

    public function orderItems()
    {
        return $this->hasMany(OrderItem::class);
    }

    public function promoCode()
    {
        return $this->belongsTo(Promotion::class);
    }
}
