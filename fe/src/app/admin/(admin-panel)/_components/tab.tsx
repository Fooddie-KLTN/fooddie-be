interface Tab {
    key: string;
    label: string;
    badge?: number;
}


interface NavigationBarProps {
    activeTab: string;
    onTabChange: (tabKey: string) => void;
    tabs: Tab[];
}

/**
 * NavigationBar - Một thanh điều hướng hiển thị các tab có thể chọn
 * 
 * @component
 * @param {object} props - Các thuộc tính của component
 * @param {string} props.activeTab - Khóa của tab đang được chọn hiện tại
 * @param {function} props.onTabChange - Hàm callback được gọi khi người dùng chọn một tab khác
 * @param {Array<{key: string, label: string, badge?: string | number}>} props.tabs - Mảng chứa thông tin của các tab
 * @param {string} props.tabs[].key - Định danh duy nhất cho mỗi tab
 * @param {string} props.tabs[].label - Nhãn hiển thị của tab
 * @param {string|number} [props.tabs[].badge] - Badge hiển thị ở góc trên bên phải của tab (tùy chọn)
 * 
 * @returns {JSX.Element} Thanh điều hướng với các tab có thể chọn
 * 
 * @example
 * const tabs = [
 *   { key: 'courses', label: 'Khóa học' },
 *   { key: 'students', label: 'Học viên', badge: 5 }
 * ];
 * 
 * <NavigationBar 
 *   activeTab="courses"
 *   onTabChange={(tabKey) => setActiveTab(tabKey)}
 *   tabs={tabs}
 * />
 */
const NavigationBar: React.FC<NavigationBarProps> = ({ activeTab, onTabChange, tabs }) => (
    <nav className="bg-gray-100 p-1.5 mb-4 rounded-lg">
        <ul className="flex gap-2">
            {tabs.map((tab) => (
                <li key={tab.key}>
                    <button
                        onClick={() => onTabChange(tab.key)}
                        className={`px-4 py-2.5 rounded-lg transition-colors text-base ${activeTab === tab.key ? 'bg-white text-primary font-medium' : 'text-gray-600 hover:bg-white/50'
                            }`}
                    >
                        {tab.label}
                        {tab.badge && activeTab !== tab.key && (
                            <span className="absolute top-0 right-0 px-2 py-1 text-xs font-bold text-red-100 bg-red-600 rounded-full transform translate-x-1/2 -translate-y-1/2">
                                {tab.badge}
                            </span>
                        )}
                    </button>
                </li>
            ))}
        </ul>
    </nav>
);

export default NavigationBar;