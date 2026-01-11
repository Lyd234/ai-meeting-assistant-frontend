
"use client";

import { useEffect, useState, useRef } from "react";
import { useCall } from "@stream-io/video-react-sdk";
import { useChatContext } from "stream-chat-react";

export function TranscriptPanel() {
  const call = useCall();
  const { client: chatClient } = useChatContext();
  const [transcripts, setTranscripts] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const transcriptEndRef = useRef(null);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcripts]);

  useEffect(() => {
    if (!call || !chatClient) {
      console.log("⚠️ Call or chat client not ready");
      return;
    }

    const callId = call.id;
    const channel = chatClient.channel("messaging", callId);

    const initChannel = async () => {
      try {
        await channel.watch();
        console.log("✅ Chat channel watched for messages");
        setIsListening(true);
      } catch (err) {
        console.error("❌ Failed to watch chat channel:", err);
      }
    };

    initChannel();

    console.log("✅ Listening for closed captions and bot messages");

    // Handle closed captions from Stream (if available)
    const handleClosedCaption = (event) => {
      if (event.closed_caption) {
        const caption = event.closed_caption;
        const newTranscript = {
          text: caption.text || "",
          speaker: caption.user?.name || caption.user?.id || "Unknown",
          timestamp: new Date(caption.start_time || Date.now()).toLocaleTimeString(),
          isBot: false,
        };
        console.log("📝 New caption:", newTranscript);
        setTranscripts((prev) => [...prev, newTranscript]);
      }
    };

    // Handle bot messages
    const handleNewMessage = (event) => {
      const message = event.message;

      if (message?.user?.id !== "meeting-assistant-bot") return;

      const newTranscript = {
        text: message.text || "",
        speaker: message.user?.name || "Meeting Assistant",
        timestamp: new Date(message.created_at).toLocaleTimeString(),
        isBot: true,
      };

      console.log("🤖 Bot message:", newTranscript);
      setTranscripts((prev) => [...prev, newTranscript]);
    };

    call.on("call.closed_caption", handleClosedCaption);
    channel.on("message.new", handleNewMessage);

    return () => {
      console.log("🧹 Cleaning up listeners");
      call.off("call.closed_caption", handleClosedCaption);
      channel.off("message.new", handleNewMessage);
    };
  }, [call, chatClient]);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-700 bg-gradient-to-r from-gray-800 to-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Live Transcript</h3>
              <p className="text-xs text-gray-400 mt-0.5">
                {transcripts.length} {transcripts.length === 1 ? "entry" : "entries"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isListening ? (
              <>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-green-500 font-medium">Live</span>
              </>
            ) : (
              <>
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span className="text-xs text-yellow-500 font-medium">Connecting</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Transcript List */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3 bg-gray-900">
        {transcripts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center mb-6">
              <svg className="w-12 h-12 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <h4 className="text-lg font-semibold text-gray-300 mb-2">
              Waiting for conversation...
            </h4>
            <p className="text-sm text-gray-500 max-w-xs">
              Start speaking to see live transcripts appear here. Say &ldquo;Hey Assistant&rdquo; to ask questions!
            </p>
          </div>
        ) : (
          <>
            {transcripts.map((transcript, idx) => (
              <div
                key={idx}
                className={`group rounded-xl p-4 shadow-lg transition-all border ${
                  transcript.isBot
                    ? "bg-gradient-to-br from-purple-900/50 to-purple-800/50 border-purple-600/50"
                    : "bg-gradient-to-br from-gray-800 to-gray-700 border-gray-600"
                } hover:border-blue-500/50 hover:-translate-y-0.5`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg ${
                      transcript.isBot ? "bg-purple-600 ring-purple-500/20" : "bg-gradient-to-br from-blue-500 to-blue-600 ring-blue-500/20"
                    } ring-2`}>
                      {transcript.speaker.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <span className={`font-semibold text-sm ${transcript.isBot ? "text-purple-300" : "text-blue-400"}`}>
                        {transcript.speaker}
                      </span>
                      <p className="text-xs text-gray-400 font-mono mt-0.5">
                        {transcript.timestamp}
                      </p>
                    </div>
                  </div>
                </div>
                <p className="text-gray-100 leading-relaxed text-sm pl-13">
                  {transcript.text}
                </p>
              </div>
            ))}
            <div ref={transcriptEndRef} />
          </>
        )}
      </div>
    </div>
  );
}



