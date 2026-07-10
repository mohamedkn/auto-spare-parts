<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:project-specific-rules -->
# UI / UX Guidelines (Auto Spare Parts)
- **Aesthetics**: Use premium, modern aesthetics (Tailwind CSS, glassmorphism where appropriate, clean data tables for vendors). Use Shadcn UI for consistent components.
- **Micro-animations**: Use subtle animations for add-to-cart, transitions, and search loading to make the app feel alive.
- **Forms**: Vendor upload forms and customer search forms must be highly optimized and responsive.

# AI Integration Directives
- Always leverage the `@google/genai` or similar SDKs on the backend (Next.js API Routes) for AI features.
- Ensure all AI responses are typed and validated using Zod to maintain system stability.
<!-- END:project-specific-rules -->
