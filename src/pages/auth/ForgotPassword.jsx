import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../../services/api';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState({ type: '', message: '' });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: '', message: '' });
    setIsLoading(true);

    try {
      const data = await authAPI.forgotPassword(email);
      setStatus({ 
        type: 'success', 
        message: data.message,
        resetToken: data.resetToken 
      });
      setEmail('');
    } catch (err) {
      setStatus({ type: 'error', message: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem', textAlign: 'center' }}>Quên mật khẩu</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textAlign: 'center', marginBottom: '1.5rem' }}>
        Nhập email của bạn và chúng tôi sẽ gửi liên kết để đặt lại mật khẩu.
      </p>
      
      {status.message && (
        <div style={{ 
          padding: '0.75rem', 
          backgroundColor: status.type === 'success' ? '#D1FAE5' : '#FEE2E2', 
          color: status.type === 'success' ? '#065F46' : '#EF4444', 
          borderRadius: 'var(--radius-md)', 
          marginBottom: '1rem', 
          fontSize: '0.875rem' 
        }}>
          <div>{status.message}</div>
          {status.resetToken && (
            <div style={{ marginTop: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid #A7F3D0' }}>
              <Link 
                to={`/reset-password?token=${status.resetToken}`} 
                style={{ color: '#047857', fontWeight: '600', textDecoration: 'underline' }}
              >
                👉 Đặt lại mật khẩu ngay (Môi trường Thử nghiệm)
              </Link>
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>Email đăng ký</label>
          <input 
            type="email" 
            className="input" 
            required 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@truong.edu.vn" 
          />
        </div>

        <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem', width: '100%' }} disabled={isLoading}>
          {isLoading ? 'Đang gửi...' : 'Gửi liên kết'}
        </button>
      </form>

      <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem' }}>
        <Link to="/login" style={{ color: 'var(--text-muted)', fontWeight: '500' }}>← Quay lại đăng nhập</Link>
      </div>
    </div>
  );
};

export default ForgotPassword;
