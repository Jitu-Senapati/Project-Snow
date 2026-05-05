let facultyData = JSON.parse(localStorage.getItem('collegeFaculty')) || [];

const facultyForm = document.getElementById('facultyForm');
const facultyGrid = document.getElementById('facultyGrid');
const adminSection = document.getElementById('adminSection');
const toggleBtn = document.getElementById('toggleAdminBtn');
const searchInput = document.getElementById('searchInput');

// Toggle Admin View
toggleBtn.addEventListener('click', () => {
    adminSection.classList.toggle('hidden');
    toggleBtn.textContent = adminSection.classList.contains('hidden') ? 'Open Admin Panel' : 'Close Admin Panel';
});

// Add or Edit Faculty
facultyForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const id = document.getElementById('editId').value;
    const newFaculty = {
        id: id ? parseInt(id) : Date.now(),
        name: document.getElementById('name').value,
        dept: document.getElementById('dept').value,
        qualification: document.getElementById('qualification').value,
        experience: document.getElementById('experience').value,
        photoUrl: document.getElementById('photoUrl').value,
        email: document.getElementById('email').value
    };

    if (id) {
        // Update existing
        facultyData = facultyData.map(f => f.id === parseInt(id) ? newFaculty : f);
    } else {
        // Add new
        facultyData.push(newFaculty);
    }

    saveAndRender();
    facultyForm.reset();
    document.getElementById('editId').value = '';
    document.getElementById('cancelBtn').classList.add('hidden');
    document.getElementById('saveBtn').textContent = 'Add Faculty Member';
});

function saveAndRender() {
    localStorage.setItem('collegeFaculty', JSON.stringify(facultyData));
    renderFaculty(facultyData);
}

function renderFaculty(data) {
    facultyGrid.innerHTML = data.map(faculty => `
        <div class="faculty-card">
            <img src="${faculty.photoUrl}" alt="${faculty.name}" class="faculty-photo" 
                 onerror="this.src='https://via.placeholder.com/150?text=No+Photo'">
            <div class="faculty-info">
                <h3>${faculty.name}</h3>
                <p><strong>Dept:</strong> ${faculty.dept}</p>
                <p><strong>Education:</strong> ${faculty.qualification}</p>
                <p><strong>Experience:</strong> ${faculty.experience} Years</p>
                <p><strong>Email:</strong> ${faculty.email}</p>
            </div>
            <div class="admin-controls">
                <button class="edit-btn" onclick="editFaculty(${faculty.id})">Edit</button>
                <button class="delete-btn" onclick="deleteFaculty(${faculty.id})">Delete</button>
            </div>
        </div>
    `).join('');
}

// Delete Logic
window.deleteFaculty = (id) => {
    if(confirm('Are you sure you want to remove this faculty?')) {
        facultyData = facultyData.filter(f => f.id !== id);
        saveAndRender();
    }
};

// Edit Logic (Populate form)
window.editFaculty = (id) => {
    const faculty = facultyData.find(f => f.id === id);
    document.getElementById('editId').value = faculty.id;
    document.getElementById('name').value = faculty.name;
    document.getElementById('dept').value = faculty.dept;
    document.getElementById('qualification').value = faculty.qualification;
    document.getElementById('experience').value = faculty.experience;
    document.getElementById('photoUrl').value = faculty.photoUrl;
    document.getElementById('email').value = faculty.email;
    
    document.getElementById('saveBtn').textContent = 'Update Faculty';
    document.getElementById('cancelBtn').classList.remove('hidden');
    adminSection.classList.remove('hidden');
    window.scrollTo(0, 0);
};

// Search/Filter Logic
searchInput.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    const filtered = facultyData.filter(f => 
        f.name.toLowerCase().includes(term) || 
        f.dept.toLowerCase().includes(term)
    );
    renderFaculty(filtered);
});

// Initial Render
renderFaculty(facultyData);