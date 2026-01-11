import { StreamClient } from "@stream-io/node-sdk";

const apiKey = process.env.STREAM_API_KEY;
const apiSecret = process.env.STREAM_API_SECRET;
const publicApiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY;

export async function POST(request) {
  // Uncomment these in production
  // if (!apiKey || !apiSecret || !publicApiKey) {
  //   return Response.json({ error: "Stream credentials missing" }, { status: 500 });
  // }

  try {
    const { name } = await request.json();

    if (!name || typeof name !== "string" || name.trim() === "") {
      return Response.json({ error: "Name is required" }, { status: 400 });
    }

    const displayName = name.trim() || "Guest";

    const userId = `${displayName.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`;

    const serverClient = new StreamClient(apiKey, apiSecret);

    await serverClient.upsertUsers([
      {
        id: userId,
        name: displayName,
        role: "admin", // ← Important for demo: allows updating call to add self
      },
    ]);

    const now = Math.floor(Date.now() / 1000);
    const iat = now - 60;
    const exp = now + 24 * 60 * 60;
    
    const token = serverClient.createToken(userId, exp, iat);
    

    return Response.json({
      token,
      userId,
      name: displayName,
      apiKey: publicApiKey,
    });
  } catch (error) {
    console.error("Token error:", error);
    return Response.json({ error: "Failed to generate token" }, { status: 500 });
  }
}