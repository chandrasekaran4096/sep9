// ====== LocalStorage Keys ======
const LS_KEYS = { USERS: 'students_data_v1', AUTH: 'auth_user_v1' };

// Helpers
function safeParse(str, fb) { try { return JSON.parse(str) } catch(e){ return fb; } }
function getUsers(){ return safeParse(localStorage.getItem(LS_KEYS.USERS), []); }
function saveUsers(list){ localStorage.setItem(LS_KEYS.USERS, JSON.stringify(list)); }
function setAuth(email){ localStorage.setItem(LS_KEYS.AUTH, email); }
function getAuth(){ return localStorage.getItem(LS_KEYS.AUTH); }
function clearAuth(){ localStorage.removeItem(LS_KEYS.AUTH); }

// Validation
function validateField(f, val){
  if(f.required && (!val || val.length===0)) return `${f.label} required`;
  if(f.pattern && !(new RegExp(f.pattern).test(val))) return `${f.label} invalid`;
  if(f.type==="email" && !/^[^@]+@[^@]+\.[^@]+$/.test(val)) return "Invalid email";
  return null;
}

// Dynamic Form builder
function buildForm(){
  const config = safeParse($("#formConfig").html(), {fields:[]});
  const $form = $('<form id="regForm" class="space-y-4"></form>');
  config.fields.forEach(f=>{
    const label = `<label class="block mb-1">${f.label}${f.required?"*":""}</label>`;
    let input;
    if(f.type==="select"){
      input = $(`<select id="${f.id}" class="w-full border px-2 py-2 rounded"></select>`);
      input.append('<option value="">Select</option>');
      (f.options||[]).forEach(o=> input.append(`<option value="${o}">${o}</option>`));
    } else if(f.type==="multiselect"){
      input = $(`<select id="${f.id}" multiple class="w-full select2"></select>`);
      (f.options||[]).forEach(o=> input.append(`<option value="${o}">${o}</option>`));
    } else if(f.type==="tags"){
      input = $(`<input id="${f.id}" />`);
    } else if(f.type==="textarea"){
      input = $(`<textarea id="${f.id}" class="w-full border px-2 py-2 rounded"></textarea>`);
    } else if(f.type==="date"){
      input = $(`<input type="text" id="${f.id}" class="border px-2 py-2 rounded w-full">`);
    } else {
      input = $(`<input type="${f.type}" id="${f.id}" class="w-full border px-2 py-2 rounded">`);
    }
    $form.append($('<div>').append(label).append(input));
  });
  $form.append('<button class="bg-blue-600 text-white px-4 py-2 rounded" type="submit">Submit</button>');
  $("#dynamicFormContainer").html($form);

  // plugins
  $(".select2").select2({width:"100%"});
  $("#dob").flatpickr({dateFormat:"Y-m-d"});
  if(document.querySelector("#skills")) new Tagify(document.querySelector("#skills"));
}

// Register handler
function handleRegister(fields){
  const data={};
  const errors=[];
  fields.forEach(f=>{
    let val=$("#"+f.id).val();
    if(f.type==="multiselect") val=$("#"+f.id).val()||[];
    if(f.type==="tags"){
      const el=document.querySelector("#"+f.id);
      if(el && el._tagify) val=el._tagify.value.map(t=>t.value);
    }
    const err=validateField(f,val);
    if(err) errors.push(err);
    data[f.id]=val;
  });
  if(errors.length){ alert(errors.join("\n")); return; }

  data.createdAt=new Date().toISOString();
  const users=getUsers();
  users.push(data);
  saveUsers(users);

  // save login credentials
  localStorage.setItem("login_cred_"+data.email, JSON.stringify({email:data.email,password:data.password}));
  setAuth(data.email);

  alert("Registration successful! Redirecting to Dashboard...");
  window.location="dashboard.html";
}

// Dashboard
function buildDashboard(){
  const users=getUsers();
  if($.fn.DataTable.isDataTable("#studentsTable")){
    $("#studentsTable").DataTable().destroy();
  }
  $("#studentsTable tbody").empty();
  users.forEach((u,i)=>{
    $("#studentsTable tbody").append(
      `<tr>
        <td>${u.name||""}</td>
        <td>${u.email||""}</td>
        <td>${u.mobile||""}</td>
        <td>${u.course||""}</td>
        <td>${u.dob||""}</td>
        <td>${(u.skills||[]).join(",")}</td>
        <td><button class="delBtn text-red-600" data-i="${i}">Delete</button></td>
      </tr>`
    );
  });
  $("#studentsTable").DataTable();
  $(".delBtn").on("click",function(){
    const i=$(this).data("i");
    const arr=getUsers(); arr.splice(i,1); saveUsers(arr); buildDashboard();
  });

  // Charts
  const courseCounts={};
  users.forEach(u=>{ if(u.course) courseCounts[u.course]=(courseCounts[u.course]||0)+1; });
  if(window.pieChart) window.pieChart.destroy();
  window.pieChart=new Chart($("#pieChart"),{
    type:"pie",
    data:{labels:Object.keys(courseCounts),datasets:[{data:Object.values(courseCounts)}]}
  });
  
  const monthCounts=Array(12).fill(0);
  users.forEach(u=>{ if(u.createdAt){monthCounts[new Date(u.createdAt).getMonth()]++;} });
  if(window.barChart) window.barChart.destroy();
  window.barChart=new Chart($("#barChart"),{
    type:"bar",
    data:{labels:["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],
      datasets:[{label:"Registrations",data:monthCounts,backgroundColor:"rgba(54,162,235,0.6)"}]}
  });
}

// Page detection
$(function(){
  const page=location.pathname.split("/").pop();

  // ===== LOGIN PAGE =====
  if(page==="login.html"){
    $("#loginForm").on("submit",function(e){
      e.preventDefault();
      const email=$("#loginEmail").val().trim();
      const pwd=$("#loginPassword").val();
      const cred=JSON.parse(localStorage.getItem("login_cred_"+email)||"null");
      if(!cred){ alert("No account found"); return; }
      if(cred.password!==pwd){ alert("Wrong password"); return; }
      setAuth(email); window.location="dashboard.html";
    });
  }

  // ===== REGISTER PAGE =====
  if(page==="register.html"){ 
    buildForm();
    // attach submit after form build
    $(document).on("submit", "#regForm", function(e){
      e.preventDefault();
      const config = safeParse($("#formConfig").html(), {fields:[]});
      handleRegister(config.fields);
    });
  }

  // ===== DASHBOARD PAGE =====
  if(page==="dashboard.html"){
    if(!getAuth()){ window.location="login.html"; return; }
    $("#logoutBtn").on("click",()=>{ clearAuth(); window.location="login.html"; });
    buildDashboard();
  }
});