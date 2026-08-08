// ============ API ============
const API_URL = 'http://localhost:5000';

// ============ DOM ============
const form = document.getElementById('profileForm');
const nameEl = document.getElementById('profileName');
const bioEl = document.getElementById('profileBio');
const skillsEl = document.getElementById('profileSkills');
const socialEl = document.getElementById('profileSocial');
const colorEl = document.getElementById('avatarColor');
const listEl = document.getElementById('profilesList');
const countEl = document.getElementById('profileCount');
const totalEl = document.getElementById('totalProfiles');
const refreshBtn = document.getElementById('refreshBtn');

// ============ COLOR PRESETS ============
document.querySelectorAll('.cp').forEach(btn => {
    btn.addEventListener('click', function() {
        document.querySelectorAll('.cp').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        colorEl.value = this.dataset.color;
    });
});

// ============ FETCH PROFILES ============
async function fetchProfiles() {
    try {
        const res = await fetch(`${API_URL}/api/profiles`);
        const data = await res.json();
        if (data.success) {
            renderProfiles(data.data);
            updateCount(data.data.length);
        }
    } catch (err) {
        showToast('Failed to load profiles', 'error');
    }
}

// ============ CREATE PROFILE ============
async function createProfile(data) {
    try {
        const res = await fetch(`${API_URL}/api/profiles`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await res.json();
        if (result.success) {
            await fetchProfiles();
            showToast('Profile created! 🎉', 'success');
            return true;
        }
        showToast(result.message || 'Failed to create', 'error');
        return false;
    } catch (err) {
        showToast('Server error', 'error');
        return false;
    }
}

// ============ DELETE PROFILE ============
async function deleteProfile(id) {
    if (!confirm('Delete this profile?')) return;
    try {
        const res = await fetch(`${API_URL}/api/profiles/${id}`, {
            method: 'DELETE'
        });
        const data = await res.json();
        if (data.success) {
            await fetchProfiles();
            showToast('Deleted!', 'success');
        }
    } catch (err) {
        showToast('Failed to delete', 'error');
    }
}

// ============ RENDER ============
function renderProfiles(profiles) {
    if (!profiles || profiles.length === 0) {
        listEl.innerHTML = `
            <div class="empty-state">
                <div class="icon">👤</div>
                <h3>No profiles yet</h3>
                <p>Create your first profile above</p>
            </div>
        `;
        return;
    }

    listEl.innerHTML = profiles.map(p => `
        <div class="profile-card" style="border-top-color:${p.avatarColor || '#6C63FF'}">
            <div class="profile-top">
                <div class="avatar" style="background:${p.avatarColor || '#6C63FF'}">
                    ${p.initials || p.name.charAt(0)}
                </div>
                <div class="profile-info">
                    <h3>${esc(p.name)}</h3>
                    <p>${esc(p.bio)}</p>
                    <small>Joined ${formatDate(p.createdAt)}</small>
                </div>
            </div>
            <div class="profile-bottom">
                <strong>💡 Skills</strong>
                <div class="skills">
                    ${p.skills && p.skills.length > 0 
                        ? p.skills.map(s => `<span class="skill-tag">${esc(s)}</span>`).join('')
                        : '<span style="color:#A0AEC0;font-size:0.8rem;">No skills</span>'
                    }
                </div>
                <strong>🔗 Social</strong>
                <div class="social-links">
                    ${p.socialLinks && p.socialLinks.length > 0
                        ? p.socialLinks.map(link => {
                            try {
                                const domain = new URL(link).hostname.replace('www.', '');
                                return `<a href="${link}" target="_blank">${domain}</a>`;
                            } catch(e) {
                                return `<a href="${link}" target="_blank">${link}</a>`;
                            }
                        }).join('')
                        : '<span style="color:#A0AEC0;font-size:0.8rem;">No links</span>'
                    }
                </div>
                <button class="btn-danger" onclick="deleteProfile('${p.id}')">🗑️ Delete</button>
            </div>
        </div>
    `).join('');
}

// ============ HELPERS ============
function esc(text) {
    const d = document.createElement('div');
    d.textContent = text;
    return d.innerHTML;
}

function formatDate(str) {
    return new Date(str).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric'
    });
}

function updateCount(n) {
    const text = n === 1 ? 'Profile' : 'Profiles';
    countEl.textContent = n;
    totalEl.textContent = `${n} ${text}`;
}

function showToast(msg, type = 'success') {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ============ FORM SUBMIT ============
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = nameEl.value.trim();
    const bio = bioEl.value.trim();
    if (!name || !bio) {
        showToast('Name and Bio are required', 'error');
        return;
    }
    const success = await createProfile({
        name,
        bio,
        skills: skillsEl.value.trim(),
        socialLinks: socialEl.value.trim(),
        avatarColor: colorEl.value
    });
    if (success) {
        form.reset();
        colorEl.value = '#6C63FF';
        document.querySelector('.cp.active')?.classList.remove('active');
        document.querySelector('.cp[data-color="#6C63FF"]')?.classList.add('active');
        nameEl.focus();
    }
});

// ============ REFRESH ============
refreshBtn.addEventListener('click', fetchProfiles);

// ============ INIT ============
document.addEventListener('DOMContentLoaded', fetchProfiles);

// Make delete function global
window.deleteProfile = deleteProfile;