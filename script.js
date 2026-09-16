// ---------------------------------------------------------
// Config: subjects per course, max marks per subject, pass rules
// ---------------------------------------------------------
const COURSE_SUBJECTS = {
  science: ["Physics", "Chemistry", "Mathematics", "Biology"],
  commerce: ["Accountancy", "Business Studies", "Economics", "Statistics"],
  arts: ["History", "Political Science", "Geography", "Sociology"]
};

const MAX_MARKS_PER_SUBJECT = 100;
const PASS_PERCENTAGE = 40;   // overall pass threshold
const PASS_PER_SUBJECT = 33;  // must clear each subject too

// In-memory store of registered students (resets on page reload)
const students = [];

// ---------------------------------------------------------
// DOM references
// ---------------------------------------------------------
const courseSelect = document.getElementById("course");
const subjectsContainer = document.getElementById("subjectsContainer");
const form = document.getElementById("regForm");
const formAlert = document.getElementById("formAlert");
const resultsTableBody = document.getElementById("resultsTableBody");
const emptyRow = document.getElementById("emptyRow");

// ---------------------------------------------------------
// Build subject/marks inputs whenever the course changes
// ---------------------------------------------------------
courseSelect.addEventListener("change", () => {
  const course = courseSelect.value;
  subjectsContainer.innerHTML = "";

  if (!course) return;

  const heading = document.createElement("label");
  heading.className = "form-label fw-semibold";
  heading.textContent = "Marks (out of " + MAX_MARKS_PER_SUBJECT + ")";
  subjectsContainer.appendChild(heading);

  COURSE_SUBJECTS[course].forEach((subject) => {
    const row = document.createElement("div");
    row.className = "subject-row";

    const label = document.createElement("label");
    label.textContent = subject;
    label.setAttribute("for", "marks-" + subject);

    const input = document.createElement("input");
    input.type = "number";
    input.className = "form-control form-control-sm subject-mark";
    input.id = "marks-" + subject;
    input.dataset.subject = subject;
    input.min = 0;
    input.max = MAX_MARKS_PER_SUBJECT;
    input.required = true;
    input.placeholder = "0-100";

    row.appendChild(label);
    row.appendChild(input);
    subjectsContainer.appendChild(row);
  });
});

// ---------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------
function showError(message) {
  formAlert.textContent = message;
  formAlert.classList.remove("d-none");
}

function clearError() {
  formAlert.classList.add("d-none");
  formAlert.textContent = "";
}

function validateForm() {
  const name = document.getElementById("studentName").value.trim();
  const roll = document.getElementById("rollNo").value.trim();
  const course = courseSelect.value;
  const markInputs = document.querySelectorAll(".subject-mark");

  if (!name) return "Please enter the student's name.";
  if (!roll) return "Please enter a roll number.";
  if (!course) return "Please select a course.";
  if (markInputs.length === 0) return "Select a course to load its subjects.";

  for (const input of markInputs) {
    const value = input.value.trim();
    if (value === "") {
      return "Please enter marks for " + input.dataset.subject + ".";
    }
    const num = Number(value);
    if (Number.isNaN(num) || num < 0 || num > MAX_MARKS_PER_SUBJECT) {
      return "Marks for " + input.dataset.subject + " must be between 0 and " + MAX_MARKS_PER_SUBJECT + ".";
    }
  }

  return null; // no errors
}

// ---------------------------------------------------------
// Calculation
// ---------------------------------------------------------
function calculateResult(course) {
  const markInputs = document.querySelectorAll(".subject-mark");
  const marks = {};
  let total = 0;
  let anySubjectFailed = false;

  markInputs.forEach((input) => {
    const value = Number(input.value);
    marks[input.dataset.subject] = value;
    total += value;
    if (value < PASS_PER_SUBJECT) anySubjectFailed = true;
  });

  const maxTotal = markInputs.length * MAX_MARKS_PER_SUBJECT;
  const percentage = ((total / maxTotal) * 100).toFixed(2);
  const passed = !anySubjectFailed && percentage >= PASS_PERCENTAGE;

  return { course, marks, total, maxTotal, percentage, passed };
}

// ---------------------------------------------------------
// Rendering
// ---------------------------------------------------------
function renderLatestResult(student) {
  document.getElementById("latestResultCard").classList.remove("d-none");
  document.getElementById("latestName").textContent = student.name;
  document.getElementById("latestCourse").textContent = capitalize(student.course);
  document.getElementById("latestTotal").textContent = student.total;
  document.getElementById("latestMax").textContent = student.maxTotal;
  document.getElementById("latestPercentage").textContent = student.percentage;

  const statusEl = document.getElementById("latestStatus");
  statusEl.textContent = student.passed ? "PASS" : "FAIL";
  statusEl.className = "badge " + (student.passed ? "badge-pass" : "badge-fail");
}

function renderTableRow(student) {
  if (emptyRow) emptyRow.remove();

  const row = document.createElement("tr");
  row.innerHTML = `
    <td>${student.roll}</td>
    <td>${student.name}</td>
    <td>${capitalize(student.course)}</td>
    <td>${student.total} / ${student.maxTotal}</td>
    <td>${student.percentage}%</td>
    <td><span class="badge ${student.passed ? "badge-pass" : "badge-fail"}">
      ${student.passed ? "PASS" : "FAIL"}
    </span></td>
  `;
  resultsTableBody.appendChild(row);
}

function capitalize(word) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

// ---------------------------------------------------------
// Form submit
// ---------------------------------------------------------
form.addEventListener("submit", (e) => {
  e.preventDefault();
  clearError();

  const error = validateForm();
  if (error) {
    showError(error);
    return;
  }

  const name = document.getElementById("studentName").value.trim();
  const roll = document.getElementById("rollNo").value.trim();
  const course = courseSelect.value;

  const result = calculateResult(course);
  const student = { name, roll, ...result };

  students.push(student);
  renderLatestResult(student);
  renderTableRow(student);

  form.reset();
  subjectsContainer.innerHTML = "";
});
