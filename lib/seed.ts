// import { ID } from "react-native-appwrite";
// import { appwriteConfig, databases, storage } from "./appwrite";
// import dummyData from "./data";

// interface Category {
//     name: string;
//     description: string;
// }

// interface Customization {
//     name: string;
//     price: number;
//     type: "topping" | "side" | "size" | "crust" | string; // extend as needed
// }

// interface MenuItem {
//     name: string;
//     description: string;
//     image_url: string;
//     price: number;
//     rating: number;
//     calories: number;
//     protein: number;
//     category_name: string;
//     customizations: string[]; // list of customization names
// }

// interface DummyData {
//     categories: Category[];
//     customizations: Customization[];
//     menu: MenuItem[];
// }

// // ensure dummyData has correct shape
// const data = dummyData as DummyData;

// async function clearAll(collectionId: string): Promise<void> {
//     const list = await databases.listDocuments(
//         appwriteConfig.databaseId,
//         collectionId
//     );

//     await Promise.all(
//         list.documents.map((doc) =>
//             databases.deleteDocument(appwriteConfig.databaseId, collectionId, doc.$id)
//         )
//     );
// }

// async function clearStorage(): Promise<void> {
//     const list = await storage.listFiles(appwriteConfig.bucketId);

//     await Promise.all(
//         list.files.map((file) =>
//             storage.deleteFile(appwriteConfig.bucketId, file.$id)
//         )
//     );
// }
// // async function uploadImageToStorage(imageUrl: string) {
// //   // Skip upload; return original (or Appwrite placeholder)
// //   return imageUrl; // or: "https://via.placeholder.com/300.png?text=Food"
// // }

// // async function uploadImageToStorage(imageUrl: string) {
// //     const response = await fetch(imageUrl);
// //     const blob = await response.blob();

// //     const fileObj = {
// //         name: imageUrl.split("/").pop() || `file-${Date.now()}.jpg`,
// //         type: blob.type,
// //         size: blob.size,
// //         uri: imageUrl,
// //     };

// //     const file = await storage.createFile(
// //         appwriteConfig.bucketId,
// //         ID.unique(),
// //         fileObj
// //     );

// //     return storage.getFileViewURL(appwriteConfig.bucketId, file.$id);
// // }

// import { Directory, File, Paths } from 'expo-file-system';

// async function uploadImageToStorage(imageUrl: string): Promise<string> {
//   try {
//     const filename = imageUrl.split('/').pop() || 'image.jpg';
//     const destinationDir = new Directory(Paths.cache, 'seeding');

//     // ✅ Create dir only if missing
//     if (!destinationDir.exists) {
//       await destinationDir.create({ intermediates: true });
//     }

//     // ✅ Use overwrite: true to avoid "Destination already exists"
//     const targetFile = new File(destinationDir, filename);
//     // remove existing file to emulate overwrite behavior
//     if (targetFile.exists) {
//       await targetFile.delete();
//     }
//     const downloadedFile = await File.downloadFileAsync(
//       imageUrl,
//       targetFile
//     );

//     if (!downloadedFile.exists) {
//       throw new Error('Downloaded file does not exist after download');
//     }

//     const fileInfo = await downloadedFile.info();
//     const mimeType = filename.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';

//     const uploadedFile = await storage.createFile(
//       appwriteConfig.bucketId,
//       ID.unique(),
//       {
//         uri: downloadedFile.uri,
//         name: filename,
//         type: mimeType,
//         size: fileInfo.size ?? 0,
//       }
//     );

//     // ✅ Manual URL construction (avoids SDK `getFileView` return-type ambiguity)
//     const { endpoint, projectId, bucketId } = appwriteConfig;
//     return `${endpoint}/storage/buckets/${bucketId}/files/${uploadedFile.$id}/view?project=${projectId}`;

//   } catch (error) {
//     console.error('❌ Failed to upload image:', error);
//     return `https://via.placeholder.com/300x200.png?text=${encodeURIComponent(
//       imageUrl.split('/').pop() || 'Missing'
//     )}`;
//   }
// }

// async function seed(): Promise<void> {
//     // 1. Clear all
//     await clearAll(appwriteConfig.categoriesTableId);
//     await clearAll(appwriteConfig.customizationsTableId);
//     await clearAll(appwriteConfig.menuTableId);
//     await clearAll(appwriteConfig.menuCustomizationsTableId);
//     await clearStorage();

//     // 2. Create Categories
//     const categoryMap: Record<string, string> = {};
//     for (const cat of data.categories) {
//         const doc = await databases.createDocument(
//             appwriteConfig.databaseId,
//             appwriteConfig.categoriesTableId,
//             ID.unique(),
//             cat
//         );
//         categoryMap[cat.name] = doc.$id;
//     }

//     // 3. Create Customizations
//     const customizationMap: Record<string, string> = {};
//     for (const cus of data.customizations) {
//         const doc = await databases.createDocument(
//             appwriteConfig.databaseId,
//             appwriteConfig.customizationsTableId,
//             ID.unique(),
//             {
//                 name: cus.name,
//                 price: cus.price,
//                 type: cus.type,
//             }
//         );
//         customizationMap[cus.name] = doc.$id;
//     }

//     // 4. Create Menu Items
//     const menuMap: Record<string, string> = {};
//     for (const item of data.menu) {
//         const uploadedImage = await uploadImageToStorage(item.image_url);

//         const doc = await databases.createDocument(
//             appwriteConfig.databaseId,
//             appwriteConfig.menuTableId,
//             ID.unique(),
//             {
//                 name: item.name,
//                 description: item.description,
//                 image_url: uploadedImage,
//                 price: item.price,
//                 rating: item.rating,
//                 calories: item.calories,
//                 protein: item.protein,
//                 categories: categoryMap[item.category_name],
//             }
//         );

//         menuMap[item.name] = doc.$id;

//         // 5. Create menu_customizations
//         for (const cusName of item.customizations) {
//             await databases.createDocument(
//                 appwriteConfig.databaseId,
//                 appwriteConfig.menuCustomizationsTableId,
//                 ID.unique(),
//                 {
//                     menu: doc.$id,
//                     customizations: customizationMap[cusName],
//                 }
//             );
//         }
//     }

//     console.log("✅ Seeding complete.");
// }

// export default seed;

// src/lib/seed.ts
import { Asset } from 'expo-asset';
import { File } from 'expo-file-system';
import { ID } from "react-native-appwrite";
import { appwriteConfig, databases, storage } from "./appwrite";
import dummyData from "./data";

// Types
interface Category {
  name: string;
  description: string;
}

interface Customization {
  name: string;
  price: number;
  type: string;
}

interface MenuItem {
  name: string;
  description: string;
  image_asset: number;
  price: number;
  rating: number;
  calories: number;
  protein: number;
  category_name: string;
  customizations: string[];
  stock: number;
  isAvailable: boolean;
}

interface DummyData {
  categories: Category[];
  customizations: Customization[];
  menu: MenuItem[];
}

const data = dummyData as DummyData;

// --- Helpers ---
const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
};

// --- Clear utils (safe) ---
async function clearAll(collectionId: string): Promise<void> {
  try {
    const list = await databases.listDocuments(
      appwriteConfig.databaseId,
      collectionId
    );
    await Promise.all(
      list.documents.map((doc) =>
        databases.deleteDocument(appwriteConfig.databaseId, collectionId, doc.$id)
      )
    );
  } catch (error) {
    console.warn(`Clear skip (${collectionId}):`, (error as any).message);
  }
}

async function clearStorage(): Promise<void> {
  try {
    const list = await storage.listFiles(appwriteConfig.bucketId);
    if (list.files.length > 0) {
      await Promise.all(
        list.files.map((file) =>
          storage.deleteFile(appwriteConfig.bucketId, file.$id)
        )
      );
    }
  } catch (error) {
    console.warn("Storage clear skip:", (error as any).message);
  }
}
async function uploadImageToStorage(
  assetModule: number,
  fallbackName = 'image.png'
): Promise<string> {
  try {
    // 1. Resolve and download asset
    const asset = Asset.fromModule(assetModule);
    if (!asset.uri) {
      throw new Error('Asset has no source URI');
    }

    if (!asset.localUri) {
      await asset.downloadAsync();
    }
    if (!asset.localUri) {
      throw new Error('Failed to download asset');
    }

    // 2. ✅ Use `File` class to inspect file (replaces getInfoAsync)
    const file = new File(asset.localUri);
    if (!file.exists) {
      throw new Error(`File does not exist after download: ${asset.localUri}`);
    }

    // 3. Get size via `.size` (synchronous, safe)
    const size = file.size ?? 0;

    // 4. Determine MIME type
    const mimeType = asset.type?.startsWith('image/') ? asset.type : 'image/png';

    // 5. Upload to Appwrite
    const uploadedFile = await storage.createFile(
      appwriteConfig.bucketId,
      ID.unique(),
      {
        name: fallbackName,
        type: mimeType,
        size,
        uri: asset.localUri, // Expo handles file:// upload
      }
    );

    // 6. Construct view URL
    const { endpoint, projectId, bucketId } = appwriteConfig;
    return `${endpoint}/storage/buckets/${bucketId}/files/${uploadedFile.$id}/view?project=${projectId}`;

  } catch (error) {
    console.error(`❌ Upload failed for ${fallbackName}:`, (error as any).message || error);
    const text = encodeURIComponent(fallbackName.replace('.png', ''));
    return `https://via.placeholder.com/300x300/60a5fa/ffffff?text=${text}`;
  }
}

// --- Main seeding ---
async function seed(): Promise<void> {
  console.log("🌱 Starting grocery data seeding...");

  await clearAll(appwriteConfig.categoriesTableId);
  await clearAll(appwriteConfig.customizationsTableId);
  await clearAll(appwriteConfig.menuTableId);
  await clearAll(appwriteConfig.menuCustomizationsTableId);
  await clearStorage();

  // 1. Categories
  const categoryMap: Record<string, string> = {};
  for (const cat of data.categories) {
    const doc = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.categoriesTableId,
      ID.unique(),
      cat
    );
    categoryMap[cat.name] = doc.$id;
    console.log(`✅ Category: ${cat.name}`);
  }

  // 2. Customizations — ✅ price: 1, type: "size"
  const customizationMap: Record<string, string> = {};
  for (const cus of data.customizations) {
    // Ensure valid values for Appwrite constraints
    const safePrice = Math.max(1, cus.price); // min 1
    const allowedTypes = ["topping", "side", "size", "crust", "bread", "spice", "base", "sauce"];
    const safeType = allowedTypes.includes(cus.type) ? cus.type : "size";

    const doc = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.customizationsTableId,
      ID.unique(),
      {
        name: cus.name,
        price: safePrice,
        type: safeType,
      }
    );
    customizationMap[cus.name] = doc.$id;
    console.log(`✅ Customization: ${cus.name} (type: ${safeType}, price: ${safePrice})`);
  }

  // 3. Menu items — ✅ with slug
  const menuMap: Record<string, string> = {};
  for (const item of data.menu) {
    const uploadedImage = await uploadImageToStorage(
      item.image_asset,
      `${generateSlug(item.name)}.png`
    );

    const doc = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.menuTableId,
      ID.unique(),
      {
        name: item.name,
        slug: generateSlug(item.name), // ✅ REQUIRED
        description: item.description,
        image_url: uploadedImage,
        price: item.price,
        rating: item.rating,
        calories: item.calories,
        protein: item.protein,
        categories: categoryMap[item.category_name],
        stock: item.stock,
        isAvailable: item.isAvailable,
      }
    );

    menuMap[item.name] = doc.$id;
    console.log(`✅ Menu: ${item.name} (slug: ${generateSlug(item.name)})`);

    // Link customizations
    for (const cusName of item.customizations) {
      if (!customizationMap[cusName]) {
        console.warn(`⚠️ Skipped missing customization: ${cusName}`);
        continue;
      }
      await databases.createDocument(
        appwriteConfig.databaseId,
        appwriteConfig.menuCustomizationsTableId,
        ID.unique(),
        {
          menu: doc.$id,
          customizations: customizationMap[cusName],
        }
      );
    }
  }

  console.log("✅✅✅ Grocery seeding SUCCESSFUL! ✅✅✅");
}

export default seed;