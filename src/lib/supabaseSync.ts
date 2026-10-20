import { supabase, isSupabaseConfigured } from './supabase';
import { Product, Category, HomepageSection, CMSPage, MediaAsset, StoreSettings, Order, PaymentStatus, UserRole, UserProfile, Coupon } from './types';
import { mockDb, StoredUser } from './mockDatabase';

/**
 * Permanently deletes one or more products from Supabase PostgreSQL database
 * Handles foreign key constraints and child tables gracefully.
 */
export async function deleteSupabaseProducts(productIds: string[], productSkus?: string[]): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase || productIds.length === 0) {
    return true;
  }

  try {
    // 1. Unlink historical order items so receipts don't break
    await supabase
      .from('order_items')
      .update({ product_id: null })
      .in('product_id', productIds);

    // 2. Cascade delete dependent tables
    await supabase.from('product_images').delete().in('product_id', productIds);
    await supabase.from('collection_products').delete().in('product_id', productIds);
    await supabase.from('cart_items').delete().in('product_id', productIds);
    await supabase.from('wishlists').delete().in('product_id', productIds);
    await supabase.from('reviews').delete().in('product_id', productIds);

    // 3. Delete products by ID
    const { error: idError } = await supabase
      .from('products')
      .delete()
      .in('id', productIds);

    if (idError) {
      console.warn('Supabase product delete by ID notice:', idError.message);
    }

    // 4. Also delete by SKU if available (ensures mock and DB UUID discrepancies match)
    if (productSkus && productSkus.length > 0) {
      const validSkus = productSkus.filter(Boolean);
      if (validSkus.length > 0) {
        await supabase
          .from('products')
          .delete()
          .in('sku', validSkus);
      }
    }

    return true;
  } catch (err) {
    console.error('Error during Supabase product deletion:', err);
    return false;
  }
}

/**
 * Permanently deletes a category from Supabase PostgreSQL database
 * Handles products and child subcategories safely.
 */
export async function deleteSupabaseCategory(categoryId: string, reassignToId?: string): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase || !categoryId) {
    return true;
  }

  try {
    // 1. Reassign or set null on products linked to this category
    await supabase
      .from('products')
      .update({ 
        category_id: reassignToId || null, 
        subcategory_id: null 
      })
      .or(`category_id.eq.${categoryId},subcategory_id.eq.${categoryId}`);

    // 2. Move child subcategories to reassign target or root
    await supabase
      .from('categories')
      .update({ parent_id: reassignToId || null })
      .eq('parent_id', categoryId);

    // 3. Delete category from Supabase
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', categoryId);

    if (error) {
      console.warn('Supabase category delete notice:', error.message);
    }

    return true;
  } catch (err) {
    console.error('Error during Supabase category deletion:', err);
    return false;
  }
}

/**
 * Syncs a saved product into Supabase PostgreSQL database
 */
export async function syncProductToSupabase(product: Product): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;

  try {
    const payload = {
      id: product.id,
      name: product.name,
      slug: product.slug,
      sku: product.sku,
      description: product.description || '',
      short_description: product.short_description || '',
      price: product.price,
      compare_at_price: product.compare_at_price || null,
      stock_quantity: product.stock_quantity ?? 1,
      is_unique_specimen: Boolean(product.is_unique_specimen),
      is_featured: Boolean(product.is_featured),
      is_active: product.is_active !== undefined ? product.is_active : true,
      strain: product.strain || null,
      gender: product.gender || null,
      care_level: product.care_level || 'Moderate',
      images: product.images || [],
      videos: product.videos || [],
      updated_at: new Date().toISOString(),
    };

    await supabase
      .from('products')
      .upsert(payload, { onConflict: 'id' });
  } catch (err) {
    console.warn('Supabase product upsert warning:', err);
  }
}

/**
 * Syncs a saved category into Supabase PostgreSQL database
 */
export async function syncCategoryToSupabase(category: Category): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;

  try {
    const payload = {
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      image_url: category.image_url,
      banner_url: category.banner_url || null,
      parent_id: category.parent_id || null,
      display_order: category.display_order ?? 1,
      is_active: category.is_active !== undefined ? category.is_active : true,
      is_featured: Boolean(category.is_featured),
      updated_at: new Date().toISOString(),
    };

    await supabase
      .from('categories')
      .upsert(payload, { onConflict: 'id' });
  } catch (err) {
    console.warn('Supabase category upsert warning:', err);
  }
}

/**
 * Fetches products from Supabase PostgreSQL database
 */
export async function fetchSupabaseProducts(): Promise<Product[]> {
  if (!isSupabaseConfigured || !supabase) {
    return mockDb.getProducts();
  }

  try {
    const { data: prodsData, error: prodsErr } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: true });

    if (prodsErr || !prodsData || prodsData.length === 0) {
      return mockDb.getProducts();
    }

    const { data: imgsData } = await supabase
      .from('product_images')
      .select('*')
      .order('display_order', { ascending: true });

    const imgsByProd: Record<string, string[]> = {};
    if (imgsData) {
      for (const img of imgsData) {
        if (!imgsByProd[img.product_id]) imgsByProd[img.product_id] = [];
        imgsByProd[img.product_id].push(img.image_url);
      }
    }

    const products: Product[] = prodsData.map((p) => {
      const images = imgsByProd[p.id] || (Array.isArray(p.images) ? p.images : []);
      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        sku: p.sku || '',
        description: p.description || '',
        short_description: p.short_description || '',
        price: parseFloat(p.price) || 0,
        compare_at_price: p.compare_at_price ? parseFloat(p.compare_at_price) : undefined,
        category_id: p.category_id || '',
        subcategory_id: p.subcategory_id || undefined,
        stock_quantity: p.stock_quantity ?? 10,
        is_unique_specimen: Boolean(p.is_unique_specimen),
        is_featured: Boolean(p.is_featured),
        is_active: p.is_active !== undefined ? Boolean(p.is_active) : true,
        status: p.status || 'published',
        weight: p.weight ? parseFloat(p.weight) : 150,
        strain: p.strain || undefined,
        gender: p.gender || undefined,
        size: p.size || undefined,
        water_type: p.water_type || 'Freshwater (Tropical)',
        temperature_range: p.temperature_range || '24°C - 28°C',
        ph_range: p.ph_range || '6.5 - 7.5',
        care_level: p.care_level || 'Easy',
        diet: p.diet || undefined,
        shipping_restriction: p.shipping_restriction || undefined,
        images: images.length > 0 ? images : ['/product_image/afr-flower-dorsal-400.jpeg'],
        videos: Array.isArray(p.videos) ? p.videos : [],
        rating: p.rating ? parseFloat(p.rating) : 5.0,
        review_count: p.review_count || 10,
        tags: [],
        created_at: p.created_at || new Date().toISOString(),
      };
    });

    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem('ba_products', JSON.stringify(products));
      window.dispatchEvent(new CustomEvent('ba_products_updated', { detail: products }));
    }

    return products;
  } catch (err) {
    console.warn('Failed to fetch products from Supabase:', err);
    return mockDb.getProducts();
  }
}

/**
 * Fetches categories from Supabase PostgreSQL database
 */
export async function fetchSupabaseCategories(): Promise<Category[]> {
  if (!isSupabaseConfigured || !supabase) {
    return mockDb.getCategories();
  }

  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('display_order', { ascending: true });

    if (error || !data || data.length === 0) {
      return mockDb.getCategories();
    }

    const categories: Category[] = data.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description || '',
      image_url: c.image_url || '',
      banner_url: c.banner_url || undefined,
      parent_id: c.parent_id || null,
      display_order: c.display_order ?? 1,
      is_active: c.is_active !== undefined ? Boolean(c.is_active) : true,
      is_featured: Boolean(c.is_featured),
    }));

    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem('ba_categories', JSON.stringify(categories));
      window.dispatchEvent(new CustomEvent('ba_categories_updated', { detail: categories }));
    }

    return categories;
  } catch (err) {
    console.warn('Failed to fetch categories from Supabase:', err);
    return mockDb.getCategories();
  }
}

/**
 * Fetches latest homepage sections from Supabase cloud database
 */
export async function fetchSupabaseHomepageSections(): Promise<HomepageSection[]> {
  if (!isSupabaseConfigured || !supabase) {
    return mockDb.getHomepageSections();
  }

  try {
    // 1. Try store_settings key: 'homepage_sections' (canonical JSON format)
    const { data: settingData, error: settingErr } = await supabase
      .from('store_settings')
      .select('value')
      .eq('key', 'homepage_sections')
      .maybeSingle();

    if (settingData && settingData.value && Array.isArray(settingData.value) && settingData.value.length > 0) {
      const sections = settingData.value as HomepageSection[];
      mockDb.updateHomepageSections(sections);
      return sections;
    }

    // 2. Fallback to homepage_sections table
    const { data: tableData } = await supabase
      .from('homepage_sections')
      .select('*')
      .order('display_order', { ascending: true });

    if (tableData && tableData.length > 0) {
      const mapped: HomepageSection[] = tableData.map(r => ({
        id: r.id,
        type: r.section_type,
        title: r.title,
        subtitle: r.subtitle || undefined,
        is_active: r.is_active,
        display_order: r.display_order,
        config: r.config_json || {},
      }));
      mockDb.updateHomepageSections(mapped);
      return mapped;
    }
  } catch (err) {
    console.warn('Failed to fetch homepage sections from Supabase:', err);
  }

  return mockDb.getHomepageSections();
}

/**
 * Persists homepage sections to Supabase cloud database (both store_settings and homepage_sections table)
 */
export async function syncHomepageSectionsToSupabase(sections: HomepageSection[]): Promise<boolean> {
  // Always update mockDb first for instant UI response
  mockDb.updateHomepageSections(sections);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('ba_homepage_updated', { detail: sections }));
  }

  if (!isSupabaseConfigured || !supabase) return true;

  try {
    const now = new Date().toISOString();

    // 1. Save canonical array to store_settings
    const { error: settingError } = await supabase
      .from('store_settings')
      .upsert({
        key: 'homepage_sections',
        value: sections,
        description: 'Global dynamic homepage sections layout and configs',
        updated_at: now,
      }, { onConflict: 'key' });

    if (settingError) {
      console.warn('Supabase store_settings.homepage_sections error:', settingError.message);
    }

    // 2. Also sync rows to homepage_sections table
    for (const s of sections) {
      await supabase
        .from('homepage_sections')
        .upsert({
          id: s.id,
          section_type: s.type,
          title: s.title,
          subtitle: s.subtitle || '',
          config_json: s.config || {},
          display_order: s.display_order,
          is_active: s.is_active,
        }, { onConflict: 'id' });
    }

    return true;
  } catch (err) {
    console.error('Failed to sync homepage sections to Supabase:', err);
    return false;
  }
}

/**
 * Fetches CMS pages from Supabase cloud database
 */
export async function fetchSupabaseCMSPages(): Promise<CMSPage[]> {
  if (!isSupabaseConfigured || !supabase) {
    return mockDb.getCMSPages();
  }

  try {
    // 1. Check store_settings key: 'cms_pages'
    const { data: settingData } = await supabase
      .from('store_settings')
      .select('value')
      .eq('key', 'cms_pages')
      .maybeSingle();

    if (settingData && settingData.value && Array.isArray(settingData.value) && settingData.value.length > 0) {
      const pages = settingData.value as CMSPage[];
      for (const p of pages) {
        mockDb.saveCMSPage(p);
      }
      return pages;
    }

    // 2. Fallback to cms_pages table
    const { data: tableData } = await supabase
      .from('cms_pages')
      .select('*')
      .order('created_at', { ascending: true });

    if (tableData && tableData.length > 0) {
      const mapped: CMSPage[] = tableData.map(r => ({
        id: r.id,
        slug: r.slug,
        title: r.title,
        content_html: r.content_html,
        meta_title: r.meta_title || r.title,
        meta_description: r.meta_description || '',
        is_published: r.is_published,
        updated_at: r.updated_at || r.created_at || new Date().toISOString(),
      }));
      for (const p of mapped) {
        mockDb.saveCMSPage(p);
      }
      return mapped;
    }
  } catch (err) {
    console.warn('Failed to fetch CMS pages from Supabase:', err);
  }

  return mockDb.getCMSPages();
}

/**
 * Persists a CMS page (create or update) to Supabase cloud database
 */
export async function syncCMSPageToSupabase(page: CMSPage): Promise<boolean> {
  // 1. Immediate local save
  mockDb.saveCMSPage(page);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('ba_cms_pages_updated', { detail: page }));
  }

  if (!isSupabaseConfigured || !supabase) return true;

  try {
    const now = new Date().toISOString();

    // 2. Save in cms_pages table
    const { error: pageErr } = await supabase
      .from('cms_pages')
      .upsert({
        id: page.id,
        slug: page.slug,
        title: page.title,
        content_html: page.content_html,
        meta_title: page.meta_title || page.title,
        meta_description: page.meta_description || '',
        is_published: page.is_published,
        updated_at: now,
      }, { onConflict: 'slug' });

    if (pageErr) {
      console.warn('Supabase cms_pages upsert error:', pageErr.message);
    }

    // 3. Keep store_settings.cms_pages array synchronized
    const allPages = mockDb.getCMSPages();
    await supabase
      .from('store_settings')
      .upsert({
        key: 'cms_pages',
        value: allPages,
        description: 'Published and draft CMS pages catalog',
        updated_at: now,
      }, { onConflict: 'key' });

    return true;
  } catch (err) {
    console.error('Failed to sync CMS page to Supabase:', err);
    return false;
  }
}

/**
 * Deletes a CMS page from Supabase cloud database
 */
export async function deleteSupabaseCMSPage(pageId: string, slug?: string): Promise<boolean> {
  mockDb.deleteCMSPage(pageId);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('ba_cms_pages_updated'));
  }

  if (!isSupabaseConfigured || !supabase) return true;

  try {
    // Delete from cms_pages table
    if (slug) {
      await supabase.from('cms_pages').delete().eq('slug', slug);
    }
    await supabase.from('cms_pages').delete().eq('id', pageId);

    // Update store_settings.cms_pages
    const allPages = mockDb.getCMSPages();
    await supabase
      .from('store_settings')
      .upsert({
        key: 'cms_pages',
        value: allPages,
        description: 'Published and draft CMS pages catalog',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'key' });

    return true;
  } catch (err) {
    console.error('Failed to delete CMS page from Supabase:', err);
    return false;
  }
}

/**
 * Syncs announcement bar and promotional banner settings to Supabase
 */
export async function syncAnnouncementToSupabase(announcement: {
  announcement_text: string;
  announcement_code?: string;
  announcement_active: boolean;
  announcement_link?: string;
}): Promise<boolean> {
  const updated = mockDb.updateStoreSettings(announcement);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('ba_storesettings_updated', { detail: updated }));
  }

  if (!isSupabaseConfigured || !supabase) return true;

  try {
    const now = new Date().toISOString();
    // Retrieve existing shipping_settings in Supabase
    const { data: shipData } = await supabase
      .from('store_settings')
      .select('value')
      .eq('key', 'shipping_settings')
      .maybeSingle();

    const existingShipping = shipData?.value || {};
    const mergedShipping = {
      ...existingShipping,
      announcement_text: announcement.announcement_text,
      announcement_code: announcement.announcement_code || '',
      announcement_active: announcement.announcement_active,
      announcement_link: announcement.announcement_link || '',
    };

    await supabase
      .from('store_settings')
      .upsert({
        key: 'shipping_settings',
        value: mergedShipping,
        description: 'Logistics rules, freight charges, and top announcement message',
        updated_at: now,
      }, { onConflict: 'key' });

    return true;
  } catch (err) {
    console.error('Failed to sync announcement to Supabase:', err);
    return false;
  }
}

/**
 * Helper to check if a string is a valid UUID
 */
function isUuid(str: string | undefined | null): boolean {
  if (!str) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
}

/**
 * Syncs a newly created order, its items, and its payment proof to Supabase PostgreSQL database
 */
export async function syncOrderToSupabase(order: Order): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return true;

  try {
    const validUserId = isUuid(order.user_id) ? order.user_id : null;

    // 1. Insert order into Supabase orders table
    const { data: insertedOrder, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: order.order_number,
        user_id: validUserId,
        customer_name: order.customer_name,
        customer_email: order.customer_email,
        customer_phone: order.customer_phone,
        shipping_address: order.shipping_address,
        subtotal: order.subtotal,
        delivery_fee: order.delivery_fee,
        packing_charge: order.packing_charge,
        discount_amount: order.discount_amount,
        coupon_code: order.coupon_code || null,
        total_amount: order.total_amount,
        payment_status: order.payment_status,
        fulfillment_status: order.fulfillment_status,
        notes: order.notes || null,
        created_at: order.created_at,
        updated_at: order.updated_at,
      })
      .select('id')
      .single();

    if (orderError || !insertedOrder) {
      console.warn('Supabase order insert notice:', orderError?.message);
      return false;
    }

    const orderId = insertedOrder.id;

    // 2. Insert order items
    if (order.items && order.items.length > 0) {
      const itemsPayload = order.items.map(item => ({
        order_id: orderId,
        product_id: isUuid(item.product_id) ? item.product_id : null,
        product_name: item.product_name,
        product_sku: item.product_sku || '',
        product_image: item.product_image || '',
        unit_price: item.unit_price,
        quantity: item.quantity,
        total_price: item.total_price,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(itemsPayload);

      if (itemsError) {
        console.warn('Supabase order_items insert notice:', itemsError.message);
      }
    }

    // 3. Insert payment record
    if (order.payment_details) {
      const paymentPayload = {
        order_id: orderId,
        payment_method: order.payment_details.method,
        upi_reference: order.payment_details.upi_reference || null,
        proof_image_url: order.payment_details.proof_image_url || null,
        amount: order.total_amount,
        status: order.payment_status,
        submitted_at: order.payment_details.submitted_at || order.created_at,
      };

      const { error: payError } = await supabase
        .from('payments')
        .insert(paymentPayload);

      if (payError) {
        console.warn('Supabase payments insert notice:', payError.message);
      }
    }

    return true;
  } catch (err) {
    console.error('Failed to sync order to Supabase:', err);
    return false;
  }
}

/**
 * Fetches all orders from Supabase PostgreSQL database, joins order_items and payments,
 * and merges with local mockDb orders to ensure seamless cross-device synchronization.
 */
export async function fetchOrdersFromSupabase(): Promise<Order[]> {
  const localOrders = mockDb.getOrders();
  if (!isSupabaseConfigured || !supabase) return localOrders;

  try {
    const { data: supaOrders, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (*),
        payments (*)
      `)
      .order('created_at', { ascending: false });

    if (error || !supaOrders) {
      console.warn('Supabase fetch orders notice:', error?.message);
      return localOrders;
    }

    // Map Supabase rows to our Order interface
    const mappedSupaOrders: Order[] = supaOrders.map((row: any) => {
      const payment = Array.isArray(row.payments) && row.payments.length > 0 ? row.payments[0] : undefined;
      const items = Array.isArray(row.order_items) ? row.order_items.map((i: any) => ({
        id: i.id,
        product_id: i.product_id,
        product_name: i.product_name,
        product_sku: i.product_sku || '',
        product_image: i.product_image || '',
        unit_price: Number(i.unit_price),
        quantity: Number(i.quantity),
        total_price: Number(i.total_price),
      })) : [];

      return {
        id: row.id,
        order_number: row.order_number,
        user_id: row.user_id || 'usr-customer',
        customer_name: row.customer_name,
        customer_email: row.customer_email,
        customer_phone: row.customer_phone,
        shipping_address: row.shipping_address,
        items,
        subtotal: Number(row.subtotal),
        delivery_fee: Number(row.delivery_fee),
        packing_charge: Number(row.packing_charge || 0),
        discount_amount: Number(row.discount_amount || 0),
        coupon_code: row.coupon_code || undefined,
        total_amount: Number(row.total_amount),
        payment_status: row.payment_status as PaymentStatus,
        fulfillment_status: row.fulfillment_status as any,
        payment_details: payment ? {
          method: payment.payment_method || 'upi',
          upi_reference: payment.upi_reference,
          proof_image_url: payment.proof_image_url,
          submitted_at: payment.submitted_at || row.created_at,
          verified_at: payment.verified_at,
          verified_by: payment.verified_by,
          rejection_reason: payment.rejection_reason,
        } : undefined,
        notes: row.notes || undefined,
        created_at: row.created_at,
        updated_at: row.updated_at,
      };
    });

    // Merge Supabase orders with local mock orders (avoid duplicates by order_number)
    const orderMap = new Map<string, Order>();
    // First populate local orders
    localOrders.forEach(o => orderMap.set(o.order_number, o));
    // Overwrite with authoritative cloud orders
    mappedSupaOrders.forEach(o => orderMap.set(o.order_number, o));

    const merged = Array.from(orderMap.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    // Save merged list into localStorage cache so local views have latest data
    try {
      localStorage.setItem('ba_orders', JSON.stringify(merged));
    } catch {
      // ignore
    }

    return merged;
  } catch (err) {
    console.error('Error fetching orders from Supabase:', err);
    return localOrders;
  }
}

/**
 * Updates order payment status in Supabase
 */
export async function updateSupabaseOrderPayment(
  orderNumber: string,
  paymentStatus: PaymentStatus,
  details?: {
    rejection_reason?: string;
    verified_by?: string;
  }
): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return true;

  try {
    const now = new Date().toISOString();
    const { data: updatedOrders } = await supabase
      .from('orders')
      .update({
        payment_status: paymentStatus,
        fulfillment_status: paymentStatus === 'verified' ? 'processing' : undefined,
        updated_at: now,
      })
      .eq('order_number', orderNumber)
      .select('id');

    if (updatedOrders && updatedOrders.length > 0) {
      const orderId = updatedOrders[0].id;
      await supabase
        .from('payments')
        .update({
          status: paymentStatus,
          rejection_reason: details?.rejection_reason || null,
          verified_at: paymentStatus === 'verified' ? now : null,
          verified_by: details?.verified_by || null,
        })
        .eq('order_id', orderId);
    }

    return true;
  } catch (err) {
    console.error('Failed to update order payment in Supabase:', err);
    return false;
  }
}

/**
 * Updates order shipment status and tracking in Supabase
 */
export async function updateSupabaseOrderShipment(
  orderNumber: string,
  courierName: string,
  trackingNumber: string,
  trackingUrl: string,
  notes?: string
): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return true;

  try {
    const now = new Date().toISOString();
    await supabase
      .from('orders')
      .update({
        fulfillment_status: 'shipped',
        notes: notes || `Shipped via ${courierName} (AWB: ${trackingNumber})`,
        updated_at: now,
      })
      .eq('order_number', orderNumber);

    return true;
  } catch (err) {
    console.error('Failed to update order shipment in Supabase:', err);
    return false;
  }
}

/**
 * Fetches all users from Supabase public.profiles, merging with local storage
 */
export async function fetchSupabaseUsers(): Promise<StoredUser[]> {
  const localUsers = mockDb.getUsers();
  if (!isSupabaseConfigured || !supabase) {
    return localUsers;
  }

  try {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !profiles) {
      console.warn('Supabase fetch profiles notice:', error?.message);
      return localUsers;
    }

    const userMap = new Map<string, StoredUser>();
    localUsers.forEach(u => userMap.set(u.email.toLowerCase(), u));

    profiles.forEach(p => {
      const email = p.email ? p.email.toLowerCase() : '';
      if (!email) return;

      const existing = userMap.get(email);
      userMap.set(email, {
        id: p.id,
        email: email,
        full_name: p.full_name || email.split('@')[0],
        phone: p.phone || existing?.phone || '+91 99999 00000',
        role: (p.role as UserRole) || 'customer',
        password_hash: existing?.password_hash,
        created_at: p.created_at || existing?.created_at || new Date().toISOString(),
      });
    });

    const merged = Array.from(userMap.values());
    try {
      localStorage.setItem('ba_users', JSON.stringify(merged));
    } catch {
      // ignore
    }
    return merged;
  } catch (err) {
    console.error('Error fetching users from Supabase:', err);
    return localUsers;
  }
}

/**
 * Updates a user's role in Supabase public.profiles
 */
export async function updateSupabaseUserRole(userId: string, newRole: UserRole): Promise<boolean> {
  // Update locally first
  mockDb.updateUser(userId, { role: newRole });

  if (!isSupabaseConfigured || !supabase) return true;

  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        role: newRole,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) {
      console.warn('Failed to update user role in Supabase:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Error updating user role in Supabase:', err);
    return false;
  }
}

/**
 * Upserts a user profile in Supabase
 */
export async function saveSupabaseUser(user: Partial<StoredUser> & { email: string; full_name: string; role: UserRole }): Promise<StoredUser> {
  const savedLocal = mockDb.saveUser(user);

  if (!isSupabaseConfigured || !supabase) return savedLocal;

  try {
    await supabase
      .from('profiles')
      .upsert({
        id: savedLocal.id,
        email: savedLocal.email,
        full_name: savedLocal.full_name,
        phone: savedLocal.phone || null,
        role: savedLocal.role,
        updated_at: new Date().toISOString(),
      });
  } catch (err) {
    console.warn('Error syncing user profile to Supabase:', err);
  }

  return savedLocal;
}

/**
 * Deletes a user profile in Supabase
 */
export async function deleteSupabaseUser(userId: string): Promise<boolean> {
  mockDb.deleteUser(userId);

  if (!isSupabaseConfigured || !supabase) return true;

  try {
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (error) {
      console.warn('Failed to delete user profile from Supabase:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Error deleting user profile from Supabase:', err);
    return false;
  }
}

/**
 * Fetches all coupons from Supabase PostgreSQL, merging with local storage
 */
export async function fetchSupabaseCoupons(): Promise<Coupon[]> {
  const localCoupons = mockDb.getCoupons();
  if (!isSupabaseConfigured || !supabase) {
    return localCoupons;
  }

  try {
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) {
      console.warn('Supabase fetch coupons notice:', error?.message);
      return localCoupons;
    }

    const couponMap = new Map<string, Coupon>();
    // Seed with local coupons
    localCoupons.forEach(c => couponMap.set(c.code.toUpperCase(), c));

    // Overwrite/merge with live DB records
    data.forEach((row: any) => {
      const code = (row.code || '').trim().toUpperCase();
      if (!code) return;

      couponMap.set(code, {
        id: row.id,
        code: code,
        description: row.description || '',
        discount_type: row.discount_type === 'fixed' ? 'fixed' : 'percentage',
        discount_value: Number(row.discount_value) || 0,
        min_order_amount: Number(row.min_order_amount) || 0,
        max_discount: row.max_discount != null ? Number(row.max_discount) : undefined,
        usage_limit: row.usage_limit != null ? Number(row.usage_limit) : null,
        times_used: Number(row.times_used) || 0,
        expires_at: row.expires_at || null,
        is_active: Boolean(row.is_active),
        created_at: row.created_at || new Date().toISOString(),
      });
    });

    const merged = Array.from(couponMap.values());
    try {
      localStorage.setItem('ba_coupons', JSON.stringify(merged));
    } catch {
      // ignore
    }
    return merged;
  } catch (err) {
    console.error('Error fetching coupons from Supabase:', err);
    return localCoupons;
  }
}

/**
 * Saves or updates a coupon in local database and syncs to Supabase
 */
export async function saveSupabaseCoupon(coupon: Partial<Coupon> & { code: string; discount_type: 'percentage' | 'fixed'; discount_value: number }): Promise<Coupon> {
  const isUuid = coupon.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(coupon.id);
  const validId = isUuid ? coupon.id : (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : undefined);

  const localSaved = mockDb.saveCoupon({
    ...coupon,
    ...(validId ? { id: validId } : {}),
  });

  if (!isSupabaseConfigured || !supabase) {
    return localSaved;
  }

  try {
    const payload: any = {
      code: localSaved.code.toUpperCase(),
      description: localSaved.description,
      discount_type: localSaved.discount_type,
      discount_value: localSaved.discount_value,
      min_order_amount: localSaved.min_order_amount,
      max_discount: localSaved.max_discount ?? null,
      usage_limit: localSaved.usage_limit ?? null,
      times_used: localSaved.times_used ?? 0,
      expires_at: localSaved.expires_at ?? null,
      is_active: localSaved.is_active,
    };

    if (validId) {
      payload.id = validId;
    }

    const { data, error } = await supabase
      .from('coupons')
      .upsert(payload, { onConflict: 'code' })
      .select()
      .single();

    if (error) {
      console.warn('Supabase save coupon notice:', error.message);
    } else if (data) {
      localSaved.id = data.id;
      mockDb.saveCoupon(localSaved);
    }
  } catch (err) {
    console.warn('Error syncing coupon to Supabase:', err);
  }

  return localSaved;
}

/**
 * Deletes a coupon from Supabase and local storage
 */
export async function deleteSupabaseCoupon(couponIdOrCode: string): Promise<boolean> {
  mockDb.deleteCoupon(couponIdOrCode);

  if (!isSupabaseConfigured || !supabase) {
    return true;
  }

  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(couponIdOrCode);
    const query = supabase.from('coupons').delete();
    const { error } = isUuid 
      ? await query.eq('id', couponIdOrCode)
      : await query.eq('code', couponIdOrCode.toUpperCase());

    if (error) {
      console.warn('Supabase delete coupon notice:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Error deleting coupon from Supabase:', err);
    return false;
  }
}

/**
 * Toggles coupon active status in local store and Supabase
 */
export async function toggleSupabaseCouponStatus(couponIdOrCode: string, isActive: boolean): Promise<boolean> {
  mockDb.toggleCouponStatus(couponIdOrCode, isActive);

  if (!isSupabaseConfigured || !supabase) {
    return true;
  }

  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(couponIdOrCode);
    const query = supabase.from('coupons').update({ is_active: isActive });
    const { error } = isUuid 
      ? await query.eq('id', couponIdOrCode)
      : await query.eq('code', couponIdOrCode.toUpperCase());

    if (error) {
      console.warn('Supabase toggle coupon status notice:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Error toggling coupon status in Supabase:', err);
    return false;
  }
}

/**
 * Increments coupon usage count after order is confirmed
 */
export async function incrementSupabaseCouponUsage(code: string): Promise<void> {
  const cleanCode = code.trim().toUpperCase();
  mockDb.incrementCouponUsage(cleanCode);

  if (!isSupabaseConfigured || !supabase) {
    return;
  }

  try {
    const { data: existing } = await supabase
      .from('coupons')
      .select('times_used')
      .eq('code', cleanCode)
      .single();

    if (existing) {
      await supabase
        .from('coupons')
        .update({ times_used: (existing.times_used || 0) + 1 })
        .eq('code', cleanCode);
    }
  } catch (err) {
    console.warn('Error incrementing coupon usage in Supabase:', err);
  }
}

