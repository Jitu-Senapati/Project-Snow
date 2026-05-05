const form = document.getElementById("teacherForm");
const teacherIdInput = document.getElementById("teacherId");
const nameInput = document.getElementById("name");
const designationInput = document.getElementById("designation");
const departmentInput = document.getElementById("department");
const qualificationInput = document.getElementById("qualification");
const experienceInput = document.getElementById("experience");
const specializationInput = document.getElementById("specialization");
const emailInput = document.getElementById("email");
const phoneInput = document.getElementById("phone");
const officeInput = document.getElementById("office");
const bioInput = document.getElementById("bio");
const photoInput = document.getElementById("photo");
const photoPreview = document.getElementById("photoPreview");
const facultyGrid = document.getElementById("facultyGrid");
const searchInput = document.getElementById("searchInput");
const facultyCount = document.getElementById("facultyCount");
const resetBtn = document.getElementById("resetBtn");
const clearAllBtn = document.getElementById("clearAllBtn");
const saveBtn = document.getElementById("saveBtn");
const template = document.getElementById("teacherCardTemplate");

const STORAGE_KEY = "college_faculty_data_v1";

let faculty = loadFaculty();
let currentPhotoData = "";

function loadFaculty() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) return JSON.parse(saved);

  return [
    {
      id: crypto.randomUUID(),
      name: "Dr. Ananya Mishra",
      designation: "Head of Department",
      department: "Computer Science",
      qualification: "PhD, M.Tech",
      experience: 12,
      specialization: "Artificial Intelligence & Machine Learning",
      email: "ananya@college.edu",
      phone: "+91 9876543210",
      office: "Block A, Room 201",
      bio: "Experienced academician with strong research background in AI and modern software systems.",
      photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=900&q=80"
    },
    {
      id: crypto.randomUUID(),
      name: "Prof. Rakesh Kumar",
      designation: "Associate Professor",
      department: "Information Technology",
      qualification: "M.Tech",
      experience: 9,
      specialization: "Web Development & Cloud Computing",
      email: "rakesh@college.edu",
      phone: "+91 9123456780",
      office: "Block B, Room 105",
      bio: "Passionate about teaching web technologies, cloud infrastructure, and project-based learning.",
      photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=900&q=80"
    }
  ];
}

function saveFaculty() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(faculty));
}

function renderFaculty(list = faculty) {
  facultyGrid.innerHTML = "";

  facultyCount.textContent = `${list.length} faculty member${list.length !== 1 ? "s" : ""} found`;

  if (list.length === 0) {
    facultyGrid.innerHTML = `
      <div class="empty-state">
        <h3>No faculty found</h3>
        <p>Try another search or add a new teacher from the admin panel.</p>
      </div>
    `;
    return;
  }

  list.forEach((teacher) => {
    const card = template.content.cloneNode(true);

    card.querySelector(".teacher-photo").src = teacher.photo || "https://via.placeholder.com/600x400?text=Faculty";
    card.querySelector(".teacher-photo").alt = `${teacher.name} photo`;
    card.querySelector(".teacher-name").textContent = teacher.name;
    card.querySelector(".teacher-designation").textContent = teacher.designation;
    card.querySelector(".teacher-meta").textContent = teacher.department;
    card.querySelector(".teacher-qualification").textContent = teacher.qualification;
    card.querySelector(".teacher-experience").textContent = `${teacher.experience} year${Number(teacher.experience) !== 1 ? "s" : ""}`;
    card.querySelector(".teacher-specialization").textContent = teacher.specialization || "Not specified";
    card.querySelector(".teacher-email").textContent = teacher.email || "Not provided";
    card.querySelector(".teacher-phone").textContent = teacher.phone || "Not provided";
    card.querySelector(".teacher-office").textContent = teacher.office || "Not provided";
    card.querySelector(".teacher-bio").textContent = teacher.bio || "No bio added.";

    const editBtn = card.querySelector(".edit-btn");
    const deleteBtn = card.querySelector(".delete-btn");

    editBtn.addEventListener("click", () => loadTeacherIntoForm(teacher.id));
    deleteBtn.addEventListener("click", () => deleteTeacher(teacher.id));

    facultyGrid.appendChild(card);
  });
}

function loadTeacherIntoForm(id) {
  const teacher = faculty.find((item) => item.id === id);
  if (!teacher) return;

  teacherIdInput.value = teacher.id;
  nameInput.value = teacher.name;
  designationInput.value = teacher.designation;
  departmentInput.value = teacher.department;
  qualificationInput.value = teacher.qualification;
  experienceInput.value = teacher.experience;
  specializationInput.value = teacher.specialization || "";
  emailInput.value = teacher.email || "";
  phoneInput.value = teacher.phone || "";
  officeInput.value = teacher.office || "";
  bioInput.value = teacher.bio || "";
  currentPhotoData = teacher.photo || "";
  photoPreview.src = currentPhotoData || "https://via.placeholder.com/180x180?text=Photo";
  saveBtn.textContent = "Update Teacher";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function deleteTeacher(id) {
  const teacher = faculty.find((item) => item.id === id);
  if (!teacher) return;

  const confirmDelete = confirm(`Delete ${teacher.name}?`);
  if (!confirmDelete) return;

  faculty = faculty.filter((item) => item.id !== id);
  saveFaculty();
  renderFaculty(filteredFaculty());
  resetForm();
}

function resetForm() {
  form.reset();
  teacherIdInput.value = "";
  currentPhotoData = "";
  photoPreview.src = "https://via.placeholder.com/180x180?text=Photo";
  saveBtn.textContent = "Save Teacher";
}

function filteredFaculty() {
  const query = searchInput.value.trim().toLowerCase();

  if (!query) return faculty;

  return faculty.filter((teacher) => {
    return (
      teacher.name.toLowerCase().includes(query) ||
      teacher.department.toLowerCase().includes(query) ||
      (teacher.specialization || "").toLowerCase().includes(query) ||
      teacher.designation.toLowerCase().includes(query)
    );
  });
}

photoInput.addEventListener("change", () => {
  const file = photoInput.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    currentPhotoData = e.target.result;
    photoPreview.src = currentPhotoData;
  };
  reader.readAsDataURL(file);
});

form.addEventListener("submit", (e) => {
  e.preventDefault();

  if (!nameInput.value.trim() || !designationInput.value.trim() || !departmentInput.value.trim() || !qualificationInput.value.trim() || !experienceInput.value.trim()) {
    alert("Please fill all required fields.");
    return;
  }

  const teacherData = {
    id: teacherIdInput.value || crypto.randomUUID(),
    name: nameInput.value.trim(),
    designation: designationInput.value.trim(),
    department: departmentInput.value.trim(),
    qualification: qualificationInput.value.trim(),
    experience: Number(experienceInput.value),
    specialization: specializationInput.value.trim(),
    email: emailInput.value.trim(),
    phone: phoneInput.value.trim(),
    office: officeInput.value.trim(),
    bio: bioInput.value.trim(),
    photo: currentPhotoData || "https://via.placeholder.com/600x400?text=Faculty"
  };

  if (teacherIdInput.value) {
    const index = faculty.findIndex((item) => item.id === teacherIdInput.value);
    if (index !== -1) faculty[index] = teacherData;
  } else {
    faculty.unshift(teacherData);
  }

  saveFaculty();
  renderFaculty(filteredFaculty());
  resetForm();
});

resetBtn.addEventListener("click", resetForm);

clearAllBtn.addEventListener("click", () => {
  const confirmClear = confirm("Are you sure you want to remove all faculty members?");
  if (!confirmClear) return;

  faculty = [];
  saveFaculty();
  renderFaculty([]);
  resetForm();
});

searchInput.addEventListener("input", () => {
  renderFaculty(filteredFaculty());
});

renderFaculty();