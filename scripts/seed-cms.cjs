const { Client } = require('pg');

async function main() {
  const client = new Client({
    connectionString: 'postgresql://postgres:raguppies00rishan123@db.mprdfatnknkjohddlaza.supabase.co:5432/postgres',
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();

  console.log('Seeding initial homepage sections and CMS pages into Supabase...');

  // 1. Initial Homepage Sections
  const initialSections = [
    {
      id: 'sec-hero-01',
      type: 'hero',
      title: 'Pure Strain Guppies & Exotic Breeding Pairs',
      subtitle: 'Exclusive live specimen consignments dispatched direct from Kerala & Tamil Nadu sanctuary across India.',
      is_active: true,
      display_order: 1,
      config: {
        badge: 'Spring 2026 Season Brood Live',
        cta_text: 'Explore Rare Strains',
        cta_link: '/shop',
        secondary_cta_text: 'Live Stock Video',
        secondary_cta_link: '/live-stock',
        background_image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=2000&q=85',
        height: 'large',
        overlay_opacity: 60,
      }
    },
    {
      id: 'sec-categories-02',
      type: 'categories',
      title: 'Shop By Pure Strain Bloodline',
      subtitle: 'Certified healthy pedigree genetics with comprehensive live arrival warranty.',
      is_active: true,
      display_order: 2,
      config: {
        layout: 'grid',
        show_counts: true,
        max_items: 8,
      }
    },
    {
      id: 'sec-flash-03',
      type: 'flash_deal',
      title: 'Specimen of the Week',
      subtitle: 'Limited availability authentic breeding pairs ready for immediate express road dispatch.',
      is_active: true,
      display_order: 3,
      config: {
        countdown_end: new Date(Date.now() + 86400000 * 5).toISOString(),
        discount_badge: '15% Off Pure Pair',
        product_id: 'prod-002',
      }
    },
    {
      id: 'sec-showcase-04',
      type: 'specimen_showcase',
      title: 'Current Live Consignment Gallery',
      subtitle: 'WYSIWYG: The exact fish displayed in high-definition video is the exact specimen shipped.',
      is_active: true,
      display_order: 4,
      config: {
        filter: 'featured',
        items_count: 8,
        show_video_badge: true,
        allow_quick_view: true,
      }
    },
    {
      id: 'sec-breeder-05',
      type: 'breeder_story',
      title: 'Our Breeding & Quarantine Standards',
      subtitle: 'Three generations of meticulous selective breeding, 21-day quarantine protocols, and live dispatch.',
      is_active: true,
      display_order: 5,
      config: {
        image_url: 'https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?auto=format&fit=crop&w=1200&q=80',
        quote: 'We never compromise on live fish safety: every specimen is starved for 24h, packed in medical-grade oxygen, and dispatched via The Professional Couriers surface express.',
        author: 'Ra Guppy Master Breeder Team',
      }
    },
    {
      id: 'sec-trust-06',
      type: 'trust_badges',
      title: 'Why Hobbyists Choose Ra Guppy',
      subtitle: 'Built on trust, bio-security, and unmatched specimen quality.',
      is_active: true,
      display_order: 6,
      config: {
        badges: [
          { icon: 'ShieldCheck', title: '100% Live Arrival Guarantee', desc: 'Unconditional replacement or refund if any mortality occurs during road transport' },
          { icon: 'Truck', title: 'The Professional Couriers Express', desc: 'Fast surface road courier across Kerala (₹80), TN & KA (₹120), and all other states (₹200)' },
          { icon: 'Award', title: 'Genetic Purity Assured', desc: 'True breeding pairs and show class males bred strictly from champion pedigree bloodlines' },
          { icon: 'Headphones', title: 'Lifelong Hobbyist Support', desc: 'Direct WhatsApp acclimation consultation with our senior aquatic biologists' },
        ]
      }
    },
    {
      id: 'sec-reviews-07',
      type: 'testimonials',
      title: 'Customer Feedback & Unboxing Stories',
      subtitle: 'Read genuine reviews from hobbyists across India.',
      is_active: true,
      display_order: 7,
      config: {
        max_reviews: 6,
        auto_rotate: true,
      }
    }
  ];

  // 1a. Insert into store_settings key: 'homepage_sections'
  await client.query(`
    INSERT INTO store_settings (key, value, description, updated_at)
    VALUES ('homepage_sections', $1, 'Active homepage sections configuration', NOW())
    ON CONFLICT (key) DO UPDATE
    SET value = EXCLUDED.value, updated_at = NOW();
  `, [JSON.stringify(initialSections)]);
  console.log('✓ store_settings.homepage_sections synced');

  // 1b. Insert into homepage_sections table
  for (const s of initialSections) {
    await client.query(`
      INSERT INTO homepage_sections (id, section_type, title, subtitle, config_json, display_order, is_active, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      ON CONFLICT (id) DO UPDATE
      SET section_type = EXCLUDED.section_type,
          title = EXCLUDED.title,
          subtitle = EXCLUDED.subtitle,
          config_json = EXCLUDED.config_json,
          display_order = EXCLUDED.display_order,
          is_active = EXCLUDED.is_active;
    `, [s.id, s.type, s.title, s.subtitle || '', JSON.stringify(s.config || {}), s.display_order, s.is_active]);
  }
  console.log('✓ homepage_sections table populated with', initialSections.length, 'sections');

  // 2. Initial CMS Pages
  const initialPages = [
    {
      id: 'page-about-us',
      slug: 'about-us',
      title: 'About Ra Guppy',
      content_html: `
        <h2>India's Premier Sanctuary for Championship Bloodline Guppies & Breeding Pairs</h2>
        <p>Founded by passionate aquatic hobbyists, Ra Guppy represents three generations of selective breeding excellence. Based in South India, we breed, condition, and safely dispatch pure strain Guppies, breeding pairs, and exotic freshwater specimens directly to hobbyists across India.</p>
        <h3>Our Bio-Security & Acclimation Protocol</h3>
        <p>Every specimen undergoes a stringent 21-day quarantine regimen in conditioned Indian softwater tanks before being certified fit for consignment dispatch. We guarantee vibrant finnage, voracious feeding appetite, and absolute disease freedom.</p>
        <h3>Safe Live Transit via The Professional Couriers</h3>
        <p>We pack our live fish in double-layered rounded oxygen-pressurized polythene bags, nestled in 25mm high-density thermocol insulated boxes with climate control gel packs.</p>
      `,
      meta_title: 'About Ra Guppy | Premier Pure Strain Guppy Breeding Sanctuary',
      meta_description: 'Discover the story behind Ra Guppy, India\'s trusted source for pure strain guppies and breeding pairs.',
      is_published: true,
      updated_at: new Date().toISOString()
    },
    {
      id: 'page-shipping',
      slug: 'shipping-policy',
      title: 'Shipping Policy & Road Courier Rates',
      content_html: `
        <h2>Reliable Road Courier Logistics across India</h2>
        <p>Live fish are delicate living animals requiring specialized transit. Ra Guppy partners exclusively with <strong>The Professional Couriers</strong> surface express road network to ensure safe, temperature-stable delivery across India.</p>
        <h3>State-Wise Delivery Rates:</h3>
        <ul>
          <li><strong>Kerala:</strong> ₹80 (Flat rate for up to 10 pairs)</li>
          <li><strong>Tamil Nadu & Karnataka:</strong> ₹120 (Flat rate for up to 10 pairs)</li>
          <li><strong>All Other Indian States:</strong> ₹200 (Flat rate for up to 10 pairs)</li>
        </ul>
        <p><em>* Bulk orders exceeding 10 pairs are charged 2X shipping to cover heavy insulated dual-box packaging.</em></p>
        <h3>Dispatch Schedules</h3>
        <p>To avoid parcel hold-ups at courier transit hubs over weekends, all live fish consignments are dispatched strictly on <strong>Mondays, Tuesdays, and Wednesdays</strong>.</p>
      `,
      meta_title: 'Shipping Policy & Delivery Rates | Ra Guppy',
      meta_description: 'State-wise road courier delivery charges by The Professional Couriers across India for live fish consignments.',
      is_published: true,
      updated_at: new Date().toISOString()
    },
    {
      id: 'page-doa',
      slug: 'doa-policy',
      title: 'Live Arrival Guarantee & Dead-On-Arrival (DOA) Policy',
      content_html: `
        <h2>100% Live Arrival Guarantee</h2>
        <p>At Ra Guppy, customer satisfaction and fish health are paramount. Every single consignment shipped via our road courier service is fully covered by our comprehensive Live Arrival Guarantee.</p>
        <h3>Claiming DOA Coverage</h3>
        <ol>
          <li>Record a clear, unedited continuous video of the sealed unboxing showing the parcel shipping label and the intact outer tape.</li>
          <li>In the rare event of mortality, show the unopened fish bag with the intact rubber-band seal.</li>
          <li>WhatsApp the unboxing video and clear photos to our dedicated care line <strong>+91 98765 43210</strong> within <strong>2 hours</strong> of parcel delivery.</li>
        </ol>
        <p>Upon verification, we will immediately provide an unconditional replacement on your next dispatch or issue a full credit refund.</p>
      `,
      meta_title: 'Live Arrival Guarantee & DOA Policy | Ra Guppy',
      meta_description: 'Complete details on our 100% Live Arrival Guarantee and Dead-On-Arrival unboxing policy.',
      is_published: true,
      updated_at: new Date().toISOString()
    }
  ];

  // 2a. Insert into store_settings key: 'cms_pages'
  await client.query(`
    INSERT INTO store_settings (key, value, description, updated_at)
    VALUES ('cms_pages', $1, 'Active CMS pages catalog', NOW())
    ON CONFLICT (key) DO UPDATE
    SET value = EXCLUDED.value, updated_at = NOW();
  `, [JSON.stringify(initialPages)]);
  console.log('✓ store_settings.cms_pages synced');

  // 2b. Insert into cms_pages table
  for (const p of initialPages) {
    await client.query(`
      INSERT INTO cms_pages (id, slug, title, content_html, meta_title, meta_description, is_published, published_at, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW(), NOW())
      ON CONFLICT (slug) DO UPDATE
      SET title = EXCLUDED.title,
          content_html = EXCLUDED.content_html,
          meta_title = EXCLUDED.meta_title,
          meta_description = EXCLUDED.meta_description,
          is_published = EXCLUDED.is_published,
          updated_at = NOW();
    `, [p.id, p.slug, p.title, p.content_html, p.meta_title, p.meta_description, p.is_published]);
  }
  console.log('✓ cms_pages table populated with', initialPages.length, 'pages');

  await client.end();
  console.log('\nAll CMS data successfully seeded into Supabase database!');
}

main().catch(console.error);
