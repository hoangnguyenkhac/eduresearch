const { OFFICIAL_SURVEYS } = require('../data/questionnaires');
const fs = require('fs');
const path = require('path');

let sql = `-- Migration: 003_seed_official_surveys.sql
-- Nạp 4 bộ bảng hỏi khảo sát mẫu chuẩn hóa cho Supabase PostgreSQL

`;

OFFICIAL_SURVEYS.forEach((s) => {
  const title = s.title.replace(/'/g, "''");
  const subtitle = (s.subtitle || '').replace(/'/g, "''");
  const institution = (s.institution || 'Cơ sở giáo dục đại học').replace(/'/g, "''");
  const questionsJson = JSON.stringify(s.questions).replace(/'/g, "''");
  const hypothesesJson = JSON.stringify(s.hypotheses).replace(/'/g, "''");
  const vars = s.variables;
  const qCount = s.questions.length;
  const target = s.target;
  const audience = s.audience;
  const scale = s.scale;
  const status = s.status;

  sql += `INSERT INTO surveys (title, subtitle, audience, institution, questions_count, status, scale, responses_count, target, variables, questions, hypotheses, created_at)
VALUES ('${title}', '${subtitle}', '${audience}', '${institution}', ${qCount}, '${status}', '${scale}', 0, ${target}, '${vars}', '${questionsJson}', '${hypothesesJson}', NOW());

`;
});

const targetPath = path.resolve(__dirname, '../migrations/003_seed_official_surveys.sql');
fs.writeFileSync(targetPath, sql, 'utf8');
console.log('Successfully generated 003_seed_official_surveys.sql at:', targetPath);
