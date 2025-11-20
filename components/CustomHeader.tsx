// 📄 components/CustomHeader.tsx

import { images } from '@/constants';
import { CustomHeaderProps } from '@/type';
import { useRouter } from 'expo-router';
import { Image, Text, TouchableOpacity, View } from 'react-native';

const CustomHeader = ({
  title,
  canGoBack = true, // ✅ now optional & safe
  showSearch = true, // ✅ optional search icon
  onSearchPress, // ✅ optional custom search handler
}: CustomHeaderProps) => {
  const router = useRouter();

  const handleBack = () => {
    if (canGoBack) {
      router.back();
    }
  };

  return (
    <View className="flex-row items-center justify-between px-4 py-5 bg-white border-b border-gray-200">
      {/* Back Button */}
      {canGoBack ? (
        <TouchableOpacity
          onPress={handleBack}
          className="p-2 rounded-full active:bg-gray-100"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityLabel="Go back"
        >
          <Image
            source={images.arrowBack}
            className="size-5"
            resizeMode="contain"
          />
        </TouchableOpacity>
      ) : (
        <View className="size-10" /> // Spacer to keep title centered
      )}

      {/* Title */}
      {title ? (
        <Text className="text-lg font-bold text-gray-900 flex-1 text-center">
          {title}
        </Text>
      ) : (
        <View className="flex-1" />
      )}

      {/* Search Button */}
      {showSearch ? (
        <TouchableOpacity
          onPress={onSearchPress || (() => {})} // noop if no handler
          className="p-2 rounded-full active:bg-gray-100"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityLabel="Search"
        >
          <Image
            source={images.search}
            className="size-5"
            resizeMode="contain"
          />
        </TouchableOpacity>
      ) : (
        <View className="size-10" /> // Spacer to keep title centered
      )}
    </View>
  );
};

export default CustomHeader;