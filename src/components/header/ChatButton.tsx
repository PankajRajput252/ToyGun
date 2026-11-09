import { MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useChatNotifications } from "../../context/ChatNotificationContext";

/** Header chat icon with the unread-message badge; opens the chat inbox. */
export default function ChatButton({ className = "" }: { className?: string }) {
  const navigate = useNavigate();
  const { unreadTotal, requestBrowserNotifications } = useChatNotifications();
  const label = unreadTotal > 0 ? `Chats, ${unreadTotal} unread` : "Chats";

  return (
    <button
      onClick={() => {
        requestBrowserNotifications(); // a click is the right moment to ask
        navigate("/chat");
      }}
      title="Chats"
      aria-label={label}
      className={`relative text-white hover:text-amber-400 hover:scale-110 transition duration-200 ${className}`}
    >
      <MessageCircle className="w-7 h-7 lg:w-8 lg:h-8 drop-shadow-md" strokeWidth={2.5} />
      {unreadTotal > 0 && (
        <span
          className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full min-w-[20px] h-5 px-1
                     flex items-center justify-center font-bold shadow"
        >
          {unreadTotal > 99 ? "99+" : unreadTotal}
        </span>
      )}
    </button>
  );
}
