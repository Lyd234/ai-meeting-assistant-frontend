

"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter, useParams } from "next/navigation";
import { StreamTheme } from "@stream-io/video-react-sdk";
import StreamProvider from "@/components/stream-provider";
import MeetingRoom from "@/components/meeting-room";

export default function MeetingPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const callId = params.id;
  const nameFromUrl = searchParams.get("name") || "Guest";

  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchToken = async () => {
      try {
        const res = await fetch("/api/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: nameFromUrl }),
        });

        const data = await res.json();

        if (data.error) {
          setError(data.error);
          return;
        }

        setUser({ id: data.userId, name: data.name });
        setToken(data.token);
      } catch (err) {
        setError("Failed to connect");
      }
    };

    fetchToken();
  }, [nameFromUrl]);

  const handleLeave = () => router.push("/");

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
        <div className="p-8 bg-red-900/30 rounded-xl border border-red-600">
          <p className="text-xl font-bold text-red-400">Error: {error}</p>
          <button onClick={() => router.push("/")} className="mt-4 px-6 py-3 bg-blue-600 rounded-lg">
            Back to home
          </button>
        </div>
      </div>
    );
  }

  if (!user || !token) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 mx-auto" />
          <p className="mt-6 text-xl">Connecting to meeting...</p>
        </div>
      </div>
    );
  }

  return (
    <StreamProvider user={user} token={token}>
      {({ chatClient }) => (
        <StreamTheme>
          <MeetingRoom callId={callId} onLeave={handleLeave} chatClient={chatClient} />
        </StreamTheme>
      )}
    </StreamProvider>
  );
}