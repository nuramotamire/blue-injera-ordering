import { CreateUserParams, GetMenuParams, SignInParams } from "@/type";
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