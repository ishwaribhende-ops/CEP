/* ==========================================================================
   Road Complaint System – CEP (Varale, Pune)
   Frontend Application Logic
   ========================================================================== */

let selectedDemoPhotoBlob = null;
let debounceTimeout = null;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initFormHandlers();
  initDropzone();
  loadStats();

  // Check URL hash for direct routing
  handleHashRouting();
  window.addEventListener('hashchange', handleHashRouting);
});

/* ==========================================================================
   Navigation & View Routing
   ========================================================================== */
function initNavigation() {
  const mobileBtn = document.getElementById('mobileMenuBtn');
  const navLinks = document.getElementById('navLinks');

  if (mobileBtn && navLinks) {
    mobileBtn.addEventListener('click', () => {
      navLinks.classList.toggle('show');
    });
  }
}

function navigateTo(viewName) {
  // Hide mobile nav if open
  const navLinks = document.getElementById('navLinks');
  if (navLinks) navLinks.classList.remove('show');

  // Deactivate all views and nav buttons
  document.querySelectorAll('.view-section').forEach(sec => sec.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(btn => btn.classList.remove('active'));

  // Activate selected view
  const targetView = document.getElementById(`view-${viewName}`);
  if (targetView) {
    targetView.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Highlight nav button
  const matchingNav = Array.from(document.querySelectorAll('.nav-link')).find(btn => {
    const text = btn.textContent.toLowerCase();
    if (viewName === 'home' && text.includes('home')) return true;
    if (viewName === 'report' && text.includes('report')) return true;
    if (viewName === 'track' && text.includes('track')) return true;
    if (viewName === 'admin' && text.includes('admin')) return true;
    return false;
  });
  if (matchingNav) matchingNav.classList.add('active');

  // Update hash
  window.location.hash = viewName;

  // View specific triggers
  if (viewName === 'home') {
    loadStats();
  } else if (viewName === 'admin') {
    loadStats();
    loadAdminComplaints();
  }
}

function handleHashRouting() {
  const hash = window.location.hash.replace('#', '').trim();
  if (hash.startsWith('track')) {
    const params = new URLSearchParams(hash.split('?')[1]);
    const id = params.get('id');
    navigateTo('track');
    if (id) {
      document.getElementById('trackInput').value = id;
      handleTrackSearch();
    }
  } else if (['home', 'report', 'track', 'admin'].includes(hash)) {
    navigateTo(hash);
  } else {
    navigateTo('home');
  }
}

/* ==========================================================================
   Statistics & Live Counts
   ========================================================================== */
async function loadStats() {
  try {
    const res = await fetch('/api/stats');
    if (!res.ok) return;
    const stats = await res.json();

    // Home view counts
    updateCount('home-stat-total', stats.total);
    updateCount('home-stat-pending', stats.pending);
    updateCount('home-stat-progress', stats.in_progress);
    updateCount('home-stat-resolved', stats.resolved);

    // Admin view counts
    updateCount('admin-stat-total', stats.total);
    updateCount('admin-stat-pending', stats.pending);
    updateCount('admin-stat-progress', stats.in_progress);
    updateCount('admin-stat-resolved', stats.resolved);
  } catch (err) {
    console.warn('Could not fetch stats:', err);
  }
}

function updateCount(elementId, value) {
  const el = document.getElementById(elementId);
  if (el) {
    el.textContent = value !== undefined ? value : 0;
  }
}

/* ==========================================================================
   Complaint Registration Page
   ========================================================================== */
function initFormHandlers() {
  const form = document.getElementById('complaintForm');
  const gpsBtn = document.getElementById('btnDetectLocation');
  const samplePhotoBtn = document.getElementById('btnUseSamplePhoto');
  const removePhotoBtn = document.getElementById('btnRemovePhoto');

  // GPS Location detection
  if (gpsBtn) {
    gpsBtn.addEventListener('click', () => {
      const locInput = document.getElementById('locationInput');
      locInput.value = 'Detecting GPS...';

      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          pos => {
            const lat = pos.coords.latitude.toFixed(4);
            const lng = pos.coords.longitude.toFixed(4);
            locInput.value = `Near Varale, Pune (${lat}° N, ${lng}° E)`;
            showToast('GPS coordinates captured!', 'success');
          },
          err => {
            // Default fallback for Varale, Pune coordinates
            locInput.value = 'Varale, Pune (18.7328° N, 73.6821° E)';
            showToast('Using Varale, Pune coordinates.', 'info');
          },
          { timeout: 5000 }
        );
      } else {
        locInput.value = 'Varale, Pune (18.7328° N, 73.6821° E)';
      }
    });
  }

  // Sample photo attachment for quick testing
  if (samplePhotoBtn) {
    samplePhotoBtn.addEventListener('click', async () => {
      const pType = document.getElementById('problemType').value || 'Pothole';
      let sampleFile = 'pothole1.svg';
      if (pType === 'Drainage Problem') sampleFile = 'drainage1.svg';
      if (pType === 'Damaged Road') sampleFile = 'damaged_road1.svg';
      if (pType === 'Broken Road') sampleFile = 'broken_road1.svg';

      try {
        const res = await fetch(`/images/${sampleFile}`);
        const blob = await res.blob();
        selectedDemoPhotoBlob = new File([blob], sampleFile, { type: 'image/svg+xml' });

        showPreview(`/images/${sampleFile}`, sampleFile, '12 KB');
        showToast('Demo road photo attached!', 'info');
      } catch (e) {
        console.error('Error attaching sample photo', e);
      }
    });
  }

  // Remove photo handler
  if (removePhotoBtn) {
    removePhotoBtn.addEventListener('click', () => {
      document.getElementById('photoInput').value = '';
      selectedDemoPhotoBlob = null;
      document.getElementById('previewContainer').classList.remove('active');
    });
  }

  // Form submission
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const submitBtn = document.getElementById('btnSubmitComplaint');
      const originalText = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = '⏳ Submitting Complaint...';

      try {
        const formData = new FormData(form);

        // If user attached a demo sample photo rather than file input
        if (!document.getElementById('photoInput').files.length && selectedDemoPhotoBlob) {
          formData.set('photo', selectedDemoPhotoBlob);
        }

        const response = await fetch('/api/complaints', {
          method: 'POST',
          body: formData
        });

        const result = await response.json();

        if (response.ok && result.success) {
          // Display success card
          document.getElementById('form-container').style.display = 'none';
          const successBox = document.getElementById('successBox');
          successBox.classList.add('active');
          document.getElementById('generatedComplaintId').textContent = result.complaint_id;

          showToast(`Complaint ${result.complaint_id} registered!`, 'success');
          loadStats();
        } else {
          showToast(result.error || 'Failed to submit complaint. Please check fields.', 'error');
        }
      } catch (err) {
        console.error(err);
        showToast('Server connection error. Please try again.', 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
      }
    });
  }
}

function initDropzone() {
  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('photoInput');

  if (!dropzone || !fileInput) return;

  fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      selectedDemoPhotoBlob = null;
      const reader = new FileReader();
      reader.onload = (re) => {
        showPreview(re.target.result, file.name, formatBytes(file.size));
      };
      reader.readAsDataURL(file);
    }
  });

  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.style.borderColor = 'var(--primary)';
  });

  dropzone.addEventListener('dragleave', () => {
    dropzone.style.borderColor = 'var(--border)';
  });

  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.style.borderColor = 'var(--border)';
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      fileInput.files = e.dataTransfer.files;
      const file = e.dataTransfer.files[0];
      selectedDemoPhotoBlob = null;
      const reader = new FileReader();
      reader.onload = (re) => {
        showPreview(re.target.result, file.name, formatBytes(file.size));
      };
      reader.readAsDataURL(file);
    }
  });
}

function showPreview(src, name, size) {
  const container = document.getElementById('previewContainer');
  const img = document.getElementById('previewImg');
  const nameEl = document.getElementById('previewFileName');
  const sizeEl = document.getElementById('previewFileSize');

  img.src = src;
  nameEl.textContent = name;
  sizeEl.textContent = size;
  container.classList.add('active');
}

function formatBytes(bytes) {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function setArea(areaName) {
  const input = document.getElementById('roadArea');
  if (input) {
    input.value = areaName;
    input.focus();
  }
}

function copyComplaintId() {
  const id = document.getElementById('generatedComplaintId').textContent;
  navigator.clipboard.writeText(id).then(() => {
    showToast('Complaint ID copied to clipboard!', 'success');
  }).catch(() => {
    showToast('Failed to copy ID', 'error');
  });
}

function trackFromSuccess() {
  const id = document.getElementById('generatedComplaintId').textContent;
  navigateTo('track');
  document.getElementById('trackInput').value = id;
  handleTrackSearch();
}

function resetFormForNew() {
  document.getElementById('complaintForm').reset();
  document.getElementById('previewContainer').classList.remove('active');
  selectedDemoPhotoBlob = null;
  document.getElementById('form-container').style.display = 'block';
  document.getElementById('successBox').classList.remove('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ==========================================================================
   Complaint Tracking Page
   ========================================================================== */
async function handleTrackSearch() {
  const input = document.getElementById('trackInput');
  const complaintId = input.value.trim().toUpperCase();

  if (!complaintId) {
    showToast('Please enter a Complaint ID.', 'error');
    return;
  }

  const btn = document.getElementById('btnTrackSearch');
  const original = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = 'Searching...';

  try {
    const res = await fetch(`/api/complaints/${encodeURIComponent(complaintId)}`);
    if (res.ok) {
      const data = await res.json();
      displayTrackingResult(data);
    } else {
      const err = await res.json();
      showToast(err.error || 'No complaint found with this ID.', 'error');
      document.getElementById('trackResultCard').classList.remove('active');
    }
  } catch (e) {
    showToast('Error searching complaint. Check connection.', 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = original;
  }
}

function quickTrack(id) {
  document.getElementById('trackInput').value = id;
  handleTrackSearch();
}

function displayTrackingResult(c) {
  const card = document.getElementById('trackResultCard');
  card.classList.add('active');

  // Populate data
  document.getElementById('trackComplaintId').textContent = c.complaint_id;
  document.getElementById('trackDate').textContent = c.date_created;
  document.getElementById('trackArea').textContent = c.road_area;
  document.getElementById('trackLocation').textContent = c.location || 'Varale, Pune';
  document.getElementById('trackDesc').textContent = c.description;

  // Problem type badge
  const pBadge = document.getElementById('trackProblemType');
  pBadge.textContent = c.problem_type;
  pBadge.className = 'badge ' + getProblemBadgeClass(c.problem_type);

  // Status badge
  const sBadge = document.getElementById('trackStatusBadge');
  sBadge.textContent = c.status;
  sBadge.className = 'badge ' + getStatusBadgeClass(c.status);

  // Photo
  const photoImg = document.getElementById('trackPhotoImg');
  photoImg.src = `/uploads/${c.photo_filename}`;
  photoImg.onerror = () => { photoImg.src = '/images/pothole1.svg'; };

  // Authority note
  const notesEl = document.getElementById('trackAdminNotes');
  if (c.admin_notes && c.admin_notes.trim()) {
    notesEl.textContent = c.admin_notes;
  } else {
    notesEl.textContent = 'Awaiting formal inspection by Varale Gram Panchayat engineering wing.';
  }

  // Update Visual Stepper: Submitted -> Under Review -> In Progress -> Resolved
  updateStepper(c.status);

  card.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function updateStepper(status) {
  const steps = ['submitted', 'under-review', 'in-progress', 'resolved'];
  const fill = document.getElementById('stepperProgressFill');

  // Reset classes
  steps.forEach(s => {
    const el = document.getElementById(`step-${s}`);
    if (el) {
      el.classList.remove('active', 'completed');
    }
  });

  if (status === 'Submitted') {
    document.getElementById('step-submitted').classList.add('active');
    if (fill) fill.style.width = '0%';
  } else if (status === 'Under Review') {
    document.getElementById('step-submitted').classList.add('completed');
    document.getElementById('step-under-review').classList.add('active');
    if (fill) fill.style.width = '33.3%';
  } else if (status === 'In Progress') {
    document.getElementById('step-submitted').classList.add('completed');
    document.getElementById('step-under-review').classList.add('completed');
    document.getElementById('step-in-progress').classList.add('active');
    if (fill) fill.style.width = '66.6%';
  } else if (status === 'Resolved') {
    steps.forEach(s => {
      const el = document.getElementById(`step-${s}`);
      if (el) el.classList.add('completed');
    });
    if (fill) fill.style.width = '100%';
  }
}

/* ==========================================================================
   Admin Dashboard & Table
   ========================================================================== */
async function loadAdminComplaints() {
  const statusFilter = document.getElementById('adminStatusFilter').value;
  const searchInput = document.getElementById('adminSearchInput').value.trim();

  let url = '/api/complaints?';
  if (statusFilter && statusFilter !== 'all') {
    url += `status=${encodeURIComponent(statusFilter)}&`;
  }
  if (searchInput) {
    url += `search=${encodeURIComponent(searchInput)}&`;
  }

  try {
    const res = await fetch(url);
    const complaints = await res.json();
    renderAdminTable(complaints);
  } catch (err) {
    console.error('Error loading complaints:', err);
    showToast('Failed to load complaints table.', 'error');
  }
}

function debounceAdminSearch() {
  clearTimeout(debounceTimeout);
  debounceTimeout = setTimeout(() => {
    loadAdminComplaints();
  }, 300);
}

function renderAdminTable(complaints) {
  const tbody = document.getElementById('complaintsTableBody');
  const emptyState = document.getElementById('tableEmptyState');

  if (!complaints || complaints.length === 0) {
    tbody.innerHTML = '';
    emptyState.style.display = 'block';
    return;
  }

  emptyState.style.display = 'none';

  tbody.innerHTML = complaints.map(c => `
    <tr>
      <td>
        <a href="#track?id=${c.complaint_id}" class="table-id-link" onclick="quickTrackFromTable('${c.complaint_id}')">
          ${c.complaint_id}
        </a>
      </td>
      <td>
        <div style="font-weight:600; color:var(--dark);">${escapeHtml(c.name)}</div>
        <div style="font-size:0.75rem; color:var(--text-muted);">${escapeHtml(c.mobile)}</div>
      </td>
      <td style="max-width:180px;">
        <div style="font-weight:600;">${escapeHtml(c.road_area)}</div>
        <div style="font-size:0.75rem; color:var(--text-muted); text-overflow:ellipsis; overflow:hidden; white-space:nowrap;" title="${escapeHtml(c.location)}">
          ${escapeHtml(c.location || 'Varale')}
        </div>
      </td>
      <td>
        <span class="badge ${getProblemBadgeClass(c.problem_type)}">
          ${escapeHtml(c.problem_type)}
        </span>
      </td>
      <td style="font-size:0.8rem; color:var(--text-muted); white-space:nowrap;">
        ${c.date_created}
      </td>
      <td>
        <img src="/uploads/${c.photo_filename}" alt="Evidence" class="table-photo-thumb" onerror="this.src='/images/pothole1.svg'" onclick="openLightbox(this.src)">
      </td>
      <td>
        <span class="badge ${getStatusBadgeClass(c.status)}">${c.status}</span>
      </td>
      <td>
        <div style="display:flex; align-items:center; gap:0.4rem;">
          <select class="status-select ${c.status.replace(/\s+/g, '-')}" onchange="handleStatusChange('${c.complaint_id}', this.value)">
            <option value="Submitted" ${c.status === 'Submitted' ? 'selected' : ''}>Submitted</option>
            <option value="Under Review" ${c.status === 'Under Review' ? 'selected' : ''}>Under Review</option>
            <option value="In Progress" ${c.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
            <option value="Resolved" ${c.status === 'Resolved' ? 'selected' : ''}>Resolved</option>
          </select>
          <button class="btn btn-outline btn-sm" style="padding:0.25rem 0.5rem;" title="View Complete Details" onclick="viewComplaintModal('${c.complaint_id}')">
            👁️
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

async function handleStatusChange(complaintId, newStatus) {
  try {
    const res = await fetch(`/api/complaints/${encodeURIComponent(complaintId)}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });

    const result = await res.json();
    if (res.ok && result.success) {
      showToast(`${complaintId} updated to "${newStatus}"`, 'success');
      loadStats();
      loadAdminComplaints();
    } else {
      showToast(result.error || 'Failed to update status.', 'error');
    }
  } catch (err) {
    showToast('Network error while updating status.', 'error');
  }
}

function quickTrackFromTable(id) {
  navigateTo('track');
  document.getElementById('trackInput').value = id;
  handleTrackSearch();
}

async function viewComplaintModal(complaintId) {
  try {
    const res = await fetch(`/api/complaints/${encodeURIComponent(complaintId)}`);
    if (!res.ok) return;
    const c = await res.json();

    document.getElementById('modalComplaintId').textContent = `${c.complaint_id} — Details`;
    const body = document.getElementById('modalComplaintBody');

    body.innerHTML = `
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem; margin-bottom:1.25rem;">
        <div>
          <span class="detail-label">Citizen Name</span>
          <div style="font-weight:700;">${escapeHtml(c.name)}</div>
        </div>
        <div>
          <span class="detail-label">Contact Number</span>
          <div style="font-weight:700;">${escapeHtml(c.mobile)}</div>
        </div>
        <div>
          <span class="detail-label">Road / Area</span>
          <div style="font-weight:700;">${escapeHtml(c.road_area)}</div>
        </div>
        <div>
          <span class="detail-label">Problem Type</span>
          <div><span class="badge ${getProblemBadgeClass(c.problem_type)}">${c.problem_type}</span></div>
        </div>
        <div style="grid-column:1/-1;">
          <span class="detail-label">Exact Location</span>
          <div>${escapeHtml(c.location)}</div>
        </div>
        <div style="grid-column:1/-1;">
          <span class="detail-label">Description</span>
          <p style="background:#f8fafc; padding:0.75rem; border-radius:6px; font-size:0.9rem; margin-top:0.25rem;">
            ${escapeHtml(c.description)}
          </p>
        </div>
      </div>

      <div style="margin-bottom:1.25rem;">
        <span class="detail-label">Road Photo Evidence</span>
        <img src="/uploads/${c.photo_filename}" style="width:100%; max-height:260px; object-fit:cover; border-radius:8px; margin-top:0.35rem; cursor:zoom-in;" onerror="this.src='/images/pothole1.svg'" onclick="openLightbox(this.src)">
      </div>

      <div style="background:#eff6ff; padding:1rem; border-radius:8px; border:1px solid #bfdbfe;">
        <label style="font-size:0.8rem; font-weight:700; text-transform:uppercase; color:var(--primary); display:block; margin-bottom:0.4rem;">
          Update Authority Remark / Work Order Note:
        </label>
        <textarea id="modalAdminNote" style="width:100%; font-size:0.88rem; padding:0.5rem; min-height:60px;" placeholder="Add progress notes or contractor details...">${escapeHtml(c.admin_notes || '')}</textarea>
        <div style="display:flex; justify-content:flex-end; margin-top:0.6rem;">
          <button class="btn btn-primary btn-sm" onclick="saveAdminNote('${c.complaint_id}')">
            💾 Save Note
          </button>
        </div>
      </div>
    `;

    document.getElementById('detailModal').classList.add('active');
  } catch (err) {
    showToast('Failed to load complaint details', 'error');
  }
}

async function saveAdminNote(complaintId) {
  const note = document.getElementById('modalAdminNote').value.trim();
  try {
    const res = await fetch(`/api/complaints/${encodeURIComponent(complaintId)}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ admin_notes: note, status: 'In Progress' })
    });
    if (res.ok) {
      showToast('Authority remark saved!', 'success');
      closeModal('detailModal');
      loadAdminComplaints();
    }
  } catch (e) {
    showToast('Failed to save remark', 'error');
  }
}

async function resetDemoData() {
  if (!confirm('Reset complaints database to default Varale demo dataset?')) return;

  try {
    const res = await fetch('/api/reset-demo', { method: 'POST' });
    const data = await res.json();
    if (res.ok) {
      showToast('Demo complaints successfully reset!', 'success');
      loadStats();
      loadAdminComplaints();
    } else {
      showToast(data.error || 'Failed to reset.', 'error');
    }
  } catch (e) {
    showToast('Error resetting data', 'error');
  }
}

async function exportToCSV() {
  try {
    const res = await fetch('/api/complaints');
    const list = await res.json();

    if (!list || list.length === 0) {
      showToast('No complaint records to export.', 'info');
      return;
    }

    const headers = ['Complaint ID', 'Citizen Name', 'Mobile', 'Road/Area', 'Problem Type', 'Location', 'Date Created', 'Status', 'Authority Notes'];
    const rows = list.map(c => [
      `"${c.complaint_id}"`,
      `"${c.name}"`,
      `"${c.mobile}"`,
      `"${c.road_area}"`,
      `"${c.problem_type}"`,
      `"${(c.location || '').replace(/"/g, '""')}"`,
      `"${c.date_created}"`,
      `"${c.status}"`,
      `"${(c.admin_notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Varale_Road_Complaints_Report_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('CSV report downloaded!', 'success');
  } catch (e) {
    showToast('Failed to export CSV', 'error');
  }
}

/* ==========================================================================
   UI Helpers: Badges, Modals, Lightbox, Toasts
   ========================================================================== */
function getStatusBadgeClass(status) {
  switch (status) {
    case 'Submitted': return 'badge-submitted';
    case 'Under Review': return 'badge-under-review';
    case 'In Progress': return 'badge-in-progress';
    case 'Resolved': return 'badge-resolved';
    default: return 'badge-submitted';
  }
}

function getProblemBadgeClass(type) {
  switch (type) {
    case 'Pothole': return 'badge-pothole';
    case 'Damaged Road': return 'badge-damaged';
    case 'Drainage Problem': return 'badge-drainage';
    case 'Broken Road': return 'badge-broken';
    default: return 'badge-other';
  }
}

function openLightbox(src) {
  const overlay = document.getElementById('lightboxOverlay');
  const img = document.getElementById('lightboxImg');
  img.src = src;
  overlay.classList.add('active');
}

function closeLightbox() {
  document.getElementById('lightboxOverlay').classList.remove('active');
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.remove('active');
}

function showSafetyGuidelines() {
  const box = document.getElementById('safety-guidelines-box');
  if (box) {
    box.scrollIntoView({ behavior: 'smooth', block: 'center' });
    box.style.boxShadow = '0 0 0 4px rgba(245, 158, 11, 0.4)';
    setTimeout(() => {
      box.style.boxShadow = 'none';
    }, 2000);
  }
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ';
  toast.innerHTML = `<span>${icon}</span> <span>${escapeHtml(message)}</span>`;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(30px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

