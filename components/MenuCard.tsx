// 📄 components/MenuCard.tsx

import { useCartStore } from '@/store/Cart.store';
import { MenuItem } from '@/type';
import React from 'react';
import { Image, Platform, Text, TouchableOpacity, View } from 'react-native';

const MenuCard = ({ item }: { item: MenuItem }) => {
  const { addItem } = useCartStore();
  const { $id, image_url, name, price, stock, isAvailable } = item;

  const isOutOfStock = !isAvailable || stock <= 0;
  const displayPrice = isOutOfStock ? 'Out of Stock' : `From $${price}`;

  return (
    <TouchableOpacity
      className={`menu-card ${
        isOutOfStock
          ? 'opacity-50'
          : Platform.OS === 'android'
          ? 'elevation-10 shadow-md'
          : ''
      }`}
      disabled={isOutOfStock}
      style={
        !isOutOfStock && Platform.OS === 'android'
          ? { elevation: 10, shadowColor: '#878787' }
          : {}
      }
      onPress={() => {
        if (!isOutOfStock) {
          addItem({
            id: $id,
            name,
            price,
            image_url,
            customizations: [],
          });
        }
      }}
    >
      <Image
        source={{ uri: image_url }}
        className="size-32 absolute -top-10"
        resizeMode="contain"
        onError={(e) => console.warn('🖼️ Load failed:', e.nativeEvent.error)}
      />

      <View className="flex-1 justify-end pb-4 px-2">
        <Text className="text-center base-bold text-dark-100 mb-1" numberOfLines={1}>
          {name}
        </Text>
        <Text
          className={`body-regular ${
            isOutOfStock ? 'text-red-500 font-bold' : 'text-gray-200'
          } mb-2`}
        >
          {displayPrice}
        </Text>

        {!isOutOfStock && stock <= 5 && (
          <Text className="text-xs text-amber-600 font-medium">
            Only {stock} left!
          </Text>
        )}

        {!isOutOfStock && (
          <Text className="paragraph-bold text-primary">Add to Cart</Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

export default MenuCard;