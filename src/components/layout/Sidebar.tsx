import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Users, 
  Scale, 
  Percent, 
  Package, 
  FileText, 
  LogOut,
  X
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen = false, onClose }) => {
  const { signOut } = useAuth();

  const navItems = [
    { name: 'Client Master', path: '/clients', icon: <Users className="w-5 h-5" /> },
    { name: 'UOM Master', path: '/units', icon: <Scale className="w-5 h-5" /> },
    { name: 'GST Master', path: '/gst', icon: <Percent className="w-5 h-5" /> },
    { name: 'Product Master', path: '/products', icon: <Package className="w-5 h-5" /> },
    { name: 'Quotations', path: '/quotations', icon: <FileText className="w-5 h-5" /> },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 md:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-100 flex flex-col h-full shadow-xl transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="p-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <FileText className="w-6 h-6 text-blue-500" />
          QuoteMaster
        </h1>
        {onClose && (
          <Button variant="ghost" size="icon" className="md:hidden text-slate-300 hover:text-white hover:bg-slate-800" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        )}
      </div>
      
      <nav className="flex-1 px-4 space-y-2 mt-4">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive 
                  ? 'bg-blue-600 text-white font-medium shadow-md' 
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`
            }
            onClick={() => {
              if (window.innerWidth < 768 && onClose) {
                onClose();
              }
            }}
          >
            {item.icon}
            {item.name}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <Button 
          variant="ghost" 
          className="w-full flex items-center justify-start gap-3 text-slate-300 hover:bg-slate-800 hover:text-white"
          onClick={signOut}
        >
          <LogOut className="w-5 h-5" />
          Logout
        </Button>
      </div>
    </aside>
    </>
  );
};
