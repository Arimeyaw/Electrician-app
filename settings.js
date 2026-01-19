document.addEventListener("DOMContentLoaded", () => {

  const showNotification = (msg, error = false) => {
    const n = document.getElementById("notification");
    n.textContent = msg;
    n.className = "notification show";
    if (error) n.classList.add("error");
    setTimeout(() => (n.className = "notification hidden"), 2500);
  };

  const toBase64 = (file, cb) => {
    if (!file) return cb(null);
    const reader = new FileReader();
    reader.onload = () => cb(reader.result);
    reader.readAsDataURL(file);
  };

  /* COMPANY INFO */
  const companyForm = document.getElementById("companyForm");
  const companyDisplay = document.getElementById("companyDisplay");
  const saveCompanyBtn = document.getElementById("saveCompanyBtn");

  function renderCompany() {
    const c = JSON.parse(localStorage.getItem("company"));
    if (!c) return;

    companyForm.style.display = "none";
    companyDisplay.classList.remove("hidden");

    companyDisplay.innerHTML = `
      <div class="settings-entry">
        <button class="delete-btn" id="deleteCompanyBtn">🗑</button>
        <strong>${c.companyName}</strong><br>
        <small>${c.electricianName} | ${c.phone}</small><br>
        ${
          c.logo
            ? `<img src="${c.logo}" style="max-width:120px;margin-top:8px">`
            : ""
        }
        ${
          c.signature
            ? `<img src="${c.signature}" style="max-width:120px;">`
            : ""
        }
        <br><button class="small-btn" id="editCompanyBtn">Edit</button>
      </div>
    `;

    document.getElementById("editCompanyBtn").onclick = () => {
      companyForm.style.display = "block";
      companyDisplay.classList.add("hidden");
    };

    document.getElementById("deleteCompanyBtn").onclick = () => {
      localStorage.removeItem("company");
      companyDisplay.classList.add("hidden");
      companyForm.style.display = "block";
      showNotification("Company info deleted", true);
    };
  }

  saveCompanyBtn.onclick = () => {
    const companyName = document.getElementById("companyName").value.trim();
    const electricianName = document
      .getElementById("electricianName")
      .value.trim();
    const phone = document.getElementById("companyPhone").value.trim();
    const logoFile = document.getElementById("companyLogo").files[0];
    const signFile = document.getElementById("companySignature").files[0];

    if (!companyName || !electricianName || !phone) {
      showNotification("Fill all required fields", true);
      return;
    }

    const company = { companyName, electricianName, phone };

    const saveAll = () => {
      localStorage.setItem("company", JSON.stringify(company));
      renderCompany();
      showNotification("Company info saved");
      companyForm.reset();
    };

    toBase64(logoFile, (logoData) => {
      if (logoData) company.logo = logoData;
      toBase64(signFile, (signData) => {
        if (signData) company.signature = signData;
        saveAll();
      });
    });
  };

  renderCompany();

  /* ROOM TYPES*/
  const roomTypesList = document.getElementById("roomTypesList");
  const rtBulb = document.getElementById("rtBulb");
  const rtSwitch = document.getElementById("rtSwitch");
  const rtSocket = document.getElementById("rtSocket");
  const rtWire15 = document.getElementById("rtWire15");
  const rtWire25 = document.getElementById("rtWire25");
  const roomTypeName = document.getElementById("roomTypeName");
  const addRoomTypeBtn = document.getElementById("addRoomTypeBtn");

  const getRoomTypes = () =>
    JSON.parse(localStorage.getItem("roomTypes")) || [];
  const saveRoomTypes = (data) =>
    localStorage.setItem("roomTypes", JSON.stringify(data));

  const renderRoomTypes = () => {
    const types = getRoomTypes();
    roomTypesList.innerHTML = "";
    types.forEach((rt) => {
      const div = document.createElement("div");
      div.className = "settings-entry";
      div.innerHTML = `
        <strong>${rt.name}</strong>
        <small>
          Bulbs:${rt.bulb}, Switches:${rt.switch},
          Sockets:${rt.socket}, 1.5mm:${rt.wire15}m, 2.5mm:${rt.wire25}m
        </small>
        <button class="small-btn">Edit</button>
        <button class="delete-btn">🗑</button>
      `;

      div.querySelector(".delete-btn").onclick = () => {
        saveRoomTypes(types.filter((r) => r.id !== rt.id));
        renderRoomTypes();
        showNotification("Room type deleted", true);
      };

      div.querySelector(".small-btn").onclick = () => {
        roomTypeName.value = rt.name;
        rtBulb.value = rt.bulb;
        rtSwitch.value = rt.switch;
        rtSocket.value = rt.socket;
        rtWire15.value = rt.wire15;
        rtWire25.value = rt.wire25;
        saveRoomTypes(types.filter((r) => r.id !== rt.id));
        renderRoomTypes();
      };

      roomTypesList.appendChild(div);
    });
  };

  addRoomTypeBtn.onclick = () => {
    const name = roomTypeName.value.trim();
    if (!name) return showNotification("Room type name required", true);

    const newType = {
      id: Date.now(),
      name,
      bulb: +rtBulb.value || 0,
      switch: +rtSwitch.value || 0,
      socket: +rtSocket.value || 0,
      wire15: +rtWire15.value || 0,
      wire25: +rtWire25.value || 0,
    };

    const types = getRoomTypes();
    types.push(newType);
    saveRoomTypes(types);
    renderRoomTypes();

    roomTypeName.value =
      rtBulb.value =
      rtSwitch.value =
      rtSocket.value =
      rtWire15.value =
      rtWire25.value =
        "";

    showNotification("Room type saved");
  };

  renderRoomTypes();

  /*  MATERIAL PRICES (Dynamic) */
  const priceList = document.getElementById("priceList");
  const newPriceMaterialName = document.getElementById("newPriceMaterialName");
  const newPriceValue = document.getElementById("newPriceValue");
  const addPriceBtn = document.getElementById("addPriceBtn");

  function getPrices() {
    return JSON.parse(localStorage.getItem("dynamicPrices")) || [];
  }

  function savePrices(prices) {
    localStorage.setItem("dynamicPrices", JSON.stringify(prices));
  }

  function renderDynamicPrices() {
    const prices = getPrices();
    priceList.innerHTML = "";

    if (prices.length === 0) return;

    prices.forEach((item, idx) => {
      const div = document.createElement("div");
      div.className = "settings-entry";
      div.innerHTML = `
      <strong>${item.name}</strong> ₵${item.price}
      <button class="small-btn edit-price-btn">Edit</button>
      <button class="delete-btn">🗑</button>
    `;

      // Delete button
      div.querySelector(".delete-btn").onclick = () => {
        prices.splice(idx, 1);
        savePrices(prices);
        renderDynamicPrices();
        showNotification(`${item.name} removed`);
      };

      // Edit button
      div.querySelector(".edit-price-btn").onclick = () => {
        newPriceMaterialName.value = item.name;
        newPriceValue.value = item.price;
        prices.splice(idx, 1);
        savePrices(prices);
        renderDynamicPrices();
      };

      priceList.appendChild(div);
    });
  }

  // Add new price
  addPriceBtn.onclick = () => {
    const name = newPriceMaterialName.value.trim();
    const price = +newPriceValue.value;

    if (!name || !price) {
      showNotification("Enter valid name and price", true);
      return;
    }

    const prices = getPrices();
    prices.push({ name, price });
    savePrices(prices);
    renderDynamicPrices();

    newPriceMaterialName.value = "";
    newPriceValue.value = "";

    showNotification(`${name} added`);
  };

  renderDynamicPrices();

  /* BACKUP / RESTORE */
  document.getElementById("backupBtn").onclick = () => {
    const data = JSON.stringify(localStorage);
    const blob = new Blob([data], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "electrician-backup.json";
    a.click();
  };

  document.getElementById("restoreInput").onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const data = JSON.parse(reader.result);
      localStorage.clear();
      Object.keys(data).forEach((k) => localStorage.setItem(k, data[k]));
      location.reload();
    };
    reader.readAsText(file);
  };

  document.getElementById("clearAllBtn").onclick = () => {
    if (!confirm("Delete ALL data?")) return;
    localStorage.clear();
    location.reload();
  };
});
