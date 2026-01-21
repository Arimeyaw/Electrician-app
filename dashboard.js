document.addEventListener("DOMContentLoaded", () => {
  const customer = document.getElementById("customer");
  const phone = document.getElementById("phone");
  const locationEl = document.getElementById("location");
  const roomsCount = document.getElementById("roomsCount");
  const quality = document.getElementById("quality");

  const saveJobBtn = document.getElementById("saveJobBtn");
  const jobsDiv = document.getElementById("jobs");
  const invoiceContent = document.getElementById("invoiceContent");

  const downloadPDFBtn = document.getElementById("downloadPDFBtn");
  const whatsappBtn = document.getElementById("whatsappBtn");
  const notification = document.getElementById("notification");

  let activeInvoice = null;

  const BRANDS = {
    economy: "Local / Generic",
    standard: "Philips / Nexans",
    premium: "Osram / Prysmian",
  };

  function notify(msg, error = false) {
    notification.innerText = msg;
    notification.className = "notification show";
    if (error) notification.classList.add("error");
    setTimeout(() => (notification.className = "notification hidden"), 2500);
  }

  /* ================= MATERIALS FROM SETTINGS ================= */

  function getRoomMaterials(roomCount) {
    const roomTypes = JSON.parse(localStorage.getItem("roomTypes")) || [];

    let total = { bulb: 0, switch: 0, socket: 0, wire15: 0, wire25: 0 };

    roomTypes.forEach((rt) => {
      total.bulb += rt.bulb * roomCount;
      total.switch += rt.switch * roomCount;
      total.socket += rt.socket * roomCount;
      total.wire15 += rt.wire15 * roomCount;
      total.wire25 += rt.wire25 * roomCount;
    });

    return total;
  }

  function getPrices() {
    return (
      JSON.parse(localStorage.getItem("prices")) || {
        bulb: 25,
        switch: 20,
        socket: 35,
        wire15: 12,
        wire25: 18,
      }
    );
  }

  function calculateCost(mat) {
    const p = getPrices();
    return (
      mat.bulb * p.bulb +
      mat.switch * p.switch +
      mat.socket * p.socket +
      mat.wire15 * p.wire15 +
      mat.wire25 * p.wire25
    );
  }

  /* ================= SAVE JOB ================= */

  saveJobBtn.onclick = () => {
    if (!customer.value) {
      notify("Customer name required", true);
      return;
    }

    const rooms = +roomsCount.value;
    const materials = getRoomMaterials(rooms);
    const cost = calculateCost(materials);

    const job = {
      id: Date.now(),
      invoiceNo: `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Date.now()}`,
      date: new Date().toLocaleDateString(),
      customer: customer.value,
      phone: phone.value,
      location: locationEl.value,
      rooms,
      materials,
      cost,
      brand: BRANDS[quality.value],
    };

    const jobs = JSON.parse(localStorage.getItem("jobs")) || [];
    jobs.unshift(job);
    localStorage.setItem("jobs", JSON.stringify(jobs));

    customer.value = phone.value = locationEl.value = "";
    notify("Job saved ✔");
    renderJobs();
  };

  /* ================= RENDER JOBS ================= */

  function renderJobs() {
    const jobs = JSON.parse(localStorage.getItem("jobs")) || [];
    jobsDiv.innerHTML = "";

    jobs.forEach((j) => {
      const div = document.createElement("div");
      div.className = "job";

      div.innerHTML = `
        <strong>${j.customer}</strong>
        <small>Invoice: ${j.invoiceNo}</small>
        <button class="small-btn">Invoice</button>
      `;

      div.querySelector("button").onclick = () => openInvoice(j.id);
      jobsDiv.appendChild(div);
    });
  }

  /* ================= INVOICE ================= */

  function openInvoice(id) {
    const jobs = JSON.parse(localStorage.getItem("jobs")) || [];
    const j = jobs.find((x) => x.id === id);
    if (!j) return;

    activeInvoice = j;

    const company = JSON.parse(localStorage.getItem("company")) || {};

    invoiceContent.innerHTML = `
      <div style="text-align:right;font-size:12px">
        <strong>Invoice No:</strong> ${j.invoiceNo}<br>
        <strong>Date:</strong> ${j.date}
      </div>

      <h3>${company.companyName || ""}</h3>
      <p class="small">${company.electricianName || ""}</p>

      <p><strong>Customer:</strong> ${j.customer}</p>
      <p><strong>Location:</strong> ${j.location}</p>

      <table>
        <tr><td>Bulbs</td><td>${j.materials.bulb}</td></tr>
        <tr><td>Switches</td><td>${j.materials.switch}</td></tr>
        <tr><td>Sockets</td><td>${j.materials.socket}</td></tr>
        <tr><td>1.5mm Cable</td><td>${j.materials.wire15} m</td></tr>
        <tr><td>2.5mm Cable</td><td>${j.materials.wire25} m</td></tr>
        <tr class="total"><td>Total</td><td>₵${j.cost}</td></tr>
      </table>

      <p class="small">Recommended Brand: ${j.brand}</p>
    `;
  }

  /* ================= PDF ================= */

  downloadPDFBtn.onclick = () => {
    if (!activeInvoice) {
      notify("No invoice selected", true);
      return;
    }

    html2pdf()
      .set({
        filename: `${activeInvoice.invoiceNo}.pdf`,
        html2canvas: { scale: 2 },
        jsPDF: { format: "a4" },
      })
      .from(invoiceContent)
      .save();
  };

  /* ================= WHATSAPP PDF ================= */

  whatsappBtn.onclick = async () => {
    if (!activeInvoice) {
      notify("No invoice selected", true);
      return;
    }

    await html2pdf()
      .set({
        filename: `${activeInvoice.invoiceNo}.pdf`,
        html2canvas: { scale: 2 },
        jsPDF: { format: "a4" },
      })
      .from(invoiceContent)
      .save();

    window.open(
      `https://wa.me/?text=${encodeURIComponent("Invoice PDF downloaded. Please attach it here.")}`,
      "_blank",
    );
  };

  renderJobs();
});
