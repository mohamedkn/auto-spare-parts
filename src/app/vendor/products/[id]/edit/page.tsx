import { prisma } from "@/lib/db";
import { getUserSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { EditProductForm } from "./EditForm";

export default async function EditProductPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await getUserSession();
  
  if (!session) return redirect("/login");

  const vendor = await prisma.vendor.findUnique({
    where: { ownerId: session.userId },
  });

  if (!vendor) return redirect("/");

  const product = await prisma.product.findFirst({
    where: { id: params.id, vendorId: vendor.id },
    include: {
      images: { orderBy: { position: "asc" } },
      variants: true,
      category: { select: { id: true, name: true, slug: true } },
      compatibilities: { include: { vehicleModel: { include: { make: true } } } },
    },
  });

  if (!product) return redirect("/vendor/products");

  return <EditProductForm product={product} />;
}
