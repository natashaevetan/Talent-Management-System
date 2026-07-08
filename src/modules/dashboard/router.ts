import { Router } from "express";
import { prisma } from "../../lib/prisma";
import { asyncHandler } from "../../middleware/errorHandler";
import { requireAuth } from "../../middleware/requireAuth";
import { daysLeft, totalEmployerCost, talentRevenue } from "../../lib/computed";
import { RENEWAL_THRESHOLDS } from "../../config/businessRules";
import { talentInclude } from "../talents/serialize";

export const dashboardRouter = Router();
dashboardRouter.use(requireAuth);

dashboardRouter.get(
  "/home",
  asyncHandler(async (_req, res) => {
    const today = new Date();
    const talents = await prisma.talent.findMany({ where: { active: true }, include: talentInclude });

    let pendingStart = 0;
    let onNotice = 0;
    let expiredContracts = 0;
    let expiringWorkPasses = 0;
    let expiringContracts = 0;
    let monthlyRevenue = 0;
    let monthlyCost = 0;

    for (const t of talents) {
      const contractDaysLeftValue = t.contract ? daysLeft(t.contract.contractEnd, today) : null;
      const passDaysLeftValue = t.workPass ? daysLeft(t.workPass.passExpiry, today) : null;

      if (t.contract && t.contract.contractStart > today) pendingStart++;
      if (contractDaysLeftValue !== null && contractDaysLeftValue >= 0 && contractDaysLeftValue <= 30) onNotice++;
      if (contractDaysLeftValue !== null && contractDaysLeftValue < 0) expiredContracts++;
      if (passDaysLeftValue !== null && passDaysLeftValue >= 0 && passDaysLeftValue <= RENEWAL_THRESHOLDS.homeDashboardExpiringDays) expiringWorkPasses++;
      if (contractDaysLeftValue !== null && contractDaysLeftValue >= 0 && contractDaysLeftValue <= RENEWAL_THRESHOLDS.homeDashboardExpiringDays) expiringContracts++;

      if (t.payroll && t.talentBilling && t.workPass) {
        monthlyRevenue += talentRevenue(t.talentBilling.chargeRate, t.talentBilling.billingType);
        monthlyCost += totalEmployerCost(t.payroll, t.workPass.workPassType);
      }
    }

    const [pendingSow, pendingPo, pendingInvoices, pendingTimesheets] = await Promise.all([
      prisma.sowRecord.count({ where: { sowRequired: true, sowStatus: { notIn: ["Completed", "N/A"] } } }),
      prisma.poRecord.count({ where: { poRequired: true, poStatus: { notIn: ["Completed", "N/A"] } } }),
      prisma.talentBilling.count({ where: { invoiceStatus: { not: "Paid" } } }),
      prisma.leaveTimesheet.count({ where: { timesheetSubmitted: false } }),
    ]);

    res.json({
      totalActiveTalents: talents.length - pendingStart - expiredContracts,
      pendingStart,
      onNotice,
      expiredContracts,
      expiringWorkPasses,
      expiringContracts,
      pendingSow,
      pendingPo,
      pendingInvoices,
      pendingTimesheets,
      monthlyRevenue,
      monthlyCost,
      monthlyGrossProfit: monthlyRevenue - monthlyCost,
      // Trend vs prior period intentionally omitted — no fake history; real trend data
      // becomes available once monthly snapshots (Phase 5) have accumulated real history.
    });
  })
);
