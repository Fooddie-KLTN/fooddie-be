import { useState, ChangeEvent, FormEvent, DragEvent } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import NavbarBrand from "@/components/ui/navigation/navbar-brand";
import { CloudUploadIcon } from "lucide-react";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useIsMobile } from "@/hooks/use-mobile";

interface UploadMultipleUsersFormProps {
  onClose: () => void;
}

interface FormData {
  file: File | null;
  sendEmail: boolean;
}

/**
 * UploadMultipleUsersForm Component
 *
 * Displays a modal for uploading multiple user accounts via a CSV file.
 * Includes options for sending notification emails and buttons to cancel or import the file.
 *
 * @param {UploadMultipleUsersFormProps} onClose - Function to close the form/modal.
 * @returns {JSX.Element} A form component for uploading multiple users via CSV.
 */
const UploadMultipleUsersForm: React.FC<UploadMultipleUsersFormProps> = ({ onClose }) => {
  const [formData, setFormData] = useState<FormData>({
    file: null,
    sendEmail: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [state, setState] = useState<boolean>(false);
  const [dragActive, setDragActive] = useState<boolean>(false);

  const isMobile = useIsMobile();
  const isTablet = useMediaQuery("(max-width: 1023px)");

  // Handle file selection via input
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === "text/csv") {
      setFormData((prev) => ({ ...prev, file }));
      setError(null);
    } else {
      setError("Vui lòng chọn tệp CSV hợp lệ");
    }
  };

  // Handle drag-and-drop events
  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type === "text/csv") {
      setFormData((prev) => ({ ...prev, file }));
      setError(null);
    } else {
      setError("Vui lòng kéo thả tệp CSV hợp lệ");
    }
  };

  // Handle form submission
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.file) {
      setError("Vui lòng chọn tệp CSV");
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      // Placeholder for CSV parsing and API call
      console.log("Uploading file:", formData.file, "Send email:", formData.sendEmail);
      // Example: const parsedData = await parseCSV(formData.file);
      // await api.createMultipleUsers(parsedData, formData.sendEmail);
      setIsLoading(false);
      onClose();
    } catch (err) {
      setError("Có lỗi xảy ra khi nhập khẩu tệp");
      setIsLoading(false);
      console.error("Error uploading file:", err);
    }
  };

  // Mobile Layout
  if (isMobile) {
    return (
      <div className="flex flex-col w-full">
        <div className="bg-gray-100 p-6">
          <NavbarBrand state={state} setState={setState} showButton={false} />
          <div className="flex items-center gap-3 mt-6">
            <div className="h-8 w-8 bg-primary rounded-sm flex items-center justify-center">
              <CloudUploadIcon className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-xl font-bold">Thêm nhiều tài khoản</h2>
          </div>
          <p className="text-gray-600 mt-2 text-sm">
            Tải lên tệp CSV để thêm nhiều người dùng cùng lúc
          </p>
        </div>
        <form onSubmit={handleSubmit} className="grid gap-4 p-6">
          <div className="grid gap-2">
            <Label className="text-base">Tải lên tệp CSV</Label>
            <div
              className={`border-2 border-dashed rounded-md p-4 text-center ${
                dragActive ? "border-primary" : "border-gray-300"
              }`}
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
            >
              <Input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
                id="csv-upload"
                disabled={isLoading}
              />
              <Label htmlFor="csv-upload" className="cursor-pointer">
                <CloudUploadIcon className="h-8 w-8 mx-auto text-gray-400" />
                <p className="mt-2 text-sm text-gray-600">
                  Nhấn để tải tệp hoặc kéo thả tệp CSV vào đây
                </p>
              </Label>
            </div>
            {formData.file && (
              <p className="text-sm text-gray-500">Tệp đã chọn: {formData.file.name}</p>
            )}
            <a
              href="/path/to/template.csv"
              className="text-primary text-sm hover:underline"
            >
              Tải xuống mẫu CSV
            </a>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="sendEmail"
              checked={formData.sendEmail}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({ ...prev, sendEmail: !!checked }))
              }
              disabled={isLoading}
            />
            <div className="flex flex-col">
              <Label htmlFor="sendEmail" className="text-sm">Gửi email thông báo</Label>
              <Label className="text-xs text-gray-500">
                Thông báo tạo tài khoản sẽ được gửi đến email của người dùng
              </Label>
            </div>
          </div>
          {error && <p className="text-center text-sm text-red-500">{error}</p>}
          <div className="flex flex-col gap-2 mt-4">
            <Button
              type="submit"
              disabled={isLoading || !formData.file}
              className="w-full text-base"
            >
              {isLoading ? "Đang xử lý..." : "Nhập khẩu"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="w-full text-base"
            >
              Quay lại
            </Button>
          </div>
          <div className="border-t pt-4 mt-2 text-center">
            <p className="text-gray-600 font-medium text-sm">Cần hỗ trợ?</p>
            <a
              href="mailto:support@gmail.com"
              className="text-primary text-sm hover:underline"
            >
              support@gmail.com
            </a>
          </div>
        </form>
      </div>
    );
  }

  // Tablet Layout
  if (isTablet) {
    return (
      <div className="flex flex-col w-full">
        <div className="bg-gray-100 p-8">
          <NavbarBrand state={state} setState={setState} showButton={false} />
          <div className="flex items-center gap-3 mt-6">
            <div className="h-9 w-9 bg-primary rounded-sm flex items-center justify-center">
              <CloudUploadIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Thêm nhiều tài khoản</h2>
              <p className="text-gray-600 text-sm">
                Tải lên tệp CSV để thêm nhiều người dùng
              </p>
            </div>
          </div>
          <div className="flex justify-between items-center mt-6">
            <div className="text-right">
              <p className="text-gray-600 font-medium text-sm">Cần hỗ trợ?</p>
              <a
                href="mailto:support@gmail.com"
                className="text-primary text-sm hover:underline"
              >
                support@gmail.com
              </a>
            </div>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="grid gap-5 p-8">
          <div className="mb-2">
            <h1 className="text-xl font-bold text-gray-800">Tải lên tệp CSV</h1>
            <p className="text-gray-500 text-sm">
              Vui lòng tải lên tệp CSV theo mẫu
            </p>
          </div>
          <div className="grid gap-2">
            <Label className="text-base">Chọn tệp CSV</Label>
            <div
              className={`border-2 border-dashed rounded-md p-6 text-center ${
                dragActive ? "border-primary" : "border-gray-300"
              }`}
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
            >
              <Input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
                id="csv-upload"
                disabled={isLoading}
              />
              <Label htmlFor="csv-upload" className="cursor-pointer">
                <CloudUploadIcon className="h-10 w-10 mx-auto text-gray-400" />
                <p className="mt-2 text-sm text-gray-600">
                  Nhấn để tải tệp hoặc kéo thả tệp CSV vào đây
                </p>
              </Label>
            </div>
            {formData.file && (
              <p className="text-sm text-gray-500">Tệp đã chọn: {formData.file.name}</p>
            )}
            <a
              href="/path/to/template.csv"
              className="text-primary text-sm hover:underline"
            >
              Tải xuống mẫu CSV
            </a>
          </div>
          <div className="flex items-start space-x-2">
            <Checkbox
              id="sendEmail"
              checked={formData.sendEmail}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({ ...prev, sendEmail: !!checked }))
              }
              disabled={isLoading}
              className="mt-1"
            />
            <div className="flex flex-col">
              <Label htmlFor="sendEmail" className="text-base">
                Gửi email thông báo
              </Label>
              <Label className="text-sm text-gray-500">
                Thông báo tạo tài khoản sẽ được gửi đến email của người dùng
              </Label>
            </div>
          </div>
          {error && <p className="text-center text-sm text-red-500">{error}</p>}
          <div className="flex justify-end gap-3 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="text-base"
            >
              Quay lại
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !formData.file}
              className="text-base"
            >
              {isLoading ? "Đang xử lý..." : "Nhập khẩu"}
            </Button>
          </div>
        </form>
      </div>
    );
  }

  // Desktop Layout
  return (
    <div className="flex h-full">
      <div className="w-1/3 bg-gray-100 p-12 flex flex-col min-h-[700px]">
        <NavbarBrand state={state} setState={setState} showButton={false} />
        <div className="flex flex-col justify-between h-full">
          <div className="pt-16">
            <div className="h-10 w-10 bg-primary rounded-sm flex p-3 content-center items-center">
              <CloudUploadIcon className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold mt-6 mb-2">Thêm nhiều tài khoản</h2>
            <p className="text-gray-600 mb-8">
              Tải lên tệp CSV để thêm nhiều người dùng cùng lúc
            </p>

          </div>
          <div className="mb-4 pt-72">
            <p className="text-gray-600 font-medium">Cần hỗ trợ?</p>
            <a
              href="mailto:support@gmail.com"
              className="text-primary hover:underline"
            >
              support@gmail.com
            </a>
          </div>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="grid gap-6 w-2/3 p-12 lg:pl-24 xl:pl-40">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Tải lên tệp CSV</h1>
            <p className="text-gray-500">Vui lòng chọn tập tin định dạng .csv theo mẫu sau:</p>
            <a
            href="/path/to/template.csv"
            className="text-primary text-md font-bold hover:underline"
          >
            Tải xuống mẫu CSV
          </a>
          </div>
        </div>
        <div className="grid gap-2">
          <div
            className={`border-2 border-dashed rounded-md p-8 text-center ${
              dragActive ? "border-primary" : "border-gray-300"
            }`}
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
          >
            <Input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
              id="csv-upload"
              disabled={isLoading}
            />
            <Label htmlFor="csv-upload" className="cursor-pointer">
              <CloudUploadIcon className="h-12 w-12 mx-auto text-gray-400" />
              <p className="mt-2 text-sm text-gray-600">
                Nhấn để tải tệp hoặc kéo thả tệp CSV vào đây
              </p>
            </Label>
          </div>
          {formData.file && (
            <p className="text-sm text-gray-500">Tệp đã chọn: {formData.file.name}</p>
          )}

        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="sendEmail"
            checked={formData.sendEmail}
            onCheckedChange={(checked) =>
              setFormData((prev) => ({ ...prev, sendEmail: !!checked }))
            }
            disabled={isLoading}
          />
          <div className="flex flex-col">
            <Label htmlFor="sendEmail" className="text-md">Gửi email thông báo</Label>
            <Label className="text-md text-gray-500">
              Thông báo tạo tài khoản sẽ được gửi đến email của người dùng
            </Label>
          </div>
        </div>
        {error && <p className="text-center text-sm text-red-500">{error}</p>}
        <div className="flex justify-end gap-2 mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="text-lg"
          >
            Quay lại
          </Button>
          <Button
            type="submit"
            disabled={isLoading || !formData.file}
            className="text-lg"
          >
            {isLoading ? "Đang xử lý..." : "Nhập khẩu"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default UploadMultipleUsersForm;