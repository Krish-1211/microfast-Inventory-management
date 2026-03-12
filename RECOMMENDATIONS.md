# Product Recommendation Features

## Overview
The InvoiceCraft Studio platform includes an intelligent, multi-tiered product recommendation engine designed to increase cross-selling opportunities and enhance the user experience. The recommendation system analyzes past purchase behavior, semantic product relationships, and categorization to suggest relevant products to customers and administrators.

The features are surfaced across both customer-facing storefronts and internal admin tools (like the Invoice Generator) to ensure recommendations are easily accessible during the purchasing or invoicing process.

## Key Components

### 1. The Recommendation Engine (Backend)
The core logic for product recommendations is implemented in the `ProductModel` (`backend/models/productModel.js`). The engine utilizes a **multi-tiered fallback strategy** to guarantee that users always receive relevant suggestions, up to a specified limit (defaulting to 4 items). The logic strictly filters out the currently viewed item to prevent redundant suggestions.

The tiers are evaluated in the following order:

#### Tier 1: Collaborative Filtering ("Customers who bought this also bought...")
The primary and most accurate tier relies on historical purchase data. The system queries the `invoice_items` table to identify products frequently purchased together in the same transaction. 
- Analyzes past invoices to find co-occurring items.
- Ranks suggestions based on the frequency of co-purchases.
- Filters out inactive items.

#### Tier 2: Semantic Keyword Cross-selling
If collaborative filtering does not generate enough recommendations, the engine falls back to a rule-based semantic cross-selling algorithm. By analyzing the product's name, the system suggests logical complementary items.
- **Example Mappings:** 
  - `Keyboard` → recommends `Mouse`
  - `Mouse` → recommends `Keyboard`
  - `Monitor` → recommends `Cable`
  - `Laptop` → recommends `Hub`
- strictly filters for products that are currently in stock.

#### Tier 3: Category-based Fallback
If the limit is still not reached, the system suggests other products from the **same category** as the reference product. 
- Ensures relevance when historical data or specific keywords are missing.
- Excludes products that are permanently out-of-stock or deleted.

#### Tier 4: General Latest Products Fallback
As a final safety net to guarantee the UI is fully populated with recommendations, the system fills any remaining slots with the **most recently added, in-stock products**.

### 2. User Interface Integration (Frontend)
The recommendations are surfaced on the frontend via a reusable React component (`src/components/ProductRecommendations.tsx`). 

#### Key UI Features:
- **Universal Availability:** Surfaced in both the `PublicStore` for direct customers and the `InvoiceGenerator` for admins building manual orders.
- **Visual Badging:** Uses visual cues such as a "BEST MATCH" badge with a sparkle icon to draw user attention to recommended items.
- **Stock Awareness:** The component checks inventory levels in real-time. If a recommended item is out-of-stock, it gracefully downgrades the "Add Item" button to a "Notify Me" state, blurring the image and showing a "Sold Out" badge.
- **Loading & Error States:** Includes smooth skeleton loading ("Finding smart suggestions...") and resilient error handling if the backend fails to fetch data.
- **One-Click Add:** Provides quick "Add Item" buttons to instantly append recommended items to the current cart or invoice session.

### 3. API Architecture
The communication between the frontend component and backend engine is handled by a dedicated REST endpoint.
- **Endpoint:** `GET /api/products/:id/recommendations`
- **Controller:** `backend/controllers/productController.js -> getRecommendations`
- **Data Hook:** The frontend leverages a custom React hook `useProductRecommendations` (found in `src/hooks/useData.tsx`) to manage data fetching, caching, and state management lifecycle using modern React Query concepts.

## Summary 
This multi-tiered recommendation structure provides an excellent balance of personalization and reliability. By prioritizing actual user purchasing behavior (Collaborative Filtering) but gracefully degrading to semantic rules, categories, and general stock (Fallbacks), the system guarantees that highly relevant cross-sell opportunities are presented at critical conversion points.
