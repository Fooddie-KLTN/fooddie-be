'use client';


import { useCheckout } from './_hook/checkout';
import { CartItemsSection } from './_components/cart-item-section';
import { AddressSection } from './_components/address-section';
import { PaymentSection } from './_components/payment-section';
import { OrderNoteSection } from './_components/order-note-section';
import { OrderSummary } from './_components/order-summary';
import { EmptyCart } from './_components/emty-cart';

export default function CheckoutPage() {
  const {
    displayCartItems,
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
    calculating
  } = useCheckout();

  // Add this wrapper function
  const handlePaymentMethodChange = (method: string) => {
    setPaymentMethod(method);
    setShowOnlineDropdown(false);
  };

  return (
    <div className="container mx-auto px-2 py-8 max-w-5xl min-h-screen">
      <h1 className="text-3xl font-bold mb-8 text-center md:text-left">Thanh toán</h1>
      {initialLoading ? (
        <div className="text-center py-10">Đang tải giỏ hàng...</div>
      ) : !displayCartItems || displayCartItems.length === 0 ? (
        <EmptyCart />
      ) : (
        <div className="flex flex-col md:flex-row gap-8">
          {/* LEFT: Address & Payment */}
          <div className="flex-1 flex flex-col gap-6">
            <CartItemsSection
              displayCartItems={displayCartItems}
              onUpdateQuantity={handleUpdateQuantity}
              onRemoveFromCart={handleRemoveFromCart}
              formatPrice={formatPrice}
            />
            <AddressSection
              userAddresses={userAddresses}
              selectedUserAddressId={selectedUserAddressId}
              onSetDefaultAddress={handleSetDefaultAddress}
            />
            <PaymentSection
              paymentMethod={paymentMethod}
              showOnlineDropdown={showOnlineDropdown}
              onPaymentMethodChange={handlePaymentMethodChange} // use the wrapper
              onToggleDropdown={() => setShowOnlineDropdown((prev) => !prev)}
            />
            <OrderNoteSection
              orderNote={orderNote}
              onOrderNoteChange={setOrderNote}
            />
          </div>
          {/* RIGHT: Order Summary */}
          <div className="md:w-[380px] w-full">

            <OrderSummary
              displayCartItems={displayCartItems}
              totalPrice={calculation?.foodTotal ?? 0}
              shippingFee={calculation?.shippingFee ?? 0}
              distance={calculation?.distance ?? 0}
              total={calculation?.total ?? 0}
              calculating={calculating}
              selectedUserAddressId={selectedUserAddressId}
              onOrder={handleOrder}
              formatPrice={formatPrice}
            />
          </div>
        </div>
      )}
    </div>
  );
}