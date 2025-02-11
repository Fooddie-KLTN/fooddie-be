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
        'status',
        'open_time',
        'close_time',
    ];
    protected $attributes = [
        'status' => 'inactive', //  Đặt mặc định nếu không có giá trị
        'open_time' => '07:00',
        'close_time' => '22:00',
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
