import { NavLink } from 'react-router-dom';
import { Flame, CheckSquare, ClipboardList, Plane } from 'lucide-react';

const navItems = [
  { path: '/fault-heatmap', label: '故障热力', icon: Flame },
  { path: '/case-quality', label: '案例质量', icon: CheckSquare },
  { path: '/review-checklist', label: '复盘清单', icon: ClipboardList },
];

export default function Sidebar() {
  return (
    <aside className="w-60 h-screen bg-deep-blue-800/80 backdrop-blur border-r border-white/5 flex flex-col fixed left-0 top-0 z-40">
      <div className="px-6 py-5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-tech-cyan-400 to-tech-cyan-600 flex items-center justify-center shadow-lg shadow-tech-cyan-500/20">
            <Plane className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-white font-semibold text-base leading-tight">航线排故</h1>
            <p className="text-slate-400 text-xs">知识库看板</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 py-4 px-3 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `group flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-tech-cyan-500/20 to-tech-cyan-500/5 text-tech-cyan-400 border border-tech-cyan-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`
            }
          >
            <item.icon className="w-4 h-4 flex-shrink-0" />
            <span>{item.label}</span>
            {item.path === '/review-checklist' && (
              <span className="ml-auto w-5 h-5 rounded-full bg-alert-orange-500/20 text-alert-orange-400 text-[10px] flex items-center justify-center font-bold">
                8
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-white/5">
        <div className="flex items-center gap-3 px-2">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-alert-orange-400 to-alert-orange-600 flex items-center justify-center text-white text-sm font-bold">
            质
          </div>
          <div className="min-w-0">
            <p className="text-white text-sm font-medium truncate">质控管理员</p>
            <p className="text-slate-500 text-xs">维修质量部</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
