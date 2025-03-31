"use client";

import { useState, ChangeEvent, FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface AddCategoryFormProps {
  onClose: () => void;
}

interface FormData {
  name: string;
  image: string;
}

const AddCategoryForm: React.FC<AddCategoryFormProps> = ({ onClose }) => {
  const [formData, setFormData] = useState<FormData>({ name: "", image: "" });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!formData.name || !formData.image) {
      setError("Vui lòng điền đầy đủ thông tin.");
      setIsLoading(false);
      return;
    }

    try {
      const stored = localStorage.getItem("categories");
      const parsed = stored ? JSON.parse(stored) : [];

      const newId = parsed.length > 0
        ? Math.max(...parsed.map((p: any) => parseInt(p.id))) + 1
        : 1;

      const newCategory = {
        id: String(newId),
        ...formData,
        foods: [],
      };

      const updated = [...parsed, newCategory];
      localStorage.setItem("categories", JSON.stringify(updated));
      onClose();
    } catch (err) {
      console.error("Lỗi khi lưu:", err);
      setError("Không thể lưu danh mục. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-xl mx-auto p-6 grid gap-4">
      <h2 className="text-2xl font-bold">Thêm danh mục mới</h2>

      <div>
        <Label htmlFor="name">Tên danh mục *</Label>
        <Input
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Nhập tên (VD: Đồ uống, Món chính...)"
          required
          disabled={isLoading}
        />
      </div>

      <div>
        <Label htmlFor="image">URL hình ảnh *</Label>
        <Input
          id="image"
          name="image"
          value={formData.image}
          onChange={handleChange}
          placeholder="Nhập link ảnh"
          required
          disabled={isLoading}
        />
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <div className="flex justify-end gap-2 mt-4">
        <Button variant="outline" onClick={onClose} disabled={isLoading}>
          Hủy
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Đang lưu..." : "Lưu danh mục"}
        </Button>
      </div>
    </form>
  );
};

export default AddCategoryForm;
