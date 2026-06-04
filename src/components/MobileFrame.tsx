import React from 'react';

interface MobileFrameProps {
  children: React.ReactNode;
}

export const MobileFrame: React.FC<MobileFrameProps> = ({ children }) => {
  // Simple time simulation for status bar
  const [time, setTime] = React.useState('12:00');

  React.useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      let hours = now.getHours();
      let minutes = now.getMinutes();
      const strMinutes = minutes < 10 ? '0' + minutes : minutes;
      setTime(`${hours}:${strMinutes}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="app-viewport">
      {/* Phone Status Bar (Simulated) */}
      <div className="status-bar">
        <span className="status-bar-time">{time}</span>
        <div className="status-bar-icons">
          <span style={{ fontSize: '12px' }}>📶</span>
          <span style={{ fontSize: '12px', marginLeft: '4px' }}>🔋 88%</span>
        </div>
      </div>
      
      {/* Content wrapper */}
      <div className="app-content-container">
        {children}
      </div>

      <style>{`
        .status-bar {
          height: 44px;
          padding: 0 24px;
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          font-size: 14px;
          font-weight: 600;
          color: #1e1b18;
          z-index: 9999;
          background: transparent;
          flex-shrink: 0;
          padding-bottom: 6px;
          user-select: none;
        }
        .app-content-container {
          flex: 1;
          display: flex;
          flex-direction: column;
          position: relative;
          overflow: hidden;
          height: calc(100% - 44px);
        }
        @media (max-width: 480px) {
          .status-bar {
            height: 38px;
            padding: 0 16px;
            padding-bottom: 2px;
          }
          .app-content-container {
            height: calc(100% - 38px);
          }
        }
      `}</style>
    </div>
  );
};
