const { Client } = require('pg');
const crypto = require('crypto');

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:raguppies00rishan123@db.mprdfatnknkjohddlaza.supabase.co:5432/postgres';

// Deterministic UUID helper so IDs match across environments
function toUUID(str) {
  const hash = crypto.createHash('md5').update(str).digest('hex');
  return [
    hash.substring(0, 8),
    hash.substring(8, 12),
    '4' + hash.substring(13, 16),
    '8' + hash.substring(17, 20),
    hash.substring(20, 32)
  ].join('-');
}

async function seed() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to Supabase PostgreSQL database for comprehensive seeding...');

    // 1. STORE SETTINGS & BRANDING
    console.log('Seeding store_settings...');
    const storeSettings = [
      {
        key: 'brand_info',
        value: {
          brand_name: 'Ra Guppy',
          tagline: 'Pure Strain Guppies, Guppys & Ornamental Fish Sanctuary',
          contact_email: 'care@raguppy.in',
          contact_phone: '+91 98765 43210',
          whatsapp_number: '919876543210'
        },
        description: 'Primary store identity and customer support contact details'
      },
      {
        key: 'payment_settings',
        value: {
          upi_id: 'raguppy@icici',
          upi_payee_name: 'Ra Guppy Aquatics',
          bank_name: 'ICICI Bank',
          bank_account_no: '002405009988',
          bank_ifsc: 'ICIC0000024',
          bank_account_holder: 'Ra Guppy Aquatics'
        },
        description: 'Payment collection credentials for direct UPI intent and bank transfer verification'
      },
      {
        key: 'shipping_settings',
        value: {
          courier_partner: 'The Professional Couriers',
          transport_mode: 'Surface Road Courier',
          service_country: 'India',
          kerala_rate: 80,
          tamilnadu_karnataka_rate: 120,
          other_states_rate: 200,
          bulk_threshold_pairs: 10,
          bulk_multiplier: 2,
          standard_shipping_rate: 80,
          live_packing_charge: 0,
          announcement_text: '🚚 Express Road Courier by The Professional Couriers across India! Safe Live Arrival Guarantee.',
          announcement_code: 'AQUA10',
          announcement_active: true,
          announcement_link: '/shop',
          maintenance_mode: false
        },
        description: 'Logistics rules, The Professional Couriers road shipping rates, and promotional ribbon'
      },
      {
        key: 'branding',
        value: {
          logo_url: '/logo.jpeg',
          mobile_logo_url: '/logo.jpeg',
          footer_logo_url: '/logo.jpeg',
          favicon_url: '/favicon.svg',
          site_name: 'Ra Guppy',
          tagline: 'Pure Strain Guppies, Guppys & Ornamental Fish Sanctuary',
          primary_color: '#1e3a8a',
          secondary_color: '#dc2626',
          accent_color: '#0284c7',
          background_color: '#f8fafc',
          text_color: '#0f172a',
          primary_text_color: '#ffffff',
          secondary_text_color: '#ffffff',
          version: 1
        },
        description: 'Dynamic visual branding, logo URLs, and WCAG-compliant CSS theme tokens'
      }
    ];

    for (const s of storeSettings) {
      await client.query(`
        INSERT INTO public.store_settings (key, value, description, updated_at)
        VALUES ($1, $2, $3, now())
        ON CONFLICT (key) DO UPDATE 
        SET value = EXCLUDED.value, description = EXCLUDED.description, updated_at = now();
      `, [s.key, JSON.stringify(s.value), s.description]);
    }
    console.log('✓ store_settings seeded successfully.');

    // 2. CATEGORIES
    console.log('Seeding categories...');
    const categories = [
      { id: toUUID('cat-guppy'), name: 'Guppy Fish', slug: 'guppy-fish', description: 'Pure strain Guppies, exotic breeding pairs, and planted aquascaping flora.', image_url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=600&q=80', banner_url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1200&q=80', parent_id: null, display_order: 1, is_featured: true },
      { id: toUUID('cat-sub-halfmoon'), name: 'Halfmoon Guppys', slug: 'halfmoon-Guppys', description: '180-degree caudal spread show-class specimen males and females.', image_url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=600&q=80', parent_id: toUUID('cat-guppy'), display_order: 1 },
      { id: toUUID('cat-sub-crowntail'), name: 'Crowntail Guppys', slug: 'crowntail-Guppys', description: 'Dramatic ray web reductions creating crown-like finnage.', image_url: 'https://images.unsplash.com/photo-1534043464124-3be32fe000c9?auto=format&fit=crop&w=600&q=80', parent_id: toUUID('cat-guppy'), display_order: 2 },
      { id: toUUID('cat-sub-plakat'), name: 'Plakat & Fighter Guppys', slug: 'plakat-Guppys', description: 'Short-finned, muscular traditional and modern HMPK fighters.', image_url: 'https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?auto=format&fit=crop&w=600&q=80', parent_id: toUUID('cat-guppy'), display_order: 3 },
      { id: toUUID('cat-guppy'), name: 'Guppies & Livebearers', slug: 'guppies', description: 'Pure strain Albino Full Red, Dumbo Ear Mosaic, Green Tail, and Blue Dragon imported guppy pairs.', image_url: 'https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?auto=format&fit=crop&w=600&q=80', banner_url: 'https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?auto=format&fit=crop&w=1200&q=80', parent_id: null, display_order: 2, is_featured: true },
      { id: toUUID('cat-pairs'), name: 'Breeding Pairs & Rare Strains', slug: 'breeding-pairs', description: 'Carefully conditioned, proven fertile breeding pairs with lineage certificates.', image_url: 'https://images.unsplash.com/photo-1534043464124-3be32fe000c9?auto=format&fit=crop&w=600&q=80', parent_id: null, display_order: 3, is_featured: false },
      { id: toUUID('cat-plants'), name: 'Aquatic Plants', slug: 'aquatic-plants', description: 'Lush tissue-culture, stem, and driftwood-anchored planted aquarium plants.', image_url: 'https://images.unsplash.com/photo-1520302630591-fd1c66edc19d?auto=format&fit=crop&w=600&q=80', parent_id: null, display_order: 4 },
      { id: toUUID('cat-food'), name: 'Fish Food & Nutrition', slug: 'fish-food', description: 'High-protein micro pellets, freeze-dried bloodworms, and color-enhancing spirulina feeds.', image_url: 'https://images.unsplash.com/photo-1516684732162-798a0062be99?auto=format&fit=crop&w=600&q=80', parent_id: null, display_order: 5 },
      { id: toUUID('cat-accessories'), name: 'Aquarium Accessories', slug: 'accessories', description: 'Gentle sponge filters, Guppy leaf hammocks, Indian almond leaves, and water conditioners.', image_url: 'https://images.unsplash.com/photo-1544943910-4c1dc44a0558?auto=format&fit=crop&w=600&q=80', parent_id: null, display_order: 6 }
    ];

    for (const c of categories) {
      await client.query(`
        INSERT INTO public.categories (id, name, slug, description, image_url, banner_url, parent_id, display_order, is_active, is_featured)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, $9)
        ON CONFLICT (id) DO UPDATE 
        SET name = EXCLUDED.name, slug = EXCLUDED.slug, description = EXCLUDED.description, 
            image_url = EXCLUDED.image_url, banner_url = EXCLUDED.banner_url, parent_id = EXCLUDED.parent_id,
            display_order = EXCLUDED.display_order, is_featured = EXCLUDED.is_featured;
      `, [c.id, c.name, c.slug, c.description, c.image_url, c.banner_url || null, c.parent_id || null, c.display_order, c.is_featured || false]);
    }
    console.log(`✓ ${categories.length} categories seeded successfully.`);

    // 3. PRODUCTS & FISH SPECIMENS
    console.log('Seeding products & swimming video attachments...');
    const products = [
      {
        id: toUUID('prod-001'),
        name: 'Royal Blue Halfmoon Guppy (Show Class Male)',
        slug: 'electric-blue-guppy-pair',
        sku: 'BA-HM-001',
        description: 'A breathtaking show-quality Royal Blue Halfmoon Guppy with a complete 180-degree caudal spread. Hand-selected from top breeder tanks in Thailand, this specimen features iridescent royal blue scales transitioning into metallic cyan edges. Active, healthy, and flare-trained.',
        short_description: 'Pure Royal Blue iridescent show specimen with 180° caudal spread.',
        price: 1499,
        compare_at_price: 1899,
        category_id: toUUID('cat-guppy'),
        subcategory_id: toUUID('cat-sub-halfmoon'),
        stock_quantity: 1,
        is_unique_specimen: true,
        is_featured: true,
        strain: 'Halfmoon',
        gender: 'Male',
        size: '4.2 cm (Body)',
        care_level: 'Moderate',
        images: [
          'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1534043464124-3be32fe000c9?auto=format&fit=crop&w=800&q=80'
        ],
        videos: [
          { id: 'vid-prod-001', url: 'https://assets.mixkit.co/videos/preview/mixkit-bright-red-guppy-fish-swimming-41712-large.mp4', thumbnail_url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80', title: 'Active Swimming & Flare Demonstration', duration: 14, mime_type: 'video/mp4' }
        ]
      },
      {
        id: toUUID('prod-005'),
        name: 'Albino Full Red Guppy (Proven Breeding Pair)',
        slug: 'albino-full-red-guppy-breeding-pair',
        sku: 'BA-GP-005',
        description: 'Grade-A imported Albino Full Red (AFR) Guppy Pair. The male features a fiery red delta dorsal and delta tail with pink ruby eyes; the female is pre-conditioned and ready for gentle breeding in soft planted tanks.',
        short_description: '1 Male + 1 Female pure strain Albino Full Red breeding pair.',
        price: 1199,
        compare_at_price: 1499,
        category_id: toUUID('cat-guppy'),
        subcategory_id: null,
        stock_quantity: 8,
        is_unique_specimen: false,
        is_featured: true,
        strain: 'Albino Full Red',
        gender: 'Breeding Pair',
        size: '3.0 - 4.5 cm',
        care_level: 'Easy',
        images: ['https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?auto=format&fit=crop&w=800&q=80'],
        videos: [
          { id: 'vid-prod-014', url: '/videos/guppy-pair-120.mp4', thumbnail_url: 'https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?auto=format&fit=crop&w=800&q=80', title: 'AFR Guppy Pair Swimming Video', duration: 12, mime_type: 'video/mp4' }
        ]
      },
      {
        id: toUUID('prod-010'),
        name: 'Vibrant Fighter Guppy (Healthy Active Male)',
        slug: 'guppy-male-100',
        sku: 'RG-BT-100',
        description: 'High-vigor, healthy active fighter Guppy male. Acclimated and conditioned in our facility with crisp fins and striking coloration.',
        short_description: 'Vibrant active male fighter Guppy conditioned for tropical nano aquariums.',
        price: 100,
        compare_at_price: 150,
        category_id: toUUID('cat-guppy'),
        subcategory_id: toUUID('cat-sub-plakat'),
        stock_quantity: 12,
        is_unique_specimen: false,
        is_featured: true,
        strain: 'Plakat Fighter',
        gender: 'Male',
        size: '3.5 - 4.0 cm',
        care_level: 'Easy',
        images: ['https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80'],
        videos: [
          { id: 'vid-prod-010', url: '/videos/guppy-pair-120.mp4', thumbnail_url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80', title: 'Active Male Guppy Swimming Video', duration: 15, mime_type: 'video/mp4' }
        ]
      },
      {
        id: toUUID('prod-011'),
        name: 'Selected Crown & Plakat Guppy (Hand-Picked)',
        slug: 'selected-crown-guppy-250',
        sku: 'RG-BT-250',
        description: 'Carefully hand-picked hybrid Crown & Plakat Guppy male exhibiting distinctive fin serration and lively territorial flaring behavior.',
        short_description: 'Selected Crown/Plakat cross Guppy with vibrant coloration.',
        price: 250,
        compare_at_price: 350,
        category_id: toUUID('cat-guppy'),
        subcategory_id: toUUID('cat-sub-crowntail'),
        stock_quantity: 6,
        is_unique_specimen: false,
        is_featured: true,
        strain: 'Crown Plakat Cross',
        gender: 'Male',
        size: '4.0 cm',
        care_level: 'Moderate',
        images: ['https://images.unsplash.com/photo-1534043464124-3be32fe000c9?auto=format&fit=crop&w=800&q=80'],
        videos: [
          { id: 'vid-prod-011', url: '/videos/guppy-120.mp4', thumbnail_url: 'https://images.unsplash.com/photo-1534043464124-3be32fe000c9?auto=format&fit=crop&w=800&q=80', title: 'Selected Crown Guppy Swimming Video', duration: 12, mime_type: 'video/mp4' }
        ]
      },
      {
        id: toUUID('prod-012'),
        name: 'Exotic Show Halfmoon Guppy Specimen',
        slug: 'exotic-show-guppy-350',
        sku: 'RG-BT-350',
        description: 'Stunning exhibition-grade Halfmoon Guppy featuring high caudal spread, wide dorsal fin, and deep metallic iridescence.',
        short_description: 'Show-class Halfmoon Guppy with expansive 180° caudal spread.',
        price: 350,
        compare_at_price: 500,
        category_id: toUUID('cat-guppy'),
        subcategory_id: toUUID('cat-sub-halfmoon'),
        stock_quantity: 4,
        is_unique_specimen: true,
        is_featured: true,
        strain: 'Halfmoon',
        gender: 'Male',
        size: '4.5 cm',
        care_level: 'Moderate',
        images: ['https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?auto=format&fit=crop&w=800&q=80'],
        videos: [
          { id: 'vid-prod-012', url: '/videos/guppy-150.mp4', thumbnail_url: 'https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?auto=format&fit=crop&w=800&q=80', title: 'Show Halfmoon Flaring Demonstration', duration: 18, mime_type: 'video/mp4' }
        ]
      },
      {
        id: toUUID('prod-013'),
        name: 'Green Tail Pure Strain Guppy',
        slug: 'green-tail-pure-strain-guppy-100',
        sku: 'RG-GP-100',
        description: 'Pure-strain Green Tail Guppy with radiant emerald metallic sheen on the caudal fin and active schooling behavior in planted tanks.',
        short_description: 'Pure strain Green Tail Guppy with radiant emerald coloration.',
        price: 100,
        compare_at_price: 140,
        category_id: toUUID('cat-guppy'),
        subcategory_id: null,
        stock_quantity: 20,
        is_unique_specimen: false,
        is_featured: true,
        strain: 'Green Tail Delta',
        gender: 'Male',
        size: '3.0 - 3.5 cm',
        care_level: 'Easy',
        images: ['https://images.unsplash.com/photo-1520302630591-fd1c66edc19d?auto=format&fit=crop&w=800&q=80'],
        videos: [
          { id: 'vid-prod-013', url: '/videos/green-tail-100.mp4', thumbnail_url: 'https://images.unsplash.com/photo-1520302630591-fd1c66edc19d?auto=format&fit=crop&w=800&q=80', title: 'Green Tail Guppy Active Swimming Video', duration: 10, mime_type: 'video/mp4' }
        ]
      },
      {
        id: toUUID('prod-014'),
        name: 'Active Guppy Breeding Pair (Proven 1M + 1F)',
        slug: 'active-guppy-breeding-pair-120',
        sku: 'RG-GP-120P',
        description: 'Conditioned and fertile guppy breeding pair (1 male + 1 female) displaying high vitality, vibrant tail patterns, and rapid acclimation to tap water.',
        short_description: 'Proven 1 Male + 1 Female fertile guppy breeding pair.',
        price: 120,
        compare_at_price: 180,
        category_id: toUUID('cat-guppy'),
        subcategory_id: null,
        stock_quantity: 15,
        is_unique_specimen: false,
        is_featured: true,
        strain: 'Selected Domestic Strain',
        gender: 'Breeding Pair',
        size: '3.2 - 4.5 cm',
        care_level: 'Easy',
        images: ['https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?auto=format&fit=crop&w=800&q=80'],
        videos: [
          { id: 'vid-prod-014', url: '/videos/guppy-pair-120.mp4', thumbnail_url: 'https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?auto=format&fit=crop&w=800&q=80', title: 'Guppy Pair Swimming & Courtship Video', duration: 12, mime_type: 'video/mp4' }
        ]
      },
      {
        id: toUUID('prod-015'),
        name: 'Vibrant Delta Tail Guppy (Assorted Show Male)',
        slug: 'vibrant-delta-tail-guppy-120',
        sku: 'RG-GP-120',
        description: 'Wide delta tail guppy male showcasing energetic swimming patterns, saturated fin pigments, and healthy dorsal development.',
        short_description: 'Wide delta tail male guppy with saturated fin pigments.',
        price: 120,
        compare_at_price: 160,
        category_id: toUUID('cat-guppy'),
        subcategory_id: null,
        stock_quantity: 25,
        is_unique_specimen: false,
        is_featured: true,
        strain: 'Delta Tail',
        gender: 'Male',
        size: '3.5 cm',
        care_level: 'Easy',
        images: ['https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80'],
        videos: [
          { id: 'vid-prod-015', url: '/videos/guppy-120.mp4', thumbnail_url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80', title: 'Delta Tail Guppy Active Swimming Video', duration: 11, mime_type: 'video/mp4' }
        ]
      },
      {
        id: toUUID('prod-016'),
        name: 'Select Grade Exotic Guppy Male',
        slug: 'select-grade-exotic-guppy-150',
        sku: 'RG-GP-150',
        description: 'Premium select grade guppy male chosen for symmetry, deep fin contrast, and peaceful community tank temperament.',
        short_description: 'Select grade guppy male with premium fin symmetry.',
        price: 150,
        compare_at_price: 220,
        category_id: toUUID('cat-guppy'),
        subcategory_id: null,
        stock_quantity: 18,
        is_unique_specimen: false,
        is_featured: true,
        strain: 'Exotic Cross',
        gender: 'Male',
        size: '3.5 cm',
        care_level: 'Easy',
        images: ['https://images.unsplash.com/photo-1516684732162-798a0062be99?auto=format&fit=crop&w=800&q=80'],
        videos: [
          { id: 'vid-prod-016', url: '/videos/guppy-150.mp4', thumbnail_url: 'https://images.unsplash.com/photo-1516684732162-798a0062be99?auto=format&fit=crop&w=800&q=80', title: 'Select Grade Guppy Swimming Footage', duration: 10, mime_type: 'video/mp4' }
        ]
      },
      {
        id: toUUID('prod-017'),
        name: 'Hardy Mixed Strain Community Guppy',
        slug: 'hardy-mixed-strain-community-guppy-45',
        sku: 'RG-GP-045',
        description: 'Extremely hardy, community-friendly mixed strain guppy. Perfect for beginners and community planted tanks.',
        short_description: 'Affordable, hardy community guppy for beginner hobbyists.',
        price: 45,
        compare_at_price: 70,
        category_id: toUUID('cat-guppy'),
        subcategory_id: null,
        stock_quantity: 60,
        is_unique_specimen: false,
        is_featured: false,
        strain: 'Mixed Community Strain',
        gender: 'Unsexed',
        size: '2.5 - 3.5 cm',
        care_level: 'Easy',
        images: ['https://images.unsplash.com/photo-1579273166152-d725a4e2b755?auto=format&fit=crop&w=800&q=80'],
        videos: [
          { id: 'vid-prod-017', url: '/videos/guppy-45.mp4', thumbnail_url: 'https://images.unsplash.com/photo-1579273166152-d725a4e2b755?auto=format&fit=crop&w=800&q=80', title: 'Community Tank Guppy Active Swimming Video', duration: 13, mime_type: 'video/mp4' }
        ]
      },
      {
        id: toUUID('prod-018'),
        name: 'Collector Grade Champion Lineage Guppy Pair',
        slug: 'collector-grade-champion-lineage-guppy-pair-800',
        sku: 'RG-GP-800',
        description: 'Rare collector-grade imported champion bloodline guppy pair with enormous dorsal spread, pure color saturation, and verified pedigree lineage.',
        short_description: '1 Male + 1 Female rare collector-grade champion lineage pair.',
        price: 800,
        compare_at_price: 1200,
        category_id: toUUID('cat-guppy'),
        subcategory_id: null,
        stock_quantity: 3,
        is_unique_specimen: true,
        is_featured: true,
        strain: 'Champion Lineage Show Guppy',
        gender: 'Breeding Pair',
        size: '3.5 - 4.8 cm',
        care_level: 'Moderate',
        images: ['https://images.unsplash.com/photo-1534043464124-3be32fe000c9?auto=format&fit=crop&w=800&q=80'],
        videos: [
          { id: 'vid-prod-018', url: '/videos/guppy-800.mp4', thumbnail_url: 'https://images.unsplash.com/photo-1534043464124-3be32fe000c9?auto=format&fit=crop&w=800&q=80', title: 'Collector Champion Guppy Pair Swimming Video', duration: 25, mime_type: 'video/mp4' }
        ]
      },
      {
        id: toUUID('prod-019'),
        name: 'Zebra Danio Active Schooling Pack (5 Pairs / 10 Fish)',
        slug: 'zebra-danio-active-schooling-pack-150',
        sku: 'RG-ZB-150',
        description: 'Dynamic schooling pack of 10 Zebra Danios (5 pairs). Fast, lively upper-level swimmers with silver-blue horizontal racing stripes that bring non-stop movement to aquascapes.',
        short_description: 'Pack of 10 active schooling Zebra Danios with crisp racing stripes.',
        price: 150,
        compare_at_price: 250,
        category_id: toUUID('cat-guppy'),
        subcategory_id: null,
        stock_quantity: 25,
        is_unique_specimen: false,
        is_featured: true,
        strain: 'Zebra Danio (Brachydanio rerio)',
        gender: 'Unsexed',
        size: '3.0 - 4.0 cm',
        care_level: 'Easy',
        images: ['https://images.unsplash.com/photo-1544943910-4c1dc44a0558?auto=format&fit=crop&w=800&q=80'],
        videos: [
          { id: 'vid-prod-019', url: '/videos/zebra-5pair-150.mp4', thumbnail_url: 'https://images.unsplash.com/photo-1544943910-4c1dc44a0558?auto=format&fit=crop&w=800&q=80', title: 'Zebra Danio Schooling Pack Active Swimming Video', duration: 40, mime_type: 'video/mp4' }
        ]
      },
      {
        id: toUUID('prod-020'),
        name: 'Albino Full Red (AFR) Flower Dorsal Guppy (Breeding Pair)',
        slug: 'afr-flower-dorsal-guppy-pair-400',
        sku: 'RG-AFR-400',
        description: 'Exquisite Albino Full Red (AFR) with distinctive Flower Dorsal finnage. Vibrant crimson delta tail, high fertility, proven breeding pair conditioned for planted aquariums.',
        short_description: '1 Male + 1 Female pure strain AFR with Flower Dorsal.',
        price: 400,
        compare_at_price: 600,
        category_id: toUUID('cat-guppy'),
        subcategory_id: null,
        stock_quantity: 20,
        is_unique_specimen: false,
        is_featured: true,
        strain: 'Albino Full Red Flower Dorsal',
        gender: 'Breeding Pair',
        size: '3.5 - 4.5 cm',
        care_level: 'Easy',
        images: ['/product_image/afr-flower-dorsal-400.jpeg']
      },
      {
        id: toUUID('prod-021'),
        name: 'Electric Blue Guppy (Proven Breeding Pair)',
        slug: 'electric-blue-guppy-pair-300',
        sku: 'RG-EB-300',
        description: 'Striking metallic Electric Blue pure strain guppy pair with deep ocean blue coloration across dorsal and caudal fins. Active, healthy, and conditioned for soft to moderate tap water.',
        short_description: '1 Male + 1 Female pure strain Electric Blue breeding pair.',
        price: 300,
        compare_at_price: 450,
        category_id: toUUID('cat-guppy'),
        subcategory_id: null,
        stock_quantity: 10,
        is_unique_specimen: false,
        is_featured: true,
        strain: 'Electric Blue',
        gender: 'Breeding Pair',
        size: '3.2 - 4.2 cm',
        care_level: 'Easy',
        images: ['/product_image/electric-blue-300.jpeg']
      },
      {
        id: toUUID('prod-022'),
        name: 'Green Platinum Half Moon Dumbo Guppy (Breeding Pair)',
        slug: 'green-platinum-half-moon-dumbo-guppy-500',
        sku: 'RG-GPD-500',
        description: 'High-end show class Green Platinum Halfmoon with prominent oversized Dumbo (Big Ear) pectoral fins and wide 180° caudal spread. Rare bloodline bred in controlled conditions.',
        short_description: '1 Male + 1 Female rare Green Platinum Halfmoon Dumbo Ear pair.',
        price: 500,
        compare_at_price: 750,
        category_id: toUUID('cat-guppy'),
        subcategory_id: null,
        stock_quantity: 5,
        is_unique_specimen: true,
        is_featured: true,
        strain: 'Green Platinum Half Moon Dumbo',
        gender: 'Breeding Pair',
        size: '3.5 - 4.8 cm',
        care_level: 'Moderate',
        images: ['/product_image/green-platinum-dumbo-500.jpeg']
      },
      {
        id: toUUID('prod-023'),
        name: 'Purple Mosaic Half Moon Tail Guppy (Breeding Pair)',
        slug: 'purple-mosaic-half-moon-guppy-pair-400',
        sku: 'RG-PM-400',
        description: 'Rare Purple Half Moon Tail guppy pair with iridescent violet/purple hues and intricate mosaic tail patterning. Fertile, active, conditioned pair ready for nano planted tanks.',
        short_description: '1 Male + 1 Female rare Purple Halfmoon tail breeding pair.',
        price: 400,
        compare_at_price: 550,
        category_id: toUUID('cat-guppy'),
        subcategory_id: null,
        stock_quantity: 20,
        is_unique_specimen: false,
        is_featured: true,
        strain: 'Purple Half Moon Tail',
        gender: 'Breeding Pair',
        size: '3.5 - 4.5 cm',
        care_level: 'Easy',
        images: ['/product_image/purple-hm-tail-400.jpeg']
      },
      {
        id: toUUID('prod-024'),
        name: 'Tiger Half Moon Guppy (Proven Breeding Pair)',
        slug: 'tiger-half-moon-guppy-pair-300',
        sku: 'RG-THM-300',
        description: 'High-contrast Tiger patterned Halfmoon guppy pair with bold tiger stripes, vivid yellow-orange background, and wide delta caudal spread.',
        short_description: '1 Male + 1 Female high-contrast Tiger Halfmoon breeding pair.',
        price: 300,
        compare_at_price: 450,
        category_id: toUUID('cat-guppy'),
        subcategory_id: null,
        stock_quantity: 30,
        is_unique_specimen: false,
        is_featured: true,
        strain: 'Tiger Half Moon',
        gender: 'Breeding Pair',
        size: '3.2 - 4.5 cm',
        care_level: 'Easy',
        images: ['/product_image/tiger-halfmoon-300.jpeg']
      },
      {
        id: toUUID('prod-025'),
        name: 'Aquatic Duckweed (Lemna Minor) - Snail Free Floating Plant',
        slug: 'aquatic-duckweed-floating-plant-50',
        sku: 'RG-PL-DW50',
        description: 'Lush green natural floating duckweed portion. Excellent natural nitrate absorber, provides shelter for baby guppy fry, and creates natural shaded biotope lighting.',
        short_description: 'Portion of healthy floating duckweed for fry cover and nitrate reduction.',
        price: 50,
        compare_at_price: 80,
        category_id: toUUID('cat-plants'),
        subcategory_id: null,
        stock_quantity: 50,
        is_unique_specimen: false,
        is_featured: false,
        strain: 'Lemna Minor',
        care_level: 'Easy',
        images: ['/product_image/duckweed-50.jpeg']
      },
      {
        id: toUUID('prod-026'),
        name: 'Ficus Pumila (Creeping Fig) - Riparium & Terrarium Plant',
        slug: 'ficus-pumila-creeping-fig-200',
        sku: 'RG-PL-FP200',
        description: 'Hardy Ficus Pumila climbing vine plant suitable for open-top aquarium rim mounting, ripariums, paludariums, and vivariums. Sucks out waste nitrates and roots directly into water.',
        short_description: 'Healthy climbing vine portion for aquarium tops and paludariums.',
        price: 200,
        compare_at_price: 280,
        category_id: toUUID('cat-plants'),
        subcategory_id: null,
        stock_quantity: 20,
        is_unique_specimen: false,
        is_featured: false,
        strain: 'Creeping Fig',
        care_level: 'Easy',
        images: ['/product_image/ficus-pumila-200.jpeg']
      },
      {
        id: toUUID('prod-027'),
        name: 'Foxtail (Ceratophyllum Demersum) - Hornwort Stem Bundle',
        slug: 'foxtail-hornwort-plant-bundle-50',
        sku: 'RG-PL-FT50',
        description: 'Fast-growing, bushy Foxtail / Hornwort stems. Highly oxygenating submerged plant that prevents algae, requires zero CO2, and offers the best refuge for newborn fish fry.',
        short_description: 'Oxygenating, hardy foxtail stem bunch for fry shelter.',
        price: 50,
        compare_at_price: 80,
        category_id: toUUID('cat-plants'),
        subcategory_id: null,
        stock_quantity: 50,
        is_unique_specimen: false,
        is_featured: false,
        strain: 'Ceratophyllum Demersum',
        care_level: 'Easy',
        images: ['/product_image/foxtail-50.jpeg']
      },
      {
        id: toUUID('prod-028'),
        name: 'Guppy Grass (Najas Guadalupensis) - Natural Biotope Bunch',
        slug: 'guppy-grass-najas-guadalupensis-50',
        sku: 'RG-PL-GG50',
        description: 'The quintessential plant for guppy breeding tanks. Forms dense, lush emerald green underwater thickets that baby fry hide in safely. Rapid grower that thrives in any water condition.',
        short_description: 'Generous bunch of true Najas guppy grass for high fry survival.',
        price: 50,
        compare_at_price: 80,
        category_id: toUUID('cat-plants'),
        subcategory_id: null,
        stock_quantity: 50,
        is_unique_specimen: false,
        is_featured: true,
        strain: 'Najas Guadalupensis',
        care_level: 'Easy',
        images: ['/product_image/guppy-grass-50.jpeg']
      },
      {
        id: toUUID('prod-029'),
        name: 'Insecta Pro Premium Fish Nutrition (100g Pellets)',
        slug: 'insecta-pro-fish-food-100g-200',
        sku: 'RG-FD-IP200',
        description: 'Specially formulated high-protein feed made from premium black soldier fly larvae meal, spirulina, and essential amino acids. Enhances natural pigmentation, fin growth, and breeding vigor.',
        short_description: '100g high-protein insect-based micro pellets for guppies & Guppys.',
        price: 200,
        compare_at_price: 280,
        category_id: toUUID('cat-food'),
        subcategory_id: null,
        stock_quantity: 40,
        is_unique_specimen: false,
        is_featured: true,
        care_level: 'Easy',
        images: ['/product_image/insecta-pro-200.jpeg']
      },
      {
        id: toUUID('prod-030'),
        name: 'Live Moina Macrocopa Starter Culture (Live Food)',
        slug: 'moina-starter-culture-live-food-100',
        sku: 'RG-FD-MN100',
        description: 'Live freshwater water flea (Moina Macrocopa) starter culture. Superior live food for newborn fry and adult guppies/Guppys with high digestive enzyme content and rapid reproduction rate.',
        short_description: 'Active live Moina starter culture pouch for rapid fry development.',
        price: 100,
        compare_at_price: 150,
        category_id: toUUID('cat-food'),
        subcategory_id: null,
        stock_quantity: 30,
        is_unique_specimen: false,
        is_featured: true,
        care_level: 'Easy',
        images: ['/product_image/moina-100.jpeg']
      }
    ];

    for (const p of products) {
      await client.query(`
        INSERT INTO public.products (
          id, name, slug, sku, description, short_description, price, compare_at_price,
          category_id, subcategory_id, stock_quantity, is_unique_specimen, is_featured, is_active,
          strain, gender, size, care_level, rating, review_count, status, videos
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, true, $14, $15, $16, $17, 5.0, 10, 'published', $18
        )
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name, slug = EXCLUDED.slug, sku = EXCLUDED.sku,
          description = EXCLUDED.description, short_description = EXCLUDED.short_description,
          price = EXCLUDED.price, compare_at_price = EXCLUDED.compare_at_price,
          category_id = EXCLUDED.category_id, subcategory_id = EXCLUDED.subcategory_id,
          stock_quantity = EXCLUDED.stock_quantity, is_unique_specimen = EXCLUDED.is_unique_specimen,
          is_featured = EXCLUDED.is_featured, status = EXCLUDED.status, videos = EXCLUDED.videos;
      `, [
        p.id, p.name, p.slug, p.sku, p.description, p.short_description, p.price, p.compare_at_price,
        p.category_id, p.subcategory_id || null, p.stock_quantity, p.is_unique_specimen, p.is_featured,
        p.strain, p.gender, p.size, p.care_level, JSON.stringify(p.videos || [])
      ]);

      // Seed product images
      for (let i = 0; i < p.images.length; i++) {
        await client.query(`
          INSERT INTO public.product_images (id, product_id, image_url, is_primary, display_order)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (id) DO NOTHING;
        `, [toUUID(`${p.id}-img-${i}`), p.id, p.images[i], i === 0, i]);
      }
    }
    console.log(`✓ ${products.length} products seeded with live videos and image galleries.`);

    // 4. COUPONS
    console.log('Seeding coupons...');
    const coupons = [
      { id: toUUID('cpn-aqua10'), code: 'AQUA10', description: '10% discount on entire cart', discount_type: 'percentage', discount_value: 10, min_order_amount: 500, max_discount: 500 },
      { id: toUUID('cpn-firstfish'), code: 'FIRSTFISH', description: 'Flat ₹150 off on first live fish order', discount_type: 'fixed', discount_value: 150, min_order_amount: 999 },
      { id: toUUID('cpn-vipGuppy'), code: 'VIPGuppy', description: '15% off for club collectors', discount_type: 'percentage', discount_value: 15, min_order_amount: 2500, max_discount: 1000 }
    ];

    for (const c of coupons) {
      await client.query(`
        INSERT INTO public.coupons (id, code, description, discount_type, discount_value, min_order_amount, max_discount, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7, true)
        ON CONFLICT (id) DO UPDATE 
        SET code = EXCLUDED.code, description = EXCLUDED.description, discount_value = EXCLUDED.discount_value;
      `, [c.id, c.code, c.description, c.discount_type, c.discount_value, c.min_order_amount, c.max_discount || null]);
    }
    console.log('✓ Coupons seeded.');

    // 5. CMS PAGES
    console.log('Seeding CMS pages...');
    const pages = [
      { id: toUUID('page-about'), slug: 'about-us', title: 'About Ra Guppy', content_html: '<p>Ra Guppy is India’s premier sanctuary for pure-strain Guppies, champion Guppys, and exotic aquatic life.</p>' },
      { id: toUUID('page-shipping'), slug: 'shipping-policy', title: 'Shipping & Live Arrival Guarantee', content_html: '<p>We ship live specimens strictly across India via The Professional Couriers road transport in specialized medical oxygen double-sealed packaging with temperature-insulating thermo-boxes.</p>' },
      { id: toUUID('page-doa'), slug: 'doa-policy', title: 'Dead on Arrival (DOA) Policy', content_html: '<p>If any specimen does not arrive alive, record a clear 30-second unboxing video of the unopened shipping bag within 2 hours of delivery for a replacement or full refund.</p>' }
    ];

    for (const p of pages) {
      await client.query(`
        INSERT INTO public.cms_pages (id, slug, title, content_html, is_published)
        VALUES ($1, $2, $3, $4, true)
        ON CONFLICT (id) DO UPDATE 
        SET title = EXCLUDED.title, content_html = EXCLUDED.content_html, is_published = true;
      `, [p.id, p.slug, p.title, p.content_html]);
    }
    // 6. AUTH USERS & PROFILES
    console.log('Seeding authentication users and profiles...');
    await client.query('CREATE EXTENSION IF NOT EXISTS pgcrypto;');

    const seedUsers = [
      {
        id: 'a0000000-0000-0000-0000-000000000001',
        email: 'nawfalaadil@gmail.com',
        password: 'Admin@123',
        name: 'Nawfal Aadil (Owner & Admin)',
        phone: '+91 98765 43210',
        role: 'admin'
      },
      {
        id: 'a50b1f21-6702-4fbb-9070-7ce8122b7200',
        email: 'raguppies00@gmail.com',
        password: 'Rishan@123',
        name: 'Ra Guppy Primary Admin',
        phone: '+91 98765 43210',
        role: 'admin'
      },
      {
        id: 'a50b1f21-6702-4fbb-9070-7ce8122b72ba',
        email: 'raguppies@gmail.com',
        password: 'Admin@123',
        name: 'Ra Guppy Admin',
        phone: '+91 98765 43210',
        role: 'admin'
      },
      {
        id: 'a0000000-0000-0000-0000-000000000003',
        email: 'admin@Guppyaquatics.in',
        password: 'Admin@123',
        name: 'Store Administrator',
        phone: '+91 98765 43210',
        role: 'admin'
      },
      {
        id: 'a0000000-0000-0000-0000-000000000002',
        email: 'customer@gmail.com',
        password: 'Customer@123',
        name: 'Customer Demo User',
        phone: '+91 98450 12345',
        role: 'customer'
      },
      {
        id: 'a0000000-0000-0000-0000-000000000004',
        email: 'customer@Guppyaquatics.in',
        password: 'Customer@123',
        name: 'Rahul Sharma',
        phone: '+91 98450 12345',
        role: 'customer'
      }
    ];

    for (const u of seedUsers) {
      const rawUserMeta = JSON.stringify({
        sub: u.id,
        email: u.email,
        email_verified: true,
        phone_verified: false,
        full_name: u.name,
        role: u.role
      });

      const identityData = JSON.stringify({
        sub: u.id,
        email: u.email,
        email_verified: true,
        phone_verified: false
      });

      await client.query(`
        INSERT INTO auth.users (
          instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
          raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
          confirmation_token, recovery_token, email_change_token_new, email_change, is_super_admin, is_sso_user, is_anonymous
        ) VALUES (
          '00000000-0000-0000-0000-000000000000',
          $1::uuid,
          'authenticated', 'authenticated', $2,
          crypt($3, gen_salt('bf', 10)),
          NOW(),
          '{"provider": "email", "providers": ["email"]}'::jsonb,
          $4::jsonb,
          NOW(), NOW(), encode(gen_random_bytes(16), 'hex'), '', '', '', null, false, false
        )
        ON CONFLICT (id) DO UPDATE SET
          email = EXCLUDED.email,
          encrypted_password = crypt($3, gen_salt('bf', 10)),
          email_confirmed_at = NOW(),
          is_super_admin = null,
          email_change = '',
          raw_user_meta_data = EXCLUDED.raw_user_meta_data,
          updated_at = NOW();
      `, [u.id, u.email, u.password, rawUserMeta]);

      await client.query(`
        INSERT INTO auth.identities (
          id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
        ) VALUES (
          gen_random_uuid(), $1::uuid,
          $2::jsonb,
          'email', $1::text, NOW(), NOW(), NOW()
        )
        ON CONFLICT (provider_id, provider) DO UPDATE SET
          identity_data = EXCLUDED.identity_data,
          updated_at = NOW();
      `, [u.id, identityData]);

      await client.query(`
        INSERT INTO public.profiles (id, email, full_name, phone, role)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (id) DO UPDATE SET
          email = EXCLUDED.email,
          full_name = EXCLUDED.full_name,
          phone = EXCLUDED.phone,
          role = EXCLUDED.role,
          updated_at = NOW();
      `, [u.id, u.email, u.name, u.phone, u.role]);
    }
    console.log('✓ Authentication users and profiles provisioned.');

    console.log('\n======================================================');
    console.log('🎉 COMPREHENSIVE SUPABASE DATABASE SEEDING COMPLETED!');
    console.log('======================================================');

    await client.end();
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
}

seed();
