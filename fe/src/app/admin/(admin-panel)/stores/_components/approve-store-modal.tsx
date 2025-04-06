"use client";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Store } from "../page"; // hoặc điều chỉnh lại kiểu nếu tách type riêng

interface ApproveStoreModalProps {
  store: Store;
  onClose: () => void;
  onApprove: (storeId: string) => void;
  onReject: (storeId: string) => void;
}

const ApproveStoreModal: React.FC<ApproveStoreModalProps> = ({
  store,
  onClose,
  onApprove,
  onReject,
}) => {
  return (
    <Dialog open={!!store} onOpenChange={onClose}>
      <DialogContent>
        <DialogTitle className="text-lg font-semibold">
          Thông tin cửa hàng: {store.name}
        </DialogTitle>
        <div className="space-y-2 text-sm mt-2">
          <p><strong>Chủ cửa hàng:</strong> {store.owner}</p>
          <p><strong>Địa điểm:</strong> {store.location}</p>
          <p><strong>Ngày tạo:</strong> {store.createdAt}</p>
          <p><strong>Trạng thái:</strong> {store.status}</p>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button
            className="px-4 py-2 rounded bg-red-500 text-white hover:bg-red-600"
            onClick={() => onReject(store.id)}
          >
            Từ chối
          </button>
          <button
            className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700"
            onClick={() => onApprove(store.id)}
          >
            Duyệt
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ApproveStoreModal;