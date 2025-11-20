// 📄 app/profile/loyalty.tsx

import CustomHeader from '@/components/CustomHeader';
import { images } from '@/constants';
import { getLoyalty } from '@/lib/appwrite';
import useAuthStore from '@/store/auth.store';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface LoyaltyData {
  points: number;
  tier: 'bronze' | 'silver' | 'gold';
}

// Tier config (single source of truth)
const TIERS = {
  bronze: { name: 'Bronze', points: 0, color: '#64748B', next: 50 },
  silver: { name: 'Silver', points: 50, color: '#A8A29E', next: 100 },
  gold:   { name: 'Gold',   points: 100, color: '#F59E0B', next: Infinity },
} as const;

const getTierByPoints = (points: number): keyof typeof TIERS => {
  if (points >= TIERS.gold.points) return 'gold';
  if (points >= TIERS.silver.points) return 'silver';
  return 'bronze';
};

const getBenefits = (tier: keyof typeof TIERS) => {
  switch (tier) {
    case 'bronze': return 'Welcome offer on first order';
    case 'silver': return '5% off all orders + free side';
    case 'gold': return '10% off + priority delivery + birthday gift';
  }
};

export default function Loyalty() {
  const { user } = useAuthStore();
  const [loyalty, setLoyalty] = useState<LoyaltyData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLoyalty = async () => {
      if (!user?.$id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const data = await getLoyalty(user.$id);
        const points = data?.points ?? 0;
        const tier = data?.tier && ['bronze', 'silver', 'gold'].includes(data.tier)
          ? (data.tier as keyof typeof TIERS)
          : getTierByPoints(points);

        setLoyalty({ points, tier });
      } catch (e) {
        console.warn('Failed to load loyalty', e);
        setLoyalty({ points: 0, tier: 'bronze' });
      } finally {
        setLoading(false);
      }
    };

    fetchLoyalty();
  }, [user?.$id]);

  const currentTier = loyalty?.tier || 'bronze';
  const currentPoints = loyalty?.points || 0;
  const tierData = TIERS[currentTier];
  const nextTierKey = currentTier === 'gold' ? null : 
                     currentTier === 'silver' ? 'gold' : 'silver';
  const nextTier = nextTierKey ? TIERS[nextTierKey] : null;
  const pointsToNext = nextTier ? Math.max(0, nextTier.points - currentPoints) : 0;
  const progress = nextTier 
    ? Math.min(100, (currentPoints - tierData.points) / (nextTier.points - tierData.points) * 100)
    : 100;

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <CustomHeader title="Loyalty Program" canGoBack />

      <View className="flex-1">
        {loading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#F59E0B" />
            <Text className="mt-4 text-gray-500">Loading your rewards...</Text>
          </View>
        ) : (
          <ScrollView contentContainerClassName="p-4 pb-8">
            {/* Hero */}
            <View className="items-center mb-8">
              <View className="w-28 h-28 rounded-full bg-amber-50 items-center justify-center mb-4 border-4 border-amber-100">
                <Image
                  source={images.star}
                  className="size-14"
                  resizeMode="contain"
                  tintColor={tierData.color}
                />
              </View>
              <Text className="text-4xl font-bold text-gray-900">{currentPoints}</Text>
              <Text className="text-lg text-gray-600 mt-1">Reward Points</Text>
              <View className="flex-row items-center mt-2 bg-white px-4 py-1.5 rounded-full border border-gray-200">
                <View
                  className="w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: tierData.color }}
                />
                <Text className="font-semibold" style={{ color: tierData.color }}>
                  {tierData.name} Tier
                </Text>
              </View>
            </View>

            {/* Progress Section */}
            {nextTier && (
              <View className="mb-8 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <Text className="font-bold text-gray-900 mb-1">
                  {pointsToNext} pts to {nextTier.name}
                </Text>
                <Text className="text-sm text-gray-500 mb-3">
                  Unlock exclusive {nextTier.name.toLowerCase()} benefits!
                </Text>

                {/* Progress bar with milestone labels */}
                <View className="mb-3">
                  <View className="flex-row justify-between mb-1">
                    <Text className="text-xs text-gray-500">{tierData.name}</Text>
                    <Text className="text-xs text-gray-500">{nextTier.name}</Text>
                  </View>
                  <View style={styles.progressBarContainer}>
                    <View style={styles.progressBarBackground} />
                    <View
                      style={[
                        styles.progressBarFill,
                        { width: `${progress}%`, backgroundColor: tierData.color },
                      ]}
                    />
                    {/* Milestone markers */}
                    <View style={[styles.milestone, { left: '0%' }]} />
                    <View style={[styles.milestone, { left: '50%' }]} />
                    <View style={[styles.milestone, { left: '100%' }]} />
                  </View>
                </View>

                <Text className="text-xs text-gray-400 text-center">
                  {currentPoints} / {nextTier.points} pts
                </Text>
              </View>
            )}

            {/* Benefits */}
            <View className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <Text className="font-bold text-lg text-gray-900 mb-4">Your Benefits</Text>
              <View className="gap-4">
                {(['bronze', 'silver', 'gold'] as const).map((key) => {
                  const data = TIERS[key];
                  const isCurrent = key === currentTier;
                  const isUnlocked = currentPoints >= data.points;

                  let statusIcon = '✓';
                  let statusColor = '#10B981'; // green
                  if (!isUnlocked) {
                    statusIcon = '•';
                    statusColor = '#94A3B8'; // slate
                  } else if (isCurrent) {
                    statusIcon = '★';
                    statusColor = data.color;
                  }

                  return (
                    <View key={key} className="flex-row items-start">
                      <View
                        className="w-6 h-6 rounded-full flex items-center justify-center mr-3 mt-0.5"
                        style={{ backgroundColor: isUnlocked ? `${statusColor}20` : '#F1F5F9' }}
                      >
                        <Text style={{ color: statusColor, fontSize: 12 }}>{statusIcon}</Text>
                      </View>
                      <View className="flex-1">
                        <View className="flex-row items-center">
                          <Text
                            className={`font-medium ${isCurrent ? 'text-gray-900' : 'text-gray-600'}`}
                            style={isCurrent ? { color: data.color } : {}}
                          >
                            {data.name} Tier
                          </Text>
                          {isCurrent && (
                            <View className="ml-2 px-2 py-0.5 bg-amber-100 rounded-full">
                              <Text className="text-xs font-medium text-amber-800">Current</Text>
                            </View>
                          )}
                        </View>
                        <Text className={`text-sm mt-1 ${isUnlocked ? 'text-gray-700' : 'text-gray-400'}`}>
                          {getBenefits(key)}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Tips */}
            <View className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
              <Text className="font-semibold text-blue-800">💡 Tip</Text>
              <Text className="text-sm text-blue-700 mt-1">
                Earn 10 pts per $1 spent. Refer a friend for +50 pts!
              </Text>
            </View>
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}

// ✅ Extract styles for better performance (avoids inline style recomputation)
const styles = StyleSheet.create({
  progressBarContainer: {
    height: 12,
    backgroundColor: '#F1F5F9',
    borderRadius: 999,
    position: 'relative',
    overflow: 'hidden',
  },
  progressBarBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#E2E8F0',
    borderRadius: 999,
  },
  progressBarFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    backgroundColor: '#F59E0B',
    borderRadius: 999,
    height: '100%',
  },
  milestone: {
    position: 'absolute',
    top: '50%',
    width: 6,
    height: 6,
    backgroundColor: '#94A3B8',
    borderRadius: 3,
    transform: [{ translateX: -3 }, { translateY: -3 }],
  },
});