<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Restaurant extends Model
{
    //
    use HasFactory;

    protected $fillable = [
        'user_id',
        'name',
        'phone',
        'email',
        'avatar',
        'cover',
        'description',
        'address',
        'license_number',
        'status'
    ];

    public function user() {
        return $this->belongsTo(User::class);
    }
    
    public function foods() {
        return $this->hasMany(Food::class);
    }
    
    public function certificates() {
        return $this->hasMany(Certificate::class);
    }

    public function orders()
    {
        return $this->hasMany(Order::class);
    }
}
