import { Category, Product, StoreSettings, HomepageSection, CMSPage, Coupon, BlogPost, MediaAsset, BrandingSettings } from './types';

export const COURIER_PRESETS = [
  {
    name: 'The Professional Couriers (Road Courier)',
    urlTemplate: 'https://www.tpcindia.com/Tracking.aspx?ConsignmentNo={AWB}',
    description: 'Specialized surface road transport for live ornamental fish across India with 100% Live Arrival Guarantee.',
  },
  {
    name: 'The Professional Couriers (Express Surface)',
    urlTemplate: 'https://www.tpcindia.com/Tracking.aspx?ConsignmentNo={AWB}',
    description: 'Express door-to-door road consignment by The Professional Couriers logistics network.',
  },
  {
    name: 'India Post Speed Post',
    urlTemplate: 'https://www.indiapost.gov.in/_layouts/15/dpt.cept.tracking/trackconsignment.aspx',
    description: 'National government express network reaching all remote PIN codes.',
  },
  {
    name: 'Custom Courier Partner',
    urlTemplate: '{AWB}',
    description: 'Enter your custom courier tracking web link.',
  },
];

export const INITIAL_CATEGORIES: Category[] = [
  {
    id: '9ebb7d17-8998-46b7-8e97-46a0812f7a80',
    name: 'Guppies & Livebearers',
    slug: 'guppies',
    description: 'Pure strain Albino Full Red, Dumbo Ear Mosaic, Green Tail, and Blue Dragon imported guppy pairs.',
    image_url: '/product_image/afr-flower-dorsal-400.jpeg',
    banner_url: '/product_image/afr-flower-dorsal-400.jpeg',
    parent_id: null,
    display_order: 1,
    is_active: true,
    is_featured: true,
  },
  {
    id: '61282e57-e6d0-419d-8947-c63859e11560',
    name: 'Aquatic Plants',
    slug: 'aquatic-plants',
    description: 'Snail-free natural floating plants, hornwort stems, and terrarium creeping vines.',
    image_url: '/product_image/guppy-grass-50.jpeg',
    banner_url: '/product_image/guppy-grass-50.jpeg',
    parent_id: null,
    display_order: 2,
    is_active: true,
    is_featured: true,
  },
  {
    id: 'a71581d6-2d40-4436-834e-75ffb933faaa',
    name: 'Fish Food & Nutrition',
    slug: 'fish-food',
    description: 'High-protein micro pellets and live Moina starter cultures.',
    image_url: '/product_image/insecta-pro-200.jpeg',
    banner_url: '/product_image/insecta-pro-200.jpeg',
    parent_id: null,
    display_order: 3,
    is_active: true,
    is_featured: true,
  },
  {
    id: 'b66e47f9-03cf-436b-8ae8-5b853f748350',
    name: 'Breeding Pairs & Rare Strains',
    slug: 'breeding-pairs',
    description: 'Carefully conditioned, proven fertile breeding pairs with lineage certificates.',
    image_url: '/product_image/green-platinum-dumbo-500.jpeg',
    parent_id: null,
    display_order: 4,
    is_active: true,
    is_featured: false,
  },
  {
    id: '1957f7ab-11a1-43d1-88bc-b96b9d7c069e',
    name: 'Aquarium Accessories',
    slug: 'accessories',
    description: 'Gentle sponge filters, conditioning botanicals, and water treatments.',
    image_url: '/product_image/duckweed-50.jpeg',
    parent_id: null,
    display_order: 5,
    is_active: true,
    is_featured: false,
  }
];

export const INITIAL_PRODUCTS: Product[] = [

  {
    "id": "e5a60024-4911-4373-84d2-440993672137",
    "name": "Albino Full Red (AFR) Flower Dorsal Guppy (Breeding Pair)",
    "slug": "afr-flower-dorsal-guppy-pair-400",
    "sku": "RG-AFR-400",
    "description": "Exquisite Albino Full Red (AFR) with distinctive Flower Dorsal finnage. Vibrant crimson delta tail, high fertility, proven breeding pair conditioned for planted aquariums.",
    "short_description": "1 Male + 1 Female pure strain AFR with Flower Dorsal.",
    "price": 400,
    "compare_at_price": 600,
    "category_id": "9ebb7d17-8998-46b7-8e97-46a0812f7a80",
    "category_name": "Guppies & Livebearers",
    "stock_quantity": 20,
    "is_unique_specimen": false,
    "is_featured": true,
    "is_active": true,
    "status": "published",
    "weight": 150,
    "strain": "Albino Full Red Flower Dorsal",
    "gender": "Breeding Pair",
    "size": "3.5 - 4.5 cm",
    "water_type": "Freshwater (Tropical)",
    "temperature_range": "24°C - 28°C",
    "ph_range": "6.5 - 7.5",
    "care_level": "Easy",
    "shipping_restriction": "Special Live Oxygen Packing required. The Professional Couriers Road Delivery only.",
    "images": [
      "/product_image/afr-flower-dorsal-400.jpeg"
    ],
    "videos": [],
    "rating": 4.9,
    "review_count": 22,
    "tags": [
      "Bestseller",
      "Proven Pair",
      "AFR"
    ],
    "created_at": "2026-10-18T10:41:53.104Z"
  },
  {
    "id": "1dffe71a-3cfd-4b02-8688-bb6401f7d80f",
    "name": "Electric Blue Guppy (Proven Breeding Pair)",
    "slug": "electric-blue-guppy-pair-300",
    "sku": "RG-EB-300",
    "description": "Striking metallic Electric Blue pure strain guppy pair with deep ocean blue coloration across dorsal and caudal fins. Active, healthy, and conditioned for soft to moderate tap water.",
    "short_description": "1 Male + 1 Female pure strain Electric Blue breeding pair.",
    "price": 300,
    "compare_at_price": 450,
    "category_id": "9ebb7d17-8998-46b7-8e97-46a0812f7a80",
    "category_name": "Guppies & Livebearers",
    "stock_quantity": 10,
    "is_unique_specimen": false,
    "is_featured": true,
    "is_active": true,
    "status": "published",
    "weight": 150,
    "strain": "Electric Blue",
    "gender": "Breeding Pair",
    "size": "3.2 - 4.2 cm",
    "water_type": "Freshwater (Tropical)",
    "temperature_range": "24°C - 28°C",
    "ph_range": "6.5 - 7.5",
    "care_level": "Easy",
    "shipping_restriction": "Special Live Oxygen Packing required. The Professional Couriers Road Delivery only.",
    "images": [
      "/product_image/electric-blue-300.jpeg"
    ],
    "videos": [],
    "rating": 4.8,
    "review_count": 17,
    "tags": [
      "Proven Pair",
      "Electric Blue"
    ],
    "created_at": "2026-10-18T10:41:53.351Z"
  },
  {
    "id": "4f101ad2-86dd-4cc6-8892-6d32bfa4fac6",
    "name": "Green Platinum Half Moon Dumbo Guppy (Breeding Pair)",
    "slug": "green-platinum-half-moon-dumbo-guppy-500",
    "sku": "RG-GPD-500",
    "description": "High-end show class Green Platinum Halfmoon with prominent oversized Dumbo (Big Ear) pectoral fins and wide 180° caudal spread. Rare bloodline bred in controlled conditions.",
    "short_description": "1 Male + 1 Female rare Green Platinum Halfmoon Dumbo Ear pair.",
    "price": 500,
    "compare_at_price": 750,
    "category_id": "9ebb7d17-8998-46b7-8e97-46a0812f7a80",
    "category_name": "Guppies & Livebearers",
    "stock_quantity": 5,
    "is_unique_specimen": true,
    "is_featured": true,
    "is_active": true,
    "status": "published",
    "weight": 150,
    "strain": "Green Platinum Half Moon Dumbo",
    "gender": "Breeding Pair",
    "size": "3.5 - 4.8 cm",
    "water_type": "Freshwater (Tropical)",
    "temperature_range": "24°C - 28°C",
    "ph_range": "6.5 - 7.5",
    "care_level": "Moderate",
    "shipping_restriction": "Special Live Oxygen Packing required. The Professional Couriers Road Delivery only.",
    "images": [
      "/product_image/green-platinum-dumbo-500.jpeg"
    ],
    "videos": [],
    "rating": 5,
    "review_count": 12,
    "tags": [
      "WYSIWYG 1-of-1",
      "Dumbo Ear",
      "Half Moon"
    ],
    "created_at": "2026-10-18T10:41:53.591Z"
  },
  {
    "id": "7e26b74b-3059-4524-8fa4-23edc806da7d",
    "name": "Purple Mosaic Half Moon Tail Guppy (Breeding Pair)",
    "slug": "purple-mosaic-half-moon-guppy-pair-400",
    "sku": "RG-PM-400",
    "description": "Rare Purple Half Moon Tail guppy pair with iridescent violet/purple hues and intricate mosaic tail patterning. Fertile, active, conditioned pair ready for nano planted tanks.",
    "short_description": "1 Male + 1 Female rare Purple Halfmoon tail breeding pair.",
    "price": 400,
    "compare_at_price": 550,
    "category_id": "9ebb7d17-8998-46b7-8e97-46a0812f7a80",
    "category_name": "Guppies & Livebearers",
    "stock_quantity": 20,
    "is_unique_specimen": false,
    "is_featured": true,
    "is_active": true,
    "status": "published",
    "weight": 150,
    "strain": "Purple Half Moon Tail",
    "gender": "Breeding Pair",
    "size": "3.5 - 4.5 cm",
    "water_type": "Freshwater (Tropical)",
    "temperature_range": "24°C - 28°C",
    "ph_range": "6.5 - 7.5",
    "care_level": "Easy",
    "shipping_restriction": "Special Live Oxygen Packing required. The Professional Couriers Road Delivery only.",
    "images": [
      "/product_image/purple-hm-tail-400.jpeg"
    ],
    "videos": [],
    "rating": 4.9,
    "review_count": 19,
    "tags": [
      "Purple Mosaic",
      "Half Moon"
    ],
    "created_at": "2026-10-18T10:41:53.830Z"
  },
  {
    "id": "71e5caf8-384f-4e2f-8109-a8a32ec66da0",
    "name": "Tiger Half Moon Guppy (Proven Breeding Pair)",
    "slug": "tiger-half-moon-guppy-pair-300",
    "sku": "RG-THM-300",
    "description": "High-contrast Tiger patterned Halfmoon guppy pair with bold tiger stripes, vivid yellow-orange background, and wide delta caudal spread.",
    "short_description": "1 Male + 1 Female high-contrast Tiger Halfmoon breeding pair.",
    "price": 300,
    "compare_at_price": 450,
    "category_id": "9ebb7d17-8998-46b7-8e97-46a0812f7a80",
    "category_name": "Guppies & Livebearers",
    "stock_quantity": 30,
    "is_unique_specimen": false,
    "is_featured": true,
    "is_active": true,
    "status": "published",
    "weight": 150,
    "strain": "Tiger Half Moon",
    "gender": "Breeding Pair",
    "size": "3.2 - 4.5 cm",
    "water_type": "Freshwater (Tropical)",
    "temperature_range": "24°C - 28°C",
    "ph_range": "6.5 - 7.5",
    "care_level": "Easy",
    "shipping_restriction": "Special Live Oxygen Packing required. The Professional Couriers Road Delivery only.",
    "images": [
      "/product_image/tiger-halfmoon-300.jpeg"
    ],
    "videos": [],
    "rating": 4.8,
    "review_count": 15,
    "tags": [
      "Tiger Pattern",
      "Proven Pair"
    ],
    "created_at": "2026-10-18T10:41:54.070Z"
  },
  {
    "id": "7cddeeec-ca61-416d-8bab-5ddfb1b9a3fc",
    "name": "Aquatic Duckweed (Lemna Minor) - Snail Free Floating Plant",
    "slug": "aquatic-duckweed-floating-plant-50",
    "sku": "RG-PL-DW50",
    "description": "Lush green natural floating duckweed portion. Excellent natural nitrate absorber, provides shelter for baby guppy fry, and creates natural shaded biotope lighting.",
    "short_description": "Portion of healthy floating duckweed for fry cover and nitrate reduction.",
    "price": 50,
    "compare_at_price": 80,
    "category_id": "61282e57-e6d0-419d-8947-c63859e11560",
    "category_name": "Aquatic Plants",
    "stock_quantity": 50,
    "is_unique_specimen": false,
    "is_featured": false,
    "is_active": true,
    "status": "published",
    "weight": 150,
    "strain": "Lemna Minor",
    "water_type": "Freshwater (Tropical)",
    "temperature_range": "24°C - 28°C",
    "ph_range": "6.5 - 7.5",
    "care_level": "Easy",
    "images": [
      "/product_image/duckweed-50.jpeg"
    ],
    "videos": [],
    "rating": 5,
    "review_count": 10,
    "tags": [
      "Live Plants",
      "Floating Plant"
    ],
    "created_at": "2026-10-18T10:41:54.314Z"
  },
  {
    "id": "cf5c3a29-703c-4b76-863e-6ba0cadd22d5",
    "name": "Ficus Pumila (Creeping Fig) - Riparium & Terrarium Plant",
    "slug": "ficus-pumila-creeping-fig-200",
    "sku": "RG-PL-FP200",
    "description": "Hardy Ficus Pumila climbing vine plant suitable for open-top aquarium rim mounting, ripariums, paludariums, and vivariums. Sucks out waste nitrates and roots directly into water.",
    "short_description": "Healthy climbing vine portion for aquarium tops and paludariums.",
    "price": 200,
    "compare_at_price": 280,
    "category_id": "61282e57-e6d0-419d-8947-c63859e11560",
    "category_name": "Aquatic Plants",
    "stock_quantity": 20,
    "is_unique_specimen": false,
    "is_featured": false,
    "is_active": true,
    "status": "published",
    "weight": 150,
    "strain": "Creeping Fig",
    "water_type": "Freshwater (Tropical)",
    "temperature_range": "24°C - 28°C",
    "ph_range": "6.5 - 7.5",
    "care_level": "Easy",
    "images": [
      "/product_image/ficus-pumila-200.jpeg"
    ],
    "videos": [],
    "rating": 5,
    "review_count": 10,
    "tags": [
      "Live Plants",
      "Riparium"
    ],
    "created_at": "2026-10-18T10:41:54.557Z"
  },
  {
    "id": "7ee43475-814c-4243-80e2-89852fcbe6c4",
    "name": "Foxtail (Ceratophyllum Demersum) - Hornwort Stem Bundle",
    "slug": "foxtail-hornwort-plant-bundle-50",
    "sku": "RG-PL-FT50",
    "description": "Fast-growing, bushy Foxtail / Hornwort stems. Highly oxygenating submerged plant that prevents algae, requires zero CO2, and offers the best refuge for newborn fish fry.",
    "short_description": "Oxygenating, hardy foxtail stem bunch for fry shelter.",
    "price": 50,
    "compare_at_price": 80,
    "category_id": "61282e57-e6d0-419d-8947-c63859e11560",
    "category_name": "Aquatic Plants",
    "stock_quantity": 50,
    "is_unique_specimen": false,
    "is_featured": false,
    "is_active": true,
    "status": "published",
    "weight": 150,
    "strain": "Ceratophyllum Demersum",
    "water_type": "Freshwater (Tropical)",
    "temperature_range": "24°C - 28°C",
    "ph_range": "6.5 - 7.5",
    "care_level": "Easy",
    "images": [
      "/product_image/foxtail-50.jpeg"
    ],
    "videos": [],
    "rating": 5,
    "review_count": 10,
    "tags": [
      "Live Plants",
      "Submerged"
    ],
    "created_at": "2026-10-18T10:41:54.798Z"
  },
  {
    "id": "1c4410ac-d4a5-450d-8808-351caa198806",
    "name": "Guppy Grass (Najas Guadalupensis) - Natural Biotope Bunch",
    "slug": "guppy-grass-najas-guadalupensis-50",
    "sku": "RG-PL-GG50",
    "description": "The quintessential plant for guppy breeding tanks. Forms dense, lush emerald green underwater thickets that baby fry hide in safely. Rapid grower that thrives in any water condition.",
    "short_description": "Generous bunch of true Najas guppy grass for high fry survival.",
    "price": 50,
    "compare_at_price": 80,
    "category_id": "61282e57-e6d0-419d-8947-c63859e11560",
    "category_name": "Aquatic Plants",
    "stock_quantity": 50,
    "is_unique_specimen": false,
    "is_featured": true,
    "is_active": true,
    "status": "published",
    "weight": 150,
    "strain": "Najas Guadalupensis",
    "water_type": "Freshwater (Tropical)",
    "temperature_range": "24°C - 28°C",
    "ph_range": "6.5 - 7.5",
    "care_level": "Easy",
    "images": [
      "/product_image/guppy-grass-50.jpeg"
    ],
    "videos": [],
    "rating": 5,
    "review_count": 10,
    "tags": [
      "Live Plants",
      "Fry Cover"
    ],
    "created_at": "2026-10-18T10:41:55.038Z"
  },
  {
    "id": "f43a4c88-9e27-452e-8746-18f1814c7d3b",
    "name": "Insecta Pro Premium Fish Nutrition (100g Pellets)",
    "slug": "insecta-pro-fish-food-100g-200",
    "sku": "RG-FD-IP200",
    "description": "Specially formulated high-protein feed made from premium black soldier fly larvae meal, spirulina, and essential amino acids. Enhances natural pigmentation, fin growth, and breeding vigor.",
    "short_description": "100g high-protein insect-based micro pellets for pure strain guppies & fry.",
    "price": 200,
    "compare_at_price": 280,
    "category_id": "a71581d6-2d40-4436-834e-75ffb933faaa",
    "category_name": "Fish Food & Nutrition",
    "stock_quantity": 40,
    "is_unique_specimen": false,
    "is_featured": true,
    "is_active": true,
    "status": "published",
    "weight": 150,
    "water_type": "Freshwater (Tropical)",
    "temperature_range": "24°C - 28°C",
    "ph_range": "6.5 - 7.5",
    "care_level": "Easy",
    "images": [
      "/product_image/insecta-pro-200.jpeg"
    ],
    "videos": [],
    "rating": 5,
    "review_count": 10,
    "tags": [
      "Nutrition",
      "Pellets"
    ],
    "created_at": "2026-10-18T10:41:55.278Z"
  },
  {
    "id": "d56f9f5f-10b0-4519-8c67-069df265b275",
    "name": "Live Moina Macrocopa Starter Culture (Live Food)",
    "slug": "moina-starter-culture-live-food-100",
    "sku": "RG-FD-MN100",
    "description": "Live freshwater water flea (Moina Macrocopa) starter culture. Superior live food for newborn fry and adult guppies with high digestive enzyme content and rapid reproduction rate.",
    "short_description": "Active live Moina starter culture pouch for rapid fry development.",
    "price": 100,
    "compare_at_price": 150,
    "category_id": "a71581d6-2d40-4436-834e-75ffb933faaa",
    "category_name": "Fish Food & Nutrition",
    "stock_quantity": 30,
    "is_unique_specimen": false,
    "is_featured": true,
    "is_active": true,
    "status": "published",
    "weight": 150,
    "water_type": "Freshwater (Tropical)",
    "temperature_range": "24°C - 28°C",
    "ph_range": "6.5 - 7.5",
    "care_level": "Easy",
    "images": [
      "/product_image/moina-100.jpeg"
    ],
    "videos": [],
    "rating": 5,
    "review_count": 10,
    "tags": [
      "Live Food",
      "Culture"
    ],
    "created_at": "2026-10-18T10:41:55.520Z"
  }
];

export const INITIAL_STORE_SETTINGS: StoreSettings = {
  brand_name: 'RA Guppy',
  tagline: 'Pure Strain Guppies & Aquatic Sanctuary',
  contact_email: 'raguppies00@gmail.com',
  contact_phone: '+91 89211 90590',
  whatsapp_number: '+91 89211 90590',
  upi_id: 'rishankc75@okicici',
  upi_payee_name: 'RA Guppy',
  bank_name: 'ICICI Bank',
  bank_account_no: '002405009988',
  bank_ifsc: 'ICIC0000024',
  bank_account_holder: 'RA Guppy',
  free_shipping_threshold: 999999,
  standard_shipping_rate: 80,
  live_packing_charge: 0,
  announcement_text: '🚚 The Professional Couriers Road Delivery across India! Safe Live Arrival Guarantee.',
  announcement_code: 'AQUA10',
  announcement_active: true,
  announcement_link: '/shop',
  serviceable_pincodes: [
    '110001', '110020', '400001', '400050', '560001', '560034',
    '600001', '600028', '700001', '700029', '500001', '500081',
    '380001', '411001', '682001', '641001', '302001'
  ],
  maintenance_mode: false,
  branding: {
    logo_url: '/logo.jpeg',
    mobile_logo_url: '/logo.jpeg',
    footer_logo_url: '/logo.jpeg',
    favicon_url: '/favicon.svg',
    site_name: 'RA Guppy',
    tagline: 'Pure Strain Guppies & Aquatic Sanctuary',
    primary_color: '#1e3a8a',
    secondary_color: '#dc2626',
    accent_color: '#0284c7',
    background_color: '#f8fafc',
    text_color: '#0f172a',
    primary_text_color: '#ffffff',
    secondary_text_color: '#ffffff',
    version: 1,
  },
};

export const DEFAULT_BRANDING_SETTINGS: BrandingSettings = {
  logo_url: '/logo.jpeg',
  mobile_logo_url: '/logo.jpeg',
  footer_logo_url: '/logo.jpeg',
  favicon_url: '/favicon.svg',
  site_name: 'RA Guppy',
  tagline: 'Pure Strain Guppies & Aquatic Sanctuary',
  primary_color: '#1e3a8a',
  secondary_color: '#dc2626',
  accent_color: '#0284c7',
  background_color: '#f8fafc',
  text_color: '#0f172a',
  primary_text_color: '#ffffff',
  secondary_text_color: '#ffffff',
  version: 1,
};

export const INITIAL_HOMEPAGE_SECTIONS: HomepageSection[] = [
  {
    id: 'sec-hero',
    type: 'hero',
    title: 'Experience Living Jewels of the Aquatic World',
    subtitle: 'Champion-lineage pure-strain guppy trios and rare exotic show guppies. Shipped safely across India with 100% Live Arrival Guarantee.',
    is_active: true,
    display_order: 1,
    config: {
      ctaPrimary: 'Explore Rare Strains',
      cta_text: 'Explore Rare Strains',
      ctaPrimaryLink: '/shop',
      cta_link: '/shop',
      ctaSecondary: 'Live Stock Video',
      secondary_cta_text: 'Live Stock Video',
      ctaSecondaryLink: '/live-stock',
      secondary_cta_link: '/live-stock',
      backgroundImage: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=2000&q=85',
      background_image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=2000&q=85',
      badge: 'Certified Live Arrival Guarantee',
      badge_text: 'Certified Live Arrival Guarantee'
    }
  },
  {
    id: 'sec-categories',
    type: 'categories',
    title: 'Shop By Pure Strain Bloodline',
    subtitle: 'Certified healthy pedigree genetics with comprehensive live arrival warranty.',
    is_active: true,
    display_order: 2,
    config: {
      viewAllLink: '/shop',
    }
  },
  {
    id: 'sec-flash-deal',
    type: 'flash_deal',
    title: 'Show Specimen Flash Drops',
    subtitle: 'Strictly conditioned live specimens prepared for direct road courier dispatch.',
    is_active: true,
    display_order: 3,
    config: {
      endTimeHours: 12,
      bannerText: 'Direct Road Dispatch',
    }
  },
  {
    id: 'sec-specimen-showcase',
    type: 'specimen_showcase',
    title: 'Living Consignment Gallery',
    subtitle: 'Hand-picked champion lineage ready for immediate express booking across India.',
    is_active: true,
    display_order: 4,
    config: {
      ctaLink: '/shop',
      filterCategory: '9ebb7d17-8998-46b7-8e97-46a0812f7a80',
    }
  },
  {
    id: 'sec-guppies',
    type: 'curated_collection',
    title: 'Imported Guppy Trios & Breeding Pairs',
    subtitle: 'Vibrant genetics and conditioned pairs for hobbyists and breeders across India.',
    is_active: true,
    display_order: 5,
    config: {
      filterCategory: '9ebb7d17-8998-46b7-8e97-46a0812f7a80'
    }
  },
  {
    id: 'sec-breeder-story',
    type: 'breeder_story',
    title: 'Our Breeding & Quarantine Standards',
    subtitle: 'Three generations of selective breeding, 21-day quarantine protocols, and safe road dispatch.',
    is_active: true,
    display_order: 6,
    config: {
      quote: '"We are hobbyists first, breeders second, and sellers last."',
      breederName: 'Ra Guppy Master Team',
      experienceYears: '9+ Years Experience',
      whatsapp: '+91 98765 43210',
      facilityImage: 'https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?auto=format&fit=crop&w=1200&q=80',
    }
  },
  {
    id: 'sec-care-guide',
    type: 'care_guide',
    title: 'Master Aquarium Care Guides',
    subtitle: 'Everything you need to know about water chemistry, acclimation, and feeding.',
    is_active: true,
    display_order: 7,
    config: {}
  },
  {
    id: 'sec-trust',
    type: 'trust_badges',
    title: 'Why Hobbyists Choose Ra Guppy',
    subtitle: 'Built on trust, bio-security, and unmatched specimen quality.',
    is_active: true,
    display_order: 8,
    config: {}
  },
  {
    id: 'sec-testimonials',
    type: 'testimonials',
    title: 'Customer Feedback & Unboxing Stories',
    subtitle: 'Read genuine reviews from fishkeepers across India on our safe packaging and fish vitality.',
    is_active: true,
    display_order: 9,
    config: {}
  },
  {
    id: 'sec-newsletter',
    type: 'newsletter',
    title: 'Join The VIP Fish Club',
    subtitle: 'Be the first to know when rare wild hybrids and master show specimens are listed.',
    is_active: true,
    display_order: 10,
    config: {}
  }
];

export const INITIAL_CMS_PAGES: CMSPage[] = [
  {
    id: 'page-shipping',
    slug: 'shipping-acclimation',
    title: 'Live Fish Shipping & Acclimation Guide',
    meta_title: 'Live Fish Shipping & Acclimation Guide | Ra Guppy',
    meta_description: 'Step-by-step float and drip acclimation guide and Live Arrival Guarantee policy for ornamental fish.',
    is_published: true,
    updated_at: '2026-03-20T10:00:00Z',
    content_html: `
      <h2>100% Live Arrival Guarantee (DOA Policy)</h2>
      <p>At Ra Guppy, every fish is conditioned for 72 hours before dispatch. We pack using heavy-gauge medical bags with pure medical oxygen, insulated EPS thermal thermocol boxes, and heat/cooling packs calibrated to transit weather.</p>
      
      <h3>State-Wise Road Courier Delivery Rates:</h3>
      <ul>
        <li><strong>Kerala:</strong> ₹80 (Up to 10 pairs)</li>
        <li><strong>Tamil Nadu & Karnataka:</strong> ₹120 (Up to 10 pairs)</li>
        <li><strong>All Other Indian States:</strong> ₹200 (Up to 10 pairs)</li>
        <li><em>Orders over 10 pairs: 2X courier charge for heavy dual-crate packaging.</em></li>
      </ul>

      <h3>How Our Live Arrival Guarantee Works:</h3>
      <ul>
        <li>In the unlikely event of Dead-on-Arrival (DOA), notify our team within <strong>2 hours of package delivery</strong>.</li>
        <li>Provide an uncut 30-second unboxing video showing the shipping label and unopened bag.</li>
        <li>Once verified, we provide an immediate 100% store credit or free specimen replacement.</li>
      </ul>

      <h3>Step-by-Step Acclimation Instructions:</h3>
      <ol>
        <li><strong>Dim Tank Lights:</strong> Turn off bright aquarium lighting to reduce stress for your new fish.</li>
        <li><strong>Float the Bag (15-20 Minutes):</strong> Float the sealed bag on top of your aquarium water to equalize temperature gradually.</li>
        <li><strong>Water Mixing:</strong> Open the bag and gently add 1/4 cup of your aquarium water every 5 minutes for 20 minutes (or use a drip line).</li>
        <li><strong>Release Fish (Do Not Dump Bag Water):</strong> Net the fish gently out of the shipping water and release it into the tank. Discard the shipping bag water.</li>
        <li><strong>Feeding:</strong> Do not feed your new fish for the first 12 to 24 hours while it settles into its new environment.</li>
      </ol>
    `
  },
  {
    id: 'page-about',
    slug: 'about-us',
    title: 'About Ra Guppy',
    meta_title: 'About Us | Ra Guppy India',
    meta_description: 'Learn about India\'s premier specialized pure strain guppy and planted aquatic life sanctuary.',
    is_published: true,
    updated_at: '2026-03-20T10:00:00Z',
    content_html: `
      <h2>Ethical Aquaculture & Passion for Living Jewels</h2>
      <p>Founded by passionate aquatic breeders and biological researchers, <strong>RA Guppy</strong> was born out of a single mission: to provide the highest-grade pure strain Guppies, healthy aquatic plants, and live foods across India.</p>
      <p>Unlike commercial high-density wholesale farms, our indoor biosecure facility maintains individual high-filtration barracks and softwater conditioning for every specimen. Each fish receives balanced live feeds, pristine water conditions, and daily health checks.</p>
      <h3>Our Standards:</h3>
      <ul>
        <li><strong>True-to-Specimen Transparency:</strong> For unique specimens, the fish you view in our photos and videos is the exact fish you receive.</li>
        <li><strong>Medical Grade Packing:</strong> Medical oxygenated bags with stress-coat conditioners and temperature-controlled insulated shipping boxes.</li>
        <li><strong>Direct Surface Transport:</strong> Fast, safe road transit via The Professional Couriers.</li>
      </ul>
    `
  },
  {
    id: 'page-faq',
    slug: 'faq',
    title: 'Frequently Asked Questions',
    meta_title: 'Frequently Asked Questions | Ra Guppy',
    meta_description: 'Answers to your common questions regarding orders, payment verification, shipping, and fish health.',
    is_published: true,
    updated_at: '2026-03-20T10:00:00Z',
    content_html: `
      <h2>Ordering & Delivery Questions</h2>
      <h4>How long does delivery take?</h4>
      <p>We ship live ornamental fish strictly across India using specialized surface road transport via The Professional Couriers. Shipments arrive safely within 2 to 4 days backed by our 100% Live Arrival Guarantee.</p>

      <h4>What are the delivery charges?</h4>
      <p>Kerala: ₹80 | Tamil Nadu & Karnataka: ₹120 | All other Indian states: ₹200. Orders above 10 pairs are charged 2X due to heavy dual-box packing.</p>

      <h4>What payment methods are supported?</h4>
      <p>We support all UPI Apps (Google Pay, PhonePe, Paytm, BHIM). You can simply scan the custom QR code or tap Pay at checkout and submit your 12-digit UTR reference ID.</p>
    `
  },
  {
    id: 'page-shipping-policy',
    slug: 'shipping-policy',
    title: 'Shipping Policy & Road Courier Rates',
    meta_title: 'Shipping Policy & Delivery Rates | Ra Guppy',
    meta_description: 'State-wise road courier delivery charges by The Professional Couriers across India for live fish consignments.',
    is_published: true,
    updated_at: '2026-03-20T10:00:00Z',
    content_html: `
      <h2>Reliable Road Courier Logistics across India</h2>
      <p>Live fish are delicate living animals requiring specialized transit. Ra Guppy partners exclusively with <strong>The Professional Couriers</strong> surface express road network to ensure safe, temperature-stable delivery across India.</p>
      <h3>State-Wise Delivery Rates:</h3>
      <ul>
        <li><strong>Kerala:</strong> ₹80 (Flat rate for up to 10 pairs)</li>
        <li><strong>Tamil Nadu & Karnataka:</strong> ₹120 (Flat rate for up to 10 pairs)</li>
        <li><strong>All Other Indian States:</strong> ₹200 (Flat rate for up to 10 pairs)</li>
        <li><em>Orders exceeding 10 pairs: 2X shipping rate for heavy double insulated packing.</em></li>
      </ul>
    `
  },
  {
    id: 'page-doa',
    slug: 'doa-policy',
    title: 'Live Arrival Guarantee & Dead-On-Arrival (DOA) Policy',
    meta_title: 'Live Arrival Guarantee & DOA Policy | Ra Guppy',
    meta_description: 'Complete details on our 100% Live Arrival Guarantee and Dead-On-Arrival unboxing policy.',
    is_published: true,
    updated_at: '2026-03-20T10:00:00Z',
    content_html: `
      <h2>100% Live Arrival Guarantee</h2>
      <p>Every single consignment shipped via our road courier service is fully covered by our comprehensive Live Arrival Guarantee.</p>
      <h3>Claiming DOA Coverage:</h3>
      <ul>
        <li>Notification must be submitted via WhatsApp within 2 hours of package delivery timestamp from The Professional Couriers.</li>
        <li>Include a continuous, unedited 30-second unboxing video clearly displaying the intact shipping label and unbroken inner plastic seal.</li>
      </ul>
    `
  }
];

export const INITIAL_COUPONS: Coupon[] = [
  {
    id: 'cp-01',
    code: 'AQUA10',
    description: 'Flat 10% discount on all fish and supplies',
    discount_type: 'percentage',
    discount_value: 10,
    min_order_amount: 500,
    max_discount: 500,
    is_active: true,
  },
  {
    id: 'cp-02',
    code: 'FIRSTFISH',
    description: 'Flat ₹200 OFF on your first aquatic order',
    discount_type: 'fixed',
    discount_value: 200,
    min_order_amount: 1200,
    is_active: true,
  },
  {
    id: 'cp-03',
    code: 'VIPGUPPY',
    description: 'Special 15% discount for orders above ₹3000',
    discount_type: 'percentage',
    discount_value: 15,
    min_order_amount: 3000,
    max_discount: 1000,
    is_active: true,
  },
  {
    id: 'cp-04',
    code: 'EXPIRED50',
    description: 'Expired test promotional discount',
    discount_type: 'percentage',
    discount_value: 50,
    min_order_amount: 500,
    expires_at: '2025-01-01T00:00:00Z',
    is_active: true,
  }
];

export const INITIAL_BLOG_POSTS: BlogPost[] = [
  {
    id: 'post-01',
    slug: 'mastering-pure-strain-guppy-care',
    title: 'Mastering Pure Strain Guppy Care: Water Chemistry, Mineral Hardness & Tank Conditions',
    excerpt: 'A complete scientific care guide to keeping pure strain Poecilia reticulata healthy. Learn optimal GH/KH mineral balance, biofiltration, temperature stability, and salt buffering.',
    featured_image: 'https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?auto=format&fit=crop&w=1200&q=80',
    category: 'Guppy Care & Water Quality',
    tags: ['Guppy Care', 'Water Chemistry', 'Mineral Hardness', 'Filtration'],
    author: {
      name: 'Rishan K.C.',
      role: 'Master Line Breeder & Founder',
      avatar: '/logo.jpeg',
    },
    read_time_minutes: 6,
    is_published: true,
    views_count: 1840,
    published_at: '2026-03-15T09:00:00Z',
    updated_at: '2026-03-20T11:30:00Z',
    meta_title: 'Mastering Pure Strain Guppy Care & Water Chemistry | RA Guppy',
    meta_description: 'Learn optimal water parameters for pure strain show guppies. Maintain proper GH, KH, pH, sponge filtration, and temperature stability.',
    content_html: `
      <h2>The Foundation of Pure Strain Guppy Health</h2>
      <p>Pure strain show guppies (<em>Poecilia reticulata</em>) — such as Electric Blue, Tiger Halfmoon, and Albino Full Red — possess delicate immune systems honed by generations of selective breeding. Unlike wild-type feeder guppies, fancy pedigree strains demand stable, mineral-rich water chemistry to maintain dorsal posture, intense iridescence, and robust fry survival.</p>

      <h3>1. General Hardness (GH) & Carbonate Hardness (KH)</h3>
      <p>Guppies are hard-water livebearers native to mineralized streams and coastal estuaries. In soft municipal water, their osmotic regulation suffers, leading to shimmies and clamped caudal fins.</p>
      <ul>
        <li><strong>Ideal GH:</strong> 10 to 18 dGH (180 to 320 ppm) to support bone calcification and fin-ray elasticity.</li>
        <li><strong>Ideal KH:</strong> 5 to 10 dKH to prevent sudden nighttime pH drops caused by plant respiration.</li>
        <li><strong>Ideal pH:</strong> 7.2 to 8.0 (slightly alkaline). Avoid water below 7.0 at all costs.</li>
        <li><strong>Temperature:</strong> 24°C to 27°C (75°F to 80°F) maintained with reliable thermostatic heaters.</li>
      </ul>

      <h3>2. Biological Sponge Filtration</h3>
      <p>High-flow powerheads tear show guppy caudal fins and exhaust breeding trios. Instead, dual-sponge air-driven bio-filters provide superior dissolved oxygenation, massive nitrifying surface area, and zero suction hazards for newborn fry.</p>

      <h3>3. Natural Electrolyte & Mineral Buffering</h3>
      <p>Adding natural rock salt (non-iodized) or trace aquarium salt at a concentration of <strong>1 tablespoon per 20 liters</strong> prevents velvet and epistylis while easing branchial gill respiration.</p>
    `
  },
  {
    id: 'post-02',
    slug: 'the-guppy-trio-breeding-system',
    title: 'The Guppy Trio Breeding System: Conditioning Show Pairs & Fry Nutrition',
    excerpt: 'Discover the 1-male-to-2-female breeding system used by championship hatcheries to preserve genetic purity, maximize brood vigor, and prevent female exhaustion.',
    featured_image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1200&q=80',
    category: 'Breeding & Genetics',
    tags: ['Guppy Breeding', 'Trio System', 'Fry Nutrition', 'Genetics'],
    author: {
      name: 'Rishan K.C.',
      role: 'Master Line Breeder & Founder',
      avatar: '/logo.jpeg',
    },
    read_time_minutes: 7,
    is_published: true,
    views_count: 2650,
    published_at: '2026-03-22T14:00:00Z',
    updated_at: '2026-03-24T08:15:00Z',
    meta_title: 'The Guppy Trio Breeding System & Fry Rearing | RA Guppy',
    meta_description: 'Championship line breeding guide: Trio ratio, gestation periods, gravid spot inspection, drop boxes, and early fry nourishment.',
    content_html: `
      <h2>Why Hatcheries Standardize on the Breeding Trio</h2>
      <p>Championship line breeding requires precise control over pedigree lineage. While single pairs can produce fertile broods, an active, mature male will continuously chase and stress a single gravid female. The standard <strong>1 Male to 2 Females (Trio)</strong> distributes male courtship pressure evenly and ensures regular birth cycles every 28 to 32 days.</p>

      <h3>Identifying the Gravid Spot & Labor Signs</h3>
      <p>As female guppies approach parturition, the dark gravid spot near the anal vent deepens into a rich black or amber-red (in albino strains). Key physical markers include:</p>
      <ul>
        <li>A distinct 'boxy' or squared-off silhouette in the lower abdomen.</li>
        <li>Rapid gill movement and hovering near the heater or floating plants.</li>
        <li>Hiding behavior away from dominant aquarium tankmates.</li>
      </ul>

      <h3>Fry Protection: Heavy Flora vs. Breeding Traps</h3>
      <p>Plastic confinement traps cause maternal stress and premature birthing of unhatched eggs. We advocate breeding inside dedicated 30-liter tanks densely carpeted with <strong>Guppy Grass (Najas guadalupensis)</strong> and floating <strong>Foxtail</strong>. Newborn fry instinctively swim upward into root mazes where adult fish cannot follow.</p>
    `
  },
  {
    id: 'post-03',
    slug: 'culturing-live-moina-artemia',
    title: 'Culturing Live Moina & Artemia: High-Protein Live Foods for Rapid Fry Growth',
    excerpt: 'How to culture live Moina macrocopa and hatch Baby Brine Shrimp (Artemia) at home. Provide rich lipids and essential fatty acids for fry color development.',
    featured_image: 'https://images.unsplash.com/photo-1534043464124-3be32fe000c9?auto=format&fit=crop&w=1200&q=80',
    category: 'Feeding & Live Foods',
    tags: ['Live Foods', 'Moina Culture', 'Baby Brine Shrimp', 'Fry Growth'],
    author: {
      name: 'Rishan K.C.',
      role: 'Master Line Breeder & Founder',
      avatar: '/logo.jpeg',
    },
    read_time_minutes: 8,
    is_published: true,
    views_count: 3410,
    published_at: '2026-03-28T16:30:00Z',
    updated_at: '2026-04-01T10:00:00Z',
    meta_title: 'Culturing Live Moina & Artemia for Guppy Fry | RA Guppy',
    meta_description: 'Step-by-step hatchery setup for Moina macrocopa and decapsulated Artemia cysts. Accelerate juvenile guppy development safely.',
    content_html: `
      <h2>The Critical First 30 Days of Growth</h2>
      <p>A guppy's final adult fin size and metallic coloration are fundamentally established in the first 30 days post-birth. Commercial micro-pellets provide basic calories, but only live micro-crustaceans trigger the aggressive hunting instinct and deliver un-denatured enzymes, astaxanthin, and polyunsaturated fatty acids.</p>

      <h3>1. Live Moina macrocopa: The Freshwater Miracle</h3>
      <p>Moina is smaller than standard Daphnia magna (approx 0.5mm to 1.2mm), making it the perfect mouth-size for 3-day-old fry. Unlike brine shrimp, Moina survives indefinitely in freshwater without polluting the tank.</p>
      <ul>
        <li><strong>Culture Vessel:</strong> Clean 20-liter plastic tub placed under 12 hours of indirect ambient light.</li>
        <li><strong>Food Source:</strong> Active baker's yeast solution or Chlorella greenwater fed lightly once daily.</li>
        <li><strong>Harvesting:</strong> Sieve through 150-micron mesh and rinse with conditioned water before feeding.</li>
      </ul>

      <h3>2. Hatching High-Vigor Baby Brine Shrimp (Artemia Nauplii)</h3>
      <p>Using cone hatchers with bubbling bottom aeration at 28°C and 25 ppt salinity (25g aquarium salt per liter), freshly hatched Artemia nauplii yield the highest digestible protein of any live feed. Feed within 6 hours of hatching while yolk sacs remain full.</p>
    `
  },
  {
    id: 'post-04',
    slug: 'planted-tanks-for-livebearers',
    title: 'Planted Tanks for Livebearers: Guppy Grass, Duckweed & Foxtail Benefits',
    excerpt: 'Natural bio-protection for guppy colonies. How fast-growing submerged and floating macrophytes strip dissolved nitrates, stabilize water, and safeguard newborn fry.',
    featured_image: 'https://images.unsplash.com/photo-1520302630591-fd1c66edc19d?auto=format&fit=crop&w=1200&q=80',
    category: 'Aquatic Plants & Aquascaping',
    tags: ['Guppy Grass', 'Foxtail', 'Duckweed', 'Livebearer Biotope'],
    author: {
      name: 'Rishan K.C.',
      role: 'Master Line Breeder & Founder',
      avatar: '/logo.jpeg',
    },
    read_time_minutes: 5,
    is_published: true,
    views_count: 2190,
    published_at: '2026-04-02T11:00:00Z',
    updated_at: '2026-04-04T12:00:00Z',
    meta_title: 'Planted Tanks for Livebearers: Guppy Grass & Floating Plants | RA Guppy',
    meta_description: 'Discover how Guppy Grass (Najas guadalupensis), Foxtail, and Duckweed create self-sustaining fry sanctuaries and absorb aquarium waste.',
    content_html: `
      <h2>The Nitrogen Sponge Strategy</h2>
      <p>Guppy colonies reproduce continuously, placing steady demands on biological nitrogen assimilation. While canister and sponge filters convert toxic ammonia to nitrate, fast-growing floating and columnar aquatic plants absorb ammonium and nitrates directly from the water column, preventing algae blooms and organ stress.</p>

      <h3>1. Guppy Grass (Najas guadalupensis)</h3>
      <p>The definitive livebearer plant. It requires no substrate planting — it can float freely in midwater, branching out rapidly under modest LED lighting. Its delicate interlocking stems create infinite micro-territories that shelter newborn fry while hosting microscopic infusoria for first-stage feeding.</p>

      <h3>2. Foxtail / Hornwort (Ceratophyllum demersum)</h3>
      <p>Densely arranged needle-whorls trap suspended particulates and release natural allelopathic compounds that suppress green water and hair algae. Foxtail is highly tolerant of moderate salt dosing (up to 3 tsp/gal).</p>

      <h3>3. Duckweed (Lemna minor)</h3>
      <p>A hyper-efficient surface macrophyte. Duckweed roots absorb heavy metals and excess phosphates while dimming intense light to reduce behavioral stress among mature breeding trios.</p>
    `
  },
  {
    id: 'post-05',
    slug: 'express-courier-guppy-acclimation',
    title: 'Express Courier Acclimation: Safe Drip Protocol for Live Shipments',
    excerpt: 'Protect your investment upon delivery. Our proven multi-stage drip acclimation procedure to prevent osmotic shock and pH swing after courier transit.',
    featured_image: 'https://images.unsplash.com/photo-1516684732162-798a0062be99?auto=format&fit=crop&w=1200&q=80',
    category: 'Acclimation & Fish Health',
    tags: ['Acclimation', 'Live Arrival Guarantee', 'Drip Method', 'Transit Recovery'],
    author: {
      name: 'Rishan K.C.',
      role: 'Master Line Breeder & Founder',
      avatar: '/logo.jpeg',
    },
    read_time_minutes: 6,
    is_published: true,
    views_count: 2890,
    published_at: '2026-04-05T10:00:00Z',
    updated_at: '2026-04-08T14:00:00Z',
    meta_title: 'Express Courier Live Guppy Drip Acclimation Guide | RA Guppy',
    meta_description: 'Follow our step-by-step acclimation protocol for live fish shipments. Minimize transit stress, protect delicate finnage, and ensure 100% survival.',
    content_html: `
      <h2>The Critical 60 Minutes After Unboxing</h2>
      <p>At RA Guppy, all consignments are packed in heavy-duty double polythene pouches pressurized with medical-grade 99.5% oxygen inside high-density insulated thermocol containers. During transit, carbon dioxide accumulates in the bag water, driving the pH down and rendering waste ammonia into non-toxic ammonium (NH4+).</p>

      <p><strong>The Danger Window:</strong> Once you open the pouch, dissolved CO2 immediately escapes into the air, raising the pH. As pH rises above 7.0, non-toxic ammonium rapidly converts into toxic free ammonia (NH3). Fast, systematic acclimation is vital.</p>

      <h3>Step 1: Thermal Float (20 Minutes)</h3>
      <p>Float the unopened pouch in your quarantine or destination aquarium for 20 minutes to equalize water temperature gradually.</p>

      <h3>Step 2: Drip Siphon Transition (30-40 Minutes)</h3>
      <p>Gently pour the fish and transit water into a clean 5-liter bucket. Using airline tubing with a flow control regulator, initiate a drip from the main tank at <strong>2 to 4 drops per second</strong>. Allow the volume in the bucket to double, then discard half the water and drip-fill again.</p>

      <h3>Step 3: Transfer Without Transit Water</h3>
      <p>Using a soft nylon net, gently lift the guppies from the bucket and place them into the aquarium. <strong>Never pour courier transit water into your aquarium.</strong> Keep lighting dimmed for the initial 8 hours to minimize stress.</p>

      <blockquote>
        "Our 100% Live Arrival Guarantee ensures your fish reach you in prime vitality. Proper drip acclimation guarantees they flourish for years in your home aquarium." — Rishan K.C.
      </blockquote>
    `
  }
];

export const INITIAL_MEDIA_ASSETS: MediaAsset[] = [
  {
    id: 'med-01',
    filename: 'hero-guppy-specimen.jpg',
    url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1600&q=85',
    alt_text: 'Show-class Pure Strain Guppy pair swimming in planted display aquarium',
    file_size_bytes: 342100,
    mime_type: 'image/jpeg',
    category: 'banner',
    created_at: '2026-03-01T10:00:00Z',
  },
  {
    id: 'med-02',
    filename: 'facility-breeding-tanks.jpg',
    url: 'https://images.unsplash.com/photo-1534043464124-3be32fe000c9?auto=format&fit=crop&w=1200&q=80',
    alt_text: 'Indoor climate-controlled pure strain Guppy breeding tank system in RA Guppy facility',
    file_size_bytes: 412800,
    mime_type: 'image/jpeg',
    category: 'breeder',
    created_at: '2026-03-02T11:30:00Z',
  },
  {
    id: 'med-03',
    filename: 'electric-blue-guppy-detail.jpg',
    url: 'https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?auto=format&fit=crop&w=1200&q=80',
    alt_text: 'Electric Blue Pure Strain Guppy with intense cyan metallic iridescence',
    file_size_bytes: 289400,
    mime_type: 'image/jpeg',
    category: 'specimen',
    created_at: '2026-03-05T09:15:00Z',
  },
  {
    id: 'med-04',
    filename: 'logo-fish.svg',
    url: '/logo-fish.svg',
    alt_text: 'Brand emblem with stylized fish icon',
    file_size_bytes: 4200,
    mime_type: 'image/svg+xml',
    category: 'ui',
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'med-04b',
    filename: 'logo.jpeg',
    url: '/logo.jpeg',
    alt_text: 'Ra Guppy custom primary logo',
    file_size_bytes: 111539,
    mime_type: 'image/jpeg',
    category: 'ui',
    created_at: '2026-10-18T13:53:48Z',
  },
  {
    id: 'med-05',
    filename: 'anubias-planted-aquascape.jpg',
    url: 'https://images.unsplash.com/photo-1520302630591-fd1c66edc19d?auto=format&fit=crop&w=1200&q=80',
    alt_text: 'Anubias and submerged tropical aquarium plants anchored on natural driftwood',
    file_size_bytes: 367900,
    mime_type: 'image/jpeg',
    category: 'banner',
    created_at: '2026-03-10T14:20:00Z',
  },
  {
    id: 'med-06',
    filename: 'green-platinum-guppy.jpg',
    url: 'https://images.unsplash.com/photo-1516684732162-798a0062be99?auto=format&fit=crop&w=1200&q=80',
    alt_text: 'Green Platinum pure strain show guppy with full-body emerald metallic sheen',
    file_size_bytes: 312500,
    mime_type: 'image/jpeg',
    category: 'specimen',
    created_at: '2026-03-14T16:00:00Z',
  },
  {
    id: 'med-07',
    filename: 'royal-blue-guppy-swimming.mp4',
    url: '/videos/guppy-120.mp4',
    thumbnail_url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80',
    alt_text: 'High-definition 1080p swimming footage of pure strain show guppy actively swimming in planted biotope',
    file_size_bytes: 14200000,
    mime_type: 'video/mp4',
    category: 'video',
    duration_seconds: 14,
    dimensions: { width: 1920, height: 1080 },
    created_at: '2026-03-15T11:00:00Z',
  },
  {
    id: 'med-08',
    filename: 'planted-aquarium-ambient-showcase.mp4',
    url: '/videos/guppy-pair-120.mp4',
    thumbnail_url: 'https://images.unsplash.com/photo-1520302630591-fd1c66edc19d?auto=format&fit=crop&w=1200&q=80',
    alt_text: 'Ambient planted aquarium tank loop with gentle water flow and schooling fish',
    file_size_bytes: 21500000,
    mime_type: 'video/mp4',
    category: 'video',
    duration_seconds: 22,
    dimensions: { width: 1920, height: 1080 },
    created_at: '2026-03-16T15:30:00Z',
  },
  {
    id: 'med-vid-01',
    filename: 'guppy-strain-100.mp4',
    url: '/videos/green-tail-100.mp4',
    thumbnail_url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80',
    alt_text: 'Active Pure Strain Show Guppy Swimming Video',
    file_size_bytes: 4706838,
    mime_type: 'video/mp4',
    category: 'video',
    duration_seconds: 15,
    created_at: '2026-10-18T14:30:00Z',
  },
  {
    id: 'med-vid-02',
    filename: 'guppy-pair-250.mp4',
    url: '/videos/guppy-pair-120.mp4',
    thumbnail_url: 'https://images.unsplash.com/photo-1534043464124-3be32fe000c9?auto=format&fit=crop&w=800&q=80',
    alt_text: 'Selected Show Guppy Pair Swimming Video',
    file_size_bytes: 915905,
    mime_type: 'video/mp4',
    category: 'video',
    duration_seconds: 12,
    created_at: '2026-10-18T14:30:00Z',
  },
  {
    id: 'med-vid-03',
    filename: 'guppy-trio-350.mp4',
    url: '/videos/guppy-800.mp4',
    thumbnail_url: 'https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?auto=format&fit=crop&w=800&q=80',
    alt_text: 'Show Guppy Trio Demonstration Video',
    file_size_bytes: 2446150,
    mime_type: 'video/mp4',
    category: 'video',
    duration_seconds: 18,
    created_at: '2026-10-18T14:30:00Z',
  },
  {
    id: 'med-vid-04',
    filename: 'green-tail-100.mp4',
    url: '/videos/green-tail-100.mp4',
    thumbnail_url: 'https://images.unsplash.com/photo-1520302630591-fd1c66edc19d?auto=format&fit=crop&w=800&q=80',
    alt_text: 'Green Tail Pure Strain Guppy Swimming Video',
    file_size_bytes: 484407,
    mime_type: 'video/mp4',
    category: 'video',
    duration_seconds: 10,
    created_at: '2026-10-18T14:30:00Z',
  },
  {
    id: 'med-vid-05',
    filename: 'guppy-pair-120.mp4',
    url: '/videos/guppy-pair-120.mp4',
    thumbnail_url: 'https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?auto=format&fit=crop&w=800&q=80',
    alt_text: 'Guppy Pair Swimming & Courtship Video',
    file_size_bytes: 513572,
    mime_type: 'video/mp4',
    category: 'video',
    duration_seconds: 12,
    created_at: '2026-10-18T14:30:00Z',
  },
  {
    id: 'med-vid-06',
    filename: 'guppy-120.mp4',
    url: '/videos/guppy-120.mp4',
    thumbnail_url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80',
    alt_text: 'Delta Tail Guppy Active Swimming Video',
    file_size_bytes: 463988,
    mime_type: 'video/mp4',
    category: 'video',
    duration_seconds: 11,
    created_at: '2026-10-18T14:30:00Z',
  },
  {
    id: 'med-vid-07',
    filename: 'guppy-150.mp4',
    url: '/videos/guppy-150.mp4',
    thumbnail_url: 'https://images.unsplash.com/photo-1516684732162-798a0062be99?auto=format&fit=crop&w=800&q=80',
    alt_text: 'Select Grade Exotic Guppy Swimming Footage',
    file_size_bytes: 443294,
    mime_type: 'video/mp4',
    category: 'video',
    duration_seconds: 10,
    created_at: '2026-10-18T14:30:00Z',
  },
  {
    id: 'med-vid-08',
    filename: 'guppy-45.mp4',
    url: '/videos/guppy-45.mp4',
    thumbnail_url: 'https://images.unsplash.com/photo-1579273166152-d725a4e2b755?auto=format&fit=crop&w=800&q=80',
    alt_text: 'Community Tank Guppy Active Swimming Video',
    file_size_bytes: 570832,
    mime_type: 'video/mp4',
    category: 'video',
    duration_seconds: 13,
    created_at: '2026-10-18T14:30:00Z',
  },
  {
    id: 'med-vid-09',
    filename: 'guppy-800.mp4',
    url: '/videos/guppy-800.mp4',
    thumbnail_url: 'https://images.unsplash.com/photo-1534043464124-3be32fe000c9?auto=format&fit=crop&w=800&q=80',
    alt_text: 'Collector Champion Guppy Pair Swimming Video',
    file_size_bytes: 1513566,
    mime_type: 'video/mp4',
    category: 'video',
    duration_seconds: 25,
    created_at: '2026-10-18T14:30:00Z',
  },
  {
    id: 'med-vid-10',
    filename: 'zebra-5pair-150.mp4',
    url: '/videos/zebra-5pair-150.mp4',
    thumbnail_url: 'https://images.unsplash.com/photo-1544943910-4c1dc44a0558?auto=format&fit=crop&w=800&q=80',
    alt_text: 'Zebra Danio Schooling Pack Active Swimming Video',
    file_size_bytes: 6753113,
    mime_type: 'video/mp4',
    category: 'video',
    duration_seconds: 40,
    created_at: '2026-10-18T14:30:00Z',
  }
];

