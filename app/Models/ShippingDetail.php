<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ShippingDetail extends Model
{
    //
    protected $fillable = [
        'order_id',
        'name',
        'phone',
        'address',
        'city',
        'postal_code',
        'country',
        'note',
    ];
}
