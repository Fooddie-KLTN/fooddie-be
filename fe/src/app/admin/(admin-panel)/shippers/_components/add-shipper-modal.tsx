"use client";

import { useState, ChangeEvent, FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface AddShipperFormProps {
  onClose: () => void;
}

interface FormData {
  name: string;
  email: string;
  phone: string;
  cccd: string;
  driverLicense: string;
}

const AddShipperForm: React.FC<AddShipperFormProps> = ({ onClose }) => {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    phone: "",
    cccd: "",
    driverLicense: "",
  });
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

    if (!formData.name || !formData.email || !formData.cccd || !formData.driverLicense) {
      setError("Vui lòng nhập đủ thông tin.");
      setIsLoading(false);
      return;
    }

    const stored = localStorage.getItem("shippers");
    const parsed = stored ? JSON.parse(stored) : [];
    const newId = parsed.length > 0 ? Math.max(...parsed.map((s: any) => parseInt(s.id))) + 1 : 1;

    const newShipper = {
      id: String(newId),
      user: {
        id: String(newId),
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
      },
      cccd: formData.cccd,
      driverLicense: formData.driverLicense,
      status: "active",
      orders: [],
    };

    localStorage.setItem("shippers", JSON.stringify([...parsed, newShipper]));
    setIsLoading(false);
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-xl mx-auto p-6 grid gap-4">
      <h2 className="text-2xl font-bold">Thêm Shipper mới</h2>

      <div>
        <Label htmlFor="name">Họ tên *</Label>
        <Input id="name" name="name" value={formData.name} onChange={handleChange} required disabled={isLoading} />
      </div>

      <div>
        <Label htmlFor="email">Email *</Label>
        <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} required disabled={isLoading} />
      </div>

      <div>
        <Label htmlFor="phone">Số điện thoại</Label>
        <Input id="phone" name="phone" value={formData.phone} onChange={handleChange} disabled={isLoading} />
      </div>

      <div>
        <Label htmlFor="cccd">CCCD *</Label>
        <Input id="cccd" name="cccd" value={formData.cccd} onChange={handleChange} required disabled={isLoading} />
      </div>

      <div>
        <Label htmlFor="driverLicense">GPLX *</Label>
        <Input id="driverLicense" name="driverLicense" value={formData.driverLicense} onChange={handleChange} required disabled={isLoading} />
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex justify-end gap-2 mt-4">
        <Button variant="outline" onClick={onClose} disabled={isLoading}>Hủy</Button>
        <Button type="submit" disabled={isLoading}>{isLoading ? "Đang lưu..." : "Lưu"}</Button>
      </div>
    </form>
  );
};

export default AddShipperForm;
