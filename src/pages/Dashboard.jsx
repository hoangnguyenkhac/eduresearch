import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dashboardAPI } from '../services/api';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ClipboardList, MessageSquare, CheckCircle, BarChart2, Plus, ArrowRight, Compass, Sparkles, Filter, Layers, CheckCircle2 } from 'lucide-react';
import GaugeMeter from '../components/GaugeMeter';

const PALETTE = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#6366F1'];

const Dashboard = () => {
  const { currentUser } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSurveyId, setSelectedSurveyId] = useState('all');

  const fetchDashboardStats = async (surveyId) => {
    try {
      setLoading(true);
      const result = await dashboardAPI.getStats(surveyId);
      setData(result);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats(selectedSurveyId);
  }, [selectedSurveyId]);

  if (loading && !data) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', color: 'var(--text-muted)' }}>
        Đang tải dữ liệu tổng quan...
      </div>
    );
  }

  const validRatio = data?.totalResponses > 0 ? Math.round((data.validResponses / data.totalResponses) * 100) : 0;
  const surveyTarget = data?.target || 100;
  const pilotTarget = data?.pilotTarget || Math.round(surveyTarget * 0.15);
  const targetPct = Math.min(100, Math.round(((data?.totalResponses || 0) / Math.max(1, surveyTarget)) * 100));
  const pilotPct = Math.min(100, Math.round(((Math.min(pilotTarget, data?.totalResponses || 0)) / Math.max(1, pilotTarget)) * 100));

  return (
    <div style={{ animation: 'fadeIn 0.5s ease' }}>
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', marginBottom: '0.35rem' }}>Dashboard</h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Xin chào, <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>{currentUser.name}</span> — Hệ thống quản trị và nghiên cứu khoa học EduResearch
          </p>
        </div>
        {currentUser.role !== 'viewer' && (
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Link to="/clustering" className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Compass size={16} />
              <span>Bản đồ phân cụm</span>
            </Link>
            <Link to="/surveys" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Plus size={18} />
              <span>Tạo khảo sát</span>
            </Link>
          </div>
        )}
      </div>

      {/* THANH CHỌN NHANH BẢNG HỎI KHẢO SÁT */}
      <div className="card" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem', border: '1px solid #CBD5E1', backgroundColor: '#F8FAFC' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: '320px' }}>
            <div style={{ padding: '0.6rem', backgroundColor: '#EFF6FF', borderRadius: '8px', color: '#1E40AF', display: 'flex', flexShrink: 0 }}>
              <Filter size={20} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
                  Phạm vi quan sát dữ liệu bảng hỏi:
                </span>
                {data.selectedSurvey && (
                  <span style={{ fontSize: '0.75rem', backgroundColor: '#DBEAFE', color: '#1E40AF', padding: '0.1rem 0.5rem', borderRadius: '4px', fontWeight: 'bold' }}>
                    Khảo sát #{data.selectedSurvey.id}
                  </span>
                )}
              </div>
              <select 
                className="input"
                value={selectedSurveyId}
                onChange={(e) => setSelectedSurveyId(e.target.value)}
                style={{ width: '100%', backgroundColor: 'white', fontWeight: '600', fontSize: '0.925rem', cursor: 'pointer', border: '1px solid #94A3B8' }}
              >
                <option value="all">
                  📊 Tất cả bảng hỏi khảo sát (Tổng hợp toàn hệ thống — {data.totalSurveys || 4} bộ, 300 phản hồi)
                </option>
                {data.surveysList && data.surveysList.map(s => (
                  <option key={s.id} value={s.id}>
                    Khảo sát #{s.id}: {s.title} ({s.responses_count || 0} phản hồi thu nhận)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Direct Shortcuts for Selected Survey */}
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <Link 
              to={selectedSurveyId !== 'all' ? `/analytics?surveyId=${selectedSurveyId}` : '/analytics'} 
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.825rem', padding: '0.55rem 0.9rem' }}
            >
              <Sparkles size={15} />
              <span>Phân tích 5 khâu APA 7 &rarr;</span>
            </Link>
            <Link 
              to={selectedSurveyId !== 'all' ? `/clustering?surveyId=${selectedSurveyId}` : '/clustering'} 
              className="btn btn-outline"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.825rem', padding: '0.55rem 0.9rem' }}
            >
              <Compass size={15} />
              <span>Bản đồ phân cụm &rarr;</span>
            </Link>
          </div>

        </div>
      </div>

      {/* 4 THẺ THỐNG KÊ (PHÙ HỢP RIÊNG THEO BỘ ĐANG CHỌN) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '1.75rem' }}>
        <Link to="/surveys" className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', textDecoration: 'none', padding: '1.25rem' }}>
          <div style={{ padding: '0.85rem', backgroundColor: '#EFF6FF', borderRadius: 'var(--radius-lg)', color: '#3B82F6' }}>
            <ClipboardList size={28} />
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: '1.75rem', fontWeight: 'bold' }}>
              {data.isAllSurveys ? data.totalSurveys : `#${data.selectedSurvey?.id}`}
            </div>
            <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {data.isAllSurveys ? 'Bảng hỏi đã tạo' : (data.selectedSurvey?.audience === 'leadership' ? 'Ban Giám hiệu & HĐT' : (data.selectedSurvey?.audience === 'student_alumni' ? 'Người học & Cựu SV' : (data.selectedSurvey?.audience === 'dept_head' ? 'Trưởng/Phó Khoa Phòng' : 'Giảng viên & Nhân viên')))}
            </div>
          </div>
        </Link>

        <Link to={data.isAllSurveys ? '/responses' : `/responses?surveyId=${data.selectedSurvey?.id}`} className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', textDecoration: 'none', padding: '1.25rem' }}>
          <div style={{ padding: '0.85rem', backgroundColor: '#F3E8FF', borderRadius: 'var(--radius-lg)', color: '#8B5CF6' }}>
            <MessageSquare size={28} />
          </div>
          <div>
            <div style={{ fontSize: '1.75rem', fontWeight: 'bold' }}>{data.totalResponses}</div>
            <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
              {data.isAllSurveys ? 'Tổng phản hồi thu nhận' : 'Phản hồi bộ khảo sát này'}
            </div>
          </div>
        </Link>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '1.25rem' }}>
          <div style={{ padding: '0.85rem', backgroundColor: '#D1FAE5', borderRadius: 'var(--radius-lg)', color: '#10B981' }}>
            <CheckCircle size={28} />
          </div>
          <div>
            <div style={{ fontSize: '1.75rem', fontWeight: 'bold' }}>{data.validResponses}</div>
            <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>Mẫu sạch hợp lệ (~{validRatio}%)</div>
          </div>
        </div>

        <Link to={data.isAllSurveys ? '/analytics' : `/analytics?surveyId=${data.selectedSurvey?.id}`} className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', textDecoration: 'none', padding: '1.25rem' }}>
          <div style={{ padding: '0.85rem', backgroundColor: '#FEF3C7', borderRadius: 'var(--radius-lg)', color: '#F59E0B' }}>
            <BarChart2 size={28} />
          </div>
          <div>
            <div style={{ fontSize: '1.75rem', fontWeight: 'bold' }}>5 Khâu</div>
            <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>Phân tích chuẩn APA 7</div>
          </div>
        </Link>
      </div>

      {/* SẢN PHẨM 1: ĐỒNG HỒ ĐO GAUGE METER & BIỂU ĐỒ XU HƯỚNG */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 2fr', gap: '1.5rem', marginBottom: '1.75rem' }}>
        
        {/* ĐỒNG HỒ ĐO GAUGE METER */}
        <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <GaugeMeter 
            score={data.readinessIndex || 78.5} 
            title={data.isAllSurveys ? 'Chỉ số Sẵn sàng Chuyển đổi (AT Tổng thể)' : `Chỉ số Sẵn sàng AT (Khảo sát #${data.selectedSurvey?.id})`}
          />
          <div style={{ textAlign: 'center', marginTop: '0.75rem' }}>
            <Link 
              to={data.isAllSurveys ? '/analytics' : `/analytics?surveyId=${data.selectedSurvey?.id}`} 
              style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: '600', textDecoration: 'none' }}
            >
              Xem phân tích chi tiết 5 chiều cạnh &rarr;
            </Link>
          </div>
        </div>

        {/* BIỂU ĐỒ XU HƯỚNG THU MẪU */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 'bold', margin: 0 }}>Xu hướng thu thập dữ liệu</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                {data.isAllSurveys ? 'Số lượng phiếu thực tế toàn hệ thống theo thời gian thực' : `Tiến độ thu nhận của ${data.selectedSurvey?.title?.split('—')[0] || ''}`}
              </p>
            </div>
            <span className="badge badge-info" style={{ fontSize: '0.75rem' }}>Thời gian thực</span>
          </div>
          <div style={{ height: '260px' }}>
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
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                <Area type="monotone" dataKey="value" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* LƯỚI PHÂN BỐ ĐỐI TƯỢNG VÀ TIẾN ĐỘ THU MẪU (GIAO DIỆN ĐƯỢC CHUẨN HÓA KHÔNG LỖI) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1.4fr) 1fr', gap: '1.5rem', marginBottom: '1.75rem' }}>
        
        {/* ĐỐI TƯỢNG KHẢO SÁT: GIAO DIỆN 2 CỘT HIỂN THỊ CHUYÊN NGHIỆP */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 'bold', margin: 0 }}>Cơ cấu đối tượng người tham gia</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
                {data.isAllSurveys 
                  ? 'Phân bố theo 4 nhóm bảng hỏi khảo sát trong hệ thống' 
                  : `Phân bố theo chức danh (${data.selectedSurvey?.title?.split('—')[0]?.trim() || ''})`}
              </p>
            </div>
            <span style={{ fontSize: '0.75rem', backgroundColor: '#F1F5F9', color: '#475569', padding: '0.2rem 0.6rem', borderRadius: '4px', fontWeight: '600' }}>
              {data.pieData?.length || 0} nhóm đối tượng
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(180px, 1fr) 1.4fr', gap: '1rem', alignItems: 'center' }}>
            {/* Donut Chart với tổng số phản hồi ở tâm vòng tròn */}
            <div style={{ position: 'relative', height: '220px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {data.pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PALETTE[index % PALETTE.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(val, name) => [`${val} phiếu (${data.totalResponses > 0 ? ((val / data.totalResponses) * 100).toFixed(1) : 0}%)`, name]}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* Huy hiệu tổng số ở giữa tâm donut */}
              <div style={{ position: 'absolute', textAlign: 'center', pointerEvents: 'none' }}>
                <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--text-main)', lineHeight: 1 }}>
                  {data.totalResponses}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  phản hồi
                </div>
              </div>
            </div>

            {/* Danh sách nhãn đối tượng có thanh tiến độ (Progress Bars) thay vì legend nằm ngang lỗi */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: '240px', overflowY: 'auto', paddingRight: '0.35rem' }}>
              {data.pieData.map((item, index) => {
                const pct = data.totalResponses > 0 ? ((item.value / data.totalResponses) * 100).toFixed(1) : 0;
                const color = PALETTE[index % PALETTE.length];
                return (
                  <div key={index} style={{ padding: '0.45rem 0.65rem', backgroundColor: '#F8FAFC', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', overflow: 'hidden' }}>
                        <span style={{ width: '9px', height: '9px', borderRadius: '50%', backgroundColor: color, flexShrink: 0 }} />
                        <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={item.fullName || item.name}>
                          {item.name}
                        </span>
                      </div>
                      <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color, flexShrink: 0 }}>
                        {item.value} ({pct}%)
                      </span>
                    </div>
                    <div style={{ width: '100%', height: '4px', backgroundColor: '#E2E8F0', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', backgroundColor: color, borderRadius: '2px' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* TIẾN ĐỘ THU MẪU NGHIÊN CỨU */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 'bold', marginBottom: '1.25rem' }}>
            {data.isAllSurveys ? 'Tiến độ thu mẫu toàn hệ thống' : `Tiến độ thu mẫu (Mục tiêu: ${surveyTarget} phiếu)`}
          </h3>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontWeight: '500', fontSize: '0.875rem' }}>Mục tiêu chính thức</span>
              <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>
                {data.totalResponses}/{surveyTarget} ({targetPct}%)
              </span>
            </div>
            <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--bg-surface-hover)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: `${targetPct}%`, height: '100%', backgroundColor: 'var(--primary)', borderRadius: '4px' }}></div>
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontWeight: '500', fontSize: '0.875rem' }}>Mục tiêu tối thiểu Pilot test</span>
              <span style={{ fontWeight: 'bold', color: 'var(--secondary)' }}>
                {Math.min(pilotTarget, data.totalResponses)}/{pilotTarget} ({pilotPct}%)
              </span>
            </div>
            <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--bg-surface-hover)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: `${pilotPct}%`, height: '100%', backgroundColor: 'var(--secondary)', borderRadius: '4px' }}></div>
            </div>
          </div>
          
          <div style={{ padding: '0.75rem', backgroundColor: '#F8FAFC', borderRadius: '6px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            * Khuyến nghị APA: Cần tối thiểu 50-100 mẫu hợp lệ để các kiểm định Cronbach Alpha, EFA/KMO và hồi quy SEM đạt độ vững thống kê.
          </div>
        </div>

      </div>

      {/* THAO TÁC NHANH VÀO 6 SẢN PHẨM ĐẦU RA */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 'bold', marginBottom: '1rem' }}>Không gian nghiên cứu &amp; Kết xuất sản phẩm</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
          
          <Link to={data.isAllSurveys ? '/analytics' : `/analytics?surveyId=${data.selectedSurvey?.id}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', backgroundColor: '#EFF6FF', borderRadius: 'var(--radius-md)', border: '1px solid #BFDBFE', textDecoration: 'none', color: 'inherit' }}>
            <div>
              <div style={{ fontWeight: 'bold', color: '#1E40AF', fontSize: '0.9rem' }}>Phân tích 5 khâu APA 7</div>
              <div style={{ fontSize: '0.75rem', color: '#3B82F6' }}>Cronbach, EFA, Pearson, SEM &amp; SHAP</div>
            </div>
            <ArrowRight size={18} color="#1E40AF" />
          </Link>

          <Link to={data.isAllSurveys ? '/clustering' : `/clustering?surveyId=${data.selectedSurvey?.id}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', backgroundColor: '#ECFDF5', borderRadius: 'var(--radius-md)', border: '1px solid #A7F3D0', textDecoration: 'none', color: 'inherit' }}>
            <div>
              <div style={{ fontWeight: 'bold', color: '#065F46', fontSize: '0.9rem' }}>Bản đồ phân cụm (2D)</div>
              <div style={{ fontSize: '0.75rem', color: '#059669' }}>Scatter Plot &amp; Hồ sơ nhóm trường</div>
            </div>
            <ArrowRight size={18} color="#065F46" />
          </Link>

          <Link to="/surveys" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', backgroundColor: '#F8FAFC', borderRadius: 'var(--radius-md)', border: '1px solid #E2E8F0', textDecoration: 'none', color: 'inherit' }}>
            <div>
              <div style={{ fontWeight: 'bold', color: 'var(--text-main)', fontSize: '0.9rem' }}>Quản lý Bảng hỏi</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>4 bộ thang đo chuẩn hóa giáo dục</div>
            </div>
            <ArrowRight size={18} color="var(--primary)" />
          </Link>

          <Link to={data.isAllSurveys ? '/responses' : `/responses?surveyId=${data.selectedSurvey?.id}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', backgroundColor: '#F8FAFC', borderRadius: 'var(--radius-md)', border: '1px solid #E2E8F0', textDecoration: 'none', color: 'inherit' }}>
            <div>
              <div style={{ fontWeight: 'bold', color: 'var(--text-main)', fontSize: '0.9rem' }}>Dữ liệu phản hồi</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Quét Straightlining &amp; Speeders</div>
            </div>
            <ArrowRight size={18} color="var(--primary)" />
          </Link>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;


