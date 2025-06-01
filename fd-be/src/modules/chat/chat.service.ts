import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import axios from 'axios';

@Injectable()
export class ChatService {
  async generateReply(userMessage: string): Promise<string> {
    let menuData;
    let menuText = '';

    try {
      const rawData = fs.readFileSync('./menu.json', 'utf-8');
      menuData = JSON.parse(rawData);

      menuText = menuData.restaurants.map((restaurant) => {
        const foodList = restaurant.foods
          .map((food) => `- ${food.name} (${food.price})`)
          .join('\n');
        return `🏪 ${restaurant.name} - ${restaurant.address}\n${foodList}`;
      }).join('\n\n');
    } catch (error) {
      console.error('Lỗi đọc file menu.json:', error);
      throw new Error('Không thể đọc dữ liệu từ menu.json');
    }

    const prompt = `
Bạn là FoodieBot. Nhiệm vụ:
- Tư vấn món ăn và trả lời theo dữ liệu có sẵn.
Dữ liệu hiện tại:
${menuText}

Hãy trả lời ngắn gọn, bằng tiếng Việt, thân thiện và chính xác.
Người dùng nói: "${userMessage}"
`;

    try {
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
        },
        {
          headers: { 'Content-Type': 'application/json' },
        },
      );

      return response.data.candidates?.[0]?.content?.parts?.[0]?.text || 'Xin lỗi, mình chưa rõ.';
    } catch (error) {
      console.error('Lỗi gọi Gemini API:', error.response?.data || error.message);
      throw new Error('Lỗi gọi Gemini API');
    }
  }
}
