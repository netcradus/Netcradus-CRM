import React from "react";
import { MessageCircle } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useChat } from "../../context/ChatContext";
import ChatPanel from "./ChatPanel";

const chatEnabled = String(process.env.REACT_APP_CHAT_ENABLED || "true").toLowerCase() === "true";

export default function ChatLauncher() {
  const navigate = useNavigate();
  const location = useLocation();
  const { bootstrapChat, launcherOpen, setLauncherOpen, unreadCount } = useChat();
  const isChatPage = location.pathname === "/messages";

  if (!chatEnabled) {
    return null;
  }

  if (isChatPage) {
    return null;
  }

  return (
    <>
      {!launcherOpen && (
        <button
          type="button"
          className="chat-launcher"
          onClick={() => {
            bootstrapChat({ openLauncher: true });
          }}
          aria-label="Open chat"
        >
          <MessageCircle size={22} />
          {unreadCount > 0 && <span className="chat-launcher__badge">{unreadCount}</span>}
        </button>
      )}

      {launcherOpen && (
        <div className="chat-launcher__panel">
          <ChatPanel
            mode="launcher"
            onClose={() => setLauncherOpen(false)}
            onExpand={() => {
              setLauncherOpen(false);
              navigate("/messages");
            }}
          />
        </div>
      )}
    </>
  );
}
