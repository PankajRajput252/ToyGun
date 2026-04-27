import React, { useEffect, useRef, useState } from "react";
import SockJS from "sockjs-client/dist/sockjs";
import { Client } from "@stomp/stompjs";
type Props = {
  conversationId: string;
  userId: string;
  productTitle?: string;
};


type Message = {
  senderId: string;
  content: string;
  timestamp: string;
};



export default function ChatUI({ conversationId, userId, productTitle }: Props) {
    const [messages, setMessages] = useState<Message[]>([
  {
    senderId: "seller1",
    content: "Hi, is this still available?",
    timestamp: new Date().toISOString(),
  },
  {
    senderId: "CONT66855610",
    content: "Yes, it's available.",
    timestamp: new Date().toISOString(),
  },
  {
    senderId: "seller1",
    content: "Can you share final price?",
    timestamp: new Date().toISOString(),
  },
]);
//   const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [client, setClient] = useState<any>(null);

//   const conversationId = "123"; // dynamic
//   const userId = "user1"; // logged-in user

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 🔌 Connect WebSocket
//   useEffect(() => {
//     const socket = new SockJS("http://localhost:8080/ws");
//     const stompClient = Stomp.over(socket);

//     stompClient.connect({}, () => {
//       stompClient.subscribe(`/topic/chat/${conversationId}`, (msg: any) => {
//         const newMessage = JSON.parse(msg.body);
//         setMessages((prev) => [...prev, newMessage]);
//       });
//     });

//     setClient(stompClient);
//   }, []);

  // 📜 Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 📤 Send Message
  const sendMessage = () => {
    if (!input.trim()) return;

    const msg = {
      senderId: userId,
      content: input,
      timestamp: new Date().toISOString(),
    };

      setMessages((prev) => [...prev, msg]);
    // client.send(
    //   `/app/chat.send/${conversationId}/1/2`, // adjust if needed
    //   {},
    //   JSON.stringify(msg)
    // );

    setInput("");
  };

  return (
    <div className="flex h-screen bg-gray-100">
      
      {/* 🧑 Sidebar */}
      <div className="w-1/4 bg-white border-r">
        <div className="p-4 font-bold text-lg border-b">Chats</div>
        <div className="p-4 hover:bg-gray-100 cursor-pointer">
          Product Chat 1
        </div>
      </div>

      {/* 💬 Chat Window */}
      <div className="flex flex-col flex-1">
        
        {/* Header */}
        <div className="p-4 bg-white border-b font-semibold">
          Product Title
        </div>

        {/* Messages */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3">
          {messages.map((msg, index) => {
            const isMe = msg.senderId === userId;

            return (
              <div
                key={index}
                className={`flex ${isMe ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`px-4 py-2 rounded-2xl max-w-xs ${
                    isMe
                      ? "bg-green-500 text-white"
                      : "bg-white border"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* ✏️ Input */}
        <div className="p-4 bg-white border-t flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message"
            className="flex-1 border rounded-full px-4 py-2 outline-none"
          />
          <button
            onClick={sendMessage}
            className="bg-green-500 text-white px-4 py-2 rounded-full"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}