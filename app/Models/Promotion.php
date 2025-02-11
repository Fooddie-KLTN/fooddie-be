<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Promotion extends Model
{
    //
    protected $fillable = [
        'name',
        'image',
        'description',
        'discount',
        'start_date',
        'end_date',
    ];

    public function Order()
    {
        return $this->hasMany(Order::class);
    }

}
