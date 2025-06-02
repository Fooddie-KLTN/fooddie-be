// src/app/admin/(admin-panel)/store/_components/approve-store-modal.tsx
"use client";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Store } from "../page";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface ApproveStoreModalProps {
  store: Store;
  onClose: () => void;
  onApprove: (storeId: string) => void;
  onReject: (storeId: string) => void;
}

const statusColorMap: Record<string, string> = {
  approved: "text-green-600 bg-green-100",
  pending: "text-yellow-600 bg-yellow-100",
  rejected: "text-red-600 bg-red-100",
};

const ApproveStoreModal: React.FC<ApproveStoreModalProps> = ({
  store,
  onClose,
  onApprove,
  onReject,
}) => {
  const [showFullCert, setShowFullCert] = useState(false);

  return (
    <Dialog open={!!store} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl p-6 overflow-y-auto max-h-[90vh]">
        <DialogTitle className="text-2xl font-bold mb-6">
          Xem xét duyệt cửa hàng: {store.name}
        </DialogTitle>

        {/* Ảnh đại diện & Ảnh nền */}
        <div className="flex gap-6 mb-6">
          {store.avatar && (
            <div className="flex flex-col items-center">
              <p className="text-sm text-gray-500 mb-1">Ảnh đại diện</p>
              <div className="w-24 h-24 rounded-full overflow-hidden border">
                <Image
                  src={store.avatar}
                  alt="Avatar"
                  width={96}
                  height={96}
                  className="object-cover"
                />
              </div>
            </div>
          )}
          {store.backgroundImage && (
            <div className="flex-1">
              <p className="text-sm text-gray-500 mb-1">Ảnh nền</p>
              <div className="w-full h-24 rounded-md overflow-hidden border">
                <Image
                  src={store.backgroundImage}
                  alt="Background"
                  width={400}
                  height={96}
                  className="object-cover w-full h-full"
                />
              </div>
            </div>
          )}
        </div>

        {/* Ảnh giấy phép */}
        {store.certificateImage && (
          <>
            <div className="mb-8 flex flex-col items-center">
              <p className="text-sm text-gray-500 mb-2">Ảnh giấy phép</p>
              <div
                className="w-[420px] h-[320px] rounded-md overflow-hidden border shadow cursor-pointer transition hover:ring-2 hover:ring-blue-400"
                onClick={() => setShowFullCert(true)}
                title="Nhấn để xem ảnh lớn"
              >
                <Image
                  src={store.certificateImage}
                  alt="Certificate"
                  width={420}
                  height={320}
                  className="object-cover w-full h-full"
                />
              </div>
              <span className="text-xs text-gray-400 mt-1">(Nhấn vào ảnh để xem kích thước lớn)</span>
            </div>
            {/* Modal hiển thị ảnh lớn */}
            {showFullCert && (
              <div
                className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center"
                onClick={() => setShowFullCert(false)}
              >
                <div className="relative bg-white rounded-lg shadow-lg p-4 max-w-3xl max-h-[90vh] flex flex-col items-center">
                  <button
                    className="absolute top-2 right-2 text-gray-700 hover:text-red-500 text-2xl font-bold"
                    onClick={() => setShowFullCert(false)}
                    aria-label="Đóng"
                  >
                    ×
                  </button>
                  <Image
                    src={store.certificateImage}
                    alt="Certificate Full"
                    width={900}
                    height={700}
                    className="object-contain max-h-[80vh] max-w-full"
                  />
                </div>
              </div>
            )}
          </>
        )}

        {/* Thông tin cơ bản */}
        <div className="mb-6 space-y-3">
          <h3 className="text-lg font-semibold text-gray-700 border-b pb-1">Thông tin cơ bản</h3>
          <div><strong className="w-40 inline-block">Tên cửa hàng:</strong> {store.name}</div>
          <div><strong className="w-40 inline-block">Mô tả:</strong> {store.description || "Chưa có mô tả"}</div>
          <div><strong className="w-40 inline-block">Ngày tạo:</strong> {new Date(store.createdAt).toLocaleString("vi-VN")}</div>
          <div>
            <strong className="w-40 inline-block">Trạng thái:</strong>
            <span
              className={cn(
                "px-2 py-0.5 rounded-full text-sm font-medium",
                statusColorMap[store.status] || "bg-gray-100 text-gray-600"
              )}
            >
              {store.status.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Thông tin liên hệ */}
        <div className="mb-6 space-y-3">
          <h3 className="text-lg font-semibold text-gray-700 border-b pb-1">Liên hệ & địa chỉ</h3>
          <div><strong className="w-40 inline-block">Số điện thoại:</strong> {store.phoneNumber || "Chưa có"}</div>
          <div>
            <strong className="w-40 inline-block">Địa chỉ:</strong>
            {[store.address?.street, store.address?.ward, store.address?.district, store.address?.city].filter(Boolean).join(", ") || "Không rõ"}
          </div>
          <div>
            <strong className="w-40 inline-block">Tọa độ:</strong>
            {store.latitude && store.longitude
              ? `${store.latitude}, ${store.longitude}`
              : "Không rõ"}
          </div>
        </div>

        {/* Giờ hoạt động */}
        <div className="mb-4 space-y-3">
          <h3 className="text-lg font-semibold text-gray-700 border-b pb-1">Giờ hoạt động</h3>
          <div><strong className="w-40 inline-block">Giờ mở cửa:</strong> {store.openTime || "--:--"}</div>
          <div><strong className="w-40 inline-block">Giờ đóng cửa:</strong> {store.closeTime || "--:--"}</div>
        </div>

        {/* Chủ sở hữu */}
        <div className="space-y-3 mb-6">
          <h3 className="text-lg font-semibold text-gray-700 border-b pb-1">Chủ sở hữu</h3>
          <div><strong className="w-40 inline-block">Tên:</strong> {store.owner?.name || "Không rõ"}</div>
          <div><strong className="w-40 inline-block">Email:</strong> {store.owner?.email}</div>
          {store.owner?.phone && <div><strong className="w-40 inline-block">SĐT:</strong> {store.owner.phone}</div>}
        </div>

        {/* Nút duyệt từ chối */}
        <div className="flex justify-end gap-3">
          <Button variant="destructive" onClick={() => onReject(store.id)}>
            Từ chối
          </Button>
          <Button variant="default" onClick={() => onApprove(store.id)} className="hover:text-primary hover:outline-1">
            Duyệt
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ApproveStoreModal;
