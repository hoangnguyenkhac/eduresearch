import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, FileText, Users, PieChart, Database, FileBox, LogOut, User } from 'lucide-react';

const Sidebar = () => {
  const { currentUser, logout } = useAuth();
  
  const navItems = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} />, roles: ['admin', 'researcher', 'viewer'] },
    { name: 'Bảng hỏi khảo sát', path: '/surveys', icon: <FileText size={20} />, roles: ['admin', 'researcher', 'viewer'] },
    { name: 'Phản hồi', path: '/responses', icon: <Database size={20} />, roles: ['admin', 'researcher', 'viewer'] },
    { name: 'Phân tích thống kê', path: '/analytics', icon: <PieChart size={20} />, roles: ['admin', 'researcher', 'viewer'] },
    { name: 'Kho tài liệu', path: '/documents', icon: <FileBox size={20} />, roles: ['admin', 'researcher', 'viewer'] },
    { name: 'Hồ sơ cá nhân', path: '/profile', icon: <User size={20} />, roles: ['admin', 'researcher', 'viewer'] },
    { name: 'Người dùng', path: '/users', icon: <Users size={20} />, roles: ['admin'] },
  ];

  return (
    <div className="sidebar" style={{ 
      width: '260px', 
      backgroundColor: 'var(--bg-surface)', 
      borderRight: '1px solid var(--border-color)',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      position: 'fixed'
    }}>
      <div className="sidebar-header" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{ width: '32px', height: '32px', backgroundColor: 'var(--primary)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>ER</div>
        <div>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 'bold', margin: 0 }}>EduResearch</h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>Hệ thống nghiên cứu</p>
        </div>
      </div>
      
      <div className="sidebar-menu" style={{ padding: '1rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem', paddingLeft: '0.75rem' }}>
          Tổng quan
        </div>
        {navItems.filter(item => item.roles.includes(currentUser.role)).map((item, index) => {
          if (item.name === 'Bảng hỏi khảo sát') {
             return (
               <React.Fragment key="group-research">
                  <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: '1rem', marginBottom: '0.5rem', paddingLeft: '0.75rem' }}>
                    Nghiên cứu
                  </div>
                  <NavLink 
                    to={item.path} 
                    className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                    style={({ isActive }) => ({
                      display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', borderRadius: 'var(--radius-md)',
                      color: isActive ? 'var(--primary)' : 'var(--text-main)',
                      backgroundColor: isActive ? 'rgba(79, 70, 229, 0.1)' : 'transparent',
                      fontWeight: isActive ? '600' : '500',
                      textDecoration: 'none',
                      transition: 'all 0.2s'
                    })}
                  >
                    {item.icon}
                    <span>{item.name}</span>
                  </NavLink>
               </React.Fragment>
             )
          }
          if (item.name === 'Người dùng') {
             return (
               <React.Fragment key="group-admin">
                  <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: '1rem', marginBottom: '0.5rem', paddingLeft: '0.75rem' }}>
                    Quản trị
                  </div>
                  <NavLink 
                    to={item.path} 
                    className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                    style={({ isActive }) => ({
                      display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', borderRadius: 'var(--radius-md)',
                      color: isActive ? 'var(--primary)' : 'var(--text-main)',
                      backgroundColor: isActive ? 'rgba(79, 70, 229, 0.1)' : 'transparent',
                      fontWeight: isActive ? '600' : '500',
                      textDecoration: 'none',
                      transition: 'all 0.2s'
                    })}
                  >
                    {item.icon}
                    <span>{item.name}</span>
                  </NavLink>
               </React.Fragment>
             )
          }
          return (
            <NavLink 
              key={item.path}
              to={item.path} 
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', borderRadius: 'var(--radius-md)',
                color: isActive ? 'var(--primary)' : 'var(--text-main)',
                backgroundColor: isActive ? 'rgba(79, 70, 229, 0.1)' : 'transparent',
                fontWeight: isActive ? '600' : '500',
                textDecoration: 'none',
                transition: 'all 0.2s'
              })}
            >
              {item.icon}
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </div>

      {/* User Info & Logout */}
      <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
        <NavLink 
          to="/profile"
          style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', textDecoration: 'none', color: 'inherit', padding: '0.25rem', borderRadius: 'var(--radius-md)', transition: 'background-color 0.2s' }}
          title="Xem hồ sơ & Đổi mật khẩu"
        >
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
            {(currentUser?.name || 'U').substring(0,2).toUpperCase()}
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{ fontSize: '0.875rem', fontWeight: 'bold', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{currentUser?.name || 'Người dùng'}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{currentUser?.role} • Hồ sơ</div>
          </div>
        </NavLink>
        <button 
          onClick={logout}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.5rem', backgroundColor: '#FEE2E2', color: '#EF4444', borderRadius: 'var(--radius-md)', fontWeight: '500', cursor: 'pointer', border: 'none' }}
        >
          <LogOut size={16} />
          Đăng xuất
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
