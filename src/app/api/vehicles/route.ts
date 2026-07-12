import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const makes = await prisma.vehicleMake.findMany({
      include: {
        models: {
          orderBy: { name: "asc" }
        }
      },
      orderBy: { name: "asc" }
    });
    
    const response = NextResponse.json({ data: makes });
    response.headers.set("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
    return response;
  } catch (error) {
    console.error("Error fetching vehicles:", error);
    return NextResponse.json({ error: "Failed to fetch vehicles" }, { status: 500 });
  }
}
