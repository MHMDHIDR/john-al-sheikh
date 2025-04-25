import { NextRequest, NextResponse } from "next/server";

// Handle session creation
export async function POST(request: NextRequest) {
  try {
    // Parse the SDP offer from the request
    const sdpOffer = await request.text();

    if (!sdpOffer) {
      return NextResponse.json({ error: "Missing SDP offer" }, { status: 400 });
    }

    // Send the offer to OpenAI's API
    const baseUrl = "https://api.openai.com/v1/realtime";
    const model = "gpt-4o-mini-realtime-preview";
    const response = await fetch(`${baseUrl}?model=${model}`, {
      method: "POST",
      body: sdpOffer,
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/sdp",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `Failed to establish WebRTC connection: ${errorText}` },
        { status: response.status },
      );
    }

    // Return the SDP answer directly
    const answerSdp = await response.text();
    return new NextResponse(answerSdp, {
      headers: {
        "Content-Type": "application/sdp",
      },
    });
  } catch (error) {
    console.error("Error in OpenAI WebRTC connection:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
