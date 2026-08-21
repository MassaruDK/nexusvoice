import React from 'react';
import { ChatMessage } from '../../types/index.js';
import { Avatar } from '../ui/Avatar.js';
import { Badge } from '../ui/Badge.js';

interface ChatMessageItemProps {
  message: ChatMessage;
  isSelf: boolean;
}

export const ChatMessageItem: React.FC<ChatMessageItemProps> = ({ message, isSelf }) => {
  const formattedTime = new Date(message.createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className={`flex items-start gap-2.5 px-2 py-1.5 rounded-xl transition-colors hover:bg-background-surface/40 group ${
      isSelf ? 'bg-brand-600/5' : ''
    }`}>
      <Avatar src={message.avatar} name={message.username} size="sm" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 leading-none mb-1">
          <span className="text-xs font-bold text-slate-200">{message.username}</span>
          {message.role === 'ADMIN' && <Badge variant="admin">Admin</Badge>}
          <span className="text-[10px] text-slate-500">{formattedTime}</span>
        </div>
        <p className="text-xs text-slate-300 break-words leading-relaxed whitespace-pre-wrap select-text">
          {message.content}
        </p>
      </div>
    </div>
  );
};
