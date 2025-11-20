// 📄 /home/hope/Desktop/reactNative/client/Blue_Injera/blue_injera_ordering/app/checkout.tsx

import CustomButton from '@/components/CustomButton';
import CustomInput from '@/components/CustomInput';
import { appwriteConfig, createOrder, createOrUpdateLoyalty, getLoyalty } from '@/lib/appwrite';
import useAuthStore from '@/store/auth.store';

import { useCartStore } from '@/store/Cart.store';
import { Loyalty, PaymentInfoStripeProps } from '@/type';
import cn from 'clsx';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const PaymentInfoStripe = ({ label, value, labelStyle, valueStyle }: PaymentInfoStripeProps) => (
  <View className="flex-between flex-row my-1">
    <Text className={cn("paragraph-medium text-gray-200", labelStyle)}>{label}</Text>
    <Text className={cn("paragraph-bold text-dark-100", valueStyle)}>{value}</Text>
  </View>
);

export default function Checkout() {
  const { items, getTotalItems, getTotalPrice, clearCart, setLoyaltyDiscount } = useCartStore();
  const { user } = useAuthStore();

  const [deliveryAddress, setDeliveryAddress] = useState('Zagreb, Croatia');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'credit'>('cash');
  const [useLoyalty, setUseLoyalty] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [stockWarnings, setStockWarnings] = useState<string[]>([]);
  const [loyalty, setLoyalty] = useState<Loyalty | null>(null);

  const totalItems = getTotalItems();
  const subtotal = getTotalPrice();
  const deliveryFee = 5.0;

  // 🔹 Compute dynamic discount based on tier + toggle
  const tierDiscountPercent = loyalty?.tier === 'gold' ? 10 : loyalty?.tier === 'silver' ? 5 : 0;
  const loyaltyDiscountValue = useLoyalty ? (subtotal * tierDiscountPercent) / 100 : 0;
  const total = subtotal + deliveryFee - loyaltyDiscountValue;

  // 🔹 Fetch loyalty on load
  useEffect(() => {
    const fetchLoyalty = async () => {
      if (user?.$id) {
        const data = await getLoyalty(user.$id);
        if (data) {
          setLoyalty(data);
          setLoyaltyDiscount(tierDiscountPercent); // sync with store
        } else {
          setLoyaltyDiscount(0);
        }
      }
    };
    fetchLoyalty();
  }, [user?.$id]);

  // 🔹 Validate stock (mock for now)
  useEffect(() => {
    const warnings: string[] = [];
    items.forEach((item) => {
      // 🔜 Replace with real Appwrite stock check
      const availableStock = 10; // placeholder
      if (item.quantity > availableStock) {
        warnings.push(`${item.name}: only ${availableStock} available`);
      }
    });
    setStockWarnings(warnings);
  }, [items]);

  const handlePlaceOrder = async () => {
    if (stockWarnings.length > 0) {
      Alert.alert('Stock Issue', 'Some items are out of stock. Please update your cart.');
      return;
    }
    if (!deliveryAddress.trim()) {
      Alert.alert('Validation', 'Please enter a delivery address.');
      return;
    }

    setIsLoading(true);

    try {
      const orderData = {
        userId: user?.$id || 'guest',
        items,
        total,
        deliveryAddress,
        paymentMethod,
        status: 'pending' as const,
      };
      console.log('🔍 Creating loyalty doc in collection:', appwriteConfig.loyaltyTableId);
        console.log('📋 Full config:', {
        loyaltyTableId: appwriteConfig.loyaltyTableId,
        databaseId: appwriteConfig.databaseId
        });

      const order = await createOrder(orderData);
      console.log('✅ Order created:', order.$id);

      // 🔹 Update loyalty points ($1 = 1 point)
      if (user?.$id) {
        const newPoints = (loyalty?.points || 0) + Math.floor(subtotal);
        const newTier = newPoints >= 100 ? 'gold' : newPoints >= 50 ? 'silver' : 'bronze';
        await createOrUpdateLoyalty(user.$id, newPoints, newTier);
      }

      // 🔹 Clear cart & navigate
      clearCart();
      router.replace(`/order-confirmation?orderId=${order.$id}`);
    } catch (error: any) {
      console.error('❌ Order failed:', error);
      Alert.alert('Order Failed', error.message || 'Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (totalItems === 0) {
    return (
      <SafeAreaView className="flex-1 bg-white p-5">
        <Text className="h2-bold text-center mt-20">Your cart is empty</Text>
        <CustomButton
          title="Go to Menu"
          onPress={() => router.replace('/(tabs)/index')}
          style="mt-6"
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView contentContainerClassName="p-5 pb-32">
        {/* Delivery Address */}
        <View className="mb-6">
          <Text className="h3-bold text-dark-100 mb-3">Delivery Address</Text>
          <CustomInput
            label="Address"
            value={deliveryAddress}
            onChangeText={setDeliveryAddress}
            placeholder="e.g., Ilica 1, Zagreb"
          />
        </View>

        {/* Payment Method */}
        <View className="mb-6">
          <Text className="h3-bold text-dark-100 mb-3">Payment Method</Text>
          <View className="flex-row gap-4">
            {(['cash', 'credit'] as const).map((method) => (
              <TouchableOpacity
                key={method}
                className={`flex-1 p-4 rounded-xl border ${
                  paymentMethod === method
                    ? 'border-primary bg-primary/10'
                    : 'border-gray-300'
                }`}
                onPress={() => setPaymentMethod(method)}
              >
                <Text
                  className={`body-medium text-center ${
                    paymentMethod === method ? 'text-primary font-bold' : ''
                  }`}
                >
                  {method === 'cash' ? 'Cash on Delivery' : 'Credit on Delivery'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Loyalty Discount */}
        <View className="mb-6">
          <TouchableOpacity
            className="flex-row items-center p-4 bg-gray-50 rounded-xl"
            onPress={() => setUseLoyalty(!useLoyalty)}
            disabled={!loyalty}
          >
            <View
              className={`w-5 h-5 rounded-full border mr-3 ${
                useLoyalty && loyalty
                  ? 'bg-primary border-primary'
                  : 'border-gray-400'
              }`}
            />
            <View>
              <Text className="body-bold">
                {loyalty?.tier === 'gold'
                  ? 'Gold Tier (10% off)'
                  : loyalty?.tier === 'silver'
                  ? 'Silver Tier (5% off)'
                  : 'Bronze Tier (No discount)'}
              </Text>
              <Text className="body-regular text-gray-500">
                {loyalty ? `${loyalty.points} pts` : 'Join loyalty program'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Stock Warnings */}
        {stockWarnings.length > 0 && (
          <View className="mb-6 bg-red-50 p-4 rounded-xl border border-red-200">
            <Text className="text-red-700 body-medium">
              ⚠️ Stock issues: {stockWarnings.join(', ')}
            </Text>
          </View>
        )}

        {/* Order Summary */}
        <View className="mb-6 border border-gray-200 p-5 rounded-2xl">
          <Text className="h3-bold text-dark-100 mb-4">Order Summary</Text>

          <PaymentInfoStripe
            label={`Subtotal (${totalItems} items)`}
            value={`$${subtotal.toFixed(2)}`}
          />
          <PaymentInfoStripe label="Delivery Fee" value={`$${deliveryFee.toFixed(2)}`} />
          <PaymentInfoStripe
            label="Loyalty Discount"
            value={useLoyalty ? `-$${loyaltyDiscountValue.toFixed(2)}` : '$0.00'}
            valueStyle={useLoyalty ? '!text-success' : ''}
          />
          <View className="border-t border-gray-300 my-2" />
          <PaymentInfoStripe
            label="Total"
            value={`$${total.toFixed(2)}`}
            labelStyle="base-bold !text-dark-100"
            valueStyle="base-bold !text-dark-100"
          />
        </View>

        {/* Place Order Button */}
        <CustomButton
          title="Place Order"
          onPress={handlePlaceOrder}
          isLoading={isLoading}
          disabled={stockWarnings.length > 0 || isLoading}
          style={stockWarnings.length > 0 ? 'bg-gray-300' : ''}
        />
      </ScrollView>
    </SafeAreaView>
  );
}