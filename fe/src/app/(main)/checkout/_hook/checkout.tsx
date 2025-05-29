/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { useCart } from '@/context/cart-context';
import { useAuth } from '@/context/auth-context';
import { userApi } from '@/api/user';
import { Address } from '@/interface';
import { CalculateOrderResponse, OrderResponse } from '@/api/response.interface';
import { useRouter } from 'next/navigation';

export const useCheckout = () => {
    const { cartItems, removeFromCart, updateQuantity, getCartItems, getTotalPrice } = useCart();
    const { user, getToken } = useAuth();
    const router = useRouter();

    const [displayCartItems, setDisplayCartItems] = useState<any[]>([]);
    const [totalPrice, setTotalPrice] = useState(0);
    const [, setLoadingCart] = useState(true);
    const [initialLoading, setInitialLoading] = useState(true);
    const [userAddresses, setUserAddresses] = useState<Address[]>([]);
    const [selectedUserAddressId, setSelectedUserAddressId] = useState<string | null>(null);
    const [paymentMethod, setPaymentMethod] = useState<string>('cod');
    const [showOnlineDropdown, setShowOnlineDropdown] = useState(false);
    const [orderNote, setOrderNote] = useState('');

    const [calculation, setCalculation] = useState<CalculateOrderResponse | null>(null);
    const [calculating, setCalculating] = useState(false);


    useEffect(() => {
        const fetchCart = async () => {
            if (initialLoading) setLoadingCart(true);
            const items = await getCartItems();
            setDisplayCartItems(items);
            setTotalPrice(await getTotalPrice());
            setLoadingCart(false);
            if (initialLoading) setInitialLoading(false);
        };
        fetchCart();
    }, [cartItems, getCartItems, getTotalPrice, initialLoading]);

    useEffect(() => {
        const fetchUserAddresses = async () => {
            if (!user) return;
            try {
                const token = await getToken();
                if (!token) {
                    setUserAddresses([]);
                    return;
                }
                const profile = await userApi.getMe(token);
                setUserAddresses(profile?.address || []);
                for (const address of profile?.address || []) {
                    if (address.isDefault) {
                        setSelectedUserAddressId(address.id || null);
                        break;
                    }
                }
            } catch {
                setUserAddresses([]);
            }
        };
        fetchUserAddresses();
    }, [user, getToken]);
    useEffect(() => {
        const calc = async () => {
            if (
                !selectedUserAddressId ||
                !displayCartItems ||
                displayCartItems.length === 0 ||
                !displayCartItems[0]?.restaurant?.id
            ) {
                setCalculation(null);
                return;
            }
            setCalculating(true);
            try {
                const items = displayCartItems.map(item => ({
                    foodId: item.foodId || item.id,
                    quantity: item.quantity,
                }));
                const result = await userApi.order.calculateOrder(
                    selectedUserAddressId,
                    displayCartItems[0].restaurant.id,
                    items
                );
                setCalculation(result);
            } catch (e) {
                if (e instanceof Error) {
                    console.error('Failed to calculate order:', e.message);
                }
                setCalculation(null);
            }
            setCalculating(false);
        };
        calc();
    }, [displayCartItems, selectedUserAddressId]);

    const handleSetDefaultAddress = (addressId: string) => {
        setUserAddresses(prev =>
            prev.map(addr => ({
                ...addr,
                isDefault: addr.id === addressId,
            }))
        );
        setSelectedUserAddressId(addressId);
    };

    const handleUpdateQuantity = (id: string, qty: number) => {
        updateQuantity(id, qty);
    };

    const handleRemoveFromCart = (id: string) => {
        removeFromCart(id);
    };

    const handleOrder = async () => {
        if (!user || !selectedUserAddressId || displayCartItems.length === 0) return;

        const orderPayload = {
            userId: user.id,
            restaurantId: displayCartItems[0]?.restaurant?.id,
            addressId: selectedUserAddressId,
            total: totalPrice,
            note: orderNote,
            paymentMethod,
            orderDetails: displayCartItems.map(item => ({
                foodId: item.id,
                quantity: String(item.quantity),
                price: String(item.price),
                note: item.note || '',
            })),
        };

        try {
            const token = await getToken();
            if (!token) {
                console.error('User is not authenticated');
                return;
            }
            const response: OrderResponse = await userApi.order.createOrder(token, orderPayload);

            if (response.paymentUrl) {
                window.location.href = response.paymentUrl;
                return;
            }

            router.push(`/orders/${response.order.id}`);
        } catch (err) {
            console.error('Failed to create order:', err);
        }
    };

    const formatPrice = (price: number) => {
        return price.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
    };

    return {
        displayCartItems,
        totalPrice,
        initialLoading,
        userAddresses,
        selectedUserAddressId,
        paymentMethod,
        showOnlineDropdown,
        orderNote,
        setPaymentMethod,
        setShowOnlineDropdown,
        setOrderNote,
        handleSetDefaultAddress,
        handleUpdateQuantity,
        handleRemoveFromCart,
        handleOrder,
        formatPrice,
        calculation,
        calculating,
    };
};