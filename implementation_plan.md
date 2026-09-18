# Phase 3 Updated Data Audit Report

## 1. Metrics
- **Exact number of source rows:** 115
- **Exact number of products after normalization:** 113
- **Exact number of proposed variants (inferred from name):** 14

## 2. Inferred Variants
The following products had variants inferred from their original name:
| Original Name | Base Product | Variant | Price (INR) |
| :--- | :--- | :--- | :--- |
| Death By Chocolate (500gms) | Death By Chocolate | 500gms | ₹279 |
| Fondant Cake [Full] | Fondant Cake | Full | ₹1500 |
| Cheese Corn Ball - 6P | Cheese Corn Ball | 6P | ₹260 |
| Doughnut Eggless [1 piece] | Doughnut Eggless | 1 piece | ₹90 |
| Blackcurrant Ice Cream [1 Scoop] | Blackcurrant Ice Cream | 1 Scoop | ₹80 |
| Caramel Nuts Ice Cream [1 Scoop] | Caramel Nuts Ice Cream | 1 Scoop | ₹120 |
| Mango Ice Cream [1 Scoop] | Mango Ice Cream | 1 Scoop | ₹80 |
| Vanilla Ice Cream [1 Scoop] | Vanilla Ice Cream | 1 Scoop | ₹80 |
| Chocolate Ice Cream [1 Scoop] | Chocolate Ice Cream | 1 Scoop | ₹100 |
| Strawberry Ice Cream [1 Scoop] | Strawberry Ice Cream | 1 Scoop | ₹80 |
| Thums Up (250 ml) | Thums Up | 250 ml | ₹19 |
| Sprite (250 ml) | Sprite | 250 ml | ₹19 |
| Kinley (1.0 L) | Kinley | 1.0 L | ₹19 |
| Veg Momos [5 Pieces] | Veg Momos | 5 Pieces | ₹130 |

## 3. Duplicate / Conflicting Products
The following products have identical normalized base names without explicit variant information but conflicting prices.
As per rules, **different prices ≠ automatically different variants**. These require manual verification.

### 🚨 Conflict: Pink Sauce Pasta
This product appears multiple times with differing prices and no clear variant distinction in the source.

| Original Excel Name | Price (INR) | Category | Description | Proposed Action |
| :--- | :--- | :--- | :--- | :--- |
| Pink Sauce Pasta | ₹220 | Pasta | Italian rosa-style sauce pasta | HOLD: Manual Verification Required |
| Pink Sauce Pasta | ₹280 | Pasta | Italian rosa-style sauce pasta | HOLD: Manual Verification Required |

**Conflict Details & Resolution Requirement:** The source data (e.g. old printed menu vs Swiggy) does not establish these as distinct variants (e.g., Regular vs Large). We cannot arbitrarily choose one price or invent a variant. Both records must be preserved in the source dataset but excluded from the active store until the business owner confirms the correct canonical price.

## 4. Import Strategy Update
1. **No Generic Variants:** Products without explicit variants will simply be inserted as-is (with a `NULL` or `Default` variant label internally if required by schema, but no 'Variant 1' labels).
2. **Provenance Preservation:** The original Excel `Item` name will be saved in the `source` column (e.g. `Swiggy Menu - Original Name: <Name>`) to prevent data loss when we normalize the base product name.
3. **Conflict Isolation:** Any product flagged in Section 3 will be logged but **skipped** during the automated import to prevent dirty data or arbitrary price choices.

Please approve this updated mapping and conflict-handling strategy before I generate the final `import-menu.ts` execution script.
