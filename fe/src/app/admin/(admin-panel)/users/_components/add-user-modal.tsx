import { useState, ChangeEvent, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import NavbarBrand from "@/components/ui/navigation/navbar-brand";
import { CloudUploadIcon, UserPlusIcon } from "lucide-react";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useIsMobile } from "@/hooks/use-mobile";

interface AddUserFormProps {
    onClose: () => void;
    onSwitchToUpload: () => void; // New prop to switch to upload modal
}

interface FormData {
    fullName: string;
    email: string;
    phone: string;
    password: string;
    confirmPassword: string;
    receiveEmail: boolean;
}

/**
 * AddUserForm Component
 * 
 * Hiển thị biểu mẫu để thêm người dùng mới, cho phép nhập họ tên, email, số điện thoại, tên đăng nhập, mật khẩu
 * và tùy chọn nhận thông báo qua email. Bao gồm xác thực mật khẩu và trạng thái tải khi gửi biểu mẫu.
 *
 * @component
 * @example
 * <AddUserForm onClose={() => console.log("Closed")} />
 * 
 * @param {AddUserFormProps} onClose - Function to close the form/modal.
 * @returns {JSX.Element} A form component for adding a new user.
 */
const AddUserForm: React.FC<AddUserFormProps> = ({ onClose, onSwitchToUpload }) => {
    const [formData, setFormData] = useState<FormData>({
        fullName: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
        receiveEmail: false,
    });
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [state, setState] = useState<boolean>(false);

    // Responsive hooks
    const isMobile = useIsMobile();
    const isTablet = useMediaQuery("(max-width: 1023px)");


    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        if (formData.password !== formData.confirmPassword) {
            setError("Mật khẩu không khớp");
            setIsLoading(false);
            return;
        }

        try {
            // Placeholder for API call to create user
            console.log("Creating user with data:", formData);
            setIsLoading(false);
            onClose(); // Close modal on success
        } catch (err) {
            setError("Có lỗi xảy ra khi tạo tài khoản");
            setIsLoading(false);
            console.error("Error creating user:", err);
        }
    };


    // For mobile, we'll use a stacked layout
    if (isMobile) {
        return (
            <div className="flex flex-col w-full">
                {/* Header section with branded content */}
                <div className="bg-gray-100 p-6 ">
                    <NavbarBrand state={state} setState={setState} showButton={false} />

                    <div className="flex items-center gap-3 mt-6">
                        <div className="h-8 w-8 bg-primary rounded-sm flex items-center justify-center">
                            <UserPlusIcon className="h-5 w-5 text-white" />
                        </div>
                        <h2 className="text-xl font-bold">Thêm tài khoản mới</h2>
                    </div>

                    <p className="text-gray-600 mt-2 text-sm">Tạo tài khoản cho học viên/người dùng của bạn chỉ với vài thao tác</p>
                </div>

                {/* Form section */}
                <form onSubmit={handleSubmit} className="grid gap-4 p-6">
                    <h1 className="text-xl font-bold text-gray-800">Thông tin tài khoản</h1>

                    <div className="grid gap-1">
                        <Label htmlFor="fullName" className="text-base">Họ và tên *</Label>
                        <Input
                            id="fullName"
                            name="fullName"
                            type="text"
                            placeholder="Nhập họ và tên"
                            value={formData.fullName}
                            onChange={handleChange}
                            required
                            disabled={isLoading}
                        />
                        <Label className="text-xs text-gray-500">Thông tin họ tên của học viên</Label>
                    </div>

                    <div className="grid gap-1">
                        <Label htmlFor="email" className="text-base">Email *</Label>
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="Nhập email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            disabled={isLoading}
                        />
                        <Label className="text-xs text-gray-500">Thông tin email của học viên</Label>
                    </div>

                    <div className="grid gap-1">
                        <Label htmlFor="phone" className="text-base">Số điện thoại</Label>
                        <Input
                            id="phone"
                            name="phone"
                            type="tel"
                            placeholder="Nhập số điện thoại"
                            value={formData.phone}
                            onChange={handleChange}
                            disabled={isLoading}
                        />
                    </div>

                    <div className="grid gap-1">
                        <Label htmlFor="password" className="text-base">Mật khẩu *</Label>
                        <Input
                            id="password"
                            name="password"
                            type="password"
                            placeholder="Nhập mật khẩu"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            disabled={isLoading}
                        />
                    </div>

                    <div className="grid gap-1">
                        <Label htmlFor="confirmPassword" className="text-base">Xác nhận mật khẩu *</Label>
                        <Input
                            id="confirmPassword"
                            name="confirmPassword"
                            type="password"
                            placeholder="Nhập lại mật khẩu"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            required
                            disabled={isLoading}
                        />
                    </div>

                    <div className="flex items-center space-x-2 mt-1">
                        <Checkbox
                            id="receiveEmail"
                            name="receiveEmail"
                            checked={formData.receiveEmail}
                            onCheckedChange={(checked) =>
                                setFormData((prev) => ({ ...prev, receiveEmail: !!checked }))}
                            disabled={isLoading}
                        />
                        <div className="flex flex-col">
                            <Label htmlFor="receiveEmail" className="text-sm">Gửi email thông báo</Label>
                            <Label className="text-xs text-gray-500">Thông báo tạo tài khoản sẽ được gửi đến email.</Label>
                        </div>
                    </div>

                    {error && <p className="text-center text-sm text-red-500">{error}</p>}

                    <div className="flex flex-col gap-2 mt-4">
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full text-base border border-transparent hover:border-primary hover:text-primary"
                        >
                            {isLoading ? "Đang xử lý..." : "Tạo tài khoản"}
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={isLoading}
                            className="w-full text-base"
                        >
                            Hủy
                        </Button>
                    </div>

                    <div className="border-t pt-4 mt-2 text-center">
                        <p className="text-gray-600 font-medium text-sm">Cần hỗ trợ?</p>
                        <a href="mailto:suport@gmail.com" className="text-primary text-sm hover:underline">suport@gmail.com</a>
                    </div>
                </form>
            </div>
        );
    }

    // For tablet, we'll modify the layout slightly
    if (isTablet) {
        return (
            <div className="flex flex-col w-full">
                <div className="bg-gray-100 p-8">
                    <NavbarBrand state={state} setState={setState} showButton={false} />

                    <div className="flex items-center gap-3 mt-6">
                        <div className="h-9 w-9 bg-primary rounded-sm flex items-center justify-center">
                            <UserPlusIcon className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">Thêm tài khoản mới</h2>
                            <p className="text-gray-600 text-sm">Tạo tài khoản chỉ với vài thao tác</p>
                        </div>
                    </div>

                    <div className="flex justify-between items-center mt-6">
                        <button className="flex items-center text-primary hover:underline"
                            onClick={onSwitchToUpload}
                        >
                            <CloudUploadIcon className="h-5 w-5 mr-1" />
                            <span className="text-sm">Thêm nhiều tài khoản</span>
                        </button>

                        <div className="text-right">
                            <p className="text-gray-600 font-medium text-sm">Cần hỗ trợ?</p>
                            <a href="mailto:suport@gmail.com" className="text-primary text-sm hover:underline">suport@gmail.com</a>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="grid gap-5 p-8">
                    <div className="mb-2">
                        <div className="flex justify-between items-center">
                            <h1 className="text-xl font-bold text-gray-800">Thông tin tài khoản</h1>
                        </div>
                        <p className="text-gray-500 text-sm">Vui lòng cung cấp thông tin tài khoản</p>
                    </div>


                    <div className="grid md:grid-cols-2 gap-5">
                        <div className="grid gap-1">
                            <Label htmlFor="fullName" className="text-base">Họ và tên *</Label>
                            <Input
                                id="fullName"
                                name="fullName"
                                type="text"
                                placeholder="Nhập họ và tên"
                                value={formData.fullName}
                                onChange={handleChange}
                                required
                                disabled={isLoading}
                            />
                            <Label className="text-xs text-gray-500">Thông tin họ tên của học viên</Label>
                        </div>

                        <div className="grid gap-1">
                            <Label htmlFor="email" className="text-base">Email *</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="Nhập email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                disabled={isLoading}
                            />
                            <Label className="text-xs text-gray-500">Thông tin email của học viên</Label>
                        </div>
                    </div>

                    <div className="grid gap-1">
                        <Label htmlFor="phone" className="text-base">Số điện thoại</Label>
                        <Input
                            id="phone"
                            name="phone"
                            type="tel"
                            placeholder="Nhập số điện thoại"
                            value={formData.phone}
                            onChange={handleChange}
                            disabled={isLoading}
                        />
                    </div>

                    <div className="grid md:grid-cols-2 gap-5">
                        <div className="grid gap-1">
                            <Label htmlFor="password" className="text-base">Mật khẩu *</Label>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                placeholder="Nhập mật khẩu"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                disabled={isLoading}
                            />
                        </div>

                        <div className="grid gap-1">
                            <Label htmlFor="confirmPassword" className="text-base">Xác nhận mật khẩu *</Label>
                            <Input
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                placeholder="Nhập lại mật khẩu"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                required
                                disabled={isLoading}
                            />
                        </div>
                    </div>

                    <div className="flex items-start space-x-2 mt-1">
                        <Checkbox
                            id="receiveEmail"
                            name="receiveEmail"
                            checked={formData.receiveEmail}
                            onCheckedChange={(checked) =>
                                setFormData((prev) => ({ ...prev, receiveEmail: !!checked }))}
                            disabled={isLoading}
                            className="mt-1"
                        />
                        <div className="flex flex-col">
                            <Label htmlFor="receiveEmail" className="text-base">Gửi email thông báo</Label>
                            <Label className="text-sm text-gray-500">Thông báo tạo tài khoản sẽ được gửi đến email của học viên/người dùng đã khai báo ở trên.</Label>
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
                            Hủy
                        </Button>
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="text-base border border-transparent hover:border-primary hover:text-primary"
                        >
                            {isLoading ? "Đang xử lý..." : "Tạo tài khoản"}
                        </Button>
                    </div>
                </form>
            </div>
        );
    }

    // Desktop layout (original)
    return (
        <div className="flex h-full">
            {/* Left sidebar - adjusted to match right side height */}
            <div className="w-1/3 bg-gray-100 p-12 flex flex-col min-h-[700px]">
                <NavbarBrand state={state} setState={setState} showButton={false} />
                <div className="flex flex-col justify-between h-full">
                    <div className="pt-16">
                        <div className="h-10 w-10 bg-primary rounded-sm flex p-3 content-center items-center">
                            <UserPlusIcon className="h-10 w-10 text-white" />
                        </div>

                        <h2 className="text-2xl font-bold mt-6 mb-2">Thêm tài khoản mới</h2>
                        <p className="text-gray-600 mb-8">Tạo tài khoản cho học viên/người dùng của bạn chỉ với vài thao tác</p>


                        <button
                            className="flex items-center text-primary mt-6 hover:underline"
                            onClick={onSwitchToUpload}
                        >
                            <CloudUploadIcon className="h-5 w-5 mr-2" />
                            Thêm nhiều tài khoản
                        </button>
                    </div>

                    {/* Support section positioned at bottom */}
                    <div className="mb-4">
                        <p className="text-gray-600 font-medium">Cần hỗ trợ?</p>
                        <a href="mailto:suport@gmail.com" className="text-primary hover:underline">suport@gmail.com</a>
                    </div>
                </div>
            </div>

            {/* Right form */}
            <form onSubmit={handleSubmit} className="grid gap-6 w-2/3 p-12 lg:pl-24 xl:pl-40">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Thông tin tài khoản</h1>
                        <p className="text-gray-500">
                            Vui lòng cung cấp thông tin tài khoản
                        </p>
                    </div>
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="fullName" className="text-lg">Họ và tên *</Label>
                    <Input
                        id="fullName"
                        name="fullName"
                        type="text"
                        placeholder="Nhập họ và tên"
                        value={formData.fullName}
                        onChange={handleChange}
                        required
                        disabled={isLoading}
                        className="placeholder:text-base"
                    />
                    <Label className="text-md text-gray-500">Thông tin họ tên của học viên</Label>
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="email" className="text-lg">Email *</Label>
                    <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="Nhập email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        disabled={isLoading}
                        className="placeholder:text-base"
                    />
                    <Label className="text-md text-gray-500">Thông tin email của học viên</Label>
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="phone" className="text-lg">Số điện thoại</Label>
                    <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        placeholder="Nhập số điện thoại"
                        value={formData.phone}
                        onChange={handleChange}
                        disabled={isLoading}
                        className="placeholder:text-base"
                    />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="password" className="text-lg">Mật khẩu *</Label>
                    <Input
                        id="password"
                        name="password"
                        type="password"
                        placeholder="Nhập mật khẩu"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        disabled={isLoading}
                        className="placeholder:text-base"
                    />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="confirmPassword" className="text-lg">Xác nhận mật khẩu *</Label>
                    <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        placeholder="Nhập lại mật khẩu"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        required
                        disabled={isLoading}
                        className="placeholder:text-base"
                    />
                </div>

                <div className="flex items-center space-x-2">
                    <Checkbox
                        id="receiveEmail"
                        name="receiveEmail"
                        checked={formData.receiveEmail}
                        onCheckedChange={(checked) =>
                            setFormData((prev) => ({ ...prev, receiveEmail: !!checked }))}
                        disabled={isLoading}
                    />
                    <div className="flex flex-col">
                        <Label htmlFor="receiveEmail" className="text-md">Gửi email thông báo</Label>
                        <Label className="text-md text-gray-500">Thông báo tạo tài khoản sẽ được gửi đến email của học viên/người dùng đã khai báo ở trên.</Label>
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
                        Hủy
                    </Button>
                    <Button
                        type="submit"
                        disabled={isLoading}
                        className="text-lg border border-transparent hover:border-primary hover:text-primary"
                    >
                        {isLoading ? "Đang xử lý..." : "Tạo tài khoản"}
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default AddUserForm;