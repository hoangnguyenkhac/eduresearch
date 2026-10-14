import React from 'react';
import { Outlet } from 'react-router-dom';

const AuthLayout = () => {
  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      backgroundColor: '#F3F4F6',
      backgroundImage: 'radial-gradient(#E5E7EB 1px, transparent 1px)',
      backgroundSize: '20px 20px'
    }}>
      <div style={{ 
        width: '100%', 
        maxWidth: '400px', 
        padding: '2.5rem', 
        backgroundColor: 'var(--bg-surface)', 
        borderRadius: 'var(--radius-xl)', 
        boxShadow: 'var(--shadow-lg)' 
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ 
            width: '48px', 
            height: '48px', 
            backgroundColor: 'var(--primary)', 
            borderRadius: '12px', 
            display: 'inline-flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            color: 'white', 
            fontWeight: 'bold',
            fontSize: '1.25rem',
            marginBottom: '1rem'
          }}>
            ER
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>EduResearch</h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Hệ thống nghiên cứu khoa học</p>
        </div>
        
        <Outlet />
      </div>
    </div>
  );
};

export default AuthLayout;
