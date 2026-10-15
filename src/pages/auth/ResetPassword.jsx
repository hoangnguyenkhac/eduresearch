import React, { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/api';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get('token') || '';
  const navigate = useNavigate();

  const [token, setToken] = useState(tokenFromUrl);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState({ type: '', message: '' });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: '', message: '' });

    if (!token.trim()) {
      setStatus({ type: 'error', message: 'Vui lòng cung cấp mã khôi phục (token).' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setStatus({ type: 'error', message: 'Xác nhận mật khẩu không trùng khớp.' });
      return;
    }

    if (newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      setStatus({ 
        type: 'error', 
        message: 'Mật khẩu phải có tối thiểu 8 ký tự, bao gồm ít nhất 1 chữ hoa, 1 chữ thường và 1 chữ số.' 
      });
      return;
    }

    setIsLoading(true);

    try {
      const data = await authAPI.resetPassword({ token: token.trim(), newPassword });
      setStatus({ type: 'success', message: data.message });
      setTimeout(() => {
        navigate('/login');
      }, 2500);
    } catch (err) {
      setStatus({ type: 'error', message: err.message || 'Lỗi khi đặt lại mật khẩu.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem', textAlign: 'center' }}>
        Đặt lại mật khẩu mới
      </h2>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textAlign: 'center', marginBottom: '1.5rem' }}>
        Thiết lập mật khẩu bảo mật mới cho tài khoản của bạn.
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
          {status.message}
          {status.type === 'success' && (
            <div style={{ marginTop: '0.5rem', fontSize: '0.75rem' }}>Đang tự động chuyển đến trang Đăng nhập...</div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {!tokenFromUrl && (
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>Mã token khôi phục</label>
            <input 
              type="text" 
              className="input" 
              required 
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Dán mã khôi phục nhận được" 
            />
          </div>
        )}

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>Mật khẩu mới</label>
          <input 
            type="password" 
            className="input" 
            required 
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Tối thiểu 8 ký tự (hoa, thường, số)" 
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>Xác nhận mật khẩu mới</label>
          <input 
            type="password" 
            className="input" 
            required 
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Nhập lại mật khẩu mới" 
          />
        </div>

        <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem', width: '100%' }} disabled={isLoading}>
          {isLoading ? 'Đang cập nhật...' : 'Lưu mật khẩu mới'}
        </button>
      </form>

      <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem' }}>
        <Link to="/login" style={{ color: 'var(--text-muted)', fontWeight: '500' }}>← Quay lại đăng nhập</Link>
      </div>
    </div>
  );
};

export default ResetPassword;
