import bcrypt from "bcrypt";
import { prisma } from "../src/lib/prisma";
import { toJson } from "../src/lib/json";

/* ---------- RNG helpers (ported from the IT1_1.html mockup's generators) ---------- */

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function pick<T>(arr: T[]): T {
  return arr[randInt(0, arr.length - 1)];
}
function addDays(base: Date, days: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}
function addMonths(base: Date, n: number): Date {
  return new Date(base.getFullYear(), base.getMonth() + n, 1);
}

const today = new Date();

/* ---------- Reference data pools (verbatim from the mockup) ---------- */

const firstNames = [
  "Wei Ling", "Kumar", "Aisyah", "Chen Jie", "Ravi", "Nurul", "Hafiz", "Mei Ling", "Arun", "Farah",
  "Zhi Hao", "Priya", "Amirah", "Sanjay", "Siti", "Kai Xuan", "Deepa", "Faizal", "Yu Ting", "Vikram",
  "Nadia", "Boon Keng", "Lakshmi", "Haziq", "Suresh", "Thi Huong", "Van Anh", "Aung", "Min Thu", "Kyaw",
  "Grace", "Marcus", "Daniel", "Sophia", "Ethan", "Chloe", "Nathan", "Isabelle", "James", "Olivia",
  "Rizwan", "Fatimah", "Imran", "Kavya", "Ahmad", "Michelle", "Jaya", "Bala", "Nur Aina", "Zulkifli",
];
const lastNames = [
  "Tan", "Lim", "Lee", "Kumar", "Ng", "Wong", "Ismail", "Ong", "Chua", "Rahman",
  "Singh", "Goh", "Yeo", "Chong", "Aziz", "Teo", "Hussein", "Koh", "Sundaram", "Nair",
  "Nguyen", "Tran", "Pham", "Aung", "Win", "Naidu", "Menon", "Farrukh", "Basri", "Osman",
];
const baseClients = [
  "DBS Bank", "OCBC", "Singtel", "Grab", "SPH Media", "CapitaLand", "ST Engineering",
  "GovTech", "MOH Holdings", "Republic Polytechnic",
];
const projectTypeNames = [
  "Application Development", "Infrastructure Support", "Data Migration",
  "Cloud Engineering", "QA & Testing", "Cybersecurity", "Business Analysis", "Project Management",
];
const workPassTypes = ["EP", "S Pass", "Work Permit", "Singapore Citizen", "PR"];
const sowStatusesFlavor = ["Signed", "Pending", "Drafted"];
const poStatusesFlavor = ["Received", "Raised", "Pending"];
const noticePeriods = ["2 weeks", "1 month", "2 months", "3 months"];
const uploadStatuses = ["Uploaded", "Not Uploaded"];
const signedUploadStatuses = ["Uploaded", "Pending"];
const contractRenewalStatuses = ["Not Started", "In Progress", "Completed"];
const contractRemarksPool = ["None", "Client requested extension", "Pending client sign-off", "Rate renegotiation in progress", "Awaiting legal review", "No issues"];
const renewalRemarksPool = ["", "", "", "", "Client on extended leave, renewal delayed", "Awaiting client budget approval", "Talent considering exit, holding renewal", "Pending updated rate card from client"];
const passRenewalRemarksPool = ["", "", "", "", "Awaiting MOM approval", "Talent's passport renewal pending", "Pending updated employment contract for application", "Client HR yet to confirm continued placement"];
const policyRemarksPool = ["", "", "", "", "Awaiting insurer's renewal quote", "Talent on medical leave, policy review delayed", "Pending updated headcount from client for group policy", "Switching insurer, new policy being finalised"];
const billingTypes = ["Monthly", "Daily"];
const invoiceStatuses = ["Paid", "Pending", "Overdue"];
const nationalities = ["Singaporean", "Malaysian", "Indian", "Chinese", "Filipino", "Myanmar", "Vietnamese", "Indonesian"];
const maritalStatuses = ["Single", "Married"];
const jobTitles = ["Software Engineer", "DevOps Engineer", "QA Analyst", "Business Analyst", "Cloud Architect", "Data Engineer", "Security Analyst", "Project Coordinator", "Systems Analyst", "Technical Lead"];
const skillPool = ["Java", "Python", "AWS", "Azure", "React", "Node.js", "Kubernetes", "SQL", "Terraform", "Selenium", "Power BI", "C#", "Docker", "Agile", "ServiceNow"];
const workLocations = ["Client Site", "Hybrid", "Remote", "Onsite - HQ"];
const streetNames = ["Ang Mo Kio Ave", "Tampines St", "Bedok North Rd", "Jurong West St", "Yishun Ring Rd", "Clementi Ave", "Toa Payoh Lor", "Punggol Way"];
const caseOwnerNames = ["James Lee", "Sarah Koh", "Peter Lim", "Michelle Tan", "David Ong", "Rachel Ho"];
const entityNames = ["DHC", "Elitez", "E&A", "FMCG"];
const industries = ["Banking & Finance", "Telecommunications", "Technology", "Government", "Healthcare", "Retail & E-commerce", "Aviation", "Real Estate", "Manufacturing", "Media & Publishing", "Education"];
const accountManagers = ["Natasha", "Marcus Tan", "Priya Nair", "Daniel Wong", "Farah Aziz"];

const TALENT_COUNT = 80;

/* ---------- Per-entity field generators (ported 1:1 from the mockup) ---------- */

function randomProfileFields(firstName: string, lastName: string) {
  return {
    nric: `${pick(["S", "T"])}***${randInt(100, 999)}${pick(["A", "B", "C", "D", "E"])}`,
    dateOfBirth: addDays(today, -randInt(21 * 365, 60 * 365)),
    sex: pick(["Male", "Female"]),
    bankAccount: `•••• •••• ${randInt(1000, 9999)}`,
    nationality: pick(nationalities),
    maritalStatus: pick(maritalStatuses),
    dependants: randInt(0, 3),
    address: `Blk ${randInt(1, 999)} ${pick(streetNames)}, #${String(randInt(1, 20)).padStart(2, "0")}-${String(randInt(1, 99)).padStart(2, "0")}, Singapore ${randInt(100000, 829999)}`,
    contactNumber: `+65 9${randInt(100, 999)} ${randInt(1000, 9999)}`,
    email: `${firstName.toLowerCase().replace(/\s+/g, "")}.${lastName.toLowerCase().replace(/\s+/g, "")}@dynamichumancapital.com`,
    jobTitle: pick(jobTitles),
    skillset: [...new Set(Array.from({ length: 3 }, () => pick(skillPool)))],
    workLocation: pick(workLocations),
  };
}

function randomComplianceFields(contractStart: Date, workPassType: string, passExpiry: Date, passDaysLeftValue: number) {
  const isForeignPass = ["EP", "S Pass", "Work Permit"].includes(workPassType);
  const passIssueDate = isForeignPass ? addDays(contractStart, randInt(0, 20)) : null;
  const passStatus = !isForeignPass ? "N/A" : passDaysLeftValue < 0 ? "Expired" : pick(["Issued", "Issued", "Issued", "Approved", "Pending Approval"]);
  const ipaDate = isForeignPass && passIssueDate && Math.random() < 0.3 ? addDays(passIssueDate, -randInt(5, 15)) : null;
  const passportExpiry = workPassType !== "Singapore Citizen" ? addDays(today, randInt(60, 900)) : null;
  const medicalCheckupStatus = ["Work Permit", "S Pass"].includes(workPassType) ? pick(["Completed", "Pending"]) : "Not Required";
  const medicalInsuranceStatus = isForeignPass ? pick(["Active", "Active", "Expired"]) : "N/A";
  const wicaCoverageStatus = isForeignPass ? pick(["Covered", "Covered", "Not Covered"]) : "N/A";
  const renewalRequired = isForeignPass && passDaysLeftValue <= 90;
  const renewalStatus = !isForeignPass ? "N/A" : renewalRequired ? pick(contractRenewalStatuses) : "Not Started";
  const educationVerificationStatus = pick(["Completed", "Completed", "Completed", "Pending", "Not Required"]);
  const passRenewalCompletedSeq = renewalStatus === "Completed" ? 1 : 0;
  let passLifecycleStatus = "";
  if (isForeignPass) {
    if (passStatus === "Expired") passLifecycleStatus = pick(["Inactive", "Inactive", ""]);
    else if (["Pending Approval", "Application Submitted", "Not Started"].includes(passStatus)) passLifecycleStatus = pick(["Pending Application", "Pending Application", ""]);
  }
  return {
    workPassType, passIssueDate, passExpiry, passStatus, ipaDate, passportExpiry,
    medicalCheckupStatus, medicalInsuranceStatus, wicaCoverageStatus,
    renewalRequired, renewalStatus, educationVerificationStatus,
    passRenewalCompletedSeq, passDatesUpdatedSeq: 0,
    passRenewalRemarks: pick(passRenewalRemarksPool), passLifecycleStatus,
  };
}

function randomPolicyFields(contractStart: Date) {
  const policyType = pick(["Policy 1", "Policy 1", "Policy 2A", "Policy 2A", "Not Required"]);
  if (policyType === "Not Required") {
    return { policyType, policyIssueDate: null, policyExpiry: null, policyRenewalRequired: false, policyRenewalStatus: "Not Started", policyRemarks: "", policyRenewalCompletedSeq: 0, policyDatesUpdatedSeq: 0 };
  }
  const policyIssueDate = addDays(contractStart, randInt(0, 20));
  const policyExpiry = addDays(today, randInt(-10, 400));
  const policyDaysLeftNow = Math.ceil((policyExpiry.getTime() - today.getTime()) / 86_400_000);
  const policyRenewalRequired = policyDaysLeftNow <= 90;
  const policyRenewalStatus = policyRenewalRequired ? pick(contractRenewalStatuses) : "Not Started";
  const policyRenewalCompletedSeq = policyRenewalStatus === "Completed" ? 1 : 0;
  return { policyType, policyIssueDate, policyExpiry, policyRenewalRequired, policyRenewalStatus, policyRemarks: pick(policyRemarksPool), policyRenewalCompletedSeq, policyDatesUpdatedSeq: 0 };
}

function randomPayrollFields(salary: number) {
  return {
    salary,
    cpf: Math.round(salary * 0.17),
    skillsDevelopmentLevy: randInt(5, 40),
    wica: randInt(5, 25),
    medicalInsuranceCost: randInt(40, 150),
    allowances: pick([0, 0, 50, 100, 150, 200, 300]),
    claimsReimbursements: pick([0, 0, 20, 50, 80, 120, 200]),
    overtime: Math.random() < 0.3 ? randInt(50, 400) : 0,
    noPayLeaveDeduction: Math.random() < 0.15 ? randInt(50, 300) : 0,
    otherStatutoryCosts: randInt(0, 20),
  };
}

function randomTalentBillingFields(talentId: number, chargeRate: number, billingType: string, invoiceStatus: string) {
  const workingDays = 22;
  const talentInvoiceAmount = billingType === "Daily" ? chargeRate * workingDays : chargeRate;
  const talentInvoiceDate = addDays(today, -randInt(0, 45));
  const talentInvoiceDueDate = addDays(talentInvoiceDate, 30);
  const talentInvoicePaidDate = invoiceStatus === "Paid" ? addDays(talentInvoiceDate, randInt(5, 28)) : null;
  return {
    chargeRate, billingType,
    talentInvoiceNumber: `INV-${today.getFullYear()}-${String(talentId).padStart(5, "0")}`,
    talentInvoiceDate, talentInvoiceDueDate, talentInvoiceAmount, invoiceStatus, talentInvoicePaidDate,
  };
}

function randomContractFields(contractDaysLeftValue: number) {
  const contractStatus = contractDaysLeftValue < 0 ? pick(["Expired", "Expired", "Terminated"]) : pick(["Signed", "Signed", "Signed", "Pending Signature", "Drafted"]);
  const signedContractUpload = contractStatus === "Signed" ? "Uploaded" : pick(signedUploadStatuses);
  const contractRenewalRequired = contractDaysLeftValue <= 90;
  const contractRenewalStatus = contractRenewalRequired ? pick(contractRenewalStatuses) : "Not Started";
  let contractLifecycleStatus = "";
  if (contractDaysLeftValue < 0) contractLifecycleStatus = pick(["Inactive", "Inactive", ""]);
  else if (contractDaysLeftValue <= 60 && contractRenewalRequired) contractLifecycleStatus = pick(["", "", "", "", "Notice Period"]);
  const renewalCompletedSeq = contractRenewalStatus === "Completed" ? 1 : 0;
  return {
    contractStatus, noticePeriod: pick(noticePeriods), contractUpload: pick(uploadStatuses), signedContractUpload,
    contractRenewalRequired, contractRenewalStatus, remarks: pick(contractRemarksPool),
    renewalCompletedSeq, datesUpdatedSeq: 0, renewalRemarks: pick(renewalRemarksPool), contractLifecycleStatus,
  };
}

function randomOffboardingChecklist() {
  const labels = ["Client Notified", "Final Salary", "Leave Settlement", "Pass Cancellation", "Equipment Return", "Exit Form", "Final Invoice"];
  const progress = randInt(0, labels.length);
  return labels.map((label, idx) => ({ label, status: idx < progress ? "Completed" : idx === progress ? "In Progress" : "Pending" }));
}

function randomOffboardingFields(contractEnd: Date, contractDaysLeftValue: number) {
  return {
    lastWorkingDay: contractEnd,
    resignationReason: pick(["Resigned - new opportunity", "Contract completed", "Project ended", "Performance", "Client request", "Not Applicable"]),
    noticeServed: pick(["Yes", "Yes", "No"]),
    workPassCancellationDate: contractDaysLeftValue < 0 ? addDays(contractEnd, randInt(1, 10)) : null,
    clientNotified: pick(["Yes", "No"]),
    replacementRequired: pick(["Yes", "No"]),
    finalInvoiceIssued: pick(["Yes", "No"]),
    exitDocsCompleted: pick(["Yes", "No"]),
    offboardingRemarks: pick(["None", "Pending clearance", "Awaiting final approval", "Handover completed", "IT assets returned"]),
    offboardingChecklist: toJson(randomOffboardingChecklist()),
  };
}

function randomLeaveTimesheetFields() {
  const annualTaken = randInt(0, 14);
  const sickTaken = randInt(0, 10);
  const oilEntitlement = randInt(0, 5);
  const oilTaken = randInt(0, oilEntitlement);
  const submitted = pick([true, true, true, false]);
  const submissionDate = submitted ? addDays(today, -randInt(1, 10)) : null;
  const clientApproved = submitted ? pick([true, true, false]) : false;
  const approvalDate = clientApproved && submissionDate ? addDays(submissionDate, randInt(1, 5)) : null;
  return {
    annualLeaveEntitlement: 14, annualLeaveTaken: annualTaken,
    sickLeaveEntitlement: 14, sickLeaveTaken: sickTaken,
    offInLieuEntitlement: oilEntitlement, offInLieuTaken: oilTaken,
    unpaidLeaveTaken: Math.random() < 0.12 ? randInt(1, 5) : 0,
    mcUpload: sickTaken > 0 ? "Uploaded" : "Not Applicable",
    leaveApprovalStatus: pick(["Approved", "Approved", "Approved", "Pending", "Rejected"]),
    timesheetMonth: today, workingDays: randInt(20, 23),
    timesheetSubmitted: submitted, submissionDate, clientApproved, approvalDate,
    overtimeHours: Math.random() < 0.3 ? randInt(2, 20) : 0,
    absenceDays: Math.random() < 0.15 ? randInt(1, 3) : 0,
    timesheetRemarks: pick(["None", "None", "Client requested MC copy", "Late submission", "Approved with adjustment"]),
  };
}

function randomClientBilling() {
  const invoiceDate = addDays(today, -randInt(0, 45));
  const invoiceStatus = pick(["Pending", "Issued", "Paid", "Overdue"]);
  return {
    billingType: pick(["Monthly", "Daily", "Hourly"]),
    chargeRate: randInt(400, 2000),
    currency: pick(["SGD", "SGD", "SGD", "USD"]),
    billableStart: addDays(today, -randInt(30, 400)),
    billableEnd: addDays(today, randInt(30, 400)),
    sowRequired: pick([true, true, false]),
    sowStatus: pick(["Drafted", "Pending", "Received", "Signed"]),
    poRequired: pick([true, false]),
    poStatus: pick(["Raised", "Pending", "Received"]),
    invoiceNumber: `INV-${today.getFullYear()}-${randInt(1000, 9999)}`,
    invoiceDate, invoiceAmount: randInt(10000, 150000), invoiceStatus,
    clientPaymentDueDate: addDays(invoiceDate, 30),
    clientPaymentReceivedDate: invoiceStatus === "Paid" ? addDays(invoiceDate, randInt(5, 35)) : null,
  };
}

function randomClientProfile() {
  const contactPerson = `${pick(firstNames)} ${pick(lastNames)}`;
  return {
    industry: pick(industries),
    contactPerson,
    contactEmail: `${contactPerson.toLowerCase().replace(/\s+/g, ".")}@client.com`,
    contactNumber: `+65 6${randInt(100, 999)} ${randInt(1000, 9999)}`,
    accountManager: pick(accountManagers),
    status: (Math.random() < 0.9 ? "ACTIVE" : "INACTIVE") as "ACTIVE" | "INACTIVE",
  };
}

/* ---------- Main seed routine ---------- */

async function main() {
  // Admin user
  const adminEmail = "natasha.tan@dhc.com.sg";
  const adminPassword = "changeme123";
  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!existingAdmin) {
    await prisma.user.create({
      data: { email: adminEmail, passwordHash: await bcrypt.hash(adminPassword, 12), name: "Natasha", role: "ADMIN" },
    });
    console.log(`Created admin user ${adminEmail} (password: ${adminPassword} — change after first login)`);
  }

  const talentCount = await prisma.talent.count();
  if (talentCount > 0) {
    console.log(`Talent table already has ${talentCount} rows — skipping demo data seed (already seeded).`);
    return;
  }

  // Lookups
  const projectTypes = await Promise.all(projectTypeNames.map((name) => prisma.projectType.create({ data: { name } })));
  const legalEntities = await Promise.all(entityNames.map((name) => prisma.legalEntity.create({ data: { name } })));
  const recruiters = await Promise.all(caseOwnerNames.map((name) => prisma.recruiter.create({ data: { name } })));

  // Clients + billing
  const clients = await Promise.all(
    baseClients.map((name) => {
      const profile = randomClientProfile();
      return prisma.client.create({
        data: {
          name,
          industry: profile.industry,
          contactPerson: profile.contactPerson,
          contactEmail: profile.contactEmail,
          contactNumber: profile.contactNumber,
          accountManager: profile.accountManager,
          status: profile.status,
          billing: { create: randomClientBilling() },
        },
      });
    })
  );
  console.log(`Seeded ${clients.length} clients.`);

  // Talents + all 1:1 child records
  type TalentSeed = { id: number; clientId: string; clientName: string; projectType: string };
  const createdTalents: TalentSeed[] = [];

  for (let i = 0; i < TALENT_COUNT; i++) {
    const firstName = pick(firstNames);
    const lastName = pick(lastNames);
    const name = `${firstName} ${lastName}`;
    const client = pick(clients);
    const projectType = pick(projectTypes);
    const salary = randInt(35, 120) * 100;
    const chargeRate = randInt(45, 180) * 10;
    const contractStart = addDays(today, -randInt(0, 500));
    const contractEnd = addDays(today, randInt(-10, 400));
    const passExpiry = addDays(today, randInt(-10, 400));
    const workPassType = pick(workPassTypes);
    const billingType = pick(billingTypes);
    const invoiceStatus = pick(invoiceStatuses);

    const contractDaysLeftValue = Math.ceil((contractEnd.getTime() - today.getTime()) / 86_400_000);
    const passDaysLeftValue = Math.ceil((passExpiry.getTime() - today.getTime()) / 86_400_000);

    const profile = randomProfileFields(firstName, lastName);
    const compliance = randomComplianceFields(contractStart, workPassType, passExpiry, passDaysLeftValue);
    const policy = randomPolicyFields(contractStart);
    const payroll = randomPayrollFields(salary);
    const contract = randomContractFields(contractDaysLeftValue);
    const offboarding = randomOffboardingFields(contractEnd, contractDaysLeftValue);
    const leaveTimesheet = randomLeaveTimesheetFields();

    const talent = await prisma.talent.create({
      data: {
        firstName, lastName, name,
        nric: profile.nric, dateOfBirth: profile.dateOfBirth, sex: profile.sex,
        nationality: profile.nationality, maritalStatus: profile.maritalStatus, dependants: profile.dependants,
        address: profile.address, contactNumber: profile.contactNumber, email: profile.email,
        bankAccount: profile.bankAccount, jobTitle: profile.jobTitle, skillset: toJson(profile.skillset),
        workLocation: profile.workLocation,
        clientId: client.id, projectTypeId: projectType.id,
        entityId: pick(legalEntities).id, caseOwnerId: pick(recruiters).id,
        contract: { create: { contractStart, contractEnd, ...contract } },
        workPass: { create: compliance },
        insurance: { create: policy },
        payroll: { create: payroll },
        leaveTimesheet: { create: leaveTimesheet },
        offboarding: { create: offboarding },
      },
    });

    // Created separately (rather than nested) so the invoice number can embed the real talent id.
    await prisma.talentBilling.create({
      data: { talentId: talent.id, ...randomTalentBillingFields(talent.id, chargeRate, billingType, invoiceStatus) },
    });

    createdTalents.push({ id: talent.id, clientId: client.id, clientName: client.name, projectType: projectType.name });
  }
  console.log(`Seeded ${createdTalents.length} talents with full 1:1 module records.`);

  // SOW records: one per unique (client, projectType) combination among generated talents
  let sowCount = 0;
  for (const client of clients) {
    const talentsForClient = createdTalents.filter((t) => t.clientId === client.id);
    const projectsForClient = [...new Set(talentsForClient.map((t) => t.projectType))];
    for (const project of projectsForClient) {
      const sowRequired = pick([true, true, true, false]);
      const sowStatus = !sowRequired ? "N/A" : pick(["Completed", "Completed", "Pending", "Drafted", "Yet to Draft"]);
      const hasDates = sowStatus !== "N/A";
      const dateOfCommencement = hasDates ? addDays(today, -randInt(10, 300)) : null;
      const dateOfCompletion = hasDates && dateOfCommencement ? addDays(dateOfCommencement, randInt(60, 365)) : null;
      const remarks = sowStatus === "Pending" ? "Waiting for client" : sowStatus === "Drafted" ? "Draft in progress" : sowStatus === "Yet to Draft" ? "Not started yet" : "";
      const matchingTalents = talentsForClient.filter((t) => t.projectType === project);
      const linkIds = [...new Set(Array.from({ length: Math.min(matchingTalents.length, randInt(1, 3)) }, () => pick(matchingTalents).id))];

      await prisma.sowRecord.create({
        data: {
          clientId: client.id, project, sowRequired, sowStatus,
          dateOfCommencement, dateOfCompletion, remarks,
          sowRenewalCompletedSeq: sowStatus === "Completed" ? 1 : 0, sowDatesUpdatedSeq: 0,
          talentLinks: { create: linkIds.map((talentId) => ({ talentId })) },
        },
      });
      sowCount++;
    }
  }
  console.log(`Seeded ${sowCount} SOW records.`);

  // PO records: one per (client, month) for the last 3 months
  let poCount = 0;
  for (const client of clients) {
    const talentsForClient = createdTalents.filter((t) => t.clientId === client.id);
    for (let i = 0; i < 3; i++) {
      const monthDate = addMonths(today, -i);
      const poRequired = pick([true, true, true, false]);
      const poStatus = !poRequired ? "N/A" : pick(["Completed", "Completed", "Pending", "Drafted", "Yet to Draft"]);
      const hasDates = poStatus !== "N/A";
      const dateOfCommencement = hasDates ? monthDate : null;
      const dateOfCompletion = hasDates ? addDays(monthDate, randInt(20, 40)) : null;
      const poNo = poStatus === "Completed" ? `PO-${client.name.replace(/[^A-Za-z]/g, "").slice(0, 3).toUpperCase()}-${monthDate.getFullYear()}${String(monthDate.getMonth() + 1).padStart(2, "0")}` : null;
      const remarks = poStatus === "Pending" ? "Awaiting approval" : poStatus === "Drafted" ? "Raised, pending client sign-off" : poStatus === "Yet to Draft" ? "Not started yet" : "";
      const linkIds = talentsForClient.length ? [...new Set(Array.from({ length: Math.min(talentsForClient.length, randInt(1, 3)) }, () => pick(talentsForClient).id))] : [];

      await prisma.poRecord.create({
        data: {
          clientId: client.id, month: monthDate, poRequired, poStatus, poNo,
          dateOfCommencement, dateOfCompletion, remarks,
          poRenewalCompletedSeq: poStatus === "Completed" ? 1 : 0, poDatesUpdatedSeq: 0,
          talentLinks: { create: linkIds.map((talentId) => ({ talentId })) },
        },
      });
      poCount++;
    }
  }
  console.log(`Seeded ${poCount} PO records.`);

  console.log("Seed complete.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
