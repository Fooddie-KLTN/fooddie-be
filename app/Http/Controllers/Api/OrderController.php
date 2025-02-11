<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Food;
use App\Models\Promotion;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class OrderController extends Controller
{
    /**
     * Lấy danh sách tất cả đơn hàng
     */
    public function index()
    {
        return response()->json(Order::with('orderItems.food')->get(), 200);
    }

    /**
     * Tạo một đơn hàng mới cùng với order items
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'user_id' => 'required|exists:users,id',
            'restaurant_id' => 'required|exists:restaurants,id',
            'phone' => 'required|string|max:15',
            'payment_method' => 'required|string|in:cash,credit_card,momo',
            'order_items' => 'required|array',
            'order_items.*.food_id' => 'required|exists:foods,id',
            'order_items.*.quantity' => 'required|integer|min:1',
            'promo_code' => 'nullable|string|exists:promotions,code',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        return DB::transaction(function () use ($request) {
            $total = 0;
            $orderItems = [];

            // Tạo đơn hàng mới
            $order = Order::create([
                'user_id' => $request->user_id,
                'restaurant_id' => $request->restaurant_id,
                'status' => 'pending',
                'total' => 0,
                'note' => $request->note ?? null,
                'phone' => $request->phone,
                'payment_method' => $request->payment_method,
                'payment_status' => 'unpaid',
                'date' => now(),
                'promo_code' => $request->promo_code ?? null,
            ]);

            // Xử lý từng món ăn trong order items
            foreach ($request->order_items as $item) {
                $food = Food::findOrFail($item['food_id']);
                $price = $food->price * $item['quantity'];
                $total += $price;

                $orderItems[] = [
                    'order_id' => $order->id,
                    'food_id' => $food->id,
                    'quantity' => $item['quantity'],
                    'price' => $price,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];

                // Cập nhật số lượng món đã bán
                $food->increment('sold', $item['quantity']);
            }

            // Lưu order items vào database
            OrderItem::insert($orderItems);

            // Nếu có mã giảm giá, áp dụng
            if ($request->promo_code) {
                $promo = Promotion::where('code', $request->promo_code)->first();
                if ($promo) {
                    $discountAmount = min($total * ($promo->discount / 100), $promo->max_discount);
                    $total -= $discountAmount;
                }
            }

            // Cập nhật tổng tiền đơn hàng
            $order->update(['total' => $total]);

            return response()->json($order->load('orderItems.food'), 201);
        });
    }

    /**
     * Hiển thị thông tin chi tiết một đơn hàng
     */
    public function show($id)
    {
        $order = Order::with('orderItems.food')->find($id);

        if (!$order) {
            return response()->json(['message' => 'Order not found'], 404);
        }

        return response()->json($order, 200);
    }

    /**
     * Cập nhật trạng thái đơn hàng
     */
    public function update(Request $request, $id)
    {
        $order = Order::find($id);

        if (!$order) {
            return response()->json(['message' => 'Order not found'], 404);
        }

        $validator = Validator::make($request->all(), [
            'status' => 'sometimes|required|string|in:pending,processing,completed,cancelled',
            'payment_status' => 'sometimes|required|string|in:paid,unpaid',
            'delivered_at' => 'nullable|date',
            'note' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $order->update($request->all());

        return response()->json($order->load('orderItems.food'), 200);
    }

    /**
     * Xóa đơn hàng (và hoàn trả số lượng món đã bán)
     */
    public function destroy($id)
    {
        $order = Order::with('orderItems')->find($id);

        if (!$order) {
            return response()->json(['message' => 'Order not found'], 404);
        }

        return DB::transaction(function () use ($order) {
            foreach ($order->orderItems as $item) {
                $food = Food::find($item->food_id);
                if ($food) {
                    $food->decrement('sold', $item->quantity);
                }
            }

            $order->orderItems()->delete();
            $order->delete();

            return response()->json(['message' => 'Order deleted successfully'], 200);
        });
    }
}
