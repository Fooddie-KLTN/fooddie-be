"use client";

import React, { useState } from 'react';
import LineChart from '@/components/ui/chart/line-chart';
import StatCard from '@/components/ui/chart/stat-card';
import BarChart from '@/components/ui/chart/bar-chart';
import { Calendar1Icon, ChevronRightIcon } from 'lucide-react';

// Import reusable components
import Header from '@/app/admin/(admin-panel)/_components/header';
import NavigationBar from '@/app/admin/(admin-panel)/_components/tab';

type TimePeriod = 'year' | 'month' | 'week';
/**
 * @component AdminPage
 * 
 * @description
 * Trang Admin hiển thị dữ liệu thống kê về trang web.
 * Component này bao gồm biểu đồ đường thể hiện số lượng đơn hàng trong một khoảng thời gian,
 * biểu đồ cột thể hiện doanh thu trong một khoảng thời gian, và một tập hợp các thẻ thống kê
 * hiển thị số lượng học viên, học viên đã đăng ký và số lượng khóa học đã hoàn thành.
 * 
 * Component cũng bao gồm bộ lọc thời gian cho phép người dùng chọn khoảng thời gian
 * để xem dữ liệu. Các khoảng thời gian bao gồm năm, tháng và tuần.
 * 
 * @returns {React.ReactElement} Trang quản trị hiển thị dữ liệu thống kê
 */
const AdminPage = () => {
    const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('year');
    const [selectedMetric, setSelectedMetric] = useState<'overview' | 'orders' | 'revenue'>('overview');

    const STAT_CARDS_DATA = [
        {
            title: "Shipper",
            value: "13.281",
            previousValue: "12.491",
            change: "+13.28% so với năm trước",
            isPositive: true,
        },
        {
            title: "Shipper Hoạt Động",
            value: "9.491",
            previousValue: "8.564",
            change: "+10.38% so với năm trước",
            isPositive: true,
        },
        {
            title: "Hoàn thành đơn hàng",
            value: "90.672",
            previousValue: "4.821",
            change: "-11% so với năm trước",
            isPositive: false,
        }
    ];

    // Data for different time periods
    const chartData = {
        year: {
            order: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                values: [150, 160, 170, 180, 190, 200, 210, 220, 230, 240, 250, 260],
            },
            revenue: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                values: [500, 300, 700, 400, 600, 200, 800, 500, 600, 700, 900, 800],
            },
        },
        month: {
            order: {
                labels: Array.from({ length: 30 }, (_, i) => `${i + 1}`),
                values: Array.from({ length: 30 }, () => Math.floor(Math.random() * 100) + 150),
            },
            revenue: {
                labels: Array.from({ length: 30 }, (_, i) => `${i + 1}`),
                values: Array.from({ length: 30 }, () => Math.floor(Math.random() * 400) + 400),
            },
        },
        week: {
            order: {
                labels: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'],
                values: [180, 190, 200, 210, 220, 230, 240],
            },
            revenue: {
                labels: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'],
                values: [600, 500, 700, 800, 600, 900, 700],
            },
        },
    } as const;
    
    // Get current data based on selected period
    const currentData = chartData[selectedPeriod];

    // Header configuration
    const headerActions = [
        {
            label: "Export Report",
            icon: <ChevronRightIcon className="w-5 h-5" />,
            onClick: () => console.log("Export report"),
            variant: 'secondary' as const,
        },
    ];

    // Tab configuration
    const tabs = [
        {
            key: 'overview',
            label: 'Tổng quan'
        },
        {
            key: 'orders',
            label: 'Đơn hàng'
        },
        {
            key: 'revenue',
            label: 'Doanh thu'
        }
    ];

    return (
        <div className="p-4">
            {/* Header - Using the Header component */}
            <Header 
                title="Thống kê"
                description="Quan sát tại danh sách các thành viên đã hoàn thành khóa học trong vòng 12 tháng"
                actions={headerActions}
            />

            {/* Navigation Tabs - Using the NavigationBar component */}
            <NavigationBar
                activeTab={selectedMetric}
                onTabChange={(tab) => setSelectedMetric(tab as 'overview' | 'orders' | 'revenue')}
                tabs={tabs}
            />

            {/* Time Filter */}
            <div className="flex flex-wrap space-x-0 space-y-2 sm:space-x-4 sm:space-y-0 mb-6">
                <button
                    onClick={() => setSelectedPeriod('year')}
                    className={`px-4 py-2 rounded-lg transition-colors ${selectedPeriod === 'year'
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                >
                    12 tháng
                </button>
                <button
                    onClick={() => setSelectedPeriod('month')}
                    className={`px-4 py-2 rounded-lg transition-colors ${selectedPeriod === 'month'
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                >
                    30 ngày
                </button>
                <button
                    onClick={() => setSelectedPeriod('week')}
                    className={`px-4 py-2 rounded-lg transition-colors ${selectedPeriod === 'week'
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                >
                    7 ngày
                </button>
                <button className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-300">
                    <Calendar1Icon className="w-5 h-5" />
                    Chọn chu kỳ
                </button>
            </div>

            {/* Content based on selected tab */}
            {selectedMetric === 'overview' && (
                <>
                    {/* Statistical Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        {STAT_CARDS_DATA.map((card, index) => (
                            <StatCard key={index} {...card} />
                        ))}
                    </div>

                    {/* Line Chart */}
                    <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold">Đơn hàng</h2>
                            <button className="text-blue-500 hover:underline">Chi tiết</button>
                        </div>
                        <LineChart
                            data={[...currentData.order.values]}
                            labels={[...currentData.order.labels]}
                            label="Đơn hàng"
                            maxValue={300}
                            color="#1E3A8A"
                            fillColor="rgba(30, 58, 138, 0.1)"
                        />
                    </div>

                    {/* Bar Chart */}
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold">Doanh số</h2>
                            <button className="text-blue-500 hover:underline">Chi tiết</button>
                        </div>
                        <BarChart
                            data={[...currentData.revenue.values]}
                            labels={[...currentData.revenue.labels]}
                            label="Doanh số"
                            maxValue={1000}
                            backgroundColor="#E5E7EB"
                            borderRadius={4}
                            barThickness={32}
                        />
                    </div>
                </>
            )}

            {selectedMetric === 'orders' && (
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold">Đơn hàng</h2>
                        <button className="text-blue-500 hover:underline">Chi tiết</button>
                    </div>
                    <LineChart
                        data={[...currentData.order.values]}
                        labels={[...currentData.order.labels]}
                        label="Đơn hàng"
                        maxValue={300}
                        color="#1E3A8A"
                        fillColor="rgba(30, 58, 138, 0.1)"
                    />
                </div>
            )}

            {selectedMetric === 'revenue' && (
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold">Doanh số</h2>
                        <button className="text-blue-500 hover:underline">Chi tiết</button>
                    </div>
                    <BarChart
                        data={[...currentData.revenue.values]}
                        labels={[...currentData.revenue.labels]}
                        label="Doanh số"
                        maxValue={1000}
                        backgroundColor="#E5E7EB"
                        borderRadius={4}
                        barThickness={32}
                    />
                </div>
            )}
        </div>
    );
};

export default AdminPage;