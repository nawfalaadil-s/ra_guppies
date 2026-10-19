import { 
  Product, Category, Order, StoreSettings, HomepageSection, 
  CMSPage, ProductReview, Coupon, AdminAuditLog, PaymentStatus, FulfillmentStatus, BlogPost, MediaAsset, UserProfile, UserRole,
  ImportHistoryItem, BrandingSettings
} from './types';
import { 
  INITIAL_PRODUCTS, INITIAL_CATEGORIES, INITIAL_STORE_SETTINGS, 
  INITIAL_HOMEPAGE_SECTIONS, INITIAL_CMS_PAGES, INITIAL_COUPONS, INITIAL_BLOG_POSTS, INITIAL_MEDIA_ASSETS,
  DEFAULT_BRANDING_SETTINGS
} from './constants';
import { calculateShipping } from './shipping';

const STORAGE_KEYS = {
  PRODUCTS: 'ba_products',
  CATEGORIES: 'ba_categories',
  DELETED_PRODUCT_IDS: 'ba_deleted_product_ids',
  DELETED_CATEGORY_IDS: 'ba_deleted_category_ids',
  ORDERS: 'ba_orders',
  STORE_SETTINGS: 'ba_store_settings',
  HOMEPAGE_SECTIONS: 'ba_homepage_sections',
  CMS_PAGES: 'ba_cms_pages',
  REVIEWS: 'ba_reviews',
  COUPONS: 'ba_coupons',
  AUDIT_LOGS: 'ba_audit_logs',
  BLOG_POSTS: 'ba_blog_posts',
  MEDIA_ASSETS: 'ba_media_assets',
  USERS: 'ba_users',
  IMPORT_HISTORY: 'ba_import_history',
  BRANDING_SETTINGS: 'ba_branding_settings',
};

// Helper to safely read from localStorage
function getStoredItem<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (e) {
    console.error(`Error reading ${key} from storage:`, e);
    return fallback;
  }
}

// Helper to safely write to localStorage
function setStoredItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error writing ${key} to storage:`, e);
  }
}

export interface StoredUser {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  role: UserRole;
  password_hash?: string;
  created_at: string;
}

const INITIAL_USERS: StoredUser[] = [
  {
    id: 'usr-admin-primary',
    email: 'admin@bettaaquatics.in',
    full_name: 'Aathil (Store Admin)',
    phone: '+91 98765 43210',
    role: 'admin',
    password_hash: 'Admin@123',
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'usr-admin-raguppies00',
    email: 'raguppies00@gmail.com',
    full_name: 'Ra Guppy Primary Admin',
    phone: '+91 98765 43210',
    role: 'admin',
    password_hash: 'Rishan@123',
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'usr-admin-raguppies',
    email: 'raguppies@gmail.com',
    full_name: 'Ra Guppy Admin',
    phone: '+91 98765 43210',
    role: 'admin',
    password_hash: 'Admin@123',
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'usr-admin-nawfal',
    email: 'nawfalaadil@gmail.com',
    full_name: 'Nawfal Aadil (Owner & Admin)',
    phone: '+91 98765 43210',
    role: 'admin',
    password_hash: 'Admin@123',
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'usr-staff-products',
    email: 'products@bettaaquatics.in',
    full_name: 'Priya Sharma (Product Manager)',
    phone: '+91 98765 11111',
    role: 'product_manager',
    password_hash: 'Staff@123',
    created_at: '2026-01-05T00:00:00Z',
  },
  {
    id: 'usr-staff-orders',
    email: 'orders@bettaaquatics.in',
    full_name: 'Vikram Rao (Order & Logistics Manager)',
    phone: '+91 98765 22222',
    role: 'order_manager',
    password_hash: 'Staff@123',
    created_at: '2026-01-08T00:00:00Z',
  },
  {
    id: 'usr-staff-reviewer',
    email: 'reviewer@bettaaquatics.in',
    full_name: 'Suresh Nair (Payment Reviewer)',
    phone: '+91 98765 33333',
    role: 'payment_reviewer',
    password_hash: 'Staff@123',
    created_at: '2026-01-10T00:00:00Z',
  },
  {
    id: 'usr-staff-content',
    email: 'content@bettaaquatics.in',
    full_name: 'Ananya Das (CMS & Content Specialist)',
    phone: '+91 98765 44444',
    role: 'content_manager',
    password_hash: 'Staff@123',
    created_at: '2026-01-12T00:00:00Z',
  },
  {
    id: 'usr-customer-gmail',
    email: 'customer@gmail.com',
    full_name: 'Customer Demo User',
    phone: '+91 98450 12345',
    role: 'customer',
    password_hash: 'Customer@123',
    created_at: '2026-01-15T00:00:00Z',
  },
  {
    id: 'usr-customer-demo',
    email: 'customer@bettaaquatics.in',
    full_name: 'Rahul Sharma',
    phone: '+91 98450 12345',
    role: 'customer',
    password_hash: 'Customer@123',
    created_at: '2026-01-15T00:00:00Z',
  }
];

// Initial sample orders for demonstration
const INITIAL_ORDERS: Order[] = [
  {
    id: 'ord-1001',
    order_number: 'BA-2026-8812',
    user_id: 'usr-customer-demo',
    customer_name: 'Rahul Sharma',
    customer_email: 'customer@bettaaquatics.in',
    customer_phone: '+91 98450 12345',
    shipping_address: {
      id: 'addr-01',
      user_id: 'usr-customer-demo',
      full_name: 'Rahul Sharma',
      phone: '+91 98450 12345',
      street_address: '402, Aqua Green Apartments, 12th Main Road, Indiranagar',
      city: 'Bengaluru',
      state: 'Karnataka',
      postal_code: '560038',
      is_default: true,
    },
    items: [
      {
        id: 'item-01',
        product_id: 'prod-001',
        product_name: 'Royal Blue Halfmoon Betta (Show Class Male)',
        product_sku: 'BA-HM-001',
        product_image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80',
        unit_price: 1499,
        quantity: 1,
        total_price: 1499,
      }
    ],
    subtotal: 1499,
    delivery_fee: 199,
    packing_charge: 149,
    discount_amount: 150,
    coupon_code: 'AQUA10',
    total_amount: 1697,
    payment_status: 'verified',
    fulfillment_status: 'shipped',
    payment_details: {
      method: 'upi',
      upi_reference: '407519823412',
      proof_image_url: 'https://images.unsplash.com/photo-1556742049-0a67e5572293?auto=format&fit=crop&w=400&q=80',
      submitted_at: '2026-03-22T10:15:00Z',
      verified_at: '2026-03-22T11:00:00Z',
      verified_by: 'Admin Office',
    },
    shipment_details: {
      courier_name: 'The Professional Couriers (Road Courier)',
      tracking_number: 'TPC-882947192',
      tracking_url: 'https://www.tpcindia.com/Tracking.aspx?ConsignmentNo=TPC-882947192',
      shipped_at: '2026-03-22T14:30:00Z',
      estimated_delivery: '2026-03-24',
      notes: 'Live fish in oxygen-pressurized insulated thermocol crate. Handle with extreme care.',
    },
    created_at: '2026-03-22T09:45:00Z',
    updated_at: '2026-03-22T14:30:00Z',
  }
];

export const mockDb = {
  // PRODUCTS
  getProducts: (): Product[] => {
    const deletedIds = new Set(getStoredItem<string[]>(STORAGE_KEYS.DELETED_PRODUCT_IDS, []));
    let prods: Product[];

    try {
      const raw = typeof window !== 'undefined' && window.localStorage ? window.localStorage.getItem(STORAGE_KEYS.PRODUCTS) : null;
      if (raw === null) {
        // First load initialization
        prods = INITIAL_PRODUCTS.filter(p => !deletedIds.has(p.id));
        setStoredItem(STORAGE_KEYS.PRODUCTS, prods);
      } else {
        prods = JSON.parse(raw);
        // If localStorage has obsolete template mock Bettas, upgrade to INITIAL_PRODUCTS
        if (prods.some(p => p.id === 'prod-001' || p.name?.includes('Royal Blue Halfmoon Betta') || p.name?.includes('Galaxy Koi Plakat') || p.name?.includes('Black Orchid Crowntail'))) {
          prods = INITIAL_PRODUCTS.filter(p => !deletedIds.has(p.id));
          setStoredItem(STORAGE_KEYS.PRODUCTS, prods);
        }
      }
    } catch {
      prods = INITIAL_PRODUCTS.filter(p => !deletedIds.has(p.id));
    }

    // Filter out any permanently deleted IDs
    const filtered = prods.filter(p => !deletedIds.has(p.id));
    if (filtered.length !== prods.length) {
      setStoredItem(STORAGE_KEYS.PRODUCTS, filtered);
    }
    return filtered;
  },

  getProductBySlug: (slug: string): Product | undefined => {
    const products = mockDb.getProducts();
    return products.find(p => p.slug === slug);
  },

  getProductById: (id: string): Product | undefined => {
    const products = mockDb.getProducts();
    return products.find(p => p.id === id);
  },

  saveProduct: (product: Partial<Product> & { name: string; price: number }): Product => {
    const products = mockDb.getProducts();
    const existingIndex = products.findIndex(p => p.id === product.id);

    if (existingIndex >= 0) {
      const updated: Product = {
        ...products[existingIndex],
        ...product,
      };
      products[existingIndex] = updated;
      setStoredItem(STORAGE_KEYS.PRODUCTS, products);
      mockDb.addAuditLog('Updated product: ' + updated.name, 'product', updated.id);
      return updated;
    } else {
      const newProduct: Product = {
        id: product.id || 'prod-' + Date.now(),
        name: product.name,
        slug: product.slug || product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
        sku: product.sku || 'BA-' + Math.floor(1000 + Math.random() * 9000),
        description: product.description || '',
        short_description: product.short_description || '',
        price: Number(product.price),
        compare_at_price: product.compare_at_price ? Number(product.compare_at_price) : undefined,
        category_id: product.category_id || 'cat-betta',
        category_name: product.category_name,
        stock_quantity: Number(product.stock_quantity ?? 1),
        is_unique_specimen: Boolean(product.is_unique_specimen),
        is_featured: Boolean(product.is_featured),
        is_active: product.is_active !== undefined ? product.is_active : true,
        strain: product.strain || 'Halfmoon',
        gender: product.gender || 'Male',
        size: product.size || '3.5 - 4.5 cm',
        water_type: product.water_type || 'Freshwater (Tropical)',
        temperature_range: product.temperature_range || '24°C - 28°C',
        ph_range: product.ph_range || '6.5 - 7.5',
        care_level: product.care_level || 'Moderate',
        diet: product.diet || 'High-protein pellets & frozen worms',
        shipping_restriction: product.shipping_restriction,
        images: product.images && product.images.length > 0 
          ? product.images 
          : ['https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80'],
        videos: product.videos || [],
        rating: 5.0,
        review_count: 0,
        tags: product.tags || [],
        created_at: new Date().toISOString(),
      };
      products.unshift(newProduct);
      setStoredItem(STORAGE_KEYS.PRODUCTS, products);
      mockDb.addAuditLog('Created product: ' + newProduct.name, 'product', newProduct.id);
      return newProduct;
    }
  },

  deleteProduct: (id: string, options?: { force?: boolean; archiveIfInOrders?: boolean }): { success: boolean; action: 'deleted' | 'archived'; message: string } => {
    let products = mockDb.getProducts();
    const product = products.find(p => p.id === id);
    const prodName = product ? product.name : id;

    // Unlink product from historical mock orders to ensure orders display cleanly without foreign key lock
    const orders = mockDb.getOrders();
    let ordersModified = false;
    for (const order of orders) {
      for (const item of order.items || []) {
        if (item.product_id === id) {
          item.product_id = undefined;
          ordersModified = true;
        }
      }
    }
    if (ordersModified) {
      setStoredItem(STORAGE_KEYS.ORDERS, orders);
    }

    // Permanently remove from products catalog
    products = products.filter(p => p.id !== id);
    setStoredItem(STORAGE_KEYS.PRODUCTS, products);

    // Track in permanent deleted IDs so it is never re-seeded
    const deletedIds = getStoredItem<string[]>(STORAGE_KEYS.DELETED_PRODUCT_IDS, []);
    if (!deletedIds.includes(id)) {
      deletedIds.push(id);
      setStoredItem(STORAGE_KEYS.DELETED_PRODUCT_IDS, deletedIds);
    }

    mockDb.addAuditLog('Deleted product: ' + prodName, 'product', id);
    return { success: true, action: 'deleted', message: `Product "${prodName}" permanently deleted.` };
  },

  bulkSaveProducts: (productsToSave: Product[]): { created: number; updated: number } => {
    const products = mockDb.getProducts();
    let created = 0;
    let updated = 0;

    for (const p of productsToSave) {
      const idx = products.findIndex(existing => existing.id === p.id || (p.sku && existing.sku === p.sku));
      if (idx >= 0) {
        products[idx] = {
          ...products[idx],
          ...p,
        };
        updated++;
      } else {
        products.unshift(p);
        created++;
      }
    }

    setStoredItem(STORAGE_KEYS.PRODUCTS, products);
    mockDb.addAuditLog(`Bulk saved products: ${created} created, ${updated} updated`, 'product', 'bulk');
    return { created, updated };
  },

  bulkDeleteProducts: (productIds: string[], options?: { force?: boolean; archiveIfInOrders?: boolean }): { deletedIds: string[]; archivedIds: string[]; protectedIds: string[] } => {
    let products = mockDb.getProducts();
    const idSet = new Set(productIds);

    // Unlink from orders
    const orders = mockDb.getOrders();
    let ordersModified = false;
    for (const order of orders) {
      for (const item of order.items || []) {
        if (item.product_id && idSet.has(item.product_id)) {
          item.product_id = undefined;
          ordersModified = true;
        }
      }
    }
    if (ordersModified) {
      setStoredItem(STORAGE_KEYS.ORDERS, orders);
    }

    // Permanently remove all selected IDs from products
    products = products.filter(p => !idSet.has(p.id));
    setStoredItem(STORAGE_KEYS.PRODUCTS, products);

    // Track in permanent deleted IDs
    const deletedIds = getStoredItem<string[]>(STORAGE_KEYS.DELETED_PRODUCT_IDS, []);
    for (const id of productIds) {
      if (!deletedIds.includes(id)) {
        deletedIds.push(id);
      }
    }
    setStoredItem(STORAGE_KEYS.DELETED_PRODUCT_IDS, deletedIds);

    mockDb.addAuditLog(
      `Bulk product deletion: ${productIds.length} specimens permanently removed`,
      'product',
      'bulk'
    );

    return { deletedIds: productIds, archivedIds: [], protectedIds: [] };
  },

  getCategories: (): Category[] => {
    const deletedIds = new Set(getStoredItem<string[]>(STORAGE_KEYS.DELETED_CATEGORY_IDS, []));
    let cats: Category[];

    try {
      const raw = typeof window !== 'undefined' && window.localStorage ? window.localStorage.getItem(STORAGE_KEYS.CATEGORIES) : null;
      if (raw === null) {
        cats = INITIAL_CATEGORIES.filter(c => !deletedIds.has(c.id));
        setStoredItem(STORAGE_KEYS.CATEGORIES, cats);
      } else {
        cats = JSON.parse(raw);
        // If localStorage has old template category IDs or legacy unsplash images, upgrade to INITIAL_CATEGORIES
        let upgraded = false;
        if (cats.some(c => c.id === 'cat-betta' || c.id === 'cat-sub-halfmoon')) {
          cats = INITIAL_CATEGORIES.filter(c => !deletedIds.has(c.id));
          upgraded = true;
        } else {
          cats = cats.map(c => {
            const initialMatch = INITIAL_CATEGORIES.find(ic => ic.id === c.id);
            if (initialMatch && c.image_url && c.image_url.includes('images.unsplash.com')) {
              upgraded = true;
              return { ...c, image_url: initialMatch.image_url, banner_url: initialMatch.banner_url || initialMatch.image_url };
            }
            return c;
          });
        }
        if (upgraded) {
          setStoredItem(STORAGE_KEYS.CATEGORIES, cats);
        }
      }
    } catch {
      cats = INITIAL_CATEGORIES.filter(c => !deletedIds.has(c.id));
    }

    const filtered = cats.filter(c => !deletedIds.has(c.id));
    if (filtered.length !== cats.length) {
      setStoredItem(STORAGE_KEYS.CATEGORIES, filtered);
    }
    return filtered.sort((a, b) => a.display_order - b.display_order);
  },

  getCategoryHierarchy: (): Category[] => {
    const all = mockDb.getCategories();
    const products = mockDb.getProducts();

    // Map product counts
    const countMap: Record<string, number> = {};
    for (const p of products) {
      if (p.category_id) {
        countMap[p.category_id] = (countMap[p.category_id] || 0) + 1;
      }
      if (p.subcategory_id) {
        countMap[p.subcategory_id] = (countMap[p.subcategory_id] || 0) + 1;
      }
    }

    const rootCategories: Category[] = [];
    const childrenMap: Record<string, Category[]> = {};

    for (const c of all) {
      const enriched: Category = {
        ...c,
        product_count: countMap[c.id] || 0,
        children: [],
      };
      if (!c.parent_id) {
        rootCategories.push(enriched);
      } else {
        if (!childrenMap[c.parent_id]) {
          childrenMap[c.parent_id] = [];
        }
        childrenMap[c.parent_id].push(enriched);
      }
    }

    for (const root of rootCategories) {
      root.children = (childrenMap[root.id] || []).sort((a, b) => a.display_order - b.display_order);
      // Aggregate child counts to root
      const childrenSum = root.children.reduce((acc, ch) => acc + (ch.product_count || 0), 0);
      root.product_count = (root.product_count || 0) + childrenSum;
    }

    return rootCategories.sort((a, b) => a.display_order - b.display_order);
  },

  getCategoryById: (id: string): Category | undefined => {
    const categories = mockDb.getCategories();
    return categories.find(c => c.id === id);
  },

  getCategoryBySlug: (slug: string): Category | undefined => {
    const categories = mockDb.getCategories();
    return categories.find(c => c.slug === slug);
  },

  saveCategory: (category: Partial<Category> & { name: string }): Category => {
    const categories = mockDb.getCategories();
    const existingIndex = categories.findIndex(c => c.id === category.id);

    // Validation: Slug uniqueness
    const targetSlug = category.slug 
      ? category.slug.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
      : category.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    
    const duplicateSlug = categories.find(c => c.slug === targetSlug && c.id !== category.id);
    if (duplicateSlug) {
      throw new Error(`Category slug "${targetSlug}" is already in use by category "${duplicateSlug.name}".`);
    }

    // Circular hierarchy prevention
    if (category.id && category.parent_id) {
      if (category.parent_id === category.id) {
        throw new Error('A category cannot be its own parent.');
      }
      // Check if parent_id is one of this category's descendants
      let currParent = categories.find(c => c.id === category.parent_id);
      while (currParent && currParent.parent_id) {
        if (currParent.parent_id === category.id) {
          throw new Error('Circular category hierarchy detected: A category cannot be parented to its own child.');
        }
        currParent = categories.find(c => c.id === currParent?.parent_id);
      }
    }

    if (existingIndex >= 0) {
      const updated: Category = {
        ...categories[existingIndex],
        ...category,
        slug: targetSlug,
        updated_at: new Date().toISOString(),
      };
      categories[existingIndex] = updated;
      setStoredItem(STORAGE_KEYS.CATEGORIES, categories);
      mockDb.addAuditLog('Updated category: ' + updated.name, 'category', updated.id);
      return updated;
    } else {
      const newCat: Category = {
        id: category.id || 'cat-' + Date.now(),
        name: category.name,
        slug: targetSlug,
        description: category.description || '',
        image_url: category.image_url || 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=600&q=80',
        banner_url: category.banner_url,
        video_url: category.video_url,
        parent_id: category.parent_id || null,
        display_order: category.display_order ?? (categories.length + 1),
        is_active: category.is_active !== undefined ? category.is_active : true,
        is_featured: Boolean(category.is_featured),
        created_at: new Date().toISOString(),
      };
      categories.push(newCat);
      setStoredItem(STORAGE_KEYS.CATEGORIES, categories);
      mockDb.addAuditLog('Created category: ' + newCat.name, 'category', newCat.id);
      return newCat;
    }
  },

  reorderCategories: (orderedIds: string[]): void => {
    const categories = mockDb.getCategories();
    orderedIds.forEach((id, idx) => {
      const found = categories.find(c => c.id === id);
      if (found) {
        found.display_order = idx + 1;
      }
    });
    setStoredItem(STORAGE_KEYS.CATEGORIES, categories);
    mockDb.addAuditLog('Reordered categories display sequence', 'category', 'bulk');
  },

  deleteCategory: (id: string, options?: { reassignToId?: string; archiveProducts?: boolean }): { success: boolean; message: string } => {
    let categories = mockDb.getCategories();
    const cat = categories.find(c => c.id === id);
    const catName = cat ? cat.name : id;

    // 1. Move child subcategories to reassign target or top-level root
    const childCategories = categories.filter(c => c.parent_id === id);
    if (childCategories.length > 0) {
      childCategories.forEach(ch => {
        ch.parent_id = options?.reassignToId || null;
      });
    }

    // 2. Resolve assigned products
    const products = mockDb.getProducts();
    const assignedProducts = products.filter(p => p.category_id === id || p.subcategory_id === id);
    if (assignedProducts.length > 0) {
      const targetCategory = options?.reassignToId ? categories.find(c => c.id === options.reassignToId) : null;
      assignedProducts.forEach(p => {
        if (p.category_id === id) {
          p.category_id = options?.reassignToId || '';
          p.category_name = targetCategory?.name || undefined;
        }
        if (p.subcategory_id === id) {
          p.subcategory_id = undefined;
          p.subcategory_name = undefined;
        }
        if (options?.archiveProducts) {
          p.is_active = false;
          p.status = 'archived';
        }
      });
      setStoredItem(STORAGE_KEYS.PRODUCTS, products);
    }

    // 3. Remove category from storage
    categories = categories.filter(c => c.id !== id);
    setStoredItem(STORAGE_KEYS.CATEGORIES, categories);

    // 4. Record in permanent deleted category IDs
    const deletedIds = getStoredItem<string[]>(STORAGE_KEYS.DELETED_CATEGORY_IDS, []);
    if (!deletedIds.includes(id)) {
      deletedIds.push(id);
      setStoredItem(STORAGE_KEYS.DELETED_CATEGORY_IDS, deletedIds);
    }

    mockDb.addAuditLog('Deleted category: ' + catName, 'category', id);
    return { success: true, message: `Category "${catName}" permanently deleted.` };
  },

  // IMPORT HISTORY
  getImportHistory: (): ImportHistoryItem[] => {
    return getStoredItem<ImportHistoryItem[]>(STORAGE_KEYS.IMPORT_HISTORY, []);
  },

  saveImportHistory: (item: ImportHistoryItem): void => {
    const history = mockDb.getImportHistory();
    history.unshift(item);
    setStoredItem(STORAGE_KEYS.IMPORT_HISTORY, history.slice(0, 50));
    mockDb.addAuditLog(`CSV Import (${item.mode}): ${item.filename} - ${item.success_count} success, ${item.failure_count} failed`, 'import', item.id);
  },

  // ORDERS
  getOrders: (): Order[] => {
    return getStoredItem<Order[]>(STORAGE_KEYS.ORDERS, INITIAL_ORDERS);
  },

  getOrderById: (id: string): Order | undefined => {
    const orders = mockDb.getOrders();
    return orders.find(o => o.id === id || o.order_number === id);
  },

  getOrdersByUserId: (userId: string): Order[] => {
    const orders = mockDb.getOrders();
    return orders.filter(o => o.user_id === userId);
  },

  createOrder: (orderData: Omit<Order, 'id' | 'order_number' | 'created_at' | 'updated_at'>): Order => {
    const orders = mockDb.getOrders();
    const products = mockDb.getProducts();

    // 1. Strict Server/Database-Side Inventory Validation
    for (const item of orderData.items) {
      const p = products.find(prod => prod.id === item.product_id);
      if (!p) {
        throw new Error(`Product "${item.product_name}" is no longer available in catalog.`);
      }
      if (p.stock_quantity < item.quantity) {
        throw new Error(`Item "${p.name}" has only ${p.stock_quantity} left in stock. Requested quantity: ${item.quantity}.`);
      }
    }

    // 2. Strict Server-Side Delivery & Courier Fee Revalidation
    const totalItemCount = orderData.items.reduce((sum, item) => sum + item.quantity, 0);
    const shippingTarget = orderData.shipping_address?.postal_code || orderData.shipping_address?.state;
    if (!shippingTarget) {
      throw new Error('A valid delivery address is required to calculate road courier charges.');
    }
    const verifiedShipping = calculateShipping(shippingTarget, totalItemCount);
    if (!verifiedShipping.isCalculated) {
      throw new Error(verifiedShipping.errorMessage || 'Invalid delivery location for road courier calculation.');
    }
    const verifiedDeliveryFee = verifiedShipping.finalFee;

    // 3. Strict Server-Side Subtotal & Total Revalidation
    const verifiedSubtotal = orderData.items.reduce((sum, item) => sum + item.total_price, 0);
    const verifiedDiscount = orderData.discount_amount || 0;
    const verifiedPacking = orderData.packing_charge || 0;
    const verifiedTotal = Math.max(0, verifiedSubtotal + verifiedDeliveryFee + verifiedPacking - verifiedDiscount);

    const newOrderNumber = 'BA-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);
    const newOrder: Order = {
      ...orderData,
      subtotal: verifiedSubtotal,
      delivery_fee: verifiedDeliveryFee,
      total_amount: verifiedTotal,
      id: 'ord-' + Date.now(),
      order_number: newOrderNumber,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // 2. Decrement stock for ordered items
    newOrder.items.forEach(item => {
      const pIndex = products.findIndex(p => p.id === item.product_id);
      if (pIndex >= 0) {
        products[pIndex].stock_quantity = Math.max(0, products[pIndex].stock_quantity - item.quantity);
      }
    });
    setStoredItem(STORAGE_KEYS.PRODUCTS, products);

    orders.unshift(newOrder);
    setStoredItem(STORAGE_KEYS.ORDERS, orders);

    // 3. Dispatch real-time events across windows & components
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('ba_inventory_updated'));
      window.dispatchEvent(new CustomEvent('ba_orders_updated'));
    }

    // 4. Asynchronously sync order to Supabase cloud database
    import('./supabaseSync').then(m => {
      m.syncOrderToSupabase(newOrder);
    }).catch(err => {
      console.warn('Background Supabase order sync notice:', err);
    });

    return newOrder;
  },

  updateOrderPayment: (
    orderId: string, 
    paymentStatus: PaymentStatus, 
    details?: {
      rejection_reason?: string;
      verified_by?: string;
      upi_reference?: string;
      proof_image_url?: string;
    }
  ): Order | undefined => {
    const orders = mockDb.getOrders();
    const index = orders.findIndex(o => o.id === orderId);
    if (index === -1) return undefined;

    const order = orders[index];
    order.payment_status = paymentStatus;
    order.updated_at = new Date().toISOString();

    if (!order.payment_details) {
      order.payment_details = {
        method: 'upi',
        submitted_at: new Date().toISOString(),
      };
    }

    if (details?.upi_reference) {
      order.payment_details.upi_reference = details.upi_reference;
    }
    if (details?.proof_image_url) {
      order.payment_details.proof_image_url = details.proof_image_url;
    }
    if (paymentStatus === 'verified') {
      order.payment_details.verified_at = new Date().toISOString();
      order.payment_details.verified_by = details?.verified_by || 'Admin Verifier';
      if (order.fulfillment_status === 'unfulfilled') {
        order.fulfillment_status = 'processing';
      }
    } else if (paymentStatus === 'rejected') {
      order.payment_details.rejection_reason = details?.rejection_reason || 'Invalid transaction reference or uncredited payment proof.';
    }

    orders[index] = order;
    setStoredItem(STORAGE_KEYS.ORDERS, orders);
    mockDb.addAuditLog(`Order ${order.order_number} payment ${paymentStatus}`, 'order', order.id);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('ba_orders_updated'));
    }

    import('./supabaseSync').then(m => {
      m.updateSupabaseOrderPayment(order.order_number, paymentStatus, details);
    }).catch(err => {
      console.warn('Background Supabase payment update notice:', err);
    });

    return order;
  },

  updateOrderShipment: (
    orderId: string, 
    courierName: string, 
    trackingNumber: string, 
    trackingUrl: string, 
    notes?: string,
    estimatedDelivery?: string
  ): Order | undefined => {
    const orders = mockDb.getOrders();
    const index = orders.findIndex(o => o.id === orderId);
    if (index === -1) return undefined;

    const order = orders[index];
    order.fulfillment_status = 'shipped';
    order.updated_at = new Date().toISOString();
    order.shipment_details = {
      courier_name: courierName,
      tracking_number: trackingNumber,
      tracking_url: trackingUrl,
      shipped_at: new Date().toISOString(),
      notes: notes || '',
      estimated_delivery: estimatedDelivery,
    };

    orders[index] = order;
    setStoredItem(STORAGE_KEYS.ORDERS, orders);
    mockDb.addAuditLog(`Order ${order.order_number} dispatched via ${courierName} (${trackingNumber})`, 'shipment', order.id);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('ba_orders_updated'));
    }

    import('./supabaseSync').then(m => {
      m.updateSupabaseOrderShipment(order.order_number, courierName, trackingNumber, trackingUrl, notes);
    }).catch(err => {
      console.warn('Background Supabase shipment update notice:', err);
    });

    return order;
  },

  updateFulfillmentStatus: (orderId: string, status: FulfillmentStatus): Order | undefined => {
    const orders = mockDb.getOrders();
    const index = orders.findIndex(o => o.id === orderId);
    if (index === -1) return undefined;

    orders[index].fulfillment_status = status;
    orders[index].updated_at = new Date().toISOString();
    setStoredItem(STORAGE_KEYS.ORDERS, orders);
    mockDb.addAuditLog(`Order ${orders[index].order_number} status set to ${status}`, 'order', orders[index].id);
    return orders[index];
  },

  // STORE SETTINGS
  getStoreSettings: (): StoreSettings => {
    return getStoredItem<StoreSettings>(STORAGE_KEYS.STORE_SETTINGS, INITIAL_STORE_SETTINGS);
  },

  updateStoreSettings: (newSettings: Partial<StoreSettings>): StoreSettings => {
    const current = mockDb.getStoreSettings();
    const updated = { ...current, ...newSettings };
    setStoredItem(STORAGE_KEYS.STORE_SETTINGS, updated);
    mockDb.addAuditLog('Store settings updated', 'settings', 'global');
    return updated;
  },

  // BRANDING & THEME SETTINGS
  getBrandingSettings: (): BrandingSettings => {
    const stored = getStoredItem<BrandingSettings>(STORAGE_KEYS.BRANDING_SETTINGS, DEFAULT_BRANDING_SETTINGS);

    let needsSave = false;
    const migrated: BrandingSettings = { ...DEFAULT_BRANDING_SETTINGS, ...stored };

    // Migrate legacy default logo to the active project logo asset
    if (!migrated.logo_url || migrated.logo_url === '/logo-fish.svg') {
      migrated.logo_url = '/logo.jpeg';
      needsSave = true;
    }

    // If mobile logo was missing or set to the old legacy default svg, sync to primary logo
    if (!migrated.mobile_logo_url || migrated.mobile_logo_url === '/logo-fish.svg') {
      migrated.mobile_logo_url = migrated.logo_url;
      needsSave = true;
    }

    // If footer logo was missing or set to the old legacy default svg, sync to primary logo
    if (!migrated.footer_logo_url || migrated.footer_logo_url === '/logo-fish.svg') {
      migrated.footer_logo_url = migrated.logo_url;
      needsSave = true;
    }

    if (!migrated.site_name || migrated.site_name === 'Betta Aquatics') {
      migrated.site_name = 'Ra Guppy';
      needsSave = true;
    }

    if (needsSave) {
      setStoredItem(STORAGE_KEYS.BRANDING_SETTINGS, migrated);
    }

    return migrated;
  },

  updateBrandingSettings: (newBranding: Partial<BrandingSettings>): BrandingSettings => {
    const current = mockDb.getBrandingSettings();
    const updatedLogo = newBranding.logo_url || current.logo_url;

    let newMobile = newBranding.mobile_logo_url !== undefined ? newBranding.mobile_logo_url : current.mobile_logo_url;
    let newFooter = newBranding.footer_logo_url !== undefined ? newBranding.footer_logo_url : current.footer_logo_url;

    // Auto-sync mobile and footer logos if they were empty, legacy default, or identical to old primary logo
    if (newBranding.logo_url) {
      if (!newMobile || newMobile === '/logo-fish.svg' || newMobile === current.logo_url) {
        newMobile = updatedLogo;
      }
      if (!newFooter || newFooter === '/logo-fish.svg' || newFooter === current.footer_logo_url) {
        newFooter = updatedLogo;
      }
    }

    const updated: BrandingSettings = {
      ...current,
      ...newBranding,
      logo_url: updatedLogo,
      mobile_logo_url: newMobile,
      footer_logo_url: newFooter,
      updated_at: new Date().toISOString(),
      version: (current.version || 1) + 1,
    };
    setStoredItem(STORAGE_KEYS.BRANDING_SETTINGS, updated);

    // Keep store_settings in sync
    const storeSettings = mockDb.getStoreSettings();
    setStoredItem(STORAGE_KEYS.STORE_SETTINGS, {
      ...storeSettings,
      branding: updated,
      brand_name: updated.site_name || storeSettings.brand_name,
    });

    mockDb.addAuditLog(`Branding & theme settings updated: logo and colors (v${updated.version})`, 'cms', 'branding');

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('ba_branding_updated', { detail: updated }));
    }
    return updated;
  },

  resetBrandingSettings: (): BrandingSettings => {
    const reset: BrandingSettings = {
      ...DEFAULT_BRANDING_SETTINGS,
      updated_at: new Date().toISOString(),
      version: Date.now(),
    };
    setStoredItem(STORAGE_KEYS.BRANDING_SETTINGS, reset);
    mockDb.addAuditLog('Branding and theme colors reset to factory defaults', 'cms', 'branding');
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('ba_branding_updated', { detail: reset }));
    }
    return reset;
  },

  // HOMEPAGE CMS SECTIONS
  getHomepageSections: (): HomepageSection[] => {
    return getStoredItem<HomepageSection[]>(STORAGE_KEYS.HOMEPAGE_SECTIONS, INITIAL_HOMEPAGE_SECTIONS);
  },

  updateHomepageSections: (sections: HomepageSection[]): void => {
    setStoredItem(STORAGE_KEYS.HOMEPAGE_SECTIONS, sections);
    mockDb.addAuditLog('Homepage sections modified and saved', 'cms', 'homepage');
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('ba_homepage_updated', { detail: sections }));
    }
  },

  resetHomepageSections: (): HomepageSection[] => {
    setStoredItem(STORAGE_KEYS.HOMEPAGE_SECTIONS, INITIAL_HOMEPAGE_SECTIONS);
    mockDb.addAuditLog('Homepage sections reset to default catalog layout', 'cms', 'homepage');
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('ba_homepage_updated', { detail: INITIAL_HOMEPAGE_SECTIONS }));
    }
    return INITIAL_HOMEPAGE_SECTIONS;
  },

  // CMS PAGES
  getCMSPages: (): CMSPage[] => {
    return getStoredItem<CMSPage[]>(STORAGE_KEYS.CMS_PAGES, INITIAL_CMS_PAGES);
  },

  getCMSPageBySlug: (slug: string): CMSPage | undefined => {
    const pages = mockDb.getCMSPages();
    return pages.find(p => p.slug === slug);
  },

  saveCMSPage: (page: CMSPage): void => {
    const pages = mockDb.getCMSPages();
    const index = pages.findIndex(p => p.id === page.id);
    page.updated_at = new Date().toISOString();

    if (index >= 0) {
      pages[index] = page;
    } else {
      pages.push(page);
    }
    setStoredItem(STORAGE_KEYS.CMS_PAGES, pages);
    mockDb.addAuditLog(`Saved CMS page: ${page.title}`, 'cms', page.id);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('ba_cms_pages_updated'));
    }
  },

  deleteCMSPage: (id: string): boolean => {
    const pages = mockDb.getCMSPages();
    const toDelete = pages.find(p => p.id === id);
    const filtered = pages.filter(p => p.id !== id);
    setStoredItem(STORAGE_KEYS.CMS_PAGES, filtered);
    if (toDelete) {
      mockDb.addAuditLog(`Deleted CMS page: ${toDelete.title}`, 'cms', id);
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('ba_cms_pages_updated'));
    }
    return true;
  },

  // REVIEWS
  getReviews: (productId?: string): ProductReview[] => {
    const all = getStoredItem<ProductReview[]>(STORAGE_KEYS.REVIEWS, [
      {
        id: 'rev-01',
        product_id: 'prod-001',
        user_name: 'Aditya Sen',
        rating: 5,
        title: 'Arrived in peak health & stunning finnage!',
        comment: 'Received the Royal Blue Halfmoon in Kolkata within 28 hours. The oxygen packing and heat pack kept the water at perfect 26°C. The fish started swimming actively right after acclimation!',
        is_verified: true,
        status: 'approved',
        created_at: '2026-03-10T12:00:00Z',
      },
      {
        id: 'rev-02',
        product_id: 'prod-002',
        user_name: 'Priya Nambiar',
        rating: 5,
        title: 'True Galaxy Koi colours! Exactly as shown in photos',
        comment: 'I was nervous to buy a fish online, but Ra Guppy sent the exact fish from the photo. Healthy, active, and beautiful!',
        is_verified: true,
        status: 'approved',
        created_at: '2026-03-14T15:30:00Z',
      }
    ]);
    if (productId) {
      return all.filter(r => r.product_id === productId && r.status === 'approved');
    }
    return all;
  },

  submitReview: (review: Omit<ProductReview, 'id' | 'created_at' | 'status'>): ProductReview => {
    const all = mockDb.getReviews();
    const newRev: ProductReview = {
      ...review,
      id: 'rev-' + Date.now(),
      created_at: new Date().toISOString(),
      status: 'approved', // Auto-approved or pending moderation
    };
    all.unshift(newRev);
    setStoredItem(STORAGE_KEYS.REVIEWS, all);
    return newRev;
  },

  // COUPONS
  getCoupons: (): Coupon[] => {
    return getStoredItem<Coupon[]>(STORAGE_KEYS.COUPONS, INITIAL_COUPONS);
  },

  validateCoupon: (code: string, subtotal: number): { valid: boolean; discount: number; message: string } => {
    const coupons = mockDb.getCoupons();
    const coupon = coupons.find(c => c.code.toUpperCase() === code.trim().toUpperCase() && c.is_active);

    if (!coupon) {
      return { valid: false, discount: 0, message: 'Invalid or expired coupon code' };
    }

    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
      return { valid: false, discount: 0, message: 'This coupon has expired' };
    }

    if (subtotal < coupon.min_order_amount) {
      return { 
        valid: false, 
        discount: 0, 
        message: `Coupon requires minimum order value of ₹${coupon.min_order_amount}` 
      };
    }

    let discount = 0;
    if (coupon.discount_type === 'percentage') {
      discount = Math.round((subtotal * coupon.discount_value) / 100);
      if (coupon.max_discount && discount > coupon.max_discount) {
        discount = coupon.max_discount;
      }
    } else {
      discount = coupon.discount_value;
    }

    return { 
      valid: true, 
      discount, 
      message: `Coupon ${coupon.code} applied successfully! Saved ₹${discount}` 
    };
  },

  // PINCODE SERVICEABILITY
  checkPincodeServiceability: (pincode: string): { serviceable: boolean; estimatedDays: string; expressRoad: boolean } => {
    const trimmed = pincode.trim();
    if (trimmed.length !== 6 || isNaN(Number(trimmed))) {
      return { serviceable: false, estimatedDays: '', expressRoad: false };
    }
    const settings = mockDb.getStoreSettings();
    // Check if within serviceable Indian pincodes
    const isSpecialExpress = settings.serviceable_pincodes.includes(trimmed);
    return {
      serviceable: true,
      estimatedDays: isSpecialExpress ? '2 - 3 Days (The Professional Couriers Express Road)' : '3 - 5 Days (The Professional Couriers Surface Transport)',
      expressRoad: true,
    };
  },

  // AUDIT LOGS
  getAuditLogs: (): AdminAuditLog[] => {
    return getStoredItem<AdminAuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, [
      {
        id: 'log-01',
        admin_id: 'admin-primary',
        admin_email: 'admin@bettaaquatics.in',
        action: 'System Initialized',
        entity_type: 'system',
        entity_id: 'init',
        details: 'Store database loaded with high-grade Betta specimen inventory.',
        created_at: new Date(Date.now() - 3600000).toISOString(),
      }
    ]);
  },

  addAuditLog: (action: string, entityType: string, entityId: string, details?: string): void => {
    const logs = mockDb.getAuditLogs();
    const newLog: AdminAuditLog = {
      id: 'log-' + Date.now(),
      admin_id: 'admin-primary',
      admin_email: 'admin@bettaaquatics.in',
      action,
      entity_type: entityType,
      entity_id: entityId,
      details: details || action,
      created_at: new Date().toISOString(),
    };
    logs.unshift(newLog);
    setStoredItem(STORAGE_KEYS.AUDIT_LOGS, logs.slice(0, 100)); // Keep last 100 logs
  },

  // BLOG POSTS / GUIDES
  getBlogPosts: (publishedOnly: boolean = false): BlogPost[] => {
    const posts = getStoredItem<BlogPost[]>(STORAGE_KEYS.BLOG_POSTS, INITIAL_BLOG_POSTS);
    if (publishedOnly) {
      return posts.filter(p => p.is_published);
    }
    return posts;
  },

  getBlogPostBySlug: (slug: string): BlogPost | undefined => {
    const posts = mockDb.getBlogPosts();
    return posts.find(p => p.slug === slug);
  },

  saveBlogPost: (postData: Partial<BlogPost>): BlogPost => {
    const posts = mockDb.getBlogPosts();
    const now = new Date().toISOString();

    if (postData.id) {
      const index = posts.findIndex(p => p.id === postData.id);
      if (index !== -1) {
        const updated: BlogPost = {
          ...posts[index],
          ...postData,
          updated_at: now,
        };
        posts[index] = updated;
        setStoredItem(STORAGE_KEYS.BLOG_POSTS, posts);
        mockDb.addAuditLog('Blog Post Updated', 'blog', updated.id, `Updated article: ${updated.title}`);
        return updated;
      }
    }

    // New blog post
    const newPost: BlogPost = {
      id: 'post-' + Date.now(),
      slug: postData.slug || ('post-' + Date.now()),
      title: postData.title || 'Untitled Post',
      excerpt: postData.excerpt || '',
      content_html: postData.content_html || '',
      featured_image: postData.featured_image || 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1200&q=80',
      category: postData.category || 'Betta Care & Acclimation',
      tags: postData.tags || ['Betta Care'],
      author: postData.author || {
        name: 'Dr. Anand Raman',
        role: 'Chief Marine Biologist & Founder',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      },
      read_time_minutes: postData.read_time_minutes || 5,
      is_published: postData.is_published ?? true,
      views_count: postData.views_count || 1,
      published_at: postData.published_at || now,
      updated_at: now,
      meta_title: postData.meta_title,
      meta_description: postData.meta_description,
    };

    posts.unshift(newPost);
    setStoredItem(STORAGE_KEYS.BLOG_POSTS, posts);
    mockDb.addAuditLog('Blog Post Created', 'blog', newPost.id, `Created article: ${newPost.title}`);
    return newPost;
  },

  deleteBlogPost: (id: string): boolean => {
    const posts = mockDb.getBlogPosts();
    const toDelete = posts.find(p => p.id === id);
    const filtered = posts.filter(p => p.id !== id);
    setStoredItem(STORAGE_KEYS.BLOG_POSTS, filtered);
    if (toDelete) {
      mockDb.addAuditLog('Blog Post Deleted', 'blog', id, `Deleted article: ${toDelete.title}`);
    }
    return true;
  },

  incrementBlogPostViews: (id: string): void => {
    const posts = mockDb.getBlogPosts();
    const index = posts.findIndex(p => p.id === id);
    if (index !== -1) {
      posts[index].views_count = (posts[index].views_count || 0) + 1;
      setStoredItem(STORAGE_KEYS.BLOG_POSTS, posts);
    }
  },

  // MEDIA ASSETS LIBRARY
  getMediaAssets: (): MediaAsset[] => {
    const assets = getStoredItem<MediaAsset[]>(STORAGE_KEYS.MEDIA_ASSETS, INITIAL_MEDIA_ASSETS);
    const missing = INITIAL_MEDIA_ASSETS.filter(init => !assets.some(a => a.id === init.id));
    if (missing.length > 0) {
      const merged = [...assets, ...missing];
      setStoredItem(STORAGE_KEYS.MEDIA_ASSETS, merged);
      return merged;
    }
    return assets;
  },

  saveMediaAsset: (assetData: Partial<MediaAsset>): MediaAsset => {
    const assets = mockDb.getMediaAssets();
    const newAsset: MediaAsset = {
      id: assetData.id || ('med-' + Date.now()),
      filename: assetData.filename || 'uploaded-image.jpg',
      url: assetData.url || '',
      alt_text: assetData.alt_text || 'Aquarium Store Media Asset',
      file_size_bytes: assetData.file_size_bytes || 150000,
      mime_type: assetData.mime_type || 'image/jpeg',
      category: assetData.category || 'general',
      thumbnail_url: assetData.thumbnail_url,
      duration_seconds: assetData.duration_seconds,
      dimensions: assetData.dimensions,
      created_at: assetData.created_at || new Date().toISOString(),
    };
    assets.unshift(newAsset);
    setStoredItem(STORAGE_KEYS.MEDIA_ASSETS, assets);
    mockDb.addAuditLog(`Uploaded media asset: ${newAsset.filename}`, 'media', newAsset.id);
    return newAsset;
  },

  deleteMediaAsset: (id: string): boolean => {
    const assets = mockDb.getMediaAssets();
    const asset = assets.find(a => a.id === id);
    const filtered = assets.filter(a => a.id !== id);
    setStoredItem(STORAGE_KEYS.MEDIA_ASSETS, filtered);
    if (asset) {
      mockDb.addAuditLog(`Deleted media asset: ${asset.filename}`, 'media', id);
    }
    return true;
  },

  // USER ACCOUNTS & AUTHENTICATION (SECURE SEPARATION)
  getUsers: (): StoredUser[] => {
    const users = getStoredItem<StoredUser[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
    const existingEmails = new Set(users.map(u => u.email.toLowerCase()));
    let updated = false;
    for (const initUser of INITIAL_USERS) {
      if (!existingEmails.has(initUser.email.toLowerCase())) {
        users.push(initUser);
        updated = true;
      }
    }
    if (updated) {
      setStoredItem(STORAGE_KEYS.USERS, users);
    }
    return users;
  },

  getUserByEmail: (email: string): StoredUser | undefined => {
    const users = mockDb.getUsers();
    return users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
  },

  getUserById: (id: string): StoredUser | undefined => {
    const users = mockDb.getUsers();
    return users.find(u => u.id === id);
  },

  updateUser: (id: string, updates: Partial<StoredUser>): StoredUser | undefined => {
    const users = mockDb.getUsers();
    const index = users.findIndex(u => u.id === id);
    if (index === -1) return undefined;

    const updatedUser: StoredUser = {
      ...users[index],
      ...updates,
      email: updates.email ? updates.email.trim().toLowerCase() : users[index].email,
      full_name: updates.full_name ? updates.full_name.trim() : users[index].full_name,
    };

    users[index] = updatedUser;
    setStoredItem(STORAGE_KEYS.USERS, users);
    mockDb.addAuditLog(`User updated: ${updatedUser.email} (Role: ${updatedUser.role})`, 'user', id);
    return updatedUser;
  },

  deleteUser: (id: string): boolean => {
    const users = mockDb.getUsers();
    const target = users.find(u => u.id === id);
    if (!target) return false;

    const filtered = users.filter(u => u.id !== id);
    setStoredItem(STORAGE_KEYS.USERS, filtered);
    mockDb.addAuditLog(`User deleted: ${target.email} (${target.full_name})`, 'user', id);
    return true;
  },

  saveUser: (userData: Partial<StoredUser> & { email: string; full_name: string; role: UserRole }): StoredUser => {
    const users = mockDb.getUsers();
    const cleanEmail = userData.email.trim().toLowerCase();
    const existingIndex = users.findIndex(u => (userData.id && u.id === userData.id) || u.email.toLowerCase() === cleanEmail);

    if (existingIndex >= 0) {
      const updated: StoredUser = {
        ...users[existingIndex],
        ...userData,
        email: cleanEmail,
        full_name: userData.full_name.trim(),
      };
      users[existingIndex] = updated;
      setStoredItem(STORAGE_KEYS.USERS, users);
      mockDb.addAuditLog(`User updated: ${updated.email} (${updated.role})`, 'user', updated.id);
      return updated;
    } else {
      const newUser: StoredUser = {
        id: userData.id || ('usr-' + Date.now()),
        email: cleanEmail,
        full_name: userData.full_name.trim(),
        phone: userData.phone?.trim() || '+91 99999 00000',
        role: userData.role || 'customer',
        password_hash: userData.password_hash || (userData.role === 'customer' ? undefined : 'Staff@123'),
        created_at: new Date().toISOString(),
      };
      users.unshift(newUser);
      setStoredItem(STORAGE_KEYS.USERS, users);
      mockDb.addAuditLog(`User created: ${newUser.email} (${newUser.role})`, 'user', newUser.id);
      return newUser;
    }
  },

  authenticateCustomer: (email: string, password?: string): { success: boolean; user?: UserProfile; message?: string } => {
    const user = mockDb.getUserByEmail(email);
    if (!user) {
      return { success: false, message: 'No registered customer account found with this email. Please register.' };
    }
    // In mock mode, check password if provided
    if (password && user.password_hash && password !== user.password_hash) {
      return { success: false, message: 'Invalid email address or password. Please verify your credentials.' };
    }
    const profile: UserProfile = {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      phone: user.phone,
      role: 'customer', // strictly customer
      created_at: user.created_at,
    };
    return { success: true, user: profile };
  },

  authenticateAdmin: (email: string, password?: string): { success: boolean; user?: UserProfile; message?: string } => {
    const user = mockDb.getUserByEmail(email);
    if (!user) {
      return { success: false, message: 'Access Denied: Invalid staff credentials.' };
    }
    if (user.role === 'customer') {
      return { success: false, message: 'Access Denied: Customer accounts cannot access the executive admin portal.' };
    }
    if (password && user.password_hash && password !== user.password_hash) {
      return { success: false, message: 'Access Denied: Invalid staff credentials.' };
    }
    const adminProfile: UserProfile = {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      phone: user.phone,
      role: user.role,
      created_at: user.created_at,
    };
    mockDb.addAuditLog(`Staff Login Successful: ${adminProfile.email} (${adminProfile.role})`, 'security', adminProfile.id, 'Staff member authenticated to management console');
    return { success: true, user: adminProfile };
  },

  registerCustomer: (name: string, email: string, password?: string, phone?: string, customId?: string): { success: boolean; user?: UserProfile; message?: string } => {
    const cleanEmail = email.trim().toLowerCase();
    const existing = mockDb.getUserByEmail(cleanEmail);
    const users = mockDb.getUsers();

    if (existing) {
      if (name.trim()) existing.full_name = name.trim();
      if (phone?.trim()) existing.phone = phone.trim();
      if (customId) existing.id = customId;
      setStoredItem(STORAGE_KEYS.USERS, users);
      const profile: UserProfile = {
        id: existing.id,
        email: existing.email,
        full_name: existing.full_name,
        phone: existing.phone,
        role: existing.role || 'customer',
        created_at: existing.created_at,
      };
      return { success: true, user: profile };
    }

    const newUser: StoredUser = {
      id: customId || ('usr-' + Date.now()),
      email: cleanEmail,
      full_name: name.trim(),
      phone: phone?.trim() || '+91 99999 00000',
      role: 'customer', // Non-negotiable: Public registration is always customer role
      // Avoid plaintext password storage in client storage
      password_hash: undefined,
      created_at: new Date().toISOString(),
    };
    users.push(newUser);
    setStoredItem(STORAGE_KEYS.USERS, users);

    const profile: UserProfile = {
      id: newUser.id,
      email: newUser.email,
      full_name: newUser.full_name,
      phone: newUser.phone,
      role: 'customer',
      created_at: newUser.created_at,
    };
    return { success: true, user: profile };
  },

  requestPasswordReset: (email: string): { success: boolean; message: string } => {
    const user = mockDb.getUserByEmail(email);
    if (user) {
      mockDb.addAuditLog(`Password reset requested for: ${user.email}`, 'security', user.id);
    }
    // Return generic safe message to prevent email enumeration
    return { 
      success: true, 
      message: 'If an account exists with this email address, password reset instructions have been dispatched.' 
    };
  }
};
