const { query } = require('../config/dbPostgres');

exports.getDashboardData = async (req, res) => {
  try {
    // Song song 4 query để tối ưu performance
    const [
      { rows: surveyStat },
      { rows: respStat },
      { rows: roleRows },
      { rows: dateRows }
    ] = await Promise.all([
      query(`SELECT count(id) as totalSurveys FROM surveys`),
      query(`SELECT count(id) as totalResponses, sum(case when status='valid' then 1 else 0 end) as validResponses FROM responses`),
      query(`SELECT role, count(id) as value FROM responses GROUP BY role`),
      query(`SELECT date, count(id) as count FROM responses GROUP BY date`)
    ]);

    const totalSurveys = surveyStat[0]?.totalSurveys || 0;
    const totalResponses = respStat[0]?.totalResponses || 0;
    const validResponses = respStat[0]?.validResponses || 0;

    let pieData = [];
    if (roleRows && roleRows.length > 0) {
      pieData = roleRows.map(r => ({ name: r.role, value: parseInt(r.value, 10) }));
    } else {
      pieData = [
        { name: 'Chuyên gia', value: 0 },
        { name: 'Cán bộ QL', value: 0 },
        { name: 'Giảng viên', value: 0 },
        { name: 'Sinh viên', value: 0 }
      ];
    }

    // Xử lý date data - date là TIMESTAMPTZ, cần format về DD/MM/YYYY
    const dateMap = {};
    if (dateRows) {
      dateRows.forEach(r => {
        if (r.date) {
          // date có thể là ISO string hoặc Date object
          const d = new Date(r.date);
          const key = `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
          dateMap[key] = parseInt(r.count, 10);
        }
      });
    }

    // Tạo danh sách 7 ngày gần nhất
    const areaData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const day = d.getDate();
      const month = d.getMonth() + 1;

      const keyStandard = `${day}/${month}/${d.getFullYear()}`;
      const keyPadded = `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${d.getFullYear()}`;

      const count = dateMap[keyStandard] || dateMap[keyPadded] || 0;
      const label = `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}`;

      areaData.push({
        name: label,
        value: count
      });
    }

    res.json({
      totalSurveys,
      totalResponses,
      validResponses,
      totalAnalysis: totalSurveys > 0 ? 3 : 0,
      areaData,
      pieData
    });
  } catch (err) {
    console.error('[DASHBOARD ERROR]', err);
    res.status(500).json({ error: 'Lỗi truy xuất dữ liệu dashboard.' });
  }
};