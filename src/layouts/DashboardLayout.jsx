import React from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import { Building2, Shield, User, ChevronRight, GraduationCap, CheckCircle } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';

const ROUTE_NAMES = {
  '/': 'Tổng quan hệ thống',
  '/dashboard': 'Tổng quan hệ thống',
  '/surveys': 'Khảo sát & Bảng hỏi',
  '/responses': 'Dữ liệu phản hồi',
  '/analytics': 'Phân tích thống kê & Định tính',
  '/clustering': 'Bản đồ Phân cụm Hồ sơ Phát triển',
  '/users': 'Quản lý tài khoản',

  '/profile': 'Hồ sơ người dùng & Bảo mật',
  '/settings': 'Cấu hình hệ thống',
};

const DashboardLayout = () => {
  const { currentUser } = useAuth();
  const location = useLocation();

  const currentPath = location.pathname;
  const currentPageTitle = ROUTE_NAMES[currentPath] || 'Không gian nghiên cứu';

  const roleLabel = currentUser?.role === 'admin' ? 'Super Admin' : (currentUser?.role === 'researcher' ? 'Nghiên cứu viên' : 'Người xem');
  const roleBadgeStyle = currentUser?.role === 'admin'
    ? { backgroundColor: '#FEE2E2', color: '#DC2626', border: '1px solid #FECACA' }
    : (currentUser?.role === 'researcher'
      ? { backgroundColor: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE' }
      : { backgroundColor: '#F3F4F6', color: '#4B5563', border: '1px solid #E5E7EB' });

  const initialLetter = (currentUser?.name || currentUser?.email || 'U').charAt(0).toUpperCase();

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-color)' }}>
      <Sidebar />
      <div style={{ flex: 1, marginLeft: '260px', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* HEADER HIỆN ĐẠI & TRỰC QUAN */}
        <header style={{
          height: '68px',
          backgroundColor: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 2rem',
          position: 'sticky',
          top: 0,
          zIndex: 40,
          boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
        }}>
          {/* BREADCRUMB & TRANG HIỆN TẠI */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <span style={{ fontWeight: '500' }}>EduResearch</span>
              <ChevronRight size={14} />
              <span style={{ color: 'var(--text-main)', fontWeight: '600' }}>{currentPageTitle}</span>
            </div>

            <div style={{ width: '1px', height: '16px', backgroundColor: 'var(--border-color)', margin: '0 0.5rem' }} />

            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.75rem',
              color: '#059669',
              backgroundColor: '#ECFDF5',
              border: '1px solid #A7F3D0',
              padding: '0.2rem 0.6rem',
              borderRadius: '20px'
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10B981', display: 'inline-block' }} />
              Năm học 2026 - 2027
            </div>
          </div>

          {/* KHỐI THÔNG TIN ĐƠN VỊ & NGƯỜI DÙNG */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            {/* ĐƠN VỊ CÔNG TÁC */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.35rem 0.75rem',
              backgroundColor: '#F8FAFC',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.825rem',
              color: 'var(--text-main)'
            }}>
              <Building2 size={16} color="var(--primary)" />
              <span style={{ fontWeight: '500' }}>{currentUser?.unit || 'Trường Đại học Sư phạm TP.HCM'}</span>
            </div>

            {/* PHÂN CÁCH */}
            <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--border-color)' }} />

            {/* THÔNG TIN TÀI KHOẢN VÀ VAI TRÒ */}
            <Link 
              to="/profile" 
              style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none', color: 'inherit', padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-md)', transition: 'background-color 0.2s' }}
              title="Xem hồ sơ & Đổi mật khẩu"
            >
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #4F46E5, #3B82F6)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                fontSize: '1rem',
                boxShadow: '0 2px 4px rgba(79, 70, 229, 0.25)'
              }}>
                {initialLetter}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-main)' }}>
                    {currentUser?.name || 'Administrator'}
                  </span>
                  <span style={{
                    fontSize: '0.65rem',
                    fontWeight: '700',
                    padding: '0.1rem 0.45rem',
                    borderRadius: '10px',
                    ...roleBadgeStyle
                  }}>
                    {roleLabel}
                  </span>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {currentUser?.email || 'admin@eduresearch.com'}
                </span>
              </div>
            </Link>
          </div>
        </header>

        <main style={{ padding: '2rem', flex: 1, overflowY: 'auto' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
