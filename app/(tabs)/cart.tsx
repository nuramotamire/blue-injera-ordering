// 📄 /home/hope/Desktop/reactNative/client/Blue_Injera/blue_injera_ordering/app/(tabs)/cart.tsx

import CartItem from '@/components/CartItem';
import CustomButton from '@/components/CustomButton';
import CustomHeader from '@/components/CustomHeader';
import { getMenu } from '@/lib/appwrite';
import { useCartStore } from '@/store/Cart.store';
import { MenuItem, PaymentInfoStripeProps } from '@/type';
import cn from 'clsx';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const PaymentInfoStripe = ({ label, value, labelStyle, valueStyle }: PaymentInfoStripeProps) => (
  <View className="flex-between flex-row my-1">
    <Text className={cn('paragraph-medium text-gray-200', labelStyle)}>{label}</Text>
    <Text className={cn('paragraph-bold text-dark-100', valueStyle)}>{value}</Text>
  </View>
);

export default function Cart() {
  const { items, getTotalItems, getTotalPrice, getDiscountedTotal } = useCartStore();
  const totalItems = getTotalItems();
  const subtotal = getTotalPrice();
  const deliveryFee = 5.0;
  const total = getDiscountedTotal(deliveryFee); // ✅ Uses loyalty discount from store
  const discountAmount = subtotal + deliveryFee - total; // savings

  const [stockWarnings, setStockWarnings] = useState<string[]>([]);

  // 🔹 Validate stock against real Appwrite data
  useEffect(() => {
    if (items.length === 0) {
      setStockWarnings([]);
      return;
    }

    const validateStock = async () => {
      try {
        // 🔹 Fetch current menu items (only IDs in cart)
        const menuIds = items.map((i) => i.id);
        const menuItems = await getMenu({ category: '', query: '', limit: 100 });
        const currentMenuMap = new Map(menuItems.map((m) => [m.$id, m]));

        const warnings: string[] = [];
        items.forEach((item) => {
          const menuItem = currentMenuMap.get(item.id) as MenuItem | undefined;
          if (!menuItem || !menuItem.isAvailable || menuItem.stock < item.quantity) {
            const available = menuItem?.stock ?? 0;
            warnings.push(`${item.name}: only ${available} available`);
          }
        });

        setStockWarnings(warnings);
      } catch (e) {
        console.warn('⚠️ Stock validation failed — using optimistic mode');
        setStockWarnings([]);
      }
    };

    validateStock();
  }, [items]);

  return (
    <SafeAreaView className="bg-white h-full">
      <FlatList
        data={items}
        renderItem={({ item }) => <CartItem item={item} />}
        keyExtractor={(item) => item.id}
        contentContainerClassName="pb-28 px-5 pt-5"
        ListHeaderComponent={() => <CustomHeader title="Your Cart" />}
        ListEmptyComponent={() => <Text className="text-center mt-10 text-gray-500">Cart is empty</Text>}
        ListFooterComponent={() =>
          totalItems > 0 && (
            <View className="gap-5">
              {/* Stock Warnings */}
              {stockWarnings.length > 0 && (
                <View className="bg-red-50 p-4 rounded-xl border border-red-200">
                  <Text className="text-red-700 body-medium">
                    ⚠️ Stock issues: {stockWarnings.join(', ')}
                  </Text>
                </View>
              )}

              {/* Payment Summary */}
              <View className="mt-6 border border-gray-200 p-5 rounded-2xl">
                <Text className="h3-bold text-dark-100 mb-5">Payment Summary</Text>

                <PaymentInfoStripe
                  label={`Subtotal (${totalItems} items)`}
                  value={`$${subtotal.toFixed(2)}`}
                />
                <PaymentInfoStripe label="Delivery Fee" value={`$${deliveryFee.toFixed(2)}`} />
                {discountAmount > 0 && (
                  <PaymentInfoStripe
                    label="Loyalty Discount"
                    value={`- $${discountAmount.toFixed(2)}`}
                    valueStyle="!text-success"
                  />
                )}
                <View className="border-t border-gray-300 my-2" />
                <PaymentInfoStripe
                  label="Total"
                  value={`$${total.toFixed(2)}`}
                  labelStyle="base-bold !text-dark-100"
                  valueStyle="base-bold !text-dark-100"
                />
              </View>

              {/* Action Button */}
              <CustomButton
                title={stockWarnings.length > 0 ? 'Update Cart' : 'Proceed to Checkout'}
                onPress={() => {
                  if (stockWarnings.length > 0) {
                    Alert.alert(
                      'Stock Issue',
                      'Some items are out of stock. Please update quantities or remove them.',
                      [{ text: 'OK' }]
                    );
                    return;
                  }
                  router.push('/checkout');
                }}
              />
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}