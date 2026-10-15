import React, { useState, useEffect } from 'react';
import { Plus, Edit, Share2, Trash2, BarChart2, X, AlertTriangle, FileSpreadsheet, ListPlus, Sparkles, CheckCircle, QrCode, Copy, Eye, Download, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import QRCode from 'qrcode';
import { useAuth } from '../context/AuthContext';
import { surveysAPI } from '../services/api';
import Toast from '../components/Toast';

// Ngân hàng câu hỏi chuẩn hóa theo từng biến nghiên cứu
const SAMPLE_QUESTIONS = {
  'SP': [
    { code: 'SP1', text: 'Nhà trường có chiến lược chuyển đổi số rõ ràng và khả thi.', variable: 'SP', type: 'likert' },
    { code: 'SP2', text: 'Kế hoạch triển khai công nghệ được phổ biến rộng rãi tới mọi thành viên.', variable: 'SP', type: 'likert' },
    { code: 'SP3', text: 'Nguồn lực tài chính và hạ tầng được phân bổ hợp lý cho việc số hóa.', variable: 'SP', type: 'likert' },
    { code: 'SP4', text: 'Chiến lược số được cập nhật và điều chỉnh định kỳ theo thực tế.', variable: 'SP', type: 'likert' }
  ],
  'LD': [
    { code: 'LD1', text: 'Ban lãnh đạo luôn tiên phong và quyết liệt trong đổi mới công nghệ.', variable: 'LD', type: 'likert' },
    { code: 'LD2', text: 'Cán bộ quản lý khuyến khích áp dụng các sáng kiến số mới.', variable: 'LD', type: 'likert' },
    { code: 'LD3', text: 'Đơn vị có cơ chế khen thưởng đối với các giải pháp số hiệu quả.', variable: 'LD', type: 'likert' },
    { code: 'LD4', text: 'Lãnh đạo hỗ trợ giải quyết kịp thời các khó khăn khi áp dụng công nghệ.', variable: 'LD', type: 'likert' }
  ],
  'DX': [
    { code: 'DX1', text: 'Quy trình công việc và học tập được số hóa và chuẩn hóa đồng bộ.', variable: 'DX', type: 'likert' },
    { code: 'DX2', text: 'Hệ thống dữ liệu được kết nối và chia sẻ liên thông giữa các phòng ban.', variable: 'DX', type: 'likert' },
    { code: 'DX3', text: 'Nhân sự và sinh viên được đào tạo kỹ năng số đầy đủ và thường xuyên.', variable: 'DX', type: 'likert' },
    { code: 'DX4', text: 'Các ứng dụng số giúp nâng cao năng suất và chất lượng hoạt động.', variable: 'DX', type: 'likert' }
  ],
  'AT': [
    { code: 'AT1', text: 'Đơn vị thích ứng linh hoạt trước những thay đổi nhanh chóng của công nghệ.', variable: 'AT', type: 'likert' },
    { code: 'AT2', text: 'Mức độ sẵn sàng làm việc trên môi trường số của cán bộ đạt mức cao.', variable: 'AT', type: 'likert' },
    { code: 'AT3', text: 'Người tham gia tự tin làm chủ và xử lý hiệu quả các nền tảng số.', variable: 'AT', type: 'likert' },
    { code: 'AT4', text: 'Hiệu quả nghiên cứu và công tác chung tăng rõ rệt nhờ chuyển đổi số.', variable: 'AT', type: 'likert' }
  ]
};

const Surveys = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isQuestionBuilderOpen, setIsQuestionBuilderOpen] = useState(false);
  const [selectedSurvey, setSelectedSurvey] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // QR Code Modal State
  const [qrModalSurvey, setQrModalSurvey] = useState(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  // Question builder tabs
  const [builderTab, setBuilderTab] = useState('questions'); // questions, hypotheses
  const [currentQuestions, setCurrentQuestions] = useState([]);
  const [currentHypotheses, setCurrentHypotheses] = useState([]);
  const [newQuestionText, setNewQuestionText] = useState('');
  const [newQuestionCode, setNewQuestionCode] = useState('');
  const [newQuestionVar, setNewQuestionVar] = useState('SP');
  const [newQuestionType, setNewQuestionType] = useState('likert');

  // Form states
  const [formData, setFormData] = useState({
    title: '',
    questions_count: 16,
    status: 'Active',
    scale: 'Likert 5',
    target: 150,
    variables: 'SP, LD, DX, AT'
  });

  // Toast
  const [toast, setToast] = useState({ message: '', type: 'success' });
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: '', type: 'success' }), 3000);
  };

  const fetchSurveys = async () => {
    try {
      setLoading(true);
      const result = await surveysAPI.getAll();
      setSurveys(result);
    } catch (error) {
      console.error('Error fetching surveys:', error);
      showToast('Không thể tải danh sách khảo sát', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSurveys();
  }, []);

  const handleOpenCreate = () => {
    setFormData({
      title: '',
      questions_count: 16,
      status: 'Active',
      scale: 'Likert 5',
      target: 150,
      variables: 'SP, LD, DX, AT'
    });
    setIsCreateOpen(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      showToast('Vui lòng nhập tiêu đề khảo sát', 'error');
      return;
    }
    try {
      const created = await surveysAPI.create(formData);
      setSurveys([created, ...surveys]);
      setIsCreateOpen(false);
      showToast('Tạo khảo sát mới thành công!');
    } catch (err) {
      showToast(err.message || 'Lỗi khi tạo khảo sát', 'error');
    }
  };

  const handleOpenEdit = (survey) => {
    setSelectedSurvey(survey);
    setFormData({
      title: survey.title,
      questions_count: survey.questions_count,
      status: survey.status,
      scale: survey.scale,
      target: survey.target,
      variables: Array.isArray(survey.variables) ? survey.variables.join(', ') : (survey.variables || '')
    });
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSurvey) return;
    try {
      const updated = await surveysAPI.update(selectedSurvey.id, formData);
      setSurveys(surveys.map(s => s.id === updated.id ? updated : s));
      setIsEditOpen(false);
      setSelectedSurvey(null);
      showToast('Cập nhật khảo sát thành công!');
    } catch (err) {
      showToast(err.message || 'Lỗi khi cập nhật khảo sát', 'error');
    }
  };

  // Nút đổi trạng thái nhanh trực tiếp trên bảng
  const handleToggleStatus = async (survey) => {
    if (currentUser?.role === 'viewer') return;
    const nextStatus = survey.status === 'Active' ? 'Closed' : (survey.status === 'Closed' ? 'Draft' : 'Active');
    try {
      await surveysAPI.updateStatus(survey.id, nextStatus);
      setSurveys(surveys.map(s => s.id === survey.id ? { ...s, status: nextStatus } : s));
      showToast(`Đã đổi trạng thái khảo sát thành: ${nextStatus === 'Active' ? 'Đang mở' : (nextStatus === 'Closed' ? 'Đã đóng' : 'Bản nháp')}`);
    } catch (err) {
      showToast('Không thể đổi trạng thái', 'error');
    }
  };

  // Mở modal tạo mã QR code
  const handleOpenQRModal = async (survey) => {
    setQrModalSurvey(survey);
    setCopiedLink(false);
    const baseUrl = import.meta.env.VITE_APP_URL || window.location.origin;
    const surveyUrl = `${baseUrl}/survey/${survey.id}`;
    try {
      const url = await QRCode.toDataURL(surveyUrl, {
        width: 280,
        margin: 2,
        color: {
          dark: '#0F172A',
          light: '#FFFFFF'
        }
      });
      setQrCodeDataUrl(url);
    } catch (err) {
      console.error('Error generating QR code:', err);
    }
  };

  const handleDownloadQR = () => {
    if (!qrCodeDataUrl || !qrModalSurvey) return;
    const link = document.createElement('a');
    link.download = `QR_KhaoSat_${qrModalSurvey.id}.png`;
    link.href = qrCodeDataUrl;
    link.click();
    showToast('Đã tải xuống ảnh mã QR (.png)!');
  };

  const handleCopySurveyLink = (surveyId) => {
    const baseUrl = import.meta.env.VITE_APP_URL || window.location.origin;
    const url = `${baseUrl}/survey/${surveyId}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    showToast('Đã sao chép đường dẫn khảo sát vào Clipboard!');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Nhân bản khảo sát 1-Click
  const handleCloneSurvey = async (survey) => {
    if (currentUser?.role === 'viewer') return;
    try {
      const cloned = await surveysAPI.clone(survey.id);
      setSurveys([cloned, ...surveys]);
      showToast(`Đã nhân bản thành công bảng hỏi: ${cloned.title}!`);
    } catch (err) {
      showToast(err.message || 'Lỗi khi nhân bản bảng hỏi', 'error');
    }
  };

  // Xem trước khảo sát (Preview mode)
  const handlePreviewSurvey = (surveyId) => {
    window.open(`/survey/${surveyId}?preview=true`, '_blank');
  };

  // Mở modal Thiết kế câu hỏi & Khai báo giả thuyết
  const handleOpenQuestionBuilder = (survey) => {
    setSelectedSurvey(survey);
    setCurrentQuestions(survey.questions || []);
    setCurrentHypotheses(survey.hypotheses || []);
    setBuilderTab('questions');
    setIsQuestionBuilderOpen(true);
  };

  // Tính năng tạo câu hỏi mẫu nhanh theo biến
  const handleGenerateSampleQuestions = (varName) => {
    const samples = SAMPLE_QUESTIONS[varName] || [
      { code: `${varName}1`, text: `Nhận định 1 của nhân tố ${varName} trong thực tế.`, variable: varName, type: 'likert' },
      { code: `${varName}2`, text: `Nhận định 2 của nhân tố ${varName} trong thực tế.`, variable: varName, type: 'likert' },
      { code: `${varName}3`, text: `Nhận định 3 của nhân tố ${varName} trong thực tế.`, variable: varName, type: 'likert' },
      { code: `${varName}4`, text: `Nhận định 4 của nhân tố ${varName} trong thực tế.`, variable: varName, type: 'likert' },
    ];

    // Lọc các câu chưa có
    const existingCodes = currentQuestions.map(q => q.code);
    const toAdd = samples.filter(s => !existingCodes.includes(s.code));

    if (toAdd.length === 0) {
      showToast(`Các câu hỏi mẫu của biến ${varName} đã có trong bảng hỏi!`, 'info');
      return;
    }

    setCurrentQuestions([...currentQuestions, ...toAdd]);
    showToast(`Đã tự động sinh ${toAdd.length} câu hỏi mẫu chuẩn cho biến ${varName}!`);
  };

  // Tính năng tạo nhanh câu hỏi định tính mở (Tự luận / Văn bản)
  const handleAddQualitativeQuestions = () => {
    const toAdd = [
      {
        code: 'TXT_BARRIER',
        text: 'Theo bạn, rào cản hoặc khó khăn lớn nhất khi triển khai công tác chuyển đổi số tại đơn vị hiện nay là gì?',
        variable: 'QUALITATIVE',
        type: 'textarea',
        placeholder: 'Nhập ý kiến nhận xét, rào cản gặp phải (ví dụ: hạ tầng, đường truyền, đào tạo...)'
      },
      {
        code: 'TXT_SUGGESTION',
        text: 'Đề xuất hoặc kiến nghị cụ thể của bạn để nâng cao hiệu quả chuyển đổi số và năng lực thích ứng trong thời gian tới:',
        variable: 'QUALITATIVE',
        type: 'textarea',
        placeholder: 'Nhập các giải pháp hoặc kiến nghị đề xuất...'
      }
    ];

    const existingCodes = currentQuestions.map(q => q.code);
    const filtered = toAdd.filter(q => !existingCodes.includes(q.code));

    if (filtered.length === 0) {
      showToast('Đã có các câu hỏi tự luận định tính trong bảng hỏi!', 'info');
      return;
    }

    setCurrentQuestions([...currentQuestions, ...filtered]);
    showToast(`Đã thêm ${filtered.length} câu hỏi tự luận định tính vào bảng hỏi!`);
  };

  // Thêm câu hỏi tùy chỉnh
  const handleAddCustomQuestion = () => {
    if (!newQuestionText.trim()) {
      showToast('Vui lòng nhập nội dung câu hỏi', 'error');
      return;
    }
    const defaultPrefix = newQuestionType === 'textarea' || newQuestionType === 'text' ? 'TXT' : newQuestionVar;
    const code = newQuestionCode.trim() || `${defaultPrefix}${currentQuestions.length + 1}`;
    const newQ = {
      code,
      text: newQuestionText.trim(),
      variable: newQuestionType === 'textarea' || newQuestionType === 'text' ? 'QUALITATIVE' : newQuestionVar,
      type: newQuestionType
    };
    setCurrentQuestions([...currentQuestions, newQ]);
    setNewQuestionText('');
    setNewQuestionCode('');
    showToast(`Đã thêm câu hỏi ${code} (${newQuestionType === 'likert' ? 'Likert' : 'Tự luận'})!`);
  };

  // Xóa câu hỏi
  const handleDeleteQuestion = (index) => {
    const updated = currentQuestions.filter((_, i) => i !== index);
    setCurrentQuestions(updated);
  };

  // Thêm giả thuyết nghiên cứu
  const handleAddHypothesis = (indVar, depVar) => {
    const code = `H${currentHypotheses.length + 1}`;
    const newHypo = {
      code,
      name: `${indVar} ➔ ${depVar}`,
      description: `Nhân tố ${indVar} có tác động tích cực và có ý nghĩa thống kê đến ${depVar}`,
      independent: indVar,
      dependent: depVar
    };
    setCurrentHypotheses([...currentHypotheses, newHypo]);
    showToast(`Đã khai báo giả thuyết ${code}!`);
  };

  // Lưu cấu hình câu hỏi và giả thuyết vào CSDL
  const handleSaveQuestionBuilder = async () => {
    if (!selectedSurvey) return;
    try {
      const updated = await surveysAPI.update(selectedSurvey.id, {
        questions: currentQuestions,
        questions_count: currentQuestions.length,
        hypotheses: currentHypotheses
      });
      setSurveys(surveys.map(s => s.id === updated.id ? updated : s));
      setIsQuestionBuilderOpen(false);
      showToast('Đã lưu thiết kế câu hỏi & giả thuyết nghiên cứu vào CSDL!');
    } catch (err) {
      showToast('Lỗi khi lưu bộ câu hỏi', 'error');
    }
  };

  const handleDelete = async (id) => {
    try {
      await surveysAPI.delete(id);
      setSurveys(surveys.filter(s => s.id !== id));
      setDeleteConfirmId(null);
      showToast('Đã xóa khảo sát thành công!');
    } catch (err) {
      showToast(err.message || 'Lỗi khi xóa khảo sát', 'error');
    }
  };

  const handleShare = (survey) => {
    const baseUrl = import.meta.env.VITE_APP_URL || window.location.origin;
    const shareUrl = `${baseUrl}/survey/${survey.id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      showToast(`Đã sao chép link khảo sát #${survey.id}!`);
    } else {
      showToast(`Link khảo sát: ${shareUrl}`);
    }
  };

  const handleAnalyze = (survey) => {
    navigate(`/analytics?surveyId=${survey.id}`);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Active': return <span className="badge badge-success" title="Bấm để chuyển trạng thái">Đang mở (Active)</span>;
      case 'Draft': return <span className="badge badge-neutral" title="Bấm để chuyển trạng thái">Nháp (Draft)</span>;
      case 'Closed': return <span className="badge badge-warning" title="Bấm để chuyển trạng thái">Đã đóng (Closed)</span>;
      default: return null;
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
        <div style={{ color: 'var(--text-muted)' }}>Đang tải danh sách bảng hỏi...</div>
      </div>
    );
  }

  return (
    <div>
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'success' })} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Bảng hỏi khảo sát</h1>
          <p style={{ color: 'var(--text-muted)' }}>Quản lý bộ câu hỏi, thiết kế thang đo Likert và khai báo giả thuyết SEM</p>
        </div>
        {currentUser?.role !== 'viewer' && (
          <button className="btn btn-primary" onClick={handleOpenCreate}>
            <Plus size={18} />
            Tạo mới
          </button>
        )}
      </div>

      {surveys.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <FileSpreadsheet size={28} />
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>Chưa có bảng hỏi nào</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', maxWidth: '400px' }}>
            Hệ thống đang ở trạng thái sạch dữ liệu. Hãy tạo bảng hỏi khảo sát đầu tiên để bắt đầu nghiên cứu!
          </p>
          {currentUser?.role !== 'viewer' && (
            <button className="btn btn-primary" onClick={handleOpenCreate}>
              <Plus size={18} />
              Tạo khảo sát ngay
            </button>
          )}
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-container">
            <table className="table">
              <thead style={{ backgroundColor: '#F9FAFB' }}>
                <tr>
                  <th>Tiêu đề &amp; Cấu trúc</th>
                  <th>Trạng thái (Click đổi)</th>
                  <th>Thang đo</th>
                  <th>Phản hồi / Mục tiêu</th>
                  <th>Biến nghiên cứu</th>
                  <th>Ngày tạo</th>
                  <th style={{ textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {surveys.map((survey) => (
                  <tr key={survey.id}>
                    <td>
                      <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>{survey.title}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <span>{survey.questions_count} câu hỏi</span>
                        <span>•</span>
                        <span>{(survey.hypotheses || []).length} giả thuyết</span>
                      </div>
                    </td>
                    <td>
                      <button 
                        onClick={() => handleToggleStatus(survey)}
                        style={{ background: 'none', border: 'none', padding: 0, cursor: currentUser?.role !== 'viewer' ? 'pointer' : 'default' }}
                      >
                        {getStatusBadge(survey.status)}
                      </button>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.75rem', backgroundColor: '#EFF6FF', color: '#3B82F6', padding: '0.25rem 0.5rem', borderRadius: '4px', fontWeight: '500' }}>
                        {survey.scale}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: '500', marginBottom: '0.5rem' }}>
                        {survey.responses_count} / {survey.target}
                      </div>
                      <div style={{ width: '100px', height: '4px', backgroundColor: 'var(--bg-surface-hover)', borderRadius: '2px', overflow: 'hidden' }}>
                        <div 
                          style={{ 
                            width: `${Math.min(100, (survey.responses_count / (survey.target || 1)) * 100)}%`, 
                            height: '100%', 
                            backgroundColor: survey.responses_count >= survey.target ? 'var(--secondary)' : 'var(--primary)', 
                            borderRadius: '2px' 
                          }}
                        ></div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                        {Array.isArray(survey.variables) && survey.variables.map(v => (
                          <span key={v} style={{ fontSize: '0.7rem', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '0.125rem 0.375rem', color: 'var(--text-muted)', backgroundColor: '#F9FAFB' }}>
                            {v}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{survey.created_at}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                        {/* NÚT THIẾT KẾ CÂU HỎI & GIẢ THUYẾT */}
                        <button 
                          className="btn-outline" 
                          style={{ padding: '0.375rem', borderRadius: 'var(--radius-md)', color: 'var(--primary)', backgroundColor: '#EEF2FF', borderColor: '#C7D2FE' }} 
                          title="Thiết kế câu hỏi & Khai báo giả thuyết"
                          onClick={() => handleOpenQuestionBuilder(survey)}
                        >
                          <ListPlus size={16} />
                        </button>

                        {/* NÚT MÃ QR CODE */}
                        <button 
                          className="btn-outline" 
                          style={{ padding: '0.375rem', borderRadius: 'var(--radius-md)', color: '#0284C7', backgroundColor: '#F0F9FF', borderColor: '#BAE6FD' }} 
                          title="Tạo mã QR Code để quét điện thoại"
                          onClick={() => handleOpenQRModal(survey)}
                        >
                          <QrCode size={16} />
                        </button>

                        {/* NÚT XEM TRƯỚC (PREVIEW) */}
                        <button 
                          className="btn-outline" 
                          style={{ padding: '0.375rem', borderRadius: 'var(--radius-md)', color: '#059669', backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }} 
                          title="Xem trước biểu mẫu khảo sát (Preview)"
                          onClick={() => handlePreviewSurvey(survey.id)}
                        >
                          <Eye size={16} />
                        </button>

                        {/* NÚT NHÂN BẢN (CLONE) 1-CLICK */}
                        {currentUser?.role !== 'viewer' && (
                          <button 
                            className="btn-outline" 
                            style={{ padding: '0.375rem', borderRadius: 'var(--radius-md)', color: '#D97706', backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }} 
                            title="Nhân bản bảng hỏi (Clone / Duplicate)"
                            onClick={() => handleCloneSurvey(survey)}
                          >
                            <Copy size={16} />
                          </button>
                        )}

                        {currentUser?.role !== 'viewer' && (
                          <button 
                            className="btn-outline" 
                            style={{ padding: '0.375rem', borderRadius: 'var(--radius-md)', color: 'var(--text-muted)' }} 
                            title="Chỉnh sửa thông tin"
                            onClick={() => handleOpenEdit(survey)}
                          >
                            <Edit size={16} />
                          </button>
                        )}
                        <button 
                          className="btn-outline" 
                          style={{ padding: '0.375rem', borderRadius: 'var(--radius-md)', color: 'var(--primary)' }} 
                          title="Chia sẻ link khảo sát"
                          onClick={() => handleShare(survey)}
                        >
                          <Share2 size={16} />
                        </button>
                        <button 
                          className="btn-outline" 
                          style={{ padding: '0.375rem', borderRadius: 'var(--radius-md)', color: '#8B5CF6' }} 
                          title="Phân tích dữ liệu"
                          onClick={() => handleAnalyze(survey)}
                        >
                          <BarChart2 size={16} />
                        </button>
                        {currentUser?.role !== 'viewer' && (
                          <button 
                            className="btn-outline" 
                            style={{ padding: '0.375rem', borderRadius: 'var(--radius-md)', color: 'var(--danger)' }} 
                            title="Xóa khảo sát"
                            onClick={() => setDeleteConfirmId(survey.id)}
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL THIẾT KẾ BỘ CÂU HỎI & KHAI BÁO GIẢ THUYẾT NGHIÊN CỨU */}
      {isQuestionBuilderOpen && selectedSurvey && (
        <div className="modal-backdrop" onClick={() => setIsQuestionBuilderOpen(false)}>
          <div className="modal-content" style={{ maxWidth: '780px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2 className="modal-title">Thiết kế bộ câu hỏi: {selectedSurvey.title}</h2>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  Thang đo: {selectedSurvey.scale} • Tổng số: {currentQuestions.length} câu hỏi • {currentHypotheses.length} giả thuyết
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setIsQuestionBuilderOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', backgroundColor: '#F9FAFB', padding: '0 1.5rem' }}>
              <button
                onClick={() => setBuilderTab('questions')}
                style={{
                  padding: '0.75rem 1.25rem',
                  fontWeight: builderTab === 'questions' ? '700' : '500',
                  color: builderTab === 'questions' ? 'var(--primary)' : 'var(--text-muted)',
                  borderBottom: builderTab === 'questions' ? '2px solid var(--primary)' : '2px solid transparent',
                  background: 'none'
                }}
              >
                1. Bộ câu hỏi nghiên cứu ({currentQuestions.length})
              </button>
              <button
                onClick={() => setBuilderTab('hypotheses')}
                style={{
                  padding: '0.75rem 1.25rem',
                  fontWeight: builderTab === 'hypotheses' ? '700' : '500',
                  color: builderTab === 'hypotheses' ? 'var(--primary)' : 'var(--text-muted)',
                  borderBottom: builderTab === 'hypotheses' ? '2px solid var(--primary)' : '2px solid transparent',
                  background: 'none'
                }}
              >
                2. Khai báo Giả thuyết SEM ({currentHypotheses.length})
              </button>
            </div>

            <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              {builderTab === 'questions' ? (
                <div>
                  {/* TÍNH NĂNG TẠO CÂU HỎI MẪU NHANH THEO BIẾN & ĐỊNH TÍNH */}
                  <div style={{ padding: '1rem', backgroundColor: '#EFF6FF', borderRadius: 'var(--radius-md)', border: '1px solid #BFDBFE', marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <Sparkles size={18} color="#2563EB" />
                      <span style={{ fontWeight: '700', fontSize: '0.875rem', color: '#1E40AF' }}>
                        Khởi tạo câu hỏi mẫu nhanh (1-Click Generator):
                      </span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#1E40AF', marginBottom: '0.75rem' }}>
                      Bấm vào từng loại dưới đây để tự động chèn các câu hỏi đo lường chuẩn hóa hoặc câu hỏi định tính mở:
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {['SP', 'LD', 'DX', 'AT'].map(v => (
                        <button
                          key={v}
                          type="button"
                          className="btn"
                          style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem', backgroundColor: 'white', color: '#1E40AF', border: '1px solid #93C5FD' }}
                          onClick={() => handleGenerateSampleQuestions(v)}
                        >
                          + 4 câu Likert cho <strong>{v}</strong>
                        </button>
                      ))}
                      <button
                        type="button"
                        className="btn"
                        style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem', backgroundColor: '#FEF3C7', color: '#92400E', border: '1px solid #FCD34D', fontWeight: '600' }}
                        onClick={handleAddQualitativeQuestions}
                      >
                        + Thêm 2 câu hỏi định tính mở (Rào cản &amp; Đề xuất)
                      </button>
                    </div>
                  </div>

                  {/* FORM THÊM CÂU HỎI TÙY CHỈNH */}
                  <div style={{ padding: '1rem', backgroundColor: '#F9FAFB', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', marginBottom: '1.25rem' }}>
                    <span style={{ fontWeight: '600', fontSize: '0.85rem', display: 'block', marginBottom: '0.75rem' }}>
                      Thêm câu hỏi tùy chỉnh mới (Hỗ trợ đa dạng loại câu hỏi):
                    </span>
                    <div style={{ display: 'grid', gridTemplateColumns: '110px 140px 100px 1fr auto', gap: '0.5rem', alignItems: 'center' }}>
                      <select 
                        className="input" 
                        value={newQuestionVar}
                        onChange={(e) => setNewQuestionVar(e.target.value)}
                        title="Thuộc biến nghiên cứu"
                      >
                        {['SP', 'LD', 'DX', 'AT', 'QUALITATIVE', 'KHAC'].map(v => <option key={v} value={v}>{v}</option>)}
                      </select>

                      <select
                        className="input"
                        value={newQuestionType}
                        onChange={(e) => setNewQuestionType(e.target.value)}
                        title="Loại câu hỏi"
                      >
                        <option value="likert">Thang đo Likert</option>
                        <option value="textarea">Tự luận (Văn bản)</option>
                        <option value="text">Câu trả lời ngắn</option>
                        <option value="choice">Một lựa chọn</option>
                      </select>

                      <input 
                        type="text" 
                        className="input" 
                        placeholder="Mã (SP5/TXT)" 
                        value={newQuestionCode}
                        onChange={(e) => setNewQuestionCode(e.target.value)}
                      />

                      <input 
                        type="text" 
                        className="input" 
                        placeholder={newQuestionType === 'textarea' ? 'VD: Ý kiến nhận xét, đề xuất của bạn...' : 'Nội dung câu hỏi khảo sát...'} 
                        value={newQuestionText}
                        onChange={(e) => setNewQuestionText(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCustomQuestion(); } }}
                      />

                      <button 
                        type="button" 
                        className="btn btn-primary"
                        onClick={handleAddCustomQuestion}
                      >
                        Thêm
                      </button>
                    </div>
                  </div>

                  {/* DANH SÁCH CÂU HỎI HIỆN TẠI */}
                  <div>
                    <span style={{ fontWeight: '700', fontSize: '0.9rem', marginBottom: '0.75rem', display: 'block' }}>
                      Danh sách câu hỏi trong bảng ({currentQuestions.length} câu):
                    </span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {currentQuestions.map((q, idx) => {
                        const isText = q.type === 'textarea' || q.type === 'text';
                        const typeLabel = q.type === 'textarea' ? 'Tự luận' : (q.type === 'text' ? 'Text ngắn' : (q.type === 'choice' ? 'Trắc nghiệm' : 'Likert'));
                        const typeBadgeStyle = isText
                          ? { backgroundColor: '#FEF3C7', color: '#92400E', border: '1px solid #FDE68A' }
                          : (q.type === 'choice' ? { backgroundColor: '#F3E8FF', color: '#6B21A8' } : { backgroundColor: '#EEF2FF', color: '#3730A3' });

                        return (
                          <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', backgroundColor: 'white', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                              <span style={{ fontWeight: '700', fontSize: '0.8rem', padding: '0.2rem 0.5rem', backgroundColor: '#EEF2FF', color: 'var(--primary)', borderRadius: '4px', minWidth: '50px', textAlign: 'center' }}>
                                {q.code}
                              </span>
                              <span style={{ fontSize: '0.75rem', fontWeight: '600', padding: '0.15rem 0.5rem', borderRadius: '4px', ...typeBadgeStyle }}>
                                {typeLabel}
                              </span>
                              {q.variable && (
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', border: '1px solid var(--border-color)', padding: '0.1rem 0.4rem', borderRadius: '4px', backgroundColor: '#F9FAFB' }}>
                                  {q.variable}
                                </span>
                              )}
                              <span style={{ fontSize: '0.875rem', color: 'var(--text-main)', flex: 1 }}>{q.text}</span>
                            </div>
                            <button 
                              type="button" 
                              style={{ color: 'var(--danger)', padding: '0.25rem', background: 'none' }}
                              onClick={() => handleDeleteQuestion(idx)}
                              title="Xóa câu hỏi này"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                /* TAB GIẢ THUYẾT NGHIÊN CỨU */
                <div>
                  <div style={{ padding: '1rem', backgroundColor: '#F0FDF4', borderRadius: 'var(--radius-md)', border: '1px solid #BBF7D0', marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <CheckCircle size={18} color="#16A34A" />
                      <span style={{ fontWeight: '700', fontSize: '0.875rem', color: '#15803D' }}>
                        Khai báo giả thuyết nghiên cứu (Mô hình SEM):
                      </span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#15803D', marginBottom: '0.75rem' }}>
                      Các giả thuyết này sẽ được sử dụng trực tiếp trong tab Kiểm định giả thuyết (Phân tích hồi quy &amp; PLS-SEM):
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button 
                        type="button" 
                        className="btn" 
                        style={{ fontSize: '0.75rem', backgroundColor: 'white', color: '#15803D', border: '1px solid #86EFAC' }}
                        onClick={() => handleAddHypothesis('SP', 'AT')}
                      >
                        + Khai báo H: SP ➔ AT
                      </button>
                      <button 
                        type="button" 
                        className="btn" 
                        style={{ fontSize: '0.75rem', backgroundColor: 'white', color: '#15803D', border: '1px solid #86EFAC' }}
                        onClick={() => handleAddHypothesis('LD', 'AT')}
                      >
                        + Khai báo H: LD ➔ AT
                      </button>
                      <button 
                        type="button" 
                        className="btn" 
                        style={{ fontSize: '0.75rem', backgroundColor: 'white', color: '#15803D', border: '1px solid #86EFAC' }}
                        onClick={() => handleAddHypothesis('DX', 'AT')}
                      >
                        + Khai báo H: DX ➔ AT
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {currentHypotheses.map((h, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', backgroundColor: 'white', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                            <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>{h.code}:</span>
                            <span style={{ fontWeight: '600' }}>{h.name}</span>
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{h.description}</div>
                        </div>
                        <button 
                          type="button" 
                          style={{ color: 'var(--danger)', padding: '0.25rem', background: 'none' }}
                          onClick={() => setCurrentHypotheses(currentHypotheses.filter((_, i) => i !== idx))}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-outline" onClick={() => setIsQuestionBuilderOpen(false)}>
                Đóng
              </button>
              <button type="button" className="btn btn-primary" onClick={handleSaveQuestionBuilder}>
                Lưu cấu hình câu hỏi &amp; giả thuyết
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tạo mới */}
      {isCreateOpen && (
        <div className="modal-backdrop" onClick={() => setIsCreateOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Tạo bảng hỏi khảo sát mới</h2>
              <button className="modal-close-btn" onClick={() => setIsCreateOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Tiêu đề khảo sát *</label>
                  <input 
                    type="text" 
                    className="input" 
                    placeholder="VD: Khảo sát chuyển đổi số trong giáo dục đại học" 
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Thang đo đo lường</label>
                    <select 
                      className="input"
                      value={formData.scale}
                      onChange={(e) => setFormData({ ...formData, scale: e.target.value })}
                    >
                      <option value="Likert 5">Likert 5 mức độ</option>
                      <option value="Likert 7">Likert 7 mức độ</option>
                      <option value="Nhị phân">Nhị phân (Đúng/Sai)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Mục tiêu số mẫu (N)</label>
                    <input 
                      type="number" 
                      className="input" 
                      value={formData.target}
                      onChange={(e) => setFormData({ ...formData, target: parseInt(e.target.value) || 100 })}
                      min="10"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Trạng thái khởi tạo</label>
                  <select 
                    className="input"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="Active">Đang mở (Active)</option>
                    <option value="Draft">Bản nháp (Draft)</option>
                    <option value="Closed">Đã đóng (Closed)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Các biến nghiên cứu (phân cách dấu phẩy)</label>
                  <input 
                    type="text" 
                    className="input" 
                    placeholder="VD: SP, LD, DX, AT" 
                    value={formData.variables}
                    onChange={(e) => setFormData({ ...formData, variables: e.target.value })}
                  />
                  <span className="form-hint">Hệ thống sẽ tự động khởi tạo ngân hàng câu hỏi và các giả thuyết theo các biến này</span>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setIsCreateOpen(false)}>
                  Hủy bỏ
                </button>
                <button type="submit" className="btn btn-primary">
                  Tạo khảo sát
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Chỉnh sửa */}
      {isEditOpen && selectedSurvey && (
        <div className="modal-backdrop" onClick={() => setIsEditOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Chỉnh sửa bảng hỏi #{selectedSurvey.id}</h2>
              <button className="modal-close-btn" onClick={() => setIsEditOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Tiêu đề khảo sát *</label>
                  <input 
                    type="text" 
                    className="input" 
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Thang đo đo lường</label>
                    <select 
                      className="input"
                      value={formData.scale}
                      onChange={(e) => setFormData({ ...formData, scale: e.target.value })}
                    >
                      <option value="Likert 5">Likert 5 mức độ</option>
                      <option value="Likert 7">Likert 7 mức độ</option>
                      <option value="Nhị phân">Nhị phân (Đúng/Sai)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Mục tiêu số mẫu</label>
                    <input 
                      type="number" 
                      className="input" 
                      value={formData.target}
                      onChange={(e) => setFormData({ ...formData, target: parseInt(e.target.value) || 100 })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Trạng thái</label>
                  <select 
                    className="input"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="Active">Đang mở (Active)</option>
                    <option value="Draft">Bản nháp (Draft)</option>
                    <option value="Closed">Đã đóng (Closed)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Các biến nghiên cứu</label>
                  <input 
                    type="text" 
                    className="input" 
                    value={formData.variables}
                    onChange={(e) => setFormData({ ...formData, variables: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setIsEditOpen(false)}>
                  Hủy bỏ
                </button>
                <button type="submit" className="btn btn-primary">
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Xác nhận xóa */}
      {deleteConfirmId && (
        <div className="modal-backdrop" onClick={() => setDeleteConfirmId(null)}>
          <div className="modal-content" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-body" style={{ textAlign: 'center', paddingTop: '2rem' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#FEE2E2', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                <AlertTriangle size={24} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Xác nhận xóa bảng hỏi?</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                Hành động này sẽ xóa vĩnh viễn bảng hỏi cùng tất cả các dữ liệu phản hồi liên quan đã thu thập. Không thể hoàn tác!
              </p>
            </div>
            <div className="modal-footer" style={{ justifyContent: 'center' }}>
              <button className="btn btn-outline" onClick={() => setDeleteConfirmId(null)}>
                Hủy bỏ
              </button>
              <button 
                className="btn" 
                style={{ backgroundColor: '#EF4444', color: 'white' }}
                onClick={() => handleDelete(deleteConfirmId)}
              >
                Đồng ý xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Mã QR Code */}
      {qrModalSurvey && (
        <div className="modal-backdrop" onClick={() => setQrModalSurvey(null)}>
          <div className="modal-content" style={{ maxWidth: '440px', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Mã QR Khảo Sát #{qrModalSurvey.id}</h2>
              <button className="modal-close-btn" onClick={() => setQrModalSurvey(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 'bold', marginBottom: '0.25rem', color: 'var(--text-main)' }}>
                {qrModalSurvey.title}
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                Người tham gia chỉ cần mở Camera hoặc Zalo quét mã dưới đây để vào điền phiếu ngay lập tức:
              </p>

              {qrCodeDataUrl && (
                <div style={{ padding: '1rem', backgroundColor: 'white', borderRadius: '12px', border: '2px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', marginBottom: '1.25rem' }}>
                  <img src={qrCodeDataUrl} alt="Mã QR Khảo sát" style={{ width: '220px', height: '220px', display: 'block' }} />
                </div>
              )}

              <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '1rem' }}>
                <input 
                  type="text" 
                  readOnly 
                  value={`${window.location.origin}/survey/${qrModalSurvey.id}`}
                  style={{ flex: 1, background: 'none', border: 'none', fontSize: '0.75rem', color: 'var(--text-main)', outline: 'none' }}
                />
                <button 
                  type="button" 
                  className="btn" 
                  style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem', backgroundColor: copiedLink ? '#10B981' : 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                  onClick={() => handleCopySurveyLink(qrModalSurvey.id)}
                >
                  {copiedLink ? <Check size={14} /> : <Copy size={14} />}
                  {copiedLink ? 'Đã chép' : 'Sao chép'}
                </button>
              </div>
            </div>
            <div className="modal-footer" style={{ justifyContent: 'center', gap: '1rem' }}>
              <button type="button" className="btn btn-outline" onClick={() => setQrModalSurvey(null)}>
                Đóng
              </button>
              <button type="button" className="btn btn-primary" onClick={handleDownloadQR}>
                <Download size={16} /> Tải ảnh QR (.png)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Surveys;
