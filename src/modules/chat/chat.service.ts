import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import axios from 'axios';
import { FoodService } from '../food/food.service';
import { OrderService } from '../order/order.service';
import { AddressService } from '../address/address.service';
import { RestaurantService } from '../restaurant/restaurant.service';
import { pubSub } from 'src/pubsub';

@Injectable()
export class ChatService {

  constructor(
    private readonly foodService: FoodService,
    private readonly orderService: OrderService,
    private readonly addressService: AddressService,
    private readonly restaurantService: RestaurantService,
  ) {
  }

  async generateReply(userMessage: string, userId: string, metadata: any): Promise<{
    reply: string;
    suggestions?: {
      id: string;
      name: string;
      price: number;
      image: string;
      link: string;
    }[];
    action?: string;
    metadata?: any;
  }> {
    try {
      // Nếu không có metadata, khởi tạo mặc định
      if (!metadata) {
        metadata = {
          orderItems: [],
          addresses: [],
          isOrdering: false,
          isFoodConfirmed: false,
          isRestaurantConfirmed: false,
          isAddressConfirmed: false,
          isPaymentConfirmed: false,
        };
      }
      console.log('[generateReply] Metadata:', JSON.stringify(metadata, null, 2));
      const restaurantList = await this.restaurantService.findAll();
      // Lấy thực đơn và lịch sử đơn hàng của người dùng
      const [menu, orderHistory] = await Promise.all([
        this.foodService.getMenuForUser(userId),
        this.orderService.getOrderHistory(userId, 1, 5),
      ]);

      const orderedFoods = orderHistory.items.flatMap(order =>
        order.orderDetails.map(detail => detail.foodName)
      );

      const menuFlat = menu.flatMap(r =>
        r.foods.map(f => ({
          id: f.id,
          name: f.name,
          price: f.price,
          description: f.description,
          image: f.image || 'https://via.placeholder.com/80x80',
          link: `http://localhost:3000/food/${f.id}`,
          restaurantId: f.restaurantId,
        }))
      );

      // Kiểm tra nếu người dùng muốn hủy
      if (userMessage.toLowerCase() === 'hủy') {
        const resetMetadata = {
          orderItems: [],  // Reset các món đã chọn
          addresses: [],    // Reset địa chỉ
          isOrdering: false, // Reset trạng thái đặt món
          isFoodConfirmed: false, // Reset trạng thái xác nhận món
          isRestaurantConfirmed: false, // Reset trạng thái xác nhận cửa hàng
          isAddressConfirmed: false, // Reset trạng thái xác nhận địa chỉ
          isPaymentConfirmed: false, // Reset trạng thái xác nhận thanh toán
        };      
        return {
          reply: 'Quy trình đã bị hủy. Bạn muốn thực hiện hành động khác không?',
          action: 'cancelOrder',
          metadata: resetMetadata,
        };
      }

      // Kiểm tra yêu cầu "đặt món" hoặc "đặt đơn"
      const isOrderRequest = userMessage.toLowerCase().includes('đặt món') || userMessage.toLowerCase().includes('đặt đơn');

      if (isOrderRequest && !metadata.isOrdering) {
        metadata.isOrdering = true;
        return {
          reply: 'Vui lòng cho mình biết bạn muốn đặt món gì?',
          action: 'orderItems',
          metadata,
        };
      }

      // Kiểm tra món ăn được thêm vào và xác nhận cửa hàng
      if (metadata.isOrdering && !metadata.isFoodConfirmed) {
        if (userMessage.toLowerCase().includes('xác nhận') || userMessage.toLowerCase().includes('tiếp tục') || userMessage.toLowerCase().includes('có')) {
          // Nếu có, thì cập nhật metadata.isFoodConfirmed thành true
          metadata.isFoodConfirmed = true;
          userMessage = '';
          // Chuyển sang bước tiếp theo mà không hỏi lại
          return this.generateReply(userMessage, userId, metadata);
      }
        const prompt = `
        Người dùng yêu cầu món ăn. Dựa trên thực đơn của nhà hàng, hãy phân tích và xác định các món ăn mà người dùng muốn đặt.
      
        Người dùng nói: "${userMessage}"
      
        Món ăn có trong thực đơn:
        ${JSON.stringify(menuFlat)}
      
        Hãy chỉ trả về dữ liệu JSON hợp lệ, không thêm bất kỳ văn bản nào khác. Cấu trúc JSON cần phải bao gồm thông tin như "foodId", "name", "quantity", và "price". Ví dụ:
        [
          {
            "id": "Id món ăn",
            "name": "Tên món ăn",
            "quantity": "Số lượng",
            "price": "Giá món"
            "restaurantId": "ID nhà hàng"
          },
          {
            "id": "ID món ăn",
            "name": "Tên món ăn",
            "quantity": "Số lượng",
            "price": "Giá món"
            "restaurantId": "ID nhà hàng"
          }
        ]
      
        Nếu không thể xác định được số lượng, mặc định là 1.
        Nếu món ăn không có trong thực đơn, hãy trả về dữ liệu JSON rỗng.
      `;

          const response = await this.callGemini(prompt);
          console.log('[RESPONSE FROM GEMINI]', response);
          const jsonResponse = response.replace(/^```json\n|\n```$/g, '');
          const foodList = JSON.parse(jsonResponse);
          console.log('[PARSED FOOD LIST]', foodList);

          const currentRestaurantId = metadata.orderItems.length > 0 ? metadata.orderItems[0].restaurantId : null;

          const differentRestaurant = foodList.some(food => {
            if (!currentRestaurantId) return false;  // Nếu chưa có món nào, không kiểm tra
            return food.restaurantId !== currentRestaurantId;  // So sánh nhà hàng của món mới với món đã có
          });
        
          if (differentRestaurant) {
            return {
              reply: 'Các món bạn chọn thuộc cửa hàng khác nhau. Vui lòng chọn món từ cùng một cửa hàng.',
              action: 'retryOrder',
              metadata,
            };
          }
          foodList.forEach(food => {
            metadata.orderItems.push({
              id: food.id,
              name: food.name,
              quantity: food.quantity || 1,
              price: food.price,
              restaurantId: food.restaurantId,
            });
          });

          const currentOrderSummary = metadata.orderItems.map(item => `${item.quantity} ${item.name}`).join(', ');
          console.log('[CURRENT ORDER ITEMS]', metadata.orderItems);
          console.log('[CURRENT ORDER SUMMARY]', currentOrderSummary);

          return {
            reply: `Đơn hàng hiện tại của bạn là: ${currentOrderSummary}. Bạn có muốn tiếp tục không?`,
            action: 'confirmOrder',
            metadata,
          };
      }

      // Nếu đã xác nhận món ăn, xác nhận cửa hàng
      if (metadata.isFoodConfirmed && !metadata.isRestaurantConfirmed) {
        if (userMessage.toLowerCase().includes('xác nhận') || userMessage.toLowerCase().includes('tiếp tục') || userMessage.toLowerCase().includes('có')) {
          // Nếu có, thì cập nhật metadata.isFoodConfirmed thành true
          console.log('[CONFIRMING RESTAURANT]');
          metadata.isRestaurantConfirmed = true;
          userMessage = '';
          // Chuyển sang bước tiếp theo mà không hỏi lại
          return this.generateReply(userMessage, userId, metadata);
      }
      const restaurantId = metadata.orderItems[0]?.restaurantId;
      console.log('[RESTAURANT ID]', restaurantId);
      const restaurantName = await this.restaurantService.getNameById(restaurantId);
      console.log('[RESTAURANT NAMES]', restaurantName);

  
      // Chuyển sang bước tiếp theo mà không hỏi lại
      return {
        reply: `Món ăn đã được xác nhận. Bạn muốn giao hàng từ cửa hàng ${restaurantName} phải không?`,
        action: 'confirmRestaurant',
        metadata,
      };
      }

      // Xác nhận địa chỉ
      if (metadata.isRestaurantConfirmed && !metadata.isAddressConfirmed) {
        // Kiểm tra xem người dùng đã nhập "xác nhận", "tiếp tục" hay "có"
        if (userMessage.toLowerCase().includes('xác nhận') || userMessage.toLowerCase().includes('tiếp tục') || userMessage.toLowerCase().includes('có')) {
          console.log('[CONFIRMING ADDRESS]');
          metadata.isAddressConfirmed = true; // Đánh dấu là đã xác nhận địa chỉ
          userMessage = ''; // Reset message để không bị lặp lại
          return this.generateReply(userMessage, userId, metadata); // Tiến tới bước tiếp theo
        }
      
        // Lấy danh sách địa chỉ của người dùng
        metadata.addresses = await this.addressService.getAddresseByUser(userId);
      
        // Hiển thị địa chỉ dưới dạng danh sách có số thứ tự
        const addressList = metadata.addresses
        .map((address, index) => `${index + 1}. ${address.street}, ${address.ward}, ${address.district}, ${address.city}`)
      
      
        // Kiểm tra xem người dùng đã chọn địa chỉ chưa (dựa trên số thứ tự nhập vào)
        const addressIndex = parseInt(userMessage) - 1;  // Chuyển đổi input của người dùng thành index
        if (addressIndex >= 0 && addressIndex < metadata.addresses.length) {
          // Nếu người dùng chọn đúng địa chỉ, tiến hành xác nhận
          const selectedAddress = metadata.addresses[addressIndex];
          return {
            reply: `Bạn đã chọn địa chỉ: ${selectedAddress.street}, ${selectedAddress.ward}, ${selectedAddress.district}, ${selectedAddress.city}. Bạn có xác nhận địa chỉ này không?`,
            action: 'confirmAddress',  // Tiến hành xác nhận địa chỉ
            metadata: {
              ...metadata,
              selectedAddress,  // Lưu địa chỉ đã chọn vào metadata
            },
          };
        }
      
        // Nếu người dùng chưa chọn địa chỉ, yêu cầu chọn địa chỉ bằng số thứ tự
        return {
          reply: `Đơn hàng hiện tại của bạn là ${metadata.orderItems.map(item => `${item.quantity} ${item.name}`).join(', ')}. Bạn muốn giao đến địa chỉ nào trong số các địa chỉ sau?\n${addressList}\nVui lòng chọn số thứ tự của địa chỉ.`,
          action: 'chooseAddress',  // Thực hiện hành động chọn địa chỉ
          metadata,
        };
      }
      

      // Xác nhận phương thức thanh toán
      if (metadata.isAddressConfirmed && !metadata.isPaymentConfirmed) {
        const paymentMethod = userMessage.toLowerCase().includes('cod') ? 'cod' : 'card';
        console.log("restaurant ID", metadata.orderItems[0]?.restaurantId);
        const orderData = {
          userId: userId,
          restaurantId: metadata.orderItems[0]?.restaurantId, 
          addressId: metadata.addresses[0],
          orderDetails: metadata.orderItems.map(item => ({
            foodId: item.id,
            name: item.name,
            quantity: item.quantity.toString(),
            price: item.price,
          })),
          paymentMethod,
          promotionCode: undefined,
        };
        console.log('[ORDER DATA]', orderData);

        const orderResponse = await this.orderService.createOrder(orderData);
        await pubSub.publish('orderCreated', { 
          orderCreated: orderResponse 
        });

        metadata.isPaymentConfirmed = false;
        metadata.isOrdering = false;
        metadata.isFoodConfirmed = false;
        metadata.isRestaurantConfirmed = false;
        metadata.isAddressConfirmed = false;
        metadata.orderItems = [];

        return {
          reply: `Đơn hàng của bạn đã được tạo thành công. Bạn có thể xem chi tiết đơn hàng tại: http://localhost:3000/order/${orderResponse.id}. Tổng tiền: ${orderResponse.total}. Cảm ơn bạn đã sử dụng dịch vụ của Foodie <3.`,
          action: 'placeOrder',
          metadata: { orderId: orderResponse.id, total: orderResponse.total, ...metadata },
        };
      }

      // 7. Nếu câu hỏi không liên quan đến đặt món, sử dụng Gemini để trả lời câu hỏi khác
      const prompt = `
        Bạn là FoodieBot – một trợ lý đặt món thân thiện. 
        Dưới đây là thực đơn hiện tại (dạng JSON):
        ${JSON.stringify(menuFlat)}
        Lịch sử món người dùng đã từng đặt: ${orderedFoods.join(', ')}

        Người dùng nói: "${userMessage}"

        Hãy phân tích ý định người dùng và phản hồi theo format sau (JSON):
        {
          "reply": "Câu trả lời ngắn gọn, lịch sự, không dùng từ cảm thán như 'Tuyệt vời!', 'Xuất sắc!', v.v. Hãy bắt đầu trực tiếp vào nội dung, ví dụ: 'Dựa trên sở thích của bạn, chúng tôi gợi ý...'.",
          "suggestions": [ { "id": "...", "name": "...", "price": ..., "image": "...", "link": "..." }, ... ],
          "action": asking
          "metadata": {}
        }
      `;

      const raw = await this.callGemini(prompt);
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) {
        return {
          reply: raw,
          suggestions: [],
        };
      }

      const parsed = JSON.parse(match[0]);

      return {
        reply: parsed.reply || raw,
        suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
        action: parsed.action || null,
        metadata: parsed.metadata || null,
      };
    } catch (err) {
      console.error('[generateReply] Lỗi:', err.message);
      throw new Error('Không thể tạo phản hồi từ hệ thống.');
    }
  }

  private getTopItems(items: string[], top: number = 3): string[] {
    const freq = items.reduce((acc, item) => {
      acc[item] = (acc[item] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, top)
      .map(([name]) => name);
  }

  private async callGemini(prompt: string): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const response = await axios.post(
      url,
      { contents: [{ role: 'user', parts: [{ text: prompt }] }] },
      { headers: { 'Content-Type': 'application/json' } }
    );
    return response.data.candidates?.[0]?.content?.parts?.[0]?.text || 'Xin lỗi, mình chưa rõ.';
  }

  extractOrderDetails(userMessage: string) {
    const match = userMessage.match(/(\d+)\s(\w+)/);
    if (match) {
      return [parseInt(match[1], 10), match[2]]; // Trả về số lượng và tên món ăn
    }
    return [1, userMessage]; // Mặc định là 1 món nếu không có số lượng
  }

  // Hàm hỗ trợ tách địa chỉ từ câu người dùng
  extractAddress(userMessage: string, addresses: any[]) {
    // Giả sử địa chỉ được xác định qua tên
    return addresses.find(address => userMessage.toLowerCase().includes(address.name.toLowerCase())) || addresses[0];
  }
}