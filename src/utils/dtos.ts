// ===========================
// User
// ===========================

export interface User {
  id: number;
  name: string;
  email: string | null;
  phone: string;
  email_verified_at: string | null;
  phone_verified_at: string | null;
  created_at: string | null;
}

// ===========================
// Auth Response
// ===========================

export interface RegisterResponse {
  code: number;
  message: string;
  errors: string[];
  data: {
    user: User;
  };
}

export interface LoginResponse {
  code: number;
  message: string;
  errors: string[];
  data: {
    user: User;
    token: string;
  };
}

// ===========================
// Profile Response
// ===========================

export interface ProfileResponse {
  code: number;
  message: string;
  errors: unknown[];
  data: {
    user: User;
  };
}

export interface CategoriesResponse {
  code: number;
  message: string;
  errors: unknown[];
  data: {
    categories: Category[];
  };
}

export interface Category {
  id: number;
  name: string;
  level: number;
  first_color: string | null;
  second_color: string | null;
  image: string;
  parent?: {
    id: number;
    name: string;
  };
}

export interface Banner {
  id: number;
  image: string;
  platform: string,
  position: string,
  display_location: string,
  display_location_id: null,
  target_type: string,
  target_id: number,
  target_url: string,
  sort_order: number,
  link: string | null;
};

export interface Address {
  id: number;
  label: string;
  full_address: string;
  phone: string;
  delivery_note: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface Brand {
  id: number;
  name: string;
  image: string;
  number_of_products: number | null;
}

export interface Product {
  id: number;
  name: string;
  price: string;
  discount_type: string | null;
  discount_amount: string | null;
  has_variants: boolean;
  in_stock: boolean;
  final_price: number;
  discount_info: string | null;
  avg_rating: number;
  reviews_count: number;
  sold_quantity?: number;
  brand: Brand | null;
  category: Category;
  primary_image: string;
  images: string[];
  description: string;
  hover_text: string;
  specifications: unknown[];
  in_wishlist: boolean;
}

export interface City {
  key: string;
  value: string;
}

export interface HeroProduct {
  id: number;
  name: string;
  slug: string;
  in_stock: boolean;
}

export interface HeroHighlightCard {
  icon: string;
  label: string;
}

export interface HeroSection {
  id: number;
  reference: string;
  theme: string;
  sort_order: number;
  image: string;

  badge_text: string;
  title: string;
  tagline: string;
  description: string;

  highlight_text: string;

  price: number;
  original_price: number | null;
  price_label: string;
  shipping_label: string;

  product: HeroProduct | null;

  primary_button_text: string;
  secondary_button_text: string;
  secondary_button_url: string | null;

  feature_tags: string[];

  highlight_cards: HeroHighlightCard[];
}

// ===========================
// Flash Deal Types
// ===========================

export interface FlashDeal {
  id: number;
  name: string;
  discount_percentage: number;
  status: string;
  starts_at: string;
  ends_at: string;
  remaining_seconds: number;
  is_running: boolean;
  products_count: number;
}

export interface FlashDealProduct extends Product {
  price: string;
  discount_type: string;
  discount_amount: string;
  has_variants: boolean;
  in_stock: boolean;
  final_price: number;
  discount_info: string;
  original_price: number;
  discount_percentage: number;
  total_discount_amount: number;

  flash_deal: {
    id: number;
    name: string;
    discount_percentage: number;
    ends_at: string;
    remaining_seconds: number;
  };

  theme: string;
  avg_rating: number;
  reviews_count: number;

  brand: {
    id: number;
    name: string;
    image: string;
    number_of_products: number | null;
  };

  category: {
    id: number;
    name: string;
    level: number;
    first_color: string;
    second_color: string;
    image: string;
    parent: {
      id: number;
      name: string;
    };
  };

  primary_image: string;
  images: string[];

  description: string;
  hover_text: string;

  specifications: {
    title: string;
    items: {
      key: string;
      value: string;
    }[];
  }[];

  in_wishlist: boolean;
}

export interface CartVariantValue {
  id: number;
  option_id: number;
  option: string;
  type: string;
  value: string;
  color_code: string | null;
}

export interface CartVariant {
  id: number;
  sku: string;
  name: string;
  price: number;
  tax: number;
  price_without_tax: number;
  final_price: number;
  stock: number;
  image: string;
  values: CartVariantValue[];
}

export interface CartItem {
  id: number;
  user_id: number;
  product_id: number;
  product_variant_id: number | null;
  quantity: number;
  unit_price: number;
  unit_final_price: number;
  total_price: number;
  variant: CartVariant | null;
  product: CartProduct;
}

export interface CartProduct {
  id: number;
  name: string;
  price: string;
  tax: number;
  stock: number;
  has_variants: boolean;
  price_without_tax: number;
  final_price: number;
  primary_image: string;
  brand: {
    id: number;
    name: string;
  };

  category: {
    id: number;
    name: string;
  };
}

export interface OrderAddress {
  first_name: string;
  last_name: string;
  phone: string;
  address: string;
  apartment: string | null;
  city: string;
  state: string | null;
  country: string | null;
  zip_code: string;
}

export interface OrderPricing {
  subtotal: number;
  shipping_cost: number;
  discount_amount: number;
  total: number;
  currency: string;
}

export interface OrderCoupon {
  code: string | null;
  discount: number;
  details: unknown | null;
}

export interface OrderProductOption {
  option: string;
  type: string;
  value: string;
  color_code: string | null;
}

export interface OrderProductItem {
  id: number;
  product_id: number;
  product_name: string;
  product_sku: string;
  product_image: string;
  product_variant_id: number | null;
  variant_name: string | null;
  variant: unknown | null;
  size?: string | null;
  price: number;
  discount_percentage: number;
  discount_amount: number;
  final_unit_price: number;
  quantity: number;
  total: number;
  line_total: number;
  options: OrderProductOption[];
  product: Product;
  is_reviewed: boolean;
  can_review: boolean;
  review: unknown | null;
  created_at: string;
  updated_at: string;
}

export interface PaymentAttempt {
  reference: string;
  status: string;
  flow: string;
  failure_reason: string | null;
  checkout_url: string | null;
  expires_at: string | null;
  created_at: string;
}

export interface OrderPayment {
  status: string;
  status_label: string;
  is_paid: boolean;
  has_failed: boolean;
  can_retry: boolean;
  retry_endpoint: string | null;
  last_attempt: PaymentAttempt | null;
}

export interface EstimatedDelivery {
  value: string | number | null;
  unit: string | null;
  label: string | null;
  expected_at: string | null;
}

export interface OrderShipping {
  method: string | null;
  tracking_number: string | null;
  document_url: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
}

export interface OrderTimelineItem {
  id: number;
  from_status: string | null;
  from_status_label: string | null;
  status: string;
  status_label: string;
  color: string;
  changed_by: string;
  changed_by_label: string;
  note: string | null;
  created_at: string;
}

export interface Order {
  id: number;
  order_number: string;
  status: string;
  status_label: string;

  payment_method: string;
  payment_method_label: string;

  payment_status: string;
  payment_status_label: string;

  address: OrderAddress;
  pricing: OrderPricing;
  coupon: OrderCoupon;

  products: OrderProductItem[];

  payment: OrderPayment;

  notes: string | null;

  estimated_delivery: EstimatedDelivery;

  shipping: OrderShipping;

  tracking_number: string | null;
  pdf_label: string | null;

  total_items: number;

  paid_at: string | null;
  shipped_at: string | null;
  delivered_at: string | null;

  created_at: string;
  updated_at: string;

  can_be_cancelled: boolean;
  can_be_refunded: boolean;

  timeline?: OrderTimelineItem[];
}

export interface OrderStatistics {
  total_orders: number;
  pending_orders: number;
  completed_orders: number;
  cancelled_orders: number;
}

export interface ReviewUser {
  id: number;
  name: string;
  avatar: string | null;
}

export interface ProductReview {
  id: number;
  product_id: number;
  rating: number;
  comment: string;
  is_verified_purchase: boolean;
  user: ReviewUser;
  created_at: string;
}

export interface ReviewBreakdown {
  "5": number;
  "4": number;
  "3": number;
  "2": number;
  "1": number;
}

export interface ReviewSummary {
  avg_rating: number;
  reviews_count: number;
  breakdown: ReviewBreakdown;
}

export interface PendingReviewItem {
  id: number;
  product_id: number;
  product_name: string;
  product_sku: string;
  product_image: string | null;

  product_variant_id: number | null;
  variant_name: string | null;
  variant: unknown;

  price: number;
  discount_percentage: number;
  discount_amount: number;
  final_unit_price: number;
  quantity: number;
  total: number;
  line_total: number;

  options: unknown[];

  product: Product;

  is_reviewed: boolean;
  can_review: boolean;
  review: ProductReview | null;

  created_at: string;
  updated_at: string;
}

export interface MyReviewProduct {
  id: number;
  name: string;
  primary_image: string | null;
}

export interface MyReview extends ProductReview {
  product: MyReviewProduct;
}

// ===========================
// Notification Types
// ===========================

export interface NotificationData {
  target_screen?: string;
  target_id?: string;
  order_id?: number;
  order_number?: string;
  status?: string;
  [key: string]: any;
}

export interface Notification {
  id: string;
  title: string;
  body: string;
  type: string;
  image: string | null;
  data: NotificationData;
  created_at?: string;
  read_at?: string | null;
  is_read?: boolean;
}
