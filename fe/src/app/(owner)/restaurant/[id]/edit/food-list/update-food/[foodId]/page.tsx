/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { userApi } from "@/api/user";
import { adminService } from "@/api/admin";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";
import { FoodDetail } from "@/interface";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

type FoodForm = {
  name: string;
  description: string;
  price: string;
  discountPercent?: string;
  categoryId: string;
  preparationTime?: string;
  image?: string;
  imageUrls?: string[];
};

export default function UpdateFoodPage() {
  const router = useRouter();
  const { getToken } = useAuth();
  const params = useParams();
  const restaurantId = Array.isArray(params.id) ? params.id[0] : params.id;
  const foodId = Array.isArray(params.foodId) ? params.foodId[0] : params.foodId;

  const [form, setForm] = useState<FoodForm>({
    name: "",
    description: "",
    price: "",
    discountPercent: "",
    categoryId: "",
    preparationTime: "",
    image: "",
    imageUrls: [],
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      setCategoryLoading(true);
      try {
        const token = getToken?.();
        if (!token) throw new Error("No token");
        const data = await adminService.Category.getCategories(token, 1, 50);
        setCategories(data.items || []);
      } catch (err) {
        console.error("Failed to fetch categories:", err);
        setCategories([]);
      } finally {
        setCategoryLoading(false);
      }
    };
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch food data
  useEffect(() => {
    const fetchFood = async () => {
      if (!foodId) return;
      setInitialLoading(true);
      setLoading(true);
      try {
        const token = getToken?.();
        if (!token || !restaurantId) throw new Error("No token or restaurant ID");
        const food: FoodDetail = await userApi.food.getFoodById(token, foodId);

        // Wait for categories to be loaded before checking categoryId
        let categoryId = food.category?.id || "";
        if (
          categoryId &&
          categories.length > 0 &&
          !categories.some((cat) => cat.id === categoryId)
        ) {
          // If the fetched categoryId is not in the categories list, set to ""
          categoryId = "";
        }

        setForm({
          name: food.name || "",
          description: food.description || "",
          price: food.price?.toString() || "",
          discountPercent: food.discountPercent?.toString() || "",
          categoryId,
          preparationTime: food.preparationTime?.toString() || "",
          image: food.image || "",
          imageUrls: food.imageUrls || [],
        });
        setPreview(food.image || "");
        setImagePreviews(food.imageUrls || []);
      } catch (err) {
        console.error("Failed to fetch food:", err);
        alert("Không thể tải dữ liệu món ăn");
      } finally {
        setLoading(false);
        setInitialLoading(false);
      }
    };

    // Only fetch food after categories are loaded
    if (categories.length > 0) {
      fetchFood();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [foodId, categories]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleImageUrlsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setImageFiles(files);
    setImagePreviews(files.map((file) => URL.createObjectURL(file)));
  };

  const handleRemoveImage = (idx: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== idx));
    setImagePreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = getToken();
      if (!token || !restaurantId || !foodId) throw new Error("No token or restaurant ID or food ID");

      let imageUrl = form.image || "";
      // Cover image upload
      if (imageFile) {
        const apiRequestBody = {
          fileName: imageFile.name,
          fileType: imageFile.type,
          folder: "food-images",
          isPublic: true,
        };
        const signedUrlResponse = await fetch("/api/gcs-upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(apiRequestBody),
        });
        if (!signedUrlResponse.ok) {
          const errorData = await signedUrlResponse.json().catch(() => ({ message: "Không thể lấy URL tải lên." }));
          throw new Error(errorData.message || `Lỗi khi lấy URL tải lên: ${signedUrlResponse.statusText}`);
        }
        const { url: signedUrl, publicUrl } = await signedUrlResponse.json();
        if (!signedUrl || !publicUrl) throw new Error("Không nhận được URL hợp lệ từ máy chủ.");

        // Upload to GCS
        const gcsUploadResponse = await fetch(signedUrl, {
          method: "PUT",
          body: imageFile,
          headers: {
            "Content-Type": imageFile.type,
            "x-goog-acl": "public-read",
          },
        });
        if (!gcsUploadResponse.ok) {
          const gcsErrorText = await gcsUploadResponse.text();
          console.error("GCS Upload Error Text:", gcsErrorText);
          throw new Error(`Tải ảnh lên GCS thất bại: ${gcsUploadResponse.statusText}`);
        }
        imageUrl = publicUrl;
      }

      // Gallery images upload
      const imageUrls: string[] = [];
      if (imageFiles.length > 0) {
        for (const file of imageFiles) {
          const apiRequestBody = {
            fileName: file.name,
            fileType: file.type,
            folder: "food-images",
            isPublic: true,
          };
          const signedUrlResponse = await fetch("/api/gcs-upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(apiRequestBody),
          });
          if (!signedUrlResponse.ok) {
            const errorData = await signedUrlResponse.json().catch(() => ({ message: "Không thể lấy URL tải lên." }));
            throw new Error(errorData.message || `Lỗi khi lấy URL tải lên: ${signedUrlResponse.statusText}`);
          }
          const { url: signedUrl, publicUrl } = await signedUrlResponse.json();
          if (!signedUrl || !publicUrl) throw new Error("Không nhận được URL hợp lệ từ máy chủ.");

          const gcsUploadResponse = await fetch(signedUrl, {
            method: "PUT",
            body: file,
            headers: {
              "Content-Type": file.type,
              "x-goog-acl": "public-read",
            },
          });
          if (!gcsUploadResponse.ok) {
            const gcsErrorText = await gcsUploadResponse.text();
            console.error("GCS Upload Error Text:", gcsErrorText);
            throw new Error(`Tải ảnh lên GCS thất bại: ${gcsUploadResponse.statusText}`);
          }
          imageUrls.push(publicUrl);
        }
      }

      if (!imageUrl && imageUrls.length > 0) {
        imageUrl = imageUrls[0];
      }

      // Prepare update data and remove forbidden fields
      const updateData = {
        ...form,
        restaurantId,
        image: imageUrl,
        imageUrls,
      };

      await userApi.food.updateFood(token, foodId, updateData);

      router.push(`/restaurant/${restaurantId}/edit/food-list`);
    } catch (err) {
      if (err instanceof Error) {
        alert(err.message);
      } else {
        alert("Cập nhật món ăn thất bại");
      }
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white to-blue-50">
        <div className="flex flex-col items-center">
          <span className="loader mb-4" />
          <span className="text-lg text-primary font-semibold">Đang tải dữ liệu...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white to-blue-50">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-3xl font-bold mb-8 text-center text-primary">Cập nhật món ăn</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Tên món ăn <span className="text-red-500">*</span></Label>
              <Input id="name" name="name" value={form.name} onChange={handleChange} required />
            </div>
            <div>
              <Label htmlFor="price">Giá (VND) <span className="text-red-500">*</span></Label>
              <Input id="price" name="price" type="number" value={form.price} onChange={handleChange} required />
            </div>
            <div>
              <Label htmlFor="discountPercent">Giảm giá (%)</Label>
              <Input id="discountPercent" name="discountPercent" type="number" value={form.discountPercent} onChange={handleChange} />
            </div>
            <div>
              <Label htmlFor="categoryId">Danh mục <span className="text-red-500">*</span></Label>
              <Select
                value={form.categoryId}
                onValueChange={(value) =>
                  setForm((prev) => ({ ...prev, categoryId: value }))
                }
                disabled={categoryLoading}
                required
                name="categoryId"
              >
                <SelectTrigger id="categoryId" className="mt-1" aria-label="Danh mục">
                  <SelectValue placeholder="Chọn danh mục" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="preparationTime">Thời gian chuẩn bị (phút)</Label>
              <Input id="preparationTime" name="preparationTime" value={form.preparationTime} onChange={handleChange} />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="description">Mô tả</Label>
              <Input id="description" name="description" value={form.description} onChange={handleChange} />
            </div>
          </div>
          <div>
            <Label htmlFor="image">Ảnh đại diện (cover)</Label>
            <Input id="image" name="image" type="file" accept="image/*" onChange={handleImageChange} />
            {preview && (
              <div className="mt-4 flex justify-center">
                <img
                  src={preview}
                  alt="Preview"
                  className="w-40 h-40 object-cover rounded-xl border shadow"
                />
              </div>
            )}
          </div>
          <div>
            <Label htmlFor="imageUrls">Ảnh món ăn (gallery, chọn nhiều ảnh)</Label>
            <Input
              id="imageUrls"
              name="imageUrls"
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUrlsChange}
            />
            {imagePreviews.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-3">
                {imagePreviews.map((src, idx) => (
                  <div key={idx} className="relative group">
                    <img
                      src={src}
                      alt={`Preview ${idx + 1}`}
                      className="w-24 h-24 object-cover rounded-xl border shadow"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="absolute top-1 right-1 bg-white/80 rounded-full p-1 hover:bg-red-100 transition group-hover:scale-110"
                      title="Xóa ảnh"
                    >
                      <X size={16} className="text-red-500" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="w-full py-3 text-lg font-semibold rounded-xl bg-primary text-white hover:bg-primary/90 transition"
          >
            {loading ? "Đang cập nhật..." : "Cập nhật món ăn"}
          </Button>
        </form>
      </div>
    </div>
  );
}