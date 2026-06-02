import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Users, 
  Scale, 
  Percent, 
  Package, 
  FileText, 
  LogOut 
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';

export const Sidebar: React.FC = () => {
  const { signOut } = useAuth();

  const navItems = [
    { name: 'Client Master', path: '/clients', icon: <Users className="w-5 h-5" /> },
    { name: 'UOM Master', path: '/units', icon: <Scale className="w-5 h-5" /> },
    { name: 'GST Master', path: '/gst', icon: <Percent className="w-5 h-5" /> },
    { name: 'Product Master', path: '/products', icon: <Package className="w-5 h-5" /> },
    { name: 'Quotations', path: '/quotations', icon: <FileText className="w-5 h-5" /> },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-100 flex flex-col h-full shadow-xl">
      <div className="p-6">
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <FileText className="w-6 h-6 text-blue-500" />
          QuoteMaster
        </h1>
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
  );
};
