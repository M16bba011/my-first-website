// 1. Data ko browser mein save aur load karna
const keys = {
    students: "school_students",
    teachers: "school_teachers",
    attendance: "school_attendance",
    fees: "school_fees",
    results: "school_results"
};

function loadData(key) {
    try {
        return JSON.parse(localStorage.getItem(keys[key])) || [];
    } catch {
        return [];
    }
}

const data = {
    students: loadData("students"),
    teachers: loadData("teachers"),
    attendance: loadData("attendance"),
    fees: loadData("fees"),
    results: loadData("results")
};

function saveData(key) {
    localStorage.setItem(keys[key], JSON.stringify(data[key]));
}

// 2. HTML mein text safely show karna
function safe(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

function makeId() {
    return Date.now().toString(36) +
        Math.random().toString(36).slice(2, 8);
}

function studentName(id) {
    const student = data.students.find(s => s.id === id);
    return student ? student.name : "Deleted student";
}

function emptyRow(columns, message = "No records found") {
    return `<tr><td colspan="${columns}" class="empty-row">${message}</td></tr>`;
}

// 3. Navigation: pages change karna
function showPage(pageId) {
    const page = document.getElementById(pageId);
    if (!page) return;

    document.querySelectorAll(".page").forEach(section => {
        section.classList.remove("active");
    });

    page.classList.add("active");

    document.querySelectorAll(".nav-link").forEach(link => {
        link.classList.toggle(
            "active",
            link.dataset.page === pageId
        );
    });

    const link = document.querySelector(
        `.nav-link[data-page="${pageId}"]`
    );

    document.getElementById("page-title").textContent =
        link ? link.textContent.replace(/^[^\w]+/, "").trim() : "Dashboard";

    window.scrollTo({ top: 0, behavior: "smooth" });
}

document.querySelectorAll(".nav-link").forEach(link => {
    link.addEventListener("click", event => {
        event.preventDefault();
        showPage(link.dataset.page);
    });
});

document.querySelectorAll("[data-go]").forEach(button => {
    button.addEventListener("click", () => {
        showPage(button.dataset.go);
    });
});

// 4. Student dropdowns update karna
function updateStudentOptions() {
    const dropdownIds = [
        "attendance-student",
        "fee-student",
        "result-student"
    ];

    dropdownIds.forEach(id => {
        const select = document.getElementById(id);
        const oldValue = select.value;

        select.innerHTML =
            '<option value="">Select student</option>';

        data.students.forEach(student => {
            const option = document.createElement("option");
            option.value = student.id;
            option.textContent =
                `${student.name} (${student.roll})`;
            select.appendChild(option);
        });

        if (data.students.some(s => s.id === oldValue)) {
            select.value = oldValue;
        }
    });
}

// 5. Student records display karna
function renderStudents() {
    const search = document.getElementById("student-search")
        .value.trim().toLowerCase();

    const students = data.students.filter(student =>
        [student.name, student.roll, student.className, student.phone]
            .some(value => String(value).toLowerCase().includes(search))
    );

    document.getElementById("students-list").innerHTML =
        students.length
            ? students.map(student => `
                <tr>
                    <td>${safe(student.name)}</td>
                    <td>${safe(student.roll)}</td>
                    <td>${safe(student.className)}</td>
                    <td>${safe(student.phone || "-")}</td>
                    <td>
                        <button class="delete-btn"
                            data-delete="students"
                            data-id="${student.id}">Delete</button>
                    </td>
                </tr>
            `).join("")
            : emptyRow(5);
}

document.getElementById("student-search")
    .addEventListener("input", renderStudents);

document.getElementById("student-form")
    .addEventListener("submit", event => {
        event.preventDefault();

        const form = event.currentTarget;
        const fields = new FormData(form);

        const roll = fields.get("roll").trim();

        if (data.students.some(s => s.roll.toLowerCase() === roll.toLowerCase())) {
            alert("This roll number already exists.");
            return;
        }

        data.students.push({
            id: makeId(),
            name: fields.get("name").trim(),
            roll: roll,
            className: fields.get("className").trim(),
            phone: fields.get("phone").trim()
        });

        saveData("students");
        form.reset();
        renderAll();

        alert("Student added successfully!");
    });

// 6. Teacher records
function renderTeachers() {
    document.getElementById("teachers-list").innerHTML =
        data.teachers.length
            ? data.teachers.map(teacher => `
                <tr>
                    <td>${safe(teacher.name)}</td>
                    <td>${safe(teacher.subject)}</td>
                    <td>${safe(teacher.phone || "-")}</td>
                    <td>
                        <button class="delete-btn"
                            data-delete="teachers"
                            data-id="${teacher.id}">Delete</button>
                    </td>
                </tr>
            `).join("")
            : emptyRow(4);
}

document.getElementById("teacher-form")
    .addEventListener("submit", event => {
        event.preventDefault();

        const fields = new FormData(event.currentTarget);

        data.teachers.push({
            id: makeId(),
            name: fields.get("name").trim(),
            subject: fields.get("subject").trim(),
            phone: fields.get("phone").trim()
        });

        saveData("teachers");
        event.currentTarget.reset();
        renderAll();

        alert("Teacher added successfully!");
    });

// 7. Attendance records
function renderAttendance() {
    document.getElementById("attendance-list").innerHTML =
        data.attendance.length
            ? [...data.attendance].reverse().map(record => `
                <tr>
                    <td>${safe(studentName(record.studentId))}</td>
                    <td>${safe(record.date)}</td>
                    <td>
                        <span class="status ${safe(record.status)}">
                            ${safe(record.status)}
                        </span>
                    </td>
                    <td>
                        <button class="delete-btn"
                            data-delete="attendance"
                            data-id="${record.id}">Delete</button>
                    </td>
                </tr>
            `).join("")
            : emptyRow(4);
}

document.getElementById("attendance-form")
    .addEventListener("submit", event => {
        event.preventDefault();

        const fields = new FormData(event.currentTarget);
        const studentId = fields.get("studentId");
        const date = fields.get("date");

        const duplicate = data.attendance.some(record =>
            record.studentId === studentId && record.date === date
        );

        if (duplicate) {
            alert("Attendance for this student and date already exists.");
            return;
        }

        data.attendance.push({
            id: makeId(),
            studentId,
            date,
            status: fields.get("status")
        });

        saveData("attendance");
        event.currentTarget.reset();
        document.getElementById("attendance-date").value =
            new Date().toLocaleDateString("en-CA");

        renderAll();
        alert("Attendance saved successfully!");
    });

// 8. Fee records
function renderFees() {
    document.getElementById("fees-list").innerHTML =
        data.fees.length
            ? [...data.fees].reverse().map(fee => `
                <tr>
                    <td>${safe(studentName(fee.studentId))}</td>
                    <td>Rs. ${Number(fee.amount).toLocaleString()}</td>
                    <td>${safe(fee.month)}</td>
                    <td>
                        <span class="status ${safe(fee.status)}">
                            ${safe(fee.status)}
                        </span>
                    </td>
                    <td>
                        <button class="delete-btn"
                            data-delete="fees"
                            data-id="${fee.id}">Delete</button>
                    </td>
                </tr>
            `).join("")
            : emptyRow(5);
}

document.getElementById("fee-form")
    .addEventListener("submit", event => {
        event.preventDefault();

        const fields = new FormData(event.currentTarget);
        const amount = Number(fields.get("amount"));

        if (!Number.isFinite(amount) || amount <= 0) {
            alert("Please enter a valid fee amount.");
            return;
        }

        data.fees.push({
            id: makeId(),
            studentId: fields.get("studentId"),
            amount,
            month: fields.get("month"),
            status: fields.get("status")
        });

        saveData("fees");
        event.currentTarget.reset();
        renderAll();

        alert("Fee record saved successfully!");
    });

// 9. Results and percentage
function renderResults() {
    document.getElementById("results-list").innerHTML =
        data.results.length
            ? [...data.results].reverse().map(result => {
                const percentage =
                    (Number(result.marks) / Number(result.total)) * 100;

                return `
                    <tr>
                        <td>${safe(studentName(result.studentId))}</td>
                        <td>${safe(result.subject)}</td>
                        <td>${result.marks} / ${result.total}</td>
                        <td>${percentage.toFixed(2)}%</td>
                        <td>
                            <button class="delete-btn"
                                data-delete="results"
                                data-id="${result.id}">Delete</button>
                        </td>
                    </tr>
                `;
            }).join("")
            : emptyRow(5);
}

document.getElementById("result-form")
    .addEventListener("submit", event => {
        event.preventDefault();

        const fields = new FormData(event.currentTarget);
        const marks = Number(fields.get("marks"));
        const total = Number(fields.get("total"));

        if (
            !Number.isFinite(marks) ||
            !Number.isFinite(total) ||
            total <= 0 ||
            marks < 0 ||
            marks > total
        ) {
            alert("Marks must be between 0 and total marks.");
            return;
        }

        data.results.push({
            id: makeId(),
            studentId: fields.get("studentId"),
            subject: fields.get("subject").trim(),
            marks,
            total
        });

        saveData("results");
        event.currentTarget.reset();
        renderAll();

        alert("Result saved successfully!");
    });

// 10. Delete records
document.addEventListener("click", event => {
    const button = event.target.closest("[data-delete]");
    if (!button) return;

    const key = button.dataset.delete;
    const id = button.dataset.id;

    if (!Object.hasOwn(data, key)) return;

    if (!confirm("Are you sure you want to delete this record?")) {
        return;
    }

    data[key] = data[key].filter(record => record.id !== id);
    saveData(key);
    renderAll();
});

// 11. Dashboard numbers update karna
function renderDashboard() {
    document.getElementById("total-students").textContent =
        data.students.length;

    document.getElementById("total-teachers").textContent =
        data.teachers.length;

    document.getElementById("total-attendance").textContent =
        data.attendance.length;

    const collected = data.fees
        .filter(fee => fee.status === "Paid")
        .reduce((sum, fee) => sum + Number(fee.amount), 0);

    document.getElementById("total-fees").textContent =
        "Rs. " + collected.toLocaleString();
}

// 12. Sab pages refresh karna
function renderAll() {
    updateStudentOptions();
    renderStudents();
    renderTeachers();
    renderAttendance();
    renderFees();
    renderResults();
    renderDashboard();
}

// 13. Default date aur initial display
document.getElementById("attendance-date").value =
    new Date().toLocaleDateString("en-CA");

renderAll();