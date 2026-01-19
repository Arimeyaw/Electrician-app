document.addEventListener("DOMContentLoaded", () => {
  const notification = document.getElementById("notification");
  const customer = document.getElementById("customer");
  const phone = document.getElementById("phone");
  const locationEl = document.getElementById("location");
  const jobType = document.getElementById("jobType");
  const roomsCount = document.getElementById("roomsCount");
  const roomsDiv = document.getElementById("rooms");
  const quality = document.getElementById("quality");
  const saveJobBtn = document.getElementById("saveJobBtn");
  const jobsDiv = document.getElementById("jobs");
  const invoiceContent = document.getElementById("invoiceContent");
  const downloadPDFBtn = document.getElementById("downloadPDFBtn");
  const whatsappBtn = document.getElementById("whatsappBtn");

  let editingJobId = null;
  let activeInvoice = null;
  const BRANDS = { economy:"Local/Generic", standard:"Nexans/Philips", premium:"Prysmian/Osram" };

  function showNotification(msg,type="success"){
    notification.innerText=msg;
    notification.className="notification show";
    if(type==="error") notification.classList.add("error");
    setTimeout(()=>notification.className="notification hidden",2500);
  }

  function getPrices(){ return JSON.parse(localStorage.getItem("prices"))||{ bulb:25,switch:20,socket:35,wire15:12,wire25:18 }; }

  function renderRooms(){
    roomsDiv.innerHTML="";
    for(let i=0;i<+roomsCount.value;i++){
      const sel=document.createElement("select");
      sel.classList.add("room");
      sel.innerHTML=`<option value="small">Small Room</option><option value="medium">Medium Room</option><option value="large">Large Room</option>`;
      roomsDiv.appendChild(sel);
    }
  }
  roomsCount.addEventListener("input", renderRooms);

  function estimate(rooms){
    let bulbs=0,switches=0,sockets=0,wire15=0,wire25=0;
    rooms.forEach(size=>{
      bulbs+=2; switches+=2; let s=2;
      if(size==="medium") s+=1;
      if(size==="large") s+=2;
      sockets+=s; wire15+=15; wire25+=s*5;
    });
    const p=getPrices();
    const cost=bulbs*p.bulb+switches*p.switch+sockets*p.socket+wire15*p.wire15+wire25*p.wire25;
    return {bulbs,switches,sockets,wire15,wire25,cost};
  }

  function renderJobs(){
    const jobs=JSON.parse(localStorage.getItem("jobs"))||[];
    jobsDiv.innerHTML="";
    jobs.forEach(j=>{
      const jobCard=document.createElement("div");
      jobCard.classList.add("job");

      const delBtn=document.createElement("button");
      delBtn.classList.add("delete-btn"); delBtn.innerText="🗑"; delBtn.onclick=()=>deleteJob(j.id);

      const infoDiv=document.createElement("div");
      infoDiv.classList.add("job-info");
      infoDiv.innerHTML=`<strong>${j.customer}</strong><br/><span class="small">Rooms: ${j.rooms} | Est: ₵${j.estimate.cost}</span>`;
      const editBtn=document.createElement("button"); editBtn.classList.add("edit-btn"); editBtn.innerText="✏️"; editBtn.onclick=()=>editJob(j.id);
      const invoiceBtn=document.createElement("button"); invoiceBtn.classList.add("small-btn"); invoiceBtn.innerText="Invoice"; invoiceBtn.onclick=()=>openInvoice(j.id);

      infoDiv.appendChild(editBtn); infoDiv.appendChild(invoiceBtn);

      jobCard.appendChild(delBtn); jobCard.appendChild(infoDiv);
      jobsDiv.appendChild(jobCard);
    });
  }

  function saveJob(){
    const rooms=[...document.querySelectorAll(".room")].map(r=>r.value);
    const est=estimate(rooms);
    let jobs=JSON.parse(localStorage.getItem("jobs"))||[];

    if(editingJobId){
      const idx=jobs.findIndex(j=>j.id===editingJobId);
      jobs[idx]={id:editingJobId, customer:customer.value, phone:phone.value, location:locationEl.value, jobType:jobType.value, rooms:rooms.length, estimate:est, brand:BRANDS[quality.value]};
      showNotification("Job updated ✔"); editingJobId=null;
    }else{
      jobs.unshift({id:Date.now(), customer:customer.value, phone:phone.value, location:locationEl.value, jobType:jobType.value, rooms:rooms.length, estimate:est, brand:BRANDS[quality.value]});
      showNotification("Job saved ✔");
    }
    localStorage.setItem("jobs",JSON.stringify(jobs));
    renderJobs(); customer.value=phone.value=locationEl.value=""; roomsCount.value=1; renderRooms();
  }
  saveJobBtn.addEventListener("click",saveJob);

  window.editJob=function(id){
    const jobs=JSON.parse(localStorage.getItem("jobs"))||[];
    const job=jobs.find(j=>j.id===id); if(!job) return;
    editingJobId=id; customer.value=job.customer; phone.value=job.phone; locationEl.value=job.location; jobType.value=job.jobType; roomsCount.value=job.rooms; renderRooms();
    showNotification("Editing job ✔");
  }

  window.deleteJob=function(id){
    let jobs=JSON.parse(localStorage.getItem("jobs"))||[];
    jobs=jobs.filter(j=>j.id!==id);
    localStorage.setItem("jobs",JSON.stringify(jobs));
    renderJobs();
    showNotification("Job deleted ✔");
  }

  window.openInvoice=function(id){
    const jobs=JSON.parse(localStorage.getItem("jobs"))||[];
    const j=jobs.find(j=>j.id===id); if(!j) return; activeInvoice=j;
    const company=JSON.parse(localStorage.getItem("company"))||{};
    const logo=company.companyLogo||""; const sign=company.companySignature||""; const companyName=company.companyName||""; const electrician=company.electricianName||"";

    const logoHTML=logo?`<div style="text-align:center;margin-bottom:10px;"><img src="${logo}" style="max-width:150px;"></div>`:"";
    const signatureHTML=sign?`<div class="signature"><img src="${sign}" /><p>Authorized Signature</p></div>`:"";

    invoiceContent.innerHTML=`
      ${logoHTML}
      <h3>${companyName}</h3>
      <p class="small">${electrician}</p>
      <p><strong>Customer:</strong> ${j.customer}</p>
      <p><strong>Phone:</strong> ${j.phone}</p>
      <p><strong>Location:</strong> ${j.location}</p>
      <table>
        <tr><td>Bulbs</td><td>${j.estimate.bulbs}</td></tr>
        <tr><td>Switches</td><td>${j.estimate.switches}</td></tr>
        <tr><td>Sockets</td><td>${j.estimate.sockets}</td></tr>
        <tr><td>1.5mm Cable (m)</td><td>${j.estimate.wire15}</td></tr>
        <tr><td>2.5mm Cable (m)</td><td>${j.estimate.wire25}</td></tr>
        <tr class="total"><td>Total</td><td>₵${j.estimate.cost}</td></tr>
      </table>
      <p class="small">Recommended brands: ${j.brand}</p>
      ${signatureHTML}
    `;
  }

  downloadPDFBtn.addEventListener("click",()=>{
    if(!activeInvoice){ showNotification("No invoice selected ❌","error"); return; }
    const images=invoiceContent.querySelectorAll("img");
    let loadedCount=0;
    if(images.length===0) html2pdf().from(invoiceContent).save();
    images.forEach(img=>{if(img.complete){loadedCount++; if(loadedCount===images.length) html2pdf().from(invoiceContent).save();} else{img.onload=img.onerror=()=>{loadedCount++; if(loadedCount===images.length) html2pdf().from(invoiceContent).save();}}});
  });

  whatsappBtn.addEventListener("click",()=>{
    if(!activeInvoice){ showNotification("No invoice selected ❌","error"); return; }
    const j=activeInvoice;
    const text=`Electrical Job Invoice\nCustomer: ${j.customer}\nRooms: ${j.rooms}\nTotal Cost: ₵${j.estimate.cost}\nSent via Electrician App`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`,"_blank");
  });

  renderRooms(); renderJobs();
});