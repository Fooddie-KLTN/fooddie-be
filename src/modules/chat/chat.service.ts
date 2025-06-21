import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import axios from 'axios';
import { FoodService } from '../food/food.service';
import { OrderService } from '../order/order.service';

@Injectable()
export class ChatService {
  constructor(
    private readonly foodService: FoodService,
    private readonly orderService: OrderService,
  ) {}
  async generateReply(userMessage: string, userId: string): Promise<string> {
    try {
      console.log('[START] generateReply', { userMessage, userId });
      const [menu, orderHistory] = await Promise.all([
        this.foodService.getMenuForUser(userId),
        this.orderService.getOrderHistory(userId, 1, 5), // lấy 5 đơn gần nhất
      ]);
      console.log('[MENU]', menu.length);
      console.log('[ORDER HISTORY]', orderHistory.items?.length);
      // Tạo danh sách món ăn
      const menuText = menu.map(restaurant => {
        const foodList = restaurant.foods
          .map(food => `- ${food.name} (${food.price}đ): ${food.description}`)
          .join('\n');
        return `🏪 ${restaurant.name} - ${restaurant.address}\n${foodList}`;
      }).join('\n\n');
  
      // Phân tích lịch sử món ăn đã đặt
      const orderedFoods = orderHistory.items.flatMap(order =>
        order.orderDetails.map(detail => detail.foodName)
      );

      console.log('[MENU]', JSON.stringify(menu, null, 2));
      console.log('[ORDERS]', JSON.stringify(orderHistory, null, 2));
  
      const topOrdered = this.getTopItems(orderedFoods); // lấy 3 món hay đặt nhất
  
      const prompt = `
  Bạn là FoodieBot. Nhiệm vụ:
  - Tư vấn món ăn phù hợp theo lịch sử của người dùng và danh sách món ăn hiện có.
  
  Dữ liệu hệ thống:
  ${menuText}
  
  Lịch sử món ăn người dùng từng đặt: ${topOrdered.join(', ')}
  
  Người dùng nói: "${userMessage}"
  
  Hãy phản hồi thân thiện, ngắn gọn và gợi ý ít nhất 1 món phù hợp với thói quen của người dùng.
  `;
  
      const response = await this.callGemini(prompt);
      return response;
    } catch (err) {
      console.error('[generateReply] Lỗi xử lý:', err.message);
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
    console.log('[RESPONSE FROM GEMINI]', JSON.stringify(response.data, null, 2));
    return response.data.candidates?.[0]?.content?.parts?.[0]?.text || 'Xin lỗi, mình chưa rõ.';
  }
  
}
