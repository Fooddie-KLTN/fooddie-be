import { apiRequest } from "./base-api";
import { FoodPreview, FoodDetail, Restaurant, Category } from "../interface";
import { PaginatedResponse } from "./response.interface";

export const guestService = {
    food: {
        async getFoodsWithQuerry(
            page: number = 1,
            pageSize: number = 10,
            lat: number = 10.7769,
            lng: number = 106.6951,
        ): Promise<PaginatedResponse<FoodPreview>> {
            return apiRequest<PaginatedResponse<FoodPreview>>(`/foods`, "GET", { query: { page, pageSize, lat, lng } });
        },
        async getFoodsWithDiscount(
            page: number = 1,
            pageSize: number = 10,
            lat: number = 10.7769,
            lng: number = 106.6951,
        ): Promise<PaginatedResponse<FoodPreview>> {
            return apiRequest<PaginatedResponse<FoodPreview>>(`/foods/with-discount`, "GET", { query: { page, pageSize, lat, lng } });
        },
        async getTopSellingFoods(
            page: number = 1,
            pageSize: number = 10,
            lat: number = 10.7769,
            lng: number = 106.6951,
        ): Promise<PaginatedResponse<FoodPreview>> {
            return apiRequest<PaginatedResponse<FoodPreview>>(`/foods/top-selling`, "GET", { query: { page, pageSize, lat, lng } });
        },
        async getNewestFoods(
            page: number = 1,
            pageSize: number = 10,
            lat: number = 10.7769,
            lng: number = 106.6951,
        ): Promise<PaginatedResponse<FoodPreview>> {
            return apiRequest<PaginatedResponse<FoodPreview>>(`/foods/newest`, "GET", { query: { page, pageSize, lat, lng } });
        },
        async getFoodsByCategory(
            categoryId: string,
            page: number = 1,
            pageSize: number = 10,
            lat: number = 10.7769,
            lng: number = 106.6951,
        ): Promise<PaginatedResponse<FoodPreview>> {
            return apiRequest<PaginatedResponse<FoodPreview>>(`/foods/category/${categoryId}`, "GET", { query: { page, pageSize, lat, lng } });
        },
        async getFoodsByRestaurant(
            restaurantId: string,
            page: number = 1,
            pageSize: number = 10,
            lat: number = 10.7769,
            lng: number = 106.6951,
        ): Promise<PaginatedResponse<FoodPreview>> {
            return apiRequest<PaginatedResponse<FoodPreview>>(`/foods/restaurant/${restaurantId}`, "GET", { query: { page, pageSize, lat, lng } });
        },
        async getFoodsByCategoryAndRestaurant(
            categoryId: string,
            restaurantId: string,
            page: number = 1,
            pageSize: number = 10,
            lat: number = 10.7769,
            lng: number = 106.6951,
        ): Promise<PaginatedResponse<FoodPreview>> {
            return apiRequest<PaginatedResponse<FoodPreview>>(`/foods/category/${categoryId}/restaurant/${restaurantId}`, "GET", { query: { page, pageSize, lat, lng } });
        },
        async getFoodsWithDiscountByRestaurant(
            restaurantId: string,
            page: number = 1,
            pageSize: number = 10,
            lat: number = 10.7769,
            lng: number = 106.6951,
        ): Promise<PaginatedResponse<FoodPreview>> {
            return apiRequest<PaginatedResponse<FoodPreview>>(`/foods/restaurant/${restaurantId}/with-discount`, "GET", { query: { page, pageSize, lat, lng } });
        },
        async getTopSellingFoodsByRestaurant(
            restaurantId: string,
            page: number = 1,
            pageSize: number = 10,
            lat: number = 10.7769,
            lng: number = 106.6951,
        ): Promise<PaginatedResponse<FoodPreview>> {
            return apiRequest<PaginatedResponse<FoodPreview>>(`/foods/restaurant/${restaurantId}/top-selling`, "GET", { query: { page, pageSize, lat, lng } });
        },
        async getFoodById(
            id: string,
            lat: number = 10.7769,
            lng: number = 106.6951,
        ): Promise<FoodDetail> {
            return apiRequest<FoodDetail>(`/foods/${id}`, "GET", { query: { lat, lng } });
        },
        async searchFoods(
            query: string,
            page: number = 1,
            pageSize: number = 10,
            lat: number = 10.7769,
            lng: number = 106.6951,
            radius: number = 5
        ): Promise<PaginatedResponse<FoodPreview>> {
            return apiRequest<PaginatedResponse<FoodPreview>>(`/foods/search`, "GET", { query: { query, page, pageSize, lat, lng, radius } });
        },
    },
    restaurant: {
        async getRestaurants(
            page: number = 1,
            pageSize: number = 10,
            lat: number = 10.7769,
            lng: number = 106.6951,
        ): Promise<PaginatedResponse<Restaurant>> {
            return apiRequest<PaginatedResponse<Restaurant>>(`/restaurants`, "GET", { query: { page, pageSize, lat, lng } });
        },
        getPopularRestaurants: async (
            lat: number = 10.7769,
            lng: number = 106.6951
        ): Promise<{ items: (Restaurant & { foods: FoodPreview[] })[] }> => {
            return apiRequest<{ items: (Restaurant & { foods: FoodPreview[] })[] }>(
                `/restaurants/popular`,
                "GET",
                { query: { lat, lng } }
            );
        },
        async getAllRestaurants(
            page: number = 1,
            pageSize: number = 10,
            lat: number = 10.7769,
            lng: number = 106.6951,
        ): Promise<PaginatedResponse<Restaurant>> {
            return apiRequest<PaginatedResponse<Restaurant>>(`/restaurants`, "GET", { query: { page, pageSize, lat, lng } });
        },
        async getPreviewRestaurants(
            page: number = 1,
            pageSize: number = 10,
            lat: number = 10.7769,
            lng: number = 106.6951,
        ): Promise<PaginatedResponse<Restaurant>> {
            return apiRequest<PaginatedResponse<Restaurant>>(`/restaurants/preview`, "GET", { query: { page, pageSize, lat, lng } });
        },
        async getRestaurantById(
            id: string,
            lat: number = 10.7769,
            lng: number = 106.6951,
        ): Promise<Restaurant> {
            return apiRequest<Restaurant>(`/restaurants/${id}`, "GET", { query: { lat, lng } });
        },
        async searchRestaurants(
            name: string,
            page: number = 1,
            pageSize: number = 10,
            lat: number = 10.7769,
            lng: number = 106.6951,
            radius: number = 5
        ): Promise<PaginatedResponse<Restaurant>> {
            return apiRequest<PaginatedResponse<Restaurant>>(`/restaurants/search`, "GET", { query: { name, page, pageSize, lat, lng, radius } });
        },
    },
    category: {
        async getCategories(
            page: number = 1,
            pageSize: number = 20
        ): Promise<PaginatedResponse<Category>> {
            return apiRequest<PaginatedResponse<Category>>(`/categories`, "GET", { query: { page, pageSize } });
        },
        async getCategoryById(id: string): Promise<Category> {
            return apiRequest<Category>(`/categories/${id}`, "GET");
        }
    }
};