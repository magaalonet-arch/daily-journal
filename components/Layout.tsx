import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Book, LogOut, Plus } from 'lucide-react';
import { Button } from './Button';

interface LayoutProps {
  children: React.ReactNode;
  onNewEntry?: () => void;
  showSidebar?: boolean;
}

export const Layout: React.FC<LayoutProps> = ({ children, onNewEntry, showSidebar = true }) => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b p-4 flex justify-between items-center sticky top-0 z-20">
        <div className="flex items-center space-x-2 text-primary-600 font-bold text-xl">
          <Book size={24} />
          <span>ReflectAI</span>
        </div>
        <button onClick={logout} className="text-gray-500 hover:text-gray-700">
          <LogOut size={20} />
        </button>
      </div>

      {/* Sidebar (Desktop) */}
      <aside className={`hidden md:flex flex-col w-64 bg-white border-r h-screen sticky top-0`}>
        <div className="p-6 border-b flex items-center space-x-2 text-primary-600 font-bold text-2xl">
          <Book size={28} />
          <span>ReflectAI</span>
        </div>

        <div className="p-4">
          <Button onClick={onNewEntry} className="w-full justify-start" icon={<Plus size={18} />}>
            New Entry
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-2">
           {/* Sidebar content (list) is injected via the Dashboard logic usually, but here we just keep the shell generic */}
           <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Logged in as
           </div>
           <div className="text-sm text-gray-700 truncate font-medium mb-6">
             {user?.name}
           </div>
        </div>

        <div className="p-4 border-t bg-gray-50">
          <button 
            onClick={logout}
            className="flex items-center space-x-2 text-gray-600 hover:text-red-600 transition-colors text-sm font-medium w-full"
          >
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-[calc(100vh-64px)] md:h-screen overflow-hidden">
        {children}
      </main>
    </div>
  );
};