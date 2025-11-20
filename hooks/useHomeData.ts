// 📄 hooks/useHomeData.ts
import { getCategories, getMenu } from '@/lib/appwrite';
import useAppwrite from '@/lib/useAppwrite';

export const useHomeData = () => {
  const { data: categories } = useAppwrite({ fn: getCategories });
  const { data: featuredItems } = useAppwrite({
    fn: getMenu,
    params: { limit: 4 }, // top 4 items
  });

  return { categories, featuredItems };
};