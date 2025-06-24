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
  async generateReply(userMessage: string, userId: string): Promise<{
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
      const [menu, orderHistory] = await Promise.all([
        this.foodService.getMenuForUser(userId),
        this.orderService.getOrderHistory(userId, 1, 5),
      ]);
  
      const orderedFoods = orderHistory.items.flatMap(order =>
        order.orderDetails.map(detail => detail.foodName)
      );
  
      // Tạo menuFlat: list món (bao gồm id để tạo link)
      const menuFlat = menu.flatMap(r =>
        r.foods.map(f => ({
          id: f.id,
          name: f.name,
          price: f.price,
          description: f.description,
          image: f.image || 'https://via.placeholder.com/80x80',
          link: `http://localhost:3000/food/${f.id}`,
        }))
      );
  
      const prompt = `
  Bạn là FoodieBot – một trợ lý đặt món thân thiện. 
  Dưới đây là thực đơn hiện tại (dạng JSON):
  
  ${JSON.stringify(menuFlat)}
  
  Lịch sử món người dùng đã từng đặt: ${orderedFoods.join(', ')}
  
  Người dùng nói: "${userMessage}"
  
  Hãy phân tích ý định người dùng và phản hồi theo format sau (JSON):
  {
    "reply": "Câu trả lời ngắn gọn, lịch sự, không dùng từ cảm thán như 'Tuyệt vời!', 'Xuất sắc!', v.v. Hãy bắt đầu trực tiếp vào nội dung, ví dụ: 'Dựa trên sở thích của bạn, chúng tôi gợi ý...'",
    "suggestions": [ { "id": "...", "name": "...", "price": ..., "image": "...", "link": "..." }, ... ],
    "action": null hoặc "placeOrder" hoặc "trackOrder" hoặc v.v.,
    "metadata": {
      // dữ liệu bổ sung như orderData, items, ...
    }
  }
  
  Lưu ý:
  - Nếu người dùng muốn gợi ý món hoặc hỏi món nào ngon, hãy đưa ra gợi ý từ menu.
  - Nếu không có gì phù hợp, suggestions = [].
  - Nếu họ yêu cầu đặt món thì trả action = "placeOrder" + metadata phù hợp.
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
  
      // fallback để đảm bảo không bị lỗi
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
    console.log('[RESPONSE FROM GEMINI]', JSON.stringify(response.data, null, 2));
    return response.data.candidates?.[0]?.content?.parts?.[0]?.text || 'Xin lỗi, mình chưa rõ.';
  }
  
}
