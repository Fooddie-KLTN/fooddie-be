"use client";

import { useState, ChangeEvent, FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface AddPromotionFormProps {
  onClose: () => void;
}

interface FormData {
  code: string;
  description: string;
  discountPercent: number;
}

const AddPromotionForm: React.FC<AddPromotionFormProps> = ({ onClose }) => {
  const [formData, setFormData] = useState<FormData>({
    code: "",
    description: "",
    discountPercent: 0,
  });

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "discountPercent" ? Number(value) : value,
    }));
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!formData.code || !formData.description || formData.discountPercent <= 0) {
      setError("Vui lòng điền đầy đủ và hợp lệ thông tin.");
      setIsLoading(false);
      return;
    }

    try {
      const stored = localStorage.getItem("promotions");
      const parsed = stored ? JSON.parse(stored) : [];

      // Tạo ID mới tăng dần
      const newId = parsed.length > 0
        ? Math.max(...parsed.map((p: any) => parseInt(p.id))) + 1
        : 1;

      const newPromotion = {
        id: String(newId),
        ...formData,
        orders: [],
      };

      const updated = [...parsed, newPromotion];
      localStorage.setItem("promotions", JSON.stringify(updated));
      onClose();
    } catch (err) {
      console.error("Lỗi khi lưu promotion:", err);
      setError("Không thể lưu khuyến mãi. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-xl mx-auto p-6 grid gap-4">
      <h2 className="text-2xl font-bold text-gray-800">Thêm mã giảm giá mới</h2>

      <div className="grid gap-1">
        <Label htmlFor="code" className="text-base">Mã code *</Label>
        <Input
          id="code"
          name="code"
          type="text"
          value={formData.code}
          onChange={handleChange}
          placeholder="Nhập mã khuyến mãi (VD: SALE50)"
          required
          disabled={isLoading}
        />
      </div>

      <div className="grid gap-1">
        <Label htmlFor="description" className="text-base">Mô tả *</Label>
        <Input
          id="description"
          name="description"
          type="text"
          value={formData.description}
          onChange={handleChange}
          placeholder="Mô tả khuyến mãi"
          required
          disabled={isLoading}
        />
      </div>

      <div className="grid gap-1">
        <Label htmlFor="discountPercent" className="text-base">Giảm giá (%) *</Label>
        <Input
          id="discountPercent"
          name="discountPercent"
          type="number"
          min={1}
          max={100}
          value={formData.discountPercent}
          onChange={handleChange}
          placeholder="Nhập phần trăm giảm"
          required
          disabled={isLoading}
        />
      </div>

      {error && <p className="text-sm text-red-500 text-center">{error}</p>}

      <div className="flex justify-end gap-2 mt-4">
        <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
          Hủy
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Đang lưu..." : "Lưu mã giảm giá"}
        </Button>
      </div>
    </form>
  );
};

export default AddPromotionForm;
