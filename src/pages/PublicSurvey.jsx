import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { GraduationCap, CheckCircle2, ArrowRight, ArrowLeft, Send, AlertTriangle, Clock } from 'lucide-react';
import { responsesAPI, surveysAPI } from '../services/api';

const LIKERT_5_OPTIONS = [
  { value: 1, label: 'Hoàn toàn không đồng ý' },
  { value: 2, label: 'Không đồng ý' },
  { value: 3, label: 'Trung lập' },
  { value: 4, label: 'Đồng ý' },
  { value: 5, label: 'Hoàn toàn đồng ý' },
];

const LIKERT_7_OPTIONS = [
  { value: 1, label: 'Rất không đồng ý' },
  { value: 2, label: 'Không đồng ý' },
  { value: 3, label: 'Hơi không đồng ý' },
  { value: 4, label: 'Trung lập' },
  { value: 5, label: 'Hơi đồng ý' },
  { value: 6, label: 'Đồng ý' },
  { value: 7, label: 'Rất đồng ý' },
];

const DEFAULT_QUESTIONS = [
  { code: 'SP1', text: 'Nhà trường có chiến lược chuyển đổi số rõ ràng và khả thi.', variable: 'SP' },
  { code: 'SP2', text: 'Kế hoạch triển khai công nghệ được phổ biến rộng rãi tới mọi thành viên.', variable: 'SP' },
  { code: 'LD1', text: 'Ban lãnh đạo luôn tiên phong và quyết liệt trong đổi mới công nghệ.', variable: 'LD' },
  { code: 'LD2', text: 'Cán bộ quản lý khuyến khích áp dụng các sáng kiến số mới.', variable: 'LD' },
  { code: 'DX1', text: 'Quy trình công việc và học tập được số hóa và chuẩn hóa đồng bộ.', variable: 'DX' },
  { code: 'AT1', text: 'Đơn vị thích ứng linh hoạt trước những thay đổi nhanh chóng của công nghệ.', variable: 'AT' }
];

const PublicSurvey = () => {
  const { id } = useParams();
  const surveyId = id || 1;

  const [surveyInfo, setSurveyInfo] = useState(null);
  const [questions, setQuestions] = useState(DEFAULT_QUESTIONS);
  const [fetching, setFetching] = useState(true);
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [startTime] = useState(Date.now());

  // Form State
  const [participant, setParticipant] = useState({
    name: '',
    gender: 'Nam',
    age: '28',
    role: 'Giảng viên',
    unit: 'Khoa Kinh tế',
    experience: '3',
    education: 'Thạc sĩ'
  });

  const [answers, setAnswers] = useState({});

  useEffect(() => {
    const fetchSurvey = async () => {
      try {
        setFetching(true);
        const data = await surveysAPI.getById(surveyId);
        setSurveyInfo(data);
        if (data.questions && data.questions.length > 0) {
          setQuestions(data.questions);
          const initAnswers = {};
          data.questions.forEach((q, idx) => {
            const key = q.code || `q_${idx}`;
            if (q.type === 'textarea' || q.type === 'text') {
              initAnswers[key] = '';
            } else if (q.type === 'choice') {
              initAnswers[key] = (q.options && q.options[0]) || '';
            } else {
              initAnswers[key] = 4;
            }
          });
          setAnswers(initAnswers);
        } else {
          setAnswers({ SP1: 4, SP2: 4, LD1: 5, LD2: 4, DX1: 4, AT1: 5 });
        }
      } catch (err) {
        console.error('Survey not found, using default info', err);
        setAnswers({ SP1: 4, SP2: 4, LD1: 5, LD2: 4, DX1: 4, AT1: 5 });
      } finally {
        setFetching(false);
      }
    };
    fetchSurvey();
  }, [surveyId]);

  const isPreview = new URLSearchParams(window.location.search).get('preview') === 'true';

  const scaleOptions = surveyInfo?.scale === 'Likert 7' ? LIKERT_7_OPTIONS : LIKERT_5_OPTIONS;

  const answeredCount = questions.filter(q => {
    const key = q.code;
    const ans = answers[key];
    if (q.type === 'textarea' || q.type === 'text') {
      return ans && ans.trim().length > 0;
    }
    return ans !== undefined && ans !== null;
  }).length;
  const progressPercent = step === 1 ? 30 : Math.min(100, Math.round(30 + (answeredCount / Math.max(1, questions.length)) * 70));

  const handleNextStep = (e) => {
    e.preventDefault();
    if (!participant.role || !participant.unit) {
      alert('Vui lòng chọn vai trò và nhập đơn vị công tác.');
      return;
    }
    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      if (isPreview) {
        setSubmitted(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setLoading(false);
        return;
      }

      const elapsedSeconds = Math.max(15, Math.round((Date.now() - startTime) / 1000));
      const minutes = Math.floor(elapsedSeconds / 60);
      const seconds = elapsedSeconds % 60;
      const timeTakenStr = `${minutes}p ${seconds}s`;

      await responsesAPI.create({
        survey_id: parseInt(surveyId) || 1,
        role: participant.role,
        unit: participant.unit,
        gender: participant.gender,
        time_taken: timeTakenStr,
        status: 'valid',
        answers: answers
      });

      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Lỗi khi gửi phản hồi:', err);
      alert('Đã có lỗi xảy ra khi nộp phiếu khảo sát. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
        <div style={{ color: 'var(--text-muted)' }}>Đang tải biểu mẫu khảo sát...</div>
      </div>
    );
  }

  // Khảo sát đã đóng
  if (surveyInfo?.status === 'Closed') {
    return (
      <div style={{ animation: 'fadeIn 0.5s ease', textAlign: 'center', padding: '3rem 1rem' }}>
        <div className="card" style={{ maxWidth: '540px', margin: '0 auto', padding: '3rem 2rem' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
            <AlertTriangle size={36} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.75rem' }}>
            Khảo sát này hiện đã đóng
          </h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', lineHeight: '1.6' }}>
            Ban nghiên cứu đề tài <strong>{surveyInfo.title}</strong> đã kết thúc đợt thu thập dữ liệu. Chân thành cảm ơn sự quan tâm của bạn!
          </p>
          <Link to="/" className="btn btn-primary">
            Về trang chủ
          </Link>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div style={{ animation: 'fadeIn 0.5s ease', textAlign: 'center', padding: '3rem 1rem' }}>
        <div className="card" style={{ maxWidth: '540px', margin: '0 auto', padding: '3rem 2rem' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#D1FAE5', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
            <CheckCircle2 size={36} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.75rem' }}>
            Cảm ơn bạn đã hoàn thành khảo sát!
          </h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', lineHeight: '1.6' }}>
            Ý kiến đóng góp quý báu của bạn đã được lưu trực tiếp vào cơ sở dữ liệu nghiên cứu khoa học của hệ thống.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
            <button 
              className="btn btn-primary"
              onClick={() => {
                setSubmitted(false);
                setStep(1);
              }}
            >
              Làm lại phiếu mới
            </button>
            <Link to="/" className="btn btn-outline">
              Về trang chủ
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ animation: 'fadeIn 0.5s ease', maxWidth: '780px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', backgroundColor: 'var(--primary)', color: 'white', borderRadius: '12px', marginBottom: '1rem' }}>
          <GraduationCap size={28} />
        </div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
          {surveyInfo?.title || 'Khảo sát năng lực chuyển đổi số trong giáo dục'}
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>
          {surveyInfo ? `Bảng hỏi #${surveyInfo.id} • Thang đo: ${surveyInfo.scale} • ${questions.length} câu hỏi` : 'Phiếu thu thập dữ liệu nghiên cứu trực tuyến'}
        </p>
      </div>

      {/* BANNER CHẾ ĐỘ XEM TRƯỚC (PREVIEW MODE) */}
      {isPreview && (
        <div style={{ backgroundColor: '#FEF3C7', color: '#92400E', border: '1px solid #FCD34D', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.85rem' }}>
          <span style={{ fontWeight: '600' }}>
            ⚠ Chế độ Xem trước (Preview Mode): Bạn đang kiểm tra thử nghiệm biểu mẫu. Dữ liệu khi gửi sẽ không được lưu vào cơ sở dữ liệu thật.
          </span>
          <span style={{ backgroundColor: '#F59E0B', color: 'white', padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: '700' }}>
            TEST PREVIEW
          </span>
        </div>
      )}

      {/* THANH TIẾN TRÌNH HOÀN THÀNH (PROGRESS BAR) */}
      <div style={{ backgroundColor: 'white', padding: '0.875rem 1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', marginBottom: '1.5rem', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
          <span>Bước {step} / 2: {step === 1 ? 'Thông tin đối tượng khảo sát' : `Đánh giá câu hỏi (${answeredCount}/${questions.length} câu)`}</span>
          <span style={{ color: 'var(--primary)', fontWeight: '700' }}>{progressPercent}% Hoàn thành</span>
        </div>
        <div style={{ width: '100%', height: '8px', backgroundColor: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{ width: `${progressPercent}%`, height: '100%', background: 'linear-gradient(90deg, #3B82F6, #10B981)', borderRadius: '4px', transition: 'width 0.3s ease' }}></div>
        </div>
      </div>

      {step === 1 ? (
        <form onSubmit={handleNextStep} className="card" style={{ padding: '2rem' }}>
          <div style={{ marginBottom: '1.75rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>Phần A: Thông tin người tham gia</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Thông tin này phục vụ việc phân tích cơ cấu mẫu nghiên cứu. Hoàn toàn bảo mật và vô danh.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '2rem' }}>
            <div>
              <label className="form-label">Họ và tên (Tùy chọn)</label>
              <input 
                type="text" 
                className="input" 
                placeholder="Nguyễn Văn A" 
                value={participant.name}
                onChange={(e) => setParticipant({ ...participant, name: e.target.value })}
              />
            </div>
            <div>
              <label className="form-label">Giới tính *</label>
              <select 
                className="input"
                value={participant.gender}
                onChange={(e) => setParticipant({ ...participant, gender: e.target.value })}
              >
                <option value="Nam">Nam</option>
                <option value="Nữ">Nữ</option>
                <option value="Khác">Khác</option>
              </select>
            </div>
            <div>
              <label className="form-label">Độ tuổi</label>
              <input 
                type="number" 
                className="input" 
                value={participant.age}
                onChange={(e) => setParticipant({ ...participant, age: e.target.value })}
              />
            </div>
            <div>
              <label className="form-label">Đối tượng / Chức danh *</label>
              <select 
                className="input"
                value={participant.role}
                onChange={(e) => setParticipant({ ...participant, role: e.target.value })}
              >
                <option value="Giảng viên">Giảng viên</option>
                <option value="Cán bộ QL">Cán bộ QL</option>
                <option value="Sinh viên">Sinh viên</option>
                <option value="Chuyên gia">Chuyên gia</option>
              </select>
            </div>
            <div>
              <label className="form-label">Đơn vị / Khoa / Viện *</label>
              <input 
                type="text" 
                className="input" 
                placeholder="VD: Khoa CNTT" 
                value={participant.unit}
                onChange={(e) => setParticipant({ ...participant, unit: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="form-label">Trình độ học vấn</label>
              <select 
                className="input"
                value={participant.education}
                onChange={(e) => setParticipant({ ...participant, education: e.target.value })}
              >
                <option value="Đại học">Đại học</option>
                <option value="Thạc sĩ">Thạc sĩ</option>
                <option value="Tiến sĩ">Tiến sĩ</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
            <button type="submit" className="btn btn-primary">
              Tiếp theo
              <ArrowRight size={18} />
            </button>
          </div>
        </form>
      ) : (
        <div className="card" style={{ padding: '2rem' }}>
          {/* PHẦN B: THANG ĐO ĐỊNH LƯỢNG */}
          <div style={{ marginBottom: '1.75rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>
              Phần B: Thang đo đánh giá ý kiến định lượng
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Vui lòng chọn mức độ đồng ý của bạn với từng nhận định dưới đây theo thang đo {surveyInfo?.scale || 'Likert 5'} điểm.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2rem' }}>
            {questions.filter(q => !q.type || q.type === 'likert').map((q, idx) => {
              const qKey = q.code || `q_${idx}`;
              const selectedVal = answers[qKey] || 4;

              return (
                <div key={qKey} style={{ padding: '1.25rem', backgroundColor: '#F9FAFB', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: '700', padding: '0.2rem 0.5rem', backgroundColor: '#EEF2FF', color: 'var(--primary)', borderRadius: '4px' }}>
                      {q.code || `Câu ${idx + 1}`}
                    </span>
                    {q.variable && (
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', border: '1px solid var(--border-color)', padding: '0.1rem 0.4rem', borderRadius: '4px', backgroundColor: 'white' }}>
                        Nhân tố {q.variable}
                      </span>
                    )}
                  </div>
                  <div style={{ fontWeight: '600', marginBottom: '1rem', fontSize: '0.95rem' }}>
                    {q.text}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${scaleOptions.length}, 1fr)`, gap: '0.5rem' }}>
                    {scaleOptions.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setAnswers({ ...answers, [qKey]: opt.value })}
                        style={{
                          padding: '0.625rem 0.25rem',
                          borderRadius: 'var(--radius-md)',
                          textAlign: 'center',
                          fontSize: '0.7rem',
                          fontWeight: '600',
                          border: selectedVal === opt.value ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                          backgroundColor: selectedVal === opt.value ? 'var(--primary)' : 'white',
                          color: selectedVal === opt.value ? 'white' : 'var(--text-main)',
                          transition: 'all 0.15s ease',
                          cursor: 'pointer'
                        }}
                      >
                        <div style={{ fontSize: '1.125rem', marginBottom: '0.25rem' }}>{opt.value}</div>
                        <div>{opt.label}</div>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* PHẦN C: Ý KIẾN ĐỊNH TÍNH / TỰ LUẬN (NẾU CÓ CÂU HỎI TEXT) */}
          {questions.some(q => q.type === 'textarea' || q.type === 'text' || q.type === 'choice') && (
            <div style={{ marginTop: '2.5rem', paddingTop: '2rem', borderTop: '2px dashed var(--border-color)' }}>
              <div style={{ marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.25rem', color: '#1E293B' }}>
                  Phần C: Ý kiến đóng góp &amp; Nhận xét định tính
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                  Xin vui lòng chia sẻ thêm góc nhìn, khó khăn thực tế và đề xuất của bạn để hoàn thiện nghiên cứu.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2rem' }}>
                {questions.filter(q => q.type === 'textarea' || q.type === 'text' || q.type === 'choice').map((q, idx) => {
                  const qKey = q.code || `txt_${idx}`;
                  const val = answers[qKey] || '';

                  return (
                    <div key={qKey} style={{ padding: '1.25rem', backgroundColor: '#F8FAFC', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: '700', padding: '0.2rem 0.5rem', backgroundColor: '#FEF3C7', color: '#92400E', borderRadius: '4px' }}>
                          {q.code || `Ý kiến ${idx + 1}`}
                        </span>
                        <span style={{ fontSize: '0.7rem', color: '#B45309', border: '1px solid #FDE68A', padding: '0.1rem 0.4rem', borderRadius: '4px', backgroundColor: 'white', fontWeight: '600' }}>
                          Thu thập ý kiến văn bản
                        </span>
                      </div>
                      <div style={{ fontWeight: '600', marginBottom: '0.75rem', fontSize: '0.95rem' }}>
                        {q.text}
                      </div>

                      {q.type === 'textarea' || !q.type ? (
                        <textarea
                          className="input"
                          style={{ width: '100%', minHeight: '110px', resize: 'vertical', lineHeight: '1.6', fontFamily: 'inherit', fontSize: '0.9rem', padding: '0.75rem' }}
                          placeholder={q.placeholder || 'Vui lòng chia sẻ nhận xét chi tiết của bạn tại đây...'}
                          value={val}
                          onChange={(e) => setAnswers({ ...answers, [qKey]: e.target.value })}
                        />
                      ) : q.type === 'choice' ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          {(q.options || ['Rất phù hợp', 'Bình thường', 'Cần điều chỉnh thêm']).map((opt, oIdx) => (
                            <label key={oIdx} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.625rem 0.75rem', backgroundColor: 'white', borderRadius: '6px', border: val === opt ? '2px solid var(--primary)' : '1px solid var(--border-color)', cursor: 'pointer' }}>
                              <input
                                type="radio"
                                name={qKey}
                                value={opt}
                                checked={val === opt}
                                onChange={() => setAnswers({ ...answers, [qKey]: opt })}
                              />
                              <span style={{ fontSize: '0.875rem', fontWeight: val === opt ? '600' : '400' }}>{opt}</span>
                            </label>
                          ))}
                        </div>
                      ) : (
                        <input
                          type="text"
                          className="input"
                          style={{ width: '100%' }}
                          placeholder={q.placeholder || 'Nhập câu trả lời ngắn...'}
                          value={val}
                          onChange={(e) => setAnswers({ ...answers, [qKey]: e.target.value })}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
            <button type="button" className="btn btn-outline" onClick={() => setStep(1)} disabled={loading}>
              <ArrowLeft size={18} />
              Quay lại
            </button>
            <button type="button" className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
              {loading ? 'Đang lưu...' : (
                <>
                  <Send size={18} />
                  Nộp phiếu khảo sát
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PublicSurvey;
