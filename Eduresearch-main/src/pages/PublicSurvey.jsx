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
  { code: 'SP1', text: 'Ban lãnh đạo đã xây dựng chiến lược và lộ trình chuyển đổi số dài hạn, rõ ràng cho nhà trường.', variable: 'SP' },
  { code: 'LD1', text: 'Ban lãnh đạo luôn thể hiện vai trò tiên phong, cam kết mạnh mẽ và truyền cảm hứng trong đổi mới công nghệ.', variable: 'LD' },
  { code: 'DX1', text: 'Toàn bộ quy trình quản trị, điều hành và thủ tục hành chính nội bộ đã được số hóa và chuẩn hóa đồng bộ.', variable: 'DX' },
  { code: 'AT1', text: 'Nhà trường có khả năng tái cấu trúc mô hình quản trị nhanh chóng trước sự biến động của môi trường giáo dục.', variable: 'AT' }
];

const isDemographic = (q) => q.section === 'demographics' || q.section === 'info';
const isLikert = (q) => !q.type || q.type === 'likert';
const isQualitative = (q) => (q.type === 'textarea' || q.type === 'text') && !isDemographic(q);

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
    gender: 'Không nêu',
    role: '',
    unit: ''
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
            if (q.type === 'textarea' || q.type === 'text' || q.type === 'choice') {
              initAnswers[key] = '';
            }
          });
          setAnswers(initAnswers);
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

  const demographicQuestions = questions.filter(isDemographic);
  const likertQuestions = questions.filter(isLikert);
  const qualitativeQuestions = questions.filter(isQualitative);

  const answeredCount = likertQuestions.filter(q => {
    const ans = answers[q.code];
    return ans !== undefined && ans !== null && ans !== '';
  }).length;
  const progressPercent = step === 1 ? 30 : Math.min(100, Math.round(30 + (answeredCount / Math.max(1, likertQuestions.length)) * 70));

  const handleNextStep = (e) => {
    e.preventDefault();
    if (demographicQuestions.length > 0) {
      const missing = demographicQuestions.find(q => !answers[q.code]);
      if (missing) {
        alert('Vui lòng điền đầy đủ thông tin chung trước khi tiếp tục.');
        return;
      }
      const mapped = { ...participant };
      demographicQuestions.forEach((q) => {
        if (q.mapsTo === 'role') mapped.role = answers[q.code];
        if (q.mapsTo === 'unit') mapped.unit = answers[q.code];
        if (q.mapsTo === 'gender') mapped.gender = answers[q.code];
      });
      if (!mapped.role) mapped.role = answers[demographicQuestions[0].code] || 'Người tham gia';
      if (!mapped.unit) mapped.unit = surveyInfo?.audience === 'student' ? 'Sinh viên' : (surveyInfo?.audience === 'staff' ? 'Giảng viên / CBNV' : 'Ban lãnh đạo');
      setParticipant(mapped);
    } else if (!participant.role || !participant.unit) {
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
        <p style={{ color: 'var(--text-muted)', maxWidth: '640px', margin: '0 auto' }}>
          {surveyInfo?.subtitle || (surveyInfo ? `Bảng hỏi #${surveyInfo.id} • Thang đo: ${surveyInfo.scale}` : 'Phiếu thu thập dữ liệu nghiên cứu trực tuyến')}
        </p>
        {surveyInfo && (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.35rem' }}>
            Thang đo: {surveyInfo.scale} • {likertQuestions.length} câu Likert • {qualitativeQuestions.length} câu mở
          </p>
        )}
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
          <span>Bước {step} / 2: {step === 1 ? 'Thông tin chung' : `Nội dung khảo sát (${answeredCount}/${likertQuestions.length} câu Likert)`}</span>
          <span style={{ color: 'var(--primary)', fontWeight: '700' }}>{progressPercent}% Hoàn thành</span>
        </div>
        <div style={{ width: '100%', height: '8px', backgroundColor: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{ width: `${progressPercent}%`, height: '100%', background: 'linear-gradient(90deg, #3B82F6, #10B981)', borderRadius: '4px', transition: 'width 0.3s ease' }}></div>
        </div>
      </div>

      {step === 1 ? (
        <form onSubmit={handleNextStep} className="card" style={{ padding: '2rem' }}>
          <div style={{ marginBottom: '1.75rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>Phần I: Thông tin chung</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Thông tin này phục vụ phân tích cơ cấu mẫu nghiên cứu. Hoàn toàn bảo mật và vô danh.</p>
          </div>

          {demographicQuestions.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '2rem' }}>
              {demographicQuestions.map((q) => (
                <div key={q.code}>
                  <label className="form-label">{q.text} *</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {(q.options || []).map((opt) => (
                      <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.7rem 0.85rem', backgroundColor: answers[q.code] === opt ? '#EEF2FF' : '#F9FAFB', borderRadius: '8px', border: answers[q.code] === opt ? '2px solid var(--primary)' : '1px solid var(--border-color)', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name={q.code}
                          value={opt}
                          checked={answers[q.code] === opt}
                          onChange={() => setAnswers({ ...answers, [q.code]: opt })}
                        />
                        <span style={{ fontSize: '0.9rem', fontWeight: answers[q.code] === opt ? '600' : '400' }}>{opt}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '2rem' }}>
              <div>
                <label className="form-label">Đối tượng / Chức danh *</label>
                <select
                  className="input"
                  value={participant.role}
                  onChange={(e) => setParticipant({ ...participant, role: e.target.value })}
                  required
                >
                  <option value="">-- Chọn --</option>
                  <option value="Cán bộ QL">Ban lãnh đạo / Quản lý</option>
                  <option value="Giảng viên">Giảng viên / Cán bộ nhân viên</option>
                  <option value="Sinh viên">Học viên / Sinh viên</option>
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
            </div>
          )}

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
              Phần II: Nội dung khảo sát (Thang đo Likert 5 mức độ)
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              1: Hoàn toàn không đồng ý · 2: Không đồng ý · 3: Trung lập · 4: Đồng ý · 5: Hoàn toàn đồng ý
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2rem' }}>
            {likertQuestions.map((q, idx) => {
              const qKey = q.code || `q_${idx}`;
              const selectedVal = answers[qKey];
              const showGroup = q.group && (idx === 0 || likertQuestions[idx - 1].group !== q.group);

              return (
                <div key={qKey}>
                  {showGroup && (
                    <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--primary)', margin: '0.5rem 0 0.75rem' }}>
                      {q.group}
                    </h3>
                  )}
                  <div style={{ padding: '1.25rem', backgroundColor: '#F9FAFB', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
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
                </div>
              );
            })}
          </div>

          {qualitativeQuestions.length > 0 && (
            <div style={{ marginTop: '2.5rem', paddingTop: '2rem', borderTop: '2px dashed var(--border-color)' }}>
              <div style={{ marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.25rem', color: '#1E293B' }}>
                  Phần III: Câu hỏi mở (Định tính)
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                  Xin vui lòng chia sẻ thêm góc nhìn, khó khăn thực tế và đề xuất của bạn.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2rem' }}>
                {qualitativeQuestions.map((q, idx) => {
                  const qKey = q.code || `txt_${idx}`;
                  const val = answers[qKey] || '';

                  return (
                    <div key={qKey} style={{ padding: '1.25rem', backgroundColor: '#F8FAFC', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: '700', padding: '0.2rem 0.5rem', backgroundColor: '#FEF3C7', color: '#92400E', borderRadius: '4px' }}>
                          Câu {idx + 1}
                        </span>
                      </div>
                      <div style={{ fontWeight: '600', marginBottom: '0.75rem', fontSize: '0.95rem' }}>
                        {q.text}
                      </div>
                      <textarea
                        className="input"
                        style={{ width: '100%', minHeight: '110px', resize: 'vertical', lineHeight: '1.6', fontFamily: 'inherit', fontSize: '0.9rem', padding: '0.75rem' }}
                        placeholder={q.placeholder || 'Vui lòng chia sẻ nhận xét chi tiết của bạn tại đây...'}
                        value={val}
                        onChange={(e) => setAnswers({ ...answers, [qKey]: e.target.value })}
                      />
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
