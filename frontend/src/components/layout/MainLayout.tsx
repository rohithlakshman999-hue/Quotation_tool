import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Menu, FileText } from 'lucide-react';
import { Button } from '../ui/button';

export const MainLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen w-full bg-slate-50 flex-col md:flex-row overflow-hidden">
      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between bg-slate-900 text-white p-4 shadow-md z-30">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-500" />
          <span className="text-lg font-bold">QuoteMaster</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(true)} className="text-slate-300 hover:text-white hover:bg-slate-800">
          <Menu className="w-6 h-6" />
        </Button>
      </header>

      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      <main className="flex-1 overflow-y-auto">
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto min-h-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
