const express = require('express');
const router = express.Router();
const db = require('../database');

// GET dashboard statistics
router.get('/', (req, res) => {
  try {
    const totalRooms = db.prepare('SELECT COUNT(*) as count FROM rooms').get().count;
    const occupiedRooms = db.prepare("SELECT COUNT(*) as count FROM rooms WHERE status = 'terisi'").get().count;
    const availableRooms = db.prepare("SELECT COUNT(*) as count FROM rooms WHERE status = 'tersedia'").get().count;
    const maintenanceRooms = db.prepare("SELECT COUNT(*) as count FROM rooms WHERE status = 'perbaikan'").get().count;
    const activeTenants = db.prepare("SELECT COUNT(*) as count FROM tenants WHERE status = 'aktif'").get().count;
    const totalOccupants = db.prepare("SELECT COALESCE(SUM(occupants_count), 0) as total FROM tenants WHERE status = 'aktif'").get().total;

    // Estimated monthly revenue from all active tenants
    const monthlyPotentialIncome = db.prepare("SELECT COALESCE(SUM(rent_price), 0) as total FROM tenants WHERE status = 'aktif'").get().total;

    // Payments received this month
    const now = new Date();
    const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const incomeThisMonth = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total 
      FROM payments 
      WHERE strftime('%Y-%m', payment_date) = ?
    `).get(currentYearMonth).total;

    // Count pending dues (overdue or upcoming <= 5 days)
    const activeTenantsList = db.prepare("SELECT id, check_in_date, rent_price FROM tenants WHERE status = 'aktif'").all();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let overdueCount = 0;
    let upcomingCount = 0;

    for (const tenant of activeTenantsList) {
      const latestPayment = db.prepare(`
        SELECT period_end FROM payments 
        WHERE tenant_id = ? 
        ORDER BY period_end DESC 
        LIMIT 1
      `).get(tenant.id);

      let dueDate;
      if (!latestPayment) {
        dueDate = new Date(tenant.check_in_date);
      } else {
        dueDate = new Date(latestPayment.period_end);
      }
      dueDate.setHours(0, 0, 0, 0);

      const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays < 0) {
        overdueCount++;
      } else if (diffDays <= 5) {
        upcomingCount++;
      }
    }

    res.json({
      success: true,
      data: {
        totalRooms,
        occupiedRooms,
        availableRooms,
        maintenanceRooms,
        occupancyRate: totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0,
        activeTenants,
        totalOccupants,
        monthlyPotentialIncome,
        incomeThisMonth,
        overdueCount,
        upcomingCount
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
