/* Thin fetch() wrapper for the real backend API. Talks to the same origin the page is served
   from, so no CORS/base-URL configuration is needed. */

const DATE_FIELDS = [
  "dateOfBirth", "contractStart", "contractEnd", "passIssueDate", "passExpiry", "ipaDate",
  "passportExpiry", "policyIssueDate", "policyExpiry", "talentInvoiceDate", "talentInvoiceDueDate",
  "talentInvoicePaidDate", "timesheetMonth", "submissionDate", "approvalDate", "lastWorkingDay",
  "workPassCancellationDate",
];

/* Converts ISO date strings coming back from the JSON API into real Date objects, since the
   existing render/computeDerived logic (ported unchanged from the mockup) does date arithmetic
   directly on these fields (e.g. `c.contractEnd - today`). */
function normalizeTalentDates(raw) {
  const out = { ...raw };
  for (const key of DATE_FIELDS) {
    if (out[key]) out[key] = new Date(out[key]);
  }
  return out;
}

const SOW_PO_DATE_FIELDS = ["dateOfCommencement", "dateOfCompletion", "validTo", "poReceivedDate", "month"];
function normalizeRecordDates(raw) {
  const out = { ...raw };
  for (const key of SOW_PO_DATE_FIELDS) {
    if (out[key]) out[key] = new Date(out[key]);
  }
  return out;
}

const CLIENT_BILLING_DATE_FIELDS = ["billableStart", "billableEnd", "invoiceDate", "clientPaymentDueDate", "clientPaymentReceivedDate"];
function normalizeClientDates(raw) {
  const out = { ...raw };
  if (out.billing) {
    out.billing = { ...out.billing };
    for (const key of CLIENT_BILLING_DATE_FIELDS) {
      if (out.billing[key]) out.billing[key] = new Date(out.billing[key]);
    }
  }
  return out;
}

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function request(path, options = {}) {
  const res = await fetch(`/api${path}`, {
    credentials: "same-origin",
    headers: options.body ? { "Content-Type": "application/json" } : undefined,
    ...options,
  });
  if (res.status === 401) {
    window.location.href = "/login.html";
    throw new ApiError("Not authenticated", 401);
  }
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {}
    throw new ApiError(message, res.status);
  }
  if (res.status === 204) return null;
  return res.json();
}

const api = {
  auth: {
    login: (email, password) => request("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
    verifyCode: (code) => request("/auth/verify-code", { method: "POST", body: JSON.stringify({ code }) }),
    resendCode: () => request("/auth/resend-code", { method: "POST" }),
    logout: () => request("/auth/logout", { method: "POST" }),
    me: () => request("/auth/me"),
    changePassword: (currentPassword, newPassword) => request("/auth/change-password", { method: "POST", body: JSON.stringify({ currentPassword, newPassword }) }),
    verifyPassword: (password) => request("/auth/verify-password", { method: "POST", body: JSON.stringify({ password }) }),
  },
  talents: {
    list: async () => (await request("/talents")).map(normalizeTalentDates),
    get: async (id) => normalizeTalentDates(await request(`/talents/${id}`)),
    create: async (payload) => normalizeTalentDates(await request("/talents", { method: "POST", body: JSON.stringify(payload) })),
    updatePersonal: async (id, payload) => normalizeTalentDates(await request(`/talents/${id}/personal`, { method: "PATCH", body: JSON.stringify(payload) })),
    updateContract: async (id, payload) => normalizeTalentDates(await request(`/talents/${id}/contract`, { method: "PATCH", body: JSON.stringify(payload) })),
    updateWorkPass: async (id, payload) => normalizeTalentDates(await request(`/talents/${id}/workpass`, { method: "PATCH", body: JSON.stringify(payload) })),
    updateInsurance: async (id, payload) => normalizeTalentDates(await request(`/talents/${id}/insurance`, { method: "PATCH", body: JSON.stringify(payload) })),
    updatePayroll: async (id, payload) => normalizeTalentDates(await request(`/talents/${id}/payroll`, { method: "PATCH", body: JSON.stringify(payload) })),
    updateBilling: async (id, payload) => normalizeTalentDates(await request(`/talents/${id}/billing`, { method: "PATCH", body: JSON.stringify(payload) })),
    updateLeaveTimesheet: async (id, payload) => normalizeTalentDates(await request(`/talents/${id}/leave-timesheet`, { method: "PATCH", body: JSON.stringify(payload) })),
    updateOffboarding: async (id, payload) => normalizeTalentDates(await request(`/talents/${id}/offboarding`, { method: "PATCH", body: JSON.stringify(payload) })),
    moveToOffboarding: async (id) => normalizeTalentDates(await request(`/talents/${id}/move-to-offboarding`, { method: "POST" })),
    sendContractNotice: async (id) => normalizeTalentDates(await request(`/talents/${id}/contract/notice`, { method: "POST" })),
    sendWorkPassNotice: async (id) => normalizeTalentDates(await request(`/talents/${id}/workpass/notice`, { method: "POST" })),
    sendInsuranceNotice: async (id) => normalizeTalentDates(await request(`/talents/${id}/insurance/notice`, { method: "POST" })),
    remove: (id) => request(`/talents/${id}`, { method: "DELETE" }),
    import: (client, rows) => request("/talents/import", { method: "POST", body: JSON.stringify({ client, rows }) }),
  },
  dashboard: {
    home: () => request("/dashboard/home"),
  },
  lookups: {
    clientNames: () => request("/lookups/client-names"),
    addClientName: (name) => request("/lookups/client-names", { method: "POST", body: JSON.stringify({ name }) }),
    projectTypes: () => request("/lookups/project-types"),
    addProjectType: (name) => request("/lookups/project-types", { method: "POST", body: JSON.stringify({ name }) }),
    entities: () => request("/lookups/entities"),
    addEntity: (name) => request("/lookups/entities", { method: "POST", body: JSON.stringify({ name }) }),
    recruiters: () => request("/lookups/recruiters"),
    addRecruiter: (name) => request("/lookups/recruiters", { method: "POST", body: JSON.stringify({ name }) }),
  },
  clients: {
    list: async () => (await request("/clients")).map(normalizeClientDates),
    create: async (payload) => normalizeClientDates(await request("/clients", { method: "POST", body: JSON.stringify(payload) })),
    update: async (name, payload) => normalizeClientDates(await request(`/clients/${encodeURIComponent(name)}`, { method: "PATCH", body: JSON.stringify(payload) })),
    updateBilling: async (name, payload) => normalizeClientDates(await request(`/clients/${encodeURIComponent(name)}/billing`, { method: "PATCH", body: JSON.stringify(payload) })),
    import: (rows) => request("/clients/import", { method: "POST", body: JSON.stringify({ rows }) }),
  },
  sow: {
    list: async () => (await request("/sow")).map(normalizeRecordDates),
    update: async (id, payload) => normalizeRecordDates(await request(`/sow/${id}`, { method: "PATCH", body: JSON.stringify(payload) })),
    sendNotice: async (id) => normalizeRecordDates(await request(`/sow/${id}/notice`, { method: "POST" })),
    setTalents: async (id, talentIds) => normalizeRecordDates(await request(`/sow/${id}/talents`, { method: "PUT", body: JSON.stringify({ talentIds }) })),
  },
  po: {
    list: async () => (await request("/po")).map(normalizeRecordDates),
    update: async (id, payload) => normalizeRecordDates(await request(`/po/${id}`, { method: "PATCH", body: JSON.stringify(payload) })),
    sendNotice: async (id) => normalizeRecordDates(await request(`/po/${id}/notice`, { method: "POST" })),
    setTalents: async (id, talentIds) => normalizeRecordDates(await request(`/po/${id}/talents`, { method: "PUT", body: JSON.stringify({ talentIds }) })),
  },
  admin: {
    getSettings: () => request("/admin/settings"),
    updateSettings: (payload) => request("/admin/settings", { method: "PATCH", body: JSON.stringify(payload) }),
    listUsers: () => request("/admin/users"),
    updateUserRole: (id, role) => request(`/admin/users/${id}/role`, { method: "PATCH", body: JSON.stringify({ role }) }),
    updateUserActive: (id, active) => request(`/admin/users/${id}/active`, { method: "PATCH", body: JSON.stringify({ active }) }),
  },
};
