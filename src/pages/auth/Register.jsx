import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/api';

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
  const navigate = useNavigate();

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
    try {
      await authAPI.register({ 
        name: formData.name, 
        email: formData.email, 
        password: formData.password,
        unit: formData.unit,
        role: 'researcher'
      });
      
      alert('Đăng ký thành công! Vui lòng đăng nhập.');
      navigate('/login');
    } catch (err) {
      setError(err.message);
    } finally {
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
      </form>

      <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
        Đã có tài khoản? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: '600' }}>Đăng nhập</Link>
      </div>
    </div>
  );
};

export default Register;
