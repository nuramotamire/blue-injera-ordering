import { CreateOrderParams, CreateUserParams, GetMenuParams, Loyalty, SignInParams } from "@/type";
import { Account, Avatars, Client, Databases, ID, Query, Storage } from "react-native-appwrite";

export const appwriteConfig = {
  endpoint: process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT!,
  projectId: process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID!,
  platform: "com.blue.injera",
  databaseId: "6915bb6f002f248869f4",
  bucketId:"69172c580003f36a5146",
  userTableId:'user',
  categoriesTableId: 'categories',
  menuTableId: "menu",
  customizationsTableId: "customizations",
  menuCustomizationsTableId : "menu_customizations",
  loyaltyTableId :'loyalty'
};


export const client = new Client();

client  
      .setEndpoint(appwriteConfig.endpoint)
      .setProject(appwriteConfig.projectId)
      .setPlatform(appwriteConfig.platform)

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
const avatars =  new Avatars(client);


export const createUser = async({email, password ,name}:CreateUserParams) =>{
    try{
        const newAccount = await account.create(ID.unique(), email, password, name)

        if(!newAccount) throw Error;

        await sign_In({email,password});

        const avatarUrl = avatars.getInitialsURL(name);

        return await databases.createDocument(
             appwriteConfig.databaseId,
             appwriteConfig.userTableId,
             ID.unique(),
             {email, name,accountId: newAccount.$id,avatar:avatarUrl 
             }
        );
       
    }catch(e){
        throw new Error(e as string)
    }
}


export const sign_In= async ({email, password}: SignInParams)=>{
    try{
          const session = await account.createEmailPasswordSession(email,password)
    }catch (e){
         throw new Error(e as string)
    }
}


export const getCurrentUser = async()=>{
    try{
        const currentAccount = await account.get();
        if(!currentAccount) throw Error;

        const currentUser = await databases.listDocuments(
              appwriteConfig.databaseId,
              appwriteConfig.userTableId,
               [Query.equal('accountId', currentAccount.$id)]
        )
        if(!currentUser) throw Error;

        return currentUser.documents[0];

    }catch (e){
        console.log(e)
        throw new Error( e as string)
    }
}


export const getMenu = async({category, query}: GetMenuParams)=>{
    try{
        const queries: string[]= [];

        if(category) queries.push(Query.equal('categories', category));
        if(query) queries.push(Query.search('name', query));

        const menus = await databases.listDocuments(
              appwriteConfig.databaseId,
              appwriteConfig.menuTableId,
              queries
        )
        return menus.documents;
    }catch (e){
        throw new Error(e as string);
    }
}

 export const getCategories = async()=>{
    try{
        const categories = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.categoriesTableId,
        )
        return categories.documents;
    }catch (e){
        throw new Error(e as string)
    } }

// 📄 lib/appwrite.ts

export const parseOrder = (order: any) => ({
  ...order,
  items: typeof order.items === 'string' ? JSON.parse(order.items) : order.items,
});


// 📄 lib/appwrite.ts — REPLACE createOrder with this:

export const createOrder = async (orderData: CreateOrderParams) => {
  try {
    const { items, ...rest } = orderData;
    const itemsArray = typeof items === 'string' ? JSON.parse(items) : items;

    // 🔹 Validate stock (same as before)
    const menuIds = itemsArray.map((item) => item.id);
    const menuDocs = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.menuTableId,
      [Query.equal('$id', menuIds)]
    );

    for (const item of itemsArray) {
      const menuItem = menuDocs.documents.find((doc) => doc.$id === item.id);
      if (!menuItem || !menuItem.isAvailable || menuItem.stock < item.quantity) {
        throw new Error(
          `"${item.name}" is unavailable or insufficient stock`
        );
      }
    }

    const serializedItems = JSON.stringify(itemsArray);

    // 🔹 CREATE ORDER — with payment fields
    const order = await databases.createDocument(
      appwriteConfig.databaseId,
      'orders',
      ID.unique(),
      {
        ...rest,
        items: serializedItems,
        createdAt: new Date().toISOString(),
        paidAmount: rest.paidAmount ?? 0,           // ✅
        paymentMethod: rest.paymentMethod ?? 'cash', // ✅
      }
    );

    // 🔹 Decrement stock (same)
    await Promise.all(
      itemsArray.map((item) => {
        const menuItem = menuDocs.documents.find((doc) => doc.$id === item.id)!;
        return databases.updateDocument(
          appwriteConfig.databaseId,
          appwriteConfig.menuTableId,
          item.id,
          { stock: menuItem.stock - item.quantity }
        );
      })
    );

    return parseOrder(order);
  } catch (error: any) {
    console.error('❌ createOrder error:', error);
    throw new Error(error.message || 'Failed to place order');
  }
};


// 📄 lib/appwrite.ts

export const getLoyalty = async (userId: string) => {
  try {
    const response = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.loyaltyTableId,
      [Query.equal('userId', userId)]
    );

    // runtime type guard to ensure the document matches Loyalty
    const isLoyalty = (obj: any): obj is Loyalty => {
      return (
        obj != null &&
        typeof obj.userId === 'string' &&
        typeof obj.points === 'number' &&
        (obj.tier === 'bronze' || obj.tier === 'silver' || obj.tier === 'gold')
      );
    };

    const doc = response.documents[0];
    if (!doc) return undefined;

    if (isLoyalty(doc)) {
      return doc;
    } else {
      console.warn('getLoyalty: document does not match Loyalty shape', doc);
      return undefined;
    }
  } catch (e) {
    console.log('getLoyalty error:', e);
    return undefined;
  }
};

export const createOrUpdateLoyalty = async (
  userId: string,
  points: number,
  tier: 'bronze' | 'silver' | 'gold'
) => {
  try {
    const existing = await getLoyalty(userId);
    const data = {
      userId,
      points,
      tier,
      lastOrderAt: new Date().toISOString(),
    };

    if (existing) {
      return await databases.updateDocument(
        appwriteConfig.databaseId,
        appwriteConfig.loyaltyTableId,
        existing.$id,
        data
      );
    } else {
      return await databases.createDocument(
        appwriteConfig.databaseId,
        appwriteConfig.loyaltyTableId,
        ID.unique(),
        data
      );
    }
  } catch (e: any) {
    console.error('❌ createOrUpdateLoyalty failed:', e.message || e);
    // 🔹 More helpful error:
    if (e.message?.includes('Collection with the requested ID could not be found')) {
      throw new Error('Loyalty collection not found. Please create it in Appwrite Console.');
    }
    throw new Error('Failed to update loyalty');
  }
};


// 📄 lib/appwrite.ts

export const createNotification = async (
  userId: string,
  title: string,
  body: string,
  type: 'order' | 'stock' | 'system' = 'system'
) => {
  try {
    return await databases.createDocument(
      appwriteConfig.databaseId,
      'notifications',
      ID.unique(),
      {
        userId,
        title,
        body,
        type,
        isRead: false,
        createdAt: new Date().toISOString(),
      }
    );
  } catch (e) {
    console.warn('Failed to create notification', e);
  }
};

export const markNotificationAsRead = async (id: string) => {
  await databases.updateDocument(
    appwriteConfig.databaseId,
    'notifications',
    id,
    { isRead: true }
  );
};


export const signOut = async (): Promise<void> => {
  try {
    // 🔥 Critical: Delete the current session (client + server)
    await account.deleteSession('current');
    console.log('✅ Session deleted successfully');
  } catch (error: any) {
    // It's OK if no session (e.g., already logged out)
    if (error.code !== 401 && error.code !== 404) {
      console.warn('⚠️ Unexpected error during signOut:', error.message);
    } else {
      console.log('ℹ️ No active session — already signed out');
    }
  }
};