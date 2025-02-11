<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('restaurants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained(); // Quản lý bởi user (admin/chủ nhà hàng)
            $table->string('name');
            $table->string('phone');
            $table->string('email');
            $table->string('avatar')->nullable();
            $table->string('cover')->nullable();
            $table->text('description')->nullable()->default('Mô tả nhà hàng'); // Mô tả nhà hàng
            $table->text('address');
            $table->string('license_number')->unique(); // Số giấy phép kinh doanh
            $table->enum('status', ['active', 'inactive'])->default('inactive');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('restaurants');
    }
};
