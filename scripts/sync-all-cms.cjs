const { Client } = require('pg');

async function main() {
  const client = new Client({
    connectionString: 'postgresql://postgres:raguppies00rishan123@db.mprdfatnknkjohddlaza.supabase.co:5432/postgres',
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();

  console.log('Synchronizing comprehensive homepage sections and CMS pages...');

  // 1. Get current hero title if user edited it
  let heroTitle = 'Premium Lineage Guppies & Exotic Show Guppies';
  const currentSectionsRes = await client.query(`SELECT value FROM store_settings WHERE key = 'homepage_sections'`);
  if (currentSectionsRes.rows[0]?.value) {
    const hero = currentSectionsRes.rows[0].value.find(s => s.type === 'hero');
    if (hero?.title) {
      heroTitle = hero.title;
      console.log('Preserving user-edited hero title:', heroTitle);
    }
  }

  // 2. Comprehensive 10-section homepage list including all old and new sections
  const comprehensiveSections = [
    {
      id: 'sec-hero',
      type: 'hero',
      title: heroTitle,
      subtitle: 'Exclusive live specimen consignments dispatched direct from Kerala & Tamil Nadu sanctuary across India.',
      is_active: true,
      display_order: 1,
      config: {
        badge: 'Spring 2026 Season Brood Live',
        badge_text: 'Spring 2026 Season Brood Live',
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
      title: 'Specimen of the Week: Show Pairs',
      subtitle: 'Limited availability authentic breeding pairs ready for immediate express road dispatch.',
      is_active: true,
      display_order: 3,
      config: {
        endTimeHours: 18,
        bannerText: 'Limited Stock - 1 Pair Each',
      }
    },
    {
      id: 'sec-specimen-showcase',
      type: 'specimen_showcase',
      title: 'Current Live Consignment Gallery',
      subtitle: 'WYSIWYG: The exact fish displayed in high-definition video is the exact specimen shipped.',
      is_active: true,
      display_order: 4,
      config: {
        filterCategory: 'cat-guppy',
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
        filterCategory: 'guppies',
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

  // Update store_settings.homepage_sections
  await client.query(`
    INSERT INTO store_settings (key, value, description, updated_at)
    VALUES ('homepage_sections', $1, 'Global dynamic homepage sections layout and configs', NOW())
    ON CONFLICT (key) DO UPDATE
    SET value = EXCLUDED.value, updated_at = NOW();
  `, [JSON.stringify(comprehensiveSections)]);
  console.log('✓ store_settings.homepage_sections updated with all 10 sections');

  // Sync to homepage_sections table
  for (const s of comprehensiveSections) {
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
  console.log('✓ homepage_sections table populated with all 10 sections');

  // 3. Comprehensive CMS Pages (all 5 pages so all footer/header links work)
  const comprehensivePages = [
    {
      id: 'page-shipping-acclimation',
      slug: 'shipping-acclimation',
      title: 'Live Fish Shipping & Acclimation Guide',
      meta_title: 'Live Fish Shipping & Acclimation Guide | Ra Guppy',
      meta_description: 'Step-by-step float and drip acclimation guide and Live Arrival Guarantee policy for ornamental fish.',
      is_published: true,
      updated_at: new Date().toISOString(),
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
      meta_description: 'Learn about India\'s premier specialized pure strain guppy breeding sanctuary.',
      is_published: true,
      updated_at: new Date().toISOString(),
      content_html: `
        <h2>Ethical Aquaculture & Passion for Living Jewels</h2>
        <p>Founded by passionate aquatic breeders and biological researchers, <strong>Ra Guppy</strong> was born out of a single mission: to provide the highest-grade pure strain Guppies, championship breeding pairs, and exotic freshwater specimens across India.</p>
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
      updated_at: new Date().toISOString(),
      content_html: `
        <h2>Ordering & Delivery Questions</h2>
        <h4>How long does delivery take?</h4>
        <p>We ship live ornamental fish strictly across India using specialized surface road transport via The Professional Couriers. Shipments arrive safely within 2 to 4 days backed by our 100% Live Arrival Guarantee.</p>

        <h4>What are the delivery charges?</h4>
        <p>Kerala: ₹80 | Tamil Nadu & Karnataka: ₹120 | All other Indian states: ₹200. Orders above 10 pairs are charged 2X due to heavy dual-box packing.</p>

        <h4>What payment methods are supported?</h4>
        <p>We support all UPI Apps (Google Pay, PhonePe, Paytm, BHIM) and Direct Bank Transfer. You can simply scan the custom QR code at checkout and submit your 12-digit UTR reference ID.</p>
      `
    },
    {
      id: 'page-shipping-policy',
      slug: 'shipping-policy',
      title: 'Shipping Policy & Road Courier Rates',
      meta_title: 'Shipping Policy & Delivery Rates | Ra Guppy',
      meta_description: 'State-wise road courier delivery charges by The Professional Couriers across India for live fish consignments.',
      is_published: true,
      updated_at: new Date().toISOString(),
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
      updated_at: new Date().toISOString(),
      content_html: `
        <h2>100% Live Arrival Guarantee</h2>
        <p>Every single consignment shipped via our road courier service is fully covered by our comprehensive Live Arrival Guarantee.</p>
        <h3>Claiming DOA Coverage:</h3>
        <ol>
          <li>Record an uncut, continuous unboxing video showing the sealed parcel and shipping label.</li>
          <li>WhatsApp the video to <strong>+91 98765 43210</strong> within <strong>2 hours</strong> of parcel delivery.</li>
        </ol>
      `
    }
  ];

  // Update store_settings.cms_pages
  await client.query(`
    INSERT INTO store_settings (key, value, description, updated_at)
    VALUES ('cms_pages', $1, 'Active CMS pages catalog', NOW())
    ON CONFLICT (key) DO UPDATE
    SET value = EXCLUDED.value, updated_at = NOW();
  `, [JSON.stringify(comprehensivePages)]);
  console.log('✓ store_settings.cms_pages updated with all 5 pages');

  // Sync to cms_pages table
  for (const p of comprehensivePages) {
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
  console.log('✓ cms_pages table populated with all 5 pages');

  await client.end();
  console.log('\nAll comprehensive CMS sections and pages synchronized in Supabase!');
}

main().catch(console.error);
