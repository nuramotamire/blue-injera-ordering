// 📄 app/item/[id].tsx

import CustomButton from '@/components/CustomButton';
import { getMenu } from '@/lib/appwrite';
import { useCartStore } from '@/store/Cart.store';
import { MenuItem } from '@/type';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ItemDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { addItem } = useCartStore();

  const [item, setItem] = useState<MenuItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCustomizations, setSelectedCustomizations] = useState<string[]>([]);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getMenu({ category: '', query: '', limit: 1 })
      .then((items) => {
        const found = items.find((i) => i.$id === id);
        setItem(found || null);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const toggleCustomization = (name: string) => {
    setSelectedCustomizations((prev) =>
      prev.includes(name)
        ? prev.filter((c) => c !== name)
        : [...prev, name]
    );
  };

  const handleAddToCart = () => {
    if (!item) return;

    // Map names → full customization objects (from dummyData or Appwrite)
    // For now, use placeholder — you’ll fetch customizations by menuId later
    const customizations = selectedCustomizations.map((name) => ({
      id: name.toLowerCase().replace(/\s+/g, '_'),
      name,
      price: Math.floor(Math.random() * 30) + 10, // 🔜 replace with real data
      type: 'topping',
    }));

    addItem({
      id: item.$id,
      name: item.name,
      price: item.price,
      image_url: item.image_url,
      customizations,
    });
    router.back();
  };

  if (loading) return <Text className="p-5">Loading...</Text>;
  if (!item) return <Text className="p-5">Item not found</Text>;

  const isOutOfStock = !item.isAvailable || item.stock <= 0;

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView>
        {/* Image */}
        <View className="h-64 bg-gray-100">
          <Image
            source={{ uri: item.image_url }}
            className="w-full h-full"
            resizeMode="contain"
          />
        </View>

        <View className="p-5">
          {/* Name & Price */}
          <Text className="h2-bold text-dark-100">{item.name}</Text>
          <Text className="body-regular text-gray-500 mt-1">
            {item.description}
          </Text>

          <View className="flex-row items-center mt-2">
            <Text className="h3-bold text-primary">${item.price}</Text>
            {isOutOfStock ? (
              <Text className="ml-3 text-red-500 font-bold">Out of Stock</Text>
            ) : item.stock <= 5 ? (
              <Text className="ml-3 text-amber-600">Only {item.stock} left!</Text>
            ) : null}
          </View>

          {/* Customizations (toppings/sides) */}
          <View className="mt-6">
            <Text className="h3-bold text-dark-100 mb-3">Customize</Text>
            {[
              'Extra Cheese',
              'Jalapeños',
              'Onions',
              'Bacon',
              'Fries',
              'Coke',
            ].map((name) => (
              <TouchableOpacity
                key={name}
                className={`flex-row items-center p-3 rounded-lg mb-2 ${
                  selectedCustomizations.includes(name)
                    ? 'bg-primary/10 border border-primary'
                    : 'bg-gray-100'
                }`}
                onPress={() => toggleCustomization(name)}
              >
                <View
                  className={`w-5 h-5 rounded-full border mr-3 ${
                    selectedCustomizations.includes(name)
                      ? 'bg-primary border-primary'
                      : 'border-gray-400'
                  }`}
                />
                <Text className="body-medium">{name}</Text>
                <Text className="ml-auto body-medium text-gray-500">
                  +${Math.floor(Math.random() * 30) + 10} {/* 🔜 real price */}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Add to Cart */}
          <CustomButton
            title={isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
            onPress={handleAddToCart}
            disabled={isOutOfStock}
            style={`mt-6 ${
              isOutOfStock ? 'bg-gray-300' : 'bg-primary'
            }`}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}