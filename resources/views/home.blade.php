@extends('layouts.app')

@section('title', 'Fooddie - Đặt đồ ăn trực tuyến')

@section('content')
    <!-- Hero Section -->
    <section class="mb-12 text-center">
        <h1 class="text-4xl font-bold mb-4">Đặt món ngay - Giao tận nơi</h1>
        <div class="max-w-2xl mx-auto">
            <form class="flex">
                <input type="text" placeholder="Tìm kiếm món ăn hoặc nhà hàng..." 
                       class="flex-1 px-4 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-red-500">
                <button class="px-6 py-2 bg-red-600 text-white rounded-r-lg hover:bg-red-700">
                    Tìm kiếm
                </button>
            </form>
        </div>
    </section>

    <!-- Near Me Section -->
    <section class="mb-12">
        <h2 class="text-2xl font-bold mb-6 flex items-center">
            <svg class="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
            Gần bạn
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            @for($i = 0; $i < 4; $i++)
                <div class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                    <img src="https://via.placeholder.com/400x300" alt="Restaurant" class="w-full h-48 object-cover">
                    <div class="p-4">
                        <h3 class="font-bold mb-2">Nhà hàng Example {{ $i + 1 }}</h3>
                        <div class="flex items-center text-sm text-gray-600 mb-2">
                            <span class="text-yellow-500">★</span>
                            <span>4.5 (200+)</span>
                            <span class="mx-2">•</span>
                            <span>1.2km</span>
                        </div>
                        <div class="text-sm text-gray-600">🍕 Đồ Âu • $$$</div>
                    </div>
                </div>
            @endfor
        </div>
    </section>

    <!-- Categories -->
    <section class="mb-12">
        <h2 class="text-2xl font-bold mb-6">Danh mục phổ biến</h2>
        <div class="flex overflow-x-auto pb-4 space-x-4">
            @foreach(['Đồ ăn nhanh', 'Đồ chay', 'Món Âu', 'Món Á', 'Đồ uống', 'Tráng miệng'] as $category)
                <div class="flex-shrink-0 w-48 bg-white rounded-lg p-4 shadow-md">
                    <div class="text-center">
                        <div class="mb-2 text-4xl">🍔</div>
                        <h3 class="font-medium">{{ $category }}</h3>
                    </div>
                </div>
            @endforeach
        </div>
    </section>

    <!-- Popular Foods -->
    <section class="mb-12">
        <h2 class="text-2xl font-bold mb-6">Món ăn phổ biến</h2>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            @for($i = 0; $i < 8; $i++)
                <div class="bg-white rounded-lg shadow-md p-4">
                    <img src="https://via.placeholder.com/200x200" alt="Food" class="w-full h-40 object-cover rounded-lg mb-3">
                    <h3 class="font-medium mb-1">Pizza Hải Sản {{ $i + 1 }}</h3>
                    <div class="flex justify-between items-center">
                        <span class="text-red-600 font-bold">250.000đ</span>
                        <button class="px-3 py-1 bg-red-100 text-red-600 rounded-full text-sm hover:bg-red-200">
                            + Thêm
                        </button>
                    </div>
                </div>
            @endfor
        </div>
    </section>

    <!-- Sale Section -->
    <section class="mb-12 bg-red-100 rounded-xl p-8">
        <div class="flex flex-col md:flex-row items-center justify-between">
            <div class="md:w-1/2 mb-6 md:mb-0">
                <h2 class="text-3xl font-bold mb-4">Giảm giá đến 50%</h2>
                <p class="text-gray-600 mb-6">Đặt ngay các món ăn yêu thích và tận hưởng ưu đãi đặc biệt!</p>
                <button class="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700">
                    Xem tất cả ưu đãi
                </button>
            </div>
            <div class="md:w-1/2">
                <img src="https://via.placeholder.com/500x300" alt="Sale" class="rounded-lg">
            </div>
        </div>
    </section>
@endsection
