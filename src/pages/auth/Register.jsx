import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI, pingServer } from '../../services/api';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    unit: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isWakingUp, setIsWakingUp] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    pingServer();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      return setError('Mật khẩu xác nhận không khớp.');
    }

    setIsLoading(true);
    setIsWakingUp(false);

    const wakingTimer = setTimeout(() => {
      setIsWakingUp(true);
    }, 3500);

    try {
      await authAPI.register({ 
        name: formData.name, 
        email: formData.email, 
        password: formData.password,
        unit: formData.unit,
        role: 'researcher'
      });
      
      clearTimeout(wakingTimer);
      alert('Đăng ký thành công! Vui lòng đăng nhập.');
      navigate('/login');
    } catch (err) {
      clearTimeout(wakingTimer);
      setIsWakingUp(false);
      setError(err.message);
    } finally {
      clearTimeout(wakingTimer);
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem', textAlign: 'center' }}>Đăng ký tài khoản</h2>
      
      {error && (
        <div style={{ padding: '0.75rem', backgroundColor: '#FEE2E2', color: '#EF4444', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: '0.875rem' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>Họ và tên</label>
          <input 
            type="text" 
            name="name"
            className="input" 
            required 
            value={formData.name}
            onChange={handleChange}
            placeholder="Nguyễn Văn A" 
          />
        </div>
        
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>Email</label>
          <input 
            type="email" 
            name="email"
            className="input" 
            required 
            value={formData.email}
            onChange={handleChange}
            placeholder="email@truong.edu.vn" 
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>Đơn vị / Phòng ban</label>
          <input 
            type="text" 
            name="unit"
            className="input" 
            value={formData.unit}
            onChange={handleChange}
            placeholder="Khoa CNTT" 
          />
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>Mật khẩu</label>
            <input 
              type="password" 
              name="password"
              className="input" 
              required 
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••" 
            />
          </div>
          
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>Xác nhận mật khẩu</label>
            <input 
              type="password" 
              name="confirmPassword"
              className="input" 
              required 
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="••••••••" 
            />
          </div>
        </div>

        <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem', width: '100%' }} disabled={isLoading}>
          {isLoading ? 'Đang xử lý...' : 'Tạo tài khoản'}
        </button>

        {isWakingUp && (
          <div style={{
            padding: '0.85rem 1rem',
            backgroundColor: '#EFF6FF',
            border: '1px solid #BFDBFE',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.825rem',
            color: '#1E40AF',
            lineHeight: '1.45',
            display: 'flex',
            gap: '0.75rem',
            alignItems: 'center',
            animation: 'fadeIn 0.3s ease'
          }}>
            <div style={{
              width: '18px',
              height: '18px',
              border: '2px solid #BFDBFE',
              borderTopColor: '#2563EB',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
              flexShrink: 0
            }} />
            <div>
              <div style={{ fontWeight: '700', marginBottom: '0.15rem' }}>
                Đang khởi động lại máy chủ...
              </div>
              <div style={{ color: '#3B82F6', fontSize: '0.75rem' }}>
                Máy chủ đám mây đang thức dậy từ trạng thái nghỉ (khoảng 20–40s). Vui lòng không đóng trang!
              </div>
            </div>
          </div>
        )}
      </form>

      <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
        Đã có tài khoản? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: '600' }}>Đăng nhập</Link>
      </div>
    </div>
  );
};

export default Register;
