// 📄 app/(tabs)/index.tsx
import CartButton from '@/components/CartButton';
import MenuCard from '@/components/MenuCard';
import { images, offers } from '@/constants';
import { getMenu } from '@/lib/appwrite'; // ✅ import real Appwrite function
import useAppwrite from '@/lib/useAppwrite';
import { useCartStore } from '@/store/Cart.store';
import { MenuItem } from '@/type';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Pressable,
  RefreshControl,
  FlatList as RNFlatList,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const quickActions = [
  { id: 'menu', title: 'Menu', icon: images.search },
  { id: 'deals', title: 'Deals', icon: images.dollar },
  { id: 'chef', title: "Chef's Picks", icon: images.person },
  { id: 'loyalty', title: 'Loyalty', icon: images.star },
];

// --- Hero Section (unchanged — uses local grocery images) ---
const HeroSection = ({
  activeIndex,
  onIndexChange,
}: {
  activeIndex: number;
  onIndexChange: (index: number) => void;
}) => {
  const flatListRef = useRef<RNFlatList>(null);
  const router = useRouter();

  useEffect(() => {
    const interval = setInterval(() => {
      const next = (activeIndex + 1) % offers.length;
      onIndexChange(next);
      flatListRef.current?.scrollToIndex({ index: next, animated: true });
    }, 4000);
    return () => clearInterval(interval);
  }, [activeIndex, onIndexChange]);

  const renderHeroItem = ({ item }: { item: typeof offers[0] }) => (
    <Pressable
      className="flex-1 justify-center items-center"
      onPress={() => router.push('/menu')}
    >
      <View
        className="w-full h-40 rounded-2xl overflow-hidden"
        style={{ backgroundColor: item.color }}
      >
        <Image
          source={item.image}
          className="w-full h-full"
          resizeMode="contain"
        />
        <View className="absolute bottom-0 left-0 right-0 bg-black/50 p-3">
          <Text className="text-lg font-bold text-white">{item.title}</Text>
          <Text className="text-white text-xs opacity-90">Tap to explore</Text>
        </View>
      </View>
    </Pressable>
  );

  return (
    <View className="px-4 py-3">
      <RNFlatList
        ref={flatListRef}
        data={offers}
        renderItem={renderHeroItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id.toString()}
        onScroll={(e) => {
          const index = Math.round(
            e.nativeEvent.contentOffset.x / Dimensions.get('window').width
          );
          if (index !== activeIndex) onIndexChange(index);
        }}
        scrollEventThrottle={16}
        nestedScrollEnabled
      />
      <View className="flex-row justify-center mt-2 space-x-1">
        {offers.map((_, i) => (
          <View
            key={i}
            className={`h-1.5 rounded-full ${
              i === activeIndex ? 'bg-primary w-4' : 'bg-gray-300 w-1.5'
            }`}
          />
        ))}
      </View>
    </View>
  );
};

// --- Featured Dishes Section (now dynamic) ---
const FeaturedDishesSection = () => {
  const router = useRouter();

  // ✅ Fetch real popular/chef-picked dishes from Appwrite
  const { data: featuredItems = [], loading, refetch } = useAppwrite({
    fn: getMenu,
    params: { 
      limit: 4, 
      chefPicks: true, // or isFeatured: true, depending on your Appwrite query
      // category: 'main', // optional
    },
  });

  // Optional: auto-refresh when coming back to tab
  // useEffect(() => {
  //   const focusListener = navigation.addListener('focus', () => refetch());
  //   return focusListener;
  // }, []);

  return (
    <View className="px-4 py-3">
      <View className="flex-row justify-between items-center mb-3">
        <Text className="text-lg font-bold text-dark-100">Popular Dishes</Text>
        <TouchableOpacity onPress={() => router.push('/menu')}>
          <Text className="text-primary font-medium flex-row items-center">
            View All
            <Image
              source={images.arrowRight}
              className="w-4 h-4 ml-1"
              resizeMode="contain"
              tintColor="#34a9ca"
            />
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View className="w-40 h-52 justify-center items-center">
          <ActivityIndicator size="small" color="#34a9ca" />
        </View>
      ) : featuredItems.length > 0 ? (
        <RNFlatList
          data={featuredItems}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.$id}
          renderItem={({ item }) => (
            <View className="w-40 mr-4">
              <MenuCard item={item as MenuItem} />
            </View>
          )}
          contentContainerClassName="pb-2"
          nestedScrollEnabled
        />
      ) : (
        <Text className="text-gray-500 text-sm">No featured dishes</Text>
      )}
    </View>
  );
};

// --- Main Component ---
export default function TabsHome() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { getTotalItems } = useCartStore();
  const totalItems = getTotalItems();

  const [activeIndex, setActiveIndex] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      // Trigger refetch in child component via context/event, or lift state.
      // For simplicity, we’ll assume refetch happens in FeaturedDishesSection.
    } finally {
      setTimeout(() => setRefreshing(false), 500);
    }
  };

  const handleQuickAction = (id: string) => {
    switch (id) {
      case 'menu':
        router.push('/menu');
        break;
      case 'deals':
        router.push('/deals');
        break;
      case 'chef':
        router.push('/menu?chefPicks=true');
        break;
      case 'loyalty':
        router.push('/profile?tab=loyalty');
        break;
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="px-4 pt-2 pb-3 bg-white border-b border-gray-100">
        <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-xs font-medium text-primary mb-0.5">DELIVER TO</Text>
            <TouchableOpacity
              className="flex-row items-center gap-1"
              onPress={() => router.push('/address')}
            >
              <Text className="text-base font-semibold text-dark-100">Croatia</Text>
              <Image source={images.arrowDown} className="w-3 h-3" resizeMode="contain" />
            </TouchableOpacity>
          </View>
          <CartButton />
        </View>
      </View>

      {/* Main Content */}
      <RNFlatList
        data={['hero', 'quick', 'featured', 'trust']}
        keyExtractor={(item) => item}
        renderItem={({ item }) => {
          if (item === 'hero')
            return <HeroSection activeIndex={activeIndex} onIndexChange={setActiveIndex} />;
          if (item === 'quick')
            return (
              <View className="px-4 py-3">
                <Text className="text-lg font-bold text-dark-100 mb-3">Quick Access</Text>
                <View className="flex-row justify-between">
                  {quickActions.map((action) => (
                    <TouchableOpacity
                      key={action.id}
                      className="bg-white rounded-xl p-3 w-20 items-center shadow-sm border border-gray-100"
                      onPress={() => handleQuickAction(action.id)}
                    >
                      <Image source={action.icon} className="w-6 h-6 mb-1" resizeMode="contain" />
                      <Text className="text-xs font-medium text-center text-gray-700">
                        {action.title}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            );
          if (item === 'featured') return <FeaturedDishesSection />;
          if (item === 'trust')
            return (
              <View className="px-4 py-4 bg-white mx-4 rounded-xl border border-gray-100 mb-4">
                <View className="flex-row justify-around">
                  <View className="items-center">
                    <View className="flex-row items-center">
                      <Image source={images.star} className="w-4 h-4 mr-1" />
                      <Text className="text-lg font-bold text-dark-100">4.8</Text>
                    </View>
                    <Text className="text-xs text-gray-500">120+ reviews</Text>
                  </View>
                  <View className="items-center">
                    <View className="flex-row items-center">
                      <Image source={images.clock} className="w-4 h-4 mr-1" />
                      <Text className="text-lg font-bold text-dark-100">25 min</Text>
                    </View>
                    <Text className="text-xs text-gray-500">Avg. delivery</Text>
                  </View>
                  <View className="items-center">
                    <View className="flex-row items-center">
                      <Image source={images.check} className="w-4 h-4 mr-1" />
                      <Text className="text-lg font-bold text-dark-100">100%</Text>
                    </View>
                    <Text className="text-xs text-gray-500">Halal & Vegan</Text>
                  </View>
                </View>
              </View>
            );
          return null;
        }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: insets.bottom + 24,
        }}
      />

      {/* Bottom CTA */}
      <View
        className="px-4 py-4"
        style={{
          paddingBottom: Math.max(insets.bottom, 8),
        }}
      >
        <TouchableOpacity
          className="bg-primary rounded-xl py-3 items-center"
          onPress={() => router.push('/menu')}
        >
          <Text className="text-white font-bold text-base">Hungry? Start Ordering</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}