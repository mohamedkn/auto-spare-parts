import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const { items } = await request.json(); // Array of { productId, quantity }
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ data: { items: [], totalItems: 0, totalPrice: "0" } });
    }

    const productIds = items.map((i: any) => i.productId);

    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, status: "active", isPrivate: false, vendor: { status: "approved" } },
      include: {
        vendor: { select: { id: true, storeName: true } },
        images: { select: { url: true }, take: 1, orderBy: { position: "asc" } },
      },
    });

    let totalItems = 0;
    let totalPrice = 0;

    const populatedItems = items.map((item: any) => {
      const product = products.find((p) => p.id === item.productId);
      if (!product) return null;

      const qty = Math.min(item.quantity, product.stockQuantity);
      if (qty <= 0) return null;

      totalItems += qty;
      const itemTotal = Number(product.price) * qty;
      totalPrice += itemTotal;

      return {
        id: `guest-${product.id}`, // Fake id for UI iteration
        quantity: qty,
        itemTotal: itemTotal.toString(),
        product: {
          id: product.id,
          name: product.name,
          slug: product.slug,
          price: product.price.toString(),
          stockQuantity: product.stockQuantity,
          status: product.status,
          vendor: { id: product.vendor.id, storeName: product.vendor.storeName },
          images: product.images,
        },
      };
    }).filter(Boolean);

    return NextResponse.json({
      data: {
        items: populatedItems,
        totalItems,
        totalPrice: totalPrice.toString(),
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch guest cart" }, { status: 500 });
  }
}
