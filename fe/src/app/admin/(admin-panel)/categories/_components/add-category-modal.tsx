"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { adminService } from "@/api/admin";
import { useAuth } from "@/context/auth-context";

interface Props {
  onClose: () => void;
  onCreated?: (newCategoryList: any[]) => void;
}

const AddCategoryForm: React.FC<Props> = ({ onClose, onCreated }) => {
  const [name, setName] = useState("");
  const [image, setImage] = useState("");
  const [loading, setLoading] = useState(false);
  const { getToken } = useAuth();

  const handleSubmit = async () => {
    if (!name || !image) {
      alert("Vui lòng nhập đầy đủ thông tin danh mục");
      return;
    }

    try {
      setLoading(true);
      const token = await getToken();
      if (!token) throw new Error("Token không tồn tại");

      await adminService.Category.createCategory(token, { name, image });
      alert("Thêm danh mục thành công");

      if (onCreated) {
        const res = await adminService.Category.getCategories(token);
        onCreated(res.items);
      }

      onClose();
    } catch (err) {
      if (err instanceof Error) {
        alert("Lỗi khi thêm danh mục: " + err.message);
      } else {
        alert("Đã xảy ra lỗi không xác định.");
      }
      console.error(err);
    }
    
  };

  return (
    <div className="p-6 space-y-4">
      <div>
        <Label>Tên danh mục</Label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ví dụ: Trà sữa"
        />
      </div>
      <div>
        <Label>URL hình ảnh</Label>
        <Input
          value={image}
          onChange={(e) => setImage(e.target.value)}
          placeholder="https://..."
        />
      </div>
      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={onClose}>
          Hủy
        </Button>
        <Button onClick={handleSubmit} disabled={loading}>
          {loading ? "Đang thêm..." : "Thêm"}
        </Button>
      </div>
    </div>
  );
};

export default AddCategoryForm;
