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

  // initialize plugins
  $(".select2").select2({width:"100%"});
  $("#dob").flatpickr({dateFormat:"Y-m-d"});
  if(document.querySelector("#skills")) new Tagify(document.querySelector("#skills"));

  // ✅ Attach submit here
  $form.on("submit", function(e){
    e.preventDefault();
    handleRegister(config.fields);
  });
}