// 📄 app/item/[slug].tsx
import { getMenuBySlug } from '@/lib/appwrite'; // ✅ by slug, not id
import { useCartStore } from '@/store/Cart.store';
import { MenuItem } from '@/type';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const ItemDetail = () => {
  const { slug } = useLocalSearchParams<{ slug?: string }>(); // ✅ slug, optional
  const { addItem } = useCartStore();
  const [item, setItem] = useState<MenuItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  // 🔁 Fetch by slug — no id needed in params
  useEffect(() => {
    if (!slug) {
      setLoading(false);
      return;
    }

    setLoading(true);
    getMenuBySlug(slug)
      .then((doc) => {
        setItem(doc);
        setQuantity(Math.min(1, doc.stock)); // clamp to stock
      })
      .catch((err) => {
        console.error('❌ Item not found:hhhhh', err);
        setItem(null);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  const handleAddToCart = () => {
    if (!item || quantity <= 0) return;

    // ✅ Use item.$id (immutable) for cart — not slug!
    addItem({
      id: item.$id,     // ← safe for relations
      name: item.name,
      price: item.price,
      image_url: item.image_url,
      quantity,
      customizations: [],
    });

    router.back();
  };

  // ... rest of UI (same as before — renders item, quantity, etc.)
  if (loading) return <SafeAreaView className="flex-1 items-center justify-center"><Text>Loading…</Text></SafeAreaView>;
  if (!item) return <SafeAreaView className="flex-1 items-center justify-center"><Text>Item not foundbbbb.</Text></SafeAreaView>;

  const isOutOfStock = !item.isAvailable || item.stock <= 0;

  return (
    <SafeAreaView className="bg-white flex-1">
      {/* ... your existing UI */}
    </SafeAreaView>
  );
};

export default ItemDetail;