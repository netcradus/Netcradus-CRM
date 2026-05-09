import React from "react";
import { MessageCircle } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useChat } from "../../context/ChatContext";
import ChatPanel from "./ChatPanel";


export default function ChatLauncher() {
  const navigate = useNavigate();
  const location = useLocation();
  const { launcherOpen, setLauncherOpen, unreadCount } = useChat();
  const isChatPage = location.pathname === "/messages";

  if (isChatPage) {
    return null;
  }

  return (
    <>
      {!launcherOpen && (
        <button
          type="button"
          className="chat-launcher"
          onClick={() => setLauncherOpen(true)}
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
