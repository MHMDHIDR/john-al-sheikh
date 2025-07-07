import { NextRequest, NextResponse } from "next/server";
import { api } from "@/trpc/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ testId: string }> },
) {
  try {
    const { testId } = await params;
    const testData = await api.users.getPublicTestById({ testId });

    if (!testData) {
      return NextResponse.json({ error: "Test not found" }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        displayName: testData.user.displayName,
      },
      band: testData.band,
      createdAt: testData.createdAt.toISOString(),
    });
  } catch (error) {
    console.error("Error fetching test data:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
