# زي — متعدد المتاجر Marketplace — خطة تنفيذ كاملة (v3)

> نسخة معدّلة من v2 بعد مراجعة تانية ركّزت على جزئين: (1) تصليب هيكل قاعدة البيانات (Section 6) بإضافة indexes وON DELETE behavior وconstraints كانت ناقصة، (2) ترتيب برومبتات التنفيذ (Section 11) في صيغة code blocks جاهزة للنسخ بدل الفقرات المائلة. باقي الملف زي v2 بدون تغيير. الإضافات الجديدة مُعلّمة بـ 🆕v3. احتفظ بالملف في جذر الـ repo باسم `PLAN.md`.

---

## 1. الفكرة باختصار

منصة تسمح لمتاجر متعددة (Vendors) بفتح حساب، إضافة منتجاتها، واستقبال وتنفيذ الطلبات. المنصة نفسها تاخد عمولة على كل عملية بيع، وبتدير التسجيل، الدفع، والتنسيق بين العميل والمتجر.

## 2. الأطراف الأساسية (Actors)

- **Customer** — بيدور، يشتري، يتابع الطلب.
- **Vendor (صاحب متجر)** — بيضيف منتجات، يستقبل طلبات، ينفذها.
- **Admin** — يدير الموافقة على المتاجر، العمولات، الفئات، النزاعات.

## 3. رحلة المستخدم (User Flows)

**Vendor:** تسجيل → مراجعة وموافقة الأدمن → استكمال بيانات المتجر → إضافة منتجات → استقبال طلبات → تنفيذ وشحن → تسوية مالية (Payout).

**Customer:** تصفح/بحث → إضافة للسلة (ممكن منتجات من أكتر من متجر في نفس الطلب) → دفع → تتبع كل جزء من الطلب لكل متجر لوحده.

**Admin:** موافقة/رفض متاجر → تحديد نسبة العمولة → إدارة الفئات → مراقبة كل الطلبات والمدفوعات → حل النزاعات.

**أهم نقطة معمارية في المشروع كله:** لو العميل اشترى من متجرين في نفس الأوردر، لازم الطلب "ينقسم" — كل متجر يشوف بس اللي يخصه، ويتابعه لوحده، وليه حالة شحن مستقلة (Sub-orders).

---

## 4. المراحل (Phases)

### Phase 1 — MVP (الأساس اللي المشروع مايقومش من غيره)

- Auth (Customer / Vendor / Admin) بأدوار مختلفة
- تسجيل متجر + موافقة الأدمن
- إضافة/تعديل منتجات (بدون variants — مؤجلة)
- تصفح + بحث + فلترة بسيطة (بالفئة)
- Checkout + سلة
- إنشاء طلب واحد ينقسم لـ sub-orders حسب المتجر
- دفع بوسيلة واحدة بس (حتى لو Cash on Delivery الأول لتسهيل الاختبار)
- Vendor Dashboard: يشوف طلباته ويغيّر حالتها
- Admin Dashboard: يشوف كل حاجة + يوافق على المتاجر

### Phase 2

- تسوية العمولة تلقائيًا + بوابة دفع حقيقية (Paymob لو مصر، أو Stripe Connect لو عالمي)
- إشعارات Email عند تغيّر حالة الطلب (على الأقل)
- Product variants (لون/مقاس) + مخزون لكل variant
- تقييمات ومراجعات

### Phase 3

- بحث متقدم (Full-text search زي Meilisearch)
- تحليلات ولوحة مبيعات للـ Vendor
- Payouts آلية للمتاجر (تسوية دورية)
- تكامل شحن حقيقي (شركة شحن/تتبع)
- **نظام النزاعات (Disputes)** (تفاصيله في القسم 6 تحت)

---

## 5. الـ Tech Stack المقترح

اختيار الـ stack ده متعمد إنه يكون واحد باسه TypeScript (من الفرونت للباك) عشان أدوات الـ AI زي Claude Code تشتغل عليه بكفاءة عالية — موثّق جدًا وشائع جدًا في بيانات التدريب.

| الطبقة | التقنية | السبب |
|---|---|---|
| Frontend + Backend | Next.js 14+ (TypeScript, App Router) | فريمورك واحد للفرونت والـ API، دعم AI ممتاز |
| Database | PostgreSQL | علاقات قوية (orders/inventory)، دعم Transactions حقيقي |
| ORM | Prisma | Schema واضح، migrations سهلة، الـ AI يتعامل معاه كويس جدًا |
| Auth | Auth.js (NextAuth) أو JWT | يدعم أدوار متعددة بسهولة مخصص |
| UI | Tailwind CSS + shadcn/ui | تسويق سريع |
| تخزين الصور | Cloudflare R2 / AWS S3 | تخزين ملفات مستقل عن السيرفر |
| الدفع | Paymob (بوابة موحدة: كارت + فودافون كاش + InstaPay بشكل تكميلي) | أشهر بوابة دفع محلية |
| الاستضافة | Vercel (App) + Neon/Supabase (Postgres) | نشر سريع بدون DevOps معقد |

بديل مقبول تمامًا لو حابب: Postgres/MySQL + Laravel فيه إيكوسيستم جاهز لمشاريع الماركت — لكن الـ Next.js stack أسهل في التطوير بمساعدة AI.

---

## 6. هيكل قاعدة البيانات (Core Schema) — 🆕v3 نسخة مصلّبة

**ملخص أهم التعديلات عن v2:**
- 🆕v3 **Indexes على كل الـ Foreign Keys** — من غير كده أي query زي "GET /api/vendor/orders" هيعمل full table scan على sub_orders لما البيانات تكبر.
- 🆕v3 **ON DELETE محدد لكل علاقة** — v2 ماكانتش بتحدده، يعني Postgres كان هيرفض أي DELETE فيه علاقات (default RESTRICT) بشكل غير مقصود. دلوقتي كل علاقة ليها سلوك واضح: `CASCADE` للبيانات التابعة (زي صور المنتج أو عناصر السلة)، `RESTRICT` للسجلات المالية/التاريخية (الطلبات، المدفوعات) عشان محدش يمسح يوزر ويطيّر سجل مبيعات.
- 🆕v3 **`products.slug` بقى unique لكل vendor مش عالميًا** (`UNIQUE(vendor_id, slug)`) — في v2 كان `UNIQUE` مطلق، وده كان هيمنع متجرين مختلفين من استخدام نفس الـ slug (مثلاً `iphone-15-case`) وهو سيناريو شائع جدًا في ماركت بلايس.
- 🆕v3 **`vendors.owner_id` بقى `UNIQUE NOT NULL`** — يوضّح صراحة إن كل يوزر بدور vendor عنده متجر واحد بس في Phase 1 (متسق مع الملاحظة في القسم 7.5).
- 🆕v3 **CHECK constraints على القيم الرقمية** (`price > 0`, `stock_quantity >= 0`, `quantity > 0`, إلخ) — عشان قاعدة البيانات نفسها ترفض بيانات فاسدة حتى لو فيه باج في الكود.
- 🆕v3 **`cart_items` بقى فيه `UNIQUE(cart_id, product_id)`** — يجبر منطق "إضافة للسلة" يكون `UPSERT` (زوّد الكمية لو المنتج موجود) بدل ما يعمل صف جديد لكل ضغطة.
- 🆕v3 **`carts.user_id UNIQUE`** — سلة نشطة واحدة لكل يوزر، أبسط بكتير لـ Phase 1 من دعم multiple carts.
- 🆕v3 **`sub_orders.commission_rate_snapshot`** — بنسخ نسبة العمولة وقت إنشاء الطلب. من غيرها لو الأدمن غيّر `commission_rate` بتاع المتجر بعد كده، مفيش طريقة تعرف الطلبات القديمة اتحسبت بأنهي نسبة (audit trail مهم لأي تسوية مالية).
- 🆕v3 **`orders.payment_status` بقى فيه `pending_verification`** — كان القسم 10 بيستخدم القيمة دي فعليًا لـ InstaPay اليدوي، لكن الـ CHECK في v2 ماكانش بيسمح بيها. تناقض بين القسمين اتصلح.
- 🆕v3 **`reviews.order_item_id` (اختياري)** — رابط لإثبات "verified purchase"، و`UNIQUE(product_id, user_id)` يمنع تكرار التقييم لنفس المنتج.
- 🆕v3 **`updated_at`** على الجداول اللي حالتها بتتغيّر (orders, sub_orders, products, vendors, payments) — Postgres مبيحدّثهاش تلقائيًا، فلازم تتحدد في Prisma بـ `@updatedAt` بدل ما تتنسى.

```sql
-- المستخدمین وكل الأدوار في جدول واحد
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(150) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  phone VARCHAR(20),
  role VARCHAR(20) NOT NULL CHECK (role IN ('customer','vendor','admin')),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now() -- 🆕v3
);
CREATE INDEX idx_users_role ON users(role); -- 🆕v3

-- بیانات المتجر (مرتبط بیوزر بدور vendor)
CREATE TABLE vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE RESTRICT, -- 🆕v3 UNIQUE (راجع 7.5)
  store_name VARCHAR(150) NOT NULL,
  slug VARCHAR(150) UNIQUE NOT NULL,
  description TEXT,
  logo_url TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','approved','suspended')),
  commission_rate DECIMAL(5,2) NOT NULL DEFAULT 10.00, -- نسبة عمولة المنصة %
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now() -- 🆕v3
);
CREATE INDEX idx_vendors_status ON vendors(status); -- 🆕v3

CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  parent_id UUID REFERENCES categories(id) ON DELETE SET NULL -- 🆕v3
);
CREATE INDEX idx_categories_parent ON categories(parent_id); -- 🆕v3

CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE, -- 🆕v3
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL, -- 🆕v3
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(200) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL CHECK (price > 0), -- 🆕v3
  stock_quantity INT NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0), -- 🆕v3
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active','draft','out_of_stock')),
  version INT NOT NULL DEFAULT 0, -- optimistic locking لمنع overselling
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(), -- 🆕v3
  UNIQUE (vendor_id, slug) -- 🆕v3 فريد لكل متجر مش عالميًا
);
CREATE INDEX idx_products_vendor ON products(vendor_id); -- 🆕v3
CREATE INDEX idx_products_category ON products(category_id); -- 🆕v3
CREATE INDEX idx_products_status ON products(status); -- 🆕v3

CREATE TABLE product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE, -- 🆕v3
  url TEXT NOT NULL,
  position INT DEFAULT 0
);
CREATE INDEX idx_product_images_product ON product_images(product_id); -- 🆕v3

-- عربة الشراء
CREATE TABLE carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE, -- 🆕v3 سلة واحدة نشطة لكل يوزر
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now() -- 🆕v3
);

CREATE TABLE cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE, -- 🆕v3
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE, -- 🆕v3
  quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0), -- 🆕v3
  UNIQUE (cart_id, product_id) -- 🆕v3 "إضافة للسلة" لازم تبقى UPSERT مش INSERT
);

-- ===== أھم جزء: تقسیم الطلب =====
-- الطلب الأب (اللي العمیل شافھ وقت الـ checkout)
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT, -- 🆕v3 RESTRICT: سجل الطلبات محمي
  order_number VARCHAR(30) UNIQUE NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount >= 0), -- 🆕v3
  shipping_address JSONB NOT NULL,
  payment_status VARCHAR(20) DEFAULT 'pending'
    CHECK (payment_status IN ('pending','pending_verification','paid','failed','refunded')), -- 🆕v3 أضفنا pending_verification (InstaPay اليدوي، قسم 10)
  idempotency_key VARCHAR(100), -- يمنع تكرار الطلب لو الـ request اتكرر
  expires_at TIMESTAMP, -- 🆕v3 (TTL) تحرير المخزون لو لم يتم الدفع
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(), -- 🆕v3
  UNIQUE (user_id, idempotency_key) -- 🆕v3 ربط الـ idempotency بالمستخدم
);
CREATE INDEX idx_orders_user ON orders(user_id); -- 🆕v3

-- الطلب الفرعي: واحد لكل متجر داخل نفس الأوردر
CREATE TABLE sub_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE, -- 🆕v3
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE RESTRICT, -- 🆕v3
  status VARCHAR(20) DEFAULT 'pending'
    CHECK (status IN ('pending','confirmed','processing','shipped','delivered','cancelled')),
  subtotal DECIMAL(10,2) NOT NULL CHECK (subtotal >= 0), -- 🆕v3
  commission_rate_snapshot DECIMAL(5,2) NOT NULL, -- 🆕v3 نسخة من commission_rate وقت الطلب (audit trail)
  commission_amount DECIMAL(10,2) NOT NULL CHECK (commission_amount >= 0), -- 🆕v3
  vendor_payout_amount DECIMAL(10,2) NOT NULL CHECK (vendor_payout_amount >= 0), -- 🆕v3
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now() -- 🆕v3
);
CREATE INDEX idx_sub_orders_order ON sub_orders(order_id); -- 🆕v3
CREATE INDEX idx_sub_orders_vendor ON sub_orders(vendor_id); -- 🆕v3 يسرّع GET /api/vendor/orders جدًا
CREATE INDEX idx_sub_orders_status ON sub_orders(status); -- 🆕v3

CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sub_order_id UUID NOT NULL REFERENCES sub_orders(id) ON DELETE CASCADE, -- 🆕v3
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT, -- 🆕v3 يحافظ على تاريخ الطلب لو المنتج اتحذف
  quantity INT NOT NULL CHECK (quantity > 0), -- 🆕v3
  unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0), -- 🆕v3
  total_price DECIMAL(10,2) NOT NULL CHECK (total_price >= 0) -- 🆕v3
);
CREATE INDEX idx_order_items_sub_order ON order_items(sub_order_id); -- 🆕v3

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE RESTRICT, -- 🆕v3
  provider VARCHAR(30) NOT NULL, -- 🆕v3 'paymob_card' | 'vodafone_cash' | 'instapay' | 'cod'
  provider_transaction_id VARCHAR(100),
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0), -- 🆕v3
  status VARCHAR(20) DEFAULT 'pending'
    CHECK (status IN ('pending','pending_verification','succeeded','failed','refunded')), -- 🆕v3 وضّحنا القيم الممكنة
  paid_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now(), -- 🆕v3
  UNIQUE (provider, provider_transaction_id) -- يمنع معالجة نفس webhook مرتين
);
CREATE INDEX idx_payments_order ON payments(order_id); -- 🆕v3

CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE, -- 🆕v3
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- 🆕v3
  order_item_id UUID REFERENCES order_items(id) ON DELETE SET NULL, -- 🆕v3 (اختياري) لإثبات verified purchase
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5), -- 🆕v3
  comment TEXT,
  created_at TIMESTAMP DEFAULT now(),
  UNIQUE (product_id, user_id) -- 🆕v3 يمنع تقييم مكرر لنفس المنتج
);
CREATE INDEX idx_reviews_product ON reviews(product_id); -- 🆕v3

-- Phase 3 فقط — نزاعات
CREATE TABLE disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sub_order_id UUID NOT NULL REFERENCES sub_orders(id) ON DELETE CASCADE, -- 🆕v3
  opened_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT, -- 🆕v3
  reason TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open','under_review','resolved','rejected')),
  resolution TEXT,
  created_at TIMESTAMP DEFAULT now(),
  resolved_at TIMESTAMP
);
CREATE INDEX idx_disputes_sub_order ON disputes(sub_order_id); -- 🆕v3
```

**العلاقة المهمة:** orders (1) → sub_orders (متعدد، واحد لكل vendor) → order_items (متعدد). ده اللي بيخليك تعمل تتبع مستقل لكل متجر، وتحسب عمولة المنصة تلقائيًا على مستوى الـ sub_order.

> 🆕v3 **ملاحظة لـ Prisma:** لما تحوّل الـ schema ده لـ `schema.prisma`، استخدم `@updatedAt` على كل حقل `updated_at` عشان Prisma يحدّثه تلقائيًا مع كل `update()` — من غيرها الحقل هيفضل ثابت على قيمة الإنشاء.

---

## 🆕 7. نقاط معمارية حرجة — لازم تتثبت قبل أي كود

هذه النقاط أهم من أي feature، لأن أي غلط فيها هيتكرر في كل حاجة مبنية فوقها. راجعها مع الـ AI قبل ما يلمس أي endpoint.

### 7.1 منع Overselling (Stock Concurrency)

خصم `stock_quantity` وقت الـ checkout **لازم** يحصل جوه transaction واحدة، مع قفل الصف:

```sql
BEGIN;
SELECT stock_quantity, version FROM products WHERE id = $1 FOR UPDATE;
-- تحقق إن الكمية كافية، وإلا rollback وارجع خطأ "out of stock"
UPDATE products SET stock_quantity = stock_quantity - $2, version = version + 1
WHERE id = $1 AND version = $3; -- لو صفر rows اتأثرت → race condition، رجّع خطأ وخلي العميل يعيد المحاولة
COMMIT;
```

قوله للـ AI صراحة: "لا تسمح بإنشاء order_item لمنتج بدون قفل الصف والتحقق من الكمية داخل نفس الـ transaction اللي بينشئ الطلب."

### 7.2 منطق الـ Checkout بالتفصيل

اكتب الـ spec ده كـ prompt منفصل قبل ما تخلي الـ AI يكتب كود الـ endpoint:

- **Idempotency:** الـ client لازم يولّد ويبعت `Idempotency-Key` header. يتم حفظه في `orders.idempotency_key`. لو نفس المفتاح جه تاني، تحقق أولاً أنه يخص نفس الـ `user_id` (لحماية الـ key من الاستخدام الخاطئ)، ثم رجّع نفس الـ order الموجود.
- **إعادة التحقق من التوفر (مع Retries):** أعد التحقق من كل منتج في السلة. الأهم: عند فشل التحديث بسبب الـ `version` (Optimistic Locking)، قم بعمل إعادة محاولة (Automatic Retry) حتى 3 مرات لقراءة المخزون الجديد والمحاولة مجدداً قبل إظهار خطأ "نفدت الكمية" للعميل.
- **قاعدة التقريب (Rounding):** حدد إزاي بيتحسب commission_amount لو فيه كسور (مثلاً: `ROUND(subtotal * commission_rate / 100, 2)` باستخدام banker's rounding أو نص لأعلى — وثّقها في الكود نفسه كتعليق).
- **الـ Commission Snapshot:** يتم حفظ نسبة العمولة وقت الطلب لتسهيل عمليات الاسترجاع (Refunds) لاحقاً بدقة، حتى لو تغيرت نسبة عمولة المتجر في المستقبل.
- كل ده لازم يحصل جوه transaction واحدة: خصم stock + إنشاء order + إنشاء sub_orders (مع نسخ `commission_rate_snapshot` من الـ vendor) + إنشاء order_items، أو يفشل الكل مع بعض.

### 7.2.1 فشل الدفع بعد حجز المخزون (TTL / Expired Orders)

بما أن المخزون يُخصم فور إنشاء الطلب، قد يبقى محجوزاً للأبد إذا تخلى المستخدم عن الدفع.
- يجب تحديد حقل `expires_at` عند إنشاء الطلب (مثلاً بعد 30 دقيقة).
- يجب إنشاء Cron Job (أو استخدام خدمة مثل Upstash QStash) تعمل بشكل دوري للبحث عن الطلبات التي حالتها `payment_status = 'pending'` وتجاوزت وقت `expires_at`.
- هذه الـ Job تقوم بتحويل الطلب إلى `cancelled` وإرجاع الكميات (Increment) إلى جدول `products`.

### 7.3 أمان الـ Payment Webhook

- **Signature verification:** كل webhook من Paymob لازم يتحقق من الـ HMAC signature بتاعته قبل ما تعتمد على البيانات جواه. من غير التحقق ده، أي حد يقدر يبعت طلب مزيف ويأكد دفع وهمي.
- **Race Condition Handling:** في حال وصول الـ Webhook قبل اكتمال تخزين الطلب (الـ Transaction لم تُغلق بعد)، يجب أن يرد الـ Endpoint بحالة `404 Not Found` أو `409 Conflict`. هذا سيُجبر بوابات الدفع مثل Paymob على عمل إعادة محاولة (Exponential Backoff Retry) لاحقاً.
- **Idempotency:** الـ webhooks ممكن توصل أكتر من مرة (retries من الـ provider نفسه). استخدم الـ `UNIQUE (provider, provider_transaction_id)` في جدول payments، واعمل upsert مش insert — لو الـ transaction_id موجود قبل كده، تجاهل أو حدّث الحالة فقط، متعملش عملية دفع تانية.

### 7.4 Connection Pooling (Neon + Prisma + Vercel)

Vercel serverless بيفتح connection جديدة لكل invocation، وده بيستهلك connections بسرعة. من أول يوم:
- فعّل الـ pooled connection string بتاع Neon (فيه endpoint منفصل للـ pooling، مختلف عن الـ direct connection).
- أو استخدم Prisma Accelerate.
- خلي الـ `DATABASE_URL` في `.env` يشاور على الـ pooled endpoint من البداية، مش تصلحها لما تبدأ تواجه مشاكل في الإنتاج.

### 7.5 نطاق دور Vendor مقابل Customer

جدول `users` فيه `role` واحد فقط (customer/vendor/admin exclusive)، و`vendors.owner_id` بقى `UNIQUE` (🆕v3) — يعني كل يوزر بدور vendor عنده متجر واحد بالظبط. في الواقع صاحب متجر ممكن يشتري كعميل عادي؛ الـ schema مش بيمنع ده لأن `orders.user_id` مربوط بالـ user مش بالـ role — سيبها كده في Phase 1، بس افتكرها لو حبيت تعمل مستقبلًا "وضع بائع / وضع مشتري" لنفس الحساب.

### 7.6 🆕v3 الـ Indexes مش اختيارية

كل الـ Foreign Keys في القسم 6 دلوقتي معاها index مقابل. ده مش تحسين لاحق — من غيره أول ما يبقى عندك كذا مية sub_order، صفحة "GET /api/vendor/orders" هتعمل full scan على الجدول كله كل مرة. قوله للـ AI: "الـ indexes المذكورة في schema.prisma (قسم 6) جزء أساسي من الـ migration الأولى، مش إضافة لاحقة."

---

## 8. أهم الـ API Endpoints (نظرة سريعة)

```
POST /api/auth/register          تسجیل customer/vendor
POST /api/auth/login

GET  /api/products                تصفح/بحث/فلترة
GET  /api/products/:slug

POST  /api/vendor/products        إضافة منتج (vendor only)
PATCH /api/vendor/products/:id

POST /api/cart/items

POST /api/checkout                يتطلب Idempotency-Key header — ینشئ order + sub_orders تلقائیاً
GET  /api/orders/:id              تتبع الطلب (customer)

GET   /api/vendor/orders          طلبات المتجر (vendor)
PATCH /api/vendor/orders/:id/status

GET   /api/admin/vendors          إدارة المتاجر
PATCH /api/admin/vendors/:id/approve

POST /api/webhooks/paymob         يتحقق من الـ signature قبل أي معالجة
```

---

## 9. الدفع وتقسيم الفلوس بين المنصة والمتجر

دي أعقد نقطة على أي Marketplace. فيه موديلين شائعين:

1. **عند الدفع مباشرة: Split (زي Stripe Connect)** — توزّع الفلوس فورًا بين المنصة والمتجر. أعقد تقنيًا بس أنضف محاسبيًا.
2. **تحصيل مركزي + تسوية دورية (الأشيع في المنطقة):** كل الفلوس تدخل حساب المنصة، وبعدين المنصة تعمل Payout للمتاجر أسبوعيًا/شهريًا بعد خصم العمولة. أسهل في التنفيذ وده اللي بوابات زي Paymob/Fawry بتدعمه بسهولة أكتر من الـ split المباشر.

**نصيحتي للتاسك ده:** ابدأ بالموديل التاني (تحصيل مركزي) — أبسط بكتير وهيخليك تسلّم أسرع.

---

## 10. تفاصيل الدمج — فودافون كاش و InstaPay

### فودافون كاش (Vodafone Cash)
- مدعوم بالكامل ومباشر عن طريق Paymob — بيتعامل معاه كـ "Wallet integration" جنب الـ Card integration في نفس الحساب.
- الفكرة تقنيًا: بتتعمل Payment Intention واحدة في الـ Checkout API (نفس API الـ Card)، وبتحدد الـ `integration_id` بتاع الـ wallet. العميل بياخد OTP على تليفونه لتأكيد الدفع، والـ webhook بيرجعلك تأكيد الدفع زي أي وسيلة تانية.
- تسجله بـ `provider = 'vodafone_cash'` في جدول payments.
- ✅ جاهز وموثّق كويس في Phase 1 — اديه أولوية وحطه من أول 2.

### InstaPay
- كوسيلة دفع مباشرة داخل الـ checkout API: ده الجزء المهم اللي لازم تاخده في الاعتبار — أكبر بوابة دفع في مصر Paymob لسه مش متاحة بشكل كامل للتجار الصغيرة/المتوسطة. حتى في التوثيق بتاعته لسه حاطط تحت بند "Coming Soon".
- InstaPay أساسًا شبكة تحويلات بنكية فورية بين البنوك (تابعة للبنك المركزي المصري)، مش بوابة دفع زي الكارت أو المحافظ — عشان كده الدمج المباشر لسه بيتوسع تدريجيًا لتجارة إلكترونية جاهزة عبر الـ PSPs.
- **البديل العملي المتاح رسميًا دلوقتي:**
  1. وقت الـ checkout تعرض للعميل رقم المحفظة/الـ IPA أو QR code بتاع المنصة.
  2. العميل يحوّل من تطبيق InstaPay بتاعه.
  3. يرفع صورة إيصال التحويل (أو رقم العملية)، والطلب يتسجل بحالة `payment_status = 'pending_verification'`.
  4. الأدمن (أو نظام مطابقة تلقائي لاحقًا) يأكد استلام الفلوس ويحوّل الطلب لـ `paid`.
- هذا الأسلوب متاح فعليًا في مواقع مصرية كتير دلوقتي لحد ما يكتمل تكامل InstaPay الرسمي.
- **لما تيجي لـ Phase 2:** راجع وقتها حالة الـ InstaPay API عند Paymob (أو Kashier/Fawry) — زي فودافون كاش بالظبط، المتوقع يبقى متاح رسمي قريب، وساعتها تستبدل الخطوة اليدوية بـ API call.

### تأثير ده على التصميم
- خلي جدول `payments` عندك فيه `provider` كـ enum مرن مش قيمة ثابتة في الكود، عشان تضيف/تشيل وسائل دفع من غير ما تغيّر الـ schema.
- خلي حالة `payment_status = 'pending_verification'` موجودة على الـ orders من الأول (🆕v3: دلوقتي مسموح بيها فعليًا في الـ CHECK constraint في قسم 6).
- اعزل منطق الدفع في `PaymentService`/`Provider` واحد (بحيث كل وسيلة دفع (Card / Vodafone Cash / InstaPay اليدوي) عندها implementation خاصة بيها)، وده هيسهّل جدًا إنك تبدّل من اليدوي للـ API لما يتاح بدون ما تلمس باقي الكود.

---

## 11. تعليمات التنفيذ الكاملة للـ AI Coding Tool — 🆕v3 مُرتّبة كـ prompts جاهزة للنسخ

اتبع الترتيب ده بالظبط. **متسبش الأداة تعمل أكتر من موديول في نفس الجلسة من غير ما تراجع.** كل برومبت تحت جاهز تنسخه زي ما هو.

### الخطوة 0 — التجهيز

1. حط الملف ده في جذر الـ repo باسم `PLAN.md`.
2. أول prompt تبعته:

```
اقرأ PLAN.md كامل، وافهم النقاط المعمارية في القسم 7 قبل أي حاجة.
لسه متكتبش أي كود.
```

---

### الخطوة 1 — Schema أولًا (لا كود قبلها)

```
اعمل ملف schema.prisma الكامل بناءً على القسم 6 في PLAN.md،
مع مراعاة كل النقاط في القسم 7 — خصوصًا:
- version column على products (optimistic locking)
- idempotency_key على orders
- UNIQUE constraint على payments (provider, provider_transaction_id)
- كل الـ indexes المذكورة على الـ foreign keys (قسم 7.6)
- ON DELETE behavior زي ما هو محدد لكل علاقة
- commission_rate_snapshot على sub_orders
- استخدم @updatedAt على كل حقل updated_at

لا تكتب أي endpoint أو UI دلوقتي.
```

**✅ راجع بنفسك قبل ما تكمل:**
- [ ] كل جدول وعلاقة موجودة زي القسم 6
- [ ] `version`، `idempotency_key`، `UNIQUE` على payments موجودين
- [ ] الـ indexes على الـ FKs موجودة كلها (مش بس الـ unique ones)
- [ ] `ON DELETE` محدد على كل علاقة (مفيش علاقة سايبة على الـ default)

---

### الخطوة 2 — Project scaffolding

```
جهّز هيكل مشروع Next.js 14 (App Router, TypeScript) مع Prisma
وTailwind وshadcn/ui، واعمل اتصال بقاعدة بيانات Neon باستخدام
الـ pooled connection string (مش direct).
```

**✅ راجع:** `.env.example` فيه متغير منفصل واضح لـ pooled vs direct connection.

---

### الخطوة 3 — Module: Auth

```
نفّذ موديول Auth بس (تسجيل/دخول لـ customer/vendor/admin)
باستخدام [Auth.js أو JWT]. استخدم Zod للتحقق من كل input.
لا تلمس أي موديول تاني.
```

**✅ راجع:** الأدوار الثلاثة شغالة، الـ validation موجود، الباسورد بيتعمله hash صح.

---

### الخطوة 4 — Module: Products

```
نفّذ CRUD المنتجات للـ vendor (بدون variants)، مع صفحات
تصفح/بحث/فلترة للعميل.
```

**✅ راجع:** الـ vendor يقدر يضيف منتج بس لمتجره هو مش لمتجر تاني (authorization check).

---

### الخطوة 5 — Module: Cart / Checkout ⚠️ (الأهم)

```
نفّذ السلة والـ checkout حسب القسم 7.1 و7.2 في PLAN.md بالتفصيل:
قفل الصف عند خصم الـ stock، عمل Retries للـ Optimistic Locking، 
transaction واحدة لكل حاجة، وضع expires_at (TTL) للطلب، 
ونسخ commission_rate من الـ vendor وقت الإنشاء، ودعم Idempotency-Key 
مرتبط بـ user_id.
اطلب مني توضيح أي جزء غامض قبل ما تبدأ.
```

**✅ راجع (لا تتجاوز هذه الخطوة بدون تأكد):**
- [ ] فعلاً في `SELECT ... FOR UPDATE` أو optimistic locking؟
- [ ] الـ order + sub_orders + order_items + خصم stock كلهم جوه transaction واحدة؟
- [ ] تكرار نفس الـ Idempotency-Key بيرجع نفس الـ order بدل ما ينشئ واحد جديد؟
- [ ] `commission_rate_snapshot` بتتسجل من قيمة الـ vendor الحالية وقت الطلب؟

---

### الخطوة 6 — Module: Payments (Vodafone Cash أولًا)

```
نفّذ تكامل الدفع حسب القسم 10: ابدأ بـ Vodafone Cash عبر Paymob،
مع InstaPay كخطوة يدوية (رفع إيصال + مراجعة أدمن) حسب القسم 10.2.
نفّذ الـ webhook مع signature verification إجباري، وupsert
idempotent على جدول payments.
```

**✅ راجع:**
- [ ] جرّب تبعت نفس الـ webhook payload مرتين — تأكد مفيش تكرار في التسجيل.
- [ ] جرّب تبعت webhook بدون signature صحيح — لازم يترفض.

---

### الخطوة 7 — Module: Orders (Vendor Dashboard)

```
نفّذ Vendor Dashboard: عرض الطلبات الخاصة بالمتجر بس،
وتحديث حالة الـ sub_order.
```

**✅ راجع:** vendor A مايقدرش يشوف أو يعدّل طلبات vendor B.

---

### الخطوة 8 — Module: Admin Dashboard

```
نفّذ Admin Dashboard: موافقة/رفض المتاجر، عرض كل الطلبات والمدفوعات.
```

---

### الخطوة 9 — Seed Data

```
اكتب لي seed script فيه بيانات تجريبية واقعية
(3 متاجر، 15 منتج، 5 عملاء، أوردرات متنوعة).
```

---

## 12. قاعدة عامة أثناء التنفيذ

- **Git commit صغير بعد كل feature** — مش بعد كل موديول كامل.
- **schema.prisma هو "مصدر الحقيقة"** — أي تعديل في البيانات يبدأ منه، مش من الكود مباشرة.
- لو الأداة اقترحت تغيير في الـ schema وسط أي موديول، وقفها وارجع حدّث `PLAN.md` نفسه الأول، بعدين كمّل — عشان الملف يفضل مرجع صحيح طول الوقت.
- ماتوافقش على الانتقال لموديول جديد من غير ما تعدّي على الـ checklist بتاع المراجعة اللي فوق، خصوصًا الخطوة 5 و6.

---

## 13. خطوة تالية

لو موافق على الخطة دي، جاهز أساعدك:
- تراجع الـ `schema.prisma` اللي الأداة هتطلعه أول ما توصل للخطوة 1.
- أو تكتب أول prompt بالظبط اللي هتبعته للـ IDE دلوقتي لو عايز أصيغه بالكامل جاهز للنسخ.
