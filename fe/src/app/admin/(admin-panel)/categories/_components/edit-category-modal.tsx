"use client";

import { useState, ChangeEvent } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { adminService, CategoryResponse } from "@/api/admin";
import { useAuth } from "@/context/auth-context";
import { UploadCloudIcon } from "lucide-react";

interface Props {
  category: CategoryResponse;
  onClose: () => void;
  onUpdated?: () => void;
}

const EditCategoryForm: React.FC<Props> = ({ category, onClose, onUpdated }) => {
  const [name, setName] = useState(category.name);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(category.image || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getToken } = useAuth();

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError("Kích thước tệp không được vượt quá 2MB.");
        setImageFile(null);
        setImagePreview(category.image || null);
        if (e.target) e.target.value = "";
        return;
      }
      const allowedTypes = ["image/png", "image/jpeg", "image/gif", "image/webp"];
      if (!allowedTypes.includes(file.type)) {
        setError("Định dạng tệp không hợp lệ. Chỉ chấp nhận PNG, JPG, GIF, WEBP.");
        setImageFile(null);
        setImagePreview(category.image || null);
        if (e.target) e.target.value = "";
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setError(null);
    } else {
      setImageFile(null);
      setImagePreview(category.image || null);
    }
  };

  const handleSubmit = async () => {
    if (!name) {
      setError("Vui lòng nhập tên danh mục.");
      return;
    }

    setLoading(true);
    setError(null);
    let finalImageGcsUrl = category.image;

    try {
      const token = await getToken();
      if (!token) {
        throw new Error("Token không tồn tại. Vui lòng đăng nhập lại.");
      }

      // If user picked a new image, upload it to GCS
      if (imageFile) {
        const apiRequestBody = {
          fileName: imageFile.name,
          fileType: imageFile.type,
          folder: "category-images",
          isPublic: true,
        };

        const signedUrlResponse = await fetch("/api/gcs-upload", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(apiRequestBody),
        });

        if (!signedUrlResponse.ok) {
          const errorData = await signedUrlResponse.json().catch(() => ({ message: "Không thể lấy URL tải lên." }));
          throw new Error(errorData.message || `Lỗi khi lấy URL tải lên: ${signedUrlResponse.statusText}`);
        }

        const { url: signedUrl, publicUrl } = await signedUrlResponse.json();
        if (!signedUrl || !publicUrl) {
          throw new Error("Không nhận được URL hợp lệ từ máy chủ.");
        }

        finalImageGcsUrl = publicUrl;

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
      }

      // Update category
      await adminService.Category.updateCategory(token, category.id, {
        name,
        image: finalImageGcsUrl,
      });

      if (onUpdated) await onUpdated();
      onClose();
    } catch (err) {
      let errorMessage = "Đã xảy ra lỗi không xác định.";
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      setError(errorMessage);
      console.error("Error in handleSubmit:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-xl font-semibold text-gray-800">Chỉnh sửa Danh Mục</h2>
      </div>

      <div className="p-6 space-y-6 overflow-y-auto flex-grow">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}
        <div>
          <Label htmlFor="categoryName" className="text-sm font-medium text-gray-700">Tên danh mục</Label>
          <Input
            id="categoryName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ví dụ: Trà sữa, Cà phê, Bánh ngọt"
            className="mt-1"
            disabled={loading}
          />
        </div>

        <div>
          <Label htmlFor="categoryImage" className="text-sm font-medium text-gray-700">Hình ảnh danh mục</Label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
            <div className="space-y-1 text-center">
              {imagePreview ? (
                <img src={imagePreview} alt="Xem trước hình ảnh" className="mx-auto h-32 w-auto object-contain rounded-md" />
              ) : (
                <UploadCloudIcon className="mx-auto h-12 w-12 text-gray-400" />
              )}
              <div className="flex text-sm text-gray-600 justify-center">
                <label
                  htmlFor="categoryImage"
                  className="relative cursor-pointer bg-white rounded-md font-medium text-primary hover:text-primary-dark focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary"
                >
                  <span>{imageFile ? imageFile.name : "Tải lên một tệp"}</span>
                  <Input
                    id="categoryImage"
                    name="categoryImage"
                    type="file"
                    className="sr-only"
                    accept="image/png, image/jpeg, image/gif, image/webp"
                    onChange={handleImageChange}
                    disabled={loading}
                  />
                </label>
                {!imageFile && <p className="pl-1">hoặc kéo và thả</p>}
              </div>
              {!imageFile && <p className="text-xs text-gray-500">PNG, JPG, GIF, WEBP tối đa 2MB</p>}
              {(imageFile || imagePreview) && (
                <Button
                  variant="link"
                  size="sm"
                  className="text-xs text-red-500 hover:text-red-700 mt-1"
                  onClick={() => {
                    setImageFile(null);
                    setImagePreview(category.image || null);
                    (document.getElementById('categoryImage') as HTMLInputElement).value = '';
                  }}
                  disabled={loading}
                >
                  Xóa ảnh
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 p-4 border-t bg-gray-50 rounded-b-lg mt-auto">
        <Button variant="outline" onClick={onClose} disabled={loading}>
          Hủy
        </Button>
        <Button className="hover:text-primary" onClick={handleSubmit} disabled={loading || !name}>
          {loading ? "Đang xử lý..." : "Lưu thay đổi"}
        </Button>
      </div>
    </div>
  );
};

export default EditCategoryForm;