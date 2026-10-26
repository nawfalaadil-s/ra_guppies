-- RA GUPPY: SEED DATA SCRIPT
-- Categories, Bestsellers, Rare Guppy Breeding Pairs, Store Settings, CMS Pages

-- 1. INSERT CATEGORIES
INSERT INTO public.categories (id, name, slug, description, image_url, display_order, is_active)
VALUES
  ('c1111111-1111-1111-1111-111111111101', 'Pure Strain Guppies', 'guppy-fish', 'Exquisite Halfmoon, Crowntail, Plakat & Rare Giant Guppys sourced from champion bloodlines.', 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=600&q=80', 1, true),
  ('c1111111-1111-1111-1111-111111111102', 'Guppies & Livebearers', 'guppies', 'Pure strain Albino Full Red, Dumbo Ear Mosaic, and Blue Dragon imported guppy pairs.', 'https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?auto=format&fit=crop&w=600&q=80', 2, true),
  ('c1111111-1111-1111-1111-111111111103', 'Breeding Pairs & Rare Strains', 'breeding-pairs', 'Carefully conditioned, proven fertile breeding pairs with lineage certificates.', 'https://images.unsplash.com/photo-1534043464124-3be32fe000c9?auto=format&fit=crop&w=600&q=80', 3, true),
  ('c1111111-1111-1111-1111-111111111104', 'Aquatic Plants & Aquascaping', 'aquatic-plants', 'Snail-free, tissue-cultured and submerged aquatic plants for lush natural aquascapes.', 'https://images.unsplash.com/photo-1520302630591-fd1c66edc19d?auto=format&fit=crop&w=600&q=80', 4, true),
  ('c1111111-1111-1111-1111-111111111105', 'Premium Fish Food', 'fish-food', 'High-protein micro pellets, freeze-dried bloodworms, and color-enhancing spirulina feeds.', 'https://images.unsplash.com/photo-1516684732162-798a0062be99?auto=format&fit=crop&w=600&q=80', 5, true),
  ('c1111111-1111-1111-1111-111111111106', 'Aquarium Care & Accessories', 'accessories', 'Gentle sponge filters, Guppy breeding traps, Indian almond leaves, and water conditioners.', 'https://images.unsplash.com/photo-1544943910-4c1dc44a0558?auto=format&fit=crop&w=600&q=80', 6, true)
ON CONFLICT (slug) DO NOTHING;

-- 2. INSERT STORE SETTINGS
INSERT INTO public.store_settings (key, value, description)
VALUES
  ('brand_info', '{
    "brand_name": "RA GUPPY",
    "tagline": "India’s Premier Ornamental Fish Sanctuary",
    "contact_email": "care@raguppies.in",
    "contact_phone": "+91 98765 43210",
    "whatsapp_number": "919876543210"
  }', 'Store brand and contact details'),
  ('payment_settings', '{
    "upi_id": "rishankc75@okicici",
    "upi_payee_name": "RA GUPPY Private Limited",
    "bank_name": "ICICI Bank",
    "bank_account_no": "002405009988",
    "bank_ifsc": "ICIC0000024",
    "bank_account_holder": "RA GUPPY Pvt Ltd"
  }', 'Payment details for manual verification'),
  ('shipping_settings', '{
    "free_shipping_threshold": 1999,
    "standard_shipping_rate": 199,
    "live_packing_charge": 149,
    "announcement_text": "FLAT 10% OFF on all Premium Guppies! Use Code: AQUA10 at checkout | Free Oxygen Packing over ₹1999",
    "announcement_code": "AQUA10",
    "announcement_active": true,
    "maintenance_mode": false
  }', 'Shipping, packing, and announcement banner rules')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
