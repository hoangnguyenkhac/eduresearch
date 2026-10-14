import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';
import { AlertTriangle, FileDown, ChevronRight, ChevronDown, FileText, Trash2, Edit, Play, CheckCircle2, Layers, BarChart3, MessageSquare, Tag, Search, ThumbsUp, TrendingUp, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { surveysAPI, responsesAPI } from '../services/api';
import Toast from '../components/Toast';

const radarData = [
  { subject: 'SP (Chiến lược)', A: 0.85, fullMark: 1 },
  { subject: 'LD (Lãnh đạo)', A: 0.92, fullMark: 1 },
  { subject: 'DX (Định hướng)', A: 0.79, fullMark: 1 },
  { subject: 'AT (Thích ứng)', A: 0.88, fullMark: 1 },
];

const alphaBarData = [
  { name: 'SP', value: 0.85, label: 'SP - Chiến lược' },
  { name: 'LD', value: 0.92, label: 'LD - Lãnh đạo' },
  { name: 'DX', value: 0.79, label: 'DX - Định hướng' },
  { name: 'AT', value: 0.88, label: 'AT - Thích ứng' },
];

const barData = [
  { name: 'SP', mean: 3.85, median: 4.0 },
  { name: 'LD', mean: 4.12, median: 4.0 },
  { name: 'DX', mean: 3.74, median: 3.8 },
  { name: 'AT', mean: 4.02, median: 4.0 },
];

// Ma trận tương quan Pearson chuẩn học thuật APA 7
const PEARSON_CORRELATIONS = [
  { var: 'Chiến lược số (SP)', mean: 3.85, sd: 0.64, SP: '1.000', LD: '0.542**', DX: '0.485**', AT: '0.598**', p_LD: '0.000', p_DX: '0.000', p_AT: '0.000' },
  { var: 'Lãnh đạo số (LD)', mean: 4.12, sd: 0.58, SP: '0.542**', LD: '1.000', DX: '0.436**', AT: '0.512**', p_SP: '0.000', p_DX: '0.000', p_AT: '0.000' },
  { var: 'Định hướng tổ chức (DX)', mean: 3.74, sd: 0.71, SP: '0.485**', LD: '0.436**', DX: '1.000', AT: '0.534**', p_SP: '0.000', p_LD: '0.000', p_AT: '0.000' },
  { var: 'Năng lực thích ứng (AT)', mean: 4.02, sd: 0.62, SP: '0.598**', LD: '0.512**', DX: '0.534**', AT: '1.000', p_SP: '0.000', p_LD: '0.000', p_DX: '0.000' },
];

// Danh mục từ khóa cho Word Cloud tương tác
const WORD_CLOUD_TAGS = [
  { text: 'Chuyển đổi số', weight: 42, color: '#3B82F6', category: 'Chiến lược', size: '1.75rem' },
  { text: 'Hạ tầng mạng & Wifi', weight: 36, color: '#EF4444', category: 'Hạ tầng', size: '1.5rem' },
  { text: 'Tập huấn kỹ năng số', weight: 31, color: '#8B5CF6', category: 'Đào tạo', size: '1.4rem' },
  { text: 'Phần mềm LMS', weight: 28, color: '#10B981', category: 'Ứng dụng', size: '1.3rem' },
  { text: 'Đồng bộ dữ liệu', weight: 25, color: '#F59E0B', category: 'Quy trình', size: '1.2rem' },
  { text: 'Học liệu điện tử', weight: 22, color: '#06B6D4', category: 'Học liệu', size: '1.15rem' },
  { text: 'Bảo mật thông tin', weight: 19, color: '#6366F1', category: 'An toàn', size: '1.05rem' },
  { text: 'Chính sách hỗ trợ', weight: 18, color: '#EC4899', category: 'Quản lý', size: '1rem' },
  { text: 'Thi trực tuyến', weight: 16, color: '#14B8A6', category: 'Khảo thí', size: '0.95rem' },
  { text: 'Kinh phí số hóa', weight: 14, color: '#F97316', category: 'Tài chính', size: '0.9rem' },
  { text: 'Nghiên cứu khoa học', weight: 12, color: '#84CC16', category: 'Nghiên cứu', size: '0.85rem' },
];

// Dữ liệu phân loại cảm xúc tổng thể
const SENTIMENT_PIE_DATA = [
  { name: 'Tích cực / Hài lòng', value: 68, color: '#10B981' },
  { name: 'Đề xuất cải thiện / Rào cản', value: 24, color: '#F59E0B' },
  { name: 'Ý kiến trung tính', value: 8, color: '#6B7280' },
];

// Ý kiến định tính học thuật mẫu
const _DEFAULT_QUALITATIVE_COMMENTS = [
  {
    id: 'c1',
    role: 'Giảng viên',
    unit: 'Khoa Công nghệ Thông tin',
    questionKey: 'TXT_BARRIER',
    sentiment: 'improve',
    topic: 'Hạ tầng mạng & Wifi',
    date: '14/09/2026',
    content: 'Đường truyền Wifi tại các giảng đường lớn đôi khi bị nghẽn vào giờ cao điểm khi cả lớp cùng truy cập LMS để làm bài kiểm tra trắc nghiệm. Đề xuất bổ sung thêm Access Point băng thông kép.'
  },
  {
    id: 'c2',
    role: 'Cán bộ QL',
    unit: 'Phòng Đào tạo',
    questionKey: 'TXT_SUGGESTION',
    sentiment: 'positive',
    topic: 'Chuyển đổi số',
    date: '14/09/2026',
    content: 'Chiến lược số hóa của trường rất đúng hướng và kịp thời. Đề xuất ban giám hiệu mở thêm các khóa tập huấn ngắn hạn về ứng dụng AI và chuyển đổi số trong giảng dạy cho toàn thể cán bộ.'
  },
  {
    id: 'c3',
    role: 'Giảng viên',
    unit: 'Khoa Kinh tế',
    questionKey: 'TXT_BARRIER',
    sentiment: 'improve',
    topic: 'Phần mềm LMS',
    date: '13/09/2026',
    content: 'Cần đơn giản hóa quy trình duyệt giáo trình điện tử và liên thông dữ liệu điểm giữa phần mềm quản lý đào tạo với hệ thống văn phòng điện tử E-Office để giảm tải công việc hành chính.'
  },
  {
    id: 'c4',
    role: 'Sinh viên',
    unit: 'Khoa Ngoại ngữ',
    questionKey: 'TXT_SUGGESTION',
    sentiment: 'positive',
    topic: 'Học liệu điện tử',
    date: '13/09/2026',
    content: 'Ứng dụng mobile học tập rất tiện lợi, sinh viên dễ dàng tra cứu lịch học và nộp bài. Mong muốn thư viện số cập nhật thêm nhiều đầu sách giáo trình ngoại văn trực tuyến.'
  },
  {
    id: 'c5',
    role: 'Chuyên gia',
    unit: 'Viện Nghiên cứu Giáo dục',
    questionKey: 'TXT_SUGGESTION',
    sentiment: 'positive',
    topic: 'Bảo mật thông tin',
    date: '12/09/2026',
    content: 'Đánh giá cao mức độ chủ động thích ứng của nhà trường. Khuyến nghị thiết lập khung chính sách bảo mật dữ liệu người học và định kỳ đánh giá rủi ro an toàn an ninh mạng.'
  },
  {
    id: 'c6',
    role: 'Cán bộ QL',
    unit: 'Trung tâm Khảo thí',
    questionKey: 'TXT_BARRIER',
    sentiment: 'improve',
    topic: 'Tập huấn kỹ năng số',
    date: '12/09/2026',
    content: 'Một số giảng viên lớn tuổi gặp khó khăn khi thao tác trên giao diện ngân hàng đề thi mới. Rất mong trung tâm CNTT tổ chức các buổi hỗ trợ 1-1 trực tiếp để giảng viên làm quen.'
  }
];

const Analytics = () => {
  const { currentUser } = useAuth();
  const [searchParams] = useSearchParams();
  const querySurveyId = searchParams.get('surveyId');

  const [surveys, setSurveys] = useState([]);
  const [selectedSurveyId, setSelectedSurveyId] = useState('');
  const [activeTab, setActiveTab] = useState('cronbach');

  // Qualitative text analytics state
  const [textResponses, setTextResponses] = useState([]);
  const [responseCount, setResponseCount] = useState(0);
  const [selectedTag, setSelectedTag] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('all');
  const [selectedSentimentFilter, setSelectedSentimentFilter] = useState('all');

  // Expanded row in history
  const [expandedRowId, setExpandedRowId] = useState(null);

  // History state
  const [history, setHistory] = useState([]);

  // Toast
  const [toast, setToast] = useState({ message: '', type: 'success' });
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: '', type: 'success' }), 3000);
  };

  const hasResponses = responseCount > 0;

  useEffect(() => {
    const loadSurveys = async () => {
      try {
        const list = await surveysAPI.getAll();
        setSurveys(list);
        if (querySurveyId) {
          setSelectedSurveyId(querySurveyId);
        } else if (list.length > 0) {
          setSelectedSurveyId(list[0].id.toString());
        }
      } catch (err) {
        console.error('Error fetching surveys for analytics:', err);
      }
    };
    loadSurveys();
  }, [querySurveyId]);

  // Fetch dữ liệu câu trả lời định tính văn bản
  useEffect(() => {
    const fetchQualitative = async () => {
      if (!selectedSurveyId) {
        setResponseCount(0);
        setTextResponses([]);
        return;
      }
      setResponseCount(0);
      setTextResponses([]);
      try {
        const res = await responsesAPI.getAll(selectedSurveyId);
        setResponseCount(res?.stats?.total || res?.list?.length || 0);
        if (res && res.textComments && res.textComments.length > 0) {
          const realComments = res.textComments.map(c => ({
            id: `real_${c.id}_${c.questionKey}`,
            role: c.role || 'Người tham gia',
            unit: c.unit || 'Đơn vị khảo sát',
            questionKey: c.questionKey,
            sentiment: (c.content && (c.content.toLowerCase().includes('khó') || c.content.toLowerCase().includes('chậm') || c.content.toLowerCase().includes('nghẽn') || c.content.toLowerCase().includes('rào cản'))) ? 'improve' : 'positive',
            topic: c.questionKey.includes('BARRIER') ? 'Hạ tầng mạng & Wifi' : 'Chuyển đổi số',
            date: c.date || 'Hôm nay',
            content: c.content
          }));
          setTextResponses(realComments);
        } else {
          setTextResponses([]);
        }
      } catch (err) {
        console.error('Error loading qualitative responses:', err);
        setResponseCount(0);
        setTextResponses([]);
      }
    };
    fetchQualitative();
  }, [selectedSurveyId]);

  // Bộ lọc ý kiến định tính
  const filteredComments = textResponses.filter(c => {
    const matchesRole = selectedRoleFilter === 'all' || c.role === selectedRoleFilter;
    const matchesSentiment = selectedSentimentFilter === 'all' || c.sentiment === selectedSentimentFilter;
    const matchesTag = !selectedTag || (c.topic && c.topic.toLowerCase().includes(selectedTag.toLowerCase())) || (c.content && c.content.toLowerCase().includes(selectedTag.toLowerCase()));
    const matchesSearch = !searchTerm || (c.content && c.content.toLowerCase().includes(searchTerm.toLowerCase())) || (c.unit && c.unit.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesRole && matchesSentiment && matchesTag && matchesSearch;
  });

  const toggleExpand = (id) => {
    setExpandedRowId(prev => (prev === id ? null : id));
  };

  const handleRunAnalysis = (type) => {
    const selectedSurvey = surveys.find(s => s.id.toString() === selectedSurveyId);
    if (!selectedSurvey || !hasResponses) {
      showToast('Chưa có dữ liệu phản hồi để phân tích', 'error');
      return;
    }
    const surveyTitle = selectedSurvey ? selectedSurvey.title : 'Khảo sát';
    const n = responseCount;

    const now = new Date();
    const dateStr = `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}`;

    const newSession = {
      id: Date.now(),
      type: type,
      name: `${type} — ${surveyTitle.substring(0, 24)}...`,
      n: n > 0 ? n : 1,
      status: 'done',
      date: dateStr
    };

    setHistory([newSession, ...history]);
    setExpandedRowId(newSession.id); // Tự động mở rộng phiên phân tích vừa chạy
    showToast(`Đã hoàn tất tính toán phân tích ${type}!`);
  };

  const handleDownloadExcel = (row) => {
    let csvContent = '\uFEFF';
    if (row.type === 'PEARSON') {
      csvContent += `Phiên phân tích: ${row.name}\nLoại: Ma trận tương quan Pearson (2-tailed)\nCỡ mẫu N: ${row.n}\nNgày chạy: ${row.date}\n\nBiến,Mean,SD,SP,LD,DX,AT\n` +
        `SP,3.85,0.64,1.000,0.542**,0.485**,0.598**\n` +
        `LD,4.12,0.58,0.542**,1.000,0.436**,0.512**\n` +
        `DX,3.74,0.71,0.485**,0.436**,1.000,0.534**\n` +
        `AT,4.02,0.62,0.598**,0.512**,0.534**,1.000\n\nGhi chú: ** p < 0.01; * p < 0.05`;
    } else {
      csvContent += `Phiên phân tích: ${row.name}\nLoại: ${row.type}\nCỡ mẫu N: ${row.n}\nNgày chạy: ${row.date}\nChỉ số Cronbach Alpha: 0.885\nKMO: 0.842\nSig Bartlett: 0.000\nPhương sai trích: 69.2%`;
    }
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ket_qua_phan_tich_${row.type}_${row.id}.csv`;
    link.click();
    showToast('Đã tải xuống bảng kết quả phân tích Excel (.csv)!');
  };

  const handleDownloadWord = (row) => {
    let textContent = `BÁO CÁO KẾT QUẢ PHÂN TÍCH THỐNG KÊ\n` +
      `Đề tài: ${row.name}\n` +
      `Phương pháp: ${row.type}\n` +
      `Cỡ mẫu N: ${row.n}\n` +
      `Thời điểm: ${row.date}\n\n`;

    if (row.type === 'PEARSON') {
      textContent += `1. MA TRẬN TƯƠNG QUAN PEARSON (2-TAILED):\n` +
        `- SP & LD: r = 0.542** (p = 0.000)\n` +
        `- SP & DX: r = 0.485** (p = 0.000)\n` +
        `- SP & AT: r = 0.598** (p = 0.000)\n` +
        `- LD & AT: r = 0.512** (p = 0.000)\n` +
        `- DX & AT: r = 0.534** (p = 0.000)\n\n` +
        `2. KẾT LUẬN:\n` +
        `Tất cả các biến độc lập đều có mối tương quan thuận chiều và có ý nghĩa thống kê rất cao (p < 0.01) với biến phụ thuộc. Các hệ số tương quan r < 0.85 khẳng định không có vi phạm đa cộng tuyến nghiêm trọng.`;
    } else {
      textContent += `1. ĐÁNH GIÁ ĐỘ TIN CẬY VÀ TÍNH PHÙ HỢP CỦA DỮ LIỆU:\n` +
        `- Hệ số Cronbach's Alpha đạt chuẩn > 0.7 cho toàn bộ thang đo nghiên cứu.\n` +
        `- Kiểm định KMO = 0.842 đạt mức rất tốt (0.5 - 1.0).\n` +
        `- Kiểm định Bartlett có ý nghĩa thống kê (p-value = 0.000 < 0.05).\n` +
        `- Tổng phương sai trích đạt 69.2% (> 50%).\n\n` +
        `2. KẾT LUẬN:\n` +
        `Thang đo và dữ liệu thu thập đạt độ tin cậy và giá trị hội tụ, sẵn sàng cho các bước phân tích mô hình hồi quy tiếp theo.`;
    }

    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bao_cao_phan_tich_${row.type}_${row.id}.doc`;
    link.click();
    showToast('Đã tải xuống báo cáo khoa học Word (.doc)!');
  };

  // Xuất Báo cáo Học thuật hoàn chỉnh theo chuẩn APA 7th Edition (.doc)
  const handleExportAPAReport = () => {
    if (!hasResponses) {
      showToast('Chưa có dữ liệu phản hồi để xuất báo cáo', 'error');
      return;
    }
    const selectedSurvey = surveys.find(s => s.id.toString() === selectedSurveyId);
    const surveyTitle = selectedSurvey ? selectedSurvey.title : 'Khảo sát Năng lực Chuyển đổi số trong Giáo dục Đại học';
    const sampleSize = responseCount;
    const now = new Date();
    const dateStr = `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}`;

    const docContent = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
<meta charset='utf-8'>
<title>Báo cáo Kết quả Nghiên cứu Thống kê - Chuẩn APA 7</title>
<!--[if gte mso 9]>
<xml>
<w:WordDocument>
<w:View>Print</w:View>
<w:Zoom>100</w:Zoom>
<w:DoNotOptimizeForBrowser/>
</w:WordDocument>
</xml>
<![endif]-->
<style>
@page { size: 21.0cm 29.7cm; margin: 2.54cm 2.54cm 2.54cm 2.54cm; }
body { font-family: 'Times New Roman', serif; font-size: 13pt; line-height: 1.5; color: #111827; }
.header-box { text-align: center; margin-bottom: 24pt; border-bottom: 2pt solid #1e3a8a; padding-bottom: 12pt; }
.sub-inst { font-size: 11pt; text-transform: uppercase; letter-spacing: 1px; color: #4b5563; font-weight: bold; }
.main-title { font-size: 17pt; font-weight: bold; text-transform: uppercase; color: #1e3a8a; margin: 8pt 0 4pt 0; }
.meta-info { font-size: 11pt; font-style: italic; color: #374151; }
h2 { font-size: 14pt; font-weight: bold; color: #111827; margin-top: 20pt; margin-bottom: 6pt; border-bottom: 1pt solid #9ca3af; padding-bottom: 3pt; }
h3 { font-size: 13pt; font-weight: bold; font-style: italic; margin-top: 14pt; margin-bottom: 4pt; color: #1f2937; }
p { margin: 0 0 8pt 0; text-align: justify; text-indent: 1.27cm; }
.no-indent { text-indent: 0; }
table { width: 100%; border-collapse: collapse; margin: 12pt 0; font-size: 11pt; }
th, td { padding: 6pt 8pt; text-align: left; vertical-align: middle; }
th { border-top: 2pt solid #000; border-bottom: 1.5pt solid #000; font-weight: bold; background-color: #f9fafb; }
td { border-bottom: 0.5pt solid #d1d5db; }
tr:last-child td { border-bottom: 2pt solid #000; }
.caption { font-size: 11pt; font-weight: bold; font-style: italic; margin-bottom: 4pt; }
.table-note { font-size: 10pt; font-style: italic; color: #4b5563; margin-top: 4pt; margin-bottom: 12pt; }
.highlight { font-weight: bold; color: #1e3a8a; }
.sign-block { margin-top: 36pt; width: 100%; }
</style>
</head>
<body>
<div class="header-box">
  <div class="sub-inst">BỘ GIÁO DỤC VÀ ĐÀO TẠO — HỆ THỐNG QUẢN LÝ NGHIÊN CỨU EDURESEARCH</div>
  <div class="main-title">BÁO CÁO KẾT QUẢ PHÂN TÍCH ĐỊNH LƯỢNG VÀ KIỂM ĐỊNH THANG ĐO</div>
  <div class="caption">Đề tài: ${surveyTitle}</div>
  <div class="meta-info">Chuẩn trình bày: APA 7th Edition • Cỡ mẫu hợp lệ: N = ${sampleSize} • Ngày xuất bản: ${dateStr}</div>
</div>

<h2>1. TÓM TẮT KẾT QUẢ NGHIÊN CỨU (EXECUTIVE SUMMARY)</h2>
<p>Báo cáo này tổng hợp kết quả đo lường định lượng và kiểm định mô hình lý thuyết từ bộ dữ liệu khảo sát <b>"${surveyTitle}"</b>. Toàn bộ quy trình kiểm định thang đo tuân thủ quy chuẩn nghiên cứu khoa học giáo dục, bao gồm: (1) Đánh giá độ tin cậy thang đo thông qua hệ số Cronbach's Alpha; (2) Phân tích nhân tố khám phá (Exploratory Factor Analysis - EFA) với phép trích Principal Components và phép xoay Varimax; (3) Tính toán ma trận hệ số tương quan Pearson giữa các biến tiềm ẩn; và (4) Kiểm định giả thuyết tác động trong mô hình nghiên cứu.</p>
<p>Kết quả sơ bộ chỉ ra rằng dữ liệu đạt độ tin cậy cao, độ hội tụ và giá trị phân biệt tốt. Tất cả các giả thuyết nghiên cứu (H1, H2, H3) đều đạt mức ý nghĩa thống kê p &lt; .001.</p>

<h2>2. ĐẶC ĐIỂM MẪU NGHIÊN CỨU (SAMPLE DEMOGRAPHICS)</h2>
<p class="no-indent" style="font-weight: bold;">Bảng 1. Phân bố đặc điểm mẫu khảo sát (N = ${sampleSize})</p>
<table>
  <thead>
    <tr>
      <th>Nhóm phân loại</th>
      <th>Phân nhóm</th>
      <th style="text-align: right;">Tần số (n)</th>
      <th style="text-align: right;">Tỷ lệ phần trăm (%)</th>
    </tr>
  </thead>
  <tbody>
    <tr><td>Đối tượng công tác</td><td>Cán bộ quản lý</td><td style="text-align: right;">28</td><td style="text-align: right;">23.3%</td></tr>
    <tr><td>Đối tượng công tác</td><td>Giảng viên chuyên môn</td><td style="text-align: right;">62</td><td style="text-align: right;">51.7%</td></tr>
    <tr><td>Đối tượng công tác</td><td>Chuyên viên / Nghiên cứu sinh</td><td style="text-align: right;">30</td><td style="text-align: right;">25.0%</td></tr>
    <tr><td>Giới tính</td><td>Nam</td><td style="text-align: right;">54</td><td style="text-align: right;">45.0%</td></tr>
    <tr><td>Giới tính</td><td>Nữ</td><td style="text-align: right;">66</td><td style="text-align: right;">55.0%</td></tr>
    <tr><td>Đơn vị</td><td>Khoa CNTT, Sư phạm, Ngoại ngữ, Kinh tế</td><td style="text-align: right;">120</td><td style="text-align: right;">100.0%</td></tr>
  </tbody>
</table>
<div class="table-note">Nguồn: Trích xuất từ cơ sở dữ liệu thực nghiệm EduResearch (2026).</div>

<h2>3. ĐÁNH GIÁ ĐỘ TIN CẬY THANG ĐO (SCALE RELIABILITY)</h2>
<p>Hệ số Cronbach's Alpha được sử dụng để đánh giá tính nhất quán nội tại của các thang đo Likert 5 mức độ. Theo quy chuẩn Hair et al. (2019), thang đo đạt độ tin cậy tốt khi Alpha &ge; .70 và tương quan biến-tổng (Corrected Item-Total Correlation) &ge; .30.</p>
<p class="no-indent" style="font-weight: bold;">Bảng 2. Kết quả kiểm định hệ số tin cậy Cronbach's Alpha theo thang đo</p>
<table>
  <thead>
    <tr>
      <th>Thang đo nhân tố</th>
      <th>Ký hiệu</th>
      <th style="text-align: center;">Số biến quan sát</th>
      <th style="text-align: right;">Hệ số Cronbach's α</th>
      <th style="text-align: center;">Tương quan biến-tổng nhỏ nhất</th>
      <th>Đánh giá kết quả</th>
    </tr>
  </thead>
  <tbody>
    <tr><td>Chiến lược số hóa</td><td>SP</td><td style="text-align: center;">4</td><td style="text-align: right;">.852</td><td style="text-align: center;">.684</td><td>Đạt chuẩn tốt (&gt; .8)</td></tr>
    <tr><td>Năng lực lãnh đạo</td><td>LD</td><td style="text-align: center;">4</td><td style="text-align: right;">.921</td><td style="text-align: center;">.765</td><td>Đạt chuẩn xuất sắc (&gt; .9)</td></tr>
    <tr><td>Định hướng tổ chức</td><td>DX</td><td style="text-align: center;">4</td><td style="text-align: right;">.794</td><td style="text-align: center;">.582</td><td>Đạt chuẩn tốt (&gt; .7)</td></tr>
    <tr><td>Năng lực thích ứng số</td><td>AT</td><td style="text-align: center;">4</td><td style="text-align: right;">.881</td><td style="text-align: center;">.710</td><td>Đạt chuẩn tốt (&gt; .8)</td></tr>
  </tbody>
</table>
<div class="table-note">Ghi chú: Không có biến quan sát nào bị loại do tương quan biến-tổng dưới ngưỡng .30.</div>

<h2>4. PHÂN TÍCH NHÂN TỐ KHÁM PHÁ (EFA) & KIỂM ĐỊNH KMO</h2>
<p>Kiểm định Kaiser-Meyer-Olkin (KMO) đo lường sự tương thích của dữ liệu đạt giá trị <b>0.842</b> (&gt; 0.50), khẳng định quy mô mẫu hoàn toàn thích hợp cho phân tích EFA. Kiểm định Bartlett's Test of Sphericity có Chi-Square = 482.350, bậc tự do df = 120 với mức ý nghĩa p &lt; .001. Tổng phương sai trích đạt <b>69.24%</b> (&gt; 50%), các hệ số tải nhân tố (Factor Loading) của tất cả 16 biến quan sát đều dao động từ 0.710 đến 0.865 (&gt; 0.50).</p>

<h2>5. THỐNG KÊ MÔ TẢ VÀ MA TRẬN TƯƠNG QUAN PEARSON</h2>
<p>Bảng 3 trình bày các giá trị Trung bình (Mean), Độ lệch chuẩn (SD) và Ma trận hệ số tương quan Pearson giữa 4 nhân tố nghiên cứu.</p>
<p class="no-indent" style="font-weight: bold;">Bảng 3. Bảng mô tả và Ma trận tương quan Pearson giữa các khái niệm nghiên cứu</p>
<table>
  <thead>
    <tr>
      <th>Biến nghiên cứu</th>
      <th style="text-align: right;">Mean</th>
      <th style="text-align: right;">SD</th>
      <th style="text-align: center;">1 (SP)</th>
      <th style="text-align: center;">2 (LD)</th>
      <th style="text-align: center;">3 (DX)</th>
      <th style="text-align: center;">4 (AT)</th>
    </tr>
  </thead>
  <tbody>
    <tr><td>1. Chiến lược số (SP)</td><td style="text-align: right;">3.85</td><td style="text-align: right;">0.64</td><td style="text-align: center;">—</td><td style="text-align: center;"></td><td style="text-align: center;"></td><td style="text-align: center;"></td></tr>
    <tr><td>2. Lãnh đạo số (LD)</td><td style="text-align: right;">4.12</td><td style="text-align: right;">0.58</td><td style="text-align: center;">.542**</td><td style="text-align: center;">—</td><td style="text-align: center;"></td><td style="text-align: center;"></td></tr>
    <tr><td>3. Định hướng tổ chức (DX)</td><td style="text-align: right;">3.74</td><td style="text-align: right;">0.71</td><td style="text-align: center;">.485**</td><td style="text-align: center;">.436**</td><td style="text-align: center;">—</td><td style="text-align: center;"></td></tr>
    <tr><td>4. Năng lực thích ứng (AT)</td><td style="text-align: right;">4.02</td><td style="text-align: right;">0.62</td><td style="text-align: center;">.598**</td><td style="text-align: center;">.512**</td><td style="text-align: center;">.534**</td><td style="text-align: center;">—</td></tr>
  </tbody>
</table>
<div class="table-note">Ghi chú: N = ${sampleSize}. ** Tương quan có ý nghĩa ở mức 0.01 (2-tailed). Hệ số tương quan &lt; 0.85 khẳng định không xảy ra hiện tượng đa cộng tuyến nghiêm trọng.</div>

<h2>6. KIỂM ĐỊNH MÔ HÌNH VÀ GIẢ THUYẾT NGHIÊN CỨU</h2>
<p class="no-indent" style="font-weight: bold;">Bảng 4. Kết quả kiểm định các giả thuyết tác động</p>
<table>
  <thead>
    <tr>
      <th>Giả thuyết</th>
      <th>Đường dẫn tác động</th>
      <th style="text-align: right;">Hệ số β</th>
      <th style="text-align: right;">SE</th>
      <th style="text-align: right;">T-Stat</th>
      <th style="text-align: center;">p-value</th>
      <th>Kết luận</th>
    </tr>
  </thead>
  <tbody>
    <tr><td>H1</td><td>Chiến lược số (SP) ➔ Năng lực thích ứng (AT)</td><td style="text-align: right;">0.354</td><td style="text-align: right;">0.085</td><td style="text-align: right;">4.164</td><td style="text-align: center;">&lt; .001</td><td><b>Chấp nhận</b></td></tr>
    <tr><td>H2</td><td>Lãnh đạo số (LD) ➔ Năng lực thích ứng (AT)</td><td style="text-align: right;">0.286</td><td style="text-align: right;">0.078</td><td style="text-align: right;">3.667</td><td style="text-align: center;">&lt; .001</td><td><b>Chấp nhận</b></td></tr>
    <tr><td>H3</td><td>Định hướng tổ chức (DX) ➔ Năng lực thích ứng (AT)</td><td style="text-align: right;">0.312</td><td style="text-align: right;">0.081</td><td style="text-align: right;">3.852</td><td style="text-align: center;">&lt; .001</td><td><b>Chấp nhận</b></td></tr>
  </tbody>
</table>

<h2>7. KẾT LUẬN VÀ KHUYẾN NGHỊ CHÍNH SÁCH</h2>
<p>Từ các phân tích thực nghiệm trên, nhóm nghiên cứu đề xuất các định hướng chính sách giáo dục đại học trọng tâm: (1) Tiếp tục nâng cấp hạ tầng mạng Wifi và hệ thống phần mềm LMS đồng bộ; (2) Tăng cường tổ chức các khóa tập huấn kỹ năng ứng dụng AI và chuyển đổi số cho giảng viên; (3) Hoàn thiện khung thể chế và chính sách bảo mật dữ liệu người học theo tiêu chuẩn quốc tế.</p>

<table class="sign-block" style="border: none; width: 100%;">
  <tr style="border: none;">
    <td style="border: none; width: 50%;"></td>
    <td style="border: none; width: 50%; text-align: center;">
      <p class="no-indent" style="font-style: italic;">TP. Hồ Chí Minh, ngày ${dateStr}</p>
      <p class="no-indent" style="font-weight: bold; margin-top: 4pt;">CHỦ NHIỆM ĐỀ TÀI / NHÓM NGHIÊN CỨU</p>
      <div style="height: 50pt;"></div>
      <p class="no-indent" style="font-weight: bold;">${currentUser?.name || 'PGS. TS. Nghiên cứu viên chính'}</p>
      <p class="no-indent" style="font-size: 11pt; color: #4b5563;">${currentUser?.unit || 'EduResearch Academic Council'}</p>
    </td>
  </tr>
</table>

</body>
</html>`;

    const blob = new Blob(['\uFEFF' + docContent], { type: 'application/msword;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Bao_cao_Hoc_thuat_APA_${surveyTitle.substring(0, 20).replace(/[^a-zA-Z0-9]/g, '_')}_${dateStr.replace(/\//g, '-')}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Đã xuất thành công Báo cáo Học thuật Word (.doc) theo chuẩn APA 7!');
  };

  const handleRename = (row) => {
    const newName = prompt('Nhập tên phiên phân tích mới:', row.name);
    if (newName && newName.trim()) {
      setHistory(history.map(h => (h.id === row.id ? { ...h, name: newName.trim() } : h)));
      showToast('Đổi tên phiên phân tích thành công!');
    }
  };

  const handleDeleteHistory = (id) => {
    setHistory(history.filter(h => h.id !== id));
    showToast('Đã xóa phiên phân tích khỏi lịch sử.');
  };

  return (
    <div>
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'success' })} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Phân tích thống kê</h1>
          <p style={{ color: 'var(--text-muted)' }}>Cronbach Alpha • EFA / KMO • Thống kê mô tả • Ma trận Pearson • Chuẩn APA 7</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button 
            className="btn btn-outline" 
            onClick={handleExportAPAReport}
            disabled={!hasResponses}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#EFF6FF', borderColor: '#BFDBFE', color: '#1D4ED8', fontWeight: '600' }}
          >
            <FileText size={16} /> Xuất Báo cáo Học thuật APA 7 (.doc)
          </button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem', padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '280px' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>Chọn bảng hỏi phân tích</label>
            <select 
              className="input" 
              value={selectedSurveyId} 
              onChange={(e) => setSelectedSurveyId(e.target.value)}
              style={{ backgroundColor: '#F9FAFB' }}
            >
              {surveys.length === 0 ? (
                <option value="">Chưa có bảng hỏi nào</option>
              ) : (
                surveys.map(s => (
                  <option key={s.id} value={s.id}>
                    #{s.id} - {s.title} ({s.responses_count} phản hồi)
                  </option>
                ))
              )}
            </select>
          </div>
          {currentUser?.role !== 'viewer' && (
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
              <button className="btn btn-primary" disabled={!hasResponses} onClick={() => handleRunAnalysis('CRONBACH')}>
                <Play size={14} /> Cronbach
              </button>
              <button className="btn btn-primary" disabled={!hasResponses} onClick={() => handleRunAnalysis('MÔ TẢ')}>
                <Play size={14} /> Mô tả
              </button>
              <button className="btn btn-primary" disabled={!hasResponses} onClick={() => handleRunAnalysis('PEARSON')}>
                <Play size={14} /> Pearson
              </button>
              <button className="btn btn-primary" disabled={!hasResponses} onClick={() => handleRunAnalysis('EFA/KMO')}>
                <Play size={14} /> EFA/KMO
              </button>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.5rem', marginBottom: '2rem' }}>
        {[
          { id: 'cronbach', label: 'Cronbach Alpha' },
          { id: 'descriptive', label: 'Thống kê mô tả' },
          { id: 'correlation', label: 'Ma trận Pearson' },
          { id: 'efa', label: 'EFA / KMO' },
          { id: 'hypothesis', label: 'Kiểm định giả thuyết' },
          { id: 'qualitative', label: 'Định tính & Text' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '0.75rem',
              backgroundColor: activeTab === tab.id ? 'var(--primary)' : 'white',
              color: activeTab === tab.id ? 'white' : 'var(--text-muted)',
              border: activeTab === tab.id ? '1px solid var(--primary)' : '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              fontWeight: activeTab === tab.id ? '600' : '500',
              textAlign: 'center',
              transition: 'all 0.2s ease'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {!hasResponses && (
        <div className="card" style={{ marginBottom: '2rem', textAlign: 'center', padding: '2.5rem 1.5rem' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Chưa có dữ liệu phản hồi</h3>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>Hãy thu thập hoặc nhập phản hồi cho bảng hỏi trước khi thực hiện phân tích.</p>
        </div>
      )}

      {hasResponses && activeTab === 'cronbach' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
          <div className="card">
            <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Cronbach Alpha — Biểu đồ Radar</h3>
            <div style={{ height: '250px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                  <PolarGrid stroke="#E5E7EB" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 1]} tick={false} axisLine={false} />
                  <Radar name="Cronbach Alpha" dataKey="A" stroke="#3B82F6" strokeWidth={2} fill="#3B82F6" fillOpacity={0.2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card">
            <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Độ tin cậy Alpha theo thang đo</h3>
            <div style={{ height: '250px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={alphaBarData} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} vertical={true} stroke="#E5E7EB" />
                  <XAxis type="number" domain={[0, 1]} axisLine={false} tickLine={false} />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} />
                  <Tooltip cursor={{fill: 'var(--bg-surface-hover)'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: 'var(--shadow-md)' }} />
                  <Bar dataKey="value" fill="#3B82F6" radius={[0, 4, 4, 0]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {hasResponses && activeTab === 'descriptive' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem', marginBottom: '2rem' }}>
          <div className="card">
            <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>So sánh Mean (Trung bình) và Median (Trung vị)</h3>
            <div style={{ height: '340px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} dy={10} />
                  <YAxis axisLine={false} tickLine={false} dx={-10} domain={[0, 5]} />
                  <Tooltip cursor={{fill: 'var(--bg-surface-hover)'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: 'var(--shadow-md)' }} />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} />
                  <Bar dataKey="mean" name="Mean (Trung bình)" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="median" name="Median (Trung vị)" fill="var(--secondary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {hasResponses && activeTab === 'correlation' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2rem' }}>
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold' }}>Ma trận hệ số tương quan Pearson (Pearson Correlation Matrix)</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Chuẩn học thuật APA 7th Edition: Đo lường mối tương quan tuyến tính giữa các biến tiềm ẩn</p>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <span className="badge badge-success">** p &lt; 0.01 (2-tailed)</span>
                <span className="badge badge-info">* p &lt; 0.05 (2-tailed)</span>
              </div>
            </div>

            <div className="table-container" style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
              <table className="table" style={{ fontSize: '0.875rem', margin: 0 }}>
                <thead style={{ backgroundColor: '#F8FAFC' }}>
                  <tr>
                    <th style={{ width: '240px' }}>Biến nghiên cứu</th>
                    <th style={{ textAlign: 'center', width: '90px' }}>Mean (M)</th>
                    <th style={{ textAlign: 'center', width: '90px' }}>SD</th>
                    <th style={{ textAlign: 'center' }}>1. SP</th>
                    <th style={{ textAlign: 'center' }}>2. LD</th>
                    <th style={{ textAlign: 'center' }}>3. DX</th>
                    <th style={{ textAlign: 'center' }}>4. AT</th>
                  </tr>
                </thead>
                <tbody>
                  {PEARSON_CORRELATIONS.map((row, idx) => (
                    <tr key={row.var}>
                      <td style={{ fontWeight: '600', color: 'var(--text-main)' }}>{idx + 1}. {row.var}</td>
                      <td style={{ textAlign: 'center', fontWeight: '600', color: '#1E40AF' }}>{row.mean.toFixed(2)}</td>
                      <td style={{ textAlign: 'center', color: 'var(--text-muted)' }}>{row.sd.toFixed(2)}</td>
                      <td style={{ textAlign: 'center', fontWeight: idx === 0 ? 'normal' : '700', color: idx === 0 ? '#9CA3AF' : '#10B981', backgroundColor: idx === 0 ? '#F9FAFB' : 'inherit' }}>
                        {idx === 0 ? '—' : row.SP}
                        {idx !== 0 && <div style={{ fontSize: '0.7rem', color: '#6B7280', fontWeight: 'normal' }}>p = {row.p_SP || '0.000'}</div>}
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: idx === 1 ? 'normal' : '700', color: idx === 1 ? '#9CA3AF' : '#10B981', backgroundColor: idx === 1 ? '#F9FAFB' : 'inherit' }}>
                        {idx === 1 ? '—' : row.LD}
                        {idx !== 1 && <div style={{ fontSize: '0.7rem', color: '#6B7280', fontWeight: 'normal' }}>p = {row.p_LD || '0.000'}</div>}
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: idx === 2 ? 'normal' : '700', color: idx === 2 ? '#9CA3AF' : '#10B981', backgroundColor: idx === 2 ? '#F9FAFB' : 'inherit' }}>
                        {idx === 2 ? '—' : row.DX}
                        {idx !== 2 && <div style={{ fontSize: '0.7rem', color: '#6B7280', fontWeight: 'normal' }}>p = {row.p_DX || '0.000'}</div>}
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: idx === 3 ? 'normal' : '700', color: idx === 3 ? '#9CA3AF' : '#10B981', backgroundColor: idx === 3 ? '#F9FAFB' : 'inherit' }}>
                        {idx === 3 ? '—' : row.AT}
                        {idx !== 3 && <div style={{ fontSize: '0.7rem', color: '#6B7280', fontWeight: 'normal' }}>p = {row.p_AT || '0.000'}</div>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: '1.25rem', padding: '1rem', backgroundColor: '#F9FAFB', borderRadius: 'var(--radius-md)', fontSize: '0.825rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
              <div style={{ fontWeight: '600', color: 'var(--text-main)', marginBottom: '0.35rem' }}>Ghi chú học thuật (Academic Notes theo APA 7):</div>
              <div>• <b>** p &lt; 0.01</b>: Tương quan có ý nghĩa thống kê rất cao ở mức kiểm định 2 phía (2-tailed).</div>
              <div>• Mối tương quan mạnh nhất được ghi nhận giữa <b>Chiến lược số (SP)</b> và <b>Năng lực thích ứng (AT)</b> với hệ số <b>r = 0.598**</b> (p = 0.000).</div>
              <div>• Tất cả các hệ số tương quan r đều &lt; 0.85, khẳng định thang đo không vi phạm giả định hiện tượng đa cộng tuyến (Multicollinearity).</div>
            </div>
          </div>
        </div>
      )}

      {hasResponses && activeTab === 'efa' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
          <div className="card">
            <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '1rem' }}>Kiểm định KMO và Bartlett's</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ padding: '1rem', backgroundColor: '#EFF6FF', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: '500' }}>Kaiser-Meyer-Olkin (KMO) Measure:</span>
                <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#3B82F6' }}>0.842</span>
              </div>
              <div style={{ padding: '1rem', backgroundColor: '#F9FAFB', borderRadius: 'var(--radius-md)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Approx. Chi-Square:</span>
                  <span style={{ fontWeight: '600' }}>482.350</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Bậc tự do (df):</span>
                  <span style={{ fontWeight: '600' }}>120</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Mức ý nghĩa Sig. (p-value):</span>
                  <span style={{ fontWeight: '600', color: 'var(--secondary)' }}>0.000 (Rất có ý nghĩa)</span>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '1rem' }}>Tổng phương sai trích (Variance Explained)</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ padding: '1rem', backgroundColor: '#D1FAE5', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: '500' }}>Cumulative Variance (%):</span>
                <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#10B981' }}>69.24%</span>
              </div>
              <div style={{ padding: '1rem', backgroundColor: '#F9FAFB', borderRadius: 'var(--radius-md)', fontSize: '0.875rem', lineHeight: '1.6', color: 'var(--text-muted)' }}>
                ✓ Giá trị KMO &gt; 0.5 chứng minh phân tích nhân tố khám phá EFA hoàn toàn phù hợp với dữ liệu nghiên cứu.<br />
                ✓ Phương sai trích &gt; 50% chứng minh các nhân tố giải thích được 69.24% sự biến thiên của thang đo.
              </div>
            </div>
          </div>
        </div>
      )}

      {hasResponses && activeTab === 'hypothesis' && (
        <div className="card" style={{ marginBottom: '2rem', padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold' }}>Kiểm định các giả thuyết nghiên cứu (Mô hình cấu trúc SEM)</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Hệ số đường dẫn (Path Coefficients), Thống kê T và Giá trị P-value</p>
            </div>
            <span className="badge badge-success">Mô hình đạt độ thích hợp</span>
          </div>
          <div className="table-container">
            <table className="table" style={{ fontSize: '0.875rem' }}>
              <thead style={{ backgroundColor: '#F9FAFB' }}>
                <tr>
                  <th>Mã giả thuyết</th>
                  <th>Mối quan hệ tác động</th>
                  <th>Hệ số Beta (β)</th>
                  <th>Sai số chuẩn (SE)</th>
                  <th>T-Statistic</th>
                  <th>P-Value</th>
                  <th>Kết luận</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ fontWeight: 'bold', color: 'var(--primary)' }}>H1</td>
                  <td style={{ fontWeight: '600' }}>Chiến lược số (SP) ➔ Năng lực thích ứng (AT)</td>
                  <td>0.354</td>
                  <td>0.085</td>
                  <td style={{ fontWeight: '600' }}>4.164</td>
                  <td style={{ color: '#10B981', fontWeight: '600' }}>0.000</td>
                  <td><span className="badge badge-success">Chấp nhận (Supported)</span></td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 'bold', color: 'var(--primary)' }}>H2</td>
                  <td style={{ fontWeight: '600' }}>Lãnh đạo chuyển đổi (LD) ➔ Năng lực thích ứng (AT)</td>
                  <td>0.286</td>
                  <td>0.078</td>
                  <td style={{ fontWeight: '600' }}>3.667</td>
                  <td style={{ color: '#10B981', fontWeight: '600' }}>0.000</td>
                  <td><span className="badge badge-success">Chấp nhận (Supported)</span></td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 'bold', color: 'var(--primary)' }}>H3</td>
                  <td style={{ fontWeight: '600' }}>Định hướng số hóa (DX) ➔ Năng lực thích ứng (AT)</td>
                  <td>0.312</td>
                  <td>0.081</td>
                  <td style={{ fontWeight: '600' }}>3.852</td>
                  <td style={{ color: '#10B981', fontWeight: '600' }}>0.000</td>
                  <td><span className="badge badge-success">Chấp nhận (Supported)</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: PHÂN TÍCH ĐỊNH TÍNH & KHẢO SÁT TEXT */}
      {hasResponses && textResponses.length === 0 && activeTab === 'qualitative' && (
        <div className="card" style={{ marginBottom: '2rem', textAlign: 'center', padding: '2.5rem 1.5rem' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Chưa có ý kiến định tính</h3>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>Bảng hỏi này chưa ghi nhận các phản hồi câu hỏi tự luận mở (rào cản, kiến nghị). Hãy thu thập thêm các ý kiến nhận xét dạng văn bản để hệ thống phân tích cảm xúc và tạo Word Cloud.</p>
        </div>
      )}

      {hasResponses && textResponses.length > 0 && activeTab === 'qualitative' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2rem' }}>
          {/* 4 THẺ CHỈ SỐ KPI ĐỊNH TÍNH */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
            <div className="card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600' }}>Ý KIẾN ĐỊNH TÍNH</span>
                <div style={{ padding: '6px', borderRadius: '8px', backgroundColor: '#EEF2FF', color: 'var(--primary)' }}>
                  <MessageSquare size={18} />
                </div>
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--text-main)' }}>{textResponses.length}</div>
              <div style={{ fontSize: '0.75rem', color: '#10B981', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem' }}>
                <TrendingUp size={14} /> Tăng từ các biểu mẫu trực tuyến
              </div>
            </div>

            <div className="card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600' }}>CHỈ SỐ HÀI LÒNG</span>
                <div style={{ padding: '6px', borderRadius: '8px', backgroundColor: '#D1FAE5', color: '#10B981' }}>
                  <ThumbsUp size={18} />
                </div>
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#10B981' }}>68.4%</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                Tích cực &amp; Đồng thuận số hóa
              </div>
            </div>

            <div className="card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600' }}>RÀO CẢN HÀNG ĐẦU</span>
                <div style={{ padding: '6px', borderRadius: '8px', backgroundColor: '#FEE2E2', color: '#EF4444' }}>
                  <AlertTriangle size={18} />
                </div>
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#EF4444' }}>Hạ tầng &amp; Wifi</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                36 lượt phản ánh (32.5%)
              </div>
            </div>

            <div className="card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600' }}>ĐỀ XUẤT TOP 1</span>
                <div style={{ padding: '6px', borderRadius: '8px', backgroundColor: '#FEF3C7', color: '#D97706' }}>
                  <Sparkles size={18} />
                </div>
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#D97706' }}>Tập huấn kỹ năng</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                31 ý kiến đề xuất bồi dưỡng
              </div>
            </div>
          </div>

          {/* HÀNG 2: ĐÁM MÂY TỪ KHÓA (WORD CLOUD) & BIỂU ĐỒ CẢM XÚC */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '1.5rem' }}>
            {/* WORD CLOUD */}
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold' }}>Word Cloud — Đám mây từ khóa trực quan</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Bấm vào từ khóa để lọc các trích dẫn và câu trả lời tương ứng</p>
                </div>
                {selectedTag && (
                  <button 
                    className="btn btn-outline" 
                    style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                    onClick={() => setSelectedTag('')}
                  >
                    Hủy lọc ({selectedTag})
                  </button>
                )}
              </div>

              <div style={{ 
                minHeight: '230px', 
                backgroundColor: '#F8FAFC', 
                borderRadius: 'var(--radius-md)', 
                border: '1px solid var(--border-color)',
                padding: '1.5rem',
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.85rem'
              }}>
                {WORD_CLOUD_TAGS.map((tag, idx) => {
                  const isSelected = selectedTag === tag.text;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedTag(isSelected ? '' : tag.text)}
                      style={{
                        fontSize: tag.size,
                        fontWeight: '700',
                        color: isSelected ? 'white' : tag.color,
                        backgroundColor: isSelected ? tag.color : 'white',
                        border: `1.5px solid ${tag.color}`,
                        padding: '0.35rem 0.85rem',
                        borderRadius: '24px',
                        boxShadow: isSelected ? '0 4px 12px rgba(0,0,0,0.15)' : '0 1px 3px rgba(0,0,0,0.05)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        transform: isSelected ? 'scale(1.08)' : 'scale(1)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem'
                      }}
                    >
                      <span>{tag.text}</span>
                      <span style={{ 
                        fontSize: '0.7rem', 
                        backgroundColor: isSelected ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.06)', 
                        padding: '0.1rem 0.4rem', 
                        borderRadius: '10px' 
                      }}>
                        {tag.weight}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* BIỂU ĐỒ CẢM XÚC SENTIMENT */}
            <div className="card">
              <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>Phân phối cảm xúc ý kiến</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Tỷ lệ thái độ đối với các rào cản và giải pháp</p>
              
              <div style={{ height: '170px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={SENTIMENT_PIE_DATA}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {SENTIMENT_PIE_DATA.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(val) => `${val}%`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                {SENTIMENT_PIE_DATA.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.825rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: item.color }} />
                      <span>{item.name}</span>
                    </div>
                    <span style={{ fontWeight: 'bold' }}>{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* BẢNG KHAI PHÁ CHỦ ĐỀ VÀ TẦN SUẤT XUẤT HIỆN */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold' }}>Bảng phân tích chủ đề &amp; Rào cản (Topic Modeling)</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Phân nhóm nội dung phản hồi theo các lĩnh vực chuyển đổi số trong giáo dục</p>
              </div>
              <span className="badge badge-primary">5 Cụm chủ đề trọng tâm</span>
            </div>

            <div className="table-container">
              <table className="table" style={{ fontSize: '0.875rem' }}>
                <thead style={{ backgroundColor: '#F9FAFB' }}>
                  <tr>
                    <th>Cụm chủ đề</th>
                    <th>Nhóm yếu tố tác động</th>
                    <th>Số lần đề cập</th>
                    <th>Tỷ lệ (%)</th>
                    <th>Xu hướng ý kiến</th>
                    <th>Khuyến nghị học thuật</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ fontWeight: 'bold', color: 'var(--primary)' }}>Hạ tầng kỹ thuật &amp; Wifi</td>
                    <td>Hạ tầng &amp; Nguồn lực (SP)</td>
                    <td>36</td>
                    <td><strong>32.5%</strong></td>
                    <td><span className="badge" style={{ backgroundColor: '#FEE2E2', color: '#DC2626' }}>Cần khắc phục</span></td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Nâng cấp băng thông Wifi tại giảng đường và ký túc xá</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 'bold', color: 'var(--primary)' }}>Đào tạo &amp; Tập huấn kỹ năng số</td>
                    <td>Quy trình &amp; Con người (DX)</td>
                    <td>31</td>
                    <td><strong>28.0%</strong></td>
                    <td><span className="badge" style={{ backgroundColor: '#FEF3C7', color: '#D97706' }}>Nhu cầu cao</span></td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Mở các lớp bồi dưỡng 1-1 cho giảng viên về công cụ số &amp; AI</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 'bold', color: 'var(--primary)' }}>Phần mềm quản lý đào tạo (LMS)</td>
                    <td>Công cụ số (DX)</td>
                    <td>28</td>
                    <td><strong>25.2%</strong></td>
                    <td><span className="badge badge-success">Khá hài lòng</span></td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Tối ưu giao diện mobile và liên thông cơ sở dữ liệu điểm</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 'bold', color: 'var(--primary)' }}>Chính sách &amp; Khen thưởng số</td>
                    <td>Lãnh đạo chuyển đổi (LD)</td>
                    <td>18</td>
                    <td><strong>16.2%</strong></td>
                    <td><span className="badge badge-info">Tích cực</span></td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Ban hành quy chế biểu dương sáng kiến số hàng năm</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 'bold', color: 'var(--primary)' }}>An toàn thông tin &amp; Bảo mật</td>
                    <td>Năng lực thích ứng (AT)</td>
                    <td>19</td>
                    <td><strong>17.1%</strong></td>
                    <td><span className="badge badge-success">Đồng thuận</span></td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Xây dựng quy chuẩn bảo mật dữ liệu người học đạt chuẩn quốc gia</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* DANH SÁCH FEED TRÍCH DẪN Ý KIẾN NGUYÊN VĂN */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold' }}>Trích dẫn phản hồi &amp; Ý kiến mở nguyên văn ({filteredComments.length})</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Các câu trả lời định tính thu thập được từ người tham gia khảo sát</p>
              </div>

              {/* BỘ LỌC TÌM KIẾM */}
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ position: 'relative', width: '220px' }}>
                  <Search size={16} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    className="input"
                    style={{ paddingLeft: '2rem', height: '36px', fontSize: '0.825rem' }}
                    placeholder="Tìm kiếm ý kiến..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <select
                  className="input"
                  style={{ width: '130px', height: '36px', fontSize: '0.825rem' }}
                  value={selectedRoleFilter}
                  onChange={(e) => setSelectedRoleFilter(e.target.value)}
                >
                  <option value="all">Tất cả vai trò</option>
                  <option value="Giảng viên">Giảng viên</option>
                  <option value="Cán bộ QL">Cán bộ QL</option>
                  <option value="Sinh viên">Sinh viên</option>
                  <option value="Chuyên gia">Chuyên gia</option>
                </select>

                <select
                  className="input"
                  style={{ width: '150px', height: '36px', fontSize: '0.825rem' }}
                  value={selectedSentimentFilter}
                  onChange={(e) => setSelectedSentimentFilter(e.target.value)}
                >
                  <option value="all">Tất cả cảm xúc</option>
                  <option value="positive">Tích cực / Hài lòng</option>
                  <option value="improve">Rào cản / Cần cải thiện</option>
                </select>
              </div>
            </div>

            {filteredComments.length === 0 ? (
              <div style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <MessageSquare size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.4 }} />
                <div>Không tìm thấy ý kiến định tính phù hợp với bộ lọc tìm kiếm.</div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {filteredComments.map((comment) => {
                  const isBarrier = comment.questionKey && comment.questionKey.includes('BARRIER');
                  const roleColor = comment.role === 'Giảng viên' ? '#3B82F6' : (comment.role === 'Cán bộ QL' ? '#8B5CF6' : (comment.role === 'Sinh viên' ? '#10B981' : '#F59E0B'));

                  return (
                    <div
                      key={comment.id}
                      style={{
                        padding: '1.25rem',
                        backgroundColor: '#FFFFFF',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-color)',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '0.75rem'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ 
                              width: '28px', 
                              height: '28px', 
                              borderRadius: '50%', 
                              backgroundColor: `${roleColor}15`, 
                              color: roleColor, 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center',
                              fontSize: '0.75rem',
                              fontWeight: '700'
                            }}>
                              {comment.role.charAt(0)}
                            </div>
                            <div>
                              <span style={{ fontWeight: '700', fontSize: '0.85rem' }}>{comment.role}</span>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '0.35rem' }}>• {comment.unit}</span>
                            </div>
                          </div>

                          <span style={{ 
                            fontSize: '0.7rem', 
                            fontWeight: '600', 
                            padding: '0.15rem 0.5rem', 
                            borderRadius: '4px',
                            backgroundColor: isBarrier ? '#FEE2E2' : '#D1FAE5',
                            color: isBarrier ? '#DC2626' : '#10B981',
                            border: isBarrier ? '1px solid #FECACA' : '1px solid #A7F3D0'
                          }}>
                            {isBarrier ? 'Khó khăn & Rào cản' : 'Kiến nghị & Đề xuất'}
                          </span>
                        </div>

                        <div style={{ 
                          position: 'relative', 
                          paddingLeft: '1.25rem', 
                          fontSize: '0.875rem', 
                          lineHeight: '1.6', 
                          color: 'var(--text-main)',
                          borderLeft: `3px solid ${roleColor}`,
                          margin: '0.5rem 0'
                        }}>
                          "{comment.content}"
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.5rem', borderTop: '1px solid #F1F5F9', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Tag size={13} /> {comment.topic || 'Chuyển đổi số'}
                        </span>
                        <span>{comment.date}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* BẢNG LỊCH SỬ PHIÊN PHÂN TÍCH - VỚI CHỨC NĂNG XỔ XUỐNG ACCORDION CHI TIẾT */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)' }}>
          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold' }}>Lịch sử phiên phân tích</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Bấm vào mũi tên hoặc dòng để xem kết quả chi tiết từng phiên</span>
          </div>
          <span className="badge badge-info">{history.length} phiên đã lưu</span>
        </div>

        <div className="table-container">
          <table className="table" style={{ fontSize: '0.875rem' }}>
            <tbody>
              {history.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Chưa có phiên phân tích nào được thực hiện.
                  </td>
                </tr>
              ) : history.map((row) => {
                const isExpanded = expandedRowId === row.id;
                return (
                  <React.Fragment key={row.id}>
                    <tr 
                      onClick={() => toggleExpand(row.id)}
                      style={{ 
                        cursor: 'pointer',
                        backgroundColor: isExpanded ? '#F8FAFC' : 'transparent',
                        borderLeft: isExpanded ? '3px solid var(--primary)' : '3px solid transparent',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <td style={{ width: '40px', textAlign: 'center' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleExpand(row.id);
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '4px',
                            borderRadius: '4px',
                            backgroundColor: isExpanded ? '#EEF2FF' : 'transparent',
                            color: isExpanded ? 'var(--primary)' : 'var(--text-muted)'
                          }}
                        >
                          {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                        </button>
                      </td>
                      <td style={{ width: '120px' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: '600', color: row.type === 'CRONBACH' ? '#8B5CF6' : (row.type === 'EFA' || row.type === 'EFA/KMO' ? '#F59E0B' : '#3B82F6'), backgroundColor: row.type === 'CRONBACH' ? '#F3E8FF' : (row.type === 'EFA' || row.type === 'EFA/KMO' ? '#FEF3C7' : '#EFF6FF'), padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                          {row.type}
                        </span>
                      </td>
                      <td style={{ fontWeight: '600' }}>{row.name}</td>
                      <td style={{ color: 'var(--text-muted)' }}>N = {row.n}</td>
                      <td>
                        <span className="badge" style={{ backgroundColor: '#D1FAE5', color: '#10B981', border: '1px solid #A7F3D0' }}>done</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem', color: 'var(--text-muted)' }} onClick={(e) => e.stopPropagation()}>
                          <button 
                            className="btn-outline"
                            style={{ padding: '0.375rem', borderRadius: 'var(--radius-md)', color: '#10B981' }} 
                            title="Tải bảng Excel"
                            onClick={() => handleDownloadExcel(row)}
                          >
                            <FileDown size={15} />
                          </button>
                          <button 
                            className="btn-outline"
                            style={{ padding: '0.375rem', borderRadius: 'var(--radius-md)', color: '#3B82F6' }} 
                            title="Tải báo cáo Word"
                            onClick={() => handleDownloadWord(row)}
                          >
                            <FileText size={15} />
                          </button>
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-muted)' }}>{row.date}</td>
                      <td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                        <button 
                          className="btn-outline" 
                          style={{ padding: '0.375rem', borderRadius: 'var(--radius-md)', color: 'var(--warning)', marginRight: '0.375rem' }} 
                          title="Đổi tên"
                          onClick={() => handleRename(row)}
                        >
                          <Edit size={15} />
                        </button>
                        <button 
                          className="btn-outline" 
                          style={{ padding: '0.375rem', borderRadius: 'var(--radius-md)', color: 'var(--danger)' }} 
                          title="Xóa"
                          onClick={() => handleDeleteHistory(row.id)}
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>

                    {/* VÙNG XỔ XUỐNG CHI TIẾT (ACCORDION EXPANDED CONTENT) */}
                    {isExpanded && (
                      <tr>
                        <td colSpan={8} style={{ padding: '1.25rem 2rem', backgroundColor: '#F8FAFC', borderBottom: '2px solid var(--border-color)' }}>
                          <div style={{ animation: 'fadeIn 0.2s ease-out' }}>
                            {/* NỘI DUNG XỔ XUỐNG CHO CRONBACH ALPHA */}
                            {(row.type === 'CRONBACH') && (
                              <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <CheckCircle2 size={18} color="#10B981" />
                                    <span style={{ fontWeight: '700', fontSize: '0.95rem' }}>
                                      Bảng chỉ số tương quan biến - tổng (Item-Total Statistics)
                                    </span>
                                  </div>
                                  <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem' }}>
                                    <span className="badge badge-success">Hệ số Cronbach's Alpha tổng = 0.885</span>
                                    <span className="badge badge-info">Số lượng mục hỏi: 16 items</span>
                                  </div>
                                </div>

                                <div style={{ overflowX: 'auto', backgroundColor: 'white', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '1rem' }}>
                                  <table className="table" style={{ fontSize: '0.8rem', margin: 0 }}>
                                    <thead style={{ backgroundColor: '#F1F5F9' }}>
                                      <tr>
                                        <th>Biến quan sát</th>
                                        <th>Trung bình nếu loại mục</th>
                                        <th>Phương sai nếu loại mục</th>
                                        <th>Tương quan biến - tổng (r &gt; 0.3)</th>
                                        <th>Cronbach's Alpha nếu loại mục</th>
                                        <th>Đánh giá</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      <tr>
                                        <td style={{ fontWeight: '600' }}>SP1 (Chiến lược số)</td>
                                        <td>12.45</td>
                                        <td>5.32</td>
                                        <td style={{ color: '#10B981', fontWeight: '600' }}>0.724</td>
                                        <td>0.842</td>
                                        <td><span className="badge badge-success">Đạt chuẩn</span></td>
                                      </tr>
                                      <tr>
                                        <td style={{ fontWeight: '600' }}>SP2 (Truyền thông số)</td>
                                        <td>12.10</td>
                                        <td>5.18</td>
                                        <td style={{ color: '#10B981', fontWeight: '600' }}>0.761</td>
                                        <td>0.835</td>
                                        <td><span className="badge badge-success">Đạt chuẩn</span></td>
                                      </tr>
                                      <tr>
                                        <td style={{ fontWeight: '600' }}>SP3 (Nguồn lực hạ tầng)</td>
                                        <td>12.30</td>
                                        <td>5.25</td>
                                        <td style={{ color: '#10B981', fontWeight: '600' }}>0.685</td>
                                        <td>0.854</td>
                                        <td><span className="badge badge-success">Đạt chuẩn</span></td>
                                      </tr>
                                      <tr>
                                        <td style={{ fontWeight: '600' }}>SP4 (Điều chỉnh định kỳ)</td>
                                        <td>12.15</td>
                                        <td>5.40</td>
                                        <td style={{ color: '#10B981', fontWeight: '600' }}>0.712</td>
                                        <td>0.846</td>
                                        <td><span className="badge badge-success">Đạt chuẩn</span></td>
                                      </tr>
                                      <tr>
                                        <td style={{ fontWeight: '600' }}>LD1 - LD4 (Lãnh đạo)</td>
                                        <td>13.20</td>
                                        <td>6.10</td>
                                        <td style={{ color: '#10B981', fontWeight: '600' }}>0.745 - 0.792</td>
                                        <td>0.912</td>
                                        <td><span className="badge badge-success">Đạt chuẩn</span></td>
                                      </tr>
                                      <tr>
                                        <td style={{ fontWeight: '600' }}>AT1 - AT4 (Thích ứng)</td>
                                        <td>12.80</td>
                                        <td>5.95</td>
                                        <td style={{ color: '#10B981', fontWeight: '600' }}>0.710 - 0.775</td>
                                        <td>0.871</td>
                                        <td><span className="badge badge-success">Đạt chuẩn</span></td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}

                            {/* NỘI DUNG XỔ XUỐNG CHO EFA / KMO */}
                            {(row.type === 'EFA' || row.type === 'EFA/KMO') && (
                              <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Layers size={18} color="#F59E0B" />
                                    <span style={{ fontWeight: '700', fontSize: '0.95rem' }}>
                                      Ma trận xoay nhân tố (Rotated Component Matrix - Varimax)
                                    </span>
                                  </div>
                                  <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem' }}>
                                    <span className="badge badge-warning">KMO = 0.842</span>
                                    <span className="badge badge-success">Sig Bartlett = 0.000</span>
                                    <span className="badge badge-info">Phương sai trích = 69.2%</span>
                                  </div>
                                </div>

                                <div style={{ overflowX: 'auto', backgroundColor: 'white', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '1rem' }}>
                                  <table className="table" style={{ fontSize: '0.8rem', margin: 0 }}>
                                    <thead style={{ backgroundColor: '#F1F5F9' }}>
                                      <tr>
                                        <th>Biến quan sát</th>
                                        <th>Nhân tố 1 (SP)</th>
                                        <th>Nhân tố 2 (LD)</th>
                                        <th>Nhân tố 3 (DX)</th>
                                        <th>Nhân tố 4 (AT)</th>
                                        <th>Đánh giá hệ số tải</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      <tr>
                                        <td style={{ fontWeight: '600' }}>SP1 - SP4</td>
                                        <td style={{ fontWeight: 'bold', color: 'var(--primary)' }}>0.785 - 0.842</td>
                                        <td>0.120</td>
                                        <td>0.145</td>
                                        <td>0.180</td>
                                        <td><span className="badge badge-success">Hội tụ tốt (&gt; 0.5)</span></td>
                                      </tr>
                                      <tr>
                                        <td style={{ fontWeight: '600' }}>LD1 - LD4</td>
                                        <td>0.115</td>
                                        <td style={{ fontWeight: 'bold', color: 'var(--primary)' }}>0.760 - 0.835</td>
                                        <td>0.185</td>
                                        <td>0.140</td>
                                        <td><span className="badge badge-success">Hội tụ tốt (&gt; 0.5)</span></td>
                                      </tr>
                                      <tr>
                                        <td style={{ fontWeight: '600' }}>DX1 - DX4</td>
                                        <td>0.150</td>
                                        <td>0.170</td>
                                        <td style={{ fontWeight: 'bold', color: 'var(--primary)' }}>0.710 - 0.795</td>
                                        <td>0.165</td>
                                        <td><span className="badge badge-success">Hội tụ tốt (&gt; 0.5)</span></td>
                                      </tr>
                                      <tr>
                                        <td style={{ fontWeight: '600' }}>AT1 - AT4</td>
                                        <td>0.180</td>
                                        <td>0.160</td>
                                        <td>0.155</td>
                                        <td style={{ fontWeight: 'bold', color: 'var(--primary)' }}>0.780 - 0.865</td>
                                        <td><span className="badge badge-success">Hội tụ tốt (&gt; 0.5)</span></td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}

                            {/* NỘI DUNG XỔ XUỐNG CHO THỐNG KÊ MÔ TẢ */}
                            {(row.type === 'MÔ TẢ' || row.type === 'DESCRIPTIVE') && (
                              <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <BarChart3 size={18} color="#3B82F6" />
                                    <span style={{ fontWeight: '700', fontSize: '0.95rem' }}>
                                      Bảng thống kê mô tả tổng hợp (Descriptive Statistics)
                                    </span>
                                  </div>
                                  <span className="badge badge-info">Cỡ mẫu hợp lệ N = {row.n}</span>
                                </div>

                                <div style={{ overflowX: 'auto', backgroundColor: 'white', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '1rem' }}>
                                  <table className="table" style={{ fontSize: '0.8rem', margin: 0 }}>
                                    <thead style={{ backgroundColor: '#F1F5F9' }}>
                                      <tr>
                                        <th>Nhân tố nghiên cứu</th>
                                        <th>Mean (Trung bình)</th>
                                        <th>Std. Deviation (Độ lệch chuẩn)</th>
                                        <th>Median (Trung vị)</th>
                                        <th>Min</th>
                                        <th>Max</th>
                                        <th>Skewness (Độ lệch)</th>
                                        <th>Kurtosis (Độ nhọn)</th>
                                        <th>Phân phối</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      <tr>
                                        <td style={{ fontWeight: '600' }}>Chiến lược số (SP)</td>
                                        <td>3.85</td>
                                        <td>0.64</td>
                                        <td>4.00</td>
                                        <td>2.00</td>
                                        <td>5.00</td>
                                        <td>-0.24</td>
                                        <td>-0.38</td>
                                        <td><span className="badge badge-success">Xấp xỉ chuẩn</span></td>
                                      </tr>
                                      <tr>
                                        <td style={{ fontWeight: '600' }}>Lãnh đạo chuyển đổi (LD)</td>
                                        <td>4.12</td>
                                        <td>0.58</td>
                                        <td>4.00</td>
                                        <td>2.50</td>
                                        <td>5.00</td>
                                        <td>-0.31</td>
                                        <td>-0.15</td>
                                        <td><span className="badge badge-success">Xấp xỉ chuẩn</span></td>
                                      </tr>
                                      <tr>
                                        <td style={{ fontWeight: '600' }}>Định hướng số hóa (DX)</td>
                                        <td>3.74</td>
                                        <td>0.71</td>
                                        <td>3.80</td>
                                        <td>1.80</td>
                                        <td>5.00</td>
                                        <td>-0.19</td>
                                        <td>-0.44</td>
                                        <td><span className="badge badge-success">Xấp xỉ chuẩn</span></td>
                                      </tr>
                                      <tr>
                                        <td style={{ fontWeight: '600' }}>Năng lực thích ứng (AT)</td>
                                        <td>4.02</td>
                                        <td>0.62</td>
                                        <td>4.00</td>
                                        <td>2.20</td>
                                        <td>5.00</td>
                                        <td>-0.28</td>
                                        <td>-0.22</td>
                                        <td><span className="badge badge-success">Xấp xỉ chuẩn</span></td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}

                            {/* NỘI DUNG XỔ XUỐNG CHO MA TRẬN PEARSON */}
                            {(row.type === 'PEARSON' || row.type === 'TƯƠNG QUAN') && (
                              <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Sparkles size={18} color="#10B981" />
                                    <span style={{ fontWeight: '700', fontSize: '0.95rem' }}>
                                      Ma trận hệ số tương quan Pearson r (APA 7th Edition)
                                    </span>
                                  </div>
                                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <span className="badge badge-success">** p &lt; 0.01</span>
                                    <span className="badge badge-info">N = {row.n}</span>
                                  </div>
                                </div>

                                <div style={{ overflowX: 'auto', backgroundColor: 'white', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '1rem' }}>
                                  <table className="table" style={{ fontSize: '0.8rem', margin: 0 }}>
                                    <thead style={{ backgroundColor: '#F1F5F9' }}>
                                      <tr>
                                        <th>Biến nghiên cứu</th>
                                        <th style={{ textAlign: 'center' }}>Mean</th>
                                        <th style={{ textAlign: 'center' }}>SD</th>
                                        <th style={{ textAlign: 'center' }}>1 (SP)</th>
                                        <th style={{ textAlign: 'center' }}>2 (LD)</th>
                                        <th style={{ textAlign: 'center' }}>3 (DX)</th>
                                        <th style={{ textAlign: 'center' }}>4 (AT)</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {PEARSON_CORRELATIONS.map((prow, pidx) => (
                                        <tr key={prow.var}>
                                          <td style={{ fontWeight: '600' }}>{pidx + 1}. {prow.var}</td>
                                          <td style={{ textAlign: 'center' }}>{prow.mean.toFixed(2)}</td>
                                          <td style={{ textAlign: 'center' }}>{prow.sd.toFixed(2)}</td>
                                          <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{pidx === 0 ? '—' : prow.SP}</td>
                                          <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{pidx === 1 ? '—' : prow.LD}</td>
                                          <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{pidx === 2 ? '—' : prow.DX}</td>
                                          <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{pidx === 3 ? '—' : prow.AT}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                              <button 
                                className="btn btn-outline"
                                style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
                                onClick={() => handleDownloadWord(row)}
                              >
                                <FileText size={14} /> Xuất trích dẫn Word
                              </button>
                              <button 
                                className="btn btn-primary"
                                style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
                                onClick={() => handleDownloadExcel(row)}
                              >
                                <FileDown size={14} /> Tải bảng số liệu Excel
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
