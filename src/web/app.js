'use strict'

/* Excellency School of Management — Placement Cell (basic HTML build for EC2).
   Vanilla JS, no build step. Synthetic data only; nothing is sent anywhere. */

var COURSES = ['MBA', 'MSc', 'Executive MBA']
var BACHELORS = ['B.Tech / B.E.', 'B.Sc', 'B.Com', 'B.A', 'BBA', 'BCA', 'B.Arch', 'MBBS', 'B.Pharm', 'LLB', 'B.Ed', 'Other']
var CGPA_SCALES = ['Out of 10', 'Out of 4', 'Percentage']
var STREAMS = ['Science (PCM)', 'Science (PCB)', 'Commerce', 'Arts / Humanities', 'Vocational']
var DOMAINS = ['IT', 'Automotive', 'FMCG', 'Consulting', 'Agriculture', 'Finance & Banking', 'General Management', 'R&D', 'Healthcare', 'Retail', 'Telecom', 'Energy', 'E-commerce', 'Manufacturing']
var EXPERIENCE_YEARS = Array.from({ length: 20 }, function (_, i) { return String(i + 1) })
var GRAD_YEARS = Array.from({ length: 2026 - 1990 + 1 }, function (_, i) { return String(2026 - i) })
var SECURITY_QUESTIONS = ['What was the name of your first school?', "What is your mother's maiden name?", 'What was the name of your first pet?', 'In which city were you born?', 'What is your favourite book or film?']
var INDIAN_STATES = ['Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry']

var view = document.getElementById('view')
var userArea = document.getElementById('userArea')
var captchaCode = ''
var experienceCount = 1
var currentUser = null
var editingOpening = null

// Local stand-in for the future registrations table. Primary key: email (@esm.com).
var REG_KEY = 'esm_registrations'
var PROFILE_KEY = 'esm_profiles'
var OPENINGS_KEY = 'esm_openings'
var APPS_KEY = 'esm_applications'

// --- Backend API (shared across both frontends) with localStorage fallback ---
var API_BASE = 'http://localhost:8081'
var apiHealthyCache = null
function apiHealthy() {
  if (apiHealthyCache !== null) return Promise.resolve(apiHealthyCache)
  return fetch(API_BASE + '/healthz').then(function (r) { apiHealthyCache = r.ok; return apiHealthyCache }).catch(function () { apiHealthyCache = false; return false })
}
function apiReq(path, opts) {
  opts = opts || {}
  opts.headers = Object.assign({ 'Content-Type': 'application/json' }, opts.headers || {})
  return fetch(API_BASE + path, opts).then(function (r) {
    return r.text().then(function (t) {
      var data = t ? JSON.parse(t) : null
      if (!r.ok) { var e = new Error('api'); e.status = r.status; e.body = data; throw e }
      return data
    })
  })
}

// Session persistence so a page refresh keeps the user on the same page.
var SESSION_KEY = 'esm_session'
function saveSession(s) { localStorage.setItem(SESSION_KEY, JSON.stringify(s)) }
function readSession() { try { return JSON.parse(localStorage.getItem(SESSION_KEY)) } catch (e) { return null } }
function clearSession() { localStorage.removeItem(SESSION_KEY) }

function readReg() { try { return JSON.parse(localStorage.getItem(REG_KEY)) || {} } catch (e) { return {} } }
function writeReg(m) { localStorage.setItem(REG_KEY, JSON.stringify(m)) }
function normAns(a) { return String(a == null ? '' : a).trim().toLowerCase() }
function localAddReg(r) { var m = readReg(); var k = r.email.toLowerCase(); if (m[k]) return false; m[k] = { email: k, firstName: r.firstName, lastName: r.lastName, password: r.password, security: r.security || [] }; writeReg(m); return true }
function localVerify(email, password) { var rec = readReg()[email.toLowerCase()]; return rec && rec.password === password ? { email: rec.email, firstName: rec.firstName, lastName: rec.lastName } : null }

function readProfiles() { try { return JSON.parse(localStorage.getItem(PROFILE_KEY)) || {} } catch (e) { return {} } }
function writeProfiles(m) { localStorage.setItem(PROFILE_KEY, JSON.stringify(m)) }

var STATUS_LABEL = { applied: 'Applied', written_test: 'Selected for Written Test', interview: 'Selected for Interview', offer: 'Offer Extended', withdrawn: 'Withdrawn', accepted: 'Offer Accepted', declined: 'Offer Declined', rejected: 'Rejected' }
var STAGE_AT = { applied: 'Application', written_test: 'Written Test', interview: 'Interview', offer: 'Offer' }
function ctcValue(s) { var n = parseFloat(String(s == null ? '' : s).replace(/[^0-9.]/g, '')); return isNaN(n) ? 0 : n }
function statusText(a) { return a.status === 'rejected' ? ('Rejected' + (a.rejectedAt ? ' at ' + (STAGE_AT[a.rejectedAt] || a.rejectedAt) : '')) : (STATUS_LABEL[a.status] || a.status) }
var applyMsg = ''
var DEFAULT_OPENINGS = [
  { id: 'infosys-se', company: 'Infosys', role: 'Systems Engineer', location: 'Bengaluru', ctc: '6.5 LPA', deadline: '2026-10-05', demoStage: 'written_test', test: { venue: 'Room C-204, Academic Block', time: '2026-10-06, 09:30 AM' } },
  { id: 'deloitte-ba', company: 'Deloitte', role: 'Business Analyst', location: 'Hyderabad', ctc: '9 LPA', deadline: '2026-10-08', demoStage: 'interview', interview: { venue: 'Boardroom 2, Admin Block', time: '2026-10-11, 11:00 AM' } },
  { id: 'hdfc-mt', company: 'HDFC Bank', role: 'Management Trainee', location: 'Mumbai', ctc: '8 LPA', deadline: '2026-10-10', demoStage: 'offer' },
  { id: 'flipkart-apm', company: 'Flipkart', role: 'Associate Product Manager', location: 'Bengaluru', ctc: '14 LPA', deadline: '2026-10-12' },
  { id: 'tcs-digital', company: 'TCS', role: 'Digital Cadre Engineer', location: 'Pune', ctc: '7 LPA', deadline: '2026-10-14', demoStage: 'applied' },
  { id: 'accenture-ad', company: 'Accenture', role: 'Application Developer', location: 'Bengaluru', ctc: '8.5 LPA', deadline: '2026-10-15', demoStage: 'applied' },
  { id: 'amazon-sde', company: 'Amazon', role: 'SDE I', location: 'Hyderabad', ctc: '22 LPA', deadline: '2026-10-16', demoStage: 'written_test', test: { venue: 'Lab 1, Innovation Centre', time: '2026-10-18, 10:00 AM' } },
  { id: 'goldman-analyst', company: 'Goldman Sachs', role: 'Analyst', location: 'Bengaluru', ctc: '20 LPA', deadline: '2026-10-17', demoStage: 'applied' },
  { id: 'mckinsey-ba', company: 'McKinsey', role: 'Business Analyst', location: 'Gurugram', ctc: '16 LPA', deadline: '2026-10-18', demoStage: 'interview', interview: { venue: 'Conference Room A, Corporate Tower', time: '2026-10-20, 02:00 PM' } },
  { id: 'itc-mt', company: 'ITC Limited', role: 'Management Trainee', location: 'Kolkata', ctc: '12 LPA', deadline: '2026-10-19', demoStage: 'applied' },
  { id: 'nestle-me', company: 'Nestle India', role: 'Management Executive', location: 'Gurugram', ctc: '10 LPA', deadline: '2026-10-20', demoStage: 'applied' }
]
var ALUMNI = { Infosys: [{ name: 'Rahul Nair', role: 'Senior Engineer' }, { name: 'Meera Das', role: 'Delivery Lead' }], Deloitte: [{ name: 'Ananya Rao', role: 'Consultant' }, { name: 'Karthik V', role: 'Manager' }], 'HDFC Bank': [{ name: 'Vikram Singh', role: 'Branch Manager' }], Flipkart: [{ name: 'Sara Khan', role: 'Product Manager' }], TCS: [{ name: 'Deepak Menon', role: 'Systems Engineer' }], Accenture: [{ name: 'Ritu Bansal', role: 'Team Lead' }], Amazon: [{ name: 'Nikhil Rao', role: 'SDE II' }], 'Goldman Sachs': [{ name: 'Aisha Kapoor', role: 'Associate' }], McKinsey: [{ name: 'Rohit Malhotra', role: 'Engagement Manager' }], 'ITC Limited': [{ name: 'Sneha Pillai', role: 'Brand Manager' }], 'Nestle India': [{ name: 'Arvind Kumar', role: 'Category Head' }] }
function localOpenings() { try { var s = JSON.parse(localStorage.getItem(OPENINGS_KEY)); if (Array.isArray(s) && s.length) return s } catch (e) {} return DEFAULT_OPENINGS }
function setOpeningsStore(list) { localStorage.setItem(OPENINGS_KEY, JSON.stringify(list)) }
function localAddOpening(o) { var l = localOpenings().slice(); l.unshift(o); setOpeningsStore(l); return l }
function localRemoveOpening(id) { var l = localOpenings().filter(function (o) { return o.id !== id }); setOpeningsStore(l); return l }
function getAlumniFor(company) { return ALUMNI[company] || [] }
function readAppsStore() { try { return JSON.parse(localStorage.getItem(APPS_KEY)) || {} } catch (e) { return {} } }
function writeAppsStore(m) { localStorage.setItem(APPS_KEY, JSON.stringify(m)) }
function localApplications(email) { if (!email) return []; var rec = readAppsStore()[email.toLowerCase()] || {}; return Object.keys(rec).map(function (k) { return rec[k] }) }
function localApply(email, id) { var m = readAppsStore(); var k = email.toLowerCase(); var rec = m[k] || {}; if (!rec[id]) { var o = localOpenings().filter(function (x) { return x.id === id })[0] || { id: id, company: id, role: '' }; rec[id] = { id: id, company: o.company, role: o.role, ctc: o.ctc || '', status: 'applied', test: o.test || null, interview: o.interview || null, rejectedAt: null }; m[k] = rec; writeAppsStore(m) } return localApplications(email) }
function localUpdate(email, id, patch) {
  var m = readAppsStore(); var k = email.toLowerCase(); var rec = m[k] || {}
  if (rec[id]) { Object.keys(patch).forEach(function (p) { rec[id][p] = patch[p] }); m[k] = rec }
  if (patch.status === 'accepted') {
    var active = ['applied', 'written_test', 'interview', 'offer']
    Object.keys(rec).forEach(function (oid) { if (oid !== id && active.indexOf(rec[oid].status) !== -1) { rec[oid].rejectedAt = rec[oid].status; rec[oid].status = 'rejected' } })
    m[k] = rec
  }
  writeAppsStore(m)
  return localApplications(email)
}
function stageLabel(v) { return ({ applied: 'Applications open', written_test: 'Written test', interview: 'Interview', offer: 'Offer' })[v] || v }
var STAGE_ORDER = ['applied', 'written_test', 'interview', 'offer']
function nextStage(s) { var i = STAGE_ORDER.indexOf(s); return i >= 0 && i < STAGE_ORDER.length - 1 ? STAGE_ORDER[i + 1] : null }
function localSetStage(id, stage, detail) {
  var l = localOpenings().map(function (o) { if (o.id === id) { var n = {}; for (var k in o) n[k] = o[k]; n.demoStage = stage; if (detail && detail.test) n.test = detail.test; if (detail && detail.interview) n.interview = detail.interview; return n } return o })
  setOpeningsStore(l)
  var m = readAppsStore(); var terminal = ['withdrawn', 'accepted', 'declined']
  Object.keys(m).forEach(function (email) { var rec = m[email]; if (rec[id] && terminal.indexOf(rec[id].status) === -1) { rec[id].status = stage; if (detail && detail.test) rec[id].test = detail.test; if (detail && detail.interview) rec[id].interview = detail.interview } })
  writeAppsStore(m)
  return l
}
function localApplicants(id) {
  var m = readAppsStore(); var regs = readReg(); var out = []
  Object.keys(m).forEach(function (email) { var rec = m[email][id]; if (rec) { var r = regs[email] || {}; var name = (r.firstName || r.lastName) ? ((r.firstName || '') + ' ' + (r.lastName || '')).trim() : email; out.push({ email: email, name: name, status: rec.status }) } })
  return out
}

// Async, API-first store functions used by the UI (fall back to localStorage).
function registerStudent(r) {
  return apiHealthy().then(function (h) {
    if (h) return apiReq('/api/auth/register', { method: 'POST', body: JSON.stringify(r) }).then(function () { return { ok: true } }).catch(function (e) { if (e.status === 409) return { ok: false }; return localAddReg(r) ? { ok: true } : { ok: false } })
    return localAddReg(r) ? { ok: true } : { ok: false }
  })
}
function loginUser(email, password) {
  return apiHealthy().then(function (h) {
    if (h) return apiReq('/api/auth/login', { method: 'POST', body: JSON.stringify({ email: email, password: password }) }).catch(function (e) { if (e.status === 401) return null; return localVerify(email, password) })
    return localVerify(email, password)
  })
}
var ADMIN_EMAILS = ['sam@esm.com', 'kunal@esm.com']
var ADMIN_PASSWORD = 'iitroorkee21'
function adminLogin(email, password) {
  var mail = String(email || '').trim().toLowerCase()
  function local() { return (ADMIN_EMAILS.indexOf(mail) !== -1 && password === ADMIN_PASSWORD) ? { email: mail, role: 'admin' } : null }
  return apiHealthy().then(function (h) {
    if (h) return apiReq('/api/auth/admin-login', { method: 'POST', body: JSON.stringify({ email: mail, password: password }) }).catch(function (e) { if (e.status === 401) return null; return local() })
    return local()
  })
}
function getSecurityQuestions(email) {
  return apiHealthy().then(function (h) {
    if (h) return apiReq('/api/auth/security-questions/' + encodeURIComponent(email)).then(function (r) { return r.questions }).catch(function (e) { if (e.status === 404) return null; var rec = readReg()[email.toLowerCase()]; return rec && rec.security && rec.security.length ? rec.security.map(function (s) { return s.question }) : null })
    var rec = readReg()[email.toLowerCase()]
    return rec && rec.security && rec.security.length ? rec.security.map(function (s) { return s.question }) : null
  })
}
function resetPassword(email, answers, newPassword) {
  function local() {
    var m = readReg(); var k = email.toLowerCase(); var rec = m[k]
    if (!rec || !rec.security || !rec.security.length) return { ok: false, reason: 'not_found' }
    var ok = rec.security.length === answers.length && rec.security.every(function (s, i) { return normAns(s.answer) === normAns(answers[i]) })
    if (!ok) return { ok: false, reason: 'answers' }
    rec.password = newPassword; m[k] = rec; writeReg(m); return { ok: true }
  }
  return apiHealthy().then(function (h) {
    if (h) return apiReq('/api/auth/reset-password', { method: 'POST', body: JSON.stringify({ email: email, answers: answers, newPassword: newPassword }) }).then(function () { return { ok: true } }).catch(function (e) { if (e.status === 401) return { ok: false, reason: 'answers' }; if (e.status === 404) return { ok: false, reason: 'not_found' }; if (e.status === 400) return { ok: false, reason: 'weak' }; return local() })
    return local()
  })
}
function getProfile(email) {
  return apiHealthy().then(function (h) {
    if (h) return apiReq('/api/profiles/' + encodeURIComponent(email)).catch(function (e) { if (e.status === 404) return null; return readProfiles()[email.toLowerCase()] || null })
    return readProfiles()[email.toLowerCase()] || null
  })
}
function saveProfile(email, data) {
  return apiHealthy().then(function (h) {
    if (h) return apiReq('/api/profiles/' + encodeURIComponent(email), { method: 'PUT', body: JSON.stringify(data) }).catch(function () { var m = readProfiles(); m[email.toLowerCase()] = data; writeProfiles(m); return data })
    var m = readProfiles(); m[email.toLowerCase()] = data; writeProfiles(m); return data
  })
}
function isProfileComplete(email) { return getProfile(email).then(function (p) { return Boolean(p) }) }
function getOpenings() {
  return apiHealthy().then(function (h) {
    if (h) return apiReq('/api/openings').catch(function () { return localOpenings() })
    return localOpenings()
  })
}
function addOpening(o) {
  return apiHealthy().then(function (h) {
    if (h) return apiReq('/api/openings', { method: 'POST', body: JSON.stringify(o) }).then(function () { return apiReq('/api/openings') }).catch(function () { return localAddOpening(o) })
    return localAddOpening(o)
  })
}
function removeOpening(id) {
  return apiHealthy().then(function (h) {
    if (h) return apiReq('/api/openings/' + encodeURIComponent(id), { method: 'DELETE' }).then(function () { return apiReq('/api/openings') }).catch(function () { return localRemoveOpening(id) })
    return localRemoveOpening(id)
  })
}
function updateOpeningStage(id, stage, detail) {
  var body = { demoStage: stage }
  if (detail && detail.test) body.test = detail.test
  if (detail && detail.interview) body.interview = detail.interview
  return apiHealthy().then(function (h) {
    if (h) return apiReq('/api/openings/' + encodeURIComponent(id), { method: 'PATCH', body: JSON.stringify(body) }).then(function () { return apiReq('/api/openings') }).catch(function () { return localSetStage(id, stage, detail) })
    return localSetStage(id, stage, detail)
  })
}
function getApplicants(id) {
  return apiHealthy().then(function (h) {
    if (h) return apiReq('/api/openings/' + encodeURIComponent(id) + '/applicants').catch(function () { return localApplicants(id) })
    return localApplicants(id)
  })
}
function localUpdateOpeningMeta(id, patch) {
  var l = localOpenings().map(function (o) { if (o.id === id) { var n = {}; for (var k in o) n[k] = o[k]; for (var p in patch) n[p] = patch[p]; return n } return o })
  setOpeningsStore(l)
  if (patch.company !== undefined || patch.role !== undefined) {
    var m = readAppsStore()
    Object.keys(m).forEach(function (email) { var rec = m[email]; if (rec[id]) { if (patch.company !== undefined) rec[id].company = patch.company; if (patch.role !== undefined) rec[id].role = patch.role } })
    writeAppsStore(m)
  }
  return l
}
function updateOpening(id, patch) {
  return apiHealthy().then(function (h) {
    if (h) return apiReq('/api/openings/' + encodeURIComponent(id), { method: 'PATCH', body: JSON.stringify(patch) }).then(function () { return apiReq('/api/openings') }).catch(function () { return localUpdateOpeningMeta(id, patch) })
    return localUpdateOpeningMeta(id, patch)
  })
}
function getApplications(email) {
  if (!email) return Promise.resolve([])
  return apiHealthy().then(function (h) {
    if (h) return apiReq('/api/applications/' + encodeURIComponent(email)).catch(function () { return localApplications(email) })
    return localApplications(email)
  })
}
function applyTo(email, id) {
  function local() {
    var apps = localApplications(email)
    if (apps.some(function (a) { return a.status === 'accepted' })) return { ok: false, reason: 'offer_accepted' }
    var floor = apps.filter(function (a) { return a.status === 'declined' }).reduce(function (mx, a) { return Math.max(mx, ctcValue(a.ctc)) }, 0)
    var o = localOpenings().filter(function (x) { return x.id === id })[0] || {}
    if (floor > 0 && ctcValue(o.ctc) < floor) return { ok: false, reason: 'below_declined_floor', floor: floor }
    return { ok: true, applications: localApply(email, id) }
  }
  return apiHealthy().then(function (h) {
    if (h) return apiReq('/api/applications/' + encodeURIComponent(email) + '/apply', { method: 'POST', body: JSON.stringify({ openingId: id }) }).then(function (applications) { return { ok: true, applications: applications } }).catch(function (e) {
      if (e && e.status === 409) return { ok: false, reason: (e.body && e.body.error) || 'blocked', floor: e.body && e.body.floor }
      if (e && e.status) return { ok: false, reason: 'blocked' }
      return local()
    })
    return local()
  })
}
function updateApplication(email, id, patch) {
  return apiHealthy().then(function (h) {
    if (h) return apiReq('/api/applications/' + encodeURIComponent(email) + '/' + encodeURIComponent(id), { method: 'PATCH', body: JSON.stringify({ status: patch.status }) }).catch(function () { return localUpdate(email, id, patch) })
    return localUpdate(email, id, patch)
  })
}

function escapeHtml(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
    return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]
  })
}

function renderUserArea() {
  if (!currentUser) { userArea.innerHTML = ''; return }
  if (currentUser.role === 'admin') {
    userArea.innerHTML = '<button class="link-btn light" id="logoutBtn">Log out</button>'
    document.getElementById('logoutBtn').onclick = doLogout
  } else {
    var name = (currentUser.firstName + ' ' + currentUser.lastName).trim()
    userArea.innerHTML = '<div class="user-menu"><button class="name-btn" id="nameBtn"><span class="avatar">' + ((name.charAt(0) || '?').toUpperCase()) + '</span>' + escapeHtml(name) + '</button><div class="menu" id="userMenu" hidden><button class="link-btn danger" id="logoutBtn">Log out</button></div></div>'
    document.getElementById('nameBtn').onclick = function () { var m = document.getElementById('userMenu'); m.hidden = !m.hidden }
    document.getElementById('logoutBtn').onclick = doLogout
  }
}

function doLogout() { clearSession(); currentUser = null; renderUserArea(); showLogin() }

function options(list, selected) {
  return '<option value="">Select</option>' + list.map(function (o) {
    return '<option' + (o === selected ? ' selected' : '') + '>' + o + '</option>'
  }).join('')
}

function randomCode(len) {
  var chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
  var s = ''
  for (var i = 0; i < (len || 5); i++) s += chars[Math.floor(Math.random() * chars.length)]
  return s
}

function drawCaptcha() {
  captchaCode = randomCode(5)
  var canvas = document.getElementById('captchaCanvas')
  if (!canvas) return
  var ctx = canvas.getContext('2d')
  ctx.fillStyle = '#eef1f7'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  for (var i = 0; i < 6; i++) {
    ctx.strokeStyle = 'rgba(20,40,80,0.15)'
    ctx.beginPath()
    ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height)
    ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height)
    ctx.stroke()
  }
  for (var j = 0; j < captchaCode.length; j++) {
    ctx.save()
    ctx.font = 'bold ' + (26 + Math.random() * 6) + 'px Georgia'
    ctx.fillStyle = 'hsl(' + (Math.random() * 220) + ', 60%, 30%)'
    ctx.translate(18 + j * 30, 34 + (Math.random() * 8 - 4))
    ctx.rotate((Math.random() - 0.5) * 0.5)
    ctx.fillText(captchaCode[j], 0, 0)
    ctx.restore()
  }
}

function showLogin() {
  currentUser = null
  renderUserArea()
  view.innerHTML =
    '<div class="login-wrap"><div class="login-card">' +
    '<h2>Sign in</h2><p class="muted">Choose how you want to sign in to the Placement Cell.</p>' +
    '<div class="role-row" role="radiogroup" aria-label="Login role">' +
    '<label class="role"><input type="radio" name="role" value="student"><span>Student Login</span></label>' +
    '<label class="role"><input type="radio" name="role" value="admin"><span>Admin Member Login</span></label>' +
    '</div><div id="credentials"></div>' +
    '<div class="signup-cta"><span class="muted">New student?</span><button type="button" class="secondary" id="signupBtn">Sign up for 2026-27</button></div>' +
    '</div></div>'

  document.getElementById('signupBtn').addEventListener('click', showSignup)
  var radios = view.querySelectorAll('input[name="role"]')
  radios.forEach(function (r) {
    r.addEventListener('change', function () {
      view.querySelectorAll('.role').forEach(function (el) { el.classList.remove('active') })
      r.closest('.role').classList.add('active')
      renderCredentials(r.value)
    })
  })
}

function renderCredentials(role) {
  var box = document.getElementById('credentials')
  box.innerHTML =
    '<form class="login-form" id="loginForm">' +
    '<label>Username<input id="username" placeholder="enter your email id" autocomplete="username"></label>' +
    '<label>Password<input id="password" type="password" autocomplete="current-password"></label>' +
    '<div class="captcha"><span class="field-label">Captcha</span>' +
    '<div class="captcha-row"><canvas id="captchaCanvas" width="170" height="50" aria-label="Captcha image"></canvas>' +
    '<button type="button" class="link-btn" id="refreshCaptcha" aria-label="Refresh captcha">&#8635;</button></div>' +
    '<input id="captchaEntry" placeholder="Enter the characters above" aria-label="Captcha answer"></div>' +
    '<p class="error" id="loginError" role="alert" hidden></p>' +
    '<button type="submit" class="primary">Login</button>' +
    (role === 'student' ? '<button type="button" class="link-btn" id="forgotBtn">Forgot password?</button>' : '') +
    '</form>'

  drawCaptcha()
  document.getElementById('refreshCaptcha').addEventListener('click', drawCaptcha)
  if (role === 'student') { document.getElementById('forgotBtn').addEventListener('click', showForgot) }
  document.getElementById('loginForm').addEventListener('submit', function (e) {
    e.preventDefault()
    var err = document.getElementById('loginError')
    var user = document.getElementById('username').value.trim()
    var pass = document.getElementById('password').value.trim()
    var entry = document.getElementById('captchaEntry').value.trim().toUpperCase()
    if (!user || !pass) { err.textContent = 'Enter your credentials.'; err.hidden = false; return }
    if (entry !== captchaCode) { err.textContent = 'Captcha does not match. Please try again.'; err.hidden = false; drawCaptcha(); return }
    if (role === 'student') {
      loginUser(user, pass).then(function (rec) {
        if (!rec) { err.textContent = 'No matching registration for this email and password. Please sign up first.'; err.hidden = false; return }
        err.hidden = true
        currentUser = { role: 'student', email: rec.email, firstName: rec.firstName, lastName: rec.lastName }
        saveSession({ role: 'student', user: { email: rec.email, firstName: rec.firstName, lastName: rec.lastName } })
        renderUserArea()
        isProfileComplete(rec.email).then(function (done) { if (done) showDashboard(); else showStudent(currentUser) })
      })
      return
    }
    adminLogin(user, pass).then(function (admin) {
      if (!admin) { err.textContent = 'These credentials are not authorised for admin access.'; err.hidden = false; return }
      err.hidden = true
      currentUser = { role: 'admin', firstName: 'Admin', lastName: '' }
      saveSession({ role: 'admin' })
      renderUserArea()
      showAdmin()
    })
  })
}

function experienceCard(i) {
  return '<div class="exp-card" data-exp="' + i + '">' +
    '<div class="exp-head"><strong>Experience ' + (i + 1) + '</strong>' +
    (i > 0 ? '<button type="button" class="link-btn danger" data-remove="' + i + '">Remove</button>' : '') + '</div>' +
    '<div class="grid-3">' +
    '<label>Company Name<input></label>' +
    '<label>Years of Experience<select>' + options(EXPERIENCE_YEARS) + '</select></label>' +
    '<label>Domain Experience<select multiple>' + DOMAINS.map(function (d) { return '<option>' + d + '</option>' }).join('') + '</select></label>' +
    '</div></div>'
}

function studentFormHtml(savedCourse, isEdit) {
  return '<form class="student-form" id="studentForm">' +
    '<section class="card"><h3>Personal Details</h3><div class="grid-3">' +
    '<label>First Name<input required value="' + escapeHtml(currentUser ? currentUser.firstName : '') + '"></label>' +
    '<label>Last Name<input required value="' + escapeHtml(currentUser ? currentUser.lastName : '') + '"></label>' +
    '<label>Email<input readonly value="' + escapeHtml(currentUser ? currentUser.email : '') + '"></label>' +
    '<label>Course<select id="courseSelect" required>' + options(COURSES, savedCourse || '') + '</select></label>' +
    '</div></section>' +

    '<section class="card"><h3>Education</h3>' +
    '<h4>Bachelor\u2019s Degree</h4><div class="grid-3">' +
    '<label>Field<select>' + options(BACHELORS) + '</select></label>' +
    '<label>CGPA / Marks<input placeholder="e.g. 8.4"></label>' +
    '<label>CGPA Scale<select>' + options(CGPA_SCALES) + '</select></label>' +
    '<label>Year of Graduating<select id="grad_year">' + options(GRAD_YEARS) + '</select></label>' +
    '<label>University Name<input></label>' +
    '<label>University State<select>' + options(INDIAN_STATES) + '</select></label>' +
    '</div>' +
    '<h4>Class XII (10+2)</h4><div class="grid-3">' +
    '<label>Stream<select>' + options(STREAMS) + '</select></label>' +
    '<label>Board<input placeholder="e.g. CBSE"></label>' +
    '<label>Percentage / CGPA<input placeholder="e.g. 88%"></label>' +
    '<label>Year of Passing<select id="x12_year">' + options(GRAD_YEARS) + '</select></label>' +
    '<label>School Name<input></label>' +
    '<label>School State<select>' + options(INDIAN_STATES) + '</select></label>' +
    '</div>' +
    '<h4>Class X (10th)</h4><div class="grid-3">' +
    '<label>Board<input placeholder="e.g. ICSE"></label>' +
    '<label>Percentage / CGPA<input placeholder="e.g. 90%"></label>' +
    '<label>Year of Passing<select id="x10_year">' + options(GRAD_YEARS) + '</select></label>' +
    '<label>School Name<input></label>' +
    '<label>School State<select>' + options(INDIAN_STATES) + '</select></label>' +
    '</div></section>' +

    '<section class="card"><h3>Professional Details</h3>' +
    '<div class="role-row">' +
    '<label class="role active"><input type="radio" name="expType" value="fresher" checked><span>Fresher</span></label>' +
    '<label class="role"><input type="radio" name="expType" value="experienced"><span>Experienced</span></label>' +
    '</div><div id="expArea" hidden><div id="expList">' + experienceCard(0) + '</div>' +
    '<button type="button" class="secondary" id="addExp">+ Add another experience</button></div>' +
    '</section>' +

    '<section class="card"><h3>Resume</h3>' +
    '<label class="file-drop"><input type="file" accept=".pdf,.doc,.docx" id="resume"><span id="resumeName">Upload your resume (PDF or Word)</span></label>' +
    '</section>' +

    '<div class="form-actions"><button type="submit" class="primary lg">' + (isEdit ? 'Save changes' : 'Submit profile') + '</button></div>' +
    '<p class="error" id="eduError" role="alert" hidden></p>' +
    '</form>'
}

function showStudent(profile) {
  getProfile(profile ? profile.email : '').then(function (saved) {
    view.innerHTML =
      '<div class="page-head"><h2>Complete your profile</h2><p class="muted">Fill your details once to access your placement dashboard.</p></div>' +
      studentFormHtml(saved && saved.personal ? saved.personal.course : '', false)
    wireStudentForm(showDashboard)
  })
}

function wireStudentForm(onDone) {
  experienceCount = 1
  var expArea = document.getElementById('expArea')
  view.querySelectorAll('input[name="expType"]').forEach(function (r) {
    r.addEventListener('change', function () {
      view.querySelectorAll('input[name="expType"]').forEach(function (x) { x.closest('.role').classList.remove('active') })
      r.closest('.role').classList.add('active')
      expArea.hidden = r.value !== 'experienced'
    })
  })

  document.getElementById('addExp').addEventListener('click', function () {
    var list = document.getElementById('expList')
    list.insertAdjacentHTML('beforeend', experienceCard(experienceCount))
    experienceCount++
    wireRemoveButtons()
  })
  wireRemoveButtons()

  document.getElementById('resume').addEventListener('change', function (e) {
    var f = e.target.files && e.target.files[0]
    document.getElementById('resumeName').textContent = f ? f.name : 'Upload your resume (PDF or Word)'
  })

  document.getElementById('studentForm').addEventListener('submit', function (e) {
    e.preventDefault()
    var err = document.getElementById('eduError')
    function fail(m) { if (err) { err.textContent = m; err.hidden = false } }
    var y10 = parseInt((document.getElementById('x10_year') || {}).value, 10)
    var y12 = parseInt((document.getElementById('x12_year') || {}).value, 10)
    var yGrad = parseInt((document.getElementById('grad_year') || {}).value, 10)
    if (y10 && y12 && y12 <= y10) return fail('Class XII passing year must be after Class X passing year.')
    if (y12 && yGrad && yGrad <= y12) return fail('Graduation year must be after Class XII passing year.')
    if (y10 && yGrad && yGrad <= y10) return fail('Graduation year must be after Class X passing year.')
    if (err) err.hidden = true
    var courseEl = document.getElementById('courseSelect')
    var course = courseEl ? courseEl.value : ''
    saveProfile(currentUser.email, { completed: true, personal: { firstName: currentUser.firstName, lastName: currentUser.lastName, email: currentUser.email, course: course } }).then(function () { onDone() })
  })
}

function wireRemoveButtons() {
  view.querySelectorAll('[data-remove]').forEach(function (btn) {
    btn.onclick = function () {
      var card = btn.closest('.exp-card')
      if (card) card.remove()
    }
  })
}

var dashActive = localStorage.getItem('esm_dash_section') || 'application'

function showDashboard() {
  localStorage.setItem('esm_dash_section', dashActive)
  renderUserArea()
  var navItems = [['application', 'Application'], ['announcements', 'Announcements'], ['calendar', 'Calendar'], ['alumni', 'Talk to Alumni'], ['upskill', 'Upskill for Next Roll'], ['mock', 'Mock Interview Groups'], ['profile', 'Student Profile']]
  view.innerHTML = '<div class="dash"><aside class="dash-nav" id="dashNav">' +
    navItems.map(function (n) { return '<button class="dash-nav-item' + (n[0] === dashActive ? ' active' : '') + '" data-sec="' + n[0] + '">' + n[1] + '</button>' }).join('') +
    '</aside><section class="dash-main" id="dashMain"></section></div>'
  view.querySelectorAll('#dashNav .dash-nav-item').forEach(function (btn) {
    btn.onclick = function () { dashActive = btn.getAttribute('data-sec'); showDashboard() }
  })
  renderDashSection()
}

function feedCard(title, items) {
  return '<div class="card"><h3>' + title + '</h3><ul class="feed">' + items.map(function (i) { return '<li>' + i + '</li>' }).join('') + '</ul></div>'
}

function applicationHtml(apps, allOpenings) {
  var appliedIds = apps.map(function (a) { return a.id })
  var openings = allOpenings.filter(function (o) { return appliedIds.indexOf(o.id) === -1 })
  var activeCount = apps.filter(function (a) { return ['withdrawn', 'declined', 'rejected'].indexOf(a.status) === -1 }).length

  var html = '<div class="stack">'
  html += '<div class="card"><h3>Application</h3>' +
    '<p class="muted">Welcome back, ' + escapeHtml(currentUser.firstName) + '. Your 2026-27 placement application is active.</p>' +
    '<ul class="status-list"><li><strong>Profile</strong><span class="status">Submitted</span></li>' +
    '<li><strong>Eligibility</strong><span class="status">Verified</span></li>' +
    '<li><strong>Active applications</strong><span>' + activeCount + '</span></li></ul>' +
    '<button class="secondary" data-goto="profile">View / edit profile</button></div>'

  if (apps.length) {
    html += '<div class="card"><h3>Your Applications</h3><p class="muted">Status is updated by the placement cell.</p><div class="app-list">'
    apps.forEach(function (a) {
      html += '<div class="app-row"><div class="app-head"><div><strong>' + escapeHtml(a.company) + '</strong> <span class="opening-role">' + escapeHtml(a.role) + '</span>' + (a.ctc ? '<span class="pkg-chip">' + escapeHtml(a.ctc) + '</span>' : '') + '</div>' +
        '<span class="status badge-' + a.status + '">' + escapeHtml(statusText(a)) + '</span></div>'
      html += '<p class="muted detail">Package &middot; ' + escapeHtml(a.ctc || '\u2014') + '</p>'
      if (a.status === 'written_test' && a.test) html += '<p class="muted detail">Written test &middot; ' + escapeHtml(a.test.venue) + ' &middot; ' + escapeHtml(a.test.time) + '</p>'
      if (a.status === 'interview' && a.interview) html += '<p class="muted detail">Interview &middot; ' + escapeHtml(a.interview.venue) + ' &middot; ' + escapeHtml(a.interview.time) + '</p>'
      if (a.status === 'accepted') html += '<p class="muted detail">You accepted this offer.</p>'
      if (a.status === 'declined') html += '<p class="muted detail">You declined this offer.</p>'
      if (a.status === 'withdrawn') html += '<p class="muted detail">You withdrew this application.</p>'
      if (a.status === 'rejected') html += '<p class="muted detail">Rejected' + (a.rejectedAt ? ' at the ' + escapeHtml(STAGE_AT[a.rejectedAt] || a.rejectedAt) + ' stage' : '') + ' after you accepted another offer.</p>'
      html += '<div class="app-actions">'
      if (['applied', 'written_test', 'interview'].indexOf(a.status) !== -1) html += '<button class="link-btn danger" data-act="withdraw" data-id="' + a.id + '">Withdraw</button>'
      if (a.status === 'interview') html += '<button class="secondary" data-alumni="' + a.id + '">Talk to alumni</button>'
      if (a.status === 'offer') html += '<button class="primary" data-act="accept" data-id="' + a.id + '">Allow offer</button><button class="link-btn danger" data-act="deny" data-id="' + a.id + '">Deny offer</button>'
      html += '</div>'
      html += '<div class="alumni-box" id="alumni-' + a.id + '" hidden><strong>Alumni currently at ' + escapeHtml(a.company) + '</strong>' +
        getAlumniFor(a.company).map(function (al) { return '<div class="alumni-line"><span>' + escapeHtml(al.name) + ' &mdash; ' + escapeHtml(al.role) + '</span><button class="link-btn">Message</button></div>' }).join('') + '</div>'
      html += '</div>'
    })
    html += '</div></div>'
  }

  html += '<div class="card"><h3>Apply &mdash; Open Positions</h3><p class="muted">Companies currently open for application, as published by the placement cell.</p>'
  if (applyMsg) html += '<p class="error" role="alert">' + escapeHtml(applyMsg) + '</p>'
  var hasAccepted = apps.some(function (a) { return a.status === 'accepted' })
  var declinedFloor = apps.filter(function (a) { return a.status === 'declined' }).reduce(function (mx, a) { return Math.max(mx, ctcValue(a.ctc)) }, 0)
  if (hasAccepted) {
    html += '<div class="banner success">You have accepted an offer. Applications are closed.</div>'
  } else {
    html += '<div class="openings">'
    if (declinedFloor > 0) html += '<p class="muted small">You declined an offer worth ' + declinedFloor + ' LPA &mdash; roles below that package are locked.</p>'
    if (openings.length) {
      openings.forEach(function (o) {
        var below = declinedFloor > 0 && ctcValue(o.ctc) < declinedFloor
        html += '<div class="opening"><div class="opening-main"><strong>' + escapeHtml(o.company) + '</strong><span class="opening-role">' + escapeHtml(o.role) + '</span><span class="muted">' + escapeHtml(o.location) + ' &middot; ' + escapeHtml(o.ctc) + ' &middot; Apply by ' + escapeHtml(o.deadline) + '</span></div>' + (below ? '<span class="muted small">Below your declined offer</span>' : '<button class="primary" data-apply="' + o.id + '">Apply</button>') + '</div>'
      })
    } else { html += '<p class="muted">You have applied to all open positions.</p>' }
    html += '</div>'
  }
  html += '</div></div>'
  return html
}

function wireApplication(main) {
  main.querySelectorAll('[data-apply]').forEach(function (b) {
    b.onclick = function () {
      applyTo(currentUser.email, b.getAttribute('data-apply')).then(function (res) {
        if (res && res.ok) { applyMsg = '' }
        else if (res && res.reason === 'offer_accepted') { applyMsg = 'You have accepted an offer \u2014 applications are now closed.' }
        else if (res && res.reason === 'below_declined_floor') { applyMsg = 'You declined a higher offer, so you can only apply to roles paying at least ' + res.floor + ' LPA.' }
        else { applyMsg = 'This application could not be submitted. Please try again.' }
        renderDashSection()
      })
    }
  })
  main.querySelectorAll('[data-act]').forEach(function (b) {
    b.onclick = function () {
      var act = b.getAttribute('data-act'); var id = b.getAttribute('data-id')
      var patch = act === 'withdraw' ? { status: 'withdrawn' } : act === 'accept' ? { status: 'accepted' } : { status: 'declined' }
      updateApplication(currentUser.email, id, patch).then(function () { renderDashSection() })
    }
  })
  main.querySelectorAll('[data-alumni]').forEach(function (b) { b.onclick = function () { var box = document.getElementById('alumni-' + b.getAttribute('data-alumni')); if (box) box.hidden = !box.hidden } })
  main.querySelectorAll('[data-goto]').forEach(function (b) { b.onclick = function () { dashActive = b.getAttribute('data-goto'); showDashboard() } })
}

function renderDashSection() {
  var main = document.getElementById('dashMain')
  if (!main) return
  if (dashActive === 'application') {
    Promise.all([getApplications(currentUser.email), getOpenings()]).then(function (r) { main.innerHTML = applicationHtml(r[0], r[1]); wireApplication(main) })
  }
  else if (dashActive === 'announcements') main.innerHTML = feedCard('Announcements', ['Infosys pre-placement talk &mdash; Friday 3:00 PM.', 'Deloitte drive opens 2 Oct.', 'Resume workshop recording is now available.'])
  else if (dashActive === 'calendar') main.innerHTML = feedCard('Calendar', ['30 Sep &mdash; Aptitude test, 10:00 AM.', '4 Oct &mdash; Group discussions.', '7 Oct &mdash; HR interviews.'])
  else if (dashActive === 'alumni') main.innerHTML = feedCard('Talk to Alumni', ['Priya M. &mdash; Consulting, BCG.', 'Arjun R. &mdash; Finance, HDFC.', 'Sara K. &mdash; Product, Flipkart.'])
  else if (dashActive === 'upskill') main.innerHTML = feedCard('Upskill for Next Roll', ['SQL for Analysts &mdash; 6 hours.', 'Case Interview Prep &mdash; 8 hours.', 'Advanced Excel &mdash; 4 hours.'])
  else if (dashActive === 'mock') main.innerHTML = feedCard('Mock Interview Groups', ['HR round &mdash; Tuesday 5:00 PM.', 'Technical round &mdash; Thursday 6:00 PM.', 'Group discussion &mdash; Saturday 11:00 AM.'])
  else if (dashActive === 'profile') {
    getProfile(currentUser.email).then(function (saved) {
      main.innerHTML = '<div class="page-head"><h2>Student Profile</h2><p class="muted">Review or update your details.</p></div>' + studentFormHtml(saved && saved.personal ? saved.personal.course : '', true)
      wireStudentForm(function () { dashActive = 'application'; showDashboard() })
    })
  }
}

function stageOptions(sel) {
  var stages = [['applied', 'Applications open'], ['written_test', 'Written test'], ['interview', 'Interview'], ['offer', 'Offer rollout']]
  return stages.map(function (s) { return '<option value="' + s[0] + '"' + (s[0] === sel ? ' selected' : '') + '>' + s[1] + '</option>' }).join('')
}

function renderApplicants(id) {
  var box = document.getElementById('applicants-' + id)
  if (!box) return
  getApplicants(id).then(function (list) {
    if (!list.length) { box.innerHTML = '<p class="muted">No students have applied yet.</p>'; return }
    box.innerHTML = list.map(function (a) {
      var nxt = nextStage(a.status)
      var active = ['applied', 'written_test', 'interview', 'offer'].indexOf(a.status) !== -1
      var actions = ''
      if (nxt) actions += '<button class="secondary sm" data-up-email="' + escapeHtml(a.email) + '" data-up-cur="' + a.status + '">Upgrade to ' + (STATUS_LABEL[nxt] || nxt) + '</button>'
      if (active) actions += '<button class="link-btn danger sm" data-rej-email="' + escapeHtml(a.email) + '">Reject</button>'
      if (!nxt && !active) actions += '<span class="muted small">No further stage</span>'
      return '<div class="applicant-card"><div class="applicant-avatar">' + escapeHtml((a.name || '?').charAt(0).toUpperCase()) + '</div>' +
        '<strong>' + escapeHtml(a.name) + '</strong><span class="muted small">' + escapeHtml(a.email) + '</span>' +
        '<span class="status badge-' + a.status + '">' + (STATUS_LABEL[a.status] || a.status) + '</span>' +
        actions +
        '</div>'
    }).join('')
    box.querySelectorAll('[data-up-email]').forEach(function (b) {
      b.onclick = function () {
        var nx = nextStage(b.getAttribute('data-up-cur'))
        if (!nx) return
        updateApplication(b.getAttribute('data-up-email'), id, { status: nx }).then(function () { renderApplicants(id) })
      }
    })
    box.querySelectorAll('[data-rej-email]').forEach(function (b) {
      b.onclick = function () {
        updateApplication(b.getAttribute('data-rej-email'), id, { status: 'rejected' }).then(function () { renderApplicants(id) })
      }
    })
  })
}

function renderOpeningList() {
  var list = document.getElementById('openingList')
  if (!list) return
  getOpenings().then(function (openings) {
    list.innerHTML = openings.map(function (o) {
      var stage = o.demoStage || 'applied'
      if (o.id === editingOpening) {
        return '<div class="opening admin-opening" data-op="' + o.id + '"><div class="admin-form edit-form"><div class="grid-3">' +
          '<label>Company / Title<input class="edit-field" data-f="company" value="' + escapeHtml(o.company || '') + '"></label>' +
          '<label>Role<input class="edit-field" data-f="role" value="' + escapeHtml(o.role || '') + '"></label>' +
          '<label>Location<input class="edit-field" data-f="location" value="' + escapeHtml(o.location || '') + '"></label>' +
          '<label>Package (CTC)<input class="edit-field" data-f="ctc" value="' + escapeHtml(o.ctc || '') + '" placeholder="e.g. 8 LPA"></label>' +
          '<label>Deadline<input class="edit-field" data-f="deadline" type="date" value="' + escapeHtml(o.deadline || '') + '"></label>' +
          '</div><p class="error" data-edit-err role="alert" hidden></p>' +
          '<div class="form-actions"><button class="primary" data-save-op="' + o.id + '">Save changes</button><button class="link-btn" data-cancel-op="' + o.id + '">Cancel</button></div></div></div>'
      }
      return '<div class="opening admin-opening">' +
        '<div class="opening-head"><div class="opening-main"><strong>' + escapeHtml(o.company) + '</strong><span class="opening-role">' + escapeHtml(o.role) + '</span>' +
        '<span class="muted">' + escapeHtml(o.location) + ' &middot; ' + escapeHtml(o.ctc) + ' &middot; Apply by ' + escapeHtml(o.deadline) + '</span></div>' +
        '<div class="opening-controls"><label class="inline-select">Stage<select class="stageSel" data-op="' + o.id + '">' + stageOptions(stage) + '</select></label>' +
        '<button class="link-btn" data-edit-op="' + o.id + '">Edit</button>' +
        '<button class="link-btn danger" data-remove-op="' + o.id + '">Remove</button></div></div>' +
        '<div class="applicants"><span class="field-label">Applicants</span><div class="applicant-slider" id="applicants-' + o.id + '"><p class="muted">Loading&hellip;</p></div></div>' +
        '</div>'
    }).join('')
    list.querySelectorAll('[data-remove-op]').forEach(function (b) { b.onclick = function () { removeOpening(b.getAttribute('data-remove-op')).then(function () { renderOpeningList() }) } })
    list.querySelectorAll('.stageSel').forEach(function (sel) { sel.onchange = function () { var id = sel.getAttribute('data-op'); updateOpeningStage(id, sel.value).then(function () { renderApplicants(id) }) } })
    list.querySelectorAll('[data-edit-op]').forEach(function (b) { b.onclick = function () { editingOpening = b.getAttribute('data-edit-op'); renderOpeningList() } })
    list.querySelectorAll('[data-cancel-op]').forEach(function (b) { b.onclick = function () { editingOpening = null; renderOpeningList() } })
    list.querySelectorAll('[data-save-op]').forEach(function (b) {
      b.onclick = function () {
        var card = b.closest('.admin-opening')
        var patch = {}
        card.querySelectorAll('.edit-field').forEach(function (f) { patch[f.getAttribute('data-f')] = f.value.trim() })
        if (!patch.company || !patch.role) { var e = card.querySelector('[data-edit-err]'); if (e) { e.textContent = 'Company and role are required.'; e.hidden = false } return }
        updateOpening(b.getAttribute('data-save-op'), patch).then(function () { editingOpening = null; renderOpeningList() })
      }
    })
    openings.forEach(function (o) { if (o.id !== editingOpening) renderApplicants(o.id) })
  })
}

function showAdmin() {
  renderUserArea()
  var sample = [['Aarav Sharma', 'MBA', 'Shortlisted'], ['Isha Verma', 'MSc', 'Applied'], ['Rohan Gupta', 'Executive MBA', 'Interview'], ['Neha Iyer', 'MBA', 'Offer']]
  view.innerHTML =
    '<div class="page-head"><h2>Admin Console</h2><p class="muted">Placement cell administration.</p></div>' +
    '<div class="admin stack">' +
    '<div class="card"><h3>Manage Open Positions</h3><p class="muted">Publish a role and set the current stage. Students see these under Apply.</p>' +
    '<form class="admin-form" id="openingForm"><div class="grid-3">' +
    '<label>Company<input id="op_company"></label>' +
    '<label>Role<input id="op_role"></label>' +
    '<label>Location<input id="op_location"></label>' +
    '<label>CTC<input id="op_ctc" placeholder="e.g. 8 LPA"></label>' +
    '<label>Deadline<input id="op_deadline" type="date"></label>' +
    '<label>Stage<select id="op_stage"><option value="applied">Applications open</option><option value="written_test">Written test</option><option value="interview">Interview</option><option value="offer">Offer</option></select></label>' +
    '<label id="venueLabel" hidden>Venue<input id="op_venue" placeholder="e.g. Room C-204"></label>' +
    '<label id="timeLabel" hidden>Date &amp; time<input id="op_time" placeholder="e.g. 2026-10-06, 09:30 AM"></label>' +
    '</div><p class="error" id="opError" role="alert" hidden></p>' +
    '<div class="form-actions"><button type="submit" class="primary">Publish position</button></div></form>' +
    '<div class="openings" id="openingList"></div></div>' +
    '<div class="card"><h3>Student Overview</h3><p class="muted">Synthetic data for the workshop preview.</p>' +
    '<table class="admin-table"><thead><tr><th>Student</th><th>Course</th><th>Status</th></tr></thead><tbody>' +
    sample.map(function (r) { return '<tr><td>' + r[0] + '</td><td>' + r[1] + '</td><td><span class="status">' + r[2] + '</span></td></tr>' }).join('') +
    '</tbody></table></div>' +
    '</div>'

  var stageSel = document.getElementById('op_stage')
  function syncVenue() { var show = stageSel.value === 'written_test' || stageSel.value === 'interview'; document.getElementById('venueLabel').hidden = !show; document.getElementById('timeLabel').hidden = !show }
  stageSel.onchange = syncVenue
  syncVenue()
  renderOpeningList()

  document.getElementById('openingForm').addEventListener('submit', function (e) {
    e.preventDefault()
    var err = document.getElementById('opError')
    var company = document.getElementById('op_company').value.trim()
    var role = document.getElementById('op_role').value.trim()
    if (!company || !role) { err.textContent = 'Company and role are required.'; err.hidden = false; return }
    var stage = stageSel.value
    var id = (company + '-' + role + '-' + Date.now()).toLowerCase().replace(/[^a-z0-9]+/g, '-')
    var o = { id: id, company: company, role: role, location: document.getElementById('op_location').value.trim(), ctc: document.getElementById('op_ctc').value.trim(), deadline: document.getElementById('op_deadline').value, demoStage: stage }
    if (stage === 'written_test') o.test = { venue: document.getElementById('op_venue').value.trim(), time: document.getElementById('op_time').value.trim() }
    if (stage === 'interview') o.interview = { venue: document.getElementById('op_venue').value.trim(), time: document.getElementById('op_time').value.trim() }
    addOpening(o).then(function () {
      err.hidden = true
      document.getElementById('openingForm').reset()
      syncVenue()
      renderOpeningList()
    })
  })
}

function showSignup() {
  currentUser = null
  renderUserArea()
  view.innerHTML =
    '<div class="login-wrap"><div class="login-card">' +
    '<h2>Create your account</h2><p class="muted">Register for the 2026-27 placement season.</p>' +
    '<form class="login-form" id="signupForm">' +
    '<label>Student Email<input id="su_email" placeholder="yourname@esm.com" autocomplete="email"></label>' +
    '<label>First Name<input id="su_first"></label>' +
    '<label>Last Name<input id="su_last"></label>' +
    '<label>Password<input id="su_pass" type="password" autocomplete="new-password"></label>' +
    '<label>Confirm Password<input id="su_confirm" type="password" autocomplete="new-password"></label>' +
    '<div class="security-block"><span class="field-label">Security questions <span class="muted">(used to reset your password)</span></span>' +
    '<label>Question 1<select id="su_q1">' + SECURITY_QUESTIONS.map(function (q) { return '<option>' + escapeHtml(q) + '</option>' }).join('') + '</select></label>' +
    '<label>Answer 1<input id="su_a1" autocomplete="off"></label>' +
    '<label>Question 2<select id="su_q2">' + SECURITY_QUESTIONS.map(function (q, i) { return '<option' + (i === 1 ? ' selected' : '') + '>' + escapeHtml(q) + '</option>' }).join('') + '</select></label>' +
    '<label>Answer 2<input id="su_a2" autocomplete="off"></label></div>' +
    '<div class="captcha"><span class="field-label">Captcha</span>' +
    '<div class="captcha-row"><canvas id="captchaCanvas" width="170" height="50" aria-label="Captcha image"></canvas>' +
    '<button type="button" class="link-btn" id="refreshCaptcha" aria-label="Refresh captcha">&#8635;</button></div>' +
    '<input id="captchaEntry" placeholder="Enter the characters above" aria-label="Captcha answer"></div>' +
    '<p class="error" id="suError" role="alert" hidden></p>' +
    '<button type="submit" class="primary">Sign up</button>' +
    '<button type="button" class="link-btn" id="backToLogin">Back to sign in</button>' +
    '</form></div></div>'

  drawCaptcha()
  document.getElementById('refreshCaptcha').addEventListener('click', drawCaptcha)
  document.getElementById('backToLogin').addEventListener('click', showLogin)
  document.getElementById('signupForm').addEventListener('submit', function (e) {
    e.preventDefault()
    var err = document.getElementById('suError')
    function fail(m) { err.textContent = m; err.hidden = false }
    var email = document.getElementById('su_email').value.trim().toLowerCase()
    var first = document.getElementById('su_first').value.trim()
    var last = document.getElementById('su_last').value.trim()
    var pass = document.getElementById('su_pass').value
    var confirm = document.getElementById('su_confirm').value
    var entry = document.getElementById('captchaEntry').value.trim().toUpperCase()
    if (!first || !last) return fail('Enter your first and last name.')
    if (!/^[^@\s]+@esm\.com$/.test(email)) return fail('Email must end with @esm.com')
    if (pass.length < 6) return fail('Password must be at least 6 characters.')
    if (pass !== confirm) return fail('Passwords do not match.')
    var q1 = document.getElementById('su_q1').value
    var a1 = document.getElementById('su_a1').value.trim()
    var q2 = document.getElementById('su_q2').value
    var a2 = document.getElementById('su_a2').value.trim()
    if (q1 === q2) return fail('Choose two different security questions.')
    if (!a1 || !a2) return fail('Answer both security questions so you can reset your password later.')
    if (entry !== captchaCode) { fail('Captcha does not match. Please try again.'); drawCaptcha(); return }
    var security = [{ question: q1, answer: a1 }, { question: q2, answer: a2 }]
    registerStudent({ email: email, firstName: first, lastName: last, password: pass, security: security }).then(function (res) {
      if (!res.ok) { fail('This email is already registered. Please sign in instead.'); return }
      err.hidden = true
      showSignupSuccess()
    })
  })
}

function showForgotVerify(email, questions) {
  view.innerHTML =
    '<div class="login-wrap"><div class="login-card">' +
    '<h2>Reset your password</h2><p class="muted">Answer your security questions and set a new password.</p>' +
    '<form class="login-form" id="resetForm">' +
    questions.map(function (q, i) { return '<label>' + escapeHtml(q) + '<input class="fp-answer" data-i="' + i + '" autocomplete="off"></label>' }).join('') +
    '<label>New Password<input id="fp_pass" type="password" autocomplete="new-password"></label>' +
    '<label>Confirm Password<input id="fp_confirm" type="password" autocomplete="new-password"></label>' +
    '<p class="error" id="fpError" role="alert" hidden></p>' +
    '<button type="submit" class="primary">Reset password</button>' +
    '<button type="button" class="link-btn" id="fpBack">Back to sign in</button>' +
    '</form></div></div>'
  document.getElementById('fpBack').addEventListener('click', showLogin)
  document.getElementById('resetForm').addEventListener('submit', function (e) {
    e.preventDefault()
    var err = document.getElementById('fpError')
    function fail(m) { err.textContent = m; err.hidden = false }
    var answers = Array.prototype.map.call(view.querySelectorAll('.fp-answer'), function (el) { return el.value })
    var pass = document.getElementById('fp_pass').value
    var confirm = document.getElementById('fp_confirm').value
    if (answers.some(function (a) { return !a.trim() })) return fail('Answer all security questions.')
    if (pass.length < 6) return fail('New password must be at least 6 characters.')
    if (pass !== confirm) return fail('Passwords do not match.')
    resetPassword(email, answers, pass).then(function (res) {
      if (!res.ok) {
        if (res.reason === 'answers') return fail('One or more answers are incorrect. Please try again.')
        if (res.reason === 'weak') return fail('New password must be at least 6 characters.')
        return fail('We could not reset your password. Please try again.')
      }
      showForgotDone()
    })
  })
}

function showForgotDone() {
  view.innerHTML =
    '<div class="login-wrap"><div class="login-card success-card">' +
    '<div class="tick">&#10003;</div>' +
    '<h2>Password reset</h2>' +
    '<p class="muted">You can now sign in with your new password.</p>' +
    '<button class="primary" id="fpHome">Back to sign in</button>' +
    '</div></div>'
  document.getElementById('fpHome').addEventListener('click', showLogin)
}

function showForgot() {
  currentUser = null
  renderUserArea()
  view.innerHTML =
    '<div class="login-wrap"><div class="login-card">' +
    '<h2>Reset your password</h2><p class="muted">Enter your registered email to answer your security questions.</p>' +
    '<form class="login-form" id="forgotForm">' +
    '<label>Student Email<input id="fp_email" placeholder="yourname@esm.com" autocomplete="email"></label>' +
    '<p class="error" id="fpError" role="alert" hidden></p>' +
    '<button type="submit" class="primary">Continue</button>' +
    '<button type="button" class="link-btn" id="fpBack">Back to sign in</button>' +
    '</form></div></div>'
  document.getElementById('fpBack').addEventListener('click', showLogin)
  document.getElementById('forgotForm').addEventListener('submit', function (e) {
    e.preventDefault()
    var err = document.getElementById('fpError')
    var email = document.getElementById('fp_email').value.trim().toLowerCase()
    if (!/^[^@\s]+@esm\.com$/.test(email)) { err.textContent = 'Enter the @esm.com email you registered with.'; err.hidden = false; return }
    getSecurityQuestions(email).then(function (qs) {
      if (!qs || !qs.length) { err.textContent = 'No account with saved security questions was found for that email.'; err.hidden = false; return }
      showForgotVerify(email, qs)
    })
  })
}

function showSignupSuccess() {
  view.innerHTML =
    '<div class="login-wrap"><div class="login-card success-card">' +
    '<div class="tick">&#10003;</div>' +
    '<h2>Successfully registered for the 2026-27 placement season</h2>' +
    '<p class="muted">You can now sign in with your ESM email and password.</p>' +
    '<button class="primary" id="homeBtn">Home</button>' +
    '<p class="muted small">Redirecting to home in 5 seconds&hellip;</p>' +
    '</div></div>'
  var t = setTimeout(showLogin, 5000)
  document.getElementById('homeBtn').addEventListener('click', function () { clearTimeout(t); showLogin() })
}

function restoreSession() {
  var s = readSession()
  if (!s) { showLogin(); return }
  if (s.role === 'admin') { currentUser = { role: 'admin', firstName: 'Admin', lastName: '' }; renderUserArea(); showAdmin(); return }
  if (s.role === 'student' && s.user) {
    currentUser = { role: 'student', email: s.user.email, firstName: s.user.firstName, lastName: s.user.lastName }
    renderUserArea()
    isProfileComplete(currentUser.email).then(function (done) { if (done) showDashboard(); else showStudent(currentUser) })
    return
  }
  showLogin()
}

restoreSession()
