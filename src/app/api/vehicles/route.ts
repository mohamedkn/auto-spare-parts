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
    
    return NextResponse.json({ data: makes });
  } catch (error) {
    console.error("Error fetching vehicles:", error);
    return NextResponse.json({ error: "Failed to fetch vehicles" }, { status: 500 });
  }
}
