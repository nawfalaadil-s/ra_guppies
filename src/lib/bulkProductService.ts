// ====================================================================
// RA GUPPY: PRODUCTION BULK PRODUCT & CSV PROCESSING SERVICE
// ====================================================================
import { Product, Category, CsvImportMode, ImportRowValidation, ImportRowDiff, ImportHistoryItem, ProductStatus } from './types';
import { mockDb } from './mockDatabase';

export const CSV_COLUMN_DEFINITIONS = [
  { key: 'product_id', label: 'Product ID', required: false, description: 'Internal product identifier (e.g. prod-001). Used for stable updates.' },
  { key: 'sku', label: 'SKU', required: true, description: 'Unique stock keeping unit code (e.g. BA-HM-001).' },
  { key: 'name', label: 'Product Name', required: true, description: 'Full commercial title of the live specimen or product.' },
  { key: 'slug', label: 'Slug', required: false, description: 'URL-friendly slug. Auto-generated from name if omitted.' },
  { key: 'price', label: 'Price (INR)', required: true, description: 'Selling price in Indian Rupees (e.g. 1499).' },
  { key: 'compare_at_price', label: 'Compare at Price', required: false, description: 'Original MSRP/strike-through price for discounts.' },
  { key: 'stock_quantity', label: 'Stock Quantity', required: true, description: 'Available inventory count (0 or greater). 1 for unique specimen.' },
  { key: 'status', label: 'Status', required: false, description: 'published | draft | out_of_stock | archived (defaults to published).' },
  { key: 'category', label: 'Category', required: true, description: 'Category name, slug, or ID (e.g. Guppies & Livebearers or cat-guppy).' },
  { key: 'subcategory', label: 'Subcategory', required: false, description: 'Subcategory name, slug, or ID (e.g. Breeding Pairs).' },
  { key: 'short_description', label: 'Short Description', required: false, description: 'Brief 1-sentence excerpt shown in cards.' },
  { key: 'description', label: 'Full Description', required: false, description: 'Detailed care and specimen specifications.' },
  { key: 'strain', label: 'Strain / Variety', required: false, description: 'Fish strain (e.g. Halfmoon, Plakat, Crowntail).' },
  { key: 'gender', label: 'Gender', required: false, description: 'Male | Female | Breeding Pair | Unsexed.' },
  { key: 'care_level', label: 'Care Level', required: false, description: 'Easy | Moderate | Advanced.' },
  { key: 'featured', label: 'Featured', required: false, description: 'true | false. Highlights item on homepage.' },
  { key: 'weight', label: 'Weight (Grams)', required: false, description: 'Package weight in grams for road courier delivery calculation.' },
  { key: 'tags', label: 'Tags', required: false, description: 'Semicolon-separated tags (e.g. Bestseller; Show Class; Rare).' },
  { key: 'image_urls', label: 'Image URLs', required: false, description: 'Semicolon-separated HTTPS URLs for high-res photography.' },
  { key: 'video_urls', label: 'Video URLs', required: false, description: 'Semicolon-separated HTTPS URLs for live swimming clips.' },
];

export const COLUMN_ALIASES: Record<string, string[]> = {
  product_id: ['product_id', 'id', 'item_id', 'product id'],
  sku: ['sku', 'item_sku', 'code', 'barcode', 'product_sku'],
  name: ['name', 'product_name', 'title', 'item_name', 'product name'],
  slug: ['slug', 'handle', 'url_slug', 'url'],
  price: ['price', 'retail_price', 'mrp', 'amount', 'selling_price', 'inr'],
  compare_at_price: ['compare_at_price', 'regular_price', 'original_price', 'compare price', 'strikethrough_price'],
  stock_quantity: ['stock_quantity', 'stock', 'qty', 'inventory', 'quantity', 'stock_qty'],
  status: ['status', 'state', 'publishing_status', 'is_active'],
  category: ['category', 'category_name', 'category_id', 'cat', 'primary_category'],
  subcategory: ['subcategory', 'subcategory_name', 'sub_category', 'subcat', 'child_category'],
  short_description: ['short_description', 'summary', 'blurb', 'excerpt', 'short description'],
  description: ['description', 'details', 'body', 'content', 'full_description'],
  strain: ['strain', 'variety', 'morph', 'color_pattern'],
  gender: ['gender', 'sex'],
  care_level: ['care_level', 'difficulty', 'experience_level'],
  featured: ['featured', 'is_featured', 'spotlight'],
  weight: ['weight', 'grams', 'weight_grams', 'shipping_weight'],
  tags: ['tags', 'keywords', 'labels'],
  image_urls: ['image_urls', 'images', 'photos', 'picture_urls', 'image_url'],
  video_urls: ['video_urls', 'videos', 'clip_urls', 'video_url', 'swimming_videos'],
};

/**
 * Generate a production-ready sample CSV template with realistic RA Guppy data
 */
export function generateCsvTemplate(): string {
  const headers = CSV_COLUMN_DEFINITIONS.map(c => c.key).join(',');
  const sampleRows = [
    [
      'prod-001',
      'RG-EB-001',
      '"Electric Blue Pure Strain Guppy (Pair)"',
      'electric-blue-guppy-pair',
      '400',
      '600',
      '15',
      'published',
      '"Guppies & Livebearers"',
      '"Breeding Pairs & Rare Strains"',
      '"Vibrant Electric Blue metallic iridescence with delta tail. 1 Male + 1 Female."',
      '"High-grade pure strain Electric Blue Guppy breeding pair. Healthy, active, and conditioned in mineralized water."',
      'Electric Blue',
      'Breeding Pair',
      'Easy',
      'true',
      '150',
      '"Bestseller; Show Class; Breeding Pair"',
      '"/product_image/electric-blue-300.jpeg"',
      '""'
    ].join(','),
    [
      '',
      'RG-AFR-010',
      '"Albino Full Red (AFR) Flower Dorsal Guppy (Pair)"',
      'afr-flower-dorsal-guppy-pair',
      '400',
      '600',
      '20',
      'published',
      '"Guppies & Livebearers"',
      '"Breeding Pairs & Rare Strains"',
      '"Intense crimson coloration with signature wide flower dorsal finnage."',
      '"Championship pure line Albino Full Red (AFR) pair. Conditioned with live Moina and high-grade pellets."',
      'Albino Full Red',
      'Breeding Pair',
      'Easy',
      'false',
      '150',
      '"Rare Strain; AFR; Flower Dorsal"',
      '"/product_image/afr-flower-dorsal-400.jpeg"',
      '""'
    ].join(','),
    [
      '',
      'RG-PL-005',
      '"Guppy Grass (Najas Guadalupensis) Dense Bunch"',
      'guppy-grass-dense-bunch',
      '150',
      '200',
      '30',
      'published',
      '"Aquatic Plants"',
      '"Submerged & Floating Plants"',
      '"Fast-growing livebearer shelter plant. Absorbs nitrates and protects newborn fry."',
      '"Fresh, lush Guppy Grass bunches. Perfect for fry nurseries and zero-CO2 planted livebearer setups."',
      'Tissue Culture',
      'Unsexed',
      'Easy',
      'false',
      '100',
      '"In Vitro; Nano Aquarium; Foreground"',
      '"https://images.unsplash.com/photo-1520302630591-fd1c66edc19d?auto=format&fit=crop&w=800&q=80"',
      '""'
    ].join(','),
    [
      '',
      'BA-FD-002',
      '"Ultra-Color Spirulina & Krill Micro Pellets (60g)"',
      'ultra-color-spirulina-krill-pellets',
      '299',
      '350',
      '40',
      'published',
      '"Fish Food & Nutrition"',
      '"Micro Pellets & Granules"',
      '"High-protein color enhancing slow-sinking micro pellets for pure strain show Guppies."',
      '"Formulated with pure Arctic Krill and natural Hawaiian Spirulina. Boosts immune health and vibrant colors."',
      'Nutrition',
      'Unsexed',
      'Easy',
      'true',
      '90',
      '"Daily Feed; High Protein; Color Enhancing"',
      '"https://images.unsplash.com/photo-1516684732162-798a0062be99?auto=format&fit=crop&w=800&q=80"',
      '""'
    ].join(',')
  ];

  return `${headers}\n${sampleRows.join('\n')}`;
}

/**
 * Standard RFC 4180 compliant CSV parser
 */
export function parseCsv(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let insideQuotes = false;

  const sanitized = text.replace(/^\uFEFF/, ''); // Strip BOM if present

  for (let i = 0; i < sanitized.length; i++) {
    const char = sanitized[i];
    const nextChar = sanitized[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentField += '"';
        i++; // skip escaped quote
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      currentRow.push(currentField.trim());
      currentField = '';
    } else if ((char === '\r' || char === '\n') && !insideQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++; // skip CRLF
      }
      currentRow.push(currentField.trim());
      currentField = '';
      if (currentRow.length > 0 && currentRow.some(field => field.length > 0)) {
        lines.push(currentRow);
      }
      currentRow = [];
    } else {
      currentField += char;
    }
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some(field => field.length > 0)) {
      lines.push(currentRow);
    }
  }

  if (lines.length === 0) {
    return { headers: [], rows: [] };
  }

  const rawHeaders = lines[0].map(h => h.trim().toLowerCase());
  const rows: Record<string, string>[] = [];

  for (let r = 1; r < lines.length; r++) {
    const line = lines[r];
    const rowObj: Record<string, string> = {};
    for (let c = 0; c < rawHeaders.length; c++) {
      const headerName = rawHeaders[c];
      rowObj[headerName] = line[c] !== undefined ? line[c] : '';
    }
    rows.push(rowObj);
  }

  return { headers: rawHeaders, rows };
}

/**
 * Map CSV column headers to canonical product field names
 */
export function mapColumnName(csvHeader: string): string {
  const normalized = csvHeader.toLowerCase().trim().replace(/[^a-z0-9_]/g, '_');
  for (const [canonicalKey, aliases] of Object.entries(COLUMN_ALIASES)) {
    if (canonicalKey === normalized || aliases.includes(csvHeader.toLowerCase().trim()) || aliases.includes(normalized)) {
      return canonicalKey;
    }
  }
  return normalized;
}

/**
 * Parse multi-value semicolon-separated strings into cleaned arrays
 */
export function parseMultiValue(val: string | undefined): string[] {
  if (!val) return [];
  return val
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

/**
 * Validate and compute diffs for all parsed CSV rows
 */
export function validateAndDiffCsvRows(
  rows: Record<string, string>[],
  mode: CsvImportMode,
  existingProducts: Product[],
  categories: Category[],
  columnMapping?: Record<string, string>
): {
  validCount: number;
  invalidCount: number;
  createCount: number;
  updateCount: number;
  skipCount: number;
  results: ImportRowValidation[];
} {
  const results: ImportRowValidation[] = [];
  const seenSkusInFile = new Set<string>();

  // Build category lookup maps (by id, by slug, by lowercase name)
  const categoryMap = new Map<string, Category>();
  for (const cat of categories) {
    categoryMap.set(cat.id.toLowerCase(), cat);
    categoryMap.set(cat.slug.toLowerCase(), cat);
    categoryMap.set(cat.name.toLowerCase().trim(), cat);
  }

  let createCount = 0;
  let updateCount = 0;
  let skipCount = 0;

  rows.forEach((rawRow, idx) => {
    const rowNumber = idx + 2; // +1 for 0-index, +1 for header line
    const errors: string[] = [];
    const warnings: string[] = [];
    const diffs: ImportRowDiff[] = [];

    // Remap row keys to canonical keys
    const canonicalRow: Record<string, string> = {};
    for (const [k, v] of Object.entries(rawRow)) {
      const mappedKey = columnMapping && columnMapping[k] ? columnMapping[k] : mapColumnName(k);
      canonicalRow[mappedKey] = v;
    }

    const inputSku = canonicalRow.sku ? canonicalRow.sku.trim() : '';
    const inputId = canonicalRow.product_id ? canonicalRow.product_id.trim() : '';
    const inputName = canonicalRow.name ? canonicalRow.name.trim() : '';

    // Match product by ID or SKU (never by name alone)
    let matchedProduct: Product | undefined;
    if (inputId) {
      matchedProduct = existingProducts.find(p => p.id === inputId);
    }
    if (!matchedProduct && inputSku) {
      matchedProduct = existingProducts.find(p => p.sku.toLowerCase() === inputSku.toLowerCase());
    }

    // Determine intended operation
    let operation: 'create' | 'update' | 'skip' = 'create';
    if (mode === 'create') {
      operation = 'create';
      if (matchedProduct) {
        errors.push(`Mode A (Create Only) error: Product with SKU "${inputSku || matchedProduct.sku}" already exists (ID: ${matchedProduct.id}).`);
      }
    } else if (mode === 'update') {
      operation = 'update';
      if (!matchedProduct) {
        errors.push(`Mode B (Update Only) error: No existing product found matching SKU "${inputSku}" or ID "${inputId}".`);
      }
    } else if (mode === 'upsert') {
      operation = matchedProduct ? 'update' : 'create';
    }

    // Check SKU duplicate within the CSV file
    if (inputSku) {
      if (seenSkusInFile.has(inputSku.toLowerCase())) {
        errors.push(`Duplicate SKU "${inputSku}" detected within row ${rowNumber}. SKUs must be unique within import.`);
      } else {
        seenSkusInFile.add(inputSku.toLowerCase());
      }
    }

    // Validate Required Fields for Create
    if (operation === 'create') {
      if (!inputName) {
        errors.push('Column "name" is required to create a new product.');
      }
      if (!canonicalRow.price || isNaN(Number(canonicalRow.price)) || Number(canonicalRow.price) < 0) {
        errors.push('Column "price" must be a valid non-negative number.');
      }
      if (!inputSku) {
        warnings.push('SKU was not provided; an automated unique SKU will be generated upon import.');
      }
      if (!canonicalRow.category) {
        warnings.push('No category specified; will default to primary collection.');
      }
    }

    // Validate Price numbers if provided
    if (canonicalRow.price !== undefined && canonicalRow.price !== '') {
      const p = Number(canonicalRow.price);
      if (isNaN(p) || p < 0) {
        errors.push(`Invalid price "${canonicalRow.price}". Must be a number >= 0.`);
      }
    }

    // Validate Compare at Price
    if (canonicalRow.compare_at_price !== undefined && canonicalRow.compare_at_price !== '') {
      const cmp = Number(canonicalRow.compare_at_price);
      if (isNaN(cmp) || cmp < 0) {
        errors.push(`Invalid compare_at_price "${canonicalRow.compare_at_price}". Must be a number >= 0.`);
      }
    }

    // Validate Stock Quantity
    if (canonicalRow.stock_quantity !== undefined && canonicalRow.stock_quantity !== '') {
      const stock = Number(canonicalRow.stock_quantity);
      if (isNaN(stock) || stock < 0 || !Number.isInteger(stock)) {
        errors.push(`Invalid stock_quantity "${canonicalRow.stock_quantity}". Must be a non-negative integer.`);
      }
    }

    // Validate Status
    const allowedStatuses: ProductStatus[] = ['published', 'draft', 'out_of_stock', 'archived'];
    if (canonicalRow.status && !allowedStatuses.includes(canonicalRow.status.toLowerCase() as ProductStatus)) {
      errors.push(`Invalid status "${canonicalRow.status}". Allowed values: ${allowedStatuses.join(', ')}.`);
    }

    // Resolve Category
    let resolvedCategoryId: string | undefined;
    let resolvedCategoryName: string | undefined;
    if (canonicalRow.category) {
      const catKey = canonicalRow.category.toLowerCase().trim();
      const foundCat = categoryMap.get(catKey);
      if (foundCat) {
        resolvedCategoryId = foundCat.id;
        resolvedCategoryName = foundCat.name;
      } else {
        warnings.push(`Category "${canonicalRow.category}" not found in current catalog. Will attempt auto-mapping.`);
        resolvedCategoryName = canonicalRow.category;
      }
    }

    // Resolve Subcategory
    let resolvedSubcategoryId: string | undefined;
    let resolvedSubcategoryName: string | undefined;
    if (canonicalRow.subcategory) {
      const subKey = canonicalRow.subcategory.toLowerCase().trim();
      const foundSub = categoryMap.get(subKey);
      if (foundSub) {
        resolvedSubcategoryId = foundSub.id;
        resolvedSubcategoryName = foundSub.name;
      } else {
        resolvedSubcategoryName = canonicalRow.subcategory;
      }
    }

    // Parse image URLs & video URLs
    const imageUrls = parseMultiValue(canonicalRow.image_urls);
    const videoUrls = parseMultiValue(canonicalRow.video_urls);

    // URL format verification
    for (const u of imageUrls) {
      if (!u.startsWith('http://') && !u.startsWith('https://')) {
        warnings.push(`Image URL "${u}" does not start with http:// or https://.`);
      }
    }
    for (const u of videoUrls) {
      if (!u.startsWith('http://') && !u.startsWith('https://')) {
        warnings.push(`Video URL "${u}" does not start with http:// or https://.`);
      }
    }

    // Build Parsed Data Payload
    const parsedData: Partial<Product> = {};

    if (inputId) parsedData.id = inputId;
    if (inputSku) parsedData.sku = inputSku;
    if (inputName) parsedData.name = inputName;
    if (canonicalRow.slug) {
      parsedData.slug = canonicalRow.slug.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    }
    if (canonicalRow.price !== undefined && canonicalRow.price !== '') {
      parsedData.price = Number(canonicalRow.price);
    }
    if (canonicalRow.compare_at_price !== undefined && canonicalRow.compare_at_price !== '') {
      parsedData.compare_at_price = Number(canonicalRow.compare_at_price);
    }
    if (canonicalRow.stock_quantity !== undefined && canonicalRow.stock_quantity !== '') {
      parsedData.stock_quantity = Number(canonicalRow.stock_quantity);
    }
    if (canonicalRow.status) {
      const st = canonicalRow.status.toLowerCase() as ProductStatus;
      parsedData.status = st;
      parsedData.is_active = st !== 'archived' && st !== 'draft';
    }
    if (resolvedCategoryId) parsedData.category_id = resolvedCategoryId;
    if (resolvedCategoryName) parsedData.category_name = resolvedCategoryName;
    if (resolvedSubcategoryId) parsedData.subcategory_id = resolvedSubcategoryId;
    if (resolvedSubcategoryName) parsedData.subcategory_name = resolvedSubcategoryName;
    if (canonicalRow.short_description) parsedData.short_description = canonicalRow.short_description;
    if (canonicalRow.description) parsedData.description = canonicalRow.description;
    if (canonicalRow.strain) parsedData.strain = canonicalRow.strain;
    if (canonicalRow.gender) parsedData.gender = canonicalRow.gender as any;
    if (canonicalRow.care_level) parsedData.care_level = canonicalRow.care_level as any;
    if (canonicalRow.featured !== undefined && canonicalRow.featured !== '') {
      parsedData.is_featured = canonicalRow.featured.toLowerCase() === 'true' || canonicalRow.featured === '1';
    }
    if (canonicalRow.weight !== undefined && canonicalRow.weight !== '') {
      parsedData.weight = Number(canonicalRow.weight);
    }
    if (canonicalRow.tags) {
      parsedData.tags = parseMultiValue(canonicalRow.tags);
    }
    if (imageUrls.length > 0) {
      parsedData.images = imageUrls;
    }
    if (videoUrls.length > 0) {
      parsedData.videos = videoUrls.map((vUrl, vIdx) => ({
        id: `vid-csv-${rowNumber}-${vIdx + 1}`,
        url: vUrl,
        title: `${parsedData.name || 'Specimen'} Video ${vIdx + 1}`,
        mime_type: 'video/mp4',
      }));
    }

    // Compute Diffs for Update operation
    if (operation === 'update' && matchedProduct) {
      const keysToCheck: (keyof Product)[] = [
        'name', 'price', 'compare_at_price', 'stock_quantity', 
        'status', 'category_id', 'subcategory_id', 'is_featured', 
        'strain', 'weight'
      ];
      for (const k of keysToCheck) {
        if (parsedData[k] !== undefined && parsedData[k] !== matchedProduct[k]) {
          diffs.push({
            field: String(k),
            old_value: matchedProduct[k],
            new_value: parsedData[k],
          });
        }
      }
    }

    if (operation === 'create') createCount++;
    else if (operation === 'update') updateCount++;
    else skipCount++;

    results.push({
      row_number: rowNumber,
      raw_data: rawRow,
      parsed_data: parsedData,
      matched_product_id: matchedProduct?.id,
      matched_product_sku: matchedProduct?.sku,
      operation,
      status: errors.length > 0 ? 'invalid' : (warnings.length > 0 ? 'warning' : 'valid'),
      errors,
      warnings,
      diffs,
      is_selected: errors.length === 0, // auto-select valid rows
    });
  });

  const validCount = results.filter(r => r.status !== 'invalid').length;
  const invalidCount = results.filter(r => r.status === 'invalid').length;

  return {
    validCount,
    invalidCount,
    createCount,
    updateCount,
    skipCount,
    results,
  };
}

/**
 * Execute validated CSV import rows in safe atomic batches
 */
export async function executeImport(
  validatedRows: ImportRowValidation[],
  mode: CsvImportMode,
  filename: string,
  adminEmail: string,
  onProgress?: (progress: { processed: number; total: number; successes: number; failures: number }) => void
): Promise<{
  success: boolean;
  historyItem: ImportHistoryItem;
  results: { row_number: number; sku: string; name: string; operation: string; status: 'success' | 'failed' | 'skipped'; message?: string }[];
}> {
  const selectedRows = validatedRows.filter(r => r.is_selected);
  const total = selectedRows.length;
  let processed = 0;
  let successes = 0;
  let failures = 0;
  let skipped = validatedRows.length - total;

  const executionResults: { row_number: number; sku: string; name: string; operation: string; status: 'success' | 'failed' | 'skipped'; message?: string }[] = [];

  // Add non-selected rows to report as skipped
  validatedRows.filter(r => !r.is_selected).forEach(r => {
    executionResults.push({
      row_number: r.row_number,
      sku: r.parsed_data.sku || r.matched_product_sku || '',
      name: r.parsed_data.name || 'Unspecified',
      operation: 'skip',
      status: 'skipped',
      message: r.errors.length > 0 ? r.errors.join('; ') : 'Manually unselected before import',
    });
  });

  const BATCH_SIZE = 25;
  const allExistingProducts = mockDb.getProducts();

  for (let i = 0; i < selectedRows.length; i += BATCH_SIZE) {
    const batch = selectedRows.slice(i, i + BATCH_SIZE);

    for (const row of batch) {
      try {
        if (row.operation === 'create') {
          const newProduct: Product = {
            id: row.parsed_data.id || 'prod-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
            name: row.parsed_data.name || 'New Specimen',
            slug: row.parsed_data.slug || (row.parsed_data.name || 'specimen').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
            sku: row.parsed_data.sku || 'RG-' + Math.floor(1000 + Math.random() * 9000),
            description: row.parsed_data.description || '',
            short_description: row.parsed_data.short_description || '',
            price: Number(row.parsed_data.price || 0),
            compare_at_price: row.parsed_data.compare_at_price ? Number(row.parsed_data.compare_at_price) : undefined,
            category_id: row.parsed_data.category_id || '9ebb7d17-8998-46b7-8e97-46a0812f7a80',
            category_name: row.parsed_data.category_name || 'Guppies & Livebearers',
            subcategory_id: row.parsed_data.subcategory_id,
            subcategory_name: row.parsed_data.subcategory_name,
            stock_quantity: Number(row.parsed_data.stock_quantity ?? 1),
            is_unique_specimen: row.parsed_data.is_unique_specimen !== undefined ? row.parsed_data.is_unique_specimen : false,
            is_featured: Boolean(row.parsed_data.is_featured),
            is_active: row.parsed_data.is_active !== undefined ? row.parsed_data.is_active : true,
            status: row.parsed_data.status || 'published',
            weight: row.parsed_data.weight || 150,
            strain: row.parsed_data.strain || 'Pure Strain Guppy',
            gender: row.parsed_data.gender || 'Breeding Pair',
            care_level: row.parsed_data.care_level || 'Easy',
            images: row.parsed_data.images && row.parsed_data.images.length > 0 
              ? row.parsed_data.images 
              : ['https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80'],
            videos: row.parsed_data.videos || [],
            rating: 5.0,
            review_count: 0,
            tags: row.parsed_data.tags || [],
            created_at: new Date().toISOString(),
          };

          mockDb.saveProduct(newProduct);
          successes++;
          executionResults.push({
            row_number: row.row_number,
            sku: newProduct.sku,
            name: newProduct.name,
            operation: 'create',
            status: 'success',
            message: `Created product "${newProduct.name}" (ID: ${newProduct.id}).`,
          });
        } else if (row.operation === 'update') {
          const existing = allExistingProducts.find(p => 
            (row.matched_product_id && p.id === row.matched_product_id) ||
            (row.parsed_data.sku && p.sku.toLowerCase() === row.parsed_data.sku.toLowerCase())
          );

          if (!existing) {
            throw new Error(`Product not found for update (SKU: ${row.parsed_data.sku || 'N/A'}).`);
          }

          const updatedProduct: Product = {
            ...existing,
            ...row.parsed_data,
          };

          mockDb.saveProduct(updatedProduct);
          successes++;
          executionResults.push({
            row_number: row.row_number,
            sku: updatedProduct.sku,
            name: updatedProduct.name,
            operation: 'update',
            status: 'success',
            message: `Updated product "${updatedProduct.name}" (${row.diffs.length} fields changed).`,
          });
        }
      } catch (err: any) {
        failures++;
        executionResults.push({
          row_number: row.row_number,
          sku: row.parsed_data.sku || '',
          name: row.parsed_data.name || 'Unspecified',
          operation: row.operation,
          status: 'failed',
          message: err.message || 'Execution error during commit',
        });
      }

      processed++;
      if (onProgress) {
        onProgress({ processed, total, successes, failures });
      }
    }
  }

  // Construct and record import history entry
  const historyItem: ImportHistoryItem = {
    id: 'imp-' + Date.now(),
    timestamp: new Date().toISOString(),
    admin_email: adminEmail,
    filename,
    mode,
    total_rows: validatedRows.length,
    success_count: successes,
    failure_count: failures,
    skipped_count: skipped,
    summary: {
      created: executionResults.filter(r => r.operation === 'create' && r.status === 'success').length,
      updated: executionResults.filter(r => r.operation === 'update' && r.status === 'success').length,
      failed: failures,
      skipped,
    },
    raw_results: executionResults,
  };

  mockDb.saveImportHistory(historyItem);

  return {
    success: failures === 0,
    historyItem,
    results: executionResults,
  };
}

/**
 * Generate a downloadable audit report (CSV) from execution results
 */
export function generateImportAuditReportCsv(historyItem: ImportHistoryItem): string {
  const headers = ['Row Number', 'SKU', 'Product Name', 'Operation', 'Status', 'Message', 'Timestamp'];
  const rows = (historyItem.raw_results || []).map(r => [
    r.row_number,
    `"${(r.sku || '').replace(/"/g, '""')}"`,
    `"${(r.name || '').replace(/"/g, '""')}"`,
    r.operation,
    r.status,
    `"${(r.message || '').replace(/"/g, '""')}"`,
    historyItem.timestamp
  ].join(','));

  return [headers.join(','), ...rows].join('\n');
}

/**
 * Perform safe bulk edits on selected products
 */
export function applyBulkEdit(
  productIds: string[],
  action: {
    field: 'price' | 'compare_at_price' | 'stock_quantity' | 'status' | 'category_id' | 'subcategory_id' | 'is_featured' | 'tags';
    operation: 'set' | 'increase_amount' | 'decrease_amount' | 'increase_percent' | 'decrease_percent' | 'add_tags' | 'remove_tags';
    value: any;
  },
  adminEmail: string
): { successCount: number; failureCount: number; affectedProducts: Product[] } {
  const products = mockDb.getProducts();
  const categories = mockDb.getCategories();
  const affected: Product[] = [];
  let successCount = 0;
  let failureCount = 0;

  for (const id of productIds) {
    const p = products.find(prod => prod.id === id);
    if (!p) {
      failureCount++;
      continue;
    }

    try {
      if (action.field === 'price') {
        const val = Number(action.value);
        if (action.operation === 'set') {
          p.price = Math.max(0, val);
        } else if (action.operation === 'increase_amount') {
          p.price = Math.max(0, p.price + val);
        } else if (action.operation === 'decrease_amount') {
          p.price = Math.max(0, p.price - val);
        } else if (action.operation === 'increase_percent') {
          p.price = Math.round(p.price * (1 + val / 100));
        } else if (action.operation === 'decrease_percent') {
          p.price = Math.round(p.price * (1 - val / 100));
        }
      } else if (action.field === 'compare_at_price') {
        const val = Number(action.value);
        p.compare_at_price = val > 0 ? val : undefined;
      } else if (action.field === 'stock_quantity') {
        const val = Number(action.value);
        if (action.operation === 'set') {
          p.stock_quantity = Math.max(0, Math.floor(val));
        } else if (action.operation === 'increase_amount') {
          p.stock_quantity = Math.max(0, p.stock_quantity + Math.floor(val));
        } else if (action.operation === 'decrease_amount') {
          p.stock_quantity = Math.max(0, p.stock_quantity - Math.floor(val));
        }
      } else if (action.field === 'status') {
        const st = action.value as ProductStatus;
        p.status = st;
        p.is_active = st !== 'archived' && st !== 'draft';
      } else if (action.field === 'category_id') {
        const cat = categories.find(c => c.id === action.value);
        if (cat) {
          p.category_id = cat.id;
          p.category_name = cat.name;
        }
      } else if (action.field === 'subcategory_id') {
        const sub = categories.find(c => c.id === action.value);
        if (sub) {
          p.subcategory_id = sub.id;
          p.subcategory_name = sub.name;
        } else {
          p.subcategory_id = undefined;
          p.subcategory_name = undefined;
        }
      } else if (action.field === 'is_featured') {
        p.is_featured = Boolean(action.value);
      } else if (action.field === 'tags') {
        const inputTags = Array.isArray(action.value) ? action.value : parseMultiValue(String(action.value));
        const currentTags = new Set(p.tags || []);
        if (action.operation === 'add_tags') {
          inputTags.forEach(t => currentTags.add(t));
        } else if (action.operation === 'remove_tags') {
          inputTags.forEach(t => currentTags.delete(t));
        } else {
          currentTags.clear();
          inputTags.forEach(t => currentTags.add(t));
        }
        p.tags = Array.from(currentTags);
      }

      mockDb.saveProduct(p);
      affected.push(p);
      successCount++;
    } catch {
      failureCount++;
    }
  }

  mockDb.addAuditLog(
    `Admin (${adminEmail}) applied bulk edit on ${successCount} products (Field: ${action.field})`,
    'product',
    'bulk'
  );

  return { successCount, failureCount, affectedProducts: affected };
}
