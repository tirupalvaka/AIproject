// ==== CONFIG (edit these) =========================================
const CONFIG = {
  tenantId: "YOUR_TENANT_ID",
  clientId: "YOUR_APP_REG_CLIENT_ID",          // SPA app registration
  redirectUri: "http://localhost:5500",        // must be in AAD reply URLs
  clusterUri: "https://<cluster>.<region>.kusto.windows.net",
  database: "aixdb",
  // Scope must target your cluster's resource with .default:
  scopes: ["https://<cluster>.<region>.kusto.windows.net/.default"],
  // KQL snippets:
  qCustomers: `aix_scores | distinct customer | order by customer asc`,
  qParticipantsForCustomer: (customer) => `
    aix_scores
    | where customer == "${customer}"
    | summarize by participant_name, participant_role
    | order by participant_name asc
  `,
  qLatestFor: (customer, participant) => `
    aix_scores
    | where customer == "${customer}" and participant_name == "${participant}"
    | top 1 by timestamp desc
    | project timestamp, session_id, customer, industry, assessment_type,
              participant_name, participant_role, org, overall_score_500, notes
  `,
  qLatestTableForCustomer: (customer) => `
    aix_scores
    | where customer == "${customer}"
    | order by timestamp desc
    | take 50
    | project timestamp, session_id, customer, industry, assessment_type,
              participant_name, participant_role, org, overall_score_500, notes
  `
};
// ===================================================================

const msalInstance = new msal.PublicClientApplication({
  auth: { clientId: CONFIG.clientId, authority: `https://login.microsoftonline.com/${CONFIG.tenantId}`, redirectUri: CONFIG.redirectUri },
  cache: { cacheLocation: "localStorage", storeAuthStateInCookie: false }
});

let activeAccount = null;

const byId = (id)=>document.getElementById(id);
const signinBtn = byId("signinBtn");
const signoutBtn = byId("signoutBtn");
const userLabel = byId("userLabel");
const customerSelect = byId("customerSelect");
const participantSelect = byId("participantSelect");
const refreshBtn = byId("refreshBtn");
const dialCanvas = byId("dial");
const scoreEl = byId("score500");
const levelChip = byId("levelChip");
const latestWhen = byId("latestWhen");
const tableBody = document.querySelector("#sessionsTable tbody");

window.addEventListener("load", async () => {
  msalInstance.handleRedirectPromise().then((resp) => {
    if (resp && resp.account) msalInstance.setActiveAccount(resp.account);
    activeAccount = msalInstance.getActiveAccount();
    toggleAuthUI();
  });

  signinBtn.onclick = signIn;
  signoutBtn.onclick = signOut;
  refreshBtn.onclick = refreshAll;

  if (msalInstance.getActiveAccount()) {
    activeAccount = msalInstance.getActiveAccount();
    toggleAuthUI();
    await loadCustomers();
  }
});

function toggleAuthUI(){
  const acct = msalInstance.getActiveAccount();
  userLabel.textContent = acct ? acct.username : "";
  signinBtn.style.display = acct ? "none" : "inline-block";
  signoutBtn.style.display = acct ? "inline-block" : "none";
}

async function signIn(){
  try{
    await msalInstance.loginRedirect({ scopes: CONFIG.scopes });
  }catch(e){ alert("Sign-in failed: " + e.message); }
}
async function signOut(){
  const acct = msalInstance.getActiveAccount();
  if (!acct) return;
  await msalInstance.logoutRedirect({ account: acct });
}

async function getToken(){
  const acct = msalInstance.getActiveAccount();
  if (!acct) throw new Error("Not signed in.");
  const request = { scopes: CONFIG.scopes, account: acct };
  try{
    const silent = await msalInstance.acquireTokenSilent(request);
    return silent.accessToken;
  }catch{
    const interactive = await msalInstance.acquireTokenPopup(request);
    return interactive.accessToken;
  }
}

async function kustoQuery(kql){
  const token = await getToken();
  const resp = await fetch(`${CONFIG.clusterUri}/v1/rest/query`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ db: CONFIG.database, csl: kql })
  });
  if (!resp.ok){
    const txt = await resp.text();
    throw new Error(`ADX query error ${resp.status}: ${txt}`);
  }
  return resp.json();
}

function rowsFromKusto(json){
  // ADX returns tables[0].rows with columns order in tables[0].columns
  const t = json && json.Tables && json.Tables[0];
  if (!t) return [];
  const cols = t.Columns.map(c=>c.ColumnName);
  return t.Rows.map(r => Object.fromEntries(r.map((v,i)=>[cols[i], v])));
}

async function loadCustomers(){
  customerSelect.innerHTML = "";
  const data = rowsFromKusto(await kustoQuery(CONFIG.qCustomers));
  for (const row of data){
    const opt = document.createElement("option");
    opt.value = row.customer;
    opt.textContent = row.customer;
    customerSelect.appendChild(opt);
  }
  customerSelect.onchange = onCustomerChange;
  participantSelect.onchange = refreshAll;
  if (data.length){ await onCustomerChange(); }
}

async function onCustomerChange(){
  const customer = customerSelect.value;
  participantSelect.innerHTML = "";
  const data = rowsFromKusto(await kustoQuery(CONFIG.qParticipantsForCustomer(customer)));
  for (const row of data){
    const opt = document.createElement("option");
    opt.value = row.participant_name;
    opt.textContent = row.participant_name + (row.participant_role ? ` (${row.participant_role})` : "");
    participantSelect.appendChild(opt);
  }
  await refreshAll();
}

async function refreshAll(){
  const customer = customerSelect.value;
  const participant = participantSelect.value;
  if (!customer || !participant) return;

  // Latest for dial
  const latestRows = rowsFromKusto(await kustoQuery(CONFIG.qLatestFor(customer, participant)));
  if (latestRows.length){
    const r = latestRows[0];
    const score = Number(r.overall_score_500 || 0);
    scoreEl.textContent = Math.round(score);
    latestWhen.textContent = new Date(r.timestamp).toISOString();
    renderDial(score);
    const { level, label, chipClass } = levelFromScore(score);
    levelChip.textContent = `${label}`;
    levelChip.className = `chip ${chipClass}`;
  }else{
    scoreEl.textContent = "—";
    latestWhen.textContent = "—";
    renderDial(0);
    levelChip.textContent = "Level —";
    levelChip.className = "chip";
  }

  // Table
  const tableRows = rowsFromKusto(await kustoQuery(CONFIG.qLatestTableForCustomer(customer)));
  tableBody.innerHTML = "";
  for (const r of tableRows){
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${new Date(r.timestamp).toISOString()}</td>
      <td>${esc(r.session_id)}</td>
      <td>${esc(r.customer)}</td>
      <td>${esc(r.industry ?? "")}</td>
      <td>${esc(r.participant_name ?? "")}</td>
      <td>${esc(r.participant_role ?? "")}</td>
      <td>${esc(r.org ?? "")}</td>
      <td>${esc(r.overall_score_500 ?? "")}</td>
      <td>${esc(r.notes ?? "")}</td>
    `;
    tableBody.appendChild(tr);
  }
}

// Dial (simple semi-gauge)
function renderDial(score){
  const ctx = dialCanvas.getContext("2d");
  const w = dialCanvas.width, h = dialCanvas.height;
  ctx.clearRect(0,0,w,h);

  const cx = w/2, cy = h*0.9, r = Math.min(w, h*2) * 0.45;
  const start = Math.PI, end = 2*Math.PI;
  // track
  ctx.lineWidth = 16;
  ctx.strokeStyle = "#1c2230";
  ctx.beginPath(); ctx.arc(cx, cy, r, start, end); ctx.stroke();

  // value arc
  const pct = Math.max(0, Math.min(1, score/500));
  ctx.strokeStyle = "#7cc3ff";
  ctx.beginPath(); ctx.arc(cx, cy, r, start, start + pct*Math.PI); ctx.stroke();

  // tick
  const ang = start + pct*Math.PI;
  const tx = cx + r*Math.cos(ang), ty = cy + r*Math.sin(ang);
  ctx.fillStyle = "#7cc3ff";
  ctx.beginPath(); ctx.arc(tx, ty, 5, 0, 2*Math.PI); ctx.fill();

  // label
  ctx.fillStyle = "#9aa4b2";
  ctx.font = "12px system-ui";
  ctx.textAlign = "center";
  ctx.fillText("Technical Health", cx, 18);
}

function levelFromScore(score){
  // buckets:
  // 401–500 Level 5 — Leading
  // 301–400 Level 4 — Advanced
  // 201–300 Level 3 — Developing
  // 101–200 Level 2 — Initial
  // 0–100 Level 1 — Not Started
  let level=1, label="Level 1 — Not Started", chipClass="chip-gray";
  if (score>=401){ level=5; label="Level 5 — Leading"; chipClass="chip-green"; }
  else if (score>=301){ level=4; label="Level 4 — Advanced"; chipClass="chip-amber"; }
  else if (score>=201){ level=3; label="Level 3 — Developing"; chipClass="chip-amber"; }
  else if (score>=101){ level=2; label="Level 2 — Initial"; chipClass="chip-amber"; }
  return { level, label, chipClass };
}

function esc(s){ return String(s??"").replace(/[&<>"']/g,m=>({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[m])); }

