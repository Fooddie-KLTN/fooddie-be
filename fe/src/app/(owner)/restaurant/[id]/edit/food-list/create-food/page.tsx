"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { userApi } from "@/api/user";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { guestService } from "@/api/guest";

export default function CreateFoodPage() {
    const router = useRouter();
    const params = useParams();
    const { getToken } = useAuth();
    const restaurantId = Array.isArray(params.id) ? params.id[0] : params.id;

    const [form, setForm] = useState({
        name: "",
        description: "",
        price: "",
        discountPercent: "",
        categoryId: "",
        preparationTime: "",
        image: "",
    });
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
    const [categoryLoading, setCategoryLoading] = useState(false);

    useEffect(() => {
        const fetchCategories = async () => {
            setCategoryLoading(true);
            try {
                const res = await guestService.category.getCategories(1,100)
                setCategories(res.items)
            } catch (err) {
                console.error("Failed to fetch categories:", err);
                setCategories([]);
            } finally {
                setCategoryLoading(false);
            }
        };
        fetchCategories();
    }, []);

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
            if (!token || !restaurantId) throw new Error("No token or restaurant ID");

            let imageUrl = "";
            // Step 1: Get signed URL and public URL for cover image
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

                // Step 2: Upload the file to GCS
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

            // Handle gallery images
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

            await userApi.food.createFood(token, {
                ...form,
                restaurantId,
                image: imageUrl,
                imageUrls,
            });

            router.push(`/restaurant/${restaurantId}/edit/food-list`);
        } catch (err) {
            if (err instanceof Error) {
                alert(err.message);
            } else {
                alert("Tạo món ăn thất bại");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white to-blue-50">
            <div className="w-full max-w-xl bg-white rounded-2xl shadow-xl p-8">
                <h1 className="text-3xl font-bold mb-8 text-center text-primary">Thêm món mới</h1>
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
                        className="w-full hover:text-primary py-3 text-lg font-semibold rounded-xl bg-primary text-white hover:bg-primary/90 transition"
                    >
                        {loading ? "Đang tạo..." : "Tạo món ăn"}
                    </Button>
                </form>
            </div>
        </div>
    );
}