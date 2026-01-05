// Data Mapping for Semesters
const academicData = {
  1: {
    gpa: "GPA 8.0",
    status: "Completed",
    subjects: [
      { name: "Mathematics I", grade: "A", type: "grade-a" },
      { name: "Engineering Physics", grade: "B+", type: "grade-b" },
    ],
  },
  6: {
    gpa: "CGPA 8.5",
    status: "Active - Semester 6",
    subjects: [
      { name: "Data Structures", grade: "A", type: "grade-a" },
      { name: "Database Management", grade: "A+", type: "grade-a" },
      { name: "Operating Systems", grade: "B+", type: "grade-b" },
      { name: "Web Development", grade: "A+", type: "grade-a" },
    ],
  },
  // Add other semesters as needed
};

const combo = document.getElementById("semester-select");
const subjectList = document.getElementById("subjects-container");
const gpaBadge = document.getElementById("gpa-badge");
const statusText = document.getElementById("current-sem-text");

function updateUI(sem) {
  const data = academicData[sem] || {
    gpa: "N/A",
    status: "No Data",
    subjects: [],
  };

  // Update GPA and Status labels
  gpaBadge.textContent = data.gpa;
  statusText.textContent = data.status;

  // Clear and build subject list
  subjectList.innerHTML = "";
  if (data.subjects.length === 0) {
    subjectList.innerHTML = `<p style="color:#666; text-align:center;">No data for Sem ${sem}</p>`;
  } else {
    data.subjects.forEach((sub) => {
      const html = `
                <div class="subject-item">
                    <span class="subject-name">${sub.name}</span>
                    <span class="subject-grade ${sub.type}">${sub.grade}</span>
                </div>`;
      subjectList.insertAdjacentHTML("beforeend", html);
    });
  }
}

// Event listener for the Combo-box change
combo.addEventListener("change", (e) => {
  updateUI(e.target.value);
});

// Initial load (default sem 6)
updateUI(6);
