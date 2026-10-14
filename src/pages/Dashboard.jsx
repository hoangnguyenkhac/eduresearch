import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dashboardAPI } from '../services/api';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { ClipboardList, MessageSquare, CheckCircle, BarChart2, Clock, Plus, ArrowRight } from 'lucide-react';

const COLORS = ['#F59E0B', '#10B981', '#3B82F6', '#8B5CF6'];

const Dashboard = () => {
  const { currentUser } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await dashboardAPI.getStats();
        setData(result);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading || !data) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>Đang tải dữ liệu tổng quan...</div>;
  }

  const validRatio = data.totalResponses > 0 ? Math.round((data.validResponses / data.totalResponses) * 100) : 0;

  return (
    <div style={{ animation: 'fadeIn 0.5s ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Dashboard</h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Xin chào, <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>{currentUser.name}</span> — Hệ thống quản trị và nghiên cứu khoa học
          </p>
        </div>
        {currentUser.role !== 'viewer' && (
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Link to="/surveys" className="btn btn-primary">
              <Plus size={18} />
              Tạo khảo sát
            </Link>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
        <Link to="/surveys" className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', textDecoration: 'none' }}>
          <div style={{ padding: '1rem', backgroundColor: '#EFF6FF', borderRadius: 'var(--radius-lg)', color: '#3B82F6' }}>
            <ClipboardList size={32} />
          </div>
          <div>
            <div style={{ fontSize: '1.75rem', fontWeight: 'bold' }}>{data.totalSurveys}</div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Bảng hỏi đã tạo</div>
          </div>
        </Link>
        <Link to="/responses" className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', textDecoration: 'none' }}>
          <div style={{ padding: '1rem', backgroundColor: '#F3E8FF', borderRadius: 'var(--radius-lg)', color: '#8B5CF6' }}>
            <MessageSquare size={32} />
          </div>
          <div>
            <div style={{ fontSize: '1.75rem', fontWeight: 'bold' }}>{data.totalResponses}</div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Tổng phản hồi</div>
          </div>
        </Link>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ padding: '1rem', backgroundColor: '#D1FAE5', borderRadius: 'var(--radius-lg)', color: '#10B981' }}>
            <CheckCircle size={32} />
          </div>
          <div>
            <div style={{ fontSize: '1.75rem', fontWeight: 'bold' }}>{data.validResponses}</div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Hợp lệ (~{validRatio}%)</div>
          </div>
        </div>
        <Link to="/analytics" className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', textDecoration: 'none' }}>
          <div style={{ padding: '1rem', backgroundColor: '#FEF3C7', borderRadius: 'var(--radius-lg)', color: '#F59E0B' }}>
            <BarChart2 size={32} />
          </div>
          <div>
            <div style={{ fontSize: '1.75rem', fontWeight: 'bold' }}>{data.totalAnalysis}</div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Phân tích thống kê</div>
          </div>
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold' }}>Xu hướng thu thập dữ liệu</h3>
            <span className="badge badge-info">Thời gian thực</span>
          </div>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.areaData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6B7280'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#6B7280'}} dx={-10} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                />
                <Area type="monotone" dataKey="value" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Đối tượng khảo sát</h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.pieData}
                  cx="50%"
                  cy="45%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {data.pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div className="card">
          <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Tiến độ thu mẫu nghiên cứu</h3>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontWeight: '500' }}>Khảo sát chính thức</span>
              <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>
                {data.totalResponses}/200 ({Math.min(100, Math.round((data.totalResponses / 200) * 100))}%)
              </span>
            </div>
            <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--bg-surface-hover)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: `${Math.min(100, Math.round((data.totalResponses / 200) * 100))}%`, height: '100%', backgroundColor: 'var(--primary)', borderRadius: '4px' }}></div>
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontWeight: '500' }}>Mục tiêu tối thiểu Pilot test</span>
              <span style={{ fontWeight: 'bold', color: 'var(--secondary)' }}>
                {Math.min(30, data.totalResponses)}/30 ({Math.min(100, Math.round((Math.min(30, data.totalResponses) / 30) * 100))}%)
              </span>
            </div>
            <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--bg-surface-hover)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: `${Math.min(100, Math.round((Math.min(30, data.totalResponses) / 30) * 100))}%`, height: '100%', backgroundColor: 'var(--secondary)', borderRadius: '4px' }}></div>
            </div>
          </div>
          
          <div style={{ marginTop: '1.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            * Khuyến nghị: Cần tối thiểu 100-200 mẫu hợp lệ để chạy phân tích hồi quy &amp; SEM.
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold' }}>Thao tác nhanh</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Link to="/surveys" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', backgroundColor: '#F9FAFB', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', textDecoration: 'none', color: 'inherit' }}>
              <div>
                <div style={{ fontWeight: '600' }}>Quản lý Bảng hỏi</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Tạo mới, chỉnh sửa thang đo và lấy link chia sẻ</div>
              </div>
              <ArrowRight size={18} color="var(--primary)" />
            </Link>

            <Link to="/responses" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', backgroundColor: '#F9FAFB', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', textDecoration: 'none', color: 'inherit' }}>
              <div>
                <div style={{ fontWeight: '600' }}>Kiểm tra Dữ liệu Phản hồi</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Lọc phiếu rác, xem phân bố và xuất Excel</div>
              </div>
              <ArrowRight size={18} color="var(--primary)" />
            </Link>

            <Link to="/documents" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', backgroundColor: '#F9FAFB', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', textDecoration: 'none', color: 'inherit' }}>
              <div>
                <div style={{ fontWeight: '600' }}>Kho Tài liệu Nghiên cứu</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Tải lên các tài liệu lý thuyết, thang đo và báo cáo</div>
              </div>
              <ArrowRight size={18} color="var(--primary)" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
