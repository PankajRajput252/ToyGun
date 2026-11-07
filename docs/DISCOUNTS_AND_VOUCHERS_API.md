# Discounts & Vouchers — API contract

Contract between this frontend and the Spring Boot backend (`gunwala`) for admin-managed **discounts**
(automatic sales) and **vouchers** (coupon codes). Both sides are implemented.

- Frontend types: `src/services/promoApi.ts`, `src/services/paymentApi.ts` (`ShopOrder`).
- Backend: `PromotionPricingService`, `DiscountService`, `VoucherService`, `AdminDiscountController`,
  `AdminVoucherController`, `VoucherController`; `ShopOrderService` applies both at checkout.

**The server is the only source of truth for prices.** The frontend displays what the server returns and
sends only product ids, quantities and a voucher code. Never trust a price or discount amount from the client.

---

## 1. Concepts

| | Discount (sale) | Voucher (coupon) |
|---|---|---|
| Buyer action | None — applies automatically | Types a code in the cart |
| Applies to | Each unit of a store product | The whole order |
| Shown as | Strike-through price on product card, details page, cart | A line in the order summary |
| Order of application | First (sets the unit price) | Second (on the subtotal after sales) |
| Stacking | Several may match a product: **the one giving the lowest price wins**; they never add up | **One voucher per order** |

Both are only for **store products** (`isStoreProduct = true`). User listings are never discounted.

Money: use `BigDecimal`, scale 2, `RoundingMode.HALF_UP`. Prices never go below 0.

Times: `startsAt` / `endsAt` are ISO-8601 instants (UTC, e.g. `2026-11-10T18:30:00.000Z`).
A promo is **live** when `active && startsAt <= now && (endsAt == null || now < endsAt)`
(and, for vouchers, `usageLimit == null || usedCount < usageLimit`).

Errors: use the same problem+json shape as the payment module
(`{ status, title, detail, errors: { field: message } }`). The UI shows `detail` to the user and maps
`errors` keys onto form fields, so keep field names identical to the request body.

All `/api/admin/**` endpoints require the admin role (as today). `/api/vouchers/validate` requires a signed-in user.

---

## 2. Discounts (admin)

### Entity `discount`

| Column | Type | Notes |
|---|---|---|
| id | bigint PK | |
| name | varchar(100) | not blank; shown to buyers |
| value_type | enum `PERCENTAGE` \| `FLAT` | |
| value | decimal(10,2) | > 0; if PERCENTAGE then < 100 |
| scope | enum `ALL_STORE_PRODUCTS` \| `SELECTED_PRODUCTS` | |
| starts_at | timestamp | required |
| ends_at | timestamp null | must be > starts_at |
| active | boolean | admin pause switch |
| created_at, updated_at | timestamp | |

Join table `discount_product (discount_id, product_id)` — required (≥1 row) when scope is `SELECTED_PRODUCTS`,
empty otherwise. Every product id must exist and be a store product (→ 400 `errors.productIds`).

### Endpoints

| Method | Path | Body | Returns |
|---|---|---|---|
| GET | `/api/admin/discounts` | — | `Discount[]`, newest first |
| POST | `/api/admin/discounts` | `DiscountInput` | `Discount` (201 or 200) |
| PUT | `/api/admin/discounts/{id}` | `DiscountInput` | `Discount` |
| PATCH | `/api/admin/discounts/{id}/status?active=true\|false` | — | `Discount` |
| DELETE | `/api/admin/discounts/{id}` | — | 204 |

```jsonc
// DiscountInput
{
  "name": "Diwali Sale",
  "valueType": "PERCENTAGE",        // or "FLAT" (rupees off each unit)
  "value": 15,
  "scope": "SELECTED_PRODUCTS",     // or "ALL_STORE_PRODUCTS"
  "productIds": [101, 102],         // [] for ALL_STORE_PRODUCTS
  "startsAt": "2026-11-10T00:00:00.000Z",
  "endsAt": "2026-11-15T23:59:00.000Z",  // or null
  "active": true
}
// Discount = DiscountInput + { "id": 7, "createdAt": "...", "updatedAt": "..." }
```

Deleting or editing a discount must **not** change orders already created (they store their own prices, see §4).

### Sale price on product responses

Add two fields to every product returned by `GET /api/users/getProduct` (and any other product endpoint):

```jsonc
{
  "productPkId": 101,
  "price": 20000,             // unchanged: list price
  "salePrice": 17000,         // NEW: price after the best live discount; null when none applies
  "discountLabel": "15% OFF"  // NEW: e.g. "15% OFF" or "₹3,000 OFF"; null when none applies
}
```

Sale price for one unit:

```
for each live discount d that covers the product:
    candidate = PERCENTAGE ? price × (1 − value/100) : price − value
salePrice = max(0, min(candidates)) rounded to 2 dp     // null if no candidates, or if it equals price
```

Compute live discounts once per request (not per product) to avoid N+1 queries.

---

## 3. Vouchers (admin)

### Entity `voucher`

| Column | Type | Notes |
|---|---|---|
| id | bigint PK | |
| code | varchar(20) **unique** | `^[A-Z0-9]{4,20}$`; store upper-case; duplicate → 400 `errors.code` / 409 |
| description | varchar(200) null | shown to the buyer when applied |
| value_type | enum `PERCENTAGE` \| `FLAT` | |
| value | decimal(10,2) | > 0; if PERCENTAGE then < 100 |
| max_discount_amount | decimal(10,2) null | cap for PERCENTAGE; ignored for FLAT |
| min_order_amount | decimal(10,2) null | subtotal (after sales) required |
| usage_limit | int null | total redemptions; null = unlimited |
| per_user_limit | int null | redemptions per user; null = unlimited |
| starts_at, ends_at, active | | as discounts |
| created_at, updated_at | | |

There is no separate redemption table: `shop_orders` stores `voucher_id`, `voucher_code` and
`voucher_discount`, and uses are counted from it (`ShopOrderRepository.countVoucherUses`).

**When an order counts as a use.** An order counts once it is `PAID` or has a payment submission that
isn't `REJECTED`. Cancelled orders never count. Unpaid orders with no payment are *holds*:

- For 2 hours after checkout, a hold counts towards the **total** limit for other buyers. This stops the
  last use from going to two buyers at once.
- A hold never counts against the buyer who placed it, so they can retry an abandoned checkout.
- After 2 hours the hold lapses. There is no order-cancel flow, so abandoned checkouts must not burn uses forever.

`usedCount` in admin responses = paid + payment-submitted orders (holds excluded).

### Endpoints

| Method | Path | Body | Returns |
|---|---|---|---|
| GET | `/api/admin/vouchers` | — | `Voucher[]`, newest first |
| POST | `/api/admin/vouchers` | `VoucherInput` | `Voucher` |
| PUT | `/api/admin/vouchers/{id}` | `VoucherInput` | `Voucher` |
| PATCH | `/api/admin/vouchers/{id}/status?active=true\|false` | — | `Voucher` |
| DELETE | `/api/admin/vouchers/{id}` | — | 204 (orders keep their copied code and amount) |

Admin endpoints here and in §2 require the `ADMIN_USER` authority. Non-admins get 403.

```jsonc
// VoucherInput
{
  "code": "WELCOME10",
  "description": "10% off your first order",
  "valueType": "PERCENTAGE",
  "value": 10,
  "maxDiscountAmount": 2000,   // null = no cap
  "minOrderAmount": 5000,      // null = no minimum
  "usageLimit": 100,           // null = unlimited
  "perUserLimit": 1,           // null = unlimited
  "startsAt": "2026-11-06T00:00:00.000Z",
  "endsAt": null,
  "active": true
}
// Voucher = VoucherInput + { "id": 3, "usedCount": 12, "createdAt": "...", "updatedAt": "..." }
```

---

## 4. Buyer flow

### 4.1 Check a code — `POST /api/vouchers/validate`

```jsonc
// request
{ "code": "WELCOME10", "items": [ { "productId": 101, "quantity": 2 } ] }

// 200 response
{
  "code": "WELCOME10",
  "description": "10% off your first order",
  "subtotal": 34000,        // Σ unit price after sales × quantity
  "discountAmount": 2000,   // voucher amount (capped)
  "total": 32000            // subtotal − discountAmount
}
```

Rejections → **400** (404 for unknown code is also fine) with a buyer-friendly `detail`, e.g.:

| Case | `detail` |
|---|---|
| Unknown / deleted code | "This voucher code isn't valid." |
| Paused, not started, expired | "This voucher isn't active right now." |
| Usage limit reached | "This voucher has been fully used." |
| Per-user limit reached | "You've already used this voucher." |
| Below minimum | "Add ₹1,500 more to use this voucher (minimum order ₹5,000)." |

The cart calls this again whenever the cart changes; it does **not** reserve the voucher.

### 4.2 Voucher amount

```
PERCENTAGE: amount = subtotal × value / 100, then min(amount, maxDiscountAmount) if a cap is set
FLAT:       amount = value
amount = min(amount, subtotal), rounded to 2 dp
```

### 4.3 Create order — `POST /api/shop-orders` (existing endpoint, extended)

Request gains an optional field:

```jsonc
{ "items": [...], "shipping": {...}, "voucherCode": "WELCOME10" }
```

In **one transaction**:
1. Price every line at its sale price (§2) and store it.
2. If `voucherCode` is present, lock the voucher row (`SELECT … FOR UPDATE`) and re-run every §4.1 check.
   On failure return 400 with the same `detail`; the address form shows it to the buyer.
3. Copy `voucher_id`, `voucher_code` and `voucher_discount` onto the order.

When the buyer **submits the payment** (`POST /api/payments`), the voucher row is locked again and the total
and per-buyer limits are re-checked, leaving out this order. Dates are not re-checked: the buyer keeps the
price shown at checkout. This stops one buyer paying two orders with a once-per-buyer code.

### 4.4 `ShopOrder` response — new fields

```jsonc
{
  "orderReference": "BW-…",
  "subtotal": 34000,          // unchanged meaning: Σ unitPrice × units (after sales)
  "voucherCode": "WELCOME10", // NEW, null when none
  "voucherDiscount": 2000,    // NEW, 0 or null when none
  "total": 32000,             // NEW: what the buyer must pay = subtotal − voucherDiscount
  "items": [
    {
      "productId": 101,
      "unitPrice": 17000,         // charged price (after sale)
      "originalUnitPrice": 20000, // NEW: list price at order time; equal to unitPrice / null when no sale
      ...
    }
  ],
  ...
}
```

Return these on `GET /api/shop-orders`, `GET /api/shop-orders/{ref}` and the admin shop-order endpoints too.
The frontend pre-fills the bank/UPI payment amount with `total` (falling back to `subtotal` while the field
is missing).

### 4.5 Elsewhere in the backend

- **Payment approval**: compare the submitted amount against `total`, not `subtotal`.
- **Shiprocket**: send the discounted line prices and/or the voucher as order-level `discount`
  so the invoice matches what the buyer paid.
- **Rejected payment** → the order stops counting as a use. The buyer can resubmit, which re-checks the limits.

---

## 5. Test cases worth covering

1. Two discounts on the same product (20% and ₹5,000 off a ₹20,000 item) → sale price ₹15,000, not stacked.
2. FLAT discount larger than the price → sale price ₹0, never negative.
3. Scheduled discount (starts tomorrow) → no `salePrice` today.
4. Voucher with 20% and a ₹2,000 cap on a ₹30,000 cart → ₹2,000 off.
5. `minOrderAmount` is checked against the subtotal **after** sale discounts.
6. Two parallel orders with the last remaining use → exactly one succeeds.
7. Per-user limit 1: paying a second order with the code is rejected. Abandoning a checkout and retrying is allowed.
8. Editing or deleting a discount/voucher leaves existing orders' amounts unchanged.
9. A user listing (`isStoreProduct = false`) never gets a sale price, even with an `ALL_STORE_PRODUCTS` discount.
