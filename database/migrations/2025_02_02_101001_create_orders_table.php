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
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained();
            $table->foreignId('restaurant_id')->constrained();
            $table->enum('status', ['pending', 'processing', 'delivering', 'completed', 'cancelled'])->default('pending');
            $table->decimal('total', 10, 2);
            $table->text('note')->nullable();
            $table->string('phone');
            $table->enum('payment_method', ['cash', 'credit_card', 'momo'])->default('cash');
            $table->enum('payment_status', ['paid', 'unpaid'])->default('unpaid');
            $table->string('promo_code')->nullable();
            $table->date('date');
            $table->timestamp('delivered_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
        
            // Indexes
            $table->index(['status', 'restaurant_id']);
            $table->index(['user_id', 'status']);
            $table->index('payment_status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
