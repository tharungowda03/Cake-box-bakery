import * as fs from 'fs';
import * as path from 'path';

const rawData = JSON.parse(fs.readFileSync('excel_data_Menu.json', 'utf8'));

interface Row {
  Item: string;
  'Price (INR)': number;
  Description: string;
  Category: string;
}

let totalRows = rawData.length;
let normalizedProducts = new Map<string, {
  name: string;
  category: string;
  description: string;
  items: { originalName: string; price: number; variant?: string }[];
}>();

let variantsInferred = 0;
let implicitVariantsList: any[] = [];
let conflictsList: any[] = [];

for (const row of rawData as Row[]) {
  const originalName = row.Item?.toString().trim();
  const price = Number(row['Price (INR)']);
  
  // Extract variants: (500gms), [1 Scoop], - 6P, etc.
  // Regex looks for (...) or [...] or - X ending
  const variantMatch = originalName.match(/(?:\(([^)]+)\))|(?:\[([^\]]+)\])|(?:-\s*(\d+[a-zA-Z]+))/);
  
  let baseName = originalName;
  let variant = undefined;
  
  if (variantMatch) {
    variant = variantMatch[1] || variantMatch[2] || variantMatch[3];
    baseName = originalName.replace(variantMatch[0], '').trim();
    variantsInferred++;
    implicitVariantsList.push({ baseName, variant, originalName, price });
  }

  const slug = baseName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  
  if (!normalizedProducts.has(slug)) {
    normalizedProducts.set(slug, {
      name: baseName,
      category: row.Category,
      description: row.Description,
      items: []
    });
  }
  
  normalizedProducts.get(slug)!.items.push({
    originalName,
    price,
    variant
  });
}

// Find conflicts
for (const [slug, prod] of normalizedProducts.entries()) {
  const itemsWithoutVariants = prod.items.filter(i => !i.variant);
  if (itemsWithoutVariants.length > 1) {
    // Check if prices differ
    const prices = new Set(itemsWithoutVariants.map(i => i.price));
    if (prices.size > 1) {
      conflictsList.push(prod);
    }
  }
}

let report = `# Phase 3 Updated Data Audit Report

## 1. Metrics
- **Exact number of source rows:** ${totalRows}
- **Exact number of products after normalization:** ${normalizedProducts.size}
- **Exact number of proposed variants (inferred from name):** ${variantsInferred}

## 2. Inferred Variants
The following products had variants inferred from their original name:
| Original Name | Base Product | Variant | Price (INR) |
| :--- | :--- | :--- | :--- |
${implicitVariantsList.map(v => `| ${v.originalName} | ${v.baseName} | ${v.variant} | ₹${v.price} |`).join('\n')}

## 3. Duplicate / Conflicting Products
The following products have identical normalized base names without explicit variant information but conflicting prices.
As per rules, **different prices ≠ automatically different variants**. These require manual verification.

`;

for (const conflict of conflictsList) {
  report += `### 🚨 Conflict: ${conflict.name}\n`;
  report += `This product appears multiple times with differing prices and no clear variant distinction in the source.\n\n`;
  report += `| Original Excel Name | Price (INR) | Category | Description | Proposed Action |\n`;
  report += `| :--- | :--- | :--- | :--- | :--- |\n`;
  
  for (const item of conflict.items) {
    report += `| ${item.originalName} | ₹${item.price} | ${conflict.category} | ${conflict.description} | HOLD: Manual Verification Required |\n`;
  }
  report += `\n**Conflict Details & Resolution Requirement:** The source data (e.g. old printed menu vs Swiggy) does not establish these as distinct variants (e.g., Regular vs Large). We cannot arbitrarily choose one price or invent a variant. Both records must be preserved in the source dataset but excluded from the active store until the business owner confirms the correct canonical price.\n\n`;
}

report += `## 4. Import Strategy Update
1. **No Generic Variants:** Products without explicit variants will simply be inserted as-is (with a \`NULL\` or \`Default\` variant label internally if required by schema, but no 'Variant 1' labels).
2. **Provenance Preservation:** The original Excel \`Item\` name will be saved in the \`source\` column (e.g. \`Swiggy Menu - Original Name: <Name>\`) to prevent data loss when we normalize the base product name.
3. **Conflict Isolation:** Any product flagged in Section 3 will be logged but **skipped** during the automated import to prevent dirty data or arbitrary price choices.

Please approve this updated mapping and conflict-handling strategy before I generate the final \`import-menu.ts\` execution script.
`;

fs.writeFileSync('../implementation_plan.md', report);
console.log('Report generated.');
