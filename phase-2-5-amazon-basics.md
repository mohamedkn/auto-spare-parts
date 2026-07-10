# زي — Phase 2.5: أساسيات تجربة أمازون (ملحق لـ PLAN.md)

> ده ملحق يُقرأ بعد إتمام Phase 1 و Phase 2 (المذكورين في PLAN.md الأصلي). الهدف: إضافة العناصر اللي بتخلي تجربة العميل تحس إنها "منصة كاملة" زي أمازون في الأساسيات — من غير الدخول في تعقيدات ML أو لوجستيات حقيقية. بعد إتمام المرحلة دي، نرجع لقائمة "جاهزية الإطلاق" (استرجاع/استبدال، حماية COD، ToS، rate limiting) قبل أي إطلاق فعلي.
>
> احتفظ بالملف ده في جذر الـ repo باسم `PLAN-2.5.md` جنب `PLAN.md`.

---

## 1. نطاق المرحلة

| # | العنصر | القيمة للعميل |
|---|---|---|
| 1 | صفحة منتج غنية (صور متعددة، توفر واضح) | ثقة في الشراء |
| 2 | فلاتر بحث (سعر، فئة، تقييم، توفر) | يلاقي اللي عايزه بسرعة |
| 3 | Wishlist / المفضلة | يرجع لمنتج شافه قبل كده |
| 4 | سجل الطلبات (Order History) | يتابع مشترياته القديمة |
| 5 | عناوين شحن متعددة | تجربة checkout أسرع |
| 6 | منتجات مشابهة ("عملاء اشتروا كمان") | زيادة معدل الشراء |
| 7 | تقييم المتجر (Vendor Rating) | ثقة في المتجر مش بس المنتج |
| 8 | صفحة تصفح فئات بصريًا | اكتشاف منتجات جديدة |

**ترتيب البناء:** schema أولًا لكل الجداول الجديدة دفعة واحدة (عشان ما نعملش migrations متكررة)، بعدين كل ميزة بموديول منفصل زي أسلوب PLAN.md الأصلي.

---

## 2. إضافات Schema المطلوبة

```sql
-- ===== Wishlist =====
CREATE TABLE wishlist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT now(),
  UNIQUE (user_id, product_id) -- منع تكرار نفس المنتج في مفضلة نفس اليوزر
);
CREATE INDEX idx_wishlist_user ON wishlist_items(user_id);
CREATE INDEX idx_wishlist_product ON wishlist_items(product_id);

-- ===== عناوين شحن متعددة =====
CREATE TABLE user_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label VARCHAR(50) NOT NULL, -- 'المنزل', 'الشغل', إلخ
  full_name VARCHAR(150) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  governorate VARCHAR(100) NOT NULL,
  city VARCHAR(100) NOT NULL,
  street_address TEXT NOT NULL,
  building_apartment VARCHAR(100),
  landmark VARCHAR(150), -- علامة مميزة، مهم جدًا في العناوين المصرية
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
CREATE INDEX idx_addresses_user ON user_addresses(user_id);
-- ملاحظة تطبيقية: التأكد من عنوان افتراضي واحد بس لكل يوزر يتم في application logic
-- (transaction: إلغاء is_default القديم قبل تفعيل الجديد) مش عبر constraint مباشر

-- ===== تقييم المتجر (Cached Aggregate) =====
ALTER TABLE vendors ADD COLUMN avg_rating DECIMAL(3,2) DEFAULT NULL;
ALTER TABLE vendors ADD COLUMN reviews_count INT NOT NULL DEFAULT 0;
-- بيتحدّث عن طريق trigger أو application logic بعد كل review جديد على منتج تابع للمتجر
-- (تفاصيل التنفيذ في القسم 4 تحت — مفضّل trigger عشان يفضل متسق حتى لو bulk update)

-- shipping_address في orders (موجود بالفعل كـ JSONB في PLAN.md) يفضل زي ما هو
-- لكن وقت الـ checkout، الاختيار بيبقى من user_addresses وبتتنسخ قيمته كـ snapshot
-- في orders.shipping_address (نفس منطق commission_rate_snapshot — سجل تاريخي محمي
-- حتى لو العميل عدّل/مسح العنوان بعدين)
```

**ليه snapshot للعنوان مش FK مباشر؟** لو ربطنا `orders.address_id` بـ `user_addresses.id` مباشرة، وحذف العميل العنوان بعد الطلب، هتضيع بيانات شحن طلب فعلي. نفس منطق `commission_rate_snapshot` في PLAN.md الأصلي — بننسخ القيمة وقت الحدث، مش بنربط مرجع حي.

---

## 3. الميزات وتنفيذها

### 3.1 صفحة منتج غنية + فلاتر بحث

**لا حاجة لـ schema إضافي** — `product_images` و`products` موجودين بالفعل من PLAN.md. الشغل هنا كله backend query + frontend.

**الفلاتر المطلوبة:**
- نطاق سعر (`price BETWEEN`)
- فئة (`category_id`)
- الحد الأدنى للتقييم (يحتاج JOIN مع aggregate على reviews — احسبها بـ query مش column محسوب لتفادي تعقيد إضافي في المرحلة دي)
- التوفر (`stock_quantity > 0` أو مجموع stock الـ variants)

### 3.2 Wishlist

منطق بسيط: toggle add/remove، مع عرض المنتجات المحفوظة في صفحة منفصلة. لازم authorization check إن العميل بس يقدر يشوف/يعدّل الـ wishlist بتاعته.

### 3.3 سجل الطلبات

البيانات موجودة بالفعل (orders + sub_orders من PLAN.md). المطلوب endpoint + صفحة تجمّع الطلبات بترتيب زمني، مع تفاصيل كل sub-order وحالتها.

### 3.4 عناوين شحن متعددة

CRUD كامل على `user_addresses`، مع منطق "عنوان افتراضي واحد بس" (transaction تلغي القديم وتفعّل الجديد). في الـ checkout، العميل يختار من العناوين المحفوظة أو يضيف واحد جديد.

### 3.5 منتجات مشابهة

نسخة مبسّطة بدون ML، بمصدرين:
1. **نفس الفئة** — أبسط، منتجات تانية بنفس `category_id`
2. **"عملاء اشتروا كمان"** — query على `order_items`: هات المنتجات اللي ظهرت في نفس `order_id` مع المنتج الحالي، رتبهم بعدد التكرار

القرار الثاني أعقد شوية بس بيدّي قيمة حقيقية أكتر من فلترة الفئة وحدها.

### 3.6 تقييم المتجر (Vendor Rating)

بيتحدّث تلقائيًا كل ما review جديدة تتضاف على منتج تابع لمتجر — إما trigger في Postgres أو application logic جوه نفس transaction إنشاء الـ review (الأسهل في مرحلة أولى: application logic، عشان الأداة تقدر تتابعه وتـ debug بسهولة أكتر من trigger مخفي).

### 3.7 صفحة تصفح فئات بصريًا

Frontend فقط — شبكة فئات بصور، تحتاج إضافة `image_url` لجدول `categories` (مفقود في PLAN.md الأصلي).

```sql
ALTER TABLE categories ADD COLUMN image_url TEXT;
```

---

## 4. تعليمات التنفيذ الكاملة للـ AI Coding Tool

نفس القاعدة من PLAN.md: خطوة واحدة في كل جلسة، مراجعة قبل الانتقال.

### الخطوة 1 — Schema Update

```
اقرأ PLAN-2.5.md كامل. حدّث schema.prisma بإضافة:
- جدول wishlist_items (القسم 2)
- جدول user_addresses (القسم 2) مع منطق is_default
- عمودين avg_rating وreviews_count على vendors
- عمود image_url على categories
لا تلمس أي جدول موجود غير كده. لا تكتب endpoints دلوقتي.
```

**✅ راجع:**
- [ ] `UNIQUE(user_id, product_id)` على wishlist_items موجود
- [ ] indexes على الـ foreign keys الجديدة موجودة
- [ ] الأعمدة الجديدة على vendors nullable/default صح (مش هتكسر بيانات موجودة)

---

### الخطوة 2 — صفحة منتج + فلاتر البحث

```
حسّن صفحة المنتج: عرض كل الصور من product_images، حالة توفر واضحة
(نفذ/متوفر X قطعة). أضف فلاتر بحث على صفحة التصفح: نطاق سعر، فئة،
حد أدنى للتقييم (average من جدول reviews)، وتوفر. الفلاتر لازم تشتغل
مع بعض (AND) مش لوحدها.
```

**✅ راجع:** جرّب فلترين مع بعض (سعر + فئة) وتأكد النتيجة صح مش بس آخر فلتر اتطبق.

---

### الخطوة 3 — Wishlist

```
نفّذ Wishlist: زرار إضافة/إزالة من صفحة المنتج وصفحة التصفح، وصفحة
منفصلة "المفضلة" للعميل. تأكد إن عميل A مايقدرش يشوف أو يعدّل
wishlist بتاع عميل B.
```

**✅ راجع:** authorization check موجود على كل endpoint خاص بالـ wishlist.

---

### الخطوة 4 — سجل الطلبات

```
نفّذ صفحة "طلباتي" للعميل: عرض كل الطلبات بترتيب زمني (الأحدث أولًا)،
كل طلب يعرض الـ sub-orders بتاعته وحالة كل واحدة لوحدها، مع تفاصيل
المنتجات المطلوبة.
```

---

### الخطوة 5 — عناوين شحن متعددة

```
نفّذ CRUD عناوين الشحن (user_addresses) في صفحة حساب العميل، مع منطق
"عنوان افتراضي واحد بس" (لما يتفعّل عنوان جديد كـ default، الغي القديم
جوه transaction واحدة). حدّث الـ checkout عشان يعرض العناوين المحفوظة
للاختيار، ووقت إنشاء الطلب، انسخ بيانات العنوان المختار كـ snapshot
في orders.shipping_address (زي منطق commission_rate_snapshot في
PLAN.md الأصلي — القسم 3.4 هنا).
```

**✅ راجع:**
- [ ] عنوان افتراضي واحد بس ممكن يكون فعّال في نفس الوقت
- [ ] حذف عنوان من user_addresses مايأثرش على طلبات قديمة استخدمته (لأنه snapshot)

---

### الخطوة 6 — منتجات مشابهة

```
أضف قسم "منتجات مشابهة" في صفحة المنتج: أولًا منتجات تانية بنفس
الفئة (fallback بسيط)، وإضافة قسم "عملاء اشتروا كمان" مبني على query
لـ order_items بيلاقي المنتجات اللي ظهرت في نفس الطلبات مع المنتج
الحالي، مرتبة بعدد مرات التكرار. لو مفيش بيانات كفاية (منتج جديد
مثلاً)، اعرض بس قسم "نفس الفئة".
```

---

### الخطوة 7 — تقييم المتجر

```
قبل أي حاجة: أضف تحقق إجباري في endpoint إنشاء الـ review — تأكد إن
req.user.id فعلاً مالك order_item حقيقي لنفس المنتج (يعني موجود
order_item يخص هذا المنتج، جوه sub_order يخص order مالكه هو نفس
اليوزر، والحالة delivered على الأقل). لو التحقق فشل، ارجع 403
ومتنشئش الـ review. لو نجح، اربط order_item_id في الـ review (مش
اختياري فعليًا حتى لو الـ schema بيسمح NULL).

بعد كده: حدّث منطق إنشاء الـ review عشان بعد إضافة review جديدة (اللي
عدّت التحقق فوق)، احسب واحدّث avg_rating وreviews_count على جدول
vendors بتاع المتجر صاحب المنتج، جوه نفس transaction إنشاء الـ review.
اعرض تقييم المتجر في صفحة المتجر العامة وجنب اسم المتجر في صفحة المنتج.
```

**✅ راجع:**
- [ ] جرّب تعمل review لمنتج ماشتريتوش خالص — لازم يترفض بـ 403
- [ ] جرّب تعمل review لمنتج اشتريته بس لسه مش delivered — لازم يترفض
- [ ] جرّب تضيف عدة reviews على منتجات مختلفة لنفس المتجر، وتأكد avg_rating بيتحسب صح (مش بس آخر review)

---

### الخطوة 8 — صفحة تصفح فئات بصريًا

```
نفّذ صفحة "تصفح الفئات": شبكة بصرية بالصور (من categories.image_url)
بدل الاعتماد على dropdown بس. لو فئة معندهاش صورة، استخدم placeholder
موحّد.
```

---

## 5. بعد إتمام المرحلة دي

**متنساش:** المرحلة دي بتحسّن التجربة لكنها مش بديل عن عناصر جاهزية الإطلاق الأساسية:

- سياسة الاسترجاع/الاستبدال + workflow الـ vendor
- تسجيل ومتابعة رفض استلام COD (حماية من الاحتيال)
- Terms of Service + سياسة خصوصية
- Rate limiting على الـ API

دي المرحلة اللي المفروض تيجي بعد كده مباشرة قبل أي إطلاق فعلي — نناقشها بالتفصيل لما تخلص هنا.

---

## 6. قاعدة عامة أثناء التنفيذ

نفس قواعد PLAN.md الأصلي (القسم 12): commit صغير بعد كل feature، schema.prisma مصدر الحقيقة، أي تعديل schema وسط موديول يوقف التنفيذ ويترجع لتحديث الملف الأول.
