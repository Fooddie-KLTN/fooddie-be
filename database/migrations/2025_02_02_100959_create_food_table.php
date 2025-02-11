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
        Schema::create('food', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->foreignId('restaurant_id')->constrained()->onDelete('cascade');
            $table->string('image')->nullable();
            $table->decimal('price', 10, 2);
            $table->text('description')->nullable();
            $table->foreignId('category_id')->constrained()->onDelete('cascade');
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->integer('quantity')->default(0);
            $table->integer('sold')->default(0);
            $table->integer('views')->default(0);
            $table->integer('likes')->default(0);
            $table->integer('dislikes')->default(0);
            $table->decimal('rating', 3, 2)->default(0);
            $table->integer('discount')->default(0);
            $table->integer('order')->default(0);
            $table->timestamps();
            $table->softDeletes();
        
            // Indexes
            $table->index(['status', 'restaurant_id']);
            $table->index('category_id');
            $table->index('rating');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('food');
    }
};
