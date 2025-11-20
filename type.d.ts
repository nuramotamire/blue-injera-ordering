import { Models } from "react-native-appwrite";

export interface MenuItem extends Models.Document {
    name: string;
    price: number;
    image_url: string;
    description: string;
    calories: number;
    protein: number;
    rating: number;
    type: string;
    // 🔹 NEW FIELDS
    stock: number;         // e.g., 5
    isAvailable: boolean;  // e.g., true
}

export interface Category extends Models.Document {
    name: string;
    description: string;
}

export interface User extends Models.Document {
    name: string;
    email: string;
    avatar: string;
}

export interface CartCustomization {
    id: string;
    name: string;
    price: number;
    type: string;
}

export interface CartItemType {
    id: string; // menu item id
    name: string;
    price: number;
    image_url: string;
    quantity: number;
    customizations?: CartCustomization[];
}

export interface CartStore {
    items: CartItem[];
    addItem: (item: Omit<CartItem, "quantity">) => void;
    removeItem: (id: string, customizations: CartCustomization[]) => void;
    increaseQty: (id: string, customizations: CartCustomization[]) => void;
    decreaseQty: (id: string, customizations: CartCustomization[]) => void;
    clearCart: () => void;
    getTotalItems: () => number;
    getTotalPrice: () => number;
}

interface TabBarIconProps {
    focused: boolean;
    icon: ImageSourcePropType;
    title: string;
}

interface PaymentInfoStripeProps {
    label: string;
    value: string;
    labelStyle?: string;
    valueStyle?: string;
}

interface CustomButtonProps {
    onPress?: () => void;
    title?: string;
    style?: string;
    leftIcon?: React.ReactNode;
    textStyle?: string;
    isLoading?: boolean;
}

interface CustomHeaderProps {
    title?: string;
}

interface CustomInputProps {
    placeholder?: string;
    value?: string;
    onChangeText?: (text: string) => void;
    label: string;
    secureTextEntry?: boolean;
    keyboardType?: "default" | "email-address" | "numeric" | "phone-pad";
}

interface ProfileFieldProps {
    label: string;
    value: string;
    icon: ImageSourcePropType;
}

interface CreateUserParams {
    email: string;
    password: string;
    name: string;
}

interface CreateOrderParams{
    userId: string;
    items:string;
    total: float;
    deliveryAddress: string;
    paymentMethod:string;
    createdAt:datetime;
    paidAmount?: flot;
}

interface SignInParams {
    email: string;
    password: string;
}

interface GetMenuParams {
    category: string;
    query: string;
}


// 📄 type.d.ts

export interface Loyalty extends Models.Document {
  userId: string;
  points: number;
  tier: 'bronze' | 'silver' | 'gold';
  lastOrderAt?: string;
}

// 🔹 Add to CartStore (optional but helpful)
interface CartStore {
  // ... existing
  loyaltyDiscount: number; // e.g., 5 (for 5%)
  setLoyaltyDiscount: (discount: number) => void;
}

export interface User extends Models.Document {
  name: string;
  email: string;
  avatar: string;
  role: 'user' | 'admin' | 'chef'; // 🔹 new
}

export interface UserDoc extends User {
  isAvailable: boolean;
  phone?: string;
  pushToken?: string;
}


export interface Order extends Models.Document {
  userId: string;
  deliveryAddress: string;
  total: number;
  status: string;
  items: string;
  createdAt: string;
  updatedAt?: string;
  // 🔹 NEW FIELDS
  paymentMethod: 'cash' | 'credit';
  paidAmount: flot;
}


// 📄 type.ts (or wherever CustomHeaderProps is defined)

export interface CustomHeaderProps {
  title?: string;
  canGoBack?: boolean;     // ← add this
  showSearch?: boolean;    // ← add this
  onSearchPress?: () => void; // ← add this
}