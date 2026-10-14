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

        db.all(`SELECT date, count(id) as count FROM responses GROUP BY date`, [], (dateErr, dateRows) => {
          const dateMap = {};
          if (dateRows) {
            dateRows.forEach(r => {
              if (r.date) dateMap[r.date] = r.count;
            });
          }

          // Tạo danh sách 7 ngày gần nhất để biểu đồ so sánh xu hướng theo ngày thực tế
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
        });
      });
    });
  });
};
