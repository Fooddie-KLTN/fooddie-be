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
            $table->foreignId('restaurant_id')->constrained();
            $table->string('image');
            $table->decimal('price', 10, 2);
            $table->text('description');
            $table->foreignId('category_id')->constrained();
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->integer('quantity')->default(0);
            $table->integer('sold')->default(0);
            $table->integer('views')->default(0);
            $table->integer('likes')->default(0);
            $table->integer('dislikes')->default(0);
            $table->integer('rating')->default(0);
            $table->integer('discount')->default(0);

            $table->timestamps();
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
