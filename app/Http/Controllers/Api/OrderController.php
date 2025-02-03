<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Food;
use App\Models\Promotion;

class OrderController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        //
        $request->validate([
            'user_id' => 'required|exists:users,id',
            'restaurant_id' => 'required|exists:restaurants,id',
            'items' => 'required|array', // [{food_id: 1, quantity: 2}]
        ]);
    
        // Tính tổng tiền
        $total = 0;
        foreach ($request->items as $item) {
            $food = Food::find($item['food_id']);
            $total += $food->price * $item['quantity'];
        }
    
        // Tạo đơn hàng
        $order = Order::create([
            'user_id' => $request->user_id,
            'restaurant_id' => $request->restaurant_id,
            'total_price' => $total,
            'status' => 'pending',
        ]);
    
        // Thêm các món vào order_items
        foreach ($request->items as $item) {
            OrderItem::create([
                'order_id' => $order->id,
                'food_id' => $item['food_id'],
                'quantity' => $item['quantity'],
                'price' => Food::find($item['food_id'])->price,
            ]);
        }
    
        if ($request->promotion_code) {
            $promotion = Promotion::where('code', $request->promotion_code)
                ->where('expiry', '>', now())
                ->first();
        
            if ($promotion) {
                $total = $total * (1 - $promotion->discount_percent / 100);
            }
        }
        return response()->json($order, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
    }
}
