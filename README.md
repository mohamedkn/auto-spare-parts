# AutoParts Pro

منصة متعددة المتاجر لقطع غيار السيارات، وتتكون من:

- موقع Next.js للعملاء والإدارة والبائعين.
- تطبيق Expo للعملاء داخل `mobile-app`.
- تطبيق Expo للبائعين داخل `vendor-app`.
- تطبيق Expo لمندوبي التوصيل داخل `delivery-app`.
- PostgreSQL وPrisma لإدارة المنتجات والطلبات والمدفوعات والتوصيل.

## التشغيل المحلي

1. انسخ `.env.example` إلى `.env.local` وأدخل بيانات قاعدة البيانات والخدمات.
2. ثبّت الاعتماديات باستخدام `npm install`.
3. طبّق الترحيلات باستخدام `npx prisma migrate deploy`.
4. شغّل الموقع باستخدام `npm run dev`.

لتطبيقات Expo، انسخ ملف `.env.example` داخل كل تطبيق إلى `.env` واضبط
`EXPO_PUBLIC_API_BASE_URL` على عنوان خادم Next.js.

## التحقق قبل النشر

```bash
npm run typecheck
npm test
npm run lint
npm run build
```

يجب تشغيل فحص TypeScript أيضًا داخل مجلدات تطبيقات Expo الثلاثة.

## ملاحظات تشغيلية

- مسار تحديث بيانات المنتجات التجريبية أصبح `POST /api/seed-products` ومتاحًا للأدمن فقط.
- انتقالات الاستلام والتسليم تتطلب مسارات OTP ولا يمكن تحديثها مباشرة.
- Paymob يتطلب `PAYMOB_API_KEY` و`PAYMOB_HMAC_SECRET` و`PAYMOB_INTEGRATION_ID` و`PAYMOB_IFRAME_ID` في الإنتاج.
- لا تسجل أي تسوية كبند مدفوع من دون مرجع تحويل.
