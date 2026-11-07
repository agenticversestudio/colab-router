import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { AppHeader } from './AppHeader';
import { MobileHeader } from './MobileHeader';
import { MobileDrawer } from './MobileDrawer';
import { ChatContainer } from '../chat/ChatContainer';
import { TelemetryPanel } from '../mission-control/TelemetryPanel';
import { HermesMemoryModal } from '../modals/HermesMemoryModal';
import { PersonaModal } from '../modals/PersonaModal';
import { MCPToolsModal } from '../modals/MCPToolsModal';

export const DesktopLayout: React.FC = () => {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [mobileDrawerMode, setMobileDrawerMode] = useState<'sidebar' | 'telemetry'>('sidebar');

  // Collapsible Sidebars state (Both sides can be toggled freely)
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(true);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(true);

  // Modals state
  const [memoryModalOpen, setMemoryModalOpen] = useState(false);
  const [personaModalOpen, setPersonaModalOpen] = useState(false);
  const [mcpModalOpen, setMcpModalOpen] = useState(false);

  return (
    <div className="flex h-screen h-[100dvh] w-screen overflow-hidden bg-[#080C14] text-slate-100">
      {/* Desktop Left Sidebar (Collapsible 260px) */}
      <div
        className={`hidden lg:block h-full transition-all duration-300 ease-in-out overflow-hidden shrink-0 ${
          isLeftSidebarOpen ? 'w-[260px]' : 'w-0'
        }`}
      >
        <div className="w-[260px] h-full">
          <Sidebar
            onOpenMemory={() => setMemoryModalOpen(true)}
            onOpenPersonas={() => setPersonaModalOpen(true)}
            onOpenMCP={() => setMcpModalOpen(true)}
          />
        </div>
      </div>

      {/* Center Command Center (Fluid flex-1) */}
      <div className="flex flex-1 flex-col h-full min-w-0 min-h-0 overflow-hidden">
        {/* Desktop Header */}
        <div className="hidden lg:block">
          <AppHeader
            onOpenMemory={() => setMemoryModalOpen(true)}
            onOpenPersonas={() => setPersonaModalOpen(true)}
            onOpenMCP={() => setMcpModalOpen(true)}
            isLeftOpen={isLeftSidebarOpen}
            onToggleLeft={() => setIsLeftSidebarOpen(!isLeftSidebarOpen)}
            isRightOpen={isRightSidebarOpen}
            onToggleRight={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
          />
        </div>

        {/* Mobile Header */}
        <div className="lg:hidden">
          <MobileHeader
            onToggleSidebar={() => {
              setMobileDrawerMode('sidebar');
              setMobileDrawerOpen(true);
            }}
            onToggleTelemetry={() => {
              setMobileDrawerMode('telemetry');
              setMobileDrawerOpen(true);
            }}
            onOpenMCP={() => setMcpModalOpen(true)}
          />
        </div>

        {/* Chat Stream & Pinned Dock */}
        <main className="flex-1 min-h-0 w-full overflow-hidden">
          <ChatContainer />
        </main>
      </div>

      {/* Desktop Right Mission Control Panel (Collapsible 300px) */}
      <div
        className={`hidden xl:block h-full transition-all duration-300 ease-in-out overflow-hidden shrink-0 ${
          isRightSidebarOpen ? 'w-[300px]' : 'w-0'
        }`}
      >
        <div className="w-[300px] h-full">
          <TelemetryPanel />
        </div>
      </div>

      {/* Mobile Slide-Out Drawer */}
      <MobileDrawer
        isOpen={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        mode={mobileDrawerMode}
        onOpenMCP={() => setMcpModalOpen(true)}
        onOpenMemory={() => setMemoryModalOpen(true)}
        onOpenPersonas={() => setPersonaModalOpen(true)}
      />

      {/* Modals */}
      <HermesMemoryModal
        isOpen={memoryModalOpen}
        onClose={() => setMemoryModalOpen(false)}
      />
      <PersonaModal
        isOpen={personaModalOpen}
        onClose={() => setPersonaModalOpen(false)}
      />
      <MCPToolsModal
        isOpen={mcpModalOpen}
        onClose={() => setMcpModalOpen(false)}
      />
    </div>
  );
};
