
"use client";

import { useMemo, useEffect, useState, useRef } from "react";
import { StreamVideo, StreamVideoClient } from "@stream-io/video-react-sdk";
import { StreamChat } from "stream-chat";

export default function StreamProvider({ children, user, token }) {
  const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY;
  const [chatClient, setChatClient] = useState(null);
  const chatClientRef = useRef(null);
  const isConnectingRef = useRef(false);

  if (!apiKey) {
    throw new Error("Missing NEXT_PUBLIC_STREAM_API_KEY in .env.local");
  }

  const videoClient = useMemo(() => {
    if (!user || !token) {
      return null;
    }
    return new StreamVideoClient({ apiKey, user, token });
  }, [apiKey, user, token]);

  // Initialize chat client
  useEffect(() => {
    if (!user || !token || isConnectingRef.current) return;

    const initChat = async () => {
      isConnectingRef.current = true;

      try {
        const chat = StreamChat.getInstance(apiKey);
        
        // Check if already connected
        if (chat.userID) {
          console.log("✅ Chat client already connected");
          setChatClient(chat);
          chatClientRef.current = chat;
          return;
        }

        await chat.connectUser(user, token);
        setChatClient(chat);
        chatClientRef.current = chat;
        console.log("✅ Chat client connected");
      } catch (error) {
        console.error("❌ Chat client error:", error);
        isConnectingRef.current = false;
      }
    };

    initChat();

    return () => {
      if (chatClientRef.current) {
        chatClientRef.current.disconnectUser().catch(console.error);
        chatClientRef.current = null;
        isConnectingRef.current = false;
      }
    };
  }, [apiKey, user, token]);

  if (!videoClient || !chatClient) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 mx-auto" />
          <p className="mt-6 text-xl">Preparing clients...</p>
        </div>
      </div>
    );
  }

  return (
    <StreamVideo client={videoClient}>
      {typeof children === 'function' ? children({ chatClient }) : children}
    </StreamVideo>
  );
}


