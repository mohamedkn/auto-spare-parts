# Plan to Fix Project Errors and Type Checking Issues

This plan aims to resolve the typescript compilation errors, typescript configuration mismatches, database/prisma sync issues, and Expo router path bugs in both the Next.js marketplace backend and the Expo mobile application.

## User Review Required

No major architectural changes are proposed. The fixes are minor type adjustments, correct query parameters, and configuration exclusions.

> [!NOTE]
> We have already resolved the database out-of-sync issue by pushing the schema to Neon and successfully seeding it, as well as installing the missing packages `react-hook-form` and `@hookform/resolvers`.

---

## Proposed Changes

### Configuration

#### [MODIFY] [tsconfig.json](file:///d:/%D9%82%D8%B7%D8%B9%20%D8%A7%D9%84%D8%BA%D9%8A%D8%A7%D8%B1/tsconfig.json)
- Exclude the `mobile-app` directory from the Next.js workspace type checking so that its internal react-native typings and aliases do not conflict with Next.js web typings.

---

### Authentication & Core Libraries

#### [MODIFY] [jwt.ts](file:///d:/%D9%82%D8%B7%D8%B9%20%D8%A7%D9%84%D8%BA%D9%8A%D8%A7%D8%B1/src/lib/auth/jwt.ts)
- Add `"driver"` to `AuthTokenPayload.role` and `signToken` parameter role type to support driver logins and registrations.

#### [MODIFY] [middleware.ts](file:///d:/%D9%82%D8%B7%D8%B9%20%D8%A7%D9%84%D8%BA%D9%8A%D8%A7%D8%B1/src/lib/auth/middleware.ts)
- Add `"driver"` to the allowed roles list in the `requireRole` middleware parameter type.

#### [MODIFY] [rate-limit.ts](file:///d:/%D9%82%D8%B7%D8%B9%20%D8%A7%D9%84%D8%BA%D9%8A%D8%A7%D8%B1/src/lib/auth/rate-limit.ts)
- Safe-guard the `.unref()` call on `setInterval` to prevent type check errors when Next.js compiles for non-Node environments.

---

### Next.js Pages & APIs

#### [MODIFY] [page.tsx](file:///d:/%D9%82%D8%B7%D8%B9%20%D8%A7%D9%84%D8%BA%D9%8A%D8%A7%D8%B1/src/app/driver/page.tsx)
- Replace non-existent `requireRole` import from `@/lib/auth/server-utils` with `getUserSession` from `@/lib/auth/session` to check the driver role and session.

#### [MODIFY] [route.ts](file:///d:/%D9%82%D8%B7%D8%B9%20%D8%A7%D9%84%D8%BA%D9%8A%D8%A7%D8%B1/src/app/api/driver/jobs/%5Bid%5D/accept/route.ts)
- Update `requireRole(request, "driver")` parameter compatibility.
- Replace the invalid query parameter `phone: true` on the `Vendor` table (which doesn't exist) with `owner: { select: { phone: true } }` since phone numbers are stored in the `User` model. Map the returned owner phone to `vendor.phone` to maintain output schema compatibility.

#### [MODIFY] [route.ts](file:///d:/%D9%82%D8%B7%D8%B9%20%D8%A7%D9%84%D8%BA%D9%8A%D8%A7%D8%B1/src/app/api/vendor/orders/%5Bid%5D/status/route.ts)
- Replace `customerId: true` on the `Order` query with `userId: true` (which is the correct field in the database schema). This resolves the cascading prisma include type error.

---

### Expo Mobile Application

#### [MODIFY] [index.tsx](file:///d:/%D9%82%D8%B7%D8%B9%20%D8%A7%D9%84%D8%BA%D9%8A%D8%A7%D8%B1/mobile-app/src/app/driver/index.tsx)
- Correct the router redirect path upon accepting a job from `/job/${jobId}` to `/driver/job/${jobId}`.

#### [MODIFY] [app-tabs.tsx](file:///d:/%D9%82%D8%B7%D8%B9%20%D8%A7%D9%84%D8%BA%D9%8A%D8%A7%D8%B1/mobile-app/src/components/app-tabs.tsx)
- Change NativeTabs Trigger name from `"explore"` to `"categories"` (the actual page name) and update its label to "Categories".

#### [MODIFY] [app-tabs.web.tsx](file:///d:/%D9%82%D8%B7%D8%B9%20%D8%A7%D9%84%D8%BA%D9%8A%D8%A7%D8%B1/mobile-app/src/components/app-tabs.web.tsx)
- Update tab path from `/explore` to `/categories` to match the actual filesystem page name.

---

## Verification Plan

### Automated Tests
- Run Next.js type check:
  `npx tsc --noEmit` from the root of `d:/قطع الغيار` (should compile without errors).
- Run Mobile App type check:
  `npx tsc --noEmit` from `d:/قطع الغيار/mobile-app` (should compile without errors).
- Run ESLint to ensure code matches guidelines.
