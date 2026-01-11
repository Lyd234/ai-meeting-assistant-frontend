import { useState, useEffect } from "react";
import { StreamVideoClient } from "@stream-io/video-react-sdk";
import { StreamChat } from "stream-chat";

export default function useStreamClients({ apiKey, user, token }) {
  const [videoClient, setVideoClient] = useState(null);
  const [chatClient, setChatClient] = useState(null);

  useEffect(() => {
    if (!apiKey || !user || !token) return;

    let isMounted = true;

    const initClients = async () => {
      try {
        // Video Client
        const video = new StreamVideoClient({
          apiKey,
          user,
          token, // can be string or tokenProvider function
        });

        // Chat Client
        const chat = StreamChat.getInstance(apiKey);
        await chat.connectUser(user, token);

        if (isMounted) {
          setVideoClient(video);
          setChatClient(chat);
        }
      } catch (error) {
        console.error("Error initializing Stream clients:", error);
      }
    };

    initClients();

    // Cleanup on unmount only
    return () => {
      isMounted = false;
    };
  }, [apiKey, user, token]);

  // Single cleanup effect on unmount
  useEffect(() => {
    return () => {
      if (videoClient) {
        videoClient.disconnectUser().catch(console.error);
      }
      if (chatClient) {
        chatClient.disconnectUser().catch(console.error);
      }
    };
  }, [videoClient, chatClient]);

  return { videoClient, chatClient };
}


