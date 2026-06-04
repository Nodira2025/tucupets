import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Send, ArrowLeft } from 'lucide-react';

interface RideChatProps {
  onClose: () => void;
  senderRole: 'owner' | 'driver';
}

export const RideChat: React.FC<RideChatProps> = ({ onClose, senderRole }) => {
  const { activeRide, chatMessages, sendChatMessage } = useApp();
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  if (!activeRide) return null;

  const handleSend = (text: string) => {
    if (!text.trim()) return;
    sendChatMessage(text.trim(), senderRole);
    setInputText('');
  };

  // Pre-set quick messages for pet owners/drivers
  const quickMessages = senderRole === 'owner' 
    ? ['¡Ya bajo con la mascota! 🐾', 'Lleva pretal de seguridad 🐕', 'Por favor, usá el cinturón trasero 👍', '¿Por dónde venís?']
    : ['¡Perfecto, te espero! 🚐', 'Ya estoy afuera de la puerta 👍', 'El viaje comenzó sin problemas 🐾', '¿Es un perro grande?'];

  return (
    <div className="chat-container animate-slide-up">
      {/* Header */}
      <div className="chat-header">
        <button className="chat-back-btn" onClick={onClose}>
          <ArrowLeft size={20} />
        </button>
        <div style={{ textAlign: 'left', flex: 1 }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'white' }}>
            {senderRole === 'owner' ? (activeRide.driverName || 'Conductor') : 'Propietario de la mascota'}
          </h3>
          <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.8)' }}>
            {senderRole === 'owner' ? activeRide.vehicleInfo : `Mascota: ${activeRide.petName}`}
          </div>
        </div>
        <div className="chat-avatar-mini">
          {senderRole === 'owner' ? '🧑‍✈️' : '🐾'}
        </div>
      </div>

      {/* Messages Area */}
      <div className="chat-messages-area">
        {chatMessages.length === 0 ? (
          <div className="chat-empty-state">
            <span style={{ fontSize: '32px' }}>💬</span>
            <p style={{ marginTop: '8px', color: 'var(--neutral-grey)', fontSize: '13px' }}>
              Enviale un mensaje al {senderRole === 'owner' ? 'conductor' : 'pasajero'} para coordinar.
            </p>
          </div>
        ) : (
          chatMessages.map((msg) => {
            const isMe = msg.senderId === senderRole;
            return (
              <div 
                key={msg.id} 
                className={`message-row ${isMe ? 'message-row-me' : 'message-row-other'}`}
              >
                <div className={`message-bubble ${isMe ? 'bubble-me' : 'bubble-other'}`}>
                  {msg.message}
                  <span className="bubble-time">
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Replies */}
      <div className="quick-replies-bar">
        {quickMessages.map((msg, index) => (
          <button 
            key={index} 
            className="quick-reply-tag"
            onClick={() => handleSend(msg)}
          >
            {msg}
          </button>
        ))}
      </div>

      {/* Input controls */}
      <div className="chat-input-bar">
        <input
          type="text"
          className="chat-input-field"
          placeholder="Escribí un mensaje..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSend(inputText);
          }}
        />
        <button 
          className="chat-send-btn" 
          onClick={() => handleSend(inputText)}
          disabled={!inputText.trim()}
        >
          <Send size={18} />
        </button>
      </div>

      <style>{`
        .chat-container {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: white;
          z-index: 2000;
          display: flex;
          flex-direction: column;
        }
        .chat-header {
          background-color: var(--neutral-dark);
          height: 64px;
          display: flex;
          align-items: center;
          padding: 0 16px;
          gap: 12px;
          box-shadow: var(--shadow-sm);
        }
        .chat-back-btn {
          background: none;
          border: none;
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
        }
        .chat-avatar-mini {
          width: 38px;
          height: 38px;
          background: rgba(255, 255, 255, 0.15);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
        }
        .chat-messages-area {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          background-color: #f8fafc;
        }
        .chat-empty-state {
          margin: auto;
          text-align: center;
          padding: 24px;
        }
        .message-row {
          display: flex;
          width: 100%;
        }
        .message-row-me {
          justify-content: flex-end;
        }
        .message-row-other {
          justify-content: flex-start;
        }
        .message-bubble {
          max-width: 75%;
          padding: 10px 14px;
          border-radius: 18px;
          font-size: 14px;
          line-height: 1.4;
          display: flex;
          flex-direction: column;
          position: relative;
        }
        .bubble-me {
          background-color: var(--primary);
          color: var(--neutral-dark);
          border-bottom-right-radius: 4px;
          text-align: left;
        }
        .bubble-other {
          background-color: white;
          color: var(--neutral-dark);
          border-bottom-left-radius: 4px;
          border: 1px solid var(--border);
          box-shadow: 0 1px 3px rgba(0,0,0,0.02);
          text-align: left;
        }
        .bubble-time {
          font-size: 9px;
          align-self: flex-end;
          margin-top: 4px;
          opacity: 0.65;
        }
        .quick-replies-bar {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          padding: 10px 16px;
          background-color: white;
          border-top: 1px solid var(--border);
          white-space: nowrap;
        }
        .quick-reply-tag {
          background: #f1f5f9;
          border: 1px solid #e2e8f0;
          color: var(--neutral-grey);
          padding: 6px 12px;
          border-radius: 16px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .quick-reply-tag:hover {
          background-color: var(--primary-light);
          color: var(--primary-dark);
          border-color: var(--primary);
        }
        .chat-input-bar {
          padding: 12px 16px;
          background: white;
          border-top: 1px solid var(--border);
          display: flex;
          gap: 8px;
          align-items: center;
          padding-bottom: calc(12px + env(safe-area-inset-bottom));
        }
        .chat-input-field {
          flex: 1;
          height: 44px;
          background-color: #f1f5f9;
          border: 1px solid #e2e8f0;
          border-radius: 22px;
          padding: 0 18px;
          font-size: 14px;
          transition: all 0.2s ease;
        }
        .chat-input-field:focus {
          background-color: white;
          border-color: var(--primary);
          box-shadow: 0 0 0 2px rgba(247, 185, 87, 0.1);
        }
        .chat-send-btn {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          border: none;
          background-color: var(--neutral-dark);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .chat-send-btn:disabled {
          background-color: #cbd5e1;
          color: #94a3b8;
          cursor: not-allowed;
        }
        .chat-send-btn:not(:disabled):hover {
          background-color: var(--primary);
          color: var(--neutral-dark);
        }
      `}</style>
    </div>
  );
};
