let data = [
    { id: 1, name: "TCS", role: "Software Engineer", date: "2026-03-30", status: "ongoing" },
    { id: 2, name: "Infosys", role: "System Engineer", date: "2026-03-28", status: "ongoing" },
    { id: 3, name: "Wipro", role: "Project Engineer", date: "2026-04-05", status: "upcoming" }
];

let currentTab = "ongoing";
let adminMode = false;
let editId = null;

const cards = document.getElementById("cards");

/* Render */
function render() {
    cards.innerHTML = "";

    data.filter(d => d.status === currentTab)
        .forEach(item => {
            let div = document.createElement("div");
            div.className = "card";

            div.innerHTML = `
                <h4>${item.name}</h4>
                <p>${item.role}</p>
                <p>${item.date}</p>
                ${adminMode ? `
                <div class="actions">
                    <button onclick="edit(${item.id})">Edit</button>
                    <button onclick="del(${item.id})">Delete</button>
                </div>` : ""}
            `;

            cards.appendChild(div);
        });
}

/* Tabs */
document.querySelectorAll(".tab").forEach(tab => {
    tab.onclick = () => {
        document.querySelector(".active").classList.remove("active");
        tab.classList.add("active");
        currentTab = tab.dataset.tab;
        render();
    };
});

/* Admin Toggle */
document.getElementById("adminToggle").onclick = () => {
    adminMode = !adminMode;
    document.getElementById("addBtn").classList.toggle("hidden");
    render();
};

/* Modal */
const modal = document.getElementById("modal");

document.getElementById("addBtn").onclick = () => {
    modal.classList.remove("hidden");
};

document.getElementById("closeBtn").onclick = () => {
    modal.classList.add("hidden");
};

/* Save */
document.getElementById("saveBtn").onclick = () => {
    let name = document.getElementById("name").value;
    let role = document.getElementById("role").value;
    let date = document.getElementById("date").value;
    let status = document.getElementById("status").value;

    if (editId) {
        let item = data.find(d => d.id === editId);
        Object.assign(item, { name, role, date, status });
        editId = null;
    } else {
        data.push({ id: Date.now(), name, role, date, status });
    }

    modal.classList.add("hidden");
    render();
};

/* Edit */
function edit(id) {
    let item = data.find(d => d.id === id);
    document.getElementById("name").value = item.name;
    document.getElementById("role").value = item.role;
    document.getElementById("date").value = item.date;
    document.getElementById("status").value = item.status;

    editId = id;
    modal.classList.remove("hidden");
}

/* Delete */
function del(id) {
    data = data.filter(d => d.id !== id);
    render();
}

/* Initial */
render();