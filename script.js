// -------- Safe JSON Parse ----------
function safeParse(str, fallback) {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}

// -------- Build Dynamic Form ----------
function buildForm() {
  const config = safeParse($("#formConfig").html(), { fields: [] });
  const $form = $('<form id="regForm" class="space-y-4"></form>');

  config.fields.forEach(f => {
    const label = `<label class="block mb-1 font-medium">${f.label}${f.required ? "*" : ""}</label>`;
    let input;

    if (f.type === "select") {
      input = $(`<select id="${f.id}" class="w-full border px-2 py-2 rounded"></select>`);
      input.append('<option value="">Select</option>');
      (f.options || []).forEach(o => input.append(`<option value="${o}">${o}</option>`));
    } else if (f.type === "multiselect") {
      input = $(`<select id="${f.id}" multiple class="w-full select2"></select>`);
      (f.options || []).forEach(o => input.append(`<option value="${o}">${o}</option>`));
    } else if (f.type === "tags") {
      input = $(`<input id="${f.id}" />`);
    } else if (f.type === "textarea") {
      input = $(`<textarea id="${f.id}" class="w-full border px-2 py-2 rounded"></textarea>`);
    } else if (f.type === "date") {
      input = $(`<input type="text" id="${f.id}" class="border px-2 py-2 rounded w-full">`);
    } else {
      input = $(`<input type="${f.type}" id="${f.id}" class="w-full border px-2 py-2 rounded">`);
    }

    $form.append($('<div>').append(label).append(input));
  });

  $form.append('<button class="bg-blue-600 text-white px-4 py-2 rounded w-full" type="submit">Register</button>');
  $("#dynamicFormContainer").html($form);

  // Initialize plugins
  $(".select2").select2({ width: "100%" });
  $("#dob").flatpickr({ dateFormat: "Y-m-d" });
  if (document.querySelector("#skills")) new Tagify(document.querySelector("#skills"));

  // Attach submit handler
  $form.on("submit", function (e) {
    e.preventDefault();
    handleRegister(config.fields);
  });
}

// -------- Handle Registration ----------
function handleRegister(fields) {
  try {
    let students = safeParse(localStorage.getItem("students"), []);
    if (!Array.isArray(students)) students = [];

    let student = {};
    let valid = true;

    fields.forEach(f => {
      let val = $(`#${f.id}`).val();
      if (f.type === "tags" && document.querySelector(`#${f.id}`)) {
        val = JSON.parse(document.querySelector(`#${f.id}`).value || "[]").map(t => t.value);
      }

      if (f.required && !val) {
        alert(`${f.label} is required`);
        valid = false;
        return;
      }

      if (f.pattern && !(new RegExp(f.pattern).test(val))) {
        alert(`${f.label} is invalid`);
        valid = false;
        return;
      }

      student[f.id] = val;
    });

    if (!valid) return;

    students.push(student);
    localStorage.setItem("students", JSON.stringify(students));

    alert("✅ Registration successful! Please login with your email and password.");
    window.location.href = "login.html";
  } catch (err) {
    alert("Something went wrong during registration!");
    console.error(err);
  }
}

// -------- Login ----------
function handleLogin(email, password) {
  try {
    const students = safeParse(localStorage.getItem("students"), []);
    if (!Array.isArray(students) || students.length === 0) {
      alert("No registered users found. Please register first.");
      return;
    }

    const match = students.find(u => u.email === email && u.password === password);
    if (match) {
      localStorage.setItem("loggedIn", email);
      alert("✅ Login successful!");
      window.location.href = "dashboard.html";
    } else {
      alert("❌ Invalid email or password. Try again!");
    }
  } catch (err) {
    alert("Login error!");
    console.error(err);
  }
}

// -------- Dashboard Rendering ----------
function renderDashboard() {
  try {
    let students = safeParse(localStorage.getItem("students"), []);
    if (!Array.isArray(students)) students = [];

    const $table = $("#studentsTable tbody");
    $table.empty();

    students.forEach((s, i) => {
      const row = `
        <tr class="border-b">
          <td class="px-2 py-1">${s.name || ""}</td>
          <td class="px-2 py-1">${s.email || ""}</td>
          <td class="px-2 py-1">${s.gender || ""}</td>
          <td class="px-2 py-1">${s.course || ""}</td>
          <td class="px-2 py-1 flex gap-2">
            <button onclick="editStudent(${i})" class="text-blue-600">Edit</button>
            <button onclick="deleteStudent(${i})" class="text-red-600">Delete</button>
          </td>
        </tr>`;
      $table.append(row);
    });

    renderCharts(students);
  } catch (err) {
    alert("Error loading dashboard!");
    console.error(err);
  }
}

// -------- Charts ----------
function renderCharts(students) {
  const ctx1 = document.getElementById("pieChart");
  const ctx2 = document.getElementById("barChart");
  if (!ctx1 || !ctx2) return;

  const courses = {};
  students.forEach(s => {
    if (!courses[s.course]) courses[s.course] = 0;
    courses[s.course]++;
  });

  const labels = Object.keys(courses);
  const data = Object.values(courses);

  if (window.pieInstance) window.pieInstance.destroy();
  if (window.barInstance) window.barInstance.destroy();

  window.pieInstance = new Chart(ctx1, {
    type: "pie",
    data: { labels, datasets: [{ data, backgroundColor: ["#60a5fa", "#f87171", "#34d399", "#fbbf24", "#a78bfa"] }] }
  });

  window.barInstance = new Chart(ctx2, {
    type: "bar",
    data: { labels, datasets: [{ label: "Students per Course", data, backgroundColor: "#60a5fa" }] }
  });
}

// -------- Edit & Delete ----------
function deleteStudent(i) {
  let students = safeParse(localStorage.getItem("students"), []);
  students.splice(i, 1);
  localStorage.setItem("students", JSON.stringify(students));
  renderDashboard();
}

function editStudent(i) {
  alert("✏️ Edit feature not fully implemented yet.");
}

// -------- On Page Load ----------
$(function () {
  const page = location.pathname.split("/").pop();

  if (page === "register.html") {
    buildForm();
  }

  if (page === "login.html") {
    $("#loginForm").on("submit", function (e) {
      e.preventDefault();
      handleLogin($("#email").val(), $("#password").val());
    });
    $("#registerBtn").on("click", () => window.location.href = "register.html");
  }

  if (page === "dashboard.html") {
    renderDashboard();
  }
});