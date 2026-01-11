
"use client";

import { useEffect, useState, useRef } from "react";
import {
  StreamCall,
  useStreamVideoClient,
  useConnectedUser,
  SpeakerLayout,
  CallControls,
  StreamTheme,
} from "@stream-io/video-react-sdk";
import { Chat } from "stream-chat-react";

import { TranscriptPanel } from "./transcript";
import "stream-chat-react/dist/css/v2/index.css";
import "@stream-io/video-react-sdk/dist/css/styles.css";

export default function MeetingRoom({ callId, onLeave, chatClient }) {
  const client = useStreamVideoClient();
  const connectedUser = useConnectedUser();
  const [call, setCall] = useState(null);
  const [error, setError] = useState(null);
  const [transcriptionError, setTranscriptionError] = useState(null);
  const [channel, setChannel] = useState(null);

  const joinedRef = useRef(false);
  const leavingRef = useRef(false);
  const callType = "default";

  useEffect(() => {
    if (!client || !connectedUser || joinedRef.current) return;
    joinedRef.current = true;

    const init = async () => {
      try {
        const myCall = client.call(callType, callId);

        // Try to get existing call
        let callData;
        try {
          callData = await myCall.get();
        } catch (e) {
          // Call doesn't exist → create it
          await myCall.create({
            data: { 
              created_by_id: connectedUser.id,
              settings_override: {
                transcription: {
                  mode: "available",
                  closed_caption_mode: "available",
                },
              },
            },
          });
          callData = await myCall.get();
        }

        // Add self as member if not already
        const members = callData.call.members || [];
        if (!members.some((m) => m.user_id === connectedUser.id)) {
          const updatedMembers = [
            ...members.map((m) => ({ user_id: m.user_id })),
            { user_id: connectedUser.id },
          ];
          await myCall.update({ members: updatedMembers });
        }

        await myCall.join();
        await myCall.camera.enable();
        await myCall.microphone.enable();
        
        // Try to enable transcription - gracefully handle if it fails (paid feature)
        try {
          await myCall.startClosedCaptions({ language: "en" });
          console.log("✅ Closed captions started");
        } catch (transcriptErr) {
          console.warn("⚠️ Transcription not available:", transcriptErr.message);
          setTranscriptionError(
            "Live transcription is not available. This may be a paid feature on your Stream plan."
          );
        }

        myCall.on("call.session_ended", () => onLeave?.());

        setCall(myCall);

        // Initialize chat channel
        if (chatClient) {
          try {
            const chatChannel = chatClient.channel("messaging", callId);
            await chatChannel.watch();
            setChannel(chatChannel);
            console.log("✅ Chat channel connected");
          } catch (chatErr) {
            console.error("❌ Chat channel error:", chatErr);
          }
        }
      } catch (err) {
        console.error("Meeting error:", err);
        setError(err.message || "Failed to join meeting");
      }
    };

    init();

    return () => {
      if (call && !leavingRef.current) {
        leavingRef.current = true;
        call.stopClosedCaptions().catch(() => {});
        call.leave().catch(() => {});
        onLeave?.();
      }
    };
  }, [client, connectedUser, callId, onLeave, call, chatClient]);

  useEffect(() => {
    if (!call) return;
    
    const startBot = async () => {
      const backendUrl = process.env.NEXT_PUBLIC_PYTHON_BACKEND;
      
      if (!backendUrl) {
        console.warn('⚠️ NEXT_PUBLIC_PYTHON_BACKEND not configured');
        return;
      }
      
      try {
        console.log('🤖 Starting meeting bot for call:', callId);
        
        const response = await fetch(`${backendUrl}/start-agent/${callId}`, {
          method: 'POST',
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('✅ Bot started successfully:', data);
        
      } catch (error) {
        console.error('❌ Failed to start bot:', error);
        // Don't block the meeting if bot fails - just log the error
      }
    };
    
    // Delay to ensure call is fully set up
    const timer = setTimeout(startBot, 3000);
    
    return () => clearTimeout(timer);
    
  }, [call, callId]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="p-8 bg-red-900/30 rounded-xl border border-red-600">
          <p className="text-xl font-bold text-red-400">Error: {error}</p>
          <button 
            onClick={onLeave}
            className="mt-4 px-6 py-3 bg-blue-600 rounded-lg text-white hover:bg-blue-700"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (!call || !chatClient || !channel) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 mx-auto" />
          <p className="mt-6 text-xl">Loading meeting...</p>
        </div>
      </div>
    );
  }

  return (
    <StreamTheme className="h-screen">
      <StreamCall call={call}>
        <Chat client={chatClient} theme="messaging dark">
          <div className="h-screen flex">
            {/* Main Video Area */}
            <div className="flex-1 flex flex-col bg-gray-900">
              <div className="flex-1 relative">
                <SpeakerLayout />
              </div>
              <div className="p-4 bg-gray-900">
                <CallControls onLeave={onLeave} />
              </div>
            </div>

            {/* Transcript Sidebar */}
            <div className="w-96 bg-gray-800 border-l border-gray-700 flex flex-col">
              {transcriptionError && (
                <div className="p-4 bg-yellow-900/50 border-b border-yellow-600">
                  <p className="text-sm text-yellow-300">
                    ⚠️ {transcriptionError}
                  </p>
                  <p className="text-xs text-yellow-400 mt-2">
                    Bot messages will still appear here.
                  </p>
                </div>
              )}
              <TranscriptPanel />
            </div>
          </div>
        </Chat>
      </StreamCall>
    </StreamTheme>
  );
}


