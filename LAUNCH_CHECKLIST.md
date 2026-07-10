# Launch Checklist

Run these checks before production deployment:

```bash
npm run typecheck
npm test
npm run lint
npm run build
npm run check:launch
```

Production environment requirements:

- Use the pooled PostgreSQL URL in `DATABASE_URL`.
- Use the direct PostgreSQL URL only in `DIRECT_DATABASE_URL`.
- Set `JWT_SECRET` to a random value with at least 32 characters.
- Replace all Paymob test credentials with production credentials.
- Set `GEMINI_API_KEY`, `RESEND_API_KEY`, and `EMAIL_FROM`.
- Set `NEXT_PUBLIC_APP_URL` to the public production URL, not localhost.
- Set each Expo app `EXPO_PUBLIC_API_BASE_URL` to the production API URL before building the mobile apps.

Operational checks:

- Verify Paymob webhook HMAC in the Paymob dashboard.
- Place one test order for each payment method: Paymob, InstaPay, and cash on delivery.
- Complete one full delivery flow: vendor accepts, driver accepts, pickup OTP, delivery OTP.
- Confirm vendor payouts and driver wallet balances after delivery.
