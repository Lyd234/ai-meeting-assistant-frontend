"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleJoin = () => {
    const name = username.trim() || "Guest";
    const meetingId = process.env.NEXT_PUBLIC_CALL_ID;

    if (!meetingId) {
      alert("Error: Meeting ID not configured. Check .env.local");
      return;
    }

    setIsLoading(true);
    router.push(`/meeting/${meetingId}?name=${encodeURIComponent(name)}`);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && username.trim()) {
      handleJoin();
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <div className="w-full max-w-md px-8 py-12 bg-gray-800/60 backdrop-blur-md rounded-2xl border border-gray-700 shadow-2xl">
        <h2 className="text-3xl font-bold mb-8 text-center">Join Meeting</h2>

        <input
          type="text"
          placeholder="Enter your name (or join as Guest)"
          className="w-full px-5 py-4 rounded-xl bg-gray-700/70 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all mb-6"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
          aria-label="Your name"
        />

        <button
          onClick={handleJoin}
          disabled={isLoading}
          className="w-full py-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-70 disabled:cursor-not-allowed text-white font-semibold transition-all"
        >
          {isLoading ? "Joining..." : "Join Meeting"}
        </button>
      </div>
    </div>
  );
}