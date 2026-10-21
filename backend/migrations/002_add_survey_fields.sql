-- Migration: 002_add_survey_fields.sql
-- Thêm các trường hỗ trợ 4 bộ khảo sát chuẩn hóa và phân tích cơ cấu đối tượng

-- 1. Bổ sung các cột mới cho bảng surveys
ALTER TABLE surveys ADD COLUMN IF NOT EXISTS audience TEXT;
ALTER TABLE surveys ADD COLUMN IF NOT EXISTS subtitle TEXT;
ALTER TABLE surveys ADD COLUMN IF NOT EXISTS institution TEXT DEFAULT 'Cơ sở giáo dục đại học';

-- Chỉ mục cho trường đối tượng
CREATE INDEX IF NOT EXISTS idx_surveys_audience ON surveys(audience);

-- 2. Bổ sung cột đơn vị/trường đại học cho bảng responses
ALTER TABLE responses ADD COLUMN IF NOT EXISTS institution TEXT;
