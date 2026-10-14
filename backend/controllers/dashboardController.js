const db = require('../config/db');

exports.getDashboardData = (req, res) => {
  db.get(`SELECT count(id) as totalSurveys FROM surveys`, [], (err, surveyStat) => {
    if (err) return res.status(500).json({ error: err.message });

    db.get(`SELECT count(id) as totalResponses, sum(case when status='valid' then 1 else 0 end) as validResponses FROM responses`, [], (respErr, respStat) => {
      if (respErr) return res.status(500).json({ error: respErr.message });

      db.all(`SELECT role, count(id) as value FROM responses GROUP BY role`, [], (roleErr, roleRows) => {
        const totalSurveys = surveyStat ? (surveyStat.totalSurveys || 0) : 0;
        const totalResponses = respStat ? (respStat.totalResponses || 0) : 0;
        const validResponses = respStat ? (respStat.validResponses || 0) : 0;

        let pieData = [];
        if (roleRows && roleRows.length > 0) {
          pieData = roleRows.map(r => ({ name: r.role, value: r.value }));
        } else {
          pieData = [
            { name: 'Chuyên gia', value: 0 },
            { name: 'Cán bộ QL', value: 0 },
            { name: 'Giảng viên', value: 0 },
            { name: 'Sinh viên', value: 0 }
          ];
        }

        const areaData = [
          { name: 'T1', value: Math.min(totalResponses, 5) },
          { name: 'T2', value: Math.min(totalResponses, 15) },
          { name: 'T3', value: Math.min(totalResponses, 30) },
          { name: 'T4', value: Math.min(totalResponses, 50) },
          { name: 'T5', value: Math.min(totalResponses, 80) },
          { name: 'T6', value: Math.min(totalResponses, 120) },
          { name: 'T7', value: totalResponses }
        ];

        res.json({
          totalSurveys,
          totalResponses,
          validResponses,
          totalAnalysis: totalSurveys > 0 ? 3 : 0,
          areaData,
          pieData
        });
      });
    });
  });
};
