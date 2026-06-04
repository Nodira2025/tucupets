import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { MobileFrame } from './components/MobileFrame';
import { WelcomeScreen } from './views/WelcomeScreen';
import { OwnerDashboard } from './views/OwnerDashboard';
import { DriverDashboard } from './views/DriverDashboard';

const MainAppContent: React.FC = () => {
  const { userRole } = useApp();

  // Render view based on active role
  const renderView = () => {
    switch (userRole) {
      case 'owner':
        return <OwnerDashboard />;
      case 'driver':
        return <DriverDashboard />;
      default:
        return <WelcomeScreen />;
    }
  };

  return (
    <MobileFrame>
      {renderView()}
    </MobileFrame>
  );
};

function App() {
  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  );
}

export default App;
