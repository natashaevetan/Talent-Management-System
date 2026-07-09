/* ---------- Mock data ---------- */
const firstNames = ["Wei Ling","Kumar","Aisyah","Chen Jie","Ravi","Nurul","Hafiz","Mei Ling","Arun","Farah",
  "Zhi Hao","Priya","Amirah","Sanjay","Siti","Kai Xuan","Deepa","Faizal","Yu Ting","Vikram",
  "Nadia","Boon Keng","Lakshmi","Haziq","Suresh","Thi Huong","Van Anh","Aung","Min Thu","Kyaw",
  "Grace","Marcus","Daniel","Sophia","Ethan","Chloe","Nathan","Isabelle","James","Olivia",
  "Rizwan","Fatimah","Imran","Kavya","Ahmad","Michelle","Jaya","Bala","Nur Aina","Zulkifli"];
const lastNames = ["Tan","Lim","Lee","Kumar","Ng","Wong","Ismail","Ong","Chua","Rahman",
  "Singh","Goh","Yeo","Chong","Aziz","Teo","Hussein","Koh","Sundaram","Nair",
  "Nguyen","Tran","Pham","Aung","Win","Naidu","Menon","Farrukh","Basri","Osman"];
const baseClients = ["DBS Bank","OCBC","Singtel","Grab","SPH Media","CapitaLand","ST Engineering",
  "GovTech","MOH Holdings","Republic Polytechnic","Shopee","SIA Engineering","Prudential SG",
  "Keppel Corp","NCS Group"];
const clientNamePrefixes = ["Global","Pacific","Summit","Horizon","Meridian","Apex","Novus","Orion","Vertex","Titan",
  "Nexus","Zenith","Atlas","Quantum","Sterling","Crescent","Beacon","Pioneer","Vanguard","Catalyst",
  "Cascade","Ember","Granite","Ironwood","Lumen","Marble","Onyx","Paragon","Redwood","Skyline",
  "Solace","Trident","Umbra","Vista","Wavelength","Anchor","Bridgeway","Compass","Driftwood","Ecliptic",
  "Silverline","Cobalt","Amber","Falcon","Harbor","Ridgeline","Northstar","Lighthouse","Ironclad","Bluewave"];
const clientNameSuffixes = ["Bank","Holdings","Technologies","Solutions","Logistics","Media","Capital","Industries",
  "Systems","Group","Partners","Networks","Enterprises","Ventures","Dynamics","Corp","Labs","Consulting",
  "Analytics","Financial"];
function generateExtraClientNames(count){
  const names = new Set();
  let attempts = 0;
  while(names.size < count && attempts < 10000){
    attempts++;
    names.add(`${pick(clientNamePrefixes)} ${pick(clientNameSuffixes)}`);
  }
  return [...names];
}
const clients = []; // populated from the API at bootstrap (see bootstrap() at the end of this file)
const projectTypes = ["Application Development","Infrastructure Support","Data Migration",
  "Cloud Engineering","QA & Testing","Cybersecurity","Business Analysis","Project Management"];
const workPassTypes = ["EP","S Pass","Work Permit","Singapore Citizen","PR"];
const workPassAdminFees = { "EP": 150, "S Pass": 100, "Work Permit": 60, "Singapore Citizen": 0, "PR": 0 };
function getWorkPassAdminFee(c){ return workPassAdminFees[c.workPassType] ?? 0; }
const sowStatuses = ["Signed","Pending","Drafted"];
const poStatuses = ["Received","Raised","Pending"];
const contractStatusOptions = ["Drafted","Pending Signature","Signed","Expired","Terminated"];
const noticePeriods = ["2 weeks","1 month","2 months","3 months"];
const uploadStatuses = ["Uploaded","Not Uploaded"];
const signedUploadStatuses = ["Uploaded","Pending"];
const contractRenewalStatuses = ["Not Started","In Progress","Completed"];
const contractRemarksPool = ["None","Client requested extension","Pending client sign-off","Rate renegotiation in progress","Awaiting legal review","No issues"];
const renewalRemarksPool = ["","","","","Client on extended leave, renewal delayed","Awaiting client budget approval","Talent considering exit, holding renewal","Pending updated rate card from client"];
const passRenewalRemarksPool = ["","","","","Awaiting MOM approval","Talent's passport renewal pending","Pending updated employment contract for application","Client HR yet to confirm continued placement"];
const policyRemarksPool = ["","","","","Awaiting insurer's renewal quote","Talent on medical leave, policy review delayed","Pending updated headcount from client for group policy","Switching insurer, new policy being finalised"];
const billingTypes = ["Monthly","Daily"];
const invoiceStatuses = ["Paid","Pending","Overdue"];
const timesheetStatuses = ["Approved","Submitted","Pending"];
const passStatusOptions = ["N/A","Not Started","Application Submitted","Pending Approval","Approved","Issued","Rejected","Cancelled","Expired"];
const nationalities = ["Singaporean","Malaysian","Indian","Chinese","Filipino","Myanmar","Vietnamese","Indonesian"];
const maritalStatuses = ["Single","Married"];
const jobTitles = ["Software Engineer","DevOps Engineer","QA Analyst","Business Analyst","Cloud Architect",
  "Data Engineer","Security Analyst","Project Coordinator","Systems Analyst","Technical Lead"];
const skillPool = ["Java","Python","AWS","Azure","React","Node.js","Kubernetes","SQL","Terraform","Selenium","Power BI","C#","Docker","Agile","ServiceNow"];
const workLocations = ["Client Site","Hybrid","Remote","Onsite - HQ"];
const streetNames = ["Ang Mo Kio Ave","Tampines St","Bedok North Rd","Jurong West St","Yishun Ring Rd","Clementi Ave","Toa Payoh Lor","Punggol Way"];
const caseOwners = ["James Lee","Sarah Koh","Peter Lim","Michelle Tan","David Ong","Rachel Ho"];
const entities = ["DHC","Elitez","E&A","FMCG"];

function randInt(min,max){ return Math.floor(Math.random()*(max-min+1))+min; }
function pick(arr){ return arr[randInt(0,arr.length-1)]; }
function addDays(base, days){ const d = new Date(base); d.setDate(d.getDate()+days); return d; }
function toISO(d){ return d.toISOString().slice(0,10); }

const today = new Date();
let nextId = 1;

/* Monotonically increasing counter used to work out, for each talent, whether their
   contract dates were touched at/after the moment their renewal was marked "Completed". */
let renewalActionSeq = 0;

function computeDerived(c){
  c.contractDaysLeft = Math.ceil((c.contractEnd - today) / 86400000);
  c.passDaysLeft = Math.ceil((c.passExpiry - today) / 86400000);
  c.policyDaysLeft = c.policyExpiry ? Math.ceil((c.policyExpiry - today) / 86400000) : null;
  c.alert = c.passDaysLeft <= 30 || c.contractDaysLeft <= 30;
  return c;
}

/* Buckets used by the Renewal Centre "Contract Status" column */
function contractStatusBucket(daysLeft){
  if(daysLeft < 46) return { label: "Requires Renewal", style: `background:var(--red-bg);color:var(--red-text)` };
  if(daysLeft <= 90) return { label: "Eligible for Renewal", style: `background:var(--amber-bg);color:var(--amber-text)` };
  return { label: "Active", style: `background:var(--green-bg);color:var(--green-text)` };
}
/* Contract Status column: layers manual "Notice Period" / "Inactive" overrides on top of the
   automatic days-left bucket used elsewhere (Requires Renewal / Eligible for Renewal / Active). */
function contractStatusDisplay(c){
  if(c.contractLifecycleStatus === "Notice Period") return { label: "Notice Period", style: `background:#F1E4D8;color:#7A4A1E` };
  if(c.contractLifecycleStatus === "Inactive") return { label: "Inactive", style: `background:#E2E5E9;color:#43494F` };
  if(c.contractStart > today) return { label: "Pending Start", style: `background:var(--turquoise-bg);color:var(--turquoise-text)` };
  return contractStatusBucket(c.contractDaysLeft);
}
/* Work Pass Status column: layers manual "Pending Application" / "Inactive" overrides (and N/A
   for lifetime Citizen/PR passes) on top of the automatic days-left bucket. */
function passStatusDisplay(c){
  if(["Singapore Citizen","PR"].includes(c.workPassType)) return { label: "N/A", style: naPillStyle };
  if(c.passLifecycleStatus === "Pending Application") return { label: "Pending Application", style: `background:var(--turquoise-bg);color:var(--turquoise-text)` };
  if(c.passLifecycleStatus === "Inactive") return { label: "Inactive", style: `background:#E2E5E9;color:#43494F` };
  return contractStatusBucket(c.passDaysLeft);
}
const naPillStyle = `background:#F1F3F5;color:var(--muted)`;
/* Display + color for the Renewal Centre "Renewal Status" column (contract tab) */
function renewalStatusDisplayLabel(status){
  return status === "Not Started" ? "Yet to Start" : status;
}
function renewalStatusPillStyleContract(status){
  if(status === "Completed") return `background:var(--green-bg);color:var(--green-text)`;
  if(status === "In Progress") return `background:var(--amber-bg);color:var(--amber-text)`;
  return `background:var(--red-bg);color:var(--red-text)`; // "Not Started" / "Yet to Start"
}
/* Whether a talent's Renewal Status is "Completed" but Date of Commencement / Date of Expiry /
   Days Left to Expiry haven't been updated to reflect that renewal yet. */
function isContractRenewalStale(c){
  return c.contractRenewalStatus === "Completed" && (c.datesUpdatedSeq||0) < (c.renewalCompletedSeq||0);
}
/* Same idea, for the Work Pass Renewals tab (Date of Issue / Date of Expiry / Days Left to Expiry) */
function isPassRenewalStale(c){
  return c.renewalStatus === "Completed" && (c.passDatesUpdatedSeq||0) < (c.passRenewalCompletedSeq||0);
}
/* Same idea, for the Talents > Insurance sub-tab (Date of Issue / Date of Expiry / Days Left to Expiry) */
function isPolicyRenewalStale(c){
  return c.policyRenewalStatus === "Completed" && (c.policyDatesUpdatedSeq||0) < (c.policyRenewalCompletedSeq||0);
}

function randomProfileFields(firstName, lastName){
  return {
    nric: `${pick(['S','T'])}***${randInt(100,999)}${pick(['A','B','C','D','E'])}`,
    dateOfBirth: addDays(today, -randInt(21*365, 60*365)),
    sex: pick(['Male','Female']),
    bankAccount: `•••• •••• ${randInt(1000,9999)}`,
    nationality: pick(nationalities),
    maritalStatus: pick(maritalStatuses),
    dependants: randInt(0,3),
    address: `Blk ${randInt(1,999)} ${pick(streetNames)}, #${String(randInt(1,20)).padStart(2,'0')}-${String(randInt(1,99)).padStart(2,'0')}, Singapore ${randInt(100000,829999)}`,
    contactNumber: `+65 9${randInt(100,999)} ${randInt(1000,9999)}`,
    email: `${firstName.toLowerCase().replace(/\s+/g,'')}.${lastName.toLowerCase().replace(/\s+/g,'')}@dynamichumancapital.com`,
    jobTitle: pick(jobTitles),
    skillset: [...new Set(Array.from({length:3}, ()=>pick(skillPool)))],
    workLocation: pick(workLocations),
    caseOwner: pick(caseOwners),
    entity: pick(entities),
  };
}

function randomComplianceFields(c){
  const isForeignPass = ["EP","S Pass","Work Permit"].includes(c.workPassType);
  const passIssueDate = isForeignPass ? addDays(c.contractStart, randInt(0,20)) : null;
  const passStatus = !isForeignPass ? "N/A" : (c.passDaysLeft < 0 ? "Expired" : pick(["Issued","Issued","Issued","Approved","Pending Approval"]));
  const ipaDate = (isForeignPass && Math.random() < 0.3) ? addDays(passIssueDate, -randInt(5,15)) : null;
  const passportExpiry = (c.workPassType !== "Singapore Citizen") ? addDays(today, randInt(60,900)) : null;
  const medicalCheckupStatus = ["Work Permit","S Pass"].includes(c.workPassType) ? pick(["Completed","Pending"]) : "Not Required";
  const medicalInsuranceStatus = isForeignPass ? pick(["Active","Active","Expired"]) : "N/A";
  const wicaCoverageStatus = isForeignPass ? pick(["Covered","Covered","Not Covered"]) : "N/A";
  const renewalRequired = isForeignPass && c.passDaysLeft <= 90 ? "Yes" : "No";
  const renewalStatus = !isForeignPass ? "N/A" : (renewalRequired === "Yes" ? pick(["Not Started","In Progress","Completed"]) : "Not Started");
  const educationVerificationStatus = pick(["Completed","Completed","Completed","Pending","Not Required"]);
  // Mirrors the contract-renewal staleness tracking: if seeded as already "Completed",
  // mark it completed-but-not-yet-reflected so the Renewal Centre can flag it for update.
  const passRenewalCompletedSeq = renewalStatus === "Completed" ? 1 : 0;
  const passDatesUpdatedSeq = 0;
  const passRenewalRemarks = pick(passRenewalRemarksPool);
  // Lifecycle override, mirroring contractLifecycleStatus: most foreign passes follow the
  // automatic days-left bucket. A minority are manually flagged "Pending Application" (applied
  // for but not yet issued) or "Inactive" (pass cancelled/lapsed, record kept for reference).
  let passLifecycleStatus = "";
  if(isForeignPass){
    if(passStatus === "Expired"){
      passLifecycleStatus = pick(["Inactive","Inactive",""]);
    } else if(["Pending Approval","Application Submitted","Not Started"].includes(passStatus)){
      passLifecycleStatus = pick(["Pending Application","Pending Application",""]);
    }
  }
  return { passIssueDate, passStatus, ipaDate, passportExpiry, medicalCheckupStatus, medicalInsuranceStatus, wicaCoverageStatus, renewalRequired, renewalStatus, educationVerificationStatus, passRenewalCompletedSeq, passDatesUpdatedSeq, passRenewalRemarks, passLifecycleStatus };
}

/* Talents > Insurance sub-tab: independent policy tracking (Policy 1 / Policy 2A / Not Required) */
function randomPolicyFields(c){
  const policyType = pick(["Policy 1","Policy 1","Policy 2A","Policy 2A","Not Required"]);
  if(policyType === "Not Required"){
    return {
      policyType, policyIssueDate: null, policyExpiry: null,
      policyRenewalRequired: "No", policyRenewalStatus: "Not Started",
      policyRemarks: "", policyRenewalCompletedSeq: 0, policyDatesUpdatedSeq: 0,
    };
  }
  const policyIssueDate = addDays(c.contractStart, randInt(0,20));
  const policyExpiry = addDays(today, randInt(-10,400));
  const policyDaysLeftNow = Math.ceil((policyExpiry - today) / 86400000);
  const policyRenewalRequired = policyDaysLeftNow <= 90 ? "Yes" : "No";
  const policyRenewalStatus = policyRenewalRequired === "Yes" ? pick(["Not Started","In Progress","Completed"]) : "Not Started";
  const policyRemarks = pick(policyRemarksPool);
  // Mirrors the other renewal-staleness tracking: if seeded as already "Completed", mark it
  // completed-but-not-yet-reflected so the sub-tab can flag it for update.
  const policyRenewalCompletedSeq = policyRenewalStatus === "Completed" ? 1 : 0;
  const policyDatesUpdatedSeq = 0;
  return { policyType, policyIssueDate, policyExpiry, policyRenewalRequired, policyRenewalStatus, policyRemarks, policyRenewalCompletedSeq, policyDatesUpdatedSeq };
}

function randomPayrollFields(c){
  const cpf = Math.round(c.salary * 0.17);
  const skillsDevelopmentLevy = randInt(5, 40);
  const wica = randInt(5, 25);
  const medicalInsuranceCost = randInt(40, 150);
  const allowances = pick([0,0,50,100,150,200,300]);
  const claimsReimbursements = pick([0,0,20,50,80,120,200]);
  const overtime = Math.random() < 0.3 ? randInt(50,400) : 0;
  const noPayLeaveDeduction = Math.random() < 0.15 ? randInt(50,300) : 0;
  const otherStatutoryCosts = randInt(0, 20);
  return { cpf, skillsDevelopmentLevy, wica, medicalInsuranceCost, allowances, claimsReimbursements, overtime, noPayLeaveDeduction, otherStatutoryCosts };
}

function computeTotalPayrollCost(c){
  return c.salary + (c.cpf||0) + c.skillsDevelopmentLevy + c.wica + c.medicalInsuranceCost
    + c.allowances + c.claimsReimbursements + c.overtime - c.noPayLeaveDeduction + c.otherStatutoryCosts
    + getWorkPassAdminFee(c);
}

function computeTalentRevenue(c){
  return c.billingType === "Daily" ? c.chargeRate * 22 : c.chargeRate;
}

function seededVariance(seed, monthOffset){
  if(monthOffset === 0) return 1;
  const x = Math.sin(seed * 12.9898 + monthOffset * 78.233) * 43758.5453;
  const frac = x - Math.floor(x);
  return 0.90 + frac * 0.20;
}

function computeMargin(c){
  const monthlyBillable = computeTalentRevenue(c);
  const totalCost = computeTotalPayrollCost(c);
  return monthlyBillable > 0 ? ((monthlyBillable - totalCost) / monthlyBillable * 100) : 0;
}

function randomTalentBillingFields(c){
  const workingDays = 22;
  const talentInvoiceAmount = c.billingType === "Daily" ? c.chargeRate * workingDays : c.chargeRate;
  const talentInvoiceNumber = `INV-${today.getFullYear()}-${String(c.id).padStart(5,'0')}`;
  const talentInvoiceDate = addDays(today, -randInt(0,45));
  const talentInvoiceDueDate = addDays(talentInvoiceDate, 30);
  const talentInvoicePaidDate = c.invoiceStatus === "Paid" ? addDays(talentInvoiceDate, randInt(5,28)) : null;
  return { talentInvoiceAmount, talentInvoiceNumber, talentInvoiceDate, talentInvoiceDueDate, talentInvoicePaidDate };
}

function randomContractFields(c){
  let contractStatus;
  if(c.contractDaysLeft < 0){ contractStatus = pick(["Expired","Expired","Terminated"]); }
  else { contractStatus = pick(["Signed","Signed","Signed","Pending Signature","Drafted"]); }
  const noticePeriod = pick(noticePeriods);
  const contractUpload = pick(uploadStatuses);
  const signedContractUpload = contractStatus === "Signed" ? "Uploaded" : pick(signedUploadStatuses);
  const contractRenewalRequired = c.contractDaysLeft <= 90 ? "Yes" : "No";
  const contractRenewalStatus = contractRenewalRequired === "Yes" ? pick(contractRenewalStatuses) : "Not Started";
  const remarks = pick(contractRemarksPool);
  // Lifecycle override: most contracts follow the automatic days-left bucket (Requires Renewal /
  // Eligible for Renewal / Active). A minority are manually flagged as "Notice Period" (declined
  // to renew, serving notice) or "Inactive" (already left, record kept for reference).
  let contractLifecycleStatus = "";
  if(c.contractDaysLeft < 0){
    contractLifecycleStatus = pick(["Inactive","Inactive",""]);
  } else if(c.contractDaysLeft <= 60 && contractRenewalRequired === "Yes"){
    contractLifecycleStatus = pick(["","","","","Notice Period"]);
  }
  // If seeded as already "Completed", mark it as completed-but-not-yet-reflected so the
  // Renewal Centre can demonstrate the "needs update" alert; datesUpdatedSeq stays at 0.
  const renewalCompletedSeq = contractRenewalStatus === "Completed" ? 1 : 0;
  const datesUpdatedSeq = 0;
  const renewalRemarks = pick(renewalRemarksPool);
  return { contractStatus, noticePeriod, contractUpload, signedContractUpload, contractRenewalRequired, contractRenewalStatus, remarks, renewalCompletedSeq, datesUpdatedSeq, renewalRemarks, contractLifecycleStatus };
}

function randomOffboardingFields(c){
  const resignationReason = pick(["Resigned - new opportunity","Contract completed","Project ended","Performance","Client request","Not Applicable"]);
  const noticeServed = pick(["Yes","Yes","No"]);
  const workPassCancellationDate = c.contractDaysLeft < 0 ? addDays(c.contractEnd, randInt(1,10)) : null;
  const clientNotified = pick(["Yes","No"]);
  const replacementRequired = pick(["Yes","No"]);
  const finalInvoiceIssued = pick(["Yes","No"]);
  const exitDocsCompleted = pick(["Yes","No"]);
  const offboardingRemarks = pick(["None","Pending clearance","Awaiting final approval","Handover completed","IT assets returned"]);
  const offboardingChecklist = randomOffboardingChecklist();
  return { lastWorkingDay: c.contractEnd, resignationReason, noticeServed, workPassCancellationDate,
    clientNotified, replacementRequired, finalInvoiceIssued, exitDocsCompleted, offboardingRemarks, offboardingChecklist };
}

function randomOffboardingChecklist(){
  const labels = ["Client Notified","Final Salary","Leave Settlement","Pass Cancellation","Equipment Return","Exit Form","Final Invoice"];
  const progress = randInt(0, labels.length);
  return labels.map((label, idx)=>{
    let status;
    if(idx < progress) status = "Completed";
    else if(idx === progress) status = "In Progress";
    else status = "Pending";
    return { label, status };
  });
}

function randomLeaveTimesheetFields(){
  const annualEntitlement = 14;
  const annualTaken = randInt(0,14);
  const annualBalance = annualEntitlement - annualTaken;
  const sickEntitlement = 14;
  const sickTaken = randInt(0,10);
  const sickBalance = sickEntitlement - sickTaken;
  const oilEntitlement = randInt(0,5);
  const oilTaken = randInt(0, oilEntitlement);
  const oilBalance = oilEntitlement - oilTaken;
  const unpaidTaken = Math.random() < 0.12 ? randInt(1,5) : 0;
  const mcUpload = sickTaken > 0 ? "Uploaded" : "Not Applicable";
  const approvalStatus = pick(["Approved","Approved","Approved","Pending","Rejected"]);

  const month = monthLabelFull(today);
  const workingDays = randInt(20,23);
  const submitted = pick(["Yes","Yes","Yes","No"]);
  const submissionDate = submitted === "Yes" ? addDays(today, -randInt(1,10)) : null;
  const clientApproved = submitted === "Yes" ? pick(["Yes","Yes","No"]) : "No";
  const approvalDate = clientApproved === "Yes" ? addDays(submissionDate, randInt(1,5)) : null;
  const overtimeHours = Math.random() < 0.3 ? randInt(2,20) : 0;
  const absenceDays = Math.random() < 0.15 ? randInt(1,3) : 0;
  const remarks = pick(["None","None","Client requested MC copy","Late submission","Approved with adjustment"]);

  return {
    annualLeaveEntitlement: annualEntitlement, annualLeaveTaken: annualTaken, annualLeaveBalance: annualBalance,
    sickLeaveEntitlement: sickEntitlement, sickLeaveTaken: sickTaken, sickLeaveBalance: sickBalance,
    offInLieuEntitlement: oilEntitlement, offInLieuTaken: oilTaken, offInLieuBalance: oilBalance,
    unpaidLeaveTaken: unpaidTaken, mcUpload, leaveApprovalStatus: approvalStatus,
    timesheetMonth: month, workingDays, timesheetSubmitted: submitted, submissionDate,
    clientApproved, approvalDate, overtimeHours, absenceDays, timesheetRemarks: remarks,
  };
}
function monthLabelFull(d){ return d.toLocaleDateString('en-SG', { month:'short', year:'numeric' }); }

function makeTalent(){
  const id = nextId++;
  const firstName = pick(firstNames);
  const lastName = pick(lastNames);
  const name = `${firstName} ${lastName}`;
  const client = pick(clients);
  const projectType = pick(projectTypes);
  const salary = randInt(35,120) * 100;
  const chargeRate = randInt(45,180) * 10;
  const contractStart = addDays(today, -randInt(0,500));
  const contractEnd = addDays(today, randInt(-10,400));
  const passExpiry = addDays(today, randInt(-10,400));
  const workPassType = pick(workPassTypes);
  const sowStatus = pick(sowStatuses);
  const poStatus = pick(poStatuses);
  const sowRequired = pick(["Yes","Yes","Yes","No"]);
  const poRequired = pick(["Yes","Yes","Yes","No"]);
  const billingType = pick(billingTypes);
  const invoiceStatus = pick(invoiceStatuses);
  const c = computeDerived({ id, firstName, lastName, name, client, projectType, salary, chargeRate,
    contractStart, contractEnd, passExpiry, workPassType, sowStatus, poStatus, sowRequired, poRequired, billingType,
    invoiceStatus, ...randomProfileFields(firstName, lastName), ...randomLeaveTimesheetFields() });
  Object.assign(c, randomComplianceFields(c));
  Object.assign(c, randomPolicyFields(c));
  Object.assign(c, randomContractFields(c));
  Object.assign(c, randomPayrollFields(c));
  Object.assign(c, randomOffboardingFields(c));
  Object.assign(c, randomTalentBillingFields(c));
  computeDerived(c);
  return c;
}
let talents = []; // populated from the API at bootstrap (see bootstrap() at the end of this file)

function fmtDate(d){ return d.toLocaleDateString('en-SG', { day:'2-digit', month:'short', year:'numeric' }); }
function fmtMoney(n){ return "S$ " + n.toLocaleString('en-SG'); }
function fmtMoneyCompact(n){
  const abs = Math.abs(n);
  if(abs >= 1000000) return "S$ " + (n/1000000).toFixed(2) + "M";
  if(abs >= 1000) return "S$ " + (n/1000).toFixed(0) + "K";
  return "S$ " + Math.round(n).toLocaleString('en-SG');
}

/* ---------- Populate dropdowns ---------- */
function fillOptions(sel, list, placeholder){
  sel.innerHTML = "";
  if(placeholder){
    const opt = document.createElement('option'); opt.value=""; opt.textContent=placeholder;
    sel.appendChild(opt);
  }
  list.forEach(v=>{
    const opt = document.createElement('option'); opt.value=v; opt.textContent=v;
    sel.appendChild(opt);
  });
}

/* Reusable multi-select filter dropdown: lets the person tick one or more categories at once.
   wrapId must point to an empty <div>; onChange receives the current array of selected values. */
function createMultiSelect(wrapId, options, placeholder, onChange){
  const wrap = document.getElementById(wrapId);
  if(!wrap) return null;
  const normalize = opts => opts.map(o=> (typeof o === 'object' && o !== null) ? o : { value:o, label:o });
  let normOptions = normalize(options);
  wrap.classList.add('ms-wrap');
  wrap.innerHTML = "";
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'select-basic ms-btn';
  const panel = document.createElement('div');
  panel.className = 'ms-panel hidden';
  wrap.appendChild(btn);
  wrap.appendChild(panel);

  let selected = [];

  function labelFor(val){
    const found = normOptions.find(o=>o.value===val);
    return found ? found.label : val;
  }

  function renderPanel(){
    panel.innerHTML = `
      <div class="ms-clear-row"><button type="button" class="ms-clear-btn">Clear all</button></div>
      ${normOptions.map(o=>`<label class="ms-option"><input type="checkbox" value="${o.value}" ${selected.includes(o.value)?'checked':''}/><span>${o.label}</span></label>`).join('')}
    `;
    panel.querySelectorAll('.ms-option').forEach(label=>{
      label.addEventListener('click', e=>{
        e.preventDefault();
        const cb = label.querySelector('input');
        const val = cb.value;
        if(selected.includes(val)){ selected = selected.filter(v=>v!==val); }
        else { selected.push(val); }
        cb.checked = selected.includes(val);
        updateBtnLabel();
        onChange(selected.slice());
      });
    });
    panel.querySelector('.ms-clear-btn').addEventListener('click', e=>{
      e.preventDefault();
      e.stopPropagation();
      selected = [];
      renderPanel();
      updateBtnLabel();
      onChange(selected.slice());
    });
  }
  function updateBtnLabel(){
    btn.classList.toggle('ms-has-value', selected.length>0);
    btn.textContent = selected.length===0 ? placeholder : (selected.length===1 ? labelFor(selected[0]) : `${selected.length} selected`);
  }

  btn.addEventListener('click', e=>{
    e.stopPropagation();
    document.querySelectorAll('.ms-panel').forEach(p=>{ if(p!==panel) p.classList.add('hidden'); });
    panel.classList.toggle('hidden');
  });
  document.addEventListener('click', e=>{
    if(!wrap.contains(e.target)) panel.classList.add('hidden');
  });

  renderPanel();
  updateBtnLabel();

  return {
    reset(){ selected = []; renderPanel(); updateBtnLabel(); },
    getSelected(){ return selected.slice(); },
    setSelected(vals){ selected = vals.slice(); renderPanel(); updateBtnLabel(); },
    setOptions(newOptions){ normOptions = normalize(newOptions); renderPanel(); },
  };
}
const msClientFilter = createMultiSelect('clientFilter', [...new Set(clients)].sort(), "All clients", vals=>{ clientTerm=vals; page=1; renderTable(); });
const msProjectFilter = createMultiSelect('projectFilter', [...new Set(projectTypes)].sort(), "All project types", vals=>{ projectTerm=vals; page=1; renderTable(); });
const msWorkPassTypeFilterMain = createMultiSelect('workPassTypeFilterMain', [...new Set(workPassTypes)].sort(), "All pass types", vals=>{ workPassTypeTermMain=vals; page=1; renderTable(); });
const msWorkPassStatusFilterMain = createMultiSelect('workPassStatusFilterMain', ["Requires Renewal","Eligible for Renewal","Active","Pending Application","Inactive","N/A"], "All pass statuses", vals=>{ workPassStatusTermMain=vals; page=1; renderTable(); });
const msContractStatusFilterMain = createMultiSelect('contractStatusFilterMain', ["Requires Renewal","Eligible for Renewal","Active","Pending Start","Notice Period","Inactive"], "All contract statuses", vals=>{ contractStatusTermMain=vals; page=1; renderTable(); });
const msOwnerFilterMain = createMultiSelect('ownerFilterMain', [...new Set(caseOwners)].sort(), "All recruiters", vals=>{ ownerTermMain=vals; page=1; renderTable(); });
const msEntityFilterMain = createMultiSelect('entityFilterMain', [...new Set(entities)].sort(), "All entities", vals=>{ entityTermMain=vals; page=1; renderTable(); });
fillOptions(document.getElementById('f_client'), [...new Set(clients)].sort(), null);
fillOptions(document.getElementById('f_projectType'), [...new Set(projectTypes)].sort(), null);
fillOptions(document.getElementById('f_caseOwner'), [...new Set(caseOwners)].sort(), null);
fillOptions(document.getElementById('f_entity'), [...new Set(entities)].sort(), null);
fillOptions(document.getElementById('f_nationality'), nationalities, null);
fillOptions(document.getElementById('f_maritalStatus'), maritalStatuses, null);
fillOptions(document.getElementById('f_workLocation'), workLocations, null);
fillOptions(document.getElementById('f_workPassType'), workPassTypes, null);

/* ---------- Add new Client / Project Type from within the Add Talent form ---------- */
function addAddNewOption(sel, label){
  const opt = document.createElement('option');
  opt.value = "__add_new__";
  opt.textContent = label;
  sel.appendChild(opt);
}
addAddNewOption(document.getElementById('f_client'), "+ Add New Client…");
addAddNewOption(document.getElementById('f_projectType'), "+ Add New Project Type…");
addAddNewOption(document.getElementById('f_caseOwner'), "+ Add New Recruiter…");
addAddNewOption(document.getElementById('f_entity'), "+ Add New Entity…");

document.getElementById('f_client').addEventListener('change', e=>{
  if(e.target.value !== "__add_new__") return;
  const newClient = prompt("Enter the new client name:");
  if(newClient && newClient.trim()){
    const trimmed = newClient.trim();
    if(!clients.includes(trimmed)) clients.push(trimmed);
    msClientFilter.setOptions([...new Set(clients)].sort());
    fillOptions(e.target, [...new Set(clients)].sort(), null);
    addAddNewOption(e.target, "+ Add New Client…");
    e.target.value = trimmed;
    showToast(`"${trimmed}" added as a new client`, checkIcon);
  } else {
    e.target.value = "";
  }
});
document.getElementById('f_projectType').addEventListener('change', e=>{
  if(e.target.value !== "__add_new__") return;
  const newType = prompt("Enter the new project type:");
  if(newType && newType.trim()){
    const trimmed = newType.trim();
    if(!projectTypes.includes(trimmed)) projectTypes.push(trimmed);
    msProjectFilter.setOptions([...new Set(projectTypes)].sort());
    fillOptions(e.target, [...new Set(projectTypes)].sort(), null);
    addAddNewOption(e.target, "+ Add New Project Type…");
    e.target.value = trimmed;
    showToast(`"${trimmed}" added as a new project type`, checkIcon);
  } else {
    e.target.value = "";
  }
});
document.getElementById('f_caseOwner').addEventListener('change', e=>{
  if(e.target.value !== "__add_new__") return;
  const newOwner = prompt("Enter the new recruiter's name:");
  if(newOwner && newOwner.trim()){
    const trimmed = newOwner.trim();
    if(!caseOwners.includes(trimmed)) caseOwners.push(trimmed);
    if(msOwnerFilterMain) msOwnerFilterMain.setOptions([...new Set(caseOwners)].sort());
    fillOptions(e.target, [...new Set(caseOwners)].sort(), null);
    addAddNewOption(e.target, "+ Add New Recruiter…");
    e.target.value = trimmed;
    showToast(`"${trimmed}" added as a new recruiter`, checkIcon);
  } else {
    e.target.value = "";
  }
});
document.getElementById('f_entity').addEventListener('change', e=>{
  if(e.target.value !== "__add_new__") return;
  const newEntity = prompt("Enter the new entity name:");
  if(newEntity && newEntity.trim()){
    const trimmed = newEntity.trim();
    if(!entities.includes(trimmed)) entities.push(trimmed);
    if(msEntityFilterMain) msEntityFilterMain.setOptions([...new Set(entities)].sort());
    fillOptions(e.target, [...new Set(entities)].sort(), null);
    addAddNewOption(e.target, "+ Add New Entity…");
    e.target.value = trimmed;
    showToast(`"${trimmed}" added as a new entity`, checkIcon);
  } else {
    e.target.value = "";
  }
});

/* ---------- Toast ---------- */
/* ---------- Reusable search-clear (x) button wiring ---------- */
function wireClearButton(inputId, clearBtnId, onClear){
  const input = document.getElementById(inputId);
  const btn = document.getElementById(clearBtnId);
  if(!input || !btn) return;
  function refresh(){ btn.classList.toggle('visible', input.value.length > 0); }
  input.addEventListener('input', refresh);
  btn.addEventListener('click', ()=>{
    input.value = "";
    refresh();
    input.focus();
    if(onClear) onClear();
  });
  refresh();
}

/* ---------- Reusable numbered pagination bar (Work Pass style) ---------- */
const LIST_PAGE_SIZE = 200;

function renderPaginationBar(containerId, totalRows, currentPage, pageSize, onChange){
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
  const cur = Math.min(Math.max(1, currentPage), totalPages);

  function pageBtn(p, label, disabled, active){
    return `<button type="button" class="generic-page-btn w-7 h-7 rounded border text-xs flex items-center justify-center ${active?'border-[var(--blue)] bg-[var(--blue)] text-white font-semibold':'border-[var(--border-strong)] hover:bg-[#F4F5F7]'} ${disabled?'opacity-40 cursor-not-allowed':''}" data-page="${p}" ${disabled?'disabled':''}>${label}</button>`;
  }

  let nums;
  if(totalPages <= 7){
    nums = Array.from({length:totalPages}, (_,i)=>i+1);
  } else if(cur <= 4){
    nums = [1,2,3,4,5,'…',totalPages];
  } else if(cur >= totalPages - 3){
    nums = [1,'…',totalPages-4,totalPages-3,totalPages-2,totalPages-1,totalPages];
  } else {
    nums = [1,'…',cur-1,cur,cur+1,'…',totalPages];
  }
  const numsHtml = nums.map(n=> n==='…'
    ? `<span class="px-1 text-[var(--muted)]">…</span>`
    : pageBtn(n, n, false, n===cur)
  ).join('');

  const firstIcon = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="18 17 13 12 18 7"/><polyline points="11 17 6 12 11 7"/></svg>`;
  const prevIcon = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="15 18 9 12 15 6"/></svg>`;
  const nextIcon = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="9 18 15 12 9 6"/></svg>`;
  const lastIcon = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="6 17 11 12 6 7"/><polyline points="13 17 18 12 13 7"/></svg>`;

  const container = document.getElementById(containerId);
  container.innerHTML = `
    <span class="text-[var(--muted)] mr-2">Showing ${totalRows===0?0:(cur-1)*pageSize+1}–${Math.min(cur*pageSize,totalRows)} of ${totalRows}</span>
    ${pageBtn(1, firstIcon, cur<=1)}
    ${pageBtn(cur-1, prevIcon, cur<=1)}
    ${numsHtml}
    ${pageBtn(cur+1, nextIcon, cur>=totalPages)}
    ${pageBtn(totalPages, lastIcon, cur>=totalPages)}
  `;
  container.querySelectorAll('.generic-page-btn').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      if(btn.disabled) return;
      onChange(Number(btn.dataset.page));
    });
  });
  return cur;
}

function showToast(msg, iconSvg){
  const container = document.getElementById('toastContainer');
  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = `${iconSvg || ''}<span>${msg}</span>`;
  container.appendChild(el);
  setTimeout(()=>{ el.style.opacity='0'; el.style.transition='opacity .3s'; setTimeout(()=>el.remove(), 300); }, 3200);
}
const checkIcon = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#34D399" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>';

/* ---------- Sidebar router ---------- */
const sidebarLinks = document.querySelectorAll('.sidebar-link[data-view]');
function switchView(view){
  document.querySelectorAll('.view-panel').forEach(el=>el.classList.add('hidden'));
  document.getElementById('view-'+view).classList.remove('hidden');
  sidebarLinks.forEach(l=>l.classList.toggle('active', l.dataset.view===view));
  if(view==='home') renderHome();
  if(view==='talents') renderTable();
  if(view==='insurance') renderPolicyTable();
  if(view==='workpass') renderWorkPass();
  if(view==='contracts') renderContracts();
  if(view==='finance') renderFinance();
  if(view==='billing') renderBilling();
  if(view==='operations') renderOperations();
  if(view==='analytics') renderAnalytics();
  if(view==='offboarding') renderOffboarding();
  if(view==='clients') renderClients();
  if(view==='sowpo') renderSowPoTracking();
  if(view==='renewals') renderRenewalCentre();
}
sidebarLinks.forEach(l=>l.addEventListener('click', e=>{ e.preventDefault(); switchView(l.dataset.view); }));
document.getElementById('headerTitleLink').addEventListener('click', ()=> switchView('home'));

document.querySelectorAll('.sidebar-group-toggle').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    const group = document.getElementById(btn.dataset.group);
    const chevron = btn.querySelector('.group-chevron');
    group.classList.toggle('collapsed');
    chevron.classList.toggle('rotated');
  });
});

/* ---------- Sidebar show/hide toggle ---------- */
let sidebarVisible = true;
document.getElementById('sidebarToggleBtn').addEventListener('click', ()=>{
  sidebarVisible = !sidebarVisible;
  document.getElementById('sidebar').style.display = sidebarVisible ? '' : 'none';
});

/* ---------- Master stats (Talents tab) ---------- */
/* Stable trend percentages for the Talents page workforce snapshot (no real historical
   snapshot exists for these counts in this mockup, mirrors the Home dashboard's approach). */
const talentsStatsTrends = {};
["total","pendingStart","noticePeriod","headcount","expiringPasses","expiringContracts","payroll"].forEach(k=>{
  talentsStatsTrends[k] = Math.round((Math.random()*30 - 12) * 10) / 10;
});
let talentsStatsMonthOffset = 0; // cosmetic only — does not filter the talents table below
let talentsStatsMonthFilterInit = false;
function initTalentsStatsMonthFilter(){
  if(talentsStatsMonthFilterInit) return;
  talentsStatsMonthFilterInit = true;
  const sel = document.getElementById('talentsStatsMonthFilter');
  for(let i=0;i<6;i++){
    const idx = HISTORY_MONTHS-1-i;
    const d = monthDates[idx];
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = i===0 ? `${monthLabelFull(d)} (Current)` : monthLabelFull(d);
    sel.appendChild(opt);
  }
  sel.addEventListener('change', e=>{
    talentsStatsMonthOffset = Number(e.target.value);
    renderStats();
  });
}

function arraysEqualUnordered(a, b){
  if(a.length !== b.length) return false;
  const sa = [...a].sort(), sb = [...b].sort();
  return sa.every((v,i)=>v===sb[i]);
}

function renderStats(){
  initTalentsStatsMonthFilter();
  const total = talents.length;
  const pendingStart = talents.filter(c=>contractStatusDisplay(c).label === "Pending Start").length;
  const noticePeriod = talents.filter(c=>contractStatusDisplay(c).label === "Notice Period").length;
  const headcount = talents.filter(c=>["Active","Eligible for Renewal","Requires Renewal","Notice Period"].includes(contractStatusDisplay(c).label)).length;
  const expiringContracts = talents.filter(c=>c.contractDaysLeft < 46).length;
  const expiringWorkPasses = talents.filter(c=>c.passDaysLeft < 46).length;
  const approachingExpiries = talents.filter(c=>c.alert).length;
  const totalPayroll = talents.reduce((s,c)=>s+c.salary,0);

  const cards = [
    { key:"total", label:"Total Talents", value: total, color:"var(--text)", trend: talentsStatsTrends.total },
    { key:"pendingStart", label:"Pending Start", value: pendingStart, color:"var(--turquoise-text)", trend: talentsStatsTrends.pendingStart },
    { key:"noticePeriod", label:"Serving Notice Period", value: noticePeriod, color:"#7A4A1E", trend: talentsStatsTrends.noticePeriod },
    { key:"headcount", label:"Current Headcount", value: headcount, color:"var(--green-text)", trend: talentsStatsTrends.headcount },
    { key:"expiringPasses", label:"Expiring Work Passes (<46d)", value: expiringWorkPasses, color:"var(--red-text)", trend: talentsStatsTrends.expiringPasses },
    { key:"expiringContracts", label:"Expiring Contracts (<46d)", value: expiringContracts, color:"var(--red-text)", trend: talentsStatsTrends.expiringContracts },
    { key:null, label:"Total Monthly Payroll", value: fmtMoney(totalPayroll), color:"var(--green-text)", trend: talentsStatsTrends.payroll },
  ];
  const cardFilterMap = {
    pendingStart: { field:"contractStatusTermMain", value:["Pending Start"] },
    noticePeriod: { field:"contractStatusTermMain", value:["Notice Period"] },
    headcount: { field:"contractStatusTermMain", value:["Active","Eligible for Renewal","Requires Renewal","Notice Period"] },
    expiringPasses: { field:"workPassStatusTermMain", value:["Requires Renewal"] },
    expiringContracts: { field:"contractStatusTermMain", value:["Requires Renewal"] },
  };
  document.getElementById('statCards').innerHTML = cards.map(c=>{
    let active = false;
    if(c.key === "total"){
      active = !searchTerm && clientTerm.length===0 && projectTerm.length===0 && workPassTypeTermMain.length===0 && workPassStatusTermMain.length===0 && contractStatusTermMain.length===0 && ownerTermMain.length===0 && entityTermMain.length===0;
    } else if(cardFilterMap[c.key]){
      const f = cardFilterMap[c.key];
      const currentVal = f.field === "workPassStatusTermMain" ? workPassStatusTermMain : contractStatusTermMain;
      active = arraysEqualUnordered(currentVal, f.value);
    }
    return `
    <div class="stat-card ${c.key?'stat-card-clickable':''} rounded-lg px-4 py-3 ${active?'stat-card-clickable-active':''}" ${c.key?`data-card="${c.key}"`:''}>
      <div class="text-xs text-[var(--muted)] mb-1">${c.label}</div>
      <div class="text-xl font-bold" style="color:${c.color}">${c.value}</div>
      ${homeTrend(c.trend, "vs last month")}
    </div>`;
  }).join('');

  document.querySelectorAll('#statCards .stat-card-clickable').forEach(card=>{
    card.addEventListener('click', ()=>{
      const key = card.dataset.card;
      if(key === "total"){
        searchTerm=""; clientTerm=[]; projectTerm=[]; workPassTypeTermMain=[]; workPassStatusTermMain=[]; contractStatusTermMain=[]; ownerTermMain=[]; entityTermMain=[]; page=1;
        document.getElementById('searchInput').value="";
        msClientFilter.reset(); msProjectFilter.reset(); msWorkPassTypeFilterMain.reset();
        msWorkPassStatusFilterMain.reset(); msContractStatusFilterMain.reset(); msOwnerFilterMain.reset(); msEntityFilterMain.reset();
      } else if(cardFilterMap[key]){
        const f = cardFilterMap[key];
        const currentVal = f.field === "workPassStatusTermMain" ? workPassStatusTermMain : contractStatusTermMain;
        const isActive = arraysEqualUnordered(currentVal, f.value);
        const newVal = isActive ? [] : f.value;
        if(f.field === "workPassStatusTermMain"){ workPassStatusTermMain = newVal; msWorkPassStatusFilterMain.setSelected(newVal); }
        else { contractStatusTermMain = newVal; msContractStatusFilterMain.setSelected(newVal); }
      }
      page = 1;
      renderTable();
      renderStats();
    });
  });
  document.getElementById('alertBadge').textContent = approachingExpiries;
}

/* ---------- Talents table state ---------- */
let sortKey = "passDaysLeft";
let sortDir = 1;
let searchTerm = "";
let clientTerm = [];
let projectTerm = [];
let workPassTypeTermMain = [];
let workPassStatusTermMain = [];
let contractStatusTermMain = [];
let ownerTermMain = [];
let entityTermMain = [];
let page = 1;
const pageSize = 200;

function getFiltered(){
  return talents.filter(c=>{
    if(searchTerm && !c.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if(clientTerm.length && !clientTerm.includes(c.client)) return false;
    if(projectTerm.length && !projectTerm.includes(c.projectType)) return false;
    if(workPassTypeTermMain.length && !workPassTypeTermMain.includes(c.workPassType)) return false;
    if(workPassStatusTermMain.length && !workPassStatusTermMain.includes(passStatusDisplay(c).label)) return false;
    if(contractStatusTermMain.length && !contractStatusTermMain.includes(contractStatusDisplay(c).label)) return false;
    if(ownerTermMain.length && !ownerTermMain.includes(c.caseOwner)) return false;
    if(entityTermMain.length && !entityTermMain.includes(c.entity)) return false;
    return true;
  });
}

function renderTable(){
  let rows = getFiltered();
  rows.sort((a,b)=>{
    let av, bv;
    if(sortKey === 'totalCost'){ av = computeTotalPayrollCost(a); bv = computeTotalPayrollCost(b); }
    else if(sortKey === 'margin'){ av = computeMargin(a); bv = computeMargin(b); }
    else { av = a[sortKey]; bv = b[sortKey]; }
    if(av instanceof Date){ av=av.getTime(); bv=bv.getTime(); }
    if(typeof av === "string"){ av=av.toLowerCase(); bv=bv.toLowerCase(); }
    if(av<bv) return -1*sortDir;
    if(av>bv) return 1*sortDir;
    return 0;
  });

  document.getElementById('resultCount').textContent = rows.length;

  const totalPages = Math.max(1, Math.ceil(rows.length/pageSize));
  if(page > totalPages) page = totalPages;
  const startIdx = (page-1)*pageSize;
  const pageRows = rows.slice(startIdx, startIdx+pageSize);

  const tbody = document.getElementById('tableBody');
  const emptyState = document.getElementById('emptyState');

  if(rows.length === 0){
    tbody.innerHTML = "";
    emptyState.classList.remove('hidden');
  } else {
    emptyState.classList.add('hidden');
    tbody.innerHTML = pageRows.map(c=>{
      const rowClass = c.alert ? "row-alert" : "";
      const contractBucket = contractStatusDisplay(c);
      const passBucket = passStatusDisplay(c);
      const isCitizenOrPR = ["Singapore Citizen","PR"].includes(c.workPassType);
      const passExpiryDisplay = isCitizenOrPR ? "N/A" : fmtDate(c.passExpiry);

      return `
        <tr class="row-hover border-b border-[var(--border)] ${rowClass}" data-row data-id="${c.id}">
          <td class="px-4 py-1 text-[var(--muted)] whitespace-nowrap">C${String(c.id).padStart(6,'0')}</td>
          <td class="px-4 py-1 font-medium name-cell whitespace-nowrap">
            <div class="flex items-center gap-1.5">
              ${c.alert ? `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--red-dot)" stroke-width="2.5" class="shrink-0"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><path d="M12 9v4M12 17h.01"/></svg>` : ''}
              <span class="name-text">${c.name}</span>
            </div>
          </td>
          <td class="px-4 py-1 text-[var(--muted)] whitespace-nowrap">${c.client}</td>
          <td class="px-4 py-1 whitespace-nowrap">${c.workPassType}</td>
          <td class="px-4 py-1 whitespace-nowrap ${!isCitizenOrPR && c.passDaysLeft<=30?'date-alert':''}">${passExpiryDisplay}</td>
          <td class="px-4 py-1 whitespace-nowrap"><span class="pill" style="${passBucket.style}">${passBucket.label}</span></td>
          <td class="px-4 py-1 whitespace-nowrap ${c.contractDaysLeft<=30?'date-alert':''}">${fmtDate(c.contractEnd)}</td>
          <td class="px-4 py-1 whitespace-nowrap"><span class="pill" style="${contractBucket.style}">${contractBucket.label}</span></td>
          <td class="px-4 py-1 whitespace-nowrap">${fmtMoney(computeTotalPayrollCost(c))}</td>
          <td class="px-4 py-1 text-[var(--muted)] whitespace-nowrap">${c.caseOwner}</td>
          <td class="px-4 py-1 text-[var(--muted)] whitespace-nowrap">${c.entity}</td>
        </tr>
      `;
    }).join('');

    tbody.querySelectorAll('tr[data-row]').forEach(tr=>{
      tr.addEventListener('click', ()=> openTalentProfile(Number(tr.dataset.id), 'talents'));
    });
  }

  document.getElementById('pageInfo').textContent = rows.length === 0
    ? "0 of 0"
    : `${startIdx+1}–${Math.min(startIdx+pageSize, rows.length)} of ${rows.length}`;
  document.getElementById('prevPage').disabled = page <= 1;
  document.getElementById('nextPage').disabled = page >= totalPages;
}

function updateSortArrows(){
  document.querySelectorAll('.sort-caret').forEach(el=>{
    const key = el.dataset.arrow;
    const isActive = key === sortKey;
    el.classList.toggle('active', isActive);
    el.textContent = isActive ? (sortDir === 1 ? "▲" : "▼") : "▲";
  });
}

document.querySelectorAll('.sortable[data-key]').forEach(el=>{
  el.addEventListener('click', ()=>{
    const key = el.dataset.key;
    if(sortKey === key){ sortDir *= -1; } else { sortKey = key; sortDir = 1; }
    updateSortArrows();
    page = 1;
    renderTable();
  });
});
document.getElementById('searchInput').addEventListener('input', e=>{ searchTerm=e.target.value; page=1; renderTable(); });
wireClearButton('searchInput', 'searchInputClear', ()=>{ searchTerm=""; page=1; renderTable(); });
const headerSearchResults = document.getElementById('headerSearchResults');
function renderHeaderSearchResults(term){
  if(!term){
    headerSearchResults.classList.add('hidden');
    headerSearchResults.innerHTML = '';
    return;
  }
  const lower = term.toLowerCase();
  const talentMatches = talents.filter(c=>c.name.toLowerCase().includes(lower)).slice(0,6);
  const clientMatches = clients.filter(cl=>cl.toLowerCase().includes(lower)).slice(0,6);

  if(talentMatches.length === 0 && clientMatches.length === 0){
    headerSearchResults.innerHTML = `<div class="px-4 py-4 text-sm text-[var(--muted)] text-center">No talents or clients found.</div>`;
  } else {
    let html = '';
    if(talentMatches.length){
      html += `<div class="px-4 py-1.5 bg-[#FAFBFC] border-b border-[var(--border)] text-[10px] uppercase tracking-wide text-[var(--muted)] font-semibold">Talents</div>`;
      html += talentMatches.map(c=>`
        <div class="header-search-result header-search-talent px-4 py-2.5 text-sm cursor-pointer hover:bg-[#F8FAFC] border-b border-[var(--border)]" data-id="${c.id}">
          <div class="font-medium">${c.name}</div>
          <div class="text-xs text-[var(--muted)]">${c.client} · ${c.projectType}</div>
        </div>`).join('');
    }
    if(clientMatches.length){
      html += `<div class="px-4 py-1.5 bg-[#FAFBFC] border-b border-[var(--border)] text-[10px] uppercase tracking-wide text-[var(--muted)] font-semibold">Clients</div>`;
      html += clientMatches.map(cl=>{
        const count = talents.filter(c=>c.client===cl).length;
        return `
        <div class="header-search-result header-search-client px-4 py-2.5 text-sm cursor-pointer hover:bg-[#F8FAFC] border-b border-[var(--border)]" data-client="${cl}">
          <div class="font-medium">${cl}</div>
          <div class="text-xs text-[var(--muted)]">${count} talent${count===1?'':'s'}</div>
        </div>`;
      }).join('');
    }
    headerSearchResults.innerHTML = html;
    headerSearchResults.querySelectorAll('.header-search-talent').forEach(el=>{
      el.addEventListener('click', ()=>{
        const id = Number(el.dataset.id);
        headerSearchResults.classList.add('hidden');
        document.getElementById('headerSearchInput').value = '';
        document.getElementById('headerSearchClear').classList.remove('visible');
        openTalentProfile(id, 'home');
      });
    });
    headerSearchResults.querySelectorAll('.header-search-client').forEach(el=>{
      el.addEventListener('click', ()=>{
        headerSearchResults.classList.add('hidden');
        document.getElementById('headerSearchInput').value = '';
        document.getElementById('headerSearchClear').classList.remove('visible');
        openClientViewModal(el.dataset.client);
      });
    });
  }
  headerSearchResults.classList.remove('hidden');
}
document.getElementById('headerSearchInput').addEventListener('input', e=>{
  renderHeaderSearchResults(e.target.value.trim());
});
document.getElementById('headerSearchInput').addEventListener('focus', e=>{
  if(e.target.value.trim()) renderHeaderSearchResults(e.target.value.trim());
});
document.addEventListener('click', e=>{
  if(!e.target.closest('#headerSearchInput') && !e.target.closest('#headerSearchResults')){
    headerSearchResults.classList.add('hidden');
  }
});
wireClearButton('headerSearchInput', 'headerSearchClear', ()=>{
  headerSearchResults.classList.add('hidden');
  headerSearchResults.innerHTML = '';
});
document.getElementById('prevPage').addEventListener('click', ()=>{ if(page>1){ page--; renderTable(); }});
document.getElementById('nextPage').addEventListener('click', ()=>{ page++; renderTable(); });
document.getElementById('clearFilters').addEventListener('click', e=>{
  e.preventDefault();
  searchTerm=""; clientTerm=[]; projectTerm=[]; workPassTypeTermMain=[]; workPassStatusTermMain=[]; contractStatusTermMain=[]; ownerTermMain=[]; entityTermMain=[]; page=1;
  document.getElementById('searchInput').value="";
  msClientFilter.reset();
  msProjectFilter.reset();
  msWorkPassTypeFilterMain.reset();
  msWorkPassStatusFilterMain.reset();
  msContractStatusFilterMain.reset();
  msOwnerFilterMain.reset();
  msEntityFilterMain.reset();
  renderTable();
});
document.getElementById('downloadLink').addEventListener('click', e=>{ e.preventDefault(); openExportModal(); });

/* ---------- Export to Excel Modal ---------- */
const exportModalOverlay = document.getElementById('exportModalOverlay');
const exportModal = document.getElementById('exportModal');
const exportColumns = [
  {key:'id', label:'ID', get:c=>`C${String(c.id).padStart(6,'0')}`},
  {key:'name', label:'Talent Name', get:c=>c.name},
  {key:'client', label:'Client', get:c=>c.client},
  {key:'projectType', label:'Project Type', get:c=>c.projectType},
  {key:'jobTitle', label:'Job Title', get:c=>c.jobTitle},
  {key:'workPassType', label:'Work Pass', get:c=>c.workPassType},
  {key:'passStatus', label:'Work Pass Status', get:c=>c.passStatus},
  {key:'contractStart', label:'Start Date', get:c=>fmtDate(c.contractStart)},
  {key:'contractEnd', label:'End Date', get:c=>fmtDate(c.contractEnd)},
  {key:'contractStatus', label:'Contract Status', get:c=>c.contractStatus},
  {key:'monthlyCost', label:'Monthly Cost (SGD)', get:c=>Math.round(computeTotalPayrollCost(c))},
  {key:'margin', label:'Margin (%)', get:c=>Number(computeMargin(c).toFixed(1))},
  {key:'owner', label:'Owner', get:c=>c.caseOwner},
];

function openExportModal(){
  document.getElementById('exportScopeFilteredCount').textContent = getFiltered().length;
  document.getElementById('exportScopeAllCount').textContent = talents.length;
  document.getElementById('exportScopeFiltered').checked = true;
  document.getElementById('exportColumnList').innerHTML = exportColumns.map(col=>`
    <label class="flex items-center gap-1.5 cursor-pointer">
      <input type="checkbox" class="export-col-checkbox" value="${col.key}" checked/> ${col.label}
    </label>`).join('');
  exportModalOverlay.classList.add('open');
  exportModal.classList.add('open');
}
function closeExportModalFn(){
  exportModalOverlay.classList.remove('open');
  exportModal.classList.remove('open');
}
document.getElementById('openExportModalBtn').addEventListener('click', openExportModal);
document.getElementById('closeExportModal').addEventListener('click', closeExportModalFn);
document.getElementById('cancelExportModal').addEventListener('click', closeExportModalFn);
exportModalOverlay.addEventListener('click', closeExportModalFn);

document.getElementById('exportSelectAll').addEventListener('click', e=>{
  e.preventDefault();
  document.querySelectorAll('.export-col-checkbox').forEach(cb=>cb.checked=true);
});
document.getElementById('exportSelectNone').addEventListener('click', e=>{
  e.preventDefault();
  document.querySelectorAll('.export-col-checkbox').forEach(cb=>cb.checked=false);
});

document.getElementById('confirmExportBtn').addEventListener('click', ()=>{
  const scope = document.querySelector('input[name="exportScope"]:checked').value;
  const rows = scope === 'all' ? talents : getFiltered();
  const selectedKeys = Array.from(document.querySelectorAll('.export-col-checkbox:checked')).map(cb=>cb.value);
  if(selectedKeys.length === 0){
    showToast("Select at least one column to export.");
    return;
  }
  const selectedCols = exportColumns.filter(col=>selectedKeys.includes(col.key));
  const data = rows.map(c=>{
    const obj = {};
    selectedCols.forEach(col=>{ obj[col.label] = col.get(c); });
    return obj;
  });
  try {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Talents");
    const filename = `talents_export_${toISO(today)}.xlsx`;
    XLSX.writeFile(wb, filename);
    closeExportModalFn();
    showToast(`Exported ${data.length} talents to ${filename}`, checkIcon);
  } catch(err){
    showToast("Export failed — please try again.");
  }
});

/* ---------- Add Talent Modal ---------- */
const modalOverlay = document.getElementById('modalOverlay');
const addModal = document.getElementById('addModal');
function openAddModal(){
  document.getElementById('addTalentForm').reset();
  document.getElementById('f_contractStart').value = toISO(today);
  document.getElementById('f_contractEnd').value = toISO(addDays(today, 180));
  document.getElementById('f_passExpiry').value = toISO(addDays(today, 365));
  modalOverlay.classList.add('open');
  addModal.classList.add('open');
}
function closeAddModalFn(){
  modalOverlay.classList.remove('open');
  addModal.classList.remove('open');
}
document.getElementById('openAddModalBtn').addEventListener('click', openAddModal);
document.getElementById('closeAddModal').addEventListener('click', closeAddModalFn);
document.getElementById('cancelAddModal').addEventListener('click', closeAddModalFn);
modalOverlay.addEventListener('click', closeAddModalFn);

document.getElementById('addTalentForm').addEventListener('submit', async e=>{
  e.preventDefault();
  const firstName = document.getElementById('f_firstName').value.trim();
  const lastName = document.getElementById('f_lastName').value.trim();

  const skillsetInput = document.getElementById('f_skillset').value.trim();
  const skillset = skillsetInput ? skillsetInput.split(",").map(s=>s.trim()).filter(Boolean) : [];

  const passIssueVal = document.getElementById('f_passIssueDate').value;
  const dobVal = document.getElementById('f_dateOfBirth').value;

  const createPayload = {
    firstName, lastName,
    client: document.getElementById('f_client').value,
    projectType: document.getElementById('f_projectType').value,
    caseOwner: document.getElementById('f_caseOwner').value,
    entity: document.getElementById('f_entity').value,
    salary: Number(document.getElementById('f_salary').value),
    chargeRate: Number(document.getElementById('f_chargeRate').value),
    contractStart: document.getElementById('f_contractStart').value,
    contractEnd: document.getElementById('f_contractEnd').value,
    passExpiry: document.getElementById('f_passExpiry').value,
    workPassType: document.getElementById('f_workPassType').value,
    jobTitle: document.getElementById('f_jobTitle').value.trim(),
    workLocation: document.getElementById('f_workLocation').value,
  };

  try{
    let newTalent = await api.talents.create(createPayload);

    // Optional personal-detail fields the add form also collects, applied as a follow-up patch.
    const personalPatch = {
      nric: document.getElementById('f_nric').value.trim(),
      dateOfBirth: dobVal || null,
      sex: document.getElementById('f_sex').value,
      nationality: document.getElementById('f_nationality').value,
      maritalStatus: document.getElementById('f_maritalStatus').value,
      dependants: document.getElementById('f_dependants').value !== "" ? Number(document.getElementById('f_dependants').value) : undefined,
      email: document.getElementById('f_email').value.trim(),
      contactNumber: document.getElementById('f_contactNumber').value.trim(),
      address: document.getElementById('f_address').value.trim(),
      bankAccount: document.getElementById('f_bankAccount').value.trim(),
      skillset,
    };
    const hasPersonalDetail = Object.entries(personalPatch).some(([k,v]) => k==='skillset' ? v.length>0 : (v !== "" && v !== undefined));
    if(hasPersonalDetail){
      newTalent = await api.talents.updatePersonal(newTalent.id, personalPatch);
    }

    if(passIssueVal){
      newTalent = await api.talents.updateWorkPass(newTalent.id, { passIssueDate: passIssueVal });
    }

    computeDerived(newTalent);
    talents.unshift(newTalent);
    closeAddModalFn();
    sortKey = "lastName"; sortDir = 1; updateSortArrows();
    page = 1;
    renderStats();
    renderTable();
    showToast(`${newTalent.name} added`, checkIcon);
  }catch(err){
    showToast(`Failed to add talent: ${err.message}`, null);
  }
});

/* ---------- Edit Slide-over ---------- */
const editOverlay = document.getElementById('editOverlay');
const editSlideOver = document.getElementById('editSlideOver');
let editingId = null;

function openEditPanel(id){
  const c = talents.find(x=>x.id === id);
  if(!c) return;
  editingId = id;
  document.getElementById('editPanelName').textContent = c.name;
  document.getElementById('editPanelSub').textContent = `${c.client} · ${c.projectType}`;
  document.getElementById('editReadonlyInfo').innerHTML = `
    <div>Client Attached: <span class="font-medium text-[var(--text)]">${c.client}</span></div>
    <div>Project Type: <span class="font-medium text-[var(--text)]">${c.projectType}</span></div>
  `;
  document.getElementById('e_salary').value = c.salary;
  document.getElementById('e_chargeRate').value = c.chargeRate;
  document.getElementById('e_contractStart').value = toISO(c.contractStart);
  document.getElementById('e_contractEnd').value = toISO(c.contractEnd);
  document.getElementById('e_passExpiry').value = toISO(c.passExpiry);
  editOverlay.classList.add('open');
  editSlideOver.classList.add('open');
}
function closeEditPanelFn(){
  editOverlay.classList.remove('open');
  editSlideOver.classList.remove('open');
  editingId = null;
}
document.getElementById('closeEditPanel').addEventListener('click', closeEditPanelFn);
document.getElementById('cancelEditPanel').addEventListener('click', closeEditPanelFn);
editOverlay.addEventListener('click', closeEditPanelFn);

document.getElementById('editForm').addEventListener('submit', async e=>{
  e.preventDefault();
  const c = talents.find(x=>x.id === editingId);
  if(!c) return;
  const salary = Number(document.getElementById('e_salary').value);
  const chargeRate = Number(document.getElementById('e_chargeRate').value);
  const contractStart = document.getElementById('e_contractStart').value;
  const contractEnd = document.getElementById('e_contractEnd').value;
  const passExpiry = document.getElementById('e_passExpiry').value;
  try{
    // Sequential (not Promise.all) so each response reflects every prior write — the last one
    // is the authoritative merged state to apply locally.
    await api.talents.updatePayroll(c.id, { salary });
    await api.talents.updateBilling(c.id, { chargeRate });
    await api.talents.updateContract(c.id, { contractStart, contractEnd });
    const afterWorkPass = await api.talents.updateWorkPass(c.id, { passExpiry });
    Object.assign(c, afterWorkPass);
    computeDerived(c);
    closeEditPanelFn();
    renderStats();
    renderTable();
    if(currentProfileId === c.id && !document.getElementById('view-profile').classList.contains('hidden')){
      renderTalentProfile(c);
    }
    showToast(`${c.name}'s record updated`, checkIcon);
  }catch(err){
    showToast(`Failed to update ${c.name}: ${err.message}`, null);
  }
});

/* ---------- Talent Profile (full page) ---------- */
let currentProfileId = null;
let profilePayrollMonthOffset = 0;
let profileTimesheetMonthOffset = 0;
const profileMonthFilterInit = new Set();
function initProfileMonthFilter(selectId){
  const sel = document.getElementById(selectId);
  if(!profileMonthFilterInit.has(selectId)){
    profileMonthFilterInit.add(selectId);
    for(let i=0;i<6;i++){
      const idx = HISTORY_MONTHS-1-i;
      const d = monthDates[idx];
      const opt = document.createElement('option');
      opt.value = i;
      opt.textContent = i===0 ? `${monthLabelFull(d)} (Current)` : monthLabelFull(d);
      sel.appendChild(opt);
    }
  }
  sel.value = selectId === 'profilePayrollMonthFilter' ? profilePayrollMonthOffset : profileTimesheetMonthOffset;
}

function dlRow(label, value){
  return `<div class="flex justify-between gap-4"><dt class="text-[var(--muted)]">${label}</dt><dd class="font-medium text-right">${value}</dd></div>`;
}
function editTextRow(label, id, value){
  return `<div class="flex items-center justify-between gap-3 py-0.5">
    <span class="text-[var(--muted)] shrink-0">${label}</span>
    <input id="${id}" type="text" class="filter-input text-right !py-1 !px-2 max-w-[55%]" value="${(value??'').toString().replace(/"/g,'&quot;')}" />
  </div>`;
}
function editNumberRow(label, id, value){
  return `<div class="flex items-center justify-between gap-3 py-0.5">
    <span class="text-[var(--muted)] shrink-0">${label}</span>
    <input id="${id}" type="number" min="0" class="filter-input text-right !py-1 !px-2 max-w-[40%]" value="${value??0}" />
  </div>`;
}
function editDateRow(label, id, value){
  return `<div class="flex items-center justify-between gap-3 py-0.5">
    <span class="text-[var(--muted)] shrink-0">${label}</span>
    <input id="${id}" type="date" class="filter-input text-right !py-1 !px-2 max-w-[55%]" value="${toISO(value)}" />
  </div>`;
}
function editDateRowNullable(label, id, value){
  return `<div class="flex items-center justify-between gap-3 py-0.5">
    <span class="text-[var(--muted)] shrink-0">${label}</span>
    <input id="${id}" type="date" class="filter-input text-right !py-1 !px-2 max-w-[55%]" value="${value ? toISO(value) : ''}" />
  </div>`;
}
function editSelectRow(label, id, options, selected){
  const opts = options.map(o=>`<option value="${o}" ${o===selected?'selected':''}>${o}</option>`).join('');
  return `<div class="flex items-center justify-between gap-3 py-0.5">
    <span class="text-[var(--muted)] shrink-0">${label}</span>
    <select id="${id}" class="select-basic !py-1 !px-2 max-w-[55%]">${opts}</select>
  </div>`;
}

const returnViewLabels = {
  talents: "Back to Talents",
  insurance: "Back to Insurance",
  workpass: "Back to Work Pass",
  home: "Back to Home",
  contracts: "Back to Contracts",
  finance: "Back to Payroll and Cost",
  billing: "Back to Billing",
  operations: "Back to Timesheet and Leave",
  offboarding: "Back to Offboarding",
  renewals: "Back to Renewal Centre",
};
const returnViewToTab = {
  talents: "personal",
  insurance: "insurance",
  home: "personal",
  workpass: "workpass",
  contracts: "contract",
  finance: "payroll",
  billing: "billing",
  operations: "leave",
  offboarding: "offboarding",
  renewals: "personal",
};
let profileReturnView = "talents";

function openTalentProfile(id, returnView){
  const c = talents.find(x=>x.id === id);
  if(!c) return;
  currentProfileId = id;
  profileEditingTabs.clear();
  profilePayrollMonthOffset = 0;
  profileTimesheetMonthOffset = 0;
  profileReturnView = returnView || "talents";
  activeProfileTab = returnViewToTab[profileReturnView] || 'personal';
  document.getElementById('backToTalentsLabel').textContent = returnViewLabels[profileReturnView] || "Back to Talents";
  document.querySelectorAll('.view-panel').forEach(el=>el.classList.add('hidden'));
  document.getElementById('view-profile').classList.remove('hidden');
  sidebarLinks.forEach(l=>l.classList.remove('active'));
  renderTalentProfile(c);
  window.scrollTo(0,0);
}

const profileTabsList = [
  {id:'personal', label:'Personal Detail'},
  {id:'workpass', label:'Work Pass'},
  {id:'contract', label:'Contract'},
  {id:'insurance', label:'Insurance'},
  {id:'payroll', label:'Payroll and Cost'},
  {id:'billing', label:'Billing'},
  {id:'leave', label:'Timesheet and Leave'},
  {id:'offboarding', label:'Offboarding'},
];
let activeProfileTab = 'personal';

function renderProfileTabBar(){
  const bar = document.getElementById('profileTabBar');
  bar.innerHTML = profileTabsList.map(t=>`
    <button type="button" class="profile-tab-btn px-4 py-3 text-sm font-medium ${activeProfileTab===t.id?'active':''}" data-tab="${t.id}">${t.label}</button>
  `).join('');
  bar.querySelectorAll('.profile-tab-btn').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      activeProfileTab = btn.dataset.tab;
      switchProfileTab();
    });
  });
}
function switchProfileTab(){
  document.querySelectorAll('.profile-tab-panel').forEach(p=>p.classList.add('hidden'));
  document.getElementById('tab-'+activeProfileTab).classList.remove('hidden');
  renderProfileTabBar();
}

function profileStatusItem(label, value, isAlert){
  return `<div>
    <div class="text-xs text-[var(--muted)] mb-1">${label}</div>
    <div class="font-semibold text-sm ${isAlert?'date-alert':''}">${value}</div>
  </div>`;
}
function statusPillStyle(status){
  const good = ["Uploaded","Signed","Completed","Approved","Received","Active","Covered","Yes"];
  const bad = ["Not Uploaded","Rejected","Overdue","Expired","Not Covered","No","Exited","Terminated"];
  if(good.includes(status)) return `background:var(--green-bg);color:var(--green-text)`;
  if(bad.includes(status)) return `background:var(--red-bg);color:var(--red-text)`;
  return `background:var(--amber-bg);color:var(--amber-text)`;
}
function checklistStatusMeta(status){
  if(status === "Completed") return {
    color: "var(--green-text)",
    icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--green-text)" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><polyline points="8 12 11 15 16 9"/></svg>`
  };
  if(status === "In Progress") return {
    color: "var(--amber-text)",
    icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--amber-text)" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 7 12 12 15 14"/></svg>`
  };
  return {
    color: "var(--red-text)",
    icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--red-text)" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="7" x2="12" y2="12"/><circle cx="12" cy="16.5" r="1" fill="var(--red-text)" stroke="none"/></svg>`
  };
}
function documentRow(label, status){
  return `<div class="flex items-center justify-between py-2.5">
    <span class="text-sm">${label}</span>
    <span class="pill" style="${statusPillStyle(status)}">${status}</span>
  </div>`;
}
function noteCard(label, text){
  return `<div class="border border-[var(--border)] rounded-lg p-3">
    <div class="text-xs text-[var(--muted)] mb-1">${label}</div>
    <div>${text || '—'}</div>
  </div>`;
}
function timelineItem(date, label){
  return `<div class="flex gap-3">
    <div class="w-2 h-2 rounded-full bg-[var(--blue)] mt-1.5 shrink-0"></div>
    <div>
      <div class="text-xs text-[var(--muted)]">${fmtDate(date)}</div>
      <div>${label}</div>
    </div>
  </div>`;
}

function refreshProfileIfOpen(c){
  if(currentProfileId === c.id && !document.getElementById('view-profile').classList.contains('hidden')){
    renderTalentProfile(c);
  }
}

let profileEditingTabs = new Set();

function editBarHtml(tabKey){
  return profileEditingTabs.has(tabKey)
    ? `<div class="flex gap-2">
        <button type="button" class="profile-tab-cancel-btn btn-secondary rounded-md px-3 py-1.5 text-xs font-medium" data-tab="${tabKey}">Cancel</button>
        <button type="button" class="profile-tab-save-btn btn-primary rounded-md px-3 py-1.5 text-xs font-medium" data-tab="${tabKey}">Save Changes</button>
      </div>`
    : `<button type="button" class="profile-tab-edit-btn btn-secondary rounded-md px-3 py-1.5 text-xs font-medium" data-tab="${tabKey}">Edit Profile</button>`;
}

function renderTalentProfile(c){
  const initials = ((c.firstName||'?')[0] + (c.lastName||'')[0]).toUpperCase();
  document.getElementById('profileAvatar').textContent = initials;
  document.getElementById('profileName').textContent = c.name;
  document.getElementById('profileManagedBy').textContent = c.caseOwner;
  document.getElementById('profileEntity').textContent = c.entity;
  document.getElementById('profileManagedDisplay').classList.remove('hidden');
  const managedEditEl = document.getElementById('profileManagedEdit');
  managedEditEl.classList.add('hidden');
  managedEditEl.classList.remove('flex');

  document.getElementById('profileRemoveBtn').onclick = ()=> removeTalent(c);
  document.getElementById('profileOffboardBtn').onclick = ()=>{
    const confirmed = confirm(`Move ${c.name} into the offboarding process?`);
    if(!confirmed) return;
    c.contractEnd = addDays(today, 14);
    computeDerived(c);
    renderTalentProfile(c);
    renderStats();
    renderTable();
    showToast(`${c.name} added to offboarding`, checkIcon);
  };
  document.getElementById('profileManagedEditBtn').onclick = ()=>{
    document.getElementById('profileManagedByInput').value = c.caseOwner;
    fillOptions(document.getElementById('profileEntitySelect'), [...new Set(entities)].sort(), null);
    addAddNewOption(document.getElementById('profileEntitySelect'), "+ Add New Entity…");
    document.getElementById('profileEntitySelect').value = c.entity;
    document.getElementById('profileManagedDisplay').classList.add('hidden');
    managedEditEl.classList.remove('hidden');
    managedEditEl.classList.add('flex');
  };
  document.getElementById('profileManagedCancelBtn').onclick = ()=>{
    document.getElementById('profileManagedDisplay').classList.remove('hidden');
    managedEditEl.classList.add('hidden');
    managedEditEl.classList.remove('flex');
  };
  document.getElementById('profileManagedSaveBtn').onclick = ()=>{
    const newManagedBy = document.getElementById('profileManagedByInput').value.trim();
    if(newManagedBy) c.caseOwner = newManagedBy;
    const newEntity = document.getElementById('profileEntitySelect').value;
    if(newEntity && newEntity !== "__add_new__") c.entity = newEntity;
    renderTalentProfile(c);
    renderStats();
    renderTable();
    showToast(`${c.name}'s profile updated`, checkIcon);
  };
  document.getElementById('profileEntitySelect').onchange = e=>{
    if(e.target.value !== "__add_new__") return;
    const newEntity = prompt("Enter the new entity name:");
    if(newEntity && newEntity.trim()){
      const trimmed = newEntity.trim();
      if(!entities.includes(trimmed)) entities.push(trimmed);
      fillOptions(e.target, [...new Set(entities)].sort(), null);
      addAddNewOption(e.target, "+ Add New Entity…");
      e.target.value = trimmed;
      showToast(`"${trimmed}" added as a new entity`, checkIcon);
    } else {
      e.target.value = c.entity;
    }
  };

  const passAlert = c.passDaysLeft <= 30;
  const contractAlert = c.contractDaysLeft <= 30;
  const isCitizenOrPR = ["Singapore Citizen","PR"].includes(c.workPassType);

  /* ----- Personal Detail tab ----- */
  document.getElementById('profilePersonalEditBar').innerHTML = editBarHtml('personal');
  if(profileEditingTabs.has('personal')){
    document.getElementById('profilePersonal').innerHTML = [
      editTextRow("Full Name", "p_name", c.name),
      editDateRow("Date of Birth", "p_dateOfBirth", c.dateOfBirth),
      editSelectRow("Sex", "p_sex", ["Male","Female"], c.sex),
      editSelectRow("Nationality", "p_nationality", nationalities, c.nationality),
      editTextRow("NRIC / FIN", "p_nric", c.nric),
      editSelectRow("Marital Status", "p_maritalStatus", maritalStatuses, c.maritalStatus),
      editNumberRow("Dependants", "p_dependants", c.dependants),
      editTextRow("Residential Address", "p_address", c.address),
    ].join('');
    document.getElementById('profileContact').innerHTML = [
      editTextRow("Contact Number", "p_contactNumber", c.contactNumber),
      editTextRow("Email Address", "p_email", c.email),
      editTextRow("Bank Account Number", "p_bankAccount", c.bankAccount),
    ].join('');
  } else {
    document.getElementById('profilePersonal').innerHTML = [
      dlRow("Full Name", c.name),
      dlRow("Date of Birth", fmtDate(c.dateOfBirth)),
      dlRow("Sex", c.sex),
      dlRow("Nationality", c.nationality),
      dlRow("NRIC / FIN", c.nric),
      dlRow("Marital Status", c.maritalStatus),
      dlRow("Dependants", c.dependants),
      dlRow("Residential Address", `<span class="font-normal text-xs">${c.address}</span>`),
    ].join('');
    document.getElementById('profileContact').innerHTML = [
      dlRow("Contact Number", c.contactNumber),
      dlRow("Email Address", c.email),
      dlRow("Bank Account Number", `${c.bankAccount} <span class="text-[10px] text-[var(--muted)]">(restricted)</span>`),
    ].join('');
  }

  /* ----- Work Pass tab ----- */
  document.getElementById('profileWorkpassEditBar').innerHTML = isCitizenOrPR ? '' : editBarHtml('workpass');
  const workPassBucket = passStatusDisplay(c);
  if(!isCitizenOrPR && profileEditingTabs.has('workpass')){
    document.getElementById('profileEmployment').innerHTML = [
      editTextRow("NRIC / FIN No.", "p_nric_wp", c.nric),
      editSelectRow("Work Pass", "p_workPassType", workPassTypes, c.workPassType),
      editDateRowNullable("Date of Issue", "p_passIssueDate", c.passIssueDate),
      editDateRow("Date of Expiry", "p_passExpiry", c.passExpiry),
      editSelectRow("Pass Status", "p_passStatus", passStatusOptions, c.passStatus),
      editSelectRow("Renewal Status", "p_renewalStatus", ["Not Started","In Progress","Completed"], c.renewalStatus),
      editSelectRow("Pass Status Override", "p_passLifecycleStatus", ["Automatic (based on expiry date)","Pending Application","Inactive"], c.passLifecycleStatus || "Automatic (based on expiry date)"),
    ].join('');
  } else {
    document.getElementById('profileEmployment').innerHTML = [
      dlRow("NRIC / FIN No.", c.nric),
      dlRow("Work Pass", c.workPassType),
      dlRow("Date of Issue", c.passIssueDate ? fmtDate(c.passIssueDate) : "N/A"),
      dlRow("Date of Expiry", isCitizenOrPR ? "N/A" : `<span class="${passAlert?'date-alert':''}">${fmtDate(c.passExpiry)}</span>`),
      dlRow("Days Left to Expiry", isCitizenOrPR ? "N/A" : `<span class="${passAlert?'date-alert':''}">${c.passDaysLeft<0?`${Math.abs(c.passDaysLeft)}d overdue`:`${c.passDaysLeft}d`}</span>`),
      dlRow("Pass Status", `<span class="pill" style="${workPassBucket.style}">${workPassBucket.label}</span>`),
      dlRow("Renewal Status", (workPassBucket.label === "Requires Renewal" || workPassBucket.label === "Eligible for Renewal") ? `<span class="pill" style="${renewalStatusPillStyleContract(c.renewalStatus)}">${renewalStatusDisplayLabel(c.renewalStatus)}</span>` : `<span class="text-[var(--muted)]">—</span>`),
    ].join('');
  }

  /* ----- Contract tab ----- */
  document.getElementById('profileContractDetails').innerHTML = [
    dlRow("Job Title", c.jobTitle),
    dlRow("Client", c.client),
    dlRow("Project Type", c.projectType),
    dlRow("Date of Commencement", fmtDate(c.contractStart)),
    dlRow("Date of Expiry", `<span class="${contractAlert?'date-alert':''}">${fmtDate(c.contractEnd)}</span>`),
    dlRow("Days Left to Expiry", `<span class="${contractAlert?'date-alert':''}">${c.contractDaysLeft<0?`${Math.abs(c.contractDaysLeft)}d overdue`:`${c.contractDaysLeft}d`}</span>`),
    dlRow("Notice Period", c.noticePeriod),
    dlRow("Contract Status", (()=>{ const b = contractStatusDisplay(c); return `<span class="pill" style="${b.style}">${b.label}</span>`; })()),
    dlRow("Renewal Status", `<span class="pill" style="${renewalStatusPillStyleContract(c.contractRenewalStatus)}">${renewalStatusDisplayLabel(c.contractRenewalStatus)}</span>`),
    dlRow("Remarks", c.remarks),
    dlRow("SOW Required", c.sowRequired),
    dlRow("PO Required", c.poRequired),
  ].join('');

  /* ----- Insurance tab ----- */
  document.getElementById('profileInsuranceEditBar').innerHTML = editBarHtml('insurance');
  const hasPolicy = c.policyType !== "Not Required";
  const policyBucket = hasPolicy ? contractStatusBucket(c.policyDaysLeft) : null;
  if(profileEditingTabs.has('insurance')){
    document.getElementById('profileInsurance').innerHTML = [
      editSelectRow("Type of Policy", "p_policyType", ["Policy 1","Policy 2A","Not Required"], c.policyType),
      editDateRowNullable("Date of Issue", "p_policyIssueDate", c.policyIssueDate),
      editDateRowNullable("Date of Expiry", "p_policyExpiry", c.policyExpiry),
      editSelectRow("Renewal Status", "p_policyRenewalStatus", ["Not Started","In Progress","Completed"], c.policyRenewalStatus),
      editTextRow("Remarks", "p_policyRemarks", c.policyRemarks || ""),
    ].join('');
  } else {
    document.getElementById('profileInsurance').innerHTML = [
      dlRow("Type of Policy", c.policyType),
      dlRow("Date of Issue", hasPolicy ? fmtDate(c.policyIssueDate) : "N/A"),
      dlRow("Date of Expiry", hasPolicy ? fmtDate(c.policyExpiry) : "N/A"),
      dlRow("Days Left to Expiry", hasPolicy ? (c.policyDaysLeft<0?`${Math.abs(c.policyDaysLeft)}d overdue`:`${c.policyDaysLeft}d`) : "N/A"),
      dlRow("Policy Status", hasPolicy ? `<span class="pill" style="${policyBucket.style}">${policyBucket.label}</span>` : `<span class="pill" style="${naPillStyle}">N/A</span>`),
      dlRow("Renewal Status", hasPolicy ? `<span class="pill" style="${renewalStatusPillStyleContract(c.policyRenewalStatus)}">${renewalStatusDisplayLabel(c.policyRenewalStatus)}</span>` : "N/A"),
      dlRow("Remarks", c.policyRemarks || "—"),
    ].join('');
  }

  /* ----- Payroll & Cost tab (breakdown, read-only) ----- */
  document.getElementById('profileFinancials').innerHTML = [
    dlRow("Salary (Monthly)", fmtMoney(c.salary)),
    dlRow("Charge Rate (Daily)", fmtMoney(c.chargeRate)+"/day"),
    dlRow("Contract Start", fmtDate(c.contractStart)),
    dlRow("Contract End", `<span class="${contractAlert?'date-alert':''}">${fmtDate(c.contractEnd)}${contractAlert?` (${c.contractDaysLeft}d)`:''}</span>`),
    dlRow("Billing Type", c.billingType),
    dlRow("Invoice Status", c.invoiceStatus),
  ].join('');

  initProfileMonthFilter('profilePayrollMonthFilter');
  const payrollFigures = financeTalentFigures(c, profilePayrollMonthOffset);
  document.getElementById('profilePayrollBreakdown').innerHTML = [
    dlRow("CPF", fmtMoney(Math.round(payrollFigures.cpf))),
    dlRow("Skills Development Levy", fmtMoney(Math.round(payrollFigures.sdl))),
    dlRow("WICA", fmtMoney(Math.round(payrollFigures.wica))),
    dlRow("Medical Insurance Cost", fmtMoney(Math.round(payrollFigures.insurance))),
    dlRow("Allowances", fmtMoney(Math.round(payrollFigures.allowances))),
    dlRow("Claims / Reimbursements", fmtMoney(Math.round(payrollFigures.claims))),
    dlRow("Overtime", fmtMoney(Math.round(payrollFigures.overtime))),
    dlRow("No-Pay Leave Deduction", `-${fmtMoney(Math.round(payrollFigures.noPayLeaveDeduction))}`),
    dlRow("Other Statutory Costs", fmtMoney(Math.round(payrollFigures.otherStatutoryCosts))),
    dlRow("Work Pass Admin Fee", `${fmtMoney(Math.round(payrollFigures.adminFee))}<div class="text-[10px] text-[var(--muted)] font-normal">${c.workPassType} · ${c.passStatus}</div>`),
    dlRow("Total Employer Cost (Est.)", `<span class="font-semibold">${fmtMoney(Math.round(payrollFigures.totalCost))}</span>`),
    dlRow("Revenue Billed (Est. Monthly)", fmtMoney(Math.round(payrollFigures.revenue))),
    dlRow("Gross Profit (Est.)", `<span class="font-semibold" style="color:${(payrollFigures.revenue-payrollFigures.totalCost)>=0?'var(--green-text)':'var(--red-text)'}">${fmtMoney(Math.round(payrollFigures.revenue-payrollFigures.totalCost))}</span>`),
  ].join('');
  document.getElementById('profilePayrollMonthFilter').onchange = e=>{
    profilePayrollMonthOffset = Number(e.target.value);
    renderTalentProfile(c);
  };

  /* ----- Billing tab ----- */
  document.getElementById('profileBillingEditBar').innerHTML = editBarHtml('billing');
  if(profileEditingTabs.has('billing')){
    document.getElementById('profileBilling').innerHTML = [
      editSelectRow("Billing Type", "p_billingType", billingTypes, c.billingType),
      editSelectRow("Invoice Status", "p_invoiceStatus", invoiceStatuses, c.invoiceStatus),
    ].join('');
  } else {
    document.getElementById('profileBilling').innerHTML = [
      dlRow("Billing Type", c.billingType),
      dlRow("Bill Rate", fmtMoney(c.chargeRate)),
      dlRow("Invoice Number", c.talentInvoiceNumber),
      dlRow("Invoice Date", fmtDate(c.talentInvoiceDate)),
      dlRow("Invoice Amount", fmtMoney(c.talentInvoiceAmount)),
      dlRow("Invoice Status", c.invoiceStatus),
      dlRow("Due Date", fmtDate(c.talentInvoiceDueDate)),
      dlRow("Paid Date", c.talentInvoicePaidDate ? fmtDate(c.talentInvoicePaidDate) : "N/A"),
      dlRow("SOW Status", c.sowStatus),
      dlRow("PO Status", c.poStatus),
    ].join('');
  }

  /* ----- Leave & Timesheets tab ----- */
  document.getElementById('profileLeave').innerHTML = [
    dlRow("Annual Leave", `${c.annualLeaveTaken}/${c.annualLeaveEntitlement} taken · ${c.annualLeaveBalance} balance`),
    dlRow("Sick Leave", `${c.sickLeaveTaken}/${c.sickLeaveEntitlement} taken · ${c.sickLeaveBalance} balance`),
    dlRow("Off-in-Lieu", `${c.offInLieuTaken}/${c.offInLieuEntitlement} taken · ${c.offInLieuBalance} balance`),
    dlRow("Unpaid Leave Taken", c.unpaidLeaveTaken),
    dlRow("MC Upload", c.mcUpload),
    dlRow("Leave Approval Status", c.leaveApprovalStatus),
  ].join('');

  initProfileMonthFilter('profileTimesheetMonthFilter');
  const ts = getTimesheetForMonth(c, profileTimesheetMonthOffset);
  document.getElementById('profileTimesheetMonth').textContent = ts.monthLabel;
  document.getElementById('profileTimesheet').innerHTML = [
    dlRow("Working Days", ts.workingDays),
    dlRow("Timesheet Submitted", ts.submitted),
    dlRow("Submission Date", ts.submissionDate ? fmtDate(ts.submissionDate) : "N/A"),
    dlRow("Client Approved", ts.approved),
    dlRow("Approval Date", ts.approvalDate ? fmtDate(ts.approvalDate) : "N/A"),
    dlRow("Overtime Hours", ts.overtimeHours),
    dlRow("Absence Days", ts.absenceDays),
    dlRow("Remarks", ts.remarks),
  ].join('');
  document.getElementById('profileTimesheetMonthFilter').onchange = e=>{
    profileTimesheetMonthOffset = Number(e.target.value);
    renderTalentProfile(c);
  };

  /* ----- Offboarding tab ----- */
  document.getElementById('profileOffboardExit').innerHTML = [
    dlRow("Last Working Day", fmtDate(c.lastWorkingDay)),
    dlRow("Resignation / Termination Reason", c.resignationReason),
    dlRow("Notice Served", c.noticeServed),
    dlRow("Client Notified", c.clientNotified),
    dlRow("Replacement Required", c.replacementRequired),
  ].join('');
  document.getElementById('profileOffboardSettlement').innerHTML = [
    dlRow("Final Salary Calculation", fmtMoney(computeFinalSalary(c))),
    dlRow("Leave Encashment / Deduction", fmtMoney(computeLeaveEncashment(c))),
    dlRow("Work Pass Cancellation Date", c.workPassCancellationDate ? fmtDate(c.workPassCancellationDate) : "N/A"),
    dlRow("Final Invoice Issued", c.finalInvoiceIssued),
    dlRow("Exit Documents Completed", c.exitDocsCompleted),
    dlRow("Remarks", c.offboardingRemarks),
  ].join('');
  document.getElementById('profileOffboardChecklist').innerHTML = c.offboardingChecklist.map(item=>{
    const meta = checklistStatusMeta(item.status);
    return `
    <div class="border border-[var(--border)] rounded-lg p-3">
      <div class="flex items-center gap-2 mb-2">
        ${meta.icon}
        <span class="text-sm font-medium">${item.label}</span>
      </div>
      <div class="text-xs font-semibold" style="color:${meta.color}">${item.status}</div>
    </div>`;
  }).join('');

  renderProfileTabBar();
  document.querySelectorAll('.profile-tab-panel').forEach(p=>p.classList.add('hidden'));
  document.getElementById('tab-'+activeProfileTab).classList.remove('hidden');

  document.getElementById('profileEditContractBtn').onclick = ()=> openContractEditModal(c.id);
  document.getElementById('profileEditPayrollBtn').onclick = ()=> openPayrollEditModal(c.id);
  document.getElementById('profileEditLeaveBtn').onclick = ()=> openLeaveViewModal(c.id);
  document.getElementById('profileEditOffboardBtn').onclick = ()=> openOffboardViewModal(c.id);

  document.querySelectorAll('.profile-tab-edit-btn').forEach(btn=>{
    btn.addEventListener('click', ()=>{ profileEditingTabs.add(btn.dataset.tab); renderTalentProfile(c); });
  });
  document.querySelectorAll('.profile-tab-cancel-btn').forEach(btn=>{
    btn.addEventListener('click', ()=>{ profileEditingTabs.delete(btn.dataset.tab); renderTalentProfile(c); });
  });
  document.querySelectorAll('.profile-tab-save-btn').forEach(btn=>{
    btn.addEventListener('click', ()=> saveProfileTab(btn.dataset.tab, c));
  });
}

async function saveProfileTab(tabKey, c){
  try{
    let updated;
    if(tabKey === 'personal'){
      updated = await api.talents.updatePersonal(c.id, {
        name: document.getElementById('p_name').value.trim() || c.name,
        dateOfBirth: document.getElementById('p_dateOfBirth').value || null,
        sex: document.getElementById('p_sex').value,
        nationality: document.getElementById('p_nationality').value,
        nric: document.getElementById('p_nric').value.trim(),
        maritalStatus: document.getElementById('p_maritalStatus').value,
        dependants: Number(document.getElementById('p_dependants').value),
        address: document.getElementById('p_address').value.trim(),
        contactNumber: document.getElementById('p_contactNumber').value.trim(),
        email: document.getElementById('p_email').value.trim(),
        bankAccount: document.getElementById('p_bankAccount').value.trim(),
      });
    } else if(tabKey === 'workpass'){
      const issueVal = document.getElementById('p_passIssueDate').value;
      const passOverrideVal = document.getElementById('p_passLifecycleStatus').value;
      updated = await api.talents.updateWorkPass(c.id, {
        workPassType: document.getElementById('p_workPassType').value,
        passIssueDate: issueVal || null,
        passExpiry: document.getElementById('p_passExpiry').value,
        passStatus: document.getElementById('p_passStatus').value,
        renewalStatus: document.getElementById('p_renewalStatus').value,
        passLifecycleStatus: passOverrideVal === "Automatic (based on expiry date)" ? "" : passOverrideVal,
      });
      c.nric = document.getElementById('p_nric_wp').value.trim();
      if(c.nric) await api.talents.updatePersonal(c.id, { nric: c.nric });
    } else if(tabKey === 'insurance'){
      const issueVal = document.getElementById('p_policyIssueDate').value;
      const expVal = document.getElementById('p_policyExpiry').value;
      updated = await api.talents.updateInsurance(c.id, {
        policyType: document.getElementById('p_policyType').value,
        policyIssueDate: issueVal || null,
        policyExpiry: expVal || null,
        policyRenewalStatus: document.getElementById('p_policyRenewalStatus').value,
        policyRemarks: document.getElementById('p_policyRemarks').value.trim(),
      });
    } else if(tabKey === 'billing'){
      updated = await api.talents.updateBilling(c.id, {
        billingType: document.getElementById('p_billingType').value,
        invoiceStatus: document.getElementById('p_invoiceStatus').value,
      });
    }
    Object.assign(c, updated);
    computeDerived(c);
    profileEditingTabs.delete(tabKey);
    renderTalentProfile(c);
    renderStats();
    renderTable();
    showToast(`${c.name}'s profile updated`, checkIcon);
  }catch(err){
    showToast(`Failed to update ${c.name}: ${err.message}`, null);
  }
}

async function removeTalent(c){
  const confirmed = confirm(`Remove ${c.name} from the talent list? This cannot be undone.`);
  if(!confirmed) return;
  try{
    await api.talents.remove(c.id);
    talents = talents.filter(x=>x.id !== c.id);
    currentProfileId = null;
    renderStats();
    page = 1;
    renderTable();
    switchView('talents');
    showToast(`${c.name} was removed`, checkIcon);
  }catch(err){
    showToast(`Failed to remove ${c.name}: ${err.message}`, null);
  }
}

document.getElementById('backToTalents').addEventListener('click', ()=> switchView(profileReturnView));

/* ---------- Notification bell & profile dropdown ---------- */
const notifBtn = document.getElementById('notifBtn');
function warnIcon(){
  return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--red-dot)" stroke-width="2.5" class="mt-0.5 shrink-0"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><path d="M12 9v4M12 17h.01"/></svg>`;
}
function talentNotifRow(c, detailLabel, detailValue){
  return `
    <div class="px-4 py-2.5 text-sm flex items-start gap-2 border-b border-[var(--border)]">
      ${warnIcon()}
      <div>
        <div class="font-medium notif-talent-link cursor-pointer hover:underline hover:text-[var(--blue-dark)]" data-id="${c.id}">${c.name}</div>
        <div class="text-xs text-[var(--muted)]">${c.client}</div>
        <div class="text-xs font-semibold" style="color:var(--red-text)">${detailLabel}: ${detailValue}</div>
      </div>
    </div>`;
}
function clientNotifRow(client, detailLabel, detailValue){
  return `
    <div class="px-4 py-2.5 text-sm flex items-start gap-2 border-b border-[var(--border)]">
      ${warnIcon()}
      <div>
        <div class="font-medium notif-client-link cursor-pointer hover:underline hover:text-[var(--blue-dark)]" data-client="${client}">${client}</div>
        <div class="text-xs font-semibold" style="color:var(--red-text)">${detailLabel}: ${detailValue}</div>
      </div>
    </div>`;
}
function notifSection(title, items, key){
  if(!items.length) return '';
  return `
    <button type="button" class="notif-cat-toggle w-full flex items-center justify-between px-4 py-2 bg-[#FAFBFC] border-b border-[var(--border)] text-[11px] uppercase tracking-wide text-[var(--muted)] font-semibold hover:bg-[#F0F2F4]" data-target="notif-cat-${key}">
      <span>${title} (${items.length})</span>
      <svg class="notif-cat-chevron w-3 h-3 transition-transform duration-150 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="6 9 12 15 18 9"/></svg>
    </button>
    <div class="notif-cat-panel hidden" id="notif-cat-${key}">${items.join('')}</div>`;
}

const notifDropdown = document.getElementById('notifDropdown');
const profileBtn = document.getElementById('profileBtn');
const profileDropdown = document.getElementById('profileDropdown');

function renderNotifications(){
  const list = document.getElementById('notifList');

  const passExpiring = talents.filter(c=>c.passDaysLeft<=30).sort((a,b)=>a.passDaysLeft-b.passDaysLeft)
    .map(c=> talentNotifRow(c, "Work Pass", c.passDaysLeft<0 ? `Expired ${Math.abs(c.passDaysLeft)}d ago` : `Expires in ${c.passDaysLeft}d`));

  const contractExpiring = talents.filter(c=>c.contractDaysLeft<=30).sort((a,b)=>a.contractDaysLeft-b.contractDaysLeft)
    .map(c=> talentNotifRow(c, "Contract", c.contractDaysLeft<0 ? `Ended ${Math.abs(c.contractDaysLeft)}d ago` : `Ends in ${c.contractDaysLeft}d`));

  const sowPending = clients.filter(cl=>clientBilling[cl].sowStatus !== "Signed")
    .map(cl=> clientNotifRow(cl, "SOW Status", clientBilling[cl].sowStatus));

  const poPending = clients.filter(cl=>clientBilling[cl].poStatus !== "Received")
    .map(cl=> clientNotifRow(cl, "PO Status", clientBilling[cl].poStatus));

  const tsNotSubmitted = talents.filter(c=>c.timesheetSubmitted === "No")
    .map(c=> talentNotifRow(c, "Timesheet", "Not submitted"));

  const tsNotApproved = talents.filter(c=>c.timesheetSubmitted === "Yes" && c.clientApproved === "No")
    .map(c=> talentNotifRow(c, "Timesheet", "Pending client approval"));

  const invoiceDueSoon = clients.filter(cl=>{
    const b = clientBilling[cl];
    if(b.invoiceStatus === "Paid" || b.invoiceStatus === "Overdue") return false;
    const daysToDue = Math.ceil((b.clientPaymentDueDate - today)/86400000);
    return daysToDue >= 0 && daysToDue <= 14;
  }).map(cl=>{
    const days = Math.ceil((clientBilling[cl].clientPaymentDueDate - today)/86400000);
    return clientNotifRow(cl, "Invoice Due", `${days}d`);
  });

  const paymentOverdue = clients.filter(cl=>clientBilling[cl].invoiceStatus === "Overdue")
    .map(cl=> clientNotifRow(cl, "Client Payment", "Overdue"));

  const insuranceExpired = talents.filter(c=>c.medicalInsuranceStatus === "Expired")
    .map(c=> talentNotifRow(c, "Medical Insurance", "Expired - renewal needed"));

  const lastWorkingDaySoon = talents.filter(c=>c.contractDaysLeft >= 0 && c.contractDaysLeft <= 7)
    .map(c=> talentNotifRow(c, "Last Working Day", fmtDate(c.lastWorkingDay)));

  const passCancellationPending = talents.filter(c=>c.contractDaysLeft < 0 && !c.workPassCancellationDate)
    .map(c=> talentNotifRow(c, "Work Pass Cancellation", "Pending after offboarding"));

  const totalCount = passExpiring.length + contractExpiring.length + sowPending.length + poPending.length
    + tsNotSubmitted.length + tsNotApproved.length + invoiceDueSoon.length + paymentOverdue.length
    + insuranceExpired.length + lastWorkingDaySoon.length + passCancellationPending.length;

  if(totalCount === 0){
    list.innerHTML = `<div class="px-4 py-6 text-sm text-[var(--muted)] text-center">No urgent alerts.</div>`;
    return;
  }

  list.innerHTML =
    notifSection("Work Pass Expiry", passExpiring, "workpass") +
    notifSection("Contract Expiry", contractExpiring, "contract") +
    notifSection("SOW Pending", sowPending, "sow") +
    notifSection("PO Not Received", poPending, "po") +
    notifSection("Timesheet Not Submitted", tsNotSubmitted, "tsnotsub") +
    notifSection("Timesheet Not Approved", tsNotApproved, "tsnotapp") +
    notifSection("Invoice Due Soon", invoiceDueSoon, "invoice") +
    notifSection("Client Payment Overdue", paymentOverdue, "payment") +
    notifSection("Insurance Renewal", insuranceExpired, "insurance") +
    notifSection("Talent Last Working Day", lastWorkingDaySoon, "lastday") +
    notifSection("Work Pass Cancellation Pending", passCancellationPending, "cancellation");

  list.querySelectorAll('.notif-cat-toggle').forEach(btn=>{
    btn.addEventListener('click', e=>{
      e.stopPropagation();
      const panel = document.getElementById(btn.dataset.target);
      const chevron = btn.querySelector('.notif-cat-chevron');
      panel.classList.toggle('hidden');
      chevron.classList.toggle('rotate-180');
    });
  });

  document.querySelectorAll('.notif-talent-link').forEach(el=>{
    el.addEventListener('click', e=>{
      e.stopPropagation();
      closeAllDropdowns();
      openTalentProfile(Number(el.dataset.id), 'home');
    });
  });
  document.querySelectorAll('.notif-client-link').forEach(el=>{
    el.addEventListener('click', e=>{
      e.stopPropagation();
      closeAllDropdowns();
      switchView('analytics');
    });
  });
}

function closeAllDropdowns(){
  notifDropdown.classList.add('hidden');
  profileDropdown.classList.add('hidden');
}
notifBtn.addEventListener('click', e=>{
  e.stopPropagation();
  renderNotifications();
  const willOpen = notifDropdown.classList.contains('hidden');
  closeAllDropdowns();
  if(willOpen) notifDropdown.classList.remove('hidden');
});
profileBtn.addEventListener('click', e=>{
  e.stopPropagation();
  const willOpen = profileDropdown.classList.contains('hidden');
  closeAllDropdowns();
  if(willOpen) profileDropdown.classList.remove('hidden');
});
document.addEventListener('click', ()=> closeAllDropdowns());
document.addEventListener('click', ()=> {
  document.querySelectorAll('.offboard-menu').forEach(m=>m.classList.add('hidden'));
});
notifDropdown.addEventListener('click', e=> e.stopPropagation());
profileDropdown.addEventListener('click', e=> e.stopPropagation());

const profileInfoModalOverlay = document.getElementById('profileInfoModalOverlay');
const profileInfoModal = document.getElementById('profileInfoModal');

/* Password policy: min 8 chars, at least one lowercase, one uppercase, one number,
   one special character. Mirrors the server-side check in /api/auth/change-password
   so the UI never promises acceptance the backend would reject. */
function evaluatePassword(pw){
  return {
    length: pw.length >= 8,
    lower: /[a-z]/.test(pw),
    upper: /[A-Z]/.test(pw),
    number: /[0-9]/.test(pw),
    special: /[^A-Za-z0-9]/.test(pw),
  };
}
function passwordStrength(rules){
  const metCount = Object.values(rules).filter(Boolean).length;
  if(metCount <= 2) return { label: 'Weak', color: 'var(--red-dot)', textColor: 'var(--red-text)', pct: 20 };
  if(metCount <= 4) return { label: 'Moderate', color: 'var(--amber-dot)', textColor: 'var(--amber-text)', pct: 60 };
  return { label: 'Strong', color: 'var(--green-dot)', textColor: 'var(--green-text)', pct: 100 };
}
const EYE_ICON = '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>';
const EYE_OFF_ICON = '<path d="M17.94 17.94A10.94 10.94 0 0112 20c-7 0-11-8-11-8a20.3 20.3 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a20.3 20.3 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>';
document.querySelectorAll('.pw-toggle').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    const input = document.getElementById(btn.dataset.target);
    const showing = input.type === 'text';
    input.type = showing ? 'password' : 'text';
    btn.querySelector('svg').innerHTML = showing ? EYE_ICON : EYE_OFF_ICON;
    btn.setAttribute('aria-label', showing ? 'Show password' : 'Hide password');
  });
});

function setStatusRow(prefix, state, text){
  // state: 'red' | 'amber' | 'green' | null(hidden)
  const row = document.getElementById(prefix + 'Status');
  const icon = document.getElementById(prefix + 'Icon');
  const label = document.getElementById(prefix + 'Text');
  if(!state){
    row.classList.add('hidden');
    return;
  }
  row.classList.remove('hidden');
  const meta = {
    red: { symbol: '✗', color: 'var(--red-text)' },
    amber: { symbol: '✗', color: 'var(--amber-text)' },
    green: { symbol: '✓', color: 'var(--green-text)' },
  }[state];
  icon.textContent = meta.symbol;
  icon.style.color = meta.color;
  label.style.color = meta.color;
  label.textContent = text;
}

function updatePasswordChecklist(){
  const pw = document.getElementById('cp_new').value;
  const confirmPw = document.getElementById('cp_confirm').value;
  const rules = evaluatePassword(pw);
  document.querySelectorAll('#cp_criteria li[data-rule]').forEach(li=>{
    const met = rules[li.dataset.rule];
    li.style.color = met ? 'var(--green-text)' : 'var(--muted)';
    li.textContent = (met ? '✓ ' : '○ ') + li.textContent.slice(2);
  });
  const metCount = Object.values(rules).filter(Boolean).length;
  const allMet = metCount === 5;
  const bar = document.getElementById('cp_strengthBar');
  const label = document.getElementById('cp_strengthLabel');
  if(pw.length === 0){
    bar.style.width = '0%';
    label.textContent = ' ';
    setStatusRow('cp_req', null);
  } else {
    const s = passwordStrength(rules);
    bar.style.width = s.pct + '%';
    bar.style.background = s.color;
    label.textContent = s.label;
    label.style.color = s.textColor;
    if(allMet) setStatusRow('cp_req', 'green', 'Meets all requirements');
    else if(metCount >= 3) setStatusRow('cp_req', 'amber', 'Almost there — not all requirements met');
    else setStatusRow('cp_req', 'red', 'Does not meet requirements');
  }

  if(confirmPw.length === 0){
    setStatusRow('cp_match', null);
  } else if(confirmPw === pw){
    setStatusRow('cp_match', 'green', 'Passwords match');
  } else {
    setStatusRow('cp_match', 'red', 'Passwords do not match');
  }

  const current = document.getElementById('cp_current').value;
  const passwordsMatch = confirmPw.length > 0 && confirmPw === pw;
  document.getElementById('cp_submitBtn').disabled = !(allMet && current.length > 0 && passwordsMatch);
}
document.getElementById('cp_new').addEventListener('input', updatePasswordChecklist);
document.getElementById('cp_current').addEventListener('input', updatePasswordChecklist);
document.getElementById('cp_confirm').addEventListener('input', updatePasswordChecklist);

document.getElementById('viewProfileBtn').addEventListener('click', ()=>{
  closeAllDropdowns();
  if(currentUser){
    document.getElementById('profileInfoName').textContent = currentUser.name;
    document.getElementById('profileInfoEmail').textContent = currentUser.email;
    document.getElementById('profileInfoAvatar').textContent = (currentUser.name||'?')[0].toUpperCase();
  }
  document.getElementById('cp_current').value = '';
  document.getElementById('cp_new').value = '';
  document.getElementById('cp_confirm').value = '';
  document.getElementById('cp_error').classList.add('hidden');
  document.querySelectorAll('#cp_criteria li[data-rule]').forEach(li=>{
    li.style.color = 'var(--muted)';
    li.textContent = '○ ' + li.textContent.slice(2);
  });
  document.getElementById('cp_strengthBar').style.width = '0%';
  document.getElementById('cp_strengthLabel').textContent = ' ';
  setStatusRow('cp_req', null);
  setStatusRow('cp_match', null);
  document.getElementById('cp_submitBtn').disabled = true;
  profileInfoModalOverlay.classList.add('open');
  profileInfoModal.classList.add('open');
});
document.getElementById('closeProfileInfoModal').addEventListener('click', ()=>{
  profileInfoModalOverlay.classList.remove('open');
  profileInfoModal.classList.remove('open');
});
profileInfoModalOverlay.addEventListener('click', ()=>{
  profileInfoModalOverlay.classList.remove('open');
  profileInfoModal.classList.remove('open');
});
document.getElementById('changePasswordForm').addEventListener('submit', async e=>{
  e.preventDefault();
  const errorEl = document.getElementById('cp_error');
  errorEl.classList.add('hidden');
  const submitBtn = document.getElementById('cp_submitBtn');
  submitBtn.disabled = true;
  try{
    await api.auth.changePassword(document.getElementById('cp_current').value, document.getElementById('cp_new').value);
    profileInfoModalOverlay.classList.remove('open');
    profileInfoModal.classList.remove('open');
    showToast("Password updated", checkIcon);
  }catch(err){
    errorEl.textContent = err.message;
    errorEl.classList.remove('hidden');
    submitBtn.disabled = false;
  }
});
document.getElementById('logoutBtn').addEventListener('click', async ()=>{
  closeAllDropdowns();
  await api.auth.logout();
  window.location.href = '/login.html';
});

/* ---------- HOME ---------- */
let currentUserFirstName = "there"; // replaced with the real logged-in user's name at bootstrap
let currentUser = null; // full { id, email, name, role } from GET /api/auth/me, set at bootstrap
let typewriterTimer = null;
function typewriterGreeting(){
  const el = document.getElementById('homeGreeting');
  const cursor = document.getElementById('homeGreetingCursor');
  const text = `Welcome back ${currentUserFirstName}`;
  el.textContent = "";
  cursor.style.display = "inline-block";
  if(typewriterTimer) clearInterval(typewriterTimer);
  let i = 0;
  typewriterTimer = setInterval(()=>{
    el.textContent += text[i];
    i++;
    if(i >= text.length){
      clearInterval(typewriterTimer);
      cursor.style.display = "none";
    }
  }, 110);
}
function barListCard(title, countsObj, view){
  const entries = Object.entries(countsObj).sort((a,b)=>b[1]-a[1]);
  const max = Math.max(...entries.map(e=>e[1]), 1);
  const rows = entries.map(([label,count])=>{
    const pct = Math.max(4,(count/max)*100);
    return `
      <div class="mb-1.5 last:mb-0">
        <div class="flex justify-between text-[11px] mb-0.5">
          <span class="text-[var(--text)]">${label}</span>
          <span class="font-semibold text-[var(--text)]">${count}</span>
        </div>
        <div class="w-full h-1 bg-[#EDEFF1] rounded-full overflow-hidden">
          <div class="h-full bg-[var(--blue)] rounded-full" style="width:${pct}%"></div>
        </div>
      </div>`;
  }).join('');
  return `<div class="stat-card home-card rounded-lg p-3" onclick="switchView('${view}')"><div class="text-xs font-semibold mb-2">${title}</div>${rows}</div>`;
}
function homeCard(label, value, color, view, trendHtml){
  return `
    <div class="stat-card home-card rounded-lg px-4 py-3" onclick="switchView('${view}')">
      <div class="text-xs text-[var(--muted)] mb-1">${label}</div>
      <div class="text-xl font-bold whitespace-nowrap" style="color:${color}">${value}</div>
      ${trendHtml || ''}
    </div>`;
}
function homeTrend(pct, vsLabel){
  if(pct === null || pct === undefined) return '';
  const up = pct >= 0;
  const color = up ? "var(--green-text)" : "var(--red-text)";
  const arrow = up ? "▲" : "▼";
  return `<div class="text-[11px] font-semibold mt-1" style="color:${color}">${arrow} ${Math.abs(pct).toFixed(1)}% ${vsLabel||''}</div>`;
}

/* No real historical snapshots exist yet (see Phase 5 of the build plan), so KPI trend badges
   are intentionally omitted rather than faked. Real trend data appears once monthly snapshots
   have accumulated real history. */
const homeKpiTrends = {};
["activeTalents","pendingStart","onNotice","expiringPasses","expiringContracts","pendingSOW","pendingPO","pendingTimesheets","pendingInvoices"].forEach(k=>{
  homeKpiTrends[k] = null;
});

let homeMonthOffset = 0; // 0 = current month, up to 5 = 5 months ago
let homeMonthFilterInit = false;
function initHomeMonthFilter(){
  if(homeMonthFilterInit) return;
  homeMonthFilterInit = true;
  const sel = document.getElementById('homeMonthFilter');
  for(let i=0;i<6;i++){
    const idx = HISTORY_MONTHS-1-i;
    const d = monthDates[idx];
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = i===0 ? `${monthLabelFull(d)} (Current)` : monthLabelFull(d);
    sel.appendChild(opt);
  }
  sel.addEventListener('change', e=>{
    homeMonthOffset = Number(e.target.value);
    renderHome();
  });
}

function renderHomeGpChart(){
  // No fake history: real monthly snapshots only start accumulating once the app has been live
  // for a while (see Phase 5 of the build plan). Show an honest placeholder instead of invented trend data.
  document.getElementById('homeRevenueChart').innerHTML = `
    <div class="flex items-center justify-center text-center text-sm text-[var(--muted)]" style="height:220px;">
      Monthly revenue/cost trend will appear here once a few months of real data have been recorded.
    </div>`;
}

function renderHomeGpDonut(){
  // Computed live from real talent payroll/billing data (current month, no fake history).
  const data = clients.map(cl=>{
    const group = talents.filter(c=>c.client===cl);
    const gp = group.reduce((s,c)=>s+computeTalentRevenue(c)-computeTotalPayrollCost(c),0);
    return { client: cl, gp };
  }).sort((a,b)=>b.gp-a.gp);
  const top = data.slice(0,5);
  const othersSum = data.slice(5).reduce((s,d)=>s+d.gp,0);
  if(othersSum > 0) top.push({ client:"Others", gp: othersSum });
  const total = top.reduce((s,d)=>s+Math.max(d.gp,0),0) || 1;

  const colors = ["#0A6ED1","#2E9E4A","#D98C0F","#E24C41","#8B5CF6","#94A3B8"];
  const r = 76, cx = 100, cy = 100, circumference = 2*Math.PI*r;
  let offset = 0;
  const segments = top.map((d,i)=>{
    const val = Math.max(d.gp,0);
    const frac = val/total;
    const dash = frac*circumference;
    const seg = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${colors[i%colors.length]}" stroke-width="26" stroke-dasharray="${dash.toFixed(1)} ${(circumference-dash).toFixed(1)}" stroke-dashoffset="${(-offset).toFixed(1)}" transform="rotate(-90 ${cx} ${cy})"/>`;
    offset += dash;
    return seg;
  }).join('');

  const legend = top.map((d,i)=>`
    <div class="flex items-center justify-between text-sm mb-2.5 gap-3">
      <span class="flex items-center gap-2 min-w-0"><span class="w-2.5 h-2.5 rounded-full inline-block shrink-0" style="background:${colors[i%colors.length]}"></span><span class="truncate">${d.client}</span></span>
      <span class="flex items-baseline gap-2 shrink-0">
        <span class="text-[var(--muted)] text-xs">${fmtMoney(Math.round(Math.max(d.gp,0)))}</span>
        <span class="font-semibold">${total ? Math.round((Math.max(d.gp,0)/total)*100) : 0}%</span>
      </span>
    </div>`).join('');

  document.getElementById('homeGpDonut').innerHTML = `
    <div class="flex items-center gap-6 min-h-[220px]">
      <svg viewBox="0 0 200 200" width="200" height="200" class="shrink-0">
        ${segments}
        <text x="100" y="96" text-anchor="middle" font-size="19" font-weight="700" fill="var(--text)">${fmtMoneyCompact(total)}</text>
        <text x="100" y="118" text-anchor="middle" font-size="13" fill="var(--muted)">Total GP</text>
      </svg>
      <div class="flex-1">${legend}</div>
    </div>`;
}

/* ---------- Gross Profit Breakdown Modal ---------- */
const gpBreakdownModalOverlay = document.getElementById('gpBreakdownModalOverlay');
const gpBreakdownModal = document.getElementById('gpBreakdownModal');
let gpBreakdownMonthOffset = 0;
let gpBreakdownFilterInit = false;

function initGpBreakdownMonthFilter(){
  if(gpBreakdownFilterInit) return;
  gpBreakdownFilterInit = true;
  const sel = document.getElementById('gpBreakdownMonthFilter');
  for(let i=0;i<6;i++){
    const idx = HISTORY_MONTHS-1-i;
    const d = monthDates[idx];
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = i===0 ? `${monthLabelFull(d)} (Current)` : monthLabelFull(d);
    sel.appendChild(opt);
  }
  sel.addEventListener('change', e=>{
    gpBreakdownMonthOffset = Number(e.target.value);
    renderGpBreakdownTable();
  });
}

function renderGpBreakdownTable(){
  // Computed live from real talent payroll/billing data (current month only — no fake history;
  // the month filter above is a no-op until real monthly snapshots exist, see Phase 5 of the build plan).
  const rows = clients.map(cl=>{
    const group = talents.filter(c=>c.client===cl);
    const revenue = group.reduce((s,c)=>s+computeTalentRevenue(c),0);
    const cost = group.reduce((s,c)=>s+computeTotalPayrollCost(c),0);
    const gp = revenue - cost;
    const margin = revenue ? (gp/revenue*100) : 0;
    return { client: cl, revenue, cost, gp, margin };
  }).sort((a,b)=>b.gp-a.gp);

  document.getElementById('gpBreakdownTableBody').innerHTML = rows.map(r=>`
    <tr class="border-b border-[var(--border)]">
      <td class="px-3 py-1.5">${r.client}</td>
      <td class="px-3 py-1.5 text-right">${fmtMoney(Math.round(r.revenue))}</td>
      <td class="px-3 py-1.5 text-right">${fmtMoney(Math.round(r.cost))}</td>
      <td class="px-3 py-1.5 text-right font-medium" style="color:${r.gp>=0?'var(--green-text)':'var(--red-text)'}">${fmtMoney(Math.round(r.gp))}</td>
      <td class="px-3 py-1.5 text-right" style="color:${r.margin>=0?'var(--green-text)':'var(--red-text)'}">${r.margin.toFixed(1)}%</td>
    </tr>`).join('');

  const totalRevenue = rows.reduce((s,r)=>s+r.revenue,0);
  const totalCost = rows.reduce((s,r)=>s+r.cost,0);
  const totalGp = rows.reduce((s,r)=>s+r.gp,0);
  const totalMargin = totalRevenue ? (totalGp/totalRevenue*100) : 0;
  document.getElementById('gpBreakdownTotalRow').innerHTML = `
    <td class="px-3 py-2">Total (${rows.length} clients)</td>
    <td class="px-3 py-2 text-right">${fmtMoney(Math.round(totalRevenue))}</td>
    <td class="px-3 py-2 text-right">${fmtMoney(Math.round(totalCost))}</td>
    <td class="px-3 py-2 text-right" style="color:${totalGp>=0?'var(--green-text)':'var(--red-text)'}">${fmtMoney(Math.round(totalGp))}</td>
    <td class="px-3 py-2 text-right" style="color:${totalMargin>=0?'var(--green-text)':'var(--red-text)'}">${totalMargin.toFixed(1)}%</td>
  `;
}

function openGpBreakdownModal(){
  initGpBreakdownMonthFilter();
  gpBreakdownMonthOffset = homeMonthOffset;
  document.getElementById('gpBreakdownMonthFilter').value = gpBreakdownMonthOffset;
  renderGpBreakdownTable();
  gpBreakdownModalOverlay.classList.add('open');
  gpBreakdownModal.classList.add('open');
}
function closeGpBreakdownModalFn(){
  gpBreakdownModalOverlay.classList.remove('open');
  gpBreakdownModal.classList.remove('open');
}
document.getElementById('closeGpBreakdownModal').addEventListener('click', closeGpBreakdownModalFn);
gpBreakdownModalOverlay.addEventListener('click', closeGpBreakdownModalFn);

let homeDashboardData = null; // fetched from GET /api/dashboard/home at bootstrap (see bootstrap())

function renderHome(){
  typewriterGreeting();
  initHomeMonthFilter();
  const total = talents.length;

  /* ---- Row 1: workforce & compliance (computed live from real talent data) ---- */
  const pendingStart = talents.filter(c=>c.contractStart > today).length;
  const onNotice = talents.filter(c=>c.contractDaysLeft >= 0 && c.contractDaysLeft <= 30).length;
  const activeTalents = total - pendingStart - talents.filter(c=>c.contractDaysLeft < 0).length;
  const expiringPasses = talents.filter(c=>c.passDaysLeft>=0 && c.passDaysLeft<=30).length;
  const expiringContracts = talents.filter(c=>c.contractDaysLeft>=0 && c.contractDaysLeft<=30).length;
  const pendingSOW = homeDashboardData ? homeDashboardData.pendingSow : 0;

  document.getElementById('homeKpiRow1').innerHTML =
    homeCard("Total Active Talents", activeTalents, "var(--text)", "talents", homeTrend(homeKpiTrends.activeTalents, "vs last month")) +
    homeCard("Pending Start", pendingStart, "var(--amber-text)", "talents", homeTrend(homeKpiTrends.pendingStart, "vs last month")) +
    homeCard("On Notice", onNotice, "var(--orange-text)", "offboarding", homeTrend(homeKpiTrends.onNotice, "vs last month")) +
    homeCard("Expiring Work Passes", expiringPasses, "var(--red-text)", "workpass", `<div class="text-[11px] text-[var(--muted)] mt-1">&lt;30 days</div>`) +
    homeCard("Expiring Contracts", expiringContracts, "var(--red-text)", "contracts", `<div class="text-[11px] text-[var(--muted)] mt-1">&lt;30 days</div>`) +
    homeCard("Pending SOW", pendingSOW, "var(--amber-text)", "analytics", homeTrend(homeKpiTrends.pendingSOW, "vs last month"));

  /* ---- Row 2: pending actions & financials (from the real /api/dashboard/home aggregates) ---- */
  const pendingPO = homeDashboardData ? homeDashboardData.pendingPo : 0;
  const pendingTimesheets = homeDashboardData ? homeDashboardData.pendingTimesheets : 0;
  const pendingInvoices = homeDashboardData ? homeDashboardData.pendingInvoices : 0;
  const monthlyRevenue = homeDashboardData ? homeDashboardData.monthlyRevenue : 0;
  const monthlyCost = homeDashboardData ? homeDashboardData.monthlyCost : 0;
  const monthlyGp = homeDashboardData ? homeDashboardData.monthlyGrossProfit : 0;
  const monthlyMargin = monthlyRevenue ? (monthlyGp/monthlyRevenue)*100 : 0;

  document.getElementById('homeKpiRow2').innerHTML =
    homeCard("Pending PO", pendingPO, "var(--amber-text)", "analytics", homeTrend(homeKpiTrends.pendingPO, "vs last month")) +
    homeCard("Pending Timesheets", pendingTimesheets, "var(--amber-text)", "operations", homeTrend(homeKpiTrends.pendingTimesheets, "vs last month")) +
    homeCard("Pending Invoices", pendingInvoices, "var(--amber-text)", "analytics", homeTrend(homeKpiTrends.pendingInvoices, "vs last month")) +
    homeCard("Monthly Revenue", fmtMoney(Math.round(monthlyRevenue)), "var(--text)", "finance", homeTrend(null, "vs last month")) +
    homeCard("Monthly Cost", fmtMoney(Math.round(monthlyCost)), "var(--text)", "finance", homeTrend(null, "vs last month")) +
    `<div class="rounded-lg px-4 py-3 cursor-pointer" style="background:var(--blue);" onclick="openGpBreakdownModal()">
      <div class="text-xs text-blue-100 mb-1" style="color:#DCEBFB;">Monthly GP</div>
      <div class="text-xl font-bold text-white whitespace-nowrap">${fmtMoney(Math.round(monthlyGp))}</div>
      <div class="text-[11px] mt-1" style="color:#DCEBFB;">${monthlyMargin.toFixed(1)}% Margin</div>
    </div>`;

  renderHomeGpChart();
  renderHomeGpDonut();

  const approaching = talents.filter(c=>c.alert);
  renderHomeExpiryTable(approaching);
}

let homeExpirySortKey = "passExpiry";
let homeExpirySortDir = 1;
let homeExpirySortInit = false;

function initHomeExpirySort(){
  if(homeExpirySortInit) return;
  homeExpirySortInit = true;
  document.querySelectorAll('.homeExpiry-sortable[data-key]').forEach(th=>{
    th.addEventListener('click', ()=>{
      const key = th.dataset.key;
      if(homeExpirySortKey === key){ homeExpirySortDir *= -1; } else { homeExpirySortKey = key; homeExpirySortDir = 1; }
      updateHomeExpirySortArrows();
      renderHomeExpiryTable(talents.filter(c=>c.alert));
    });
  });
  updateHomeExpirySortArrows();
}
function updateHomeExpirySortArrows(){
  document.querySelectorAll('.homeExpiry-sort-caret').forEach(el=>{
    const key = el.dataset.arrow;
    const isActive = key === homeExpirySortKey;
    el.classList.toggle('active', isActive);
    el.textContent = isActive ? (homeExpirySortDir === 1 ? "▲" : "▼") : "▲";
  });
}

function renderHomeExpiryTable(approaching){
  initHomeExpirySort();
  let rows = [...approaching];
  rows.sort((a,b)=>{
    let av = a[homeExpirySortKey], bv = b[homeExpirySortKey];
    if(av instanceof Date){ av = av.getTime(); bv = bv.getTime(); }
    if(typeof av === "string"){ av = av.toLowerCase(); bv = bv.toLowerCase(); }
    if(av < bv) return -1 * homeExpirySortDir;
    if(av > bv) return 1 * homeExpirySortDir;
    return 0;
  });
  rows = rows.slice(0,10);

  document.getElementById('homeExpiryList').innerHTML = rows.length ? rows.map(c=>`
    <tr class="row-hover border-b border-[var(--border)]">
      <td class="px-4 py-1 text-[var(--muted)] whitespace-nowrap">C${String(c.id).padStart(6,'0')}</td>
      <td class="px-4 py-1 font-medium whitespace-nowrap">
        <span class="home-expiry-name-link cursor-pointer hover:underline hover:text-[var(--blue-dark)]" data-id="${c.id}">${c.name}</span>
      </td>
      <td class="px-4 py-1 text-[var(--muted)] whitespace-nowrap">${c.client}</td>
      <td class="px-4 py-1 whitespace-nowrap ${c.passDaysLeft<=30?'date-alert':''}">${fmtDate(c.passExpiry)}</td>
      <td class="px-4 py-1 whitespace-nowrap ${c.contractDaysLeft<=30?'date-alert':''}">${fmtDate(c.contractEnd)}</td>
    </tr>`).join('') : `<tr><td colspan="5" class="px-4 py-4 text-sm text-[var(--muted)]">No approaching expiries.</td></tr>`;

  document.querySelectorAll('.home-expiry-name-link').forEach(el=>{
    el.addEventListener('click', ()=> openTalentProfile(Number(el.dataset.id), 'home'));
  });
}

/* ---------- WORK PASS ---------- */
const workPassFullNames = {
  "EP": "Employment Pass (EP)",
  "S Pass": "S Pass",
  "Work Permit": "Work Permit",
  "Singapore Citizen": "Singapore Citizen",
  "PR": "Permanent Resident (PR)"
};

function workpassUrgency(daysLeft){
  if(daysLeft < 0) return "expired";
  if(daysLeft <= 30) return "critical";
  if(daysLeft <= 60) return "warning";
  return "safe";
}
function workpassUrgencyFor(c){
  if(["Singapore Citizen","PR"].includes(c.workPassType)) return "lifetime";
  return workpassUrgency(c.passDaysLeft);
}
function workpassUrgencyMeta(urgency){
  switch(urgency){
    case "expired": return { txt:"var(--red-text)", label:"Expired" };
    case "critical": return { txt:"var(--orange-text)", label:"Critical" };
    case "warning": return { txt:"var(--amber-text)", label:"Warning" };
    default: return { txt:"var(--green-text)", label:"Safe" };
  }
}

let workpassSearchTerm = "";
let workpassTypeTerm = [];
let workpassStatusTerm = [];
let workpassRenewalStatusTerm = [];
let workpassUrgencyTerm = "";
let workpassSortKey = "passDaysLeft";
let workpassSortDir = 1;
let workpassPage = 1;
const workpassPageSize = 200;

function workpassFinNo(c){ return c.nric; }

function getWorkpassFiltered(){
  return talents.filter(c=>{
    if(workpassSearchTerm){
      const term = workpassSearchTerm.toLowerCase();
      const idStr = `c${String(c.id).padStart(6,'0')}`.toLowerCase();
      const matches = c.name.toLowerCase().includes(term) || idStr.includes(term) || workpassFinNo(c).toLowerCase().includes(term);
      if(!matches) return false;
    }
    if(workpassTypeTerm.length && !workpassTypeTerm.includes(c.workPassType)) return false;
    if(workpassStatusTerm.length && !workpassStatusTerm.includes(passStatusDisplay(c).label)) return false;
    if(workpassRenewalStatusTerm.length && !workpassRenewalStatusTerm.includes(renewalStatusDisplayLabel(c.renewalStatus))) return false;
    if(workpassUrgencyTerm && workpassUrgencyFor(c) !== workpassUrgencyTerm) return false;
    return true;
  });
}

/* Cosmetic "Viewing data for" month dropdown, shared pattern for pages whose stat boxes
   don't actually change with the month (mirrors the Home dashboard's approach). */
function initCosmeticMonthFilter(selectId, onChange){
  const sel = document.getElementById(selectId);
  if(!sel || sel.dataset.msInit) return;
  sel.dataset.msInit = "1";
  for(let i=0;i<6;i++){
    const idx = HISTORY_MONTHS-1-i;
    const d = monthDates[idx];
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = i===0 ? `${monthLabelFull(d)} (Current)` : monthLabelFull(d);
    sel.appendChild(opt);
  }
  sel.addEventListener('change', e=> onChange(Number(e.target.value)));
}

function renderWorkpassStatCards(){
  initCosmeticMonthFilter('workpassStatsMonthFilter', ()=> renderWorkpassStatCards());
  document.getElementById('workpassTypeStatCards').innerHTML = workPassTypes.map(type=>{
    const count = talents.filter(c=>c.workPassType===type).length;
    const active = workpassTypeTerm.includes(type);
    return `<div class="stat-card workpass-stat-card rounded-lg px-4 py-3 ${active?'workpass-stat-card-active':''}" data-type="${type}">
      <div class="text-xs text-[var(--muted)] mb-1">${workPassFullNames[type] || type}</div>
      <div class="text-xl font-bold">${count}</div>
    </div>`;
  }).join('');

  document.querySelectorAll('#workpassTypeStatCards .workpass-stat-card').forEach(card=>{
    card.addEventListener('click', ()=>{
      const type = card.dataset.type;
      workpassTypeTerm = workpassTypeTerm.includes(type) ? workpassTypeTerm.filter(t=>t!==type) : [...workpassTypeTerm, type];
      msWorkpassType.setSelected(workpassTypeTerm);
      workpassPage = 1;
      renderWorkPass();
    });
  });

  const foreignPassTalents = talents.filter(c=>!["Singapore Citizen","PR"].includes(c.workPassType));
  const lifetimeCount = talents.length - foreignPassTalents.length;
  const expired = foreignPassTalents.filter(c=>c.passDaysLeft<0).length;
  const critical = foreignPassTalents.filter(c=>c.passDaysLeft>=0 && c.passDaysLeft<=30).length;
  const warning = foreignPassTalents.filter(c=>c.passDaysLeft>30 && c.passDaysLeft<=60).length;
  const safe = foreignPassTalents.length - expired - critical - warning;
  document.getElementById('workpassUrgencyStatCards').innerHTML = [
    {key:"expired", label:"Expired", value:expired, color:"var(--red-text)"},
    {key:"critical", label:"Critical — Renew Now (≤30 days)", value:critical, color:"var(--orange-text)"},
    {key:"warning", label:"Expiring Soon (31–60 days)", value:warning, color:"var(--amber-text)"},
    {key:"safe", label:"Safe (>60 days)", value:safe, color:"var(--green-text)"},
    {key:"lifetime", label:"Lifetime (N/A)", value:lifetimeCount, color:"var(--muted)"},
  ].map(s=>{
    const active = workpassUrgencyTerm === s.key;
    return `
    <div class="stat-card workpass-stat-card rounded-lg px-4 py-3 ${active?'workpass-stat-card-active':''}" data-urgency="${s.key}">
      <div class="text-xs text-[var(--muted)] mb-1">${s.label}</div>
      <div class="text-xl font-bold" style="color:${s.color}">${s.value}</div>
    </div>`;
  }).join('');

  document.querySelectorAll('#workpassUrgencyStatCards .workpass-stat-card').forEach(card=>{
    card.addEventListener('click', ()=>{
      const urgency = card.dataset.urgency;
      workpassUrgencyTerm = (workpassUrgencyTerm === urgency) ? "" : urgency;
      workpassPage = 1;
      renderWorkPass();
    });
  });
}

function renderWorkpassPagination(totalRows){
  const totalPages = Math.max(1, Math.ceil(totalRows / workpassPageSize));
  if(workpassPage > totalPages) workpassPage = totalPages;
  const cur = workpassPage;

  function pageBtn(p, label, disabled, active){
    return `<button type="button" class="wp-page-btn w-7 h-7 rounded border text-xs flex items-center justify-center ${active?'border-[var(--blue)] bg-[var(--blue)] text-white font-semibold':'border-[var(--border-strong)] hover:bg-[#F4F5F7]'} ${disabled?'opacity-40 cursor-not-allowed':''}" data-page="${p}" ${disabled?'disabled':''}>${label}</button>`;
  }

  let nums;
  if(totalPages <= 7){
    nums = Array.from({length:totalPages}, (_,i)=>i+1);
  } else if(cur <= 4){
    nums = [1,2,3,4,5,'…',totalPages];
  } else if(cur >= totalPages - 3){
    nums = [1,'…',totalPages-4,totalPages-3,totalPages-2,totalPages-1,totalPages];
  } else {
    nums = [1,'…',cur-1,cur,cur+1,'…',totalPages];
  }

  const numsHtml = nums.map(n=> n==='…'
    ? `<span class="px-1 text-[var(--muted)]">…</span>`
    : pageBtn(n, n, false, n===cur)
  ).join('');

  const firstIcon = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="18 17 13 12 18 7"/><polyline points="11 17 6 12 11 7"/></svg>`;
  const prevIcon = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="15 18 9 12 15 6"/></svg>`;
  const nextIcon = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="9 18 15 12 9 6"/></svg>`;
  const lastIcon = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="6 17 11 12 6 7"/><polyline points="13 17 18 12 13 7"/></svg>`;

  document.getElementById('workpassPagination').innerHTML = `
    <span class="text-[var(--muted)] mr-2">Showing ${totalRows===0?0:(cur-1)*workpassPageSize+1}–${Math.min(cur*workpassPageSize,totalRows)} of ${totalRows}</span>
    ${pageBtn(1, firstIcon, cur<=1)}
    ${pageBtn(cur-1, prevIcon, cur<=1)}
    ${numsHtml}
    ${pageBtn(cur+1, nextIcon, cur>=totalPages)}
    ${pageBtn(totalPages, lastIcon, cur>=totalPages)}
  `;

  document.querySelectorAll('.wp-page-btn').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      if(btn.disabled) return;
      workpassPage = Number(btn.dataset.page);
      renderWorkpassTable();
    });
  });
}

function updateWorkpassSortArrows(){
  document.querySelectorAll('.wptable-sort-caret').forEach(el=>{
    const key = el.dataset.arrow;
    const isActive = key === workpassSortKey;
    el.classList.toggle('active', isActive);
    el.textContent = isActive ? (workpassSortDir === 1 ? "▲" : "▼") : "▲";
  });
}

function renderWorkpassTable(){
  let rows = getWorkpassFiltered();
  rows.sort((a,b)=>{
    let av = a[workpassSortKey], bv = b[workpassSortKey];
    if(av instanceof Date){ av = av.getTime(); bv = bv.getTime(); }
    if(typeof av === "string"){ av = av.toLowerCase(); bv = bv.toLowerCase(); }
    if(av < bv) return -1 * workpassSortDir;
    if(av > bv) return 1 * workpassSortDir;
    return 0;
  });

  document.getElementById('workpassResultCount').textContent = rows.length;

  const totalPages = Math.max(1, Math.ceil(rows.length / workpassPageSize));
  if(workpassPage > totalPages) workpassPage = totalPages;
  const startIdx = (workpassPage-1)*workpassPageSize;
  const pageRows = rows.slice(startIdx, startIdx+workpassPageSize);

  const tbody = document.getElementById('workpassTableBody');
  const empty = document.getElementById('workpassEmpty');

  if(rows.length === 0){
    tbody.innerHTML = "";
    empty.classList.remove('hidden');
  } else {
    empty.classList.add('hidden');
    tbody.innerHTML = pageRows.map(c=>{
      const isCitizenOrPR = ["Singapore Citizen","PR"].includes(c.workPassType);
      const bucket = passStatusDisplay(c);
      const needsRenewalCols = bucket.label === "Requires Renewal" || bucket.label === "Eligible for Renewal";
      const stale = needsRenewalCols && isPassRenewalStale(c);
      const daysLabel = isCitizenOrPR ? '—' : (c.passDaysLeft<0?`${Math.abs(c.passDaysLeft)}d overdue`:`${c.passDaysLeft}d`);
      return `
        <tr class="row-hover border-b border-[var(--border)] ${stale ? 'row-alert' : ''}">
          <td class="px-4 py-1 text-[var(--muted)] whitespace-nowrap">C${String(c.id).padStart(6,'0')}</td>
          <td class="px-4 py-1 font-medium whitespace-nowrap">
            <span class="wptable-name-link cursor-pointer hover:underline hover:text-[var(--blue-dark)]" data-id="${c.id}">${c.name}</span>
          </td>
          <td class="px-4 py-1 text-[var(--muted)] whitespace-nowrap">${workpassFinNo(c)}</td>
          <td class="px-4 py-1 text-[var(--muted)] whitespace-nowrap">${c.client}</td>
          <td class="px-4 py-1 whitespace-nowrap">${c.workPassType}</td>
          <td class="px-4 py-1 whitespace-nowrap">${isCitizenOrPR ? 'N/A' : fmtDate(c.passIssueDate)}</td>
          <td class="px-4 py-1 whitespace-nowrap ${!isCitizenOrPR && c.passDaysLeft<=30?'date-alert':''}">${isCitizenOrPR ? 'N/A' : fmtDate(c.passExpiry)}</td>
          <td class="px-4 py-1 whitespace-nowrap ${!isCitizenOrPR && c.passDaysLeft<=30?'date-alert':''}">${daysLabel}</td>
          <td class="px-4 py-1 whitespace-nowrap"><span class="pill" style="${bucket.style}">${bucket.label}</span></td>
          <td class="px-4 py-1 whitespace-nowrap">
            ${needsRenewalCols ? `<span class="pill" style="${renewalStatusPillStyleContract(c.renewalStatus)}">${renewalStatusDisplayLabel(c.renewalStatus)}</span>` : '<span class="text-[var(--muted)]">—</span>'}
          </td>
          <td class="px-4 py-1 text-[var(--muted)] max-w-[220px] truncate" title="${c.passRenewalRemarks || ''}">${c.passRenewalRemarks || '—'}</td>
          <td class="px-4 py-1 text-[var(--muted)] whitespace-nowrap">${c.caseOwner}</td>
          <td class="px-4 py-1 text-[var(--muted)] whitespace-nowrap">${c.entity}</td>
          <td class="px-4 py-1 whitespace-nowrap">
            ${!isCitizenOrPR ? `<button type="button" class="update-status-btn renewal-update-status-btn" data-id="${c.id}" data-type="workpass" title="${stale ? 'Date of Issue, Date of Expiry and Days Left to Expiry have not been updated since this renewal was marked Completed' : ''}">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
              Update Status
            </button>` : '<span class="text-[var(--muted)]">—</span>'}
          </td>
        </tr>`;
    }).join('');

    tbody.querySelectorAll('.wptable-name-link').forEach(el=>{
      el.addEventListener('click', ()=> openTalentProfile(Number(el.dataset.id), 'workpass'));
    });
    tbody.querySelectorAll('.renewal-update-status-btn').forEach(btn=>{
      btn.addEventListener('click', ()=> openRenewalUpdateModal(Number(btn.dataset.id), btn.dataset.type));
    });
  }

  renderWorkpassPagination(rows.length);
}

function renderWorkPass(){
  renderWorkpassStatCards();
  renderWorkpassTable();
}

document.querySelectorAll('.wptable-sortable[data-key]').forEach(el=>{
  el.addEventListener('click', ()=>{
    const key = el.dataset.key;
    if(workpassSortKey === key){ workpassSortDir *= -1; } else { workpassSortKey = key; workpassSortDir = 1; }
    updateWorkpassSortArrows();
    workpassPage = 1;
    renderWorkpassTable();
  });
});
updateWorkpassSortArrows();

document.getElementById('workpassSearchInput').addEventListener('input', e=>{ workpassSearchTerm=e.target.value; workpassPage=1; renderWorkpassTable(); });
wireClearButton('workpassSearchInput', 'workpassSearchClear', ()=>{ workpassSearchTerm=""; workpassPage=1; renderWorkpassTable(); });
const msWorkpassType = createMultiSelect('workpassTypeFilter', workPassTypes, "All pass types", vals=>{ workpassTypeTerm=vals; workpassPage=1; renderWorkPass(); });
const msWorkpassStatus = createMultiSelect('workpassStatusFilter', ["Requires Renewal","Eligible for Renewal","Active","Pending Application","Inactive","N/A"], "All statuses", vals=>{ workpassStatusTerm=vals; workpassPage=1; renderWorkpassTable(); });
const msWorkpassRenewalStatus = createMultiSelect('workpassRenewalStatusFilter', ["Yet to Start","In Progress","Completed"], "All renewal statuses", vals=>{ workpassRenewalStatusTerm=vals; workpassPage=1; renderWorkpassTable(); });
document.getElementById('workpassClearFilters').addEventListener('click', e=>{
  e.preventDefault();
  workpassSearchTerm=""; workpassTypeTerm=[]; workpassStatusTerm=[]; workpassRenewalStatusTerm=[]; workpassUrgencyTerm=""; workpassPage=1;
  document.getElementById('workpassSearchInput').value="";
  msWorkpassType.reset();
  msWorkpassStatus.reset();
  msWorkpassRenewalStatus.reset();
  renderWorkPass();
});
document.getElementById('workpassDownloadLink').addEventListener('click', e=>{ e.preventDefault(); showToast("This mockup does not export real data yet."); });

/* ---------- CONTRACTS & SOW/PO ---------- */
let contractsSearchTerm = "";
let contractsClientTerm = [];
let contractsStatusTerm = [];
let contractsRenewalStatusTerm = [];
let contractsSortKey = "name";
let contractsSortDir = 1;
let contractsFiltersInit = false;
let msContractsStatus = null;
let contractsPage = 1;

function initContractsFilters(){
  if(contractsFiltersInit) return;
  contractsFiltersInit = true;
  const msContractsClient = createMultiSelect('contractsClientFilter', [...new Set(clients)].sort(), "All clients", vals=>{ contractsClientTerm=vals; contractsPage=1; renderContracts(); });
  msContractsStatus = createMultiSelect('contractsStatusFilter', ["Requires Renewal","Eligible for Renewal","Active","Pending Start","Notice Period","Inactive"], "All statuses", vals=>{ contractsStatusTerm=vals; contractsPage=1; renderContracts(); });
  const msContractsRenewalStatus = createMultiSelect('contractsRenewalStatusFilter', ["Yet to Start","In Progress","Completed"], "All renewal statuses", vals=>{ contractsRenewalStatusTerm=vals; contractsPage=1; renderContracts(); });
  document.getElementById('contractsSearchInput').addEventListener('input', e=>{
    contractsSearchTerm = e.target.value;
    contractsPage = 1;
    renderContracts();
  });
  wireClearButton('contractsSearchInput', 'contractsSearchClear', ()=>{ contractsSearchTerm=""; contractsPage=1; renderContracts(); });

  document.querySelectorAll('.contracts-sortable[data-key]').forEach(th=>{
    th.addEventListener('click', ()=>{
      const key = th.dataset.key;
      if(contractsSortKey === key){ contractsSortDir *= -1; } else { contractsSortKey = key; contractsSortDir = 1; }
      updateContractsSortArrows();
      contractsPage = 1;
      renderContracts();
    });
  });
  updateContractsSortArrows();

  document.getElementById('contractsClearFilters').addEventListener('click', e=>{
    e.preventDefault();
    contractsSearchTerm=""; contractsClientTerm=[]; contractsStatusTerm=[]; contractsRenewalStatusTerm=[]; contractsPage=1;
    document.getElementById('contractsSearchInput').value="";
    msContractsClient.reset();
    msContractsStatus.reset();
    msContractsRenewalStatus.reset();
    renderContracts();
  });
  document.getElementById('contractsDownloadLink').addEventListener('click', e=>{ e.preventDefault(); showToast("This mockup does not export real data yet."); });
}

function updateContractsSortArrows(){
  document.querySelectorAll('.contracts-sort-caret').forEach(el=>{
    const key = el.dataset.arrow;
    const isActive = key === contractsSortKey;
    el.classList.toggle('active', isActive);
    el.textContent = isActive ? (contractsSortDir === 1 ? "▲" : "▼") : "▲";
  });
}

function renderContracts(){
  initContractsFilters();
  initCosmeticMonthFilter('contractsStatsMonthFilter', ()=> renderContracts());

  const contractStatusCounts = { "Requires Renewal":0, "Eligible for Renewal":0, "Active":0, "Pending Start":0, "Notice Period":0, "Inactive":0 };
  talents.forEach(c=>{ const label = contractStatusDisplay(c).label; if(contractStatusCounts[label] !== undefined) contractStatusCounts[label]++; });
  const contractStatusColors = {
    "Requires Renewal": "var(--red-text)",
    "Eligible for Renewal": "var(--amber-text)",
    "Active": "var(--green-text)",
    "Pending Start": "var(--turquoise-text)",
    "Notice Period": "#7A4A1E",
    "Inactive": "#43494F",
  };
  document.getElementById('contractsStatusStatCards').innerHTML = Object.keys(contractStatusCounts).map(label=>{
    const active = contractsStatusTerm.length===1 && contractsStatusTerm[0]===label;
    return `
    <div class="stat-card stat-card-clickable rounded-lg px-4 py-3 ${active?'stat-card-clickable-active':''}" data-status="${label}">
      <div class="text-xs text-[var(--muted)] mb-1">${label}</div>
      <div class="text-xl font-bold" style="color:${contractStatusColors[label]}">${contractStatusCounts[label]}</div>
    </div>`;
  }).join('');
  document.querySelectorAll('#contractsStatusStatCards .stat-card-clickable').forEach(card=>{
    card.addEventListener('click', ()=>{
      const label = card.dataset.status;
      const isActive = contractsStatusTerm.length===1 && contractsStatusTerm[0]===label;
      contractsStatusTerm = isActive ? [] : [label];
      if(msContractsStatus) msContractsStatus.setSelected(contractsStatusTerm);
      contractsPage = 1;
      renderContracts();
    });
  });

  let rows = talents.filter(c=>{
    if(contractsSearchTerm && !c.name.toLowerCase().includes(contractsSearchTerm.toLowerCase())) return false;
    if(contractsClientTerm.length && !contractsClientTerm.includes(c.client)) return false;
    if(contractsStatusTerm.length && !contractsStatusTerm.includes(contractStatusDisplay(c).label)) return false;
    if(contractsRenewalStatusTerm.length && !contractsRenewalStatusTerm.includes(renewalStatusDisplayLabel(c.contractRenewalStatus))) return false;
    return true;
  });

  rows.sort((a,b)=>{
    let av = a[contractsSortKey], bv = b[contractsSortKey];
    if(av instanceof Date){ av = av.getTime(); bv = bv.getTime(); }
    if(typeof av === "string"){ av = av.toLowerCase(); bv = bv.toLowerCase(); }
    if(av < bv) return -1 * contractsSortDir;
    if(av > bv) return 1 * contractsSortDir;
    return 0;
  });

  document.getElementById('contractsResultCount').textContent = rows.length;

  const tbody = document.getElementById('contractsTableBody');
  const empty = document.getElementById('contractsEmpty');
  if(rows.length === 0){
    tbody.innerHTML = "";
    empty.classList.remove('hidden');
    renderPaginationBar('contractsPagination', 0, 1, LIST_PAGE_SIZE, ()=>{});
    return;
  }
  empty.classList.add('hidden');

  contractsPage = renderPaginationBar('contractsPagination', rows.length, contractsPage, LIST_PAGE_SIZE, p=>{
    contractsPage = p;
    renderContracts();
  });
  const startIdx = (contractsPage-1)*LIST_PAGE_SIZE;
  const pageRows = rows.slice(startIdx, startIdx+LIST_PAGE_SIZE);

  tbody.innerHTML = pageRows.map(c=>{
    const bucket = contractStatusDisplay(c);
    const needsRenewalCols = bucket.label === "Requires Renewal" || bucket.label === "Eligible for Renewal";
    const stale = needsRenewalCols && isContractRenewalStale(c);
    return `
    <tr class="row-hover border-b border-[var(--border)] ${stale ? 'row-alert' : ''}">
      <td class="px-4 py-1 text-[var(--muted)] whitespace-nowrap">C${String(c.id).padStart(6,'0')}</td>
      <td class="px-4 py-1 font-medium whitespace-nowrap">
        <span class="contract-name-link cursor-pointer hover:underline hover:text-[var(--blue-dark)]" data-id="${c.id}">${c.name}</span>
      </td>
      <td class="px-4 py-1 text-[var(--muted)] whitespace-nowrap">${c.client}</td>
      <td class="px-4 py-1 whitespace-nowrap">${fmtDate(c.contractStart)}</td>
      <td class="px-4 py-1 whitespace-nowrap ${c.contractDaysLeft<=30?'date-alert':''}">${fmtDate(c.contractEnd)}</td>
      <td class="px-4 py-1 whitespace-nowrap ${c.contractDaysLeft<=30?'date-alert':''}">${c.contractDaysLeft<0?`${Math.abs(c.contractDaysLeft)}d overdue`:`${c.contractDaysLeft}d`}</td>
      <td class="px-4 py-1 whitespace-nowrap"><span class="pill" style="${bucket.style}">${bucket.label}</span></td>
      <td class="px-4 py-1 whitespace-nowrap">
        ${needsRenewalCols ? `<span class="pill" style="${renewalStatusPillStyleContract(c.contractRenewalStatus)}">${renewalStatusDisplayLabel(c.contractRenewalStatus)}</span>` : '<span class="text-[var(--muted)]">—</span>'}
      </td>
      <td class="px-4 py-1 text-[var(--muted)] max-w-[220px] truncate" title="${c.renewalRemarks || ''}">${c.renewalRemarks || '—'}</td>
      <td class="px-4 py-1 text-[var(--muted)] whitespace-nowrap">${c.caseOwner}</td>
      <td class="px-4 py-1 text-[var(--muted)] whitespace-nowrap">${c.entity}</td>
      <td class="px-4 py-1 whitespace-nowrap">
        <button type="button" class="update-status-btn renewal-update-status-btn" data-id="${c.id}" data-type="contract" title="${stale ? 'Date of Commencement, Date of Expiry and Days Left to Expiry have not been updated since this renewal was marked Completed' : ''}">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
          Update Status
        </button>
      </td>
    </tr>`;
  }).join('');

  tbody.querySelectorAll('.contract-name-link').forEach(el=>{
    el.addEventListener('click', ()=> openTalentProfile(Number(el.dataset.id), 'contracts'));
  });
  tbody.querySelectorAll('.renewal-update-status-btn').forEach(btn=>{
    btn.addEventListener('click', ()=> openRenewalUpdateModal(Number(btn.dataset.id), btn.dataset.type));
  });
}

/* ---------- Contract Edit Modal (scoped to Contracts tab fields only) ---------- */
const contractModalOverlay = document.getElementById('contractModalOverlay');
const contractEditModal = document.getElementById('contractEditModal');
let editingContractId = null;

function openContractEditModal(id){
  const c = talents.find(x=>x.id === id);
  if(!c) return;
  editingContractId = id;
  document.getElementById('contractModalTitle').textContent = c.name;
  fillOptions(document.getElementById('ce_contractStatus'), contractStatusOptions, null);
  document.getElementById('ce_contractStatus').value = c.contractStatus;
  document.getElementById('ce_contractStart').value = toISO(c.contractStart);
  document.getElementById('ce_contractEnd').value = toISO(c.contractEnd);
  fillOptions(document.getElementById('ce_noticePeriod'), noticePeriods, null);
  document.getElementById('ce_noticePeriod').value = c.noticePeriod;
  fillOptions(document.getElementById('ce_contractUpload'), uploadStatuses, null);
  document.getElementById('ce_contractUpload').value = c.contractUpload;
  fillOptions(document.getElementById('ce_signedContractUpload'), signedUploadStatuses, null);
  document.getElementById('ce_signedContractUpload').value = c.signedContractUpload;
  fillOptions(document.getElementById('ce_renewalRequired'), ["Yes","No"], null);
  document.getElementById('ce_renewalRequired').value = c.contractRenewalRequired;
  fillOptions(document.getElementById('ce_renewalStatus'), contractRenewalStatuses, null);
  document.getElementById('ce_renewalStatus').value = c.contractRenewalStatus;
  document.getElementById('ce_lifecycleStatus').value = c.contractLifecycleStatus || "";
  document.getElementById('ce_remarks').value = c.remarks;
  contractModalOverlay.classList.add('open');
  contractEditModal.classList.add('open');
}
function closeContractEditModalFn(){
  contractModalOverlay.classList.remove('open');
  contractEditModal.classList.remove('open');
  editingContractId = null;
}
document.getElementById('closeContractModal').addEventListener('click', closeContractEditModalFn);
document.getElementById('cancelContractModal').addEventListener('click', closeContractEditModalFn);
contractModalOverlay.addEventListener('click', closeContractEditModalFn);

document.getElementById('contractEditForm').addEventListener('submit', e=>{
  e.preventDefault();
  const c = talents.find(x=>x.id === editingContractId);
  if(!c) return;
  const oldRenewalStatus = c.contractRenewalStatus;
  const newContractStart = new Date(document.getElementById('ce_contractStart').value);
  const newContractEnd = new Date(document.getElementById('ce_contractEnd').value);
  const datesChanged = c.contractStart.getTime() !== newContractStart.getTime() || c.contractEnd.getTime() !== newContractEnd.getTime();

  c.contractStatus = document.getElementById('ce_contractStatus').value;
  c.contractStart = newContractStart;
  c.contractEnd = newContractEnd;
  c.noticePeriod = document.getElementById('ce_noticePeriod').value;
  c.contractUpload = document.getElementById('ce_contractUpload').value;
  c.signedContractUpload = document.getElementById('ce_signedContractUpload').value;
  c.contractRenewalRequired = document.getElementById('ce_renewalRequired').value;
  const newRenewalStatus = document.getElementById('ce_renewalStatus').value;
  // Mark "just completed" before recording any dates change, so that dates edited in the
  // same save (e.g. alongside marking the renewal Completed) count as already reflecting it.
  if(newRenewalStatus === "Completed" && oldRenewalStatus !== "Completed"){
    c.renewalCompletedSeq = ++renewalActionSeq;
  }
  c.contractRenewalStatus = newRenewalStatus;
  if(datesChanged){
    c.datesUpdatedSeq = ++renewalActionSeq;
  }
  c.remarks = document.getElementById('ce_remarks').value.trim();
  c.contractLifecycleStatus = document.getElementById('ce_lifecycleStatus').value;
  computeDerived(c);
  closeContractEditModalFn();
  renderContracts();
  renderRenewalContract();
  renderStats();
  refreshProfileIfOpen(c);
  showToast(`${c.name}'s contract details updated`, checkIcon);
});

/* ---------- Renew Work Pass / Contract Modal ---------- */
const renewModalOverlay = document.getElementById('renewModalOverlay');
const renewModal = document.getElementById('renewModal');
let renewingId = null;
let renewingType = null;

function openRenewModal(id, type){
  const c = talents.find(x=>x.id === id);
  if(!c) return;
  renewingId = id;
  renewingType = type;
  document.getElementById('renewModalTitle').textContent = c.name;

  if(type === 'workpass'){
    document.getElementById('renewModalHeading').textContent = "Renew Work Pass";
    document.getElementById('renewCurrentExpiryLine').textContent = `Current expiry: ${fmtDate(c.passExpiry)} (${c.passDaysLeft < 0 ? `expired ${Math.abs(c.passDaysLeft)}d ago` : c.passDaysLeft + ' days left'})`;
    document.getElementById('renewDateLabel').textContent = "New Expiry Date";
    const base = c.passExpiry > today ? c.passExpiry : today;
    document.getElementById('renew_newDate').value = toISO(addDays(base, 730));
    fillOptions(document.getElementById('renew_status'), ["Not Started","In Progress","Completed"], null);
    document.getElementById('renew_status').value = "Completed";
  } else {
    document.getElementById('renewModalHeading').textContent = "Renew Contract";
    document.getElementById('renewCurrentExpiryLine').textContent = `Current end date: ${fmtDate(c.contractEnd)} (${c.contractDaysLeft < 0 ? `expired ${Math.abs(c.contractDaysLeft)}d ago` : c.contractDaysLeft + ' days left'})`;
    document.getElementById('renewDateLabel').textContent = "New Contract End Date";
    const base = c.contractEnd > today ? c.contractEnd : today;
    document.getElementById('renew_newDate').value = toISO(addDays(base, 365));
    fillOptions(document.getElementById('renew_status'), contractRenewalStatuses, null);
    document.getElementById('renew_status').value = "Completed";
  }

  renewModalOverlay.classList.add('open');
  renewModal.classList.add('open');
}
function closeRenewModalFn(){
  renewModalOverlay.classList.remove('open');
  renewModal.classList.remove('open');
  renewingId = null;
  renewingType = null;
}
document.getElementById('closeRenewModal').addEventListener('click', closeRenewModalFn);
document.getElementById('cancelRenewModal').addEventListener('click', closeRenewModalFn);
renewModalOverlay.addEventListener('click', closeRenewModalFn);

document.getElementById('renewForm').addEventListener('submit', e=>{
  e.preventDefault();
  const c = talents.find(x=>x.id === renewingId);
  const type = renewingType;
  if(!c || !type) return;
  const newDate = new Date(document.getElementById('renew_newDate').value);
  const status = document.getElementById('renew_status').value;

  if(type === 'workpass'){
    c.passIssueDate = today;
    c.passExpiry = newDate;
    c.passStatus = "Active";
    c.renewalRequired = "No";
    c.renewalStatus = status;
  } else {
    const oldRenewalStatus = c.contractRenewalStatus;
    const datesChanged = c.contractEnd.getTime() !== newDate.getTime();
    c.contractEnd = newDate;
    if(c.contractStatus === "Expired" || c.contractStatus === "Terminated") c.contractStatus = "Signed";
    c.contractRenewalRequired = "No";
    if(status === "Completed" && oldRenewalStatus !== "Completed"){
      c.renewalCompletedSeq = ++renewalActionSeq;
    }
    c.contractRenewalStatus = status;
    if(datesChanged){
      c.datesUpdatedSeq = ++renewalActionSeq;
    }
  }
  computeDerived(c);
  closeRenewModalFn();
  if(type === 'workpass'){ renderWorkPass(); } else { renderContracts(); renderStats(); }
  refreshProfileIfOpen(c);
  showToast(`${c.name}'s ${type === 'workpass' ? 'work pass' : 'contract'} has been renewed`, checkIcon);
});

/* ---------- FINANCE, BILLING & COMMERCIAL ---------- */
let financeSearchTerm = "";
let financeClientTerm = [];
let financeSalaryTerm = [];
let msFinanceClient = null;
let financeSortKey = "name";
let financeSortDir = 1;
let financeFiltersInit = false;
let financePage = 1;
let financeMonthOffset = 0;
let financeMonthFilterInit = false;

function initFinanceMonthFilter(){
  if(financeMonthFilterInit) return;
  financeMonthFilterInit = true;
  const sel = document.getElementById('financeMonthFilter');
  for(let i=0;i<6;i++){
    const idx = HISTORY_MONTHS-1-i;
    const d = monthDates[idx];
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = i===0 ? `${monthLabelFull(d)} (Current)` : monthLabelFull(d);
    sel.appendChild(opt);
  }
  sel.addEventListener('change', e=>{
    financeMonthOffset = Number(e.target.value);
    renderFinance();
  });
}

function initFinanceFilters(){
  if(financeFiltersInit) return;
  financeFiltersInit = true;
  msFinanceClient = createMultiSelect('financeClientFilter', [...new Set(clients)].sort(), "All clients", vals=>{ financeClientTerm=vals; financePage=1; renderFinance(); });
  const msFinanceSalary = createMultiSelect('financeSalaryFilter', [
    {value:"0-4999", label:"Below S$ 5,000"},
    {value:"5000-5999", label:"S$ 5,000 – S$ 5,999"},
    {value:"6000-6999", label:"S$ 6,000 – S$ 6,999"},
    {value:"7000-7999", label:"S$ 7,000 – S$ 7,999"},
    {value:"8000-8999", label:"S$ 8,000 – S$ 8,999"},
    {value:"9000-9999", label:"S$ 9,000 – S$ 9,999"},
    {value:"10000-10999", label:"S$ 10,000 – S$ 10,999"},
    {value:"11000-11999", label:"S$ 11,000 – S$ 11,999"},
    {value:"12000-999999", label:"Above S$ 12,000"},
  ], "All salary ranges", vals=>{ financeSalaryTerm=vals; financePage=1; renderFinance(); });

  document.getElementById('financeSearchInput').addEventListener('input', e=>{
    financeSearchTerm = e.target.value;
    financePage = 1;
    renderFinance();
  });
  wireClearButton('financeSearchInput', 'financeSearchClear', ()=>{ financeSearchTerm=""; financePage=1; renderFinance(); });

  document.querySelectorAll('.finance-sortable[data-key]').forEach(th=>{
    th.addEventListener('click', ()=>{
      const key = th.dataset.key;
      if(financeSortKey === key){ financeSortDir *= -1; } else { financeSortKey = key; financeSortDir = 1; }
      updateFinanceSortArrows();
      financePage = 1;
      renderFinance();
    });
  });
  updateFinanceSortArrows();

  document.getElementById('financeClearFilters').addEventListener('click', e=>{
    e.preventDefault();
    financeSearchTerm=""; financeClientTerm=[]; financeSalaryTerm=[]; financePage=1;
    document.getElementById('financeSearchInput').value="";
    msFinanceClient.reset();
    msFinanceSalary.reset();
    renderFinance();
  });
  document.getElementById('financeDownloadLink').addEventListener('click', e=>{ e.preventDefault(); showToast("This mockup does not export real data yet."); });
}

function updateFinanceSortArrows(){
  document.querySelectorAll('.finance-sort-caret').forEach(el=>{
    const key = el.dataset.arrow;
    const isActive = key === financeSortKey;
    el.classList.toggle('active', isActive);
    el.textContent = isActive ? (financeSortDir === 1 ? "▲" : "▼") : "▲";
  });
}

/* Per-talent month-scaled figures for the Payroll & Cost view (offset 0 = current, exact live values) */
function financeTalentFigures(c, monthOffset){
  const factor = seededVariance(c.id, monthOffset);
  const revFactor = seededVariance(c.id + 100000, monthOffset);
  return {
    salary: c.salary*factor,
    cpf: c.cpf*factor,
    sdl: c.skillsDevelopmentLevy*factor,
    wica: c.wica*factor,
    insurance: c.medicalInsuranceCost*factor,
    allowances: c.allowances*factor,
    claims: c.claimsReimbursements*factor,
    overtime: c.overtime*factor,
    noPayLeaveDeduction: c.noPayLeaveDeduction*factor,
    otherStatutoryCosts: c.otherStatutoryCosts*factor,
    adminFee: getWorkPassAdminFee(c)*factor,
    totalCost: computeTotalPayrollCost(c)*factor,
    revenue: computeTalentRevenue(c)*revFactor,
  };
}

function getTimesheetForMonth(c, monthOffset){
  if(monthOffset === 0){
    return {
      monthLabel: c.timesheetMonth,
      workingDays: c.workingDays,
      submitted: c.timesheetSubmitted,
      submissionDate: c.submissionDate,
      approved: c.clientApproved,
      approvalDate: c.approvalDate,
      overtimeHours: c.overtimeHours,
      absenceDays: c.absenceDays,
      remarks: c.timesheetRemarks,
    };
  }
  const monthDate = monthDates[HISTORY_MONTHS-1-monthOffset];
  const f1 = seededFraction(c.id*13 + monthOffset*7);
  const f2 = seededFraction(c.id*29 + monthOffset*11);
  const f3 = seededFraction(c.id*41 + monthOffset*17);
  const submitted = f1 < 0.9 ? "Yes" : "No";
  const approved = submitted === "Yes" && f2 < 0.85 ? "Yes" : "No";
  const workingDays = 20 + Math.floor(f3*3);
  const overtimeHours = f1 < 0.3 ? Math.floor(f2*10) : 0;
  const absenceDays = f2 < 0.15 ? 1 : 0;
  const submissionDate = submitted==="Yes" ? addDays(monthDate, Math.floor(f1*5)) : null;
  const approvalDate = approved==="Yes" ? addDays(submissionDate||monthDate, Math.floor(f2*5)) : null;
  return {
    monthLabel: monthLabelFull(monthDate),
    workingDays, submitted, submissionDate, approved, approvalDate, overtimeHours, absenceDays,
    remarks: "None",
  };
}
function seededFraction(seed){
  const x = Math.sin(seed) * 43758.5453;
  return x - Math.floor(x);
}

function renderFinance(){
  initFinanceFilters();
  initFinanceMonthFilter();
  const monthOffset = financeMonthOffset;

  let totalSalary=0, totalCpf=0, totalSdl=0, totalWica=0, totalInsurance=0, totalAdminFee=0, totalCost=0, totalRevenue=0;
  talents.forEach(c=>{
    const f = financeTalentFigures(c, monthOffset);
    totalSalary += f.salary; totalCpf += f.cpf; totalSdl += f.sdl; totalWica += f.wica;
    totalInsurance += f.insurance; totalAdminFee += f.adminFee; totalCost += f.totalCost; totalRevenue += f.revenue;
  });
  const totalGp = totalRevenue - totalCost;

  document.getElementById('financeStatCards').innerHTML = [
    {label:"Total Salary (SGD)", value:fmtMoney(Math.round(totalSalary)), highlight:false},
    {label:"Total CPF (SGD)", value:fmtMoney(Math.round(totalCpf)), highlight:false},
    {label:"Total SDL (SGD)", value:fmtMoney(Math.round(totalSdl)), highlight:false},
    {label:"Total WICA (SGD)", value:fmtMoney(Math.round(totalWica)), highlight:false},
    {label:"Total Insurance", value:fmtMoney(Math.round(totalInsurance)), highlight:false},
    {label:"Total Work Pass Admin Fee", value:fmtMoney(Math.round(totalAdminFee)), highlight:false},
    {label:"Total Cost (SGD)", value:fmtMoney(Math.round(totalCost)), highlight:"blue"},
    {label:"Total Gross Profit (SGD)", value:fmtMoney(Math.round(totalGp)), highlight:"green"},
  ].map(c=> c.highlight ? `
    <div class="stat-card ${c.highlight==='blue'?'stat-card-highlight':'stat-card-highlight-green'} rounded-lg px-4 py-3">
      <div class="text-xs stat-card-highlight-label mb-1">${c.label}</div>
      <div class="text-xl font-bold stat-card-highlight-value">${c.value}</div>
    </div>` : `
    <div class="stat-card rounded-lg px-4 py-3">
      <div class="text-xs text-[var(--muted)] mb-1">${c.label}</div>
      <div class="text-xl font-bold">${c.value}</div>
    </div>`).join('');

  const salaryRanges = financeSalaryTerm.map(t=>{
    const [minStr, maxStr] = t.split('-');
    return { min: Number(minStr), max: Number(maxStr) };
  });

  let rows = talents.filter(c=>{
    if(financeSearchTerm && !c.name.toLowerCase().includes(financeSearchTerm.toLowerCase())) return false;
    if(financeClientTerm.length && !financeClientTerm.includes(c.client)) return false;
    if(salaryRanges.length && !salaryRanges.some(r=>c.salary >= r.min && c.salary <= r.max)) return false;
    return true;
  });

  const figuresByRow = new Map();
  rows.forEach(c=> figuresByRow.set(c.id, financeTalentFigures(c, monthOffset)));

  rows.sort((a,b)=>{
    let av, bv;
    const computedKeys = { adminFee:'adminFee', totalCost:'totalCost', revenue:'revenue', gp:null };
    if(financeSortKey === 'gp'){
      av = figuresByRow.get(a.id).revenue - figuresByRow.get(a.id).totalCost;
      bv = figuresByRow.get(b.id).revenue - figuresByRow.get(b.id).totalCost;
    } else if(computedKeys[financeSortKey]){
      av = figuresByRow.get(a.id)[computedKeys[financeSortKey]];
      bv = figuresByRow.get(b.id)[computedKeys[financeSortKey]];
    } else {
      av = a[financeSortKey]; bv = b[financeSortKey];
    }
    if(typeof av === "string"){ av = av.toLowerCase(); bv = bv.toLowerCase(); }
    if(av < bv) return -1 * financeSortDir;
    if(av > bv) return 1 * financeSortDir;
    return 0;
  });

  document.getElementById('financeResultCount').textContent = rows.length;

  const tbody = document.getElementById('financeTableBody');
  const empty = document.getElementById('financeEmpty');
  if(rows.length === 0){
    tbody.innerHTML = "";
    empty.classList.remove('hidden');
    renderPaginationBar('financePagination', 0, 1, LIST_PAGE_SIZE, ()=>{});
    return;
  }
  empty.classList.add('hidden');

  financePage = renderPaginationBar('financePagination', rows.length, financePage, LIST_PAGE_SIZE, p=>{
    financePage = p;
    renderFinance();
  });
  const startIdx = (financePage-1)*LIST_PAGE_SIZE;
  const pageRows = rows.slice(startIdx, startIdx+LIST_PAGE_SIZE);

  tbody.innerHTML = pageRows.map(c=>{
    const f = figuresByRow.get(c.id);
    const gp = f.revenue - f.totalCost;
    return `
    <tr class="row-hover border-b border-[var(--border)]">
      <td class="px-4 py-1 text-[var(--muted)] whitespace-nowrap">C${String(c.id).padStart(6,'0')}</td>
      <td class="px-4 py-1 font-medium whitespace-nowrap">
        <span class="finance-name-link cursor-pointer hover:underline hover:text-[var(--blue-dark)]" data-id="${c.id}">${c.name}</span>
      </td>
      <td class="px-4 py-1 whitespace-nowrap font-semibold">${fmtMoney(Math.round(f.totalCost))}</td>
      <td class="px-4 py-1 whitespace-nowrap font-semibold" style="color:${gp>=0?'var(--green-text)':'var(--red-text)'}">${fmtMoney(Math.round(gp))}</td>
      <td class="px-4 py-1 whitespace-nowrap">${fmtMoney(Math.round(f.salary))}</td>
      <td class="px-4 py-1 whitespace-nowrap">${fmtMoney(Math.round(f.cpf))}</td>
      <td class="px-4 py-1 whitespace-nowrap">${fmtMoney(Math.round(f.sdl))}</td>
      <td class="px-4 py-1 whitespace-nowrap">${fmtMoney(Math.round(f.wica))}</td>
      <td class="px-4 py-1 whitespace-nowrap">${fmtMoney(Math.round(f.insurance))}</td>
      <td class="px-4 py-1 whitespace-nowrap">${fmtMoney(Math.round(f.allowances))}</td>
      <td class="px-4 py-1 whitespace-nowrap">${fmtMoney(Math.round(f.claims))}</td>
      <td class="px-4 py-1 whitespace-nowrap">
        <div>${fmtMoney(Math.round(f.adminFee))}</div>
        <div class="text-[10px] text-[var(--muted)]">${c.workPassType} · ${c.passStatus}</div>
      </td>
    </tr>`;
  }).join('');

  tbody.querySelectorAll('.finance-name-link').forEach(el=>{
    el.addEventListener('click', ()=> openTalentProfile(Number(el.dataset.id), 'finance'));
  });
}

/* ---------- TALENT BILLING ---------- */
let billingSearchTerm = "";
let billingClientTerm = [];
let billingStatusTerm = [];
let billingSortKey = "name";
let billingSortDir = 1;
let billingFiltersInit = false;
let billingPage = 1;
let msBillingClient = null;
let msBillingStatusInstance = null;

function initBillingFilters(){
  if(billingFiltersInit) return;
  billingFiltersInit = true;
  msBillingClient = createMultiSelect('billingClientFilter', [...new Set(clients)].sort(), "All clients", vals=>{ billingClientTerm=vals; billingPage=1; renderBilling(); });
  msBillingStatusInstance = createMultiSelect('billingStatusFilter', ["Paid","Pending","Overdue"], "All statuses", vals=>{ billingStatusTerm=vals; billingPage=1; renderBilling(); });

  document.getElementById('billingSearchInput').addEventListener('input', e=>{
    billingSearchTerm = e.target.value;
    billingPage = 1;
    renderBilling();
  });
  wireClearButton('billingSearchInput', 'billingSearchClear', ()=>{ billingSearchTerm=""; billingPage=1; renderBilling(); });

  document.querySelectorAll('.billing-sortable[data-key]').forEach(th=>{
    th.addEventListener('click', ()=>{
      const key = th.dataset.key;
      if(billingSortKey === key){ billingSortDir *= -1; } else { billingSortKey = key; billingSortDir = 1; }
      updateBillingSortArrows();
      billingPage = 1;
      renderBilling();
    });
  });
  updateBillingSortArrows();

  document.getElementById('billingClearFilters').addEventListener('click', e=>{
    e.preventDefault();
    billingSearchTerm=""; billingClientTerm=[]; billingStatusTerm=[]; billingPage=1;
    document.getElementById('billingSearchInput').value="";
    msBillingClient.reset();
    msBillingStatusInstance.reset();
    renderBilling();
  });
  document.getElementById('billingDownloadLink').addEventListener('click', e=>{ e.preventDefault(); showToast("This mockup does not export real data yet."); });
}

function updateBillingSortArrows(){
  document.querySelectorAll('.billing-sort-caret').forEach(el=>{
    const key = el.dataset.arrow;
    const isActive = key === billingSortKey;
    el.classList.toggle('active', isActive);
    el.textContent = isActive ? (billingSortDir === 1 ? "▲" : "▼") : "▲";
  });
}

function renderBilling(){
  initBillingFilters();
  initCosmeticMonthFilter('billingStatsMonthFilter', ()=> renderBilling());

  const totalBillable = talents.reduce((s,c)=>s + c.talentInvoiceAmount, 0);
  const invoiced = talents.filter(c=>c.invoiceStatus !== "N/A").reduce((s,c)=>s + c.talentInvoiceAmount, 0);
  const paid = talents.filter(c=>c.invoiceStatus === "Paid").reduce((s,c)=>s + c.talentInvoiceAmount, 0);
  const outstanding = talents.filter(c=>c.invoiceStatus === "Pending" || c.invoiceStatus === "Overdue").reduce((s,c)=>s + c.talentInvoiceAmount, 0);
  const overdue = talents.filter(c=>c.invoiceStatus === "Overdue").reduce((s,c)=>s + c.talentInvoiceAmount, 0);
  document.getElementById('billingStatCards').innerHTML = [
    {key:null, label:"Total Billable (SGD)", value:fmtMoney(totalBillable), color:"var(--text)"},
    {key:null, label:"Invoiced (SGD)", value:fmtMoney(invoiced), color:"var(--text)"},
    {key:"paid", label:"Paid (SGD)", value:fmtMoney(paid), color:"var(--green-text)"},
    {key:"outstanding", label:"Outstanding (SGD)", value:fmtMoney(outstanding), color:"var(--red-text)"},
    {key:"overdue", label:"Overdue (SGD)", value:fmtMoney(overdue), color:"var(--red-text)"},
  ].map(c=>{
    const activeMap = { paid:["Paid"], outstanding:["Pending","Overdue"], overdue:["Overdue"] };
    const active = c.key && JSON.stringify([...billingStatusTerm].sort()) === JSON.stringify([...(activeMap[c.key]||[])].sort());
    return `
    <div class="stat-card ${c.key?'stat-card-clickable':''} rounded-lg px-4 py-3 ${active?'stat-card-clickable-active':''}" ${c.key?`data-card="${c.key}"`:''}>
      <div class="text-xs text-[var(--muted)] mb-1">${c.label}</div>
      <div class="text-xl font-bold" style="color:${c.color}">${c.value}</div>
    </div>`;
  }).join('');

  document.querySelectorAll('#billingStatCards .stat-card-clickable').forEach(card=>{
    card.addEventListener('click', ()=>{
      const key = card.dataset.card;
      const activeMap = { paid:["Paid"], outstanding:["Pending","Overdue"], overdue:["Overdue"] };
      const target = activeMap[key] || [];
      const isActive = JSON.stringify([...billingStatusTerm].sort()) === JSON.stringify([...target].sort());
      billingStatusTerm = isActive ? [] : target;
      if(msBillingStatusInstance) msBillingStatusInstance.setSelected(billingStatusTerm);
      billingPage = 1;
      renderBilling();
    });
  });

  let rows = talents.filter(c=>{
    if(billingSearchTerm && !c.name.toLowerCase().includes(billingSearchTerm.toLowerCase())) return false;
    if(billingClientTerm.length && !billingClientTerm.includes(c.client)) return false;
    if(billingStatusTerm.length && !billingStatusTerm.includes(c.invoiceStatus)) return false;
    return true;
  });

  rows.sort((a,b)=>{
    let av = a[billingSortKey], bv = b[billingSortKey];
    if(av instanceof Date){ av = av.getTime(); bv = bv.getTime(); }
    if(typeof av === "string"){ av = av.toLowerCase(); bv = bv.toLowerCase(); }
    if(av < bv) return -1 * billingSortDir;
    if(av > bv) return 1 * billingSortDir;
    return 0;
  });

  document.getElementById('billingResultCount').textContent = rows.length;

  const tbody = document.getElementById('billingTableBody');
  const empty = document.getElementById('billingEmpty');
  if(rows.length === 0){
    tbody.innerHTML = "";
    empty.classList.remove('hidden');
    renderPaginationBar('billingPagination', 0, 1, LIST_PAGE_SIZE, ()=>{});
    return;
  }
  empty.classList.add('hidden');

  billingPage = renderPaginationBar('billingPagination', rows.length, billingPage, LIST_PAGE_SIZE, p=>{
    billingPage = p;
    renderBilling();
  });
  const startIdx = (billingPage-1)*LIST_PAGE_SIZE;
  const pageRows = rows.slice(startIdx, startIdx+LIST_PAGE_SIZE);

  tbody.innerHTML = pageRows.map(c=>`
    <tr class="row-hover border-b border-[var(--border)]">
      <td class="px-4 py-1 text-[var(--muted)] whitespace-nowrap">C${String(c.id).padStart(6,'0')}</td>
      <td class="px-4 py-1 font-medium whitespace-nowrap">
        <span class="billing-name-link cursor-pointer hover:underline hover:text-[var(--blue-dark)]" data-id="${c.id}">${c.name}</span>
      </td>
      <td class="px-4 py-1 text-[var(--muted)] whitespace-nowrap">${c.client} – ${c.projectType}</td>
      <td class="px-4 py-1 whitespace-nowrap">${fmtMoney(c.chargeRate)}</td>
      <td class="px-4 py-1 whitespace-nowrap">${c.talentInvoiceNumber}</td>
      <td class="px-4 py-1 whitespace-nowrap">${fmtDate(c.talentInvoiceDate)}</td>
      <td class="px-4 py-1 whitespace-nowrap">${fmtMoney(c.talentInvoiceAmount)}</td>
      <td class="px-4 py-1 whitespace-nowrap"><span class="pill" style="${statusPillStyle(c.invoiceStatus)}">${c.invoiceStatus}</span></td>
      <td class="px-4 py-1 whitespace-nowrap">${fmtDate(c.talentInvoiceDueDate)}</td>
      <td class="px-4 py-1 whitespace-nowrap">${c.talentInvoicePaidDate ? fmtDate(c.talentInvoicePaidDate) : '–'}</td>
    </tr>`).join('');

  tbody.querySelectorAll('.billing-name-link').forEach(el=>{
    el.addEventListener('click', ()=> openTalentProfile(Number(el.dataset.id), 'billing'));
  });
}

/* ---------- Payroll Edit Modal (scoped to Talent Payroll and Cost fields only) ---------- */
const payrollModalOverlay = document.getElementById('payrollModalOverlay');
const payrollEditModal = document.getElementById('payrollEditModal');
const payrollViewContent = document.getElementById('payrollViewContent');
const payrollEditForm = document.getElementById('payrollEditForm');
let editingPayrollId = null;

function renderPayrollView(c){
  const totalMonthlyCost = c.salary + c.skillsDevelopmentLevy + c.wica + c.medicalInsuranceCost
    + c.allowances + c.claimsReimbursements + c.overtime - c.noPayLeaveDeduction + c.otherStatutoryCosts;
  const totalDailyCost = totalMonthlyCost / 22;
  const contractMonths = Math.max(1, Math.round((c.contractEnd - c.contractStart) / (1000*60*60*24*30)));
  const totalProjectCost = totalMonthlyCost * contractMonths;
  const daysWorkedThisMonth = Math.min(30, Math.max(1, 30 + c.contractDaysLeft));
  const finalSalaryOffboarding = Math.round((c.salary/30) * daysWorkedThisMonth);
  const leaveEncashment = Math.round(c.annualLeaveBalance * (c.salary/30));

  document.getElementById('payrollViewFields').innerHTML = [
    dlRow("Basic Salary (Monthly)", fmtMoney(c.salary)),
    dlRow("Skills Development Levy", fmtMoney(c.skillsDevelopmentLevy)),
    dlRow("WICA", fmtMoney(c.wica)),
    dlRow("Medical Insurance", fmtMoney(c.medicalInsuranceCost)),
    dlRow("Allowances", fmtMoney(c.allowances)),
    dlRow("Claims / Reimbursements", fmtMoney(c.claimsReimbursements)),
    dlRow("Overtime", c.overtime ? fmtMoney(c.overtime) : "N/A"),
    dlRow("No-pay Leave Deduction", c.noPayLeaveDeduction ? fmtMoney(c.noPayLeaveDeduction) : "S$ 0"),
    dlRow("Other Statutory Costs", fmtMoney(c.otherStatutoryCosts)),
    `<div class="border-t border-[var(--border)] my-2"></div>`,
    dlRow("Total Monthly Cost", `<span class="font-semibold">${fmtMoney(Math.round(totalMonthlyCost))}</span>`),
    dlRow("Total Daily Cost", fmtMoney(Math.round(totalDailyCost))),
    dlRow("Total Project Cost", fmtMoney(Math.round(totalProjectCost))),
    dlRow("Final Salary (Offboarding)", fmtMoney(finalSalaryOffboarding)),
    dlRow("Leave Encashment", fmtMoney(leaveEncashment)),
  ].join('');
}

function showPayrollView(){
  payrollViewContent.classList.remove('hidden');
  payrollEditForm.classList.add('hidden');
}
function showPayrollEditForm(c){
  document.getElementById('pe_salary').value = c.salary;
  document.getElementById('pe_skillsDevelopmentLevy').value = c.skillsDevelopmentLevy;
  document.getElementById('pe_wica').value = c.wica;
  document.getElementById('pe_medicalInsuranceCost').value = c.medicalInsuranceCost;
  document.getElementById('pe_allowances').value = c.allowances;
  document.getElementById('pe_claimsReimbursements').value = c.claimsReimbursements;
  document.getElementById('pe_overtime').value = c.overtime;
  document.getElementById('pe_noPayLeaveDeduction').value = c.noPayLeaveDeduction;
  document.getElementById('pe_otherStatutoryCosts').value = c.otherStatutoryCosts;
  payrollViewContent.classList.add('hidden');
  payrollEditForm.classList.remove('hidden');
}

function openPayrollEditModal(id){
  const c = talents.find(x=>x.id === id);
  if(!c) return;
  editingPayrollId = id;
  document.getElementById('payrollModalTitle').textContent = c.name;
  renderPayrollView(c);
  showPayrollView();
  payrollModalOverlay.classList.add('open');
  payrollEditModal.classList.add('open');
}
function closePayrollEditModalFn(){
  payrollModalOverlay.classList.remove('open');
  payrollEditModal.classList.remove('open');
  editingPayrollId = null;
}
document.getElementById('closePayrollModal').addEventListener('click', closePayrollEditModalFn);
payrollModalOverlay.addEventListener('click', closePayrollEditModalFn);

document.getElementById('payrollEditBtn').addEventListener('click', ()=>{
  const c = talents.find(x=>x.id === editingPayrollId);
  if(!c) return;
  showPayrollEditForm(c);
});
document.getElementById('cancelPayrollModal').addEventListener('click', ()=>{
  showPayrollView();
});

payrollEditForm.addEventListener('submit', e=>{
  e.preventDefault();
  const c = talents.find(x=>x.id === editingPayrollId);
  if(!c) return;
  c.salary = Number(document.getElementById('pe_salary').value);
  c.skillsDevelopmentLevy = Number(document.getElementById('pe_skillsDevelopmentLevy').value);
  c.wica = Number(document.getElementById('pe_wica').value);
  c.medicalInsuranceCost = Number(document.getElementById('pe_medicalInsuranceCost').value);
  c.allowances = Number(document.getElementById('pe_allowances').value);
  c.claimsReimbursements = Number(document.getElementById('pe_claimsReimbursements').value);
  c.overtime = Number(document.getElementById('pe_overtime').value);
  c.noPayLeaveDeduction = Number(document.getElementById('pe_noPayLeaveDeduction').value);
  c.otherStatutoryCosts = Number(document.getElementById('pe_otherStatutoryCosts').value);
  renderPayrollView(c);
  showPayrollView();
  renderFinance();
  renderStats();
  renderTable();
  refreshProfileIfOpen(c);
  showToast(`${c.name}'s payroll details updated`, checkIcon);
});

/* ---------- OPERATIONS (LEAVE & TIMESHEETS) ---------- */
let operationsSearchTerm = "";
let operationsClientTerm = [];
let operationsApprovalTerm = [];
let operationsTimesheetTerm = "";
let operationsSortKey = "name";
let operationsSortDir = 1;
let operationsFiltersInit = false;
let operationsPage = 1;
let msOperationsClient = null;
let msOperationsApproval = null;

function initOperationsFilters(){
  if(operationsFiltersInit) return;
  operationsFiltersInit = true;
  msOperationsClient = createMultiSelect('operationsClientFilter', [...new Set(clients)].sort(), "All clients", vals=>{ operationsClientTerm=vals; operationsPage=1; renderOperations(); });
  msOperationsApproval = createMultiSelect('operationsApprovalFilter', ["Approved","Pending","Rejected"], "All statuses", vals=>{ operationsApprovalTerm=vals; operationsPage=1; renderOperations(); });

  document.getElementById('operationsSearchInput').addEventListener('input', e=>{
    operationsSearchTerm = e.target.value;
    operationsPage = 1;
    renderOperations();
  });
  wireClearButton('operationsSearchInput', 'operationsSearchClear', ()=>{ operationsSearchTerm=""; operationsPage=1; renderOperations(); });

  document.querySelectorAll('.operations-sortable[data-key]').forEach(th=>{
    th.addEventListener('click', ()=>{
      const key = th.dataset.key;
      if(operationsSortKey === key){ operationsSortDir *= -1; } else { operationsSortKey = key; operationsSortDir = 1; }
      updateOperationsSortArrows();
      operationsPage = 1;
      renderOperations();
    });
  });
  updateOperationsSortArrows();

  document.getElementById('operationsClearFilters').addEventListener('click', e=>{
    e.preventDefault();
    operationsSearchTerm=""; operationsClientTerm=[]; operationsApprovalTerm=[]; operationsTimesheetTerm=""; operationsPage=1;
    document.getElementById('operationsSearchInput').value="";
    msOperationsClient.reset();
    msOperationsApproval.reset();
    renderOperations();
  });
  document.getElementById('operationsDownloadLink').addEventListener('click', e=>{ e.preventDefault(); showToast("This mockup does not export real data yet."); });
}
function updateOperationsSortArrows(){
  document.querySelectorAll('.operations-sort-caret').forEach(el=>{
    const key = el.dataset.arrow;
    const isActive = key === operationsSortKey;
    el.classList.toggle('active', isActive);
    el.textContent = isActive ? (operationsSortDir === 1 ? "▲" : "▼") : "▲";
  });
}

function renderOperations(){
  initOperationsFilters();
  initCosmeticMonthFilter('operationsStatsMonthFilter', ()=> renderOperations());

  const approvalCounts = { "Approved":0, "Pending":0, "Rejected":0 };
  talents.forEach(c=>{ if(approvalCounts[c.leaveApprovalStatus] !== undefined) approvalCounts[c.leaveApprovalStatus]++; });
  const approvalColors = { "Approved":"var(--green-text)", "Pending":"var(--amber-text)", "Rejected":"var(--red-text)" };
  document.getElementById('operationsApprovalStatCards').innerHTML = Object.keys(approvalCounts).map(label=>{
    const active = operationsApprovalTerm.length===1 && operationsApprovalTerm[0]===label;
    return `
    <div class="stat-card stat-card-clickable rounded-lg px-4 py-3 ${active?'stat-card-clickable-active':''}" data-approval="${label}">
      <div class="text-xs text-[var(--muted)] mb-1">${label}</div>
      <div class="text-xl font-bold" style="color:${approvalColors[label]}">${approvalCounts[label]}</div>
    </div>`;
  }).join('');
  document.querySelectorAll('#operationsApprovalStatCards .stat-card-clickable').forEach(card=>{
    card.addEventListener('click', ()=>{
      const label = card.dataset.approval;
      const isActive = operationsApprovalTerm.length===1 && operationsApprovalTerm[0]===label;
      operationsApprovalTerm = isActive ? [] : [label];
      if(msOperationsApproval) msOperationsApproval.setSelected(operationsApprovalTerm);
      operationsPage = 1;
      renderOperations();
    });
  });

  const submittedCount = talents.filter(c=>c.timesheetSubmitted==="Yes").length;
  const notSubmittedCount = talents.length - submittedCount;
  document.getElementById('operationsTimesheetStatCards').innerHTML = [
    { key:"Yes", label:"Submitted", value: submittedCount, color:"var(--green-text)" },
    { key:"No", label:"Not Submitted", value: notSubmittedCount, color:"var(--red-text)" },
  ].map(c=>`
    <div class="stat-card stat-card-clickable rounded-lg px-4 py-3 ${operationsTimesheetTerm===c.key?'stat-card-clickable-active':''}" data-timesheet="${c.key}">
      <div class="text-xs text-[var(--muted)] mb-1">${c.label}</div>
      <div class="text-xl font-bold" style="color:${c.color}">${c.value}</div>
    </div>
  `).join('');
  document.querySelectorAll('#operationsTimesheetStatCards .stat-card-clickable').forEach(card=>{
    card.addEventListener('click', ()=>{
      const key = card.dataset.timesheet;
      operationsTimesheetTerm = operationsTimesheetTerm===key ? "" : key;
      operationsPage = 1;
      renderOperations();
    });
  });

  let rows = talents.filter(c=>{
    if(operationsSearchTerm && !c.name.toLowerCase().includes(operationsSearchTerm.toLowerCase())) return false;
    if(operationsClientTerm.length && !operationsClientTerm.includes(c.client)) return false;
    if(operationsApprovalTerm.length && !operationsApprovalTerm.includes(c.leaveApprovalStatus)) return false;
    if(operationsTimesheetTerm && c.timesheetSubmitted !== operationsTimesheetTerm) return false;
    return true;
  });

  rows.sort((a,b)=>{
    let av = a[operationsSortKey], bv = b[operationsSortKey];
    if(typeof av === "string"){ av = av.toLowerCase(); bv = bv.toLowerCase(); }
    if(av < bv) return -1 * operationsSortDir;
    if(av > bv) return 1 * operationsSortDir;
    return 0;
  });

  document.getElementById('operationsResultCount').textContent = rows.length;
  const tbody = document.getElementById('operationsTableBody');
  const empty = document.getElementById('operationsEmpty');
  if(rows.length === 0){
    tbody.innerHTML = "";
    empty.classList.remove('hidden');
    renderPaginationBar('operationsPagination', 0, 1, LIST_PAGE_SIZE, ()=>{});
    return;
  }
  empty.classList.add('hidden');

  operationsPage = renderPaginationBar('operationsPagination', rows.length, operationsPage, LIST_PAGE_SIZE, p=>{
    operationsPage = p;
    renderOperations();
  });
  const startIdx = (operationsPage-1)*LIST_PAGE_SIZE;
  const pageRows = rows.slice(startIdx, startIdx+LIST_PAGE_SIZE);

  tbody.innerHTML = pageRows.map(c=>{
    return `
    <tr class="row-hover border-b border-[var(--border)]">
      <td class="px-4 py-1 text-[var(--muted)] whitespace-nowrap">C${String(c.id).padStart(6,'0')}</td>
      <td class="px-4 py-1 font-medium whitespace-nowrap">
        <span class="leave-name-link cursor-pointer hover:underline hover:text-[var(--blue-dark)]" data-id="${c.id}">${c.name}</span>
      </td>
      <td class="px-4 py-1 text-[var(--muted)] whitespace-nowrap">${c.client}</td>
      <td class="px-4 py-1 whitespace-nowrap">${c.annualLeaveBalance} days</td>
      <td class="px-4 py-1 whitespace-nowrap">${c.sickLeaveBalance} days</td>
      <td class="px-4 py-1 whitespace-nowrap">${c.offInLieuBalance} days</td>
      <td class="px-4 py-1 whitespace-nowrap"><span class="pill" style="${statusPillStyle(c.leaveApprovalStatus)}">${c.leaveApprovalStatus}</span></td>
      <td class="px-4 py-1 whitespace-nowrap"><span class="pill" style="${statusPillStyle(c.timesheetSubmitted)}">${c.timesheetSubmitted}</span></td>
      <td class="px-4 py-1 whitespace-nowrap"><span class="pill" style="${statusPillStyle(c.clientApproved)}">${c.clientApproved}</span></td>
    </tr>`;
  }).join('');

  document.querySelectorAll('.leave-name-link').forEach(el=>{
    el.addEventListener('click', ()=> openTalentProfile(Number(el.dataset.id), 'operations'));
  });
}

/* ---------- Leave & Timesheet Modal (scoped to Timesheet and Leave tab fields only) ---------- */
const leaveModalOverlay = document.getElementById('leaveModalOverlay');
const leaveModal = document.getElementById('leaveModal');
const leaveViewContent = document.getElementById('leaveViewContent');
const leaveEditForm = document.getElementById('leaveEditForm');
let editingLeaveId = null;

function openLeaveViewModal(id){
  const c = talents.find(x=>x.id === id);
  if(!c) return;
  editingLeaveId = id;
  document.getElementById('leaveModalTitle').textContent = `${c.name} · ${c.client}`;

  document.getElementById('leaveViewFieldsLeave').innerHTML = [
    dlRow("Annual Leave Entitlement", c.annualLeaveEntitlement + " days"),
    dlRow("Annual Leave Taken", c.annualLeaveTaken + " days"),
    dlRow("Annual Leave Balance", c.annualLeaveBalance + " days"),
    dlRow("Sick Leave Entitlement", c.sickLeaveEntitlement + " days"),
    dlRow("Sick Leave Taken", c.sickLeaveTaken + " days"),
    dlRow("Sick Leave Balance", c.sickLeaveBalance + " days"),
    dlRow("Off-in-lieu Entitlement", c.offInLieuEntitlement + " days"),
    dlRow("Off-in-lieu Taken", c.offInLieuTaken + " days"),
    dlRow("Off-in-lieu Balance", c.offInLieuBalance + " days"),
    dlRow("Unpaid Leave Taken", c.unpaidLeaveTaken + " days"),
    dlRow("MC Upload", c.mcUpload),
    dlRow("Leave Approval Status", c.leaveApprovalStatus),
  ].join('');

  document.getElementById('leaveViewFieldsTimesheet').innerHTML = [
    dlRow("Month", c.timesheetMonth),
    dlRow("Working Days", c.workingDays),
    dlRow("Timesheet Submitted", c.timesheetSubmitted),
    dlRow("Submission Date", c.submissionDate ? fmtDate(c.submissionDate) : "N/A"),
    dlRow("Client Approved", c.clientApproved),
    dlRow("Approval Date", c.approvalDate ? fmtDate(c.approvalDate) : "N/A"),
    dlRow("Overtime Hours", c.overtimeHours ? c.overtimeHours + " hrs" : "N/A"),
    dlRow("Absence Days", c.absenceDays + " days"),
    dlRow("Remarks", c.timesheetRemarks),
  ].join('');

  leaveViewContent.classList.remove('hidden');
  leaveEditForm.classList.add('hidden');
  leaveModalOverlay.classList.add('open');
  leaveModal.classList.add('open');
}
function closeLeaveModalFn(){
  leaveModalOverlay.classList.remove('open');
  leaveModal.classList.remove('open');
  editingLeaveId = null;
}
document.getElementById('closeLeaveModal').addEventListener('click', closeLeaveModalFn);
document.getElementById('cancelLeaveModal').addEventListener('click', closeLeaveModalFn);
leaveModalOverlay.addEventListener('click', closeLeaveModalFn);

document.getElementById('leaveEditBtn').addEventListener('click', ()=>{
  const c = talents.find(x=>x.id === editingLeaveId);
  if(!c) return;
  document.getElementById('lv_annualEntitlement').value = c.annualLeaveEntitlement;
  document.getElementById('lv_annualTaken').value = c.annualLeaveTaken;
  document.getElementById('lv_sickEntitlement').value = c.sickLeaveEntitlement;
  document.getElementById('lv_sickTaken').value = c.sickLeaveTaken;
  document.getElementById('lv_oilEntitlement').value = c.offInLieuEntitlement;
  document.getElementById('lv_oilTaken').value = c.offInLieuTaken;
  document.getElementById('lv_unpaidTaken').value = c.unpaidLeaveTaken;
  document.getElementById('lv_mcUpload').value = c.mcUpload;
  document.getElementById('lv_approvalStatus').value = c.leaveApprovalStatus;
  document.getElementById('lv_month').value = c.timesheetMonth;
  document.getElementById('lv_workingDays').value = c.workingDays;
  document.getElementById('lv_submitted').value = c.timesheetSubmitted;
  document.getElementById('lv_submissionDate').value = c.submissionDate ? toISO(c.submissionDate) : '';
  document.getElementById('lv_clientApproved').value = c.clientApproved;
  document.getElementById('lv_approvalDate').value = c.approvalDate ? toISO(c.approvalDate) : '';
  document.getElementById('lv_overtimeHours').value = c.overtimeHours;
  document.getElementById('lv_absenceDays').value = c.absenceDays;
  document.getElementById('lv_remarks').value = c.timesheetRemarks;
  leaveViewContent.classList.add('hidden');
  leaveEditForm.classList.remove('hidden');
});

leaveEditForm.addEventListener('submit', e=>{
  e.preventDefault();
  const c = talents.find(x=>x.id === editingLeaveId);
  if(!c) return;
  c.annualLeaveEntitlement = Number(document.getElementById('lv_annualEntitlement').value);
  c.annualLeaveTaken = Number(document.getElementById('lv_annualTaken').value);
  c.annualLeaveBalance = c.annualLeaveEntitlement - c.annualLeaveTaken;
  c.sickLeaveEntitlement = Number(document.getElementById('lv_sickEntitlement').value);
  c.sickLeaveTaken = Number(document.getElementById('lv_sickTaken').value);
  c.sickLeaveBalance = c.sickLeaveEntitlement - c.sickLeaveTaken;
  c.offInLieuEntitlement = Number(document.getElementById('lv_oilEntitlement').value);
  c.offInLieuTaken = Number(document.getElementById('lv_oilTaken').value);
  c.offInLieuBalance = c.offInLieuEntitlement - c.offInLieuTaken;
  c.unpaidLeaveTaken = Number(document.getElementById('lv_unpaidTaken').value);
  c.mcUpload = document.getElementById('lv_mcUpload').value;
  c.leaveApprovalStatus = document.getElementById('lv_approvalStatus').value;
  c.timesheetMonth = document.getElementById('lv_month').value.trim();
  c.workingDays = Number(document.getElementById('lv_workingDays').value);
  c.timesheetSubmitted = document.getElementById('lv_submitted').value;
  const subDateVal = document.getElementById('lv_submissionDate').value;
  c.submissionDate = subDateVal ? new Date(subDateVal) : null;
  c.clientApproved = document.getElementById('lv_clientApproved').value;
  const appDateVal = document.getElementById('lv_approvalDate').value;
  c.approvalDate = appDateVal ? new Date(appDateVal) : null;
  c.overtimeHours = Number(document.getElementById('lv_overtimeHours').value);
  c.absenceDays = Number(document.getElementById('lv_absenceDays').value);
  c.timesheetRemarks = document.getElementById('lv_remarks').value.trim();
  openLeaveViewModal(c.id);
  renderOperations();
  refreshProfileIfOpen(c);
  showToast(`${c.name}'s timesheet & leave details updated`, checkIcon);
});

/* ---------- MANAGEMENT ANALYTICS ---------- */
const analyticsMetricDefs = [
  { key:"monthlyRevenue", label:"Monthly Revenue", fmt:v=>fmtMoney(Math.round(v)), volatility:0.06 },
  { key:"monthlyCost", label:"Monthly Cost", fmt:v=>fmtMoney(Math.round(v)), volatility:0.05 },
  { key:"grossProfit", label:"Gross Profit", fmt:v=>fmtMoney(Math.round(v)), volatility:0.08 },
  { key:"grossMargin", label:"Gross Margin %", fmt:v=>v.toFixed(1)+"%", volatility:0.03 },
  { key:"workPassAdminFee", label:"Work Pass Admin Fee", fmt:v=>fmtMoney(Math.round(v)), volatility:0.02 },
  { key:"projectRevenue", label:"Project Revenue", fmt:v=>fmtMoney(Math.round(v)), volatility:0.05 },
  { key:"projectCost", label:"Project Cost", fmt:v=>fmtMoney(Math.round(v)), volatility:0.04 },
  { key:"projectGp", label:"Project GP", fmt:v=>fmtMoney(Math.round(v)), volatility:0.07 },
];
const HISTORY_MONTHS = 36;

function addMonths(date, n){ return new Date(date.getFullYear(), date.getMonth()+n, 1); }
const monthDates = Array.from({length:HISTORY_MONTHS}, (_,i)=> addMonths(today, i - (HISTORY_MONTHS-1)));

function generateMonthlySeries(currentValue, volatility, isPercent){
  const arr = new Array(HISTORY_MONTHS);
  arr[HISTORY_MONTHS-1] = currentValue;
  for(let i=HISTORY_MONTHS-2;i>=0;i--){
    const pct = (Math.random()*2 - 1) * volatility;
    let prev = arr[i+1] / (1+pct);
    if(isPercent) prev = Math.min(95, Math.max(5, prev));
    arr[i] = prev;
  }
  return arr;
}

/* Stable per-client 3-year monthly history, generated once so re-opening a client/chart doesn't change the numbers */
const clientHistory = {};
clients.forEach(client=>{
  const m = computeClientMetrics(client);
  clientHistory[client] = {};
  analyticsMetricDefs.forEach(def=>{
    clientHistory[client][def.key] = generateMonthlySeries(m[def.key], def.volatility, def.key === "grossMargin");
  });
});

/* Stable per-client mock billing & commercial details */
function randomClientBilling(){
  const billingType = pick(["Monthly","Daily","Hourly"]);
  const chargeRate = randInt(400,2000);
  const currency = pick(["SGD","SGD","SGD","USD"]);
  const billableStart = addDays(today, -randInt(30,400));
  const billableEnd = addDays(today, randInt(30,400));
  const sowRequired = pick(["Yes","Yes","No"]);
  const sowStatus = pick(["Drafted","Pending","Received","Signed"]);
  const poRequired = pick(["Yes","No"]);
  const poStatus = pick(["Raised","Pending","Received"]);
  const invoiceNumber = `INV-${today.getFullYear()}-${randInt(1000,9999)}`;
  const invoiceDate = addDays(today, -randInt(0,45));
  const invoiceAmount = randInt(10000,150000);
  const invoiceStatus = pick(["Pending","Issued","Paid","Overdue"]);
  const clientPaymentDueDate = addDays(invoiceDate, 30);
  const clientPaymentReceivedDate = invoiceStatus === "Paid" ? addDays(invoiceDate, randInt(5,35)) : null;
  return { billingType, chargeRate, currency, billableStart, billableEnd, sowRequired, sowStatus,
    poRequired, poStatus, invoiceNumber, invoiceDate, invoiceAmount, invoiceStatus,
    clientPaymentDueDate, clientPaymentReceivedDate };
}
const clientBilling = {};
clients.forEach(client=>{ clientBilling[client] = randomClientBilling(); });

/* Stable SOW records: one per unique (client, project) combination among current talents */
const sowRecords = [];
clients.forEach(client=>{
  const projectsForClient = [...new Set(talents.filter(t=>t.client===client).map(t=>t.projectType))];
  projectsForClient.forEach(project=>{
    const sowRequired = pick(["Yes","Yes","Yes","No"]);
    const sowStatus = sowRequired === "No" ? "N/A" : pick(["Completed","Completed","Pending","Drafted","Yet to Draft"]);
    const hasDates = sowStatus !== "N/A";
    const dateOfCommencement = hasDates ? addDays(today, -randInt(10,300)) : null;
    const dateOfCompletion = hasDates ? addDays(dateOfCommencement, randInt(60,365)) : null;
    const remarks = sowStatus === "Pending" ? "Waiting for client" : sowStatus === "Drafted" ? "Draft in progress" : sowStatus === "Yet to Draft" ? "Not started yet" : "";
    const matchingTalents = talents.filter(t=>t.client===client && t.projectType===project);
    const talentIds = matchingTalents.length ? Array.from({length: Math.min(matchingTalents.length, randInt(1,3))}, ()=>pick(matchingTalents).id).filter((v,i,a)=>a.indexOf(v)===i) : [];
    // Mirrors the other renewal-staleness tracking: if seeded as already "Completed", mark it
    // completed-but-not-yet-reflected so the Renewal Centre can flag it for update.
    const sowRenewalCompletedSeq = sowStatus === "Completed" ? 1 : 0;
    const sowDatesUpdatedSeq = 0;
    sowRecords.push({ client, project, sowRequired, sowStatus, dateOfCommencement, dateOfCompletion, validTo: dateOfCompletion, remarks, talentIds, sowRenewalCompletedSeq, sowDatesUpdatedSeq });
  });
});

/* Stable PO records: one per (client, month) for the last 3 months */
const poRecords = [];
clients.forEach(client=>{
  for(let i=0;i<3;i++){
    const monthDate = monthDates[HISTORY_MONTHS-1-i];
    const poRequired = pick(["Yes","Yes","Yes","No"]);
    const poStatus = poRequired === "No" ? "N/A" : pick(["Completed","Completed","Pending","Drafted","Yet to Draft"]);
    const hasDates = poStatus !== "N/A";
    const dateOfCommencement = hasDates ? monthDate : null;
    const dateOfCompletion = hasDates ? addDays(monthDate, randInt(20,40)) : null;
    const poNo = poStatus === "Completed" ? `PO-${client.replace(/[^A-Za-z]/g,'').slice(0,3).toUpperCase()}-${monthDate.getFullYear()}${String(monthDate.getMonth()+1).padStart(2,'0')}` : null;
    const remarks = poStatus === "Pending" ? "Awaiting approval" : poStatus === "Drafted" ? "Raised, pending client sign-off" : poStatus === "Yet to Draft" ? "Not started yet" : "";
    const matchingTalents = talents.filter(t=>t.client===client);
    const talentIds = matchingTalents.length ? Array.from({length: Math.min(matchingTalents.length, randInt(1,3))}, ()=>pick(matchingTalents).id).filter((v,i,a)=>a.indexOf(v)===i) : [];
    const poRenewalCompletedSeq = poStatus === "Completed" ? 1 : 0;
    const poDatesUpdatedSeq = 0;
    poRecords.push({ client, month: monthDate, poRequired, poStatus, poNo, dateOfCommencement, dateOfCompletion, poReceivedDate: dateOfCompletion, remarks, talentIds, poRenewalCompletedSeq, poDatesUpdatedSeq });
  }
});

/* Display + color for SOW/PO Status pills */
function sowPoStatusPillStyle(status){
  if(status === "Completed") return `background:var(--green-bg);color:var(--green-text)`;
  if(status === "Drafted" || status === "Pending") return `background:var(--amber-bg);color:var(--amber-text)`;
  if(status === "Yet to Draft") return `background:var(--red-bg);color:var(--red-text)`;
  return `background:#F1F3F5;color:var(--muted)`; // N/A
}
function isSowRenewalStale(r){
  return r.sowStatus === "Completed" && (r.sowDatesUpdatedSeq||0) < (r.sowRenewalCompletedSeq||0);
}
function isPoRenewalStale(r){
  return r.poStatus === "Completed" && (r.poDatesUpdatedSeq||0) < (r.poRenewalCompletedSeq||0);
}

function trendBadge(pct){
  const up = pct >= 0;
  const color = up ? "var(--green-text)" : "var(--red-text)";
  const bg = up ? "var(--green-bg)" : "var(--red-bg)";
  const arrow = up ? "▲" : "▼";
  return `<span class="pill" style="background:${bg};color:${color}">${arrow} ${Math.abs(pct).toFixed(1)}%</span>`;
}
function pctChange(curr, prev){
  if(!prev) return 0;
  return ((curr-prev)/Math.abs(prev))*100;
}
function monthLabel(d){ return d.toLocaleDateString('en-SG', { month:'short', year:'2-digit' }); }

function computeClientMetrics(client){
  const group = talents.filter(c=>c.client===client);
  let monthlyRevenue=0, monthlyCost=0, projectRevenue=0, projectCost=0, workPassAdminFee=0;
  group.forEach(c=>{
    const rev = computeTalentRevenue(c);
    const cost = computeTotalPayrollCost(c);
    monthlyRevenue += rev;
    monthlyCost += cost;
    workPassAdminFee += getWorkPassAdminFee(c);
    const months = Math.max(1, Math.round((c.contractEnd - c.contractStart) / (1000*60*60*24*30)));
    projectRevenue += rev*months;
    projectCost += cost*months;
  });
  const grossProfit = monthlyRevenue - monthlyCost;
  const grossMargin = monthlyRevenue ? (grossProfit/monthlyRevenue)*100 : 0;
  const projectGp = projectRevenue - projectCost;
  return { count: group.length, monthlyRevenue, monthlyCost, grossProfit, grossMargin, projectRevenue, projectCost, projectGp, workPassAdminFee };
}

/* ---------- CLIENTS ---------- */
const industries = ["Banking & Finance","Telecommunications","Technology","Government","Healthcare",
  "Retail & E-commerce","Aviation","Real Estate","Manufacturing","Media & Publishing","Education"];
const accountManagers = ["Natasha","Marcus Tan","Priya Nair","Daniel Wong","Farah Aziz"];

function randomClientProfile(){
  const contactPerson = `${pick(firstNames)} ${pick(lastNames)}`;
  return {
    industry: pick(industries),
    contactPerson,
    contactEmail: `${contactPerson.toLowerCase().replace(/\s+/g,'.')}@client.com`,
    contactNumber: `+65 6${randInt(100,999)} ${randInt(1000,9999)}`,
    accountManager: pick(accountManagers),
    status: Math.random() < 0.9 ? "Active" : "Inactive",
  };
}
const clientProfiles = {};
clients.forEach(client=>{ clientProfiles[client] = randomClientProfile(); });

let clientsSearchTerm = "";
let clientsIndustryTerm = [];
let clientsStatusTerm = [];
let clientsSortKey = "client";
let clientsSortDir = 1;
let clientsFiltersInit = false;
let clientsPage = 1;
let msClientsStatus = null;

function initClientsFilters(){
  if(clientsFiltersInit) return;
  clientsFiltersInit = true;
  const msClientsIndustry = createMultiSelect('clientsIndustryFilter', [...new Set(industries)].sort(), "All industries", vals=>{ clientsIndustryTerm=vals; clientsPage=1; renderClients(); });
  msClientsStatus = createMultiSelect('clientsStatusFilter', ["Active","Inactive"], "All statuses", vals=>{ clientsStatusTerm=vals; clientsPage=1; renderClients(); });

  document.getElementById('clientsSearchInput').addEventListener('input', e=>{
    clientsSearchTerm = e.target.value;
    clientsPage = 1;
    renderClients();
  });
  wireClearButton('clientsSearchInput', 'clientsSearchClear', ()=>{ clientsSearchTerm=""; clientsPage=1; renderClients(); });

  document.querySelectorAll('.clients-sortable[data-key]').forEach(th=>{
    th.addEventListener('click', ()=>{
      const key = th.dataset.key;
      if(clientsSortKey === key){ clientsSortDir *= -1; } else { clientsSortKey = key; clientsSortDir = 1; }
      updateClientsSortArrows();
      clientsPage = 1;
      renderClients();
    });
  });
  updateClientsSortArrows();

  fillOptions(document.getElementById('cl_industry'), industries, null);
  fillOptions(document.getElementById('cl_accountManager'), accountManagers, null);

  document.getElementById('clientsClearFilters').addEventListener('click', e=>{
    e.preventDefault();
    clientsSearchTerm=""; clientsIndustryTerm=[]; clientsStatusTerm=[]; clientsPage=1;
    document.getElementById('clientsSearchInput').value="";
    msClientsIndustry.reset();
    msClientsStatus.reset();
    renderClients();
  });
  document.getElementById('clientsDownloadLink').addEventListener('click', e=>{ e.preventDefault(); showToast("This mockup does not export real data yet."); });
}
function updateClientsSortArrows(){
  document.querySelectorAll('.clients-sort-caret').forEach(el=>{
    const key = el.dataset.arrow;
    const isActive = key === clientsSortKey;
    el.classList.toggle('active', isActive);
    el.textContent = isActive ? (clientsSortDir === 1 ? "▲" : "▼") : "▲";
  });
}

function renderClients(){
  initClientsFilters();
  initCosmeticMonthFilter('clientsStatsMonthFilter', ()=> renderClients());

  const activeCount = clients.filter(c=>clientProfiles[c].status==="Active").length;
  const totalTalents = talents.length;
  const totalGp = clients.reduce((s,c)=>s+computeClientMetrics(c).grossProfit, 0);
  document.getElementById('clientsStatCards').innerHTML = [
    { key:"all", label:"Total Clients", value: clients.length, color:"var(--text)" },
    { key:"active", label:"Active Clients", value: activeCount, color:"var(--blue-dark)" },
    { key:"talents", label:"Total Talents", value: totalTalents, color:"var(--text)" },
    { key:"gp", label:"Total Gross Profit", value: fmtMoney(Math.round(totalGp)), color: totalGp>=0 ? "var(--green-text)" : "var(--red-text)" },
  ].map(c=>{
    const active = (c.key==="active" && clientsStatusTerm.includes("Active"))
      || (c.key==="all" && clientsStatusTerm.length===0);
    return `
    <div class="stat-card stat-card-clickable rounded-lg px-4 py-3 ${active?'stat-card-clickable-active':''}" data-card="${c.key}">
      <div class="text-xs text-[var(--muted)] mb-1">${c.label}</div>
      <div class="text-xl font-bold" style="color:${c.color}">${c.value}</div>
    </div>`;
  }).join('');

  document.querySelectorAll('#clientsStatCards .stat-card-clickable').forEach(card=>{
    card.addEventListener('click', ()=>{
      const key = card.dataset.card;
      if(key === "all"){
        clientsStatusTerm = [];
        if(msClientsStatus) msClientsStatus.setSelected(clientsStatusTerm);
        clientsPage = 1;
        renderClients();
      } else if(key === "active"){
        clientsStatusTerm = clientsStatusTerm.includes("Active") ? clientsStatusTerm.filter(s=>s!=="Active") : [...clientsStatusTerm, "Active"];
        if(msClientsStatus) msClientsStatus.setSelected(clientsStatusTerm);
        clientsPage = 1;
        renderClients();
      } else if(key === "talents"){
        switchView('talents');
      } else if(key === "gp"){
        switchView('analytics');
      }
    });
  });

  let rows = clients.map(client=>{
    const p = clientProfiles[client];
    const talentCount = talents.filter(c=>c.client===client).length;
    return { client, ...p, talentCount };
  }).filter(r=>{
    if(clientsSearchTerm && !r.client.toLowerCase().includes(clientsSearchTerm.toLowerCase())) return false;
    if(clientsIndustryTerm.length && !clientsIndustryTerm.includes(r.industry)) return false;
    if(clientsStatusTerm.length && !clientsStatusTerm.includes(r.status)) return false;
    return true;
  });

  rows.sort((a,b)=>{
    let av = a[clientsSortKey], bv = b[clientsSortKey];
    if(typeof av === "string"){ av = av.toLowerCase(); bv = bv.toLowerCase(); }
    if(av < bv) return -1 * clientsSortDir;
    if(av > bv) return 1 * clientsSortDir;
    return 0;
  });

  document.getElementById('clientsResultCount').textContent = rows.length;
  const tbody = document.getElementById('clientsTableBody');
  const empty = document.getElementById('clientsEmpty');
  if(rows.length === 0){
    tbody.innerHTML = "";
    empty.classList.remove('hidden');
    renderPaginationBar('clientsPagination', 0, 1, LIST_PAGE_SIZE, ()=>{});
    return;
  }
  empty.classList.add('hidden');

  clientsPage = renderPaginationBar('clientsPagination', rows.length, clientsPage, LIST_PAGE_SIZE, p=>{
    clientsPage = p;
    renderClients();
  });
  const startIdx = (clientsPage-1)*LIST_PAGE_SIZE;
  const pageRows = rows.slice(startIdx, startIdx+LIST_PAGE_SIZE);

  tbody.innerHTML = pageRows.map(r=>{
    const statusBg = r.status === "Active" ? "var(--green-bg)" : "#EEE";
    const statusText = r.status === "Active" ? "var(--green-text)" : "var(--muted)";
    return `
      <tr class="row-hover border-b border-[var(--border)]">
        <td class="px-4 py-1 font-medium">
          <span class="client-name-link cursor-pointer hover:underline hover:text-[var(--blue-dark)]" data-client="${r.client}">${r.client}</span>
        </td>
        <td class="px-4 py-1 text-[var(--muted)] whitespace-nowrap">${r.industry}</td>
        <td class="px-4 py-1 whitespace-nowrap">${r.contactPerson}</td>
        <td class="px-4 py-1 whitespace-nowrap">${r.contactEmail}</td>
        <td class="px-4 py-1 whitespace-nowrap">${r.contactNumber}</td>
        <td class="px-4 py-1 whitespace-nowrap">${r.accountManager}</td>
        <td class="px-4 py-1 whitespace-nowrap">${r.talentCount}</td>
        <td class="px-4 py-1 whitespace-nowrap"><span class="pill" style="background:${statusBg};color:${statusText}">${r.status}</span></td>
      </tr>`;
  }).join('');

  tbody.querySelectorAll('.client-name-link').forEach(el=>{
    el.addEventListener('click', ()=> openClientViewModal(el.dataset.client));
  });
}

/* ---------- SOW AND PO TRACKING ---------- */
let sowSearchTerm = "";
let sowStatusTerm = [];
let sowRequiredTerm = [];
let sowSortKey = "client";
let sowSortDir = 1;
let sowPage = 1;
let sowFiltersInit = false;

function initSowFilters(){
  if(sowFiltersInit) return;
  sowFiltersInit = true;
  const msSowStatus = createMultiSelect('sowStatusFilter', ["Completed","Drafted","Pending","Yet to Draft","N/A"], "All statuses", vals=>{ sowStatusTerm=vals; sowPage=1; renderSowTable(); });
  const msSowRequired = createMultiSelect('sowRequiredFilter', ["Yes","No"], "All", vals=>{ sowRequiredTerm=vals; sowPage=1; renderSowTable(); });

  document.getElementById('sowSearchInput').addEventListener('input', e=>{ sowSearchTerm=e.target.value; sowPage=1; renderSowTable(); });
  wireClearButton('sowSearchInput', 'sowSearchClear', ()=>{ sowSearchTerm=""; sowPage=1; renderSowTable(); });

  document.querySelectorAll('.sow-sortable[data-key]').forEach(th=>{
    th.addEventListener('click', ()=>{
      const key = th.dataset.key;
      if(sowSortKey === key){ sowSortDir *= -1; } else { sowSortKey = key; sowSortDir = 1; }
      updateSowSortArrows();
      sowPage = 1;
      renderSowTable();
    });
  });
  updateSowSortArrows();

  document.getElementById('sowClearFilters').addEventListener('click', e=>{
    e.preventDefault();
    sowSearchTerm=""; sowStatusTerm=[]; sowRequiredTerm=[]; sowPage=1;
    document.getElementById('sowSearchInput').value="";
    msSowStatus.reset();
    msSowRequired.reset();
    renderSowTable();
  });
  document.getElementById('sowDownloadLink').addEventListener('click', e=>{ e.preventDefault(); showToast("This mockup does not export real data yet."); });
}
function updateSowSortArrows(){
  document.querySelectorAll('.sow-sort-caret').forEach(el=>{
    const key = el.dataset.arrow;
    const isActive = key === sowSortKey;
    el.classList.toggle('active', isActive);
    el.textContent = isActive ? (sowSortDir === 1 ? "▲" : "▼") : "▲";
  });
}
function renderSowTable(){
  initSowFilters();
  let rows = sowRecords.filter(r=>{
    if(sowSearchTerm){
      const term = sowSearchTerm.toLowerCase();
      if(!r.client.toLowerCase().includes(term) && !r.project.toLowerCase().includes(term)) return false;
    }
    if(sowStatusTerm.length && !sowStatusTerm.includes(r.sowStatus)) return false;
    if(sowRequiredTerm.length && !sowRequiredTerm.includes(r.sowRequired)) return false;
    return true;
  });

  rows.sort((a,b)=>{
    let av = a[sowSortKey], bv = b[sowSortKey];
    if(av instanceof Date){ av = av ? av.getTime() : -Infinity; bv = bv ? bv.getTime() : -Infinity; }
    if(typeof av === "string"){ av = av.toLowerCase(); bv = bv.toLowerCase(); }
    if(av < bv) return -1 * sowSortDir;
    if(av > bv) return 1 * sowSortDir;
    return 0;
  });

  document.getElementById('sowResultCount').textContent = rows.length;
  const tbody = document.getElementById('sowTableBody');
  const empty = document.getElementById('sowEmpty');
  if(rows.length === 0){
    tbody.innerHTML = "";
    empty.classList.remove('hidden');
    renderPaginationBar('sowPagination', 0, 1, LIST_PAGE_SIZE, ()=>{});
    return;
  }
  empty.classList.add('hidden');

  sowPage = renderPaginationBar('sowPagination', rows.length, sowPage, LIST_PAGE_SIZE, p=>{
    sowPage = p;
    renderSowTable();
  });
  const startIdx = (sowPage-1)*LIST_PAGE_SIZE;
  const pageRows = rows.slice(startIdx, startIdx+LIST_PAGE_SIZE);

  tbody.innerHTML = pageRows.map(r=>`
    <tr class="row-hover border-b border-[var(--border)]">
      <td class="px-4 py-1 font-medium whitespace-nowrap">${r.client} – ${r.project}</td>
      <td class="px-4 py-1 whitespace-nowrap"><span class="pill" style="${statusPillStyle(r.sowRequired)}">${r.sowRequired}</span></td>
      <td class="px-4 py-1 whitespace-nowrap"><span class="pill" style="${sowPoStatusPillStyle(r.sowStatus)}">${r.sowStatus}</span></td>
      <td class="px-4 py-1 whitespace-nowrap">${r.validTo ? fmtDate(r.validTo) : "-"}</td>
      <td class="px-4 py-1 text-[var(--muted)] whitespace-nowrap">${r.remarks}</td>
    </tr>`).join('');
}

let poSearchTerm = "";
let poStatusTerm = [];
let poMonthTerm = [];
let poSortKey = "month";
let poSortDir = -1;
let poPage = 1;
let poFiltersInit = false;

function initPoFilters(){
  if(poFiltersInit) return;
  poFiltersInit = true;
  const msPoStatus = createMultiSelect('poStatusFilter', ["Completed","Drafted","Pending","Yet to Draft","N/A"], "All statuses", vals=>{ poStatusTerm=vals; poPage=1; renderPoTable(); });
  const monthOptions = [];
  for(let i=0;i<3;i++){
    const d = monthDates[HISTORY_MONTHS-1-i];
    monthOptions.push({ value:String(i), label: i===0 ? `${monthLabelFull(d)} (Current)` : monthLabelFull(d) });
  }
  const msPoMonth = createMultiSelect('poMonthFilter', monthOptions, "All months", vals=>{ poMonthTerm=vals; poPage=1; renderPoTable(); });

  document.getElementById('poSearchInput').addEventListener('input', e=>{ poSearchTerm=e.target.value; poPage=1; renderPoTable(); });
  wireClearButton('poSearchInput', 'poSearchClear', ()=>{ poSearchTerm=""; poPage=1; renderPoTable(); });

  document.querySelectorAll('.po-sortable[data-key]').forEach(th=>{
    th.addEventListener('click', ()=>{
      const key = th.dataset.key;
      if(poSortKey === key){ poSortDir *= -1; } else { poSortKey = key; poSortDir = 1; }
      updatePoSortArrows();
      poPage = 1;
      renderPoTable();
    });
  });
  updatePoSortArrows();

  document.getElementById('poClearFilters').addEventListener('click', e=>{
    e.preventDefault();
    poSearchTerm=""; poStatusTerm=[]; poMonthTerm=[]; poPage=1;
    document.getElementById('poSearchInput').value="";
    msPoStatus.reset();
    msPoMonth.reset();
    renderPoTable();
  });
  document.getElementById('poDownloadLink').addEventListener('click', e=>{ e.preventDefault(); showToast("This mockup does not export real data yet."); });
}
function updatePoSortArrows(){
  document.querySelectorAll('.po-sort-caret').forEach(el=>{
    const key = el.dataset.arrow;
    const isActive = key === poSortKey;
    el.classList.toggle('active', isActive);
    el.textContent = isActive ? (poSortDir === 1 ? "▲" : "▼") : "▲";
  });
}
function renderPoTable(){
  initPoFilters();
  let rows = poRecords.filter(r=>{
    if(poSearchTerm && !r.client.toLowerCase().includes(poSearchTerm.toLowerCase())) return false;
    if(poStatusTerm.length && !poStatusTerm.includes(r.poStatus)) return false;
    if(poMonthTerm.length){
      const targetIdxs = poMonthTerm.map(t=>HISTORY_MONTHS-1-Number(t));
      const matches = targetIdxs.some(idx=>r.month.getTime() === monthDates[idx].getTime());
      if(!matches) return false;
    }
    return true;
  });

  rows.sort((a,b)=>{
    let av = a[poSortKey], bv = b[poSortKey];
    if(av instanceof Date){ av = av ? av.getTime() : -Infinity; bv = bv ? bv.getTime() : -Infinity; }
    if(typeof av === "string"){ av = av.toLowerCase(); bv = bv.toLowerCase(); }
    if(av < bv) return -1 * poSortDir;
    if(av > bv) return 1 * poSortDir;
    return 0;
  });

  document.getElementById('poResultCount').textContent = rows.length;
  const tbody = document.getElementById('poTableBody');
  const empty = document.getElementById('poEmpty');
  if(rows.length === 0){
    tbody.innerHTML = "";
    empty.classList.remove('hidden');
    renderPaginationBar('poPagination', 0, 1, LIST_PAGE_SIZE, ()=>{});
    return;
  }
  empty.classList.add('hidden');

  poPage = renderPaginationBar('poPagination', rows.length, poPage, LIST_PAGE_SIZE, p=>{
    poPage = p;
    renderPoTable();
  });
  const startIdx = (poPage-1)*LIST_PAGE_SIZE;
  const pageRows = rows.slice(startIdx, startIdx+LIST_PAGE_SIZE);

  tbody.innerHTML = pageRows.map(r=>`
    <tr class="row-hover border-b border-[var(--border)]">
      <td class="px-4 py-1 font-medium whitespace-nowrap">${r.client}</td>
      <td class="px-4 py-1 whitespace-nowrap">${monthLabelFull(r.month)}</td>
      <td class="px-4 py-1 whitespace-nowrap"><span class="pill" style="${statusPillStyle(r.poRequired)}">${r.poRequired}</span></td>
      <td class="px-4 py-1 whitespace-nowrap"><span class="pill" style="${sowPoStatusPillStyle(r.poStatus)}">${r.poStatus}</span></td>
      <td class="px-4 py-1 whitespace-nowrap">${r.poNo || "-"}</td>
      <td class="px-4 py-1 whitespace-nowrap">${r.poReceivedDate ? fmtDate(r.poReceivedDate) : "-"}</td>
      <td class="px-4 py-1 text-[var(--muted)] whitespace-nowrap">${r.remarks}</td>
    </tr>`).join('');
}

const sowpoTabsList = [
  {id:'sow', label:'SOW Tracking'},
  {id:'po', label:'PO Tracking'},
];
let activeSowpoTab = 'sow';

function renderSowpoTabBar(){
  const bar = document.getElementById('sowpoTabBar');
  bar.innerHTML = sowpoTabsList.map(t=>`
    <button type="button" class="profile-tab-btn px-4 py-3 text-sm font-medium ${activeSowpoTab===t.id?'active':''}" data-tab="${t.id}">${t.label}</button>
  `).join('');
  bar.querySelectorAll('.profile-tab-btn').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      activeSowpoTab = btn.dataset.tab;
      switchSowpoTab();
    });
  });
}
function switchSowpoTab(){
  document.querySelectorAll('.sowpo-tab-panel').forEach(p=>p.classList.add('hidden'));
  document.getElementById('sowpo-tab-'+activeSowpoTab).classList.remove('hidden');
  renderSowpoTabBar();
}

function renderSowPoTracking(){
  renderSowpoTabBar();
  document.querySelectorAll('.sowpo-tab-panel').forEach(p=>p.classList.add('hidden'));
  document.getElementById('sowpo-tab-'+activeSowpoTab).classList.remove('hidden');
  renderSowTable();
  renderPoTable();
}

/* ---------- TALENTS > INSURANCE sub-tab ---------- */
let policySortState = { key: 'policyDaysLeft', dir: 1 };
let policySortInit = false;
let policySearchTerm = "";
let policyTypeTerm = [];
let policyStatusTerm = [];
let policyRenewalStatusTerm = [];
let policyViewMode = 'pending';

function updatePolicyViewButtonStyles(){
  document.querySelectorAll('.policy-view-btn').forEach(btn=>{
    const active = btn.dataset.mode === policyViewMode;
    btn.classList.toggle('bg-white', active);
    btn.classList.toggle('shadow-sm', active);
    btn.classList.toggle('text-[var(--text)]', active);
    btn.classList.toggle('text-[var(--muted)]', !active);
  });
}
document.querySelectorAll('.policy-view-btn').forEach(btn=>{
  updatePolicyViewButtonStyles();
  btn.addEventListener('click', ()=>{
    policyViewMode = btn.dataset.mode;
    updatePolicyViewButtonStyles();
    renderPolicyTable();
  });
});

function initPolicySorting(){
  if(policySortInit) return;
  policySortInit = true;
  document.querySelectorAll('.policy-sortable[data-key]').forEach(th=>{
    th.addEventListener('click', ()=>{
      const key = th.dataset.key;
      if(policySortState.key === key){ policySortState.dir *= -1; } else { policySortState.key = key; policySortState.dir = 1; }
      updatePolicySortArrows();
      renderPolicyTable();
    });
  });
  updatePolicySortArrows();
}
function updatePolicySortArrows(){
  document.querySelectorAll('.policy-sort-caret').forEach(el=>{
    const isActive = el.dataset.arrow === policySortState.key;
    el.classList.toggle('active', isActive);
    el.textContent = isActive ? (policySortState.dir === 1 ? "▲" : "▼") : "▲";
  });
}
createMultiSelect('policyTypeFilter', ["Policy 1","Policy 2A","Not Required"], "All policy types", vals=>{ policyTypeTerm = vals; renderPolicyTable(); });
document.getElementById('policySearchInput').addEventListener('input', e=>{ policySearchTerm = e.target.value.trim().toLowerCase(); renderPolicyTable(); });
document.getElementById('policySearchClear').addEventListener('click', ()=>{
  document.getElementById('policySearchInput').value = "";
  policySearchTerm = "";
  renderPolicyTable();
});
createMultiSelect('policyStatusFilter', ["Requires Renewal","Eligible for Renewal","Active"], "All policy statuses", vals=>{ policyStatusTerm = vals; renderPolicyTable(); });
createMultiSelect('policyRenewalStatusFilter', ["Yet to Start","In Progress","Completed"], "All renewal statuses", vals=>{ policyRenewalStatusTerm = vals; renderPolicyTable(); });

function renderPolicyTable(){
  initPolicySorting();
  let rows = talents.filter(c=>{
    if(policyTypeTerm.length && !policyTypeTerm.includes(c.policyType)) return false;
    if(policyStatusTerm.length){
      if(c.policyType === "Not Required") return false;
      if(!policyStatusTerm.includes(contractStatusBucket(c.policyDaysLeft).label)) return false;
    }
    if(policyRenewalStatusTerm.length){
      if(c.policyType === "Not Required") return false;
      if(!policyRenewalStatusTerm.includes(renewalStatusDisplayLabel(c.policyRenewalStatus))) return false;
    }
    if(policySearchTerm && !c.name.toLowerCase().includes(policySearchTerm)) return false;
    if(policyViewMode==='pending'){
      if(c.policyType === "Not Required") return false;
      if(c.policyDaysLeft > 90) return false;
    }
    return true;
  });
  rows = sortRenewalRows(rows, policySortState);
  document.getElementById('policyResultCount').textContent = rows.length;
  document.getElementById('policyResultLabel').textContent = policyViewMode==='all' ? 'talents listed' : 'talents need insurance renewal';
  const tbody = document.getElementById('policyBody');
  const empty = document.getElementById('policyEmpty');
  if(rows.length===0){ tbody.innerHTML=""; empty.classList.remove('hidden'); return; }
  empty.classList.add('hidden');
  tbody.innerHTML = rows.map(c=>{
    const hasPolicy = c.policyType !== "Not Required";
    const bucket = hasPolicy ? contractStatusBucket(c.policyDaysLeft) : null;
    const needsRenewalCols = hasPolicy && bucket.label !== "Active";
    const stale = needsRenewalCols && isPolicyRenewalStale(c);
    return `
    <tr class="row-hover border-b border-[var(--border)] ${stale ? 'row-alert' : ''}">
      <td class="px-4 py-1 text-[var(--muted)] whitespace-nowrap">C${String(c.id).padStart(6,'0')}</td>
      <td class="px-4 py-1 font-medium whitespace-nowrap"><span class="renewal-talent-link cursor-pointer hover:underline hover:text-[var(--blue-dark)]" data-id="${c.id}" data-returnview="insurance">${c.name}</span></td>
      <td class="px-4 py-1 text-[var(--muted)] whitespace-nowrap"><span class="renewal-client-link cursor-pointer hover:underline hover:text-[var(--blue-dark)]" data-client="${c.client}">${c.client}</span></td>
      <td class="px-4 py-1 whitespace-nowrap">${c.policyType}</td>
      <td class="px-4 py-1 whitespace-nowrap">${hasPolicy ? fmtDate(c.policyIssueDate) : '—'}</td>
      <td class="px-4 py-1 whitespace-nowrap ${hasPolicy && c.policyDaysLeft<=30?'date-alert':''}">${hasPolicy ? fmtDate(c.policyExpiry) : '—'}</td>
      <td class="px-4 py-1 whitespace-nowrap ${hasPolicy && c.policyDaysLeft<=30?'date-alert':''}">${hasPolicy ? (c.policyDaysLeft<0?`${Math.abs(c.policyDaysLeft)}d overdue`:`${c.policyDaysLeft}d`) : '—'}</td>
      <td class="px-4 py-1 whitespace-nowrap">${hasPolicy ? `<span class="pill" style="${bucket.style}">${bucket.label}</span>` : '<span class="text-[var(--muted)]">—</span>'}</td>
      <td class="px-4 py-1 whitespace-nowrap">
        ${needsRenewalCols ? `<span class="pill" style="${renewalStatusPillStyleContract(c.policyRenewalStatus)}">${renewalStatusDisplayLabel(c.policyRenewalStatus)}</span>` : '<span class="text-[var(--muted)]">—</span>'}
      </td>
      <td class="px-4 py-1 text-[var(--muted)] max-w-[220px] truncate" title="${c.policyRemarks || ''}">${c.policyRemarks || '—'}</td>
      <td class="px-4 py-1 text-[var(--muted)] whitespace-nowrap">${c.caseOwner}</td>
      <td class="px-4 py-1 text-[var(--muted)] whitespace-nowrap">${c.entity}</td>
      <td class="px-4 py-1 whitespace-nowrap">
        ${hasPolicy ? `<button type="button" class="update-status-btn renewal-update-status-btn" data-id="${c.id}" data-type="insurance" title="${stale ? 'Date of Issue, Date of Expiry and Days Left to Expiry have not been updated since this renewal was marked Completed' : ''}">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
          Update Status
        </button>` : '<span class="text-[var(--muted)]">—</span>'}
      </td>
    </tr>`;
  }).join('');
  wireRenewalNameLinks(tbody);
  tbody.querySelectorAll('.renewal-update-status-btn').forEach(btn=>{
    btn.addEventListener('click', ()=> openRenewalUpdateModal(Number(btn.dataset.id), btn.dataset.type));
  });
}

/* ---------- RENEWAL CENTRE ---------- */
const renewalTabsList = [
  {id:'workpass', label:'Work Pass Renewals'},
  {id:'contract', label:'Contract Renewals'},
  {id:'sow', label:'SOW Renewals'},
  {id:'po', label:'PO Renewals'},
];
let activeRenewalTab = 'contract';

function renderRenewalTabBar(){
  const bar = document.getElementById('renewalTabBar');
  bar.innerHTML = renewalTabsList.map(t=>`
    <button type="button" class="profile-tab-btn px-4 py-3 text-sm font-medium ${activeRenewalTab===t.id?'active':''}" data-tab="${t.id}">${t.label}</button>
  `).join('');
  bar.querySelectorAll('.profile-tab-btn').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      activeRenewalTab = btn.dataset.tab;
      switchRenewalTab();
    });
  });
}
function switchRenewalTab(){
  document.querySelectorAll('.renewal-tab-panel').forEach(p=>p.classList.add('hidden'));
  document.getElementById('renewal-tab-'+activeRenewalTab).classList.remove('hidden');
  renderRenewalTabBar();
}

function renewalActionCell(sentFlag, onClickAttr){
  return sentFlag
    ? `<span class="pill" style="background:var(--green-bg);color:var(--green-text)">Notice Sent</span>`
    : `<button type="button" class="btn-primary rounded-md px-2.5 py-1 text-xs font-medium" ${onClickAttr}>Draft &amp; Send</button>`;
}

let renewalSortState = {
  contract: { key: 'contractDaysLeft', dir: 1 },
  workpass: { key: 'passDaysLeft', dir: 1 },
  sow: { key: 'client', dir: 1 },
  po: { key: 'month', dir: -1 },
};
let renewalSortInit = false;

/* Each Renewal Centre tab can show only records requiring renewal ("pending"), or every
   record ("all"), including ones already completed / active / received. */
let renewalViewMode = { contract: 'pending', workpass: 'pending', sow: 'pending', po: 'pending' };

/* Search + filter state for Contract Renewals and Work Pass Renewals tabs */
let renewalContractSearchTerm = "";
let renewalContractClientTerm = [];
let renewalContractStatusTerm = [];
let renewalContractRenewalStatusTerm = [];
let renewalWorkpassSearchTerm = "";
let renewalWorkpassTypeTerm = [];
let renewalWorkpassStatusTerm = [];
let renewalWorkpassRenewalStatusTerm = [];

createMultiSelect('renewalContractClientFilter', [...new Set(clients)].sort(), "All clients", vals=>{ renewalContractClientTerm = vals; renderRenewalContract(); });
document.getElementById('renewalContractSearchInput').addEventListener('input', e=>{ renewalContractSearchTerm = e.target.value.trim().toLowerCase(); renderRenewalContract(); });
document.getElementById('renewalContractSearchClear').addEventListener('click', ()=>{
  document.getElementById('renewalContractSearchInput').value = "";
  renewalContractSearchTerm = "";
  renderRenewalContract();
});
createMultiSelect('renewalContractStatusFilter', ["Requires Renewal","Eligible for Renewal","Active","Pending Start","Notice Period","Inactive"], "All contract statuses", vals=>{ renewalContractStatusTerm = vals; renderRenewalContract(); });
createMultiSelect('renewalContractRenewalStatusFilter', ["Yet to Start","In Progress","Completed"], "All renewal statuses", vals=>{ renewalContractRenewalStatusTerm = vals; renderRenewalContract(); });

createMultiSelect('renewalWorkpassTypeFilter', [...new Set(workPassTypes)].filter(t=>!["Singapore Citizen","PR"].includes(t)).sort(), "All work passes", vals=>{ renewalWorkpassTypeTerm = vals; renderRenewalWorkpass(); });
document.getElementById('renewalWorkpassSearchInput').addEventListener('input', e=>{ renewalWorkpassSearchTerm = e.target.value.trim().toLowerCase(); renderRenewalWorkpass(); });
document.getElementById('renewalWorkpassSearchClear').addEventListener('click', ()=>{
  document.getElementById('renewalWorkpassSearchInput').value = "";
  renewalWorkpassSearchTerm = "";
  renderRenewalWorkpass();
});
createMultiSelect('renewalWorkpassStatusFilter', ["Requires Renewal","Eligible for Renewal","Active","Pending Application","Inactive"], "All pass statuses", vals=>{ renewalWorkpassStatusTerm = vals; renderRenewalWorkpass(); });
createMultiSelect('renewalWorkpassRenewalStatusFilter', ["Yet to Start","In Progress","Completed"], "All renewal statuses", vals=>{ renewalWorkpassRenewalStatusTerm = vals; renderRenewalWorkpass(); });

/* Search + filter state for SOW Renewals and PO Renewals tabs */
let renewalSowSearchTerm = "";
let renewalSowStatusTerm = [];
let renewalPoSearchTerm = "";
let renewalPoStatusTerm = [];

document.getElementById('renewalSowSearchInput').addEventListener('input', e=>{ renewalSowSearchTerm = e.target.value.trim().toLowerCase(); renderRenewalSow(); });
document.getElementById('renewalSowSearchClear').addEventListener('click', ()=>{
  document.getElementById('renewalSowSearchInput').value = "";
  renewalSowSearchTerm = "";
  renderRenewalSow();
});
createMultiSelect('renewalSowStatusFilter', ["Yet to Draft","Drafted","Pending","Completed"], "All SOW statuses", vals=>{ renewalSowStatusTerm = vals; renderRenewalSow(); });

document.getElementById('renewalPoSearchInput').addEventListener('input', e=>{ renewalPoSearchTerm = e.target.value.trim().toLowerCase(); renderRenewalPo(); });
document.getElementById('renewalPoSearchClear').addEventListener('click', ()=>{
  document.getElementById('renewalPoSearchInput').value = "";
  renewalPoSearchTerm = "";
  renderRenewalPo();
});
createMultiSelect('renewalPoStatusFilter', ["Yet to Draft","Drafted","Pending","Completed"], "All PO statuses", vals=>{ renewalPoStatusTerm = vals; renderRenewalPo(); });

const renewalRenderByTable = {
  contract: ()=>renderRenewalContract(),
  workpass: ()=>renderRenewalWorkpass(),
  sow: ()=>renderRenewalSow(),
  po: ()=>renderRenewalPo(),
};
function updateRenewalViewButtonStyles(table){
  document.querySelectorAll(`.renewal-view-btn[data-table="${table}"]`).forEach(btn=>{
    const active = btn.dataset.mode === renewalViewMode[table];
    btn.classList.toggle('bg-white', active);
    btn.classList.toggle('shadow-sm', active);
    btn.classList.toggle('text-[var(--text)]', active);
    btn.classList.toggle('text-[var(--muted)]', !active);
  });
}
document.querySelectorAll('.renewal-view-btn').forEach(btn=>{
  const table = btn.dataset.table;
  updateRenewalViewButtonStyles(table);
  btn.addEventListener('click', ()=>{
    renewalViewMode[table] = btn.dataset.mode;
    updateRenewalViewButtonStyles(table);
    renewalRenderByTable[table]();
  });
});

function initRenewalSorting(){
  if(renewalSortInit) return;
  renewalSortInit = true;
  document.querySelectorAll('.renewal-sortable[data-key]').forEach(th=>{
    th.addEventListener('click', ()=>{
      const table = th.dataset.table;
      const key = th.dataset.key;
      const state = renewalSortState[table];
      if(state.key === key){ state.dir *= -1; } else { state.key = key; state.dir = 1; }
      updateRenewalSortArrows(table);
      renderRenewalTableByName(table);
    });
  });
  Object.keys(renewalSortState).forEach(updateRenewalSortArrows);
}
function updateRenewalSortArrows(table){
  document.querySelectorAll(`.renewal-sort-caret[data-table="${table}"]`).forEach(el=>{
    const state = renewalSortState[table];
    const isActive = el.dataset.arrow === state.key;
    el.classList.toggle('active', isActive);
    el.textContent = isActive ? (state.dir === 1 ? "▲" : "▼") : "▲";
  });
}
function renderRenewalTableByName(table){
  if(table==='contract') renderRenewalContract();
  if(table==='workpass') renderRenewalWorkpass();
  if(table==='sow') renderRenewalSow();
  if(table==='po') renderRenewalPo();
}
function sortRenewalRows(rows, state){
  rows.sort((a,b)=>{
    let av = a[state.key], bv = b[state.key];
    if(av instanceof Date){ av = av ? av.getTime() : -Infinity; bv = bv ? bv.getTime() : -Infinity; }
    if(typeof av === "string"){ av = av.toLowerCase(); bv = bv.toLowerCase(); }
    if(av < bv) return -1 * state.dir;
    if(av > bv) return 1 * state.dir;
    return 0;
  });
  return rows;
}
function wireRenewalNameLinks(container){
  container.querySelectorAll('.renewal-talent-link').forEach(el=>{
    el.addEventListener('click', ()=> openTalentProfile(Number(el.dataset.id), el.dataset.returnview));
  });
  container.querySelectorAll('.renewal-client-link').forEach(el=>{
    el.addEventListener('click', ()=> openClientViewModal(el.dataset.client));
  });
}

function renderRenewalContract(){
  const rows = sortRenewalRows(talents.filter(c=>{
    if(renewalViewMode.contract!=='all' && c.contractDaysLeft>90) return false;
    if(renewalContractClientTerm.length && !renewalContractClientTerm.includes(c.client)) return false;
    if(renewalContractStatusTerm.length && !renewalContractStatusTerm.includes(contractStatusDisplay(c).label)) return false;
    if(renewalContractRenewalStatusTerm.length && !renewalContractRenewalStatusTerm.includes(renewalStatusDisplayLabel(c.contractRenewalStatus))) return false;
    if(renewalContractSearchTerm && !c.name.toLowerCase().includes(renewalContractSearchTerm)) return false;
    return true;
  }), renewalSortState.contract);
  document.getElementById('renewalContractCount').textContent = rows.length;
  document.getElementById('renewalContractCountLabel').textContent = renewalViewMode.contract==='all' ? 'talents shown' : 'talents need contract renewal';
  const tbody = document.getElementById('renewalContractBody');
  const empty = document.getElementById('renewalContractEmpty');
  if(rows.length===0){ tbody.innerHTML=""; empty.classList.remove('hidden'); return; }
  empty.classList.add('hidden');
  tbody.innerHTML = rows.map(c=>{
    const bucket = contractStatusDisplay(c);
    const needsRenewalCols = bucket.label === "Requires Renewal" || bucket.label === "Eligible for Renewal";
    const stale = needsRenewalCols && isContractRenewalStale(c);
    return `
    <tr class="row-hover border-b border-[var(--border)] ${stale ? 'row-alert' : ''}">
      <td class="px-4 py-1 text-[var(--muted)] whitespace-nowrap">C${String(c.id).padStart(6,'0')}</td>
      <td class="px-4 py-1 font-medium whitespace-nowrap"><span class="renewal-talent-link cursor-pointer hover:underline hover:text-[var(--blue-dark)]" data-id="${c.id}" data-returnview="contracts">${c.name}</span></td>
      <td class="px-4 py-1 text-[var(--muted)] whitespace-nowrap"><span class="renewal-client-link cursor-pointer hover:underline hover:text-[var(--blue-dark)]" data-client="${c.client}">${c.client}</span></td>
      <td class="px-4 py-1 whitespace-nowrap">${fmtDate(c.contractStart)}</td>
      <td class="px-4 py-1 whitespace-nowrap ${c.contractDaysLeft<=30?'date-alert':''}">${fmtDate(c.contractEnd)}</td>
      <td class="px-4 py-1 whitespace-nowrap ${c.contractDaysLeft<=30?'date-alert':''}">${c.contractDaysLeft<0?`${Math.abs(c.contractDaysLeft)}d overdue`:`${c.contractDaysLeft}d`}</td>
      <td class="px-4 py-1 whitespace-nowrap"><span class="pill" style="${bucket.style}">${bucket.label}</span></td>
      <td class="px-4 py-1 whitespace-nowrap">
        ${needsRenewalCols ? `<span class="pill" style="${renewalStatusPillStyleContract(c.contractRenewalStatus)}">${renewalStatusDisplayLabel(c.contractRenewalStatus)}</span>` : '<span class="text-[var(--muted)]">—</span>'}
      </td>
      <td class="px-4 py-1 text-[var(--muted)] max-w-[220px] truncate" title="${c.renewalRemarks || ''}">${c.renewalRemarks || '—'}</td>
      <td class="px-4 py-1 text-[var(--muted)] whitespace-nowrap">${c.caseOwner}</td>
      <td class="px-4 py-1 text-[var(--muted)] whitespace-nowrap">${c.entity}</td>
      <td class="px-4 py-1 whitespace-nowrap">
        <button type="button" class="update-status-btn renewal-update-status-btn" data-id="${c.id}" data-type="contract" title="${stale ? 'Date of Commencement, Date of Expiry and Days Left to Expiry have not been updated since this renewal was marked Completed' : ''}">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
          Update Status
        </button>
      </td>
    </tr>`;
  }).join('');
  wireRenewalNameLinks(tbody);
  tbody.querySelectorAll('.renewal-update-status-btn').forEach(btn=>{
    btn.addEventListener('click', ()=> openRenewalUpdateModal(Number(btn.dataset.id), btn.dataset.type));
  });
}

/* ---------- Renewal Centre: Update Status Modal (Contract, Work Pass, Insurance, SOW, PO) ---------- */
const renewalUpdateModalOverlay = document.getElementById('renewalUpdateModalOverlay');
const renewalUpdateModal = document.getElementById('renewalUpdateModal');
let editingRenewalUpdateId = null;
let editingRenewalUpdateType = null;
const renewalStatusOptionPairs = [
  { value: "Not Started", label: "Yet to Start" },
  { value: "In Progress", label: "In Progress" },
  { value: "Completed", label: "Completed" },
];
const sowPoStatusOptionPairs = [
  { value: "Yet to Draft", label: "Yet to Draft" },
  { value: "Drafted", label: "Drafted" },
  { value: "Pending", label: "Pending" },
  { value: "Completed", label: "Completed" },
];

function openRenewalUpdateModal(id, type){
  const isSow = type === 'sow';
  const isPo = type === 'po';

  if(isSow || isPo){
    const r = isSow ? sowRecords[id] : poRecords[id];
    if(!r) return;
    editingRenewalUpdateId = id;
    editingRenewalUpdateType = type;
    document.getElementById('renewalUpdateModalSub').textContent = isSow ? `${r.client} – ${r.project}` : `${r.client} · ${monthLabelFull(r.month)}`;
    document.getElementById('ru_startLabel').textContent = "Date of Commencement";
    document.getElementById('ru_startDate').value = toISO(r.dateOfCommencement);
    document.getElementById('ru_endDate').value = toISO(r.dateOfCompletion);
    const statusValue = isSow ? r.sowStatus : r.poStatus;
    const sel = document.getElementById('ru_renewalStatus');
    sel.innerHTML = sowPoStatusOptionPairs.map(p=>`<option value="${p.value}" ${p.value===statusValue?'selected':''}>${p.label}</option>`).join('');
    document.getElementById('ru_remarks').value = r.remarks || '';
    renewalUpdateModalOverlay.classList.add('open');
    renewalUpdateModal.classList.add('open');
    return;
  }

  const c = talents.find(x=>x.id === id);
  if(!c) return;
  editingRenewalUpdateId = id;
  editingRenewalUpdateType = type;
  document.getElementById('renewalUpdateModalSub').textContent = `${c.name} · ${c.client}`;

  const isWorkpass = type === 'workpass';
  const isInsurance = type === 'insurance';
  document.getElementById('ru_startLabel').textContent = isWorkpass ? "Date of Issue" : (isInsurance ? "Date of Issue" : "Date of Commencement");
  document.getElementById('ru_startDate').value = toISO(isInsurance ? c.policyIssueDate : (isWorkpass ? c.passIssueDate : c.contractStart));
  document.getElementById('ru_endDate').value = toISO(isInsurance ? c.policyExpiry : (isWorkpass ? c.passExpiry : c.contractEnd));
  const statusValue = isInsurance ? c.policyRenewalStatus : (isWorkpass ? c.renewalStatus : c.contractRenewalStatus);
  const sel = document.getElementById('ru_renewalStatus');
  sel.innerHTML = renewalStatusOptionPairs.map(p=>`<option value="${p.value}" ${p.value===statusValue?'selected':''}>${p.label}</option>`).join('');
  document.getElementById('ru_remarks').value = (isInsurance ? c.policyRemarks : (isWorkpass ? c.passRenewalRemarks : c.renewalRemarks)) || '';

  renewalUpdateModalOverlay.classList.add('open');
  renewalUpdateModal.classList.add('open');
}
function closeRenewalUpdateModalFn(){
  renewalUpdateModalOverlay.classList.remove('open');
  renewalUpdateModal.classList.remove('open');
  editingRenewalUpdateId = null;
  editingRenewalUpdateType = null;
}
document.getElementById('closeRenewalUpdateModal').addEventListener('click', closeRenewalUpdateModalFn);
document.getElementById('cancelRenewalUpdateModal').addEventListener('click', closeRenewalUpdateModalFn);
renewalUpdateModalOverlay.addEventListener('click', ()=>{
  if(renewalUpdateModalOverlay.classList.contains('open')) closeRenewalUpdateModalFn();
});

document.getElementById('renewalUpdateForm').addEventListener('submit', e=>{
  e.preventDefault();
  const isSow = editingRenewalUpdateType === 'sow';
  const isPo = editingRenewalUpdateType === 'po';
  const newStart = new Date(document.getElementById('ru_startDate').value);
  const newEnd = new Date(document.getElementById('ru_endDate').value);
  const newStatus = document.getElementById('ru_renewalStatus').value;

  if(isSow || isPo){
    const r = isSow ? sowRecords[editingRenewalUpdateId] : poRecords[editingRenewalUpdateId];
    if(!r) return;
    const statusKey = isSow ? 'sowStatus' : 'poStatus';
    const completedSeqKey = isSow ? 'sowRenewalCompletedSeq' : 'poRenewalCompletedSeq';
    const datesSeqKey = isSow ? 'sowDatesUpdatedSeq' : 'poDatesUpdatedSeq';
    const oldStatus = r[statusKey];
    const datesChanged = (r.dateOfCommencement ? r.dateOfCommencement.getTime() : NaN) !== newStart.getTime() || (r.dateOfCompletion ? r.dateOfCompletion.getTime() : NaN) !== newEnd.getTime();
    r.dateOfCommencement = newStart;
    r.dateOfCompletion = newEnd;
    r.validTo = newEnd; // keep SOW/PO Tracking page's legacy field in sync
    r.poReceivedDate = newEnd;
    if(newStatus === "Completed" && oldStatus !== "Completed"){
      r[completedSeqKey] = ++renewalActionSeq;
    }
    r[statusKey] = newStatus;
    if(datesChanged){
      r[datesSeqKey] = ++renewalActionSeq;
    }
    r.remarks = document.getElementById('ru_remarks').value.trim();
    closeRenewalUpdateModalFn();
    if(isSow){ renderRenewalSow(); renderSowTable(); } else { renderRenewalPo(); renderPoTable(); }
    showToast(`${r.client}${isSow ? ' – '+r.project : ''}'s status updated`, checkIcon);
    return;
  }

  const c = talents.find(x=>x.id === editingRenewalUpdateId);
  if(!c) return;
  const isWorkpass = editingRenewalUpdateType === 'workpass';
  const isInsurance = editingRenewalUpdateType === 'insurance';
  const newRenewalStatus = newStatus;

  if(isInsurance){
    const oldRenewalStatus = c.policyRenewalStatus;
    const datesChanged = (c.policyIssueDate ? c.policyIssueDate.getTime() : NaN) !== newStart.getTime() || (c.policyExpiry ? c.policyExpiry.getTime() : NaN) !== newEnd.getTime();
    c.policyIssueDate = newStart;
    c.policyExpiry = newEnd;
    if(newRenewalStatus === "Completed" && oldRenewalStatus !== "Completed"){
      c.policyRenewalCompletedSeq = ++renewalActionSeq;
    }
    c.policyRenewalStatus = newRenewalStatus;
    if(datesChanged){
      c.policyDatesUpdatedSeq = ++renewalActionSeq;
    }
    c.policyRenewalRequired = c.policyExpiry <= addDays(today, 90) ? "Yes" : "No";
    c.policyRemarks = document.getElementById('ru_remarks').value.trim();
  } else if(isWorkpass){
    const oldRenewalStatus = c.renewalStatus;
    const datesChanged = c.passIssueDate.getTime() !== newStart.getTime() || c.passExpiry.getTime() !== newEnd.getTime();
    c.passIssueDate = newStart;
    c.passExpiry = newEnd;
    // Mark "just completed" before recording the dates change, so dates edited in the same
    // save as marking the renewal Completed count as already reflecting it (no stale alert).
    if(newRenewalStatus === "Completed" && oldRenewalStatus !== "Completed"){
      c.passRenewalCompletedSeq = ++renewalActionSeq;
    }
    c.renewalStatus = newRenewalStatus;
    if(datesChanged){
      c.passDatesUpdatedSeq = ++renewalActionSeq;
    }
    if(c.passStatus === "Expired" && c.passExpiry > today) c.passStatus = "Issued";
    c.renewalRequired = c.passExpiry <= addDays(today, 90) ? "Yes" : "No";
    c.passRenewalRemarks = document.getElementById('ru_remarks').value.trim();
  } else {
    const oldRenewalStatus = c.contractRenewalStatus;
    const datesChanged = c.contractStart.getTime() !== newStart.getTime() || c.contractEnd.getTime() !== newEnd.getTime();
    c.contractStart = newStart;
    c.contractEnd = newEnd;
    if(newRenewalStatus === "Completed" && oldRenewalStatus !== "Completed"){
      c.renewalCompletedSeq = ++renewalActionSeq;
    }
    c.contractRenewalStatus = newRenewalStatus;
    if(datesChanged){
      c.datesUpdatedSeq = ++renewalActionSeq;
    }
    if(c.contractStatus === "Expired" || c.contractStatus === "Terminated"){
      if(c.contractEnd > today) c.contractStatus = "Signed";
    }
    c.contractRenewalRequired = c.contractEnd <= addDays(today, 90) ? "Yes" : "No";
    c.renewalRemarks = document.getElementById('ru_remarks').value.trim();
  }

  computeDerived(c);
  closeRenewalUpdateModalFn();
  if(isInsurance){ renderPolicyTable(); }
  else if(isWorkpass){ renderRenewalWorkpass(); renderWorkPass(); }
  else { renderRenewalContract(); renderContracts(); }
  renderStats();
  refreshProfileIfOpen(c);
  showToast(`${c.name}'s renewal details updated`, checkIcon);
});

/* ---------- Manage Talents Modal (SOW & PO Renewals: view/edit the talents tied to a record) ---------- */
const manageTalentsModalOverlay = document.getElementById('manageTalentsModalOverlay');
const manageTalentsModal = document.getElementById('manageTalentsModal');
let managingTalentsType = null;
let managingTalentsIndex = null;
let managingTalentsPickerMode = null; // 'add' | 'remove' | null

function getManageTalentsRecord(){
  return managingTalentsType === 'sow' ? sowRecords[managingTalentsIndex] : poRecords[managingTalentsIndex];
}
function getManageTalentsPool(){
  const r = getManageTalentsRecord();
  if(!r) return [];
  return managingTalentsType === 'sow'
    ? talents.filter(t=>t.client===r.client && t.projectType===r.project)
    : talents.filter(t=>t.client===r.client);
}

function openManageTalentsModal(type, index){
  managingTalentsType = type;
  managingTalentsIndex = index;
  managingTalentsPickerMode = null;
  const r = getManageTalentsRecord();
  if(!r) return;
  document.getElementById('manageTalentsModalSub').textContent = type === 'sow' ? `${r.client} – ${r.project}` : `${r.client} · ${monthLabelFull(r.month)}`;
  renderManageTalentsModalContent();
  manageTalentsModalOverlay.classList.add('open');
  manageTalentsModal.classList.add('open');
}
function closeManageTalentsModalFn(){
  manageTalentsModalOverlay.classList.remove('open');
  manageTalentsModal.classList.remove('open');
  managingTalentsType = null;
  managingTalentsIndex = null;
  managingTalentsPickerMode = null;
}
document.getElementById('closeManageTalentsModal').addEventListener('click', closeManageTalentsModalFn);
document.getElementById('closeManageTalentsModalBtn').addEventListener('click', closeManageTalentsModalFn);
manageTalentsModalOverlay.addEventListener('click', ()=>{
  if(manageTalentsModalOverlay.classList.contains('open')) closeManageTalentsModalFn();
});

function renderManageTalentsModalContent(){
  const r = getManageTalentsRecord();
  if(!r) return;
  const assigned = (r.talentIds||[]).map(id=>talents.find(t=>t.id===id)).filter(Boolean);

  const listEl = document.getElementById('manageTalentsList');
  listEl.innerHTML = assigned.length ? assigned.map(t=>`
    <div class="flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#FAFBFC] border border-[var(--border)]">
      <span class="manage-talent-name-link text-sm font-medium text-[var(--blue)] hover:text-[var(--blue-dark)] hover:underline cursor-pointer" data-id="${t.id}">${t.name}</span>
    </div>`).join('') : `<div class="text-sm text-[var(--muted)] text-center py-3">No talents assigned yet.</div>`;

  listEl.querySelectorAll('.manage-talent-name-link').forEach(el=>{
    el.addEventListener('click', ()=>{
      const id = Number(el.dataset.id);
      closeManageTalentsModalFn();
      openTalentProfile(id, 'renewals');
    });
  });

  const pickerWrap = document.getElementById('manageTalentsPickerWrap');
  const pickerLabel = document.getElementById('manageTalentsPickerLabel');
  const pickerSelect = document.getElementById('manageTalentsPickerSelect');
  const removeBtn = document.getElementById('manageTalentsRemoveBtn');
  const addBtn = document.getElementById('manageTalentsAddBtn');

  if(managingTalentsPickerMode === 'add'){
    const pool = getManageTalentsPool().filter(t=>!(r.talentIds||[]).includes(t.id));
    pickerLabel.textContent = "Add a talent";
    pickerSelect.innerHTML = pool.length
      ? pool.map(t=>`<option value="${t.id}">${t.name}</option>`).join('')
      : `<option value="">No more matching talents</option>`;
    pickerWrap.classList.remove('hidden');
  } else if(managingTalentsPickerMode === 'remove'){
    pickerLabel.textContent = "Remove a talent";
    pickerSelect.innerHTML = assigned.length
      ? assigned.map(t=>`<option value="${t.id}">${t.name}</option>`).join('')
      : `<option value="">No talents assigned</option>`;
    pickerWrap.classList.remove('hidden');
  } else {
    pickerWrap.classList.add('hidden');
  }

  removeBtn.disabled = assigned.length === 0 && managingTalentsPickerMode !== 'remove';
  removeBtn.style.opacity = removeBtn.disabled ? 0.5 : 1;
}

document.getElementById('manageTalentsAddBtn').addEventListener('click', ()=>{
  managingTalentsPickerMode = managingTalentsPickerMode === 'add' ? null : 'add';
  renderManageTalentsModalContent();
});
document.getElementById('manageTalentsRemoveBtn').addEventListener('click', ()=>{
  managingTalentsPickerMode = managingTalentsPickerMode === 'remove' ? null : 'remove';
  renderManageTalentsModalContent();
});
document.getElementById('manageTalentsPickerCancelBtn').addEventListener('click', ()=>{
  managingTalentsPickerMode = null;
  renderManageTalentsModalContent();
});
document.getElementById('manageTalentsPickerConfirmBtn').addEventListener('click', ()=>{
  const r = getManageTalentsRecord();
  if(!r) return;
  const id = Number(document.getElementById('manageTalentsPickerSelect').value);
  if(!id) return;
  if(managingTalentsPickerMode === 'add'){
    r.talentIds = [...(r.talentIds||[]), id];
  } else if(managingTalentsPickerMode === 'remove'){
    r.talentIds = (r.talentIds||[]).filter(tid=>tid!==id);
  }
  managingTalentsPickerMode = null;
  renderManageTalentsModalContent();
  if(managingTalentsType==='sow') renderRenewalSow(); else renderRenewalPo();
});

function renderRenewalWorkpass(){
  const rows = sortRenewalRows(talents.filter(c=>{
    if(["Singapore Citizen","PR"].includes(c.workPassType)) return false;
    if(renewalViewMode.workpass!=='all' && c.passDaysLeft>90) return false;
    if(renewalWorkpassTypeTerm.length && !renewalWorkpassTypeTerm.includes(c.workPassType)) return false;
    if(renewalWorkpassStatusTerm.length && !renewalWorkpassStatusTerm.includes(passStatusDisplay(c).label)) return false;
    if(renewalWorkpassRenewalStatusTerm.length && !renewalWorkpassRenewalStatusTerm.includes(renewalStatusDisplayLabel(c.renewalStatus))) return false;
    if(renewalWorkpassSearchTerm && !(c.name.toLowerCase().includes(renewalWorkpassSearchTerm) || c.nric.toLowerCase().includes(renewalWorkpassSearchTerm))) return false;
    return true;
  }), renewalSortState.workpass);
  document.getElementById('renewalWorkpassCount').textContent = rows.length;
  document.getElementById('renewalWorkpassCountLabel').textContent = renewalViewMode.workpass==='all' ? 'talents shown' : 'talents need work pass renewal';
  const tbody = document.getElementById('renewalWorkpassBody');
  const empty = document.getElementById('renewalWorkpassEmpty');
  if(rows.length===0){ tbody.innerHTML=""; empty.classList.remove('hidden'); return; }
  empty.classList.add('hidden');
  tbody.innerHTML = rows.map(c=>{
    const bucket = passStatusDisplay(c);
    const needsRenewalCols = bucket.label === "Requires Renewal" || bucket.label === "Eligible for Renewal";
    const stale = needsRenewalCols && isPassRenewalStale(c);
    return `
    <tr class="row-hover border-b border-[var(--border)] ${stale ? 'row-alert' : ''}">
      <td class="px-4 py-1 text-[var(--muted)] whitespace-nowrap">C${String(c.id).padStart(6,'0')}</td>
      <td class="px-4 py-1 font-medium whitespace-nowrap"><span class="renewal-talent-link cursor-pointer hover:underline hover:text-[var(--blue-dark)]" data-id="${c.id}" data-returnview="workpass">${c.name}</span></td>
      <td class="px-4 py-1 text-[var(--muted)] whitespace-nowrap">${c.nric}</td>
      <td class="px-4 py-1 text-[var(--muted)] whitespace-nowrap"><span class="renewal-client-link cursor-pointer hover:underline hover:text-[var(--blue-dark)]" data-client="${c.client}">${c.client}</span></td>
      <td class="px-4 py-1 whitespace-nowrap">${c.workPassType}</td>
      <td class="px-4 py-1 whitespace-nowrap">${fmtDate(c.passIssueDate)}</td>
      <td class="px-4 py-1 whitespace-nowrap ${c.passDaysLeft<=30?'date-alert':''}">${fmtDate(c.passExpiry)}</td>
      <td class="px-4 py-1 whitespace-nowrap ${c.passDaysLeft<=30?'date-alert':''}">${c.passDaysLeft<0?`${Math.abs(c.passDaysLeft)}d overdue`:`${c.passDaysLeft}d`}</td>
      <td class="px-4 py-1 whitespace-nowrap"><span class="pill" style="${bucket.style}">${bucket.label}</span></td>
      <td class="px-4 py-1 whitespace-nowrap">
        ${needsRenewalCols ? `<span class="pill" style="${renewalStatusPillStyleContract(c.renewalStatus)}">${renewalStatusDisplayLabel(c.renewalStatus)}</span>` : '<span class="text-[var(--muted)]">—</span>'}
      </td>
      <td class="px-4 py-1 text-[var(--muted)] max-w-[220px] truncate" title="${c.passRenewalRemarks || ''}">${c.passRenewalRemarks || '—'}</td>
      <td class="px-4 py-1 text-[var(--muted)] whitespace-nowrap">${c.caseOwner}</td>
      <td class="px-4 py-1 text-[var(--muted)] whitespace-nowrap">${c.entity}</td>
      <td class="px-4 py-1 whitespace-nowrap">
        <button type="button" class="update-status-btn renewal-update-status-btn" data-id="${c.id}" data-type="workpass" title="${stale ? 'Date of Issue, Date of Expiry and Days Left to Expiry have not been updated since this renewal was marked Completed' : ''}">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
          Update Status
        </button>
      </td>
    </tr>`;
  }).join('');
  wireRenewalNameLinks(tbody);
  tbody.querySelectorAll('.renewal-update-status-btn').forEach(btn=>{
    btn.addEventListener('click', ()=> openRenewalUpdateModal(Number(btn.dataset.id), btn.dataset.type));
  });
}

function renderRenewalSow(){
  const rows = sortRenewalRows(sowRecords.filter(r=>{
    if(r.sowRequired!=="Yes") return false;
    if(renewalViewMode.sow!=='all' && r.sowStatus==="Completed") return false;
    if(renewalSowStatusTerm.length && !renewalSowStatusTerm.includes(r.sowStatus)) return false;
    if(renewalSowSearchTerm && !(r.client.toLowerCase().includes(renewalSowSearchTerm) || r.project.toLowerCase().includes(renewalSowSearchTerm))) return false;
    return true;
  }), renewalSortState.sow);
  document.getElementById('renewalSowCount').textContent = rows.length;
  document.getElementById('renewalSowCountLabel').textContent = renewalViewMode.sow==='all' ? 'clients shown' : 'SOWs need renewal';
  const tbody = document.getElementById('renewalSowBody');
  const empty = document.getElementById('renewalSowEmpty');
  if(rows.length===0){ tbody.innerHTML=""; empty.classList.remove('hidden'); return; }
  empty.classList.add('hidden');
  tbody.innerHTML = rows.map(r=>{
    const index = sowRecords.indexOf(r);
    const hasDates = r.sowStatus !== "N/A";
    const stale = hasDates && isSowRenewalStale(r);
    return `
    <tr class="row-hover border-b border-[var(--border)] ${stale ? 'row-alert' : ''}">
      <td class="px-4 py-1 font-medium whitespace-nowrap"><span class="renewal-client-link cursor-pointer hover:underline hover:text-[var(--blue-dark)]" data-client="${r.client}">${r.client}</span> – ${r.project}</td>
      <td class="px-4 py-1 whitespace-nowrap"><span class="pill" style="${statusPillStyle(r.sowRequired)}">${r.sowRequired}</span></td>
      <td class="px-4 py-1 whitespace-nowrap">
        <button type="button" class="manage-talents-btn text-sm font-medium text-[var(--blue)] hover:text-[var(--blue-dark)] hover:underline" data-record-type="sow" data-index="${index}">${(r.talentIds||[]).length}</button>
      </td>
      <td class="px-4 py-1 whitespace-nowrap">${hasDates ? fmtDate(r.dateOfCommencement) : '—'}</td>
      <td class="px-4 py-1 whitespace-nowrap">${hasDates ? fmtDate(r.dateOfCompletion) : '—'}</td>
      <td class="px-4 py-1 whitespace-nowrap"><span class="pill" style="${sowPoStatusPillStyle(r.sowStatus)}">${r.sowStatus}</span></td>
      <td class="px-4 py-1 text-[var(--muted)] max-w-[220px] truncate" title="${r.remarks || ''}">${r.remarks || '—'}</td>
      <td class="px-4 py-1 whitespace-nowrap">
        ${hasDates ? `<button type="button" class="update-status-btn renewal-update-status-btn" data-id="${index}" data-type="sow" title="${stale ? 'Date of Commencement and Date of Completion have not been updated since this was marked Completed' : ''}">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
          Update Status
        </button>` : '<span class="text-[var(--muted)]">—</span>'}
      </td>
    </tr>`;
  }).join('');
  wireRenewalNameLinks(tbody);
  tbody.querySelectorAll('.renewal-update-status-btn').forEach(btn=>{
    btn.addEventListener('click', ()=> openRenewalUpdateModal(Number(btn.dataset.id), btn.dataset.type));
  });
  tbody.querySelectorAll('.manage-talents-btn').forEach(btn=>{
    btn.addEventListener('click', ()=> openManageTalentsModal(btn.dataset.recordType, Number(btn.dataset.index)));
  });
}

function renderRenewalPo(){
  const rows = sortRenewalRows(poRecords.filter(r=>{
    if(r.poRequired!=="Yes") return false;
    if(renewalViewMode.po!=='all' && r.poStatus==="Completed") return false;
    if(renewalPoStatusTerm.length && !renewalPoStatusTerm.includes(r.poStatus)) return false;
    if(renewalPoSearchTerm && !r.client.toLowerCase().includes(renewalPoSearchTerm)) return false;
    return true;
  }), renewalSortState.po);
  document.getElementById('renewalPoCount').textContent = rows.length;
  document.getElementById('renewalPoCountLabel').textContent = renewalViewMode.po==='all' ? 'clients shown' : 'POs need follow-up';
  const tbody = document.getElementById('renewalPoBody');
  const empty = document.getElementById('renewalPoEmpty');
  if(rows.length===0){ tbody.innerHTML=""; empty.classList.remove('hidden'); return; }
  empty.classList.add('hidden');
  tbody.innerHTML = rows.map(r=>{
    const index = poRecords.indexOf(r);
    const hasDates = r.poStatus !== "N/A";
    const stale = hasDates && isPoRenewalStale(r);
    return `
    <tr class="row-hover border-b border-[var(--border)] ${stale ? 'row-alert' : ''}">
      <td class="px-4 py-1 font-medium whitespace-nowrap"><span class="renewal-client-link cursor-pointer hover:underline hover:text-[var(--blue-dark)]" data-client="${r.client}">${r.client}</span></td>
      <td class="px-4 py-1 whitespace-nowrap">${monthLabelFull(r.month)}</td>
      <td class="px-4 py-1 whitespace-nowrap"><span class="pill" style="${statusPillStyle(r.poRequired)}">${r.poRequired}</span></td>
      <td class="px-4 py-1 whitespace-nowrap">
        <button type="button" class="manage-talents-btn text-sm font-medium text-[var(--blue)] hover:text-[var(--blue-dark)] hover:underline" data-record-type="po" data-index="${index}">${(r.talentIds||[]).length}</button>
      </td>
      <td class="px-4 py-1 whitespace-nowrap">${hasDates ? fmtDate(r.dateOfCommencement) : '—'}</td>
      <td class="px-4 py-1 whitespace-nowrap">${hasDates ? fmtDate(r.dateOfCompletion) : '—'}</td>
      <td class="px-4 py-1 whitespace-nowrap"><span class="pill" style="${sowPoStatusPillStyle(r.poStatus)}">${r.poStatus}</span></td>
      <td class="px-4 py-1 text-[var(--muted)] max-w-[220px] truncate" title="${r.remarks || ''}">${r.remarks || '—'}</td>
      <td class="px-4 py-1 whitespace-nowrap">
        ${hasDates ? `<button type="button" class="update-status-btn renewal-update-status-btn" data-id="${index}" data-type="po" title="${stale ? 'Date of Commencement and Date of Completion have not been updated since this was marked Completed' : ''}">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
          Update Status
        </button>` : '<span class="text-[var(--muted)]">—</span>'}
      </td>
    </tr>`;
  }).join('');
  wireRenewalNameLinks(tbody);
  tbody.querySelectorAll('.renewal-update-status-btn').forEach(btn=>{
    btn.addEventListener('click', ()=> openRenewalUpdateModal(Number(btn.dataset.id), btn.dataset.type));
  });
  tbody.querySelectorAll('.manage-talents-btn').forEach(btn=>{
    btn.addEventListener('click', ()=> openManageTalentsModal(btn.dataset.recordType, Number(btn.dataset.index)));
  });
}

function wireRenewalSendButtons(container){
  container.querySelectorAll('.renewal-send-btn').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const type = btn.dataset.type;
      if(type==='sow') openRenewalNoticeModal(type, sowRecords[Number(btn.dataset.index)]);
      else if(type==='po') openRenewalNoticeModal(type, poRecords[Number(btn.dataset.index)]);
      else openRenewalNoticeModal(type, Number(btn.dataset.id));
    });
  });
}

function renderRenewalCentre(){
  renderRenewalTabBar();
  document.querySelectorAll('.renewal-tab-panel').forEach(p=>p.classList.add('hidden'));
  document.getElementById('renewal-tab-'+activeRenewalTab).classList.remove('hidden');
  initRenewalSorting();
  renderRenewalContract();
  renderRenewalWorkpass();
  renderRenewalSow();
  renderRenewalPo();
}

/* ---------- Draft & Send Renewal Notice Modal ---------- */
const renewalNoticeModalOverlay = document.getElementById('renewalNoticeModalOverlay');
const renewalNoticeModal = document.getElementById('renewalNoticeModal');
let renewalNoticeContext = null;

function openRenewalNoticeModal(type, ref){
  renewalNoticeContext = { type, ref };
  let toLine, subject, body;

  if(type === 'contract'){
    const c = talents.find(x=>x.id===ref);
    toLine = `${c.name} <${c.email}>`;
    subject = `Contract Renewal Notice – ${c.name}`;
    body = `Dear ${c.name},\n\nYour current contract with ${c.client} is set to end on ${fmtDate(c.contractEnd)}. Please let us know if you would like to proceed with renewal so we can prepare the necessary documentation.\n\nBest regards,\nTalent Management Team`;
  } else if(type === 'workpass'){
    const c = talents.find(x=>x.id===ref);
    toLine = `${c.name} <${c.email}>`;
    subject = `Work Pass Renewal Notice – ${c.name}`;
    body = `Dear ${c.name},\n\nYour ${c.workPassType} is set to expire on ${fmtDate(c.passExpiry)}. Please provide the required documents so we can begin the renewal process as soon as possible.\n\nBest regards,\nTalent Management Team`;
  } else if(type === 'insurance'){
    const c = talents.find(x=>x.id===ref);
    toLine = `${c.name} <${c.email}>`;
    subject = `Medical Insurance Renewal – ${c.name}`;
    body = `Dear ${c.name},\n\nOur records show your medical insurance coverage has expired. Please contact HR to renew your coverage at your earliest convenience.\n\nBest regards,\nTalent Management Team`;
  } else if(type === 'sow'){
    const r = ref;
    const contactEmail = clientProfiles[r.client] ? clientProfiles[r.client].contactEmail : '-';
    toLine = `${r.client} <${contactEmail}>`;
    subject = `SOW Renewal Required – ${r.client} (${r.project})`;
    body = `Dear ${r.client} team,\n\nThe Statement of Work for ${r.project} currently shows status "${r.sowStatus}" and requires your attention. Kindly review and confirm at your earliest convenience so we can proceed.\n\nBest regards,\nAccount Management Team`;
  } else if(type === 'po'){
    const r = ref;
    const contactEmail = clientProfiles[r.client] ? clientProfiles[r.client].contactEmail : '-';
    toLine = `${r.client} <${contactEmail}>`;
    subject = `Purchase Order Follow-up – ${r.client} (${monthLabelFull(r.month)})`;
    body = `Dear ${r.client} team,\n\nWe have yet to receive the Purchase Order for ${monthLabelFull(r.month)} (current status: "${r.poStatus}"). Kindly arrange for this to be issued at your earliest convenience.\n\nBest regards,\nAccount Management Team`;
  }

  document.getElementById('renewalNoticeTo').value = toLine;
  document.getElementById('renewalNoticeSubject').value = subject;
  document.getElementById('renewalNoticeBody').value = body;
  renewalNoticeModalOverlay.classList.add('open');
  renewalNoticeModal.classList.add('open');
}
function closeRenewalNoticeModalFn(){
  renewalNoticeModalOverlay.classList.remove('open');
  renewalNoticeModal.classList.remove('open');
  renewalNoticeContext = null;
}
document.getElementById('closeRenewalNoticeModal').addEventListener('click', closeRenewalNoticeModalFn);
document.getElementById('cancelRenewalNoticeModal').addEventListener('click', closeRenewalNoticeModalFn);
renewalNoticeModalOverlay.addEventListener('click', closeRenewalNoticeModalFn);

document.getElementById('renewalNoticeForm').addEventListener('submit', e=>{
  e.preventDefault();
  if(!renewalNoticeContext) return;
  const { type, ref } = renewalNoticeContext;
  const toLine = document.getElementById('renewalNoticeTo').value;

  if(type === 'contract'){
    const c = talents.find(x=>x.id===ref);
    c.contractNoticeSent = true;
    if(c.contractRenewalStatus === "Not Started") c.contractRenewalStatus = "In Progress";
    c.contractRenewalRequired = "Yes";
    refreshProfileIfOpen(c);
  } else if(type === 'workpass'){
    const c = talents.find(x=>x.id===ref);
    c.workPassNoticeSent = true;
    if(c.renewalStatus === "Not Started") c.renewalStatus = "In Progress";
    c.renewalRequired = "Yes";
    refreshProfileIfOpen(c);
  } else if(type === 'insurance'){
    const c = talents.find(x=>x.id===ref);
    c.insuranceNoticeSent = true;
    refreshProfileIfOpen(c);
  } else if(type === 'sow'){
    ref.noticeSent = true;
  } else if(type === 'po'){
    ref.noticeSent = true;
  }

  closeRenewalNoticeModalFn();
  renderRenewalCentre();
  showToast(`Renewal notice sent to ${toLine}`, checkIcon);
});

/* ---------- Client Modal (view / edit / add) ---------- */
const clientModalOverlay = document.getElementById('clientModalOverlay');
const clientModal = document.getElementById('clientModal');
const clientViewContent = document.getElementById('clientViewContent');
const clientEditForm = document.getElementById('clientEditForm');
let editingClientName = null; // null = adding a new client

function openClientViewModal(client){
  editingClientName = client;
  const p = clientProfiles[client];
  document.getElementById('clientModalTitle').textContent = client;
  document.getElementById('clientModalSub').textContent = `${p.industry} · ${p.status}`;
  document.getElementById('clientViewFields').innerHTML = [
    dlRow("Industry", p.industry),
    dlRow("Status", p.status),
    dlRow("Primary Contact", p.contactPerson),
    dlRow("Contact Email", p.contactEmail),
    dlRow("Contact Number", p.contactNumber),
    dlRow("Account Manager", p.accountManager),
    dlRow("No. of Talents", talents.filter(c=>c.client===client).length),
  ].join('');
  clientViewContent.classList.remove('hidden');
  clientEditForm.classList.add('hidden');
  clientModalOverlay.classList.add('open');
  clientModal.classList.add('open');
}
function openAddClientModal(){
  editingClientName = null;
  document.getElementById('clientModalTitle').textContent = "Add a Client";
  document.getElementById('clientModalSub').textContent = "";
  document.getElementById('clientSubmitBtn').textContent = "Add Client";
  clientEditForm.reset();
  document.getElementById('cl_name').disabled = false;
  clientViewContent.classList.add('hidden');
  clientEditForm.classList.remove('hidden');
  clientModalOverlay.classList.add('open');
  clientModal.classList.add('open');
}
function closeClientModalFn(){
  clientModalOverlay.classList.remove('open');
  clientModal.classList.remove('open');
  editingClientName = null;
}
document.getElementById('closeClientModal').addEventListener('click', closeClientModalFn);
document.getElementById('cancelClientModal').addEventListener('click', closeClientModalFn);
clientModalOverlay.addEventListener('click', closeClientModalFn);
document.getElementById('openAddClientModalBtn').addEventListener('click', openAddClientModal);

document.getElementById('clientEditBtn').addEventListener('click', ()=>{
  const client = editingClientName;
  const p = clientProfiles[client];
  document.getElementById('clientModalTitle').textContent = `Edit ${client}`;
  document.getElementById('clientSubmitBtn').textContent = "Save Changes";
  document.getElementById('cl_name').value = client;
  document.getElementById('cl_name').disabled = true; // renaming a client would break existing talent/billing references
  document.getElementById('cl_industry').value = p.industry;
  document.getElementById('cl_status').value = p.status;
  document.getElementById('cl_contactPerson').value = p.contactPerson;
  document.getElementById('cl_accountManager').value = p.accountManager;
  document.getElementById('cl_contactEmail').value = p.contactEmail;
  document.getElementById('cl_contactNumber').value = p.contactNumber;
  clientViewContent.classList.add('hidden');
  clientEditForm.classList.remove('hidden');
});

clientEditForm.addEventListener('submit', e=>{
  e.preventDefault();
  const isNew = editingClientName === null;
  const name = document.getElementById('cl_name').value.trim();
  if(isNew){
    if(clients.includes(name)){
      showToast(`A client named "${name}" already exists.`);
      return;
    }
    clients.push(name);
  }
  const key = isNew ? name : editingClientName;
  clientProfiles[key] = {
    industry: document.getElementById('cl_industry').value,
    status: document.getElementById('cl_status').value,
    contactPerson: document.getElementById('cl_contactPerson').value.trim(),
    accountManager: document.getElementById('cl_accountManager').value,
    contactEmail: document.getElementById('cl_contactEmail').value.trim(),
    contactNumber: document.getElementById('cl_contactNumber').value.trim(),
  };
  closeClientModalFn();
  msClientFilter.setOptions([...new Set(clients)].sort());
  if(msFinanceClient) msFinanceClient.setOptions([...new Set(clients)].sort());
  if(msBillingClient) msBillingClient.setOptions([...new Set(clients)].sort());
  if(msOperationsClient) msOperationsClient.setOptions([...new Set(clients)].sort());
  if(msOffboardingClient) msOffboardingClient.setOptions([...new Set(clients)].sort());
  if(msAnalyticsClient) msAnalyticsClient.setOptions([...new Set(clients)].sort());
  fillOptions(document.getElementById('f_client'), [...new Set(clients)].sort(), null);
  addAddNewOption(document.getElementById('f_client'), "+ Add New Client…");
  renderClients();
  showToast(isNew ? `${name} added as a new client` : `${key}'s details updated`, checkIcon);
});

let analyticsSortTerm = "gp-desc";
let analyticsClientTerm = [];
let analyticsSortInit = false;
let msAnalyticsClient = null;

const analyticsSubTabsList = [
  {id:'financials', label:'Financials'},
  {id:'workpass', label:'Work Pass'},
  {id:'billing', label:'Billing'},
  {id:'risk', label:'Risk & Performance'},
];
let analyticsActiveSubTab = {};

function renderAnalytics(){
  if(!analyticsSortInit){
    analyticsSortInit = true;
    document.getElementById('analyticsSortFilter').addEventListener('change', e=>{
      analyticsSortTerm = e.target.value;
      renderAnalytics();
    });
    msAnalyticsClient = createMultiSelect('analyticsClientFilter', [...new Set(clients)].sort(), "All clients", vals=>{
      analyticsClientTerm = vals;
      renderAnalytics();
    });
  }

  const container = document.getElementById('analyticsAccordion');
  initCosmeticMonthFilter('analyticsStatsMonthFilter', ()=> renderAnalytics());
  const allClientData = clients.map(client=>({ client, m: computeClientMetrics(client) }));
  let clientData = analyticsClientTerm.length ? allClientData.filter(({client})=>analyticsClientTerm.includes(client)) : allClientData;

  const totalTalents = allClientData.reduce((s,{m})=>s+m.count, 0);
  const totalRevenue = allClientData.reduce((s,{m})=>s+m.monthlyRevenue, 0);
  const totalCost = allClientData.reduce((s,{m})=>s+m.monthlyCost, 0);
  const totalGp = totalRevenue - totalCost;
  const overallMargin = totalRevenue ? (totalGp/totalRevenue)*100 : 0;
  const totalAdminFee = allClientData.reduce((s,{m})=>s+m.workPassAdminFee, 0);
  document.getElementById('analyticsOverviewStats').innerHTML = [
    { key:"clients", label:"Active Clients", value: clients.length, color:"var(--blue-dark)", clickable:true },
    { key:"talents", label:"Total Talents", value: totalTalents, color:"var(--text)", clickable:true },
    { key:"revenue", label:"Total Monthly Revenue", value: fmtMoney(Math.round(totalRevenue)), color:"var(--text)", clickable:false },
    { key:"gp", label:"Total Gross Profit", value: fmtMoney(Math.round(totalGp)), color: totalGp>=0 ? "var(--green-text)" : "var(--red-text)", clickable:false },
    { key:"margin", label:"Overall GP Margin %", value: overallMargin.toFixed(1)+"%", color:"var(--amber-text)", clickable:false },
    { key:"adminFee", label:"Total Work Pass Admin Fee", value: fmtMoney(Math.round(totalAdminFee)), color:"var(--text)", clickable:false },
  ].map(c=>`
    <div class="stat-card ${c.clickable?'stat-card-clickable':''} rounded-lg px-4 py-3" ${c.clickable?`data-card="${c.key}"`:''}>
      <div class="text-xs text-[var(--muted)] mb-1">${c.label}</div>
      <div class="text-xl font-bold" style="color:${c.color}">${c.value}</div>
    </div>`).join('');

  document.querySelectorAll('#analyticsOverviewStats .stat-card-clickable').forEach(card=>{
    card.addEventListener('click', ()=>{
      const key = card.dataset.card;
      if(key === "clients") switchView('clients');
      if(key === "talents") switchView('talents');
    });
  });

  clientData.sort((a,b)=>{
    if(analyticsSortTerm === "name-asc") return a.client.localeCompare(b.client);
    if(analyticsSortTerm === "name-desc") return b.client.localeCompare(a.client);
    if(analyticsSortTerm === "count-desc") return b.m.count - a.m.count;
    if(analyticsSortTerm === "count-asc") return a.m.count - b.m.count;
    if(analyticsSortTerm === "gp-desc") return b.m.grossProfit - a.m.grossProfit;
    if(analyticsSortTerm === "gp-asc") return a.m.grossProfit - b.m.grossProfit;
    return 0;
  });

  container.innerHTML = clientData.map(({client, m})=>{
    const safeId = client.replace(/[^a-zA-Z0-9]/g,'_');
    const gpColor = m.grossProfit >= 0 ? "var(--green-bg)" : "var(--red-bg)";
    const gpText = m.grossProfit >= 0 ? "var(--green-text)" : "var(--red-text)";
    const activeSub = analyticsActiveSubTab[safeId] || 'financials';
    return `
      <div class="stat-card rounded-lg mb-3 overflow-hidden">
        <button type="button" class="an-toggle w-full flex items-center justify-between px-6 py-5 text-left hover:bg-[#F8FAFC]" data-target="an-panel-${safeId}">
          <span class="font-bold text-lg flex items-center gap-3 flex-wrap">
            <svg class="an-chevron w-5 h-5 transition-transform duration-150 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
            ${client}
            <span class="text-base text-[var(--muted)] font-normal">${m.count} talent${m.count===1?'':'s'}</span>
            <span class="pill" style="background:${gpColor};color:${gpText}">GP ${fmtMoney(Math.round(m.grossProfit))}</span>
          </span>
        </button>
        <div class="an-panel hidden border-t border-[var(--border)] px-6 py-4" id="an-panel-${safeId}">
          <div class="flex justify-center mb-3 border-b border-[var(--border)] overflow-x-auto">
            <div class="flex gap-1" style="min-width:max-content;">
              ${analyticsSubTabsList.map(t=>`<button type="button" class="an-subtab-btn profile-tab-btn px-4 py-2.5 text-sm font-medium ${activeSub===t.id?'active':''}" data-safeid="${safeId}" data-tab="${t.id}">${t.label}</button>`).join('')}
            </div>
          </div>
          <div class="an-subtab-panel overflow-x-auto ${activeSub==='financials'?'':'hidden'}" data-safeid="${safeId}" data-tab="financials" id="an-tab-financials-${safeId}">
            ${buildAnalyticsMetricsTable(client)}
          </div>
          <div class="an-subtab-panel overflow-x-auto ${activeSub==='workpass'?'':'hidden'}" data-safeid="${safeId}" data-tab="workpass" id="an-tab-workpass-${safeId}">
            ${buildWorkPassBreakdown(client)}
          </div>
          <div class="an-subtab-panel ${activeSub==='billing'?'':'hidden'}" data-safeid="${safeId}" data-tab="billing" id="an-tab-billing-${safeId}">
            <div id="billing-${safeId}"></div>
          </div>
          <div class="an-subtab-panel ${activeSub==='risk'?'':'hidden'}" data-safeid="${safeId}" data-tab="risk" id="an-tab-risk-${safeId}">
            ${buildClientOpsIndicators(client)}
          </div>
        </div>
      </div>`;
  }).join('');

  container.querySelectorAll('.an-toggle').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const panel = document.getElementById(btn.dataset.target);
      const chevron = btn.querySelector('.an-chevron');
      panel.classList.toggle('hidden');
      chevron.classList.toggle('rotate-180');
    });
  });

  container.querySelectorAll('.an-subtab-btn').forEach(btn=>{
    btn.addEventListener('click', e=>{
      e.stopPropagation();
      const safeId = btn.dataset.safeid;
      const tab = btn.dataset.tab;
      analyticsActiveSubTab[safeId] = tab;
      document.querySelectorAll(`.an-subtab-panel[data-safeid="${safeId}"]`).forEach(p=>{
        p.classList.toggle('hidden', p.dataset.tab !== tab);
      });
      document.querySelectorAll(`.an-subtab-btn[data-safeid="${safeId}"]`).forEach(b=>{
        b.classList.toggle('active', b.dataset.tab === tab);
      });
    });
  });

  clientData.forEach(({client})=>{
    const safeId = client.replace(/[^a-zA-Z0-9]/g,'_');
    showBillingView(client, safeId);
  });

  container.querySelectorAll('.metric-link').forEach(el=>{
    el.addEventListener('click', e=>{
      e.stopPropagation();
      openMetricChart(el.dataset.client, el.dataset.metric);
    });
  });
}

function computeClientOpsFlags(client){
  const group = talents.filter(c=>c.client===client);
  const talentsEndingSoon = group.filter(c=>c.contractDaysLeft<=30).length;
  const passExpirySoon = group.filter(c=>c.passDaysLeft<=30).length;
  const leaveLiabilityDays = group.reduce((s,c)=>s+c.annualLeaveBalance, 0);
  const leaveLiabilityCost = group.reduce((s,c)=>s+(c.annualLeaveBalance*(c.salary/30)), 0);
  const b = clientBilling[client];
  return {
    talentsEndingSoon,
    passExpirySoon,
    leaveLiabilityDays,
    leaveLiabilityCost,
    pendingSOW: b.sowStatus !== "Signed",
    pendingPO: b.poStatus !== "Received",
    pendingInvoice: b.invoiceStatus === "Pending" || b.invoiceStatus === "Issued",
    paymentOverdue: b.invoiceStatus === "Overdue",
  };
}

function opsIndicatorCard(label, value, isRisk){
  const color = isRisk ? "var(--red-text)" : "var(--green-text)";
  return `
    <div class="stat-card rounded-md px-3 py-2">
      <div class="text-[11px] text-[var(--muted)] mb-0.5">${label}</div>
      <div class="text-sm font-bold" style="color:${color}">${value}</div>
    </div>`;
}

function buildClientOpsIndicators(client){
  const f = computeClientOpsFlags(client);
  return `
    <div>
      <div class="text-[10px] uppercase tracking-wide text-[var(--muted)] font-semibold mb-2">Project Performance Indicators</div>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        ${opsIndicatorCard("Talents Ending Soon", f.talentsEndingSoon, f.talentsEndingSoon > 0)}
        ${opsIndicatorCard("Work Pass Expiring Soon", f.passExpirySoon, f.passExpirySoon > 0)}
        ${opsIndicatorCard("Leave Liability", `${f.leaveLiabilityDays}d · ${fmtMoney(Math.round(f.leaveLiabilityCost))}`, false)}
        ${opsIndicatorCard("Pending SOW", f.pendingSOW ? "Yes" : "No", f.pendingSOW)}
        ${opsIndicatorCard("Pending PO", f.pendingPO ? "Yes" : "No", f.pendingPO)}
        ${opsIndicatorCard("Pending Invoice", f.pendingInvoice ? "Yes" : "No", f.pendingInvoice)}
        ${opsIndicatorCard("Payment Overdue", f.paymentOverdue ? "Yes" : "No", f.paymentOverdue)}
      </div>
    </div>`;
}

function buildWorkPassBreakdown(client){
  const group = talents.filter(c=>c.client===client);
  const orderedTypes = workPassTypes.filter(type=>group.some(c=>c.workPassType===type));

  let totalCount = 0, totalCost = 0;
  const rows = orderedTypes.map(type=>{
    const count = group.filter(c=>c.workPassType===type).length;
    const fee = workPassAdminFees[type] ?? 0;
    const cost = count * fee;
    totalCount += count;
    totalCost += cost;
    return `
      <tr class="border-t border-[var(--border)]">
        <td class="py-1.5 pr-3 whitespace-nowrap">${type}</td>
        <td class="py-1.5 px-2 text-right whitespace-nowrap">${count}</td>
        <td class="py-1.5 px-2 text-right whitespace-nowrap">${fmtMoney(fee)}</td>
        <td class="py-1.5 pl-3 text-right whitespace-nowrap font-medium">${fmtMoney(cost)}</td>
      </tr>`;
  }).join('');

  return `
    <div>
      <div class="text-[10px] uppercase tracking-wide text-[var(--muted)] font-semibold mb-2">Work Pass Breakdown</div>
      <table class="w-full text-xs min-w-[420px]">
        <thead>
          <tr class="text-left text-[10px] uppercase tracking-wide text-[var(--muted)]">
            <th class="py-1 pr-3 font-semibold">Pass Type</th>
            <th class="py-1 px-2 text-right font-semibold whitespace-nowrap">Count</th>
            <th class="py-1 px-2 text-right font-semibold whitespace-nowrap">Admin Fee (per pass)</th>
            <th class="py-1 pl-3 text-right font-semibold whitespace-nowrap">Total Cost</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
        <tfoot>
          <tr class="border-t-2 border-[var(--border-strong)] font-semibold">
            <td class="py-1.5 pr-3 whitespace-nowrap">Total (${totalCount} pass${totalCount===1?'':'es'})</td>
            <td class="py-1.5 px-2 text-right"></td>
            <td class="py-1.5 px-2 text-right"></td>
            <td class="py-1.5 pl-3 text-right whitespace-nowrap">${fmtMoney(totalCost)}</td>
          </tr>
        </tfoot>
      </table>
    </div>`;
}

function buildAnalyticsMetricsTable(client){
  const dates = monthDates.slice(-4); // chronological: 3 months ago, 2 months ago, last month, current
  const headerLabelsChron = dates.map((d,i)=> i===3 ? `${monthLabel(d)} (Current)` : monthLabel(d));
  const headerLabels = [...headerLabelsChron].reverse(); // display: current -> oldest

  const rows = analyticsMetricDefs.map(def=>{
    const series = clientHistory[client][def.key];
    const last4 = series.slice(-4); // chronological: [3moAgo, 2moAgo, 1moAgo, current]
    const cellsChron = last4.map((v,i)=>{
      if(i===0) return `<td class="py-2 px-2 text-right whitespace-nowrap">${def.fmt(v)}</td>`;
      const delta = pctChange(v, last4[i-1]);
      return `<td class="py-2 px-2 text-right whitespace-nowrap">${def.fmt(v)} <span class="inline-block ml-1">${trendBadge(delta)}</span></td>`;
    });
    const cells = [...cellsChron].reverse().join(''); // display: current -> oldest
    const overallDelta = pctChange(last4[3], last4[0]);
    return `
      <tr class="border-t border-[var(--border)]">
        <td class="py-2 pr-3 whitespace-nowrap">
          <span class="metric-link text-sm font-medium link cursor-pointer" data-client="${client}" data-metric="${def.key}">${def.label}</span>
        </td>
        ${cells}
        <td class="py-2 pl-3 whitespace-nowrap">${trendBadge(overallDelta)}</td>
      </tr>`;
  }).join('');

  return `
    <table class="w-full text-xs min-w-[720px]">
      <thead>
        <tr class="text-left text-[10px] uppercase tracking-wide text-[var(--muted)]">
          <th class="py-1 pr-3 font-semibold">Metric</th>
          <th class="py-1 px-2 text-right font-semibold whitespace-nowrap">${headerLabels[0]}</th>
          <th class="py-1 px-2 text-right font-semibold whitespace-nowrap">${headerLabels[1]}</th>
          <th class="py-1 px-2 text-right font-semibold whitespace-nowrap">${headerLabels[2]}</th>
          <th class="py-1 px-2 text-right font-semibold whitespace-nowrap">${headerLabels[3]}</th>
          <th class="py-1 pl-3 text-right font-semibold whitespace-nowrap">vs 3 Mo Ago</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <p class="text-[11px] text-[var(--muted)] mt-2">Click a metric name to see its full trend chart.</p>`;
}

/* ---------- Metric Trend Chart Modal ---------- */
const chartModalOverlay = document.getElementById('chartModalOverlay');
const chartModal = document.getElementById('chartModal');
const chartRangeDaysMap = { "1M":30, "3M":90, "6M":180, "1Y":365, "2Y":730, "3Y":1095 };
let chartClient = null, chartMetricKey = null, chartRange = "3M";

/* Build a daily series (for zig-zag charting) by interpolating between the stable monthly
   anchor points and adding small daily noise, so the chart passes through the same monthly
   figures shown in the table but still moves day-to-day. Cached per client+metric so repeat
   views (and switching ranges) don't regenerate different noise each time. */
const dailySeriesCache = {};
function buildDailySeries(monthlySeries){
  const dailyDates = [];
  const dailyValues = [];
  for(let m=0; m<monthlySeries.length-1; m++){
    const startDate = monthDates[m];
    const endDate = monthDates[m+1];
    const startVal = monthlySeries[m];
    const endVal = monthlySeries[m+1];
    const daysBetween = Math.max(1, Math.round((endDate-startDate)/(1000*60*60*24)));
    for(let d=0; d<daysBetween; d++){
      const t = d/daysBetween;
      const base = startVal + (endVal-startVal)*t;
      const noise = base * (Math.random()*2-1) * 0.018; // small day-to-day wobble
      const date = new Date(startDate);
      date.setDate(date.getDate()+d);
      dailyDates.push(date);
      dailyValues.push(base+noise);
    }
  }
  dailyDates.push(monthDates[monthDates.length-1]);
  dailyValues.push(monthlySeries[monthlySeries.length-1]);
  return { dailyDates, dailyValues };
}
function getDailySeries(client, metricKey){
  const cacheKey = client+'|'+metricKey;
  if(!dailySeriesCache[cacheKey]){
    dailySeriesCache[cacheKey] = buildDailySeries(clientHistory[client][metricKey]);
  }
  return dailySeriesCache[cacheKey];
}

function openMetricChart(client, metricKey){
  chartClient = client;
  chartMetricKey = metricKey;
  chartRange = "3M";
  const def = analyticsMetricDefs.find(d=>d.key===metricKey);
  document.getElementById('chartModalTitle').textContent = def ? def.label : metricKey;
  document.getElementById('chartModalSub').textContent = `${client} · Trend over time`;
  updateChartRangeButtons();
  drawChart();
  chartModalOverlay.classList.add('open');
  chartModal.classList.add('open');
}
function closeChartModalFn(){
  chartModalOverlay.classList.remove('open');
  chartModal.classList.remove('open');
}
document.getElementById('closeChartModal').addEventListener('click', closeChartModalFn);
chartModalOverlay.addEventListener('click', closeChartModalFn);

function updateChartRangeButtons(){
  document.querySelectorAll('.chart-range-btn').forEach(b=>{
    b.classList.toggle('active', b.dataset.range === chartRange);
  });
}
document.querySelectorAll('.chart-range-btn').forEach(b=>{
  b.addEventListener('click', ()=>{
    chartRange = b.dataset.range;
    updateChartRangeButtons();
    drawChart();
  });
});

function drawChart(){
  const def = analyticsMetricDefs.find(d=>d.key===chartMetricKey);
  const { dailyDates, dailyValues } = getDailySeries(chartClient, chartMetricKey);
  const n = chartRangeDaysMap[chartRange];
  const series = dailyValues.slice(-n);
  const dates = dailyDates.slice(-n);

  const w = 620, h = 240, padX = 20, padY = 20;
  const minV = Math.min(...series), maxV = Math.max(...series);
  const spread = (maxV - minV) || Math.abs(maxV) || 1;
  const points = series.map((v,i)=>{
    const x = series.length > 1 ? padX + (i/(series.length-1))*(w-2*padX) : w/2;
    const y = h - padY - ((v-minV)/spread)*(h-2*padY);
    return [x,y];
  });
  const pathD = points.map((p,i)=> (i===0?'M':'L')+p[0].toFixed(1)+','+p[1].toFixed(1)).join(' ');
  const areaD = `${pathD} L${points[points.length-1][0].toFixed(1)},${h-padY} L${points[0][0].toFixed(1)},${h-padY} Z`;

  const tickCount = Math.min(6, dates.length);
  const tickIndices = [...new Set(Array.from({length:tickCount}, (_,i)=>
    Math.round(i * (dates.length-1) / (tickCount-1))
  ))];
  const gridLines = tickIndices.map(idx=>
    `<line x1="${points[idx][0].toFixed(1)}" y1="${padY}" x2="${points[idx][0].toFixed(1)}" y2="${h-padY}" stroke="var(--border)" stroke-width="1" stroke-dasharray="2,3"/>`
  ).join('');
  const tickLabels = tickIndices.map(idx=>{
    const leftPct = (points[idx][0]/w)*100;
    const align = idx===0 ? 'left:0%;transform:translateX(0)'
      : idx===dates.length-1 ? `left:${leftPct}%;transform:translateX(-100%)`
      : `left:${leftPct}%;transform:translateX(-50%)`;
    return `<span class="absolute text-[11px] text-[var(--muted)] whitespace-nowrap" style="${align}">${fmtDate(dates[idx])}</span>`;
  }).join('');

  const svg = `
    <svg viewBox="0 0 ${w} ${h}" class="w-full" style="height:240px;display:block;" id="chartSvg">
      ${gridLines}
      <path d="${areaD}" fill="var(--blue-tint)" opacity="0.7"/>
      <path d="${pathD}" fill="none" stroke="var(--blue)" stroke-width="2.5"/>
      <line x1="${padX}" y1="${h-padY}" x2="${w-padX}" y2="${h-padY}" stroke="var(--border-strong)" stroke-width="1"/>
      <circle id="chartHoverDot" cx="0" cy="0" r="4" fill="var(--blue)" stroke="#fff" stroke-width="2" style="display:none;"/>
    </svg>
    <div class="relative h-4 mt-1">${tickLabels}</div>`;
  document.getElementById('chartSvgContainer').innerHTML = svg;

  const tooltip = document.createElement('div');
  tooltip.id = 'chartTooltip';
  tooltip.className = 'hidden bg-white border border-[var(--border)] rounded-lg shadow-lg px-3 py-2 pointer-events-none';
  document.getElementById('chartSvgContainer').appendChild(tooltip);

  const svgEl = document.getElementById('chartSvg');
  const hoverDot = document.getElementById('chartHoverDot');

  svgEl.addEventListener('mousemove', e=>{
    const rect = svgEl.getBoundingClientRect();
    const scaleX = w / rect.width;
    const mouseX = (e.clientX - rect.left) * scaleX;
    let nearest = 0, minDist = Infinity;
    points.forEach((p,i)=>{
      const d = Math.abs(p[0]-mouseX);
      if(d < minDist){ minDist = d; nearest = i; }
    });
    const p = points[nearest];
    hoverDot.setAttribute('cx', p[0]);
    hoverDot.setAttribute('cy', p[1]);
    hoverDot.style.display = 'block';

    const pxPerUnitX = rect.width / w;
    const pxPerUnitY = rect.height / h;
    const left = Math.min(Math.max(p[0]*pxPerUnitX - 60, 0), rect.width - 140);
    const top = Math.max(p[1]*pxPerUnitY - 70, 0);
    tooltip.style.left = left + 'px';
    tooltip.style.top = top + 'px';
    tooltip.innerHTML = `
      <div class="text-[11px] text-[var(--muted)]">${fmtDate(dates[nearest])}</div>
      <div class="text-sm font-bold text-[var(--blue-dark)]">${def.fmt(series[nearest])}</div>`;
    tooltip.classList.remove('hidden');
  });
  svgEl.addEventListener('mouseleave', ()=>{
    tooltip.classList.add('hidden');
    hoverDot.style.display = 'none';
  });
}

/* ---------- Billing Details view/edit (compact 2-column, per client) ---------- */
function billingViewHtml(b){
  return `
    <div class="grid md:grid-cols-2 gap-x-10 gap-y-2 text-sm">
      ${dlRow("Billing Type", b.billingType)}
      ${dlRow("Charge Rate / Billing Rate", `${b.currency} ${b.chargeRate.toLocaleString()}`)}
      ${dlRow("Currency", b.currency)}
      ${dlRow("Billable Start Date", fmtDate(b.billableStart))}
      ${dlRow("Billable End Date", fmtDate(b.billableEnd))}
      ${dlRow("SOW Required", b.sowRequired)}
      ${dlRow("SOW Status", b.sowStatus)}
      ${dlRow("PO Required", b.poRequired)}
      ${dlRow("PO Status", b.poStatus)}
      ${dlRow("Invoice Number", b.invoiceNumber)}
      ${dlRow("Invoice Date", fmtDate(b.invoiceDate))}
      ${dlRow("Invoice Amount", fmtMoney(b.invoiceAmount))}
      ${dlRow("Invoice Status", b.invoiceStatus)}
      ${dlRow("Client Payment Due Date", fmtDate(b.clientPaymentDueDate))}
      ${dlRow("Client Payment Received Date", b.clientPaymentReceivedDate ? fmtDate(b.clientPaymentReceivedDate) : "Not yet received")}
    </div>
    <div class="flex justify-end pt-3">
      <button type="button" class="billing-edit-btn btn-primary rounded-md px-3.5 py-1.5 text-sm font-medium">Edit Billing Details</button>
    </div>`;
}

function billingEditHtml(safeId, b){
  return `
    <div class="grid md:grid-cols-2 gap-x-8 gap-y-1">
      ${editSelectRow("Billing Type", `bill_billingType_${safeId}`, ["Monthly","Daily","Hourly"], b.billingType)}
      ${editNumberRow("Charge Rate / Billing Rate", `bill_chargeRate_${safeId}`, b.chargeRate)}
      ${editSelectRow("Currency", `bill_currency_${safeId}`, ["SGD","USD"], b.currency)}
      ${editDateRow("Billable Start Date", `bill_billableStart_${safeId}`, b.billableStart)}
      ${editDateRow("Billable End Date", `bill_billableEnd_${safeId}`, b.billableEnd)}
      ${editSelectRow("SOW Required", `bill_sowRequired_${safeId}`, ["Yes","No"], b.sowRequired)}
      ${editSelectRow("SOW Status", `bill_sowStatus_${safeId}`, ["Drafted","Pending","Received","Signed"], b.sowStatus)}
      ${editSelectRow("PO Required", `bill_poRequired_${safeId}`, ["Yes","No"], b.poRequired)}
      ${editSelectRow("PO Status", `bill_poStatus_${safeId}`, ["Raised","Pending","Received"], b.poStatus)}
      ${editTextRow("Invoice Number", `bill_invoiceNumber_${safeId}`, b.invoiceNumber)}
      ${editDateRow("Invoice Date", `bill_invoiceDate_${safeId}`, b.invoiceDate)}
      ${editNumberRow("Invoice Amount", `bill_invoiceAmount_${safeId}`, b.invoiceAmount)}
      ${editSelectRow("Invoice Status", `bill_invoiceStatus_${safeId}`, ["Pending","Issued","Paid","Overdue"], b.invoiceStatus)}
      ${editDateRow("Client Payment Due Date", `bill_dueDate_${safeId}`, b.clientPaymentDueDate)}
      ${editDateRowNullable("Client Payment Received Date", `bill_receivedDate_${safeId}`, b.clientPaymentReceivedDate)}
    </div>
    <div class="flex justify-end gap-2 pt-3">
      <button type="button" class="billing-cancel-btn btn-secondary rounded-md px-4 py-2 text-sm font-medium">Cancel</button>
      <button type="button" class="billing-save-btn btn-primary rounded-md px-4 py-2 text-sm font-medium">Save Changes</button>
    </div>`;
}

function showBillingView(client, safeId){
  const b = clientBilling[client];
  const el = document.getElementById('billing-'+safeId);
  if(!el) return;
  el.innerHTML = billingViewHtml(b);
  const editBtn = el.querySelector('.billing-edit-btn');
  if(editBtn) editBtn.addEventListener('click', ()=> showBillingEdit(client, safeId));
}
function showBillingEdit(client, safeId){
  const b = clientBilling[client];
  const el = document.getElementById('billing-'+safeId);
  if(!el) return;
  el.innerHTML = billingEditHtml(safeId, b);
  el.querySelector('.billing-cancel-btn').addEventListener('click', ()=> showBillingView(client, safeId));
  el.querySelector('.billing-save-btn').addEventListener('click', ()=>{
    b.billingType = document.getElementById(`bill_billingType_${safeId}`).value;
    b.chargeRate = Number(document.getElementById(`bill_chargeRate_${safeId}`).value);
    b.currency = document.getElementById(`bill_currency_${safeId}`).value;
    b.billableStart = new Date(document.getElementById(`bill_billableStart_${safeId}`).value);
    b.billableEnd = new Date(document.getElementById(`bill_billableEnd_${safeId}`).value);
    b.sowRequired = document.getElementById(`bill_sowRequired_${safeId}`).value;
    b.sowStatus = document.getElementById(`bill_sowStatus_${safeId}`).value;
    b.poRequired = document.getElementById(`bill_poRequired_${safeId}`).value;
    b.poStatus = document.getElementById(`bill_poStatus_${safeId}`).value;
    b.invoiceNumber = document.getElementById(`bill_invoiceNumber_${safeId}`).value;
    b.invoiceDate = new Date(document.getElementById(`bill_invoiceDate_${safeId}`).value);
    b.invoiceAmount = Number(document.getElementById(`bill_invoiceAmount_${safeId}`).value);
    b.invoiceStatus = document.getElementById(`bill_invoiceStatus_${safeId}`).value;
    b.clientPaymentDueDate = new Date(document.getElementById(`bill_dueDate_${safeId}`).value);
    const receivedVal = document.getElementById(`bill_receivedDate_${safeId}`).value;
    b.clientPaymentReceivedDate = receivedVal ? new Date(receivedVal) : null;
    showBillingView(client, safeId);
    showToast(`${client}'s billing details updated`, checkIcon);
  });
}
document.getElementById('exportExcelBtn').addEventListener('click', ()=> showToast("This mockup does not export real files yet."));
document.getElementById('exportPdfBtn').addEventListener('click', ()=> showToast("This mockup does not export real files yet."));

/* ---------- OFFBOARDING ---------- */
function computeFinalSalary(c){
  const daysWorkedThisMonth = Math.max(1, 30 + c.contractDaysLeft);
  return Math.round((c.salary/30)*Math.min(30,daysWorkedThisMonth));
}
function computeLeaveEncashment(c){
  return Math.round(c.annualLeaveBalance * (c.salary/30));
}

let offboardingSearchTerm = "";
let offboardingClientTerm = [];
let offboardingStatusTerm = [];
let offboardingSortKey = "lastWorkingDay";
let offboardingSortDir = 1;
let offboardingFiltersInit = false;
let offboardingPage = 1;
let offboardingDocsPendingOnly = false;
let msOffboardingClient = null;
let msOffboardingStatus = null;

function initOffboardingFilters(){
  if(offboardingFiltersInit) return;
  offboardingFiltersInit = true;
  msOffboardingClient = createMultiSelect('offboardingClientFilter', [...new Set(clients)].sort(), "All clients", vals=>{ offboardingClientTerm=vals; offboardingPage=1; renderOffboarding(); });
  msOffboardingStatus = createMultiSelect('offboardingStatusFilter', ["Pending Exit","Exited"], "All statuses", vals=>{ offboardingStatusTerm=vals; offboardingPage=1; renderOffboarding(); });

  document.getElementById('offboardingSearchInput').addEventListener('input', e=>{
    offboardingSearchTerm = e.target.value;
    offboardingPage = 1;
    renderOffboarding();
  });
  wireClearButton('offboardingSearchInput', 'offboardingSearchClear', ()=>{ offboardingSearchTerm=""; offboardingPage=1; renderOffboarding(); });

  document.querySelectorAll('.offboarding-sortable[data-key]').forEach(th=>{
    th.addEventListener('click', ()=>{
      const key = th.dataset.key;
      if(offboardingSortKey === key){ offboardingSortDir *= -1; } else { offboardingSortKey = key; offboardingSortDir = 1; }
      updateOffboardingSortArrows();
      offboardingPage = 1;
      renderOffboarding();
    });
  });
  updateOffboardingSortArrows();

  document.getElementById('offboardingClearFilters').addEventListener('click', e=>{
    e.preventDefault();
    offboardingSearchTerm=""; offboardingClientTerm=[]; offboardingStatusTerm=[]; offboardingDocsPendingOnly=false; offboardingPage=1;
    document.getElementById('offboardingSearchInput').value="";
    msOffboardingClient.reset();
    msOffboardingStatus.reset();
    renderOffboarding();
  });
  document.getElementById('offboardingDownloadLink').addEventListener('click', e=>{ e.preventDefault(); showToast("This mockup does not export real data yet."); });
}
function updateOffboardingSortArrows(){
  document.querySelectorAll('.offboarding-sort-caret').forEach(el=>{
    const key = el.dataset.arrow;
    const isActive = key === offboardingSortKey;
    el.classList.toggle('active', isActive);
    el.textContent = isActive ? (offboardingSortDir === 1 ? "▲" : "▼") : "▲";
  });
}

/* ---------- Offboarding Checklist widget ---------- */
function renderOffboarding(){
  initOffboardingFilters();
  initCosmeticMonthFilter('offboardingStatsMonthFilter', ()=> renderOffboarding());

  const exiting = talents.filter(c=>c.contractDaysLeft<=30)
    .map(c=>({ ...c, exitStatus: c.contractDaysLeft < 0 ? "Exited" : "Pending Exit" }));
  const exitedCount = exiting.filter(c=>c.contractDaysLeft<0).length;
  const pendingCount = exiting.length - exitedCount;
  const exitDocsPendingCount = exiting.filter(c=>c.exitDocsCompleted==="No").length;

  document.getElementById('offboardingStatCards').innerHTML = [
    { key:"all", label:"Talents in Offboarding", value: exiting.length, color:"var(--text)" },
    { key:"pending", label:"Pending Exit", value: pendingCount, color:"var(--amber-text)" },
    { key:"exited", label:"Already Exited", value: exitedCount, color:"var(--red-text)" },
    { key:"docsPending", label:"Exit Docs Pending", value: exitDocsPendingCount, color: exitDocsPendingCount>0 ? "var(--red-text)" : "var(--green-text)" },
  ].map(c=>{
    const active = (c.key==="pending" && offboardingStatusTerm.includes("Pending Exit"))
      || (c.key==="exited" && offboardingStatusTerm.includes("Exited"))
      || (c.key==="docsPending" && offboardingDocsPendingOnly)
      || (c.key==="all" && offboardingStatusTerm.length===0 && !offboardingDocsPendingOnly);
    return `
    <div class="stat-card stat-card-clickable rounded-lg px-4 py-3 ${active?'stat-card-clickable-active':''}" data-card="${c.key}">
      <div class="text-xs text-[var(--muted)] mb-1">${c.label}</div>
      <div class="text-xl font-bold" style="color:${c.color}">${c.value}</div>
    </div>`;
  }).join('');

  document.querySelectorAll('#offboardingStatCards .stat-card-clickable').forEach(card=>{
    card.addEventListener('click', ()=>{
      const key = card.dataset.card;
      if(key === "all"){
        offboardingStatusTerm = []; offboardingDocsPendingOnly = false;
      } else if(key === "pending"){
        offboardingStatusTerm = offboardingStatusTerm.includes("Pending Exit") ? offboardingStatusTerm.filter(s=>s!=="Pending Exit") : [...offboardingStatusTerm, "Pending Exit"];
      } else if(key === "exited"){
        offboardingStatusTerm = offboardingStatusTerm.includes("Exited") ? offboardingStatusTerm.filter(s=>s!=="Exited") : [...offboardingStatusTerm, "Exited"];
      } else if(key === "docsPending"){
        offboardingDocsPendingOnly = !offboardingDocsPendingOnly;
      }
      if(msOffboardingStatus) msOffboardingStatus.setSelected(offboardingStatusTerm);
      offboardingPage = 1;
      renderOffboarding();
    });
  });

  let rows = exiting.filter(c=>{
    if(offboardingSearchTerm && !c.name.toLowerCase().includes(offboardingSearchTerm.toLowerCase())) return false;
    if(offboardingClientTerm.length && !offboardingClientTerm.includes(c.client)) return false;
    if(offboardingStatusTerm.length && !offboardingStatusTerm.includes(c.exitStatus)) return false;
    if(offboardingDocsPendingOnly && c.exitDocsCompleted !== "No") return false;
    return true;
  });

  rows.sort((a,b)=>{
    let av = a[offboardingSortKey], bv = b[offboardingSortKey];
    if(av instanceof Date){ av = av.getTime(); bv = bv.getTime(); }
    if(typeof av === "string"){ av = av.toLowerCase(); bv = bv.toLowerCase(); }
    if(av < bv) return -1 * offboardingSortDir;
    if(av > bv) return 1 * offboardingSortDir;
    return 0;
  });

  document.getElementById('offboardingResultCount').textContent = rows.length;
  const tbody = document.getElementById('offboardingTableBody');
  const empty = document.getElementById('offboardingEmpty');
  if(rows.length===0){
    tbody.innerHTML = "";
    empty.classList.remove('hidden');
    renderPaginationBar('offboardingPagination', 0, 1, LIST_PAGE_SIZE, ()=>{});
    return;
  }
  empty.classList.add('hidden');

  offboardingPage = renderPaginationBar('offboardingPagination', rows.length, offboardingPage, LIST_PAGE_SIZE, p=>{
    offboardingPage = p;
    renderOffboarding();
  });
  const startIdx = (offboardingPage-1)*LIST_PAGE_SIZE;
  const pageRows = rows.slice(startIdx, startIdx+LIST_PAGE_SIZE);

  tbody.innerHTML = pageRows.map(c=>`
      <tr class="row-hover border-b border-[var(--border)]">
        <td class="px-4 py-1 text-[var(--muted)] whitespace-nowrap">C${String(c.id).padStart(6,'0')}</td>
        <td class="px-4 py-1 font-medium whitespace-nowrap">
          <span class="offboard-name-link cursor-pointer hover:underline hover:text-[var(--blue-dark)]" data-id="${c.id}">${c.name}</span>
        </td>
        <td class="px-4 py-1 text-[var(--muted)] whitespace-nowrap">${c.client}</td>
        <td class="px-4 py-1 whitespace-nowrap date-alert">${fmtDate(c.lastWorkingDay)}</td>
        <td class="px-4 py-1 whitespace-nowrap"><span class="pill" style="${statusPillStyle(c.noticeServed)}">${c.noticeServed}</span></td>
        <td class="px-4 py-1 whitespace-nowrap"><span class="pill" style="${statusPillStyle(c.clientNotified)}">${c.clientNotified}</span></td>
        <td class="px-4 py-1 whitespace-nowrap"><span class="pill" style="${statusPillStyle(c.exitDocsCompleted)}">${c.exitDocsCompleted}</span></td>
        <td class="px-4 py-1 whitespace-nowrap"><span class="pill" style="${statusPillStyle(c.exitStatus)}">${c.exitStatus}</span></td>
        <td class="px-4 py-1 text-right relative">
          ${c.exitStatus === "Exited" ? `
            <button type="button" class="offboard-menu-btn icon-btn px-1" data-id="${c.id}">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="12" cy="19" r="1.8"/></svg>
            </button>
            <div class="offboard-menu hidden bg-white border border-[var(--border)] rounded-lg shadow-lg overflow-hidden" data-menu-for="${c.id}">
              <button type="button" class="erase-talent-btn w-full text-left px-4 py-2.5 text-sm hover:bg-[#FDF2F1]" style="color:var(--red-text)" data-id="${c.id}">Erase Talent Data</button>
            </div>
          ` : ''}
        </td>
      </tr>`).join('');

  document.querySelectorAll('.offboard-name-link').forEach(el=>{
    el.addEventListener('click', ()=> openTalentProfile(Number(el.dataset.id), 'offboarding'));
  });

  document.querySelectorAll('.offboard-menu-btn').forEach(btn=>{
    btn.addEventListener('click', e=>{
      e.stopPropagation();
      const menu = btn.nextElementSibling;
      const willOpen = menu.classList.contains('hidden');
      document.querySelectorAll('.offboard-menu').forEach(m=>m.classList.add('hidden'));
      if(willOpen) menu.classList.remove('hidden');
    });
  });
  document.querySelectorAll('.erase-talent-btn').forEach(btn=>{
    btn.addEventListener('click', e=>{
      e.stopPropagation();
      const id = Number(btn.dataset.id);
      const c = talents.find(x=>x.id === id);
      if(!c) return;
      const confirmed = confirm(`Permanently erase all data for ${c.name}? This cannot be undone.`);
      if(!confirmed) return;
      talents = talents.filter(x=>x.id !== id);
      renderOffboarding();
      renderStats();
      showToast(`${c.name}'s data has been erased from the system`, checkIcon);
    });
  });
}

/* ---------- Offboarding Modal (talent details + offboarding fields) ---------- */
const offboardModalOverlay = document.getElementById('offboardModalOverlay');
const offboardModal = document.getElementById('offboardModal');
const offboardViewContent = document.getElementById('offboardViewContent');
const offboardEditForm = document.getElementById('offboardEditForm');
let editingOffboardId = null;

function openOffboardViewModal(id){
  const c = talents.find(x=>x.id === id);
  if(!c) return;
  editingOffboardId = id;
  const exitStatus = c.contractDaysLeft < 0 ? "Exited" : "Pending Exit";
  document.getElementById('offboardModalName').textContent = c.name;
  document.getElementById('offboardModalSub').textContent = `${c.client} · ${c.projectType} · ${exitStatus}`;

  document.getElementById('offboardViewFieldsTalent').innerHTML = [
    dlRow("Client Attached", c.client),
    dlRow("Project Type", c.projectType),
    dlRow("Job Title", c.jobTitle),
    dlRow("Contract End Date", fmtDate(c.contractEnd)),
  ].join('');

  document.getElementById('offboardViewFieldsExit').innerHTML = [
    dlRow("Last Working Day", fmtDate(c.lastWorkingDay)),
    dlRow("Resignation / Termination Reason", c.resignationReason),
    dlRow("Notice Served", c.noticeServed),
    dlRow("Final Salary Calculation", fmtMoney(computeFinalSalary(c))),
    dlRow("Leave Encashment / Deduction", fmtMoney(computeLeaveEncashment(c))),
    dlRow("Work Pass Cancellation Date", c.workPassCancellationDate ? fmtDate(c.workPassCancellationDate) : "N/A"),
    dlRow("Client Notified", c.clientNotified),
    dlRow("Replacement Required", c.replacementRequired),
    dlRow("Final Invoice Issued", c.finalInvoiceIssued),
    dlRow("Exit Documents Completed", c.exitDocsCompleted),
    dlRow("Remarks", c.offboardingRemarks),
  ].join('');

  offboardViewContent.classList.remove('hidden');
  offboardEditForm.classList.add('hidden');
  offboardModalOverlay.classList.add('open');
  offboardModal.classList.add('open');
}
function closeOffboardModalFn(){
  offboardModalOverlay.classList.remove('open');
  offboardModal.classList.remove('open');
  editingOffboardId = null;
}
document.getElementById('closeOffboardModal').addEventListener('click', closeOffboardModalFn);
document.getElementById('cancelOffboardModal').addEventListener('click', closeOffboardModalFn);
offboardModalOverlay.addEventListener('click', closeOffboardModalFn);

document.getElementById('offboardEditBtn').addEventListener('click', ()=>{
  const c = talents.find(x=>x.id === editingOffboardId);
  if(!c) return;
  document.getElementById('ob_lastWorkingDay').value = toISO(c.lastWorkingDay);
  document.getElementById('ob_resignationReason').value = c.resignationReason;
  document.getElementById('ob_noticeServed').value = c.noticeServed;
  document.getElementById('ob_workPassCancellationDate').value = c.workPassCancellationDate ? toISO(c.workPassCancellationDate) : '';
  document.getElementById('ob_clientNotified').value = c.clientNotified;
  document.getElementById('ob_replacementRequired').value = c.replacementRequired;
  document.getElementById('ob_finalInvoiceIssued').value = c.finalInvoiceIssued;
  document.getElementById('ob_exitDocsCompleted').value = c.exitDocsCompleted;
  document.getElementById('ob_remarks').value = c.offboardingRemarks;
  offboardViewContent.classList.add('hidden');
  offboardEditForm.classList.remove('hidden');
});

offboardEditForm.addEventListener('submit', e=>{
  e.preventDefault();
  const c = talents.find(x=>x.id === editingOffboardId);
  if(!c) return;
  c.lastWorkingDay = new Date(document.getElementById('ob_lastWorkingDay').value);
  c.resignationReason = document.getElementById('ob_resignationReason').value;
  c.noticeServed = document.getElementById('ob_noticeServed').value;
  const cancelVal = document.getElementById('ob_workPassCancellationDate').value;
  c.workPassCancellationDate = cancelVal ? new Date(cancelVal) : null;
  c.clientNotified = document.getElementById('ob_clientNotified').value;
  c.replacementRequired = document.getElementById('ob_replacementRequired').value;
  c.finalInvoiceIssued = document.getElementById('ob_finalInvoiceIssued').value;
  c.exitDocsCompleted = document.getElementById('ob_exitDocsCompleted').value;
  c.offboardingRemarks = document.getElementById('ob_remarks').value.trim();
  openOffboardViewModal(c.id);
  renderOffboarding();
  refreshProfileIfOpen(c);
  showToast(`${c.name}'s offboarding details updated`, checkIcon);
});

/* ---------- Init ---------- */
async function bootstrap(){
  try{
    const me = await api.auth.me();
    currentUserFirstName = me.name || me.email;
    currentUser = me;
    document.getElementById('profileDropdownName').textContent = me.name;
    document.getElementById('profileDropdownEmail').textContent = me.email;
    const initial = (me.name || me.email || '?')[0].toUpperCase();
    document.getElementById('profileBtn').textContent = initial;

    const [talentsData, clientNames, dashboardData] = await Promise.all([
      api.talents.list(),
      api.lookups.clientNames(),
      api.dashboard.home(),
    ]);

    talents = talentsData;
    talents.forEach(computeDerived);
    clients.length = 0;
    clients.push(...clientNames);
    homeDashboardData = dashboardData;
  }catch(err){
    if(err && err.status === 401) return; // api.js already redirected to /login.html
    document.body.innerHTML = `<div class="p-8 text-sm" style="color:var(--red-text)">Failed to load the application: ${err.message}. Check that the server is running and try refreshing.</div>`;
    return;
  }

  renderStats();
  updateSortArrows();
  renderTable();
  switchView('talents');
}
bootstrap();
