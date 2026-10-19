/* TipSlice — bill splitter. Even, by person, or by item. Client-side only. */
(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const form = $("split-form");
  if (!form || !window.TipSliceSplit) return;

  const billEl = $("bill");
  const tipEl = $("tip");
  const peopleEl = $("people");
  const taxToggle = $("tax-toggle");
  const taxFields = $("tax-fields");
  const taxEl = $("tax");
  const tipOnTaxEl = $("tip-on-tax");
  const errorEl = $("form-error");
  const personBox = $("person-box");
  const itemPeople = $("item-people");
  const itemRows = $("item-rows");

  const out = {
    each: $("out-each"),
    tipEach: $("out-tip-each"),
    bill: $("out-bill"),
    tax: $("out-tax"),
    rowTax: $("row-tax"),
    tip: $("out-tip"),
    total: $("out-total"),
    note: $("out-note"),
    lines: $("out-lines")
  };

  const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
  const fmt = (cents) => money.format(cents / 100);
  const MAX_PEOPLE = 20;
  const MAX_BILL = 1e9;
  const DEFAULT_PEOPLE = 2;
  const DEFAULT_TIP = 18;
  const SHARE_PATH = "/split-bill.html";
  let shareState = null;
  let shareUi = null;

  function mode() {
    const picked = form.querySelector('input[name="mode"]:checked');
    return picked ? picked.value : "even";
  }

  function parseNum(raw) {
    let s = String(raw).trim().replace(/[\s$%]/g, "");
    if (s === "") return null;
    if (/^\d+,\d{1,2}$/.test(s)) s = s.replace(",", ".");
    else s = s.replace(/,/g, "");
    if (!/^\d*\.?\d*$/.test(s) || s === ".") return NaN;
    return parseFloat(s);
  }

  function setInvalid(el, bad) {
    if (!el) return;
    if (bad) el.setAttribute("aria-invalid", "true");
    else el.removeAttribute("aria-invalid");
  }

  function showMode() {
    const m = mode();
    $("even-fields").hidden = m !== "even";
    $("person-fields").hidden = m !== "person";
    $("item-fields").hidden = m !== "item";
    const uneven = m !== "even";
    out.lines.hidden = !uneven;
    $("even-stats").hidden = uneven;
  }

  function personInputs() {
    return Array.from(personBox.querySelectorAll(".person-row"));
  }
  function itemPersonInputs() {
    return Array.from(itemPeople.querySelectorAll(".item-person"));
  }

  function addPersonRow(name, amount) {
    const row = document.createElement("div");
    row.className = "person-row";
    row.innerHTML = '<input class="pname" type="text" maxlength="40" aria-label="Name" placeholder="Name">' +
      '<div class="input-affix"><span class="affix" aria-hidden="true">$</span>' +
      '<input class="pamt" type="text" inputmode="decimal" aria-label="Amount" placeholder="0.00"></div>' +
      '<button type="button" class="step remove-person" aria-label="Remove person">×</button>';
    row.querySelector(".pname").value = name || "";
    row.querySelector(".pamt").value = amount || "";
    personBox.appendChild(row);
  }

  function renderItemPeople() {
    const names = itemPersonInputs().map(function (row) {
      return row.querySelector(".iname").value;
    });
    if (!names.length) names.push("", "");
    itemPeople.innerHTML = "";
    names.forEach(function (name, i) {
      const row = document.createElement("div");
      row.className = "item-person";
      row.innerHTML = '<input class="iname" type="text" maxlength="40" aria-label="Name" placeholder="Name">' +
        '<label class="check"><input type="checkbox" class="treat"><span>Treat</span></label>' +
        '<button type="button" class="step remove-ip" aria-label="Remove person">×</button>';
      row.querySelector(".iname").value = name;
      itemPeople.appendChild(row);
    });
    syncItemChecks();
  }

  function syncItemChecks() {
    const names = itemPersonInputs().map(function (row, i) {
      const n = row.querySelector(".iname").value.trim();
      return n || ("Person " + (i + 1));
    });
    itemRows.querySelectorAll(".item-row").forEach(function (row) {
      const prev = Array.from(row.querySelectorAll(".who")).map(function (box) { return box.checked; });
      const holder = row.querySelector(".who-list");
      holder.innerHTML = "";
      names.forEach(function (name, i) {
        const label = document.createElement("label");
        label.className = "check";
        const input = document.createElement("input");
        input.type = "checkbox";
        input.className = "who";
        input.checked = prev[i] !== false && prev[i] !== undefined ? prev[i] : true;
        if (!prev.length) input.checked = true;
        label.appendChild(input);
        const span = document.createElement("span");
        span.textContent = name;
        label.appendChild(span);
        holder.appendChild(label);
      });
    });
  }

  function addItemRow(label, price) {
    const row = document.createElement("div");
    row.className = "item-row";
    row.innerHTML = '<input class="iname-item" type="text" maxlength="40" aria-label="Item" placeholder="Item">' +
      '<div class="input-affix"><span class="affix" aria-hidden="true">$</span>' +
      '<input class="iprice" type="text" inputmode="decimal" aria-label="Price" placeholder="0.00"></div>' +
      '<div class="who-list"></div>' +
      '<button type="button" class="step remove-item" aria-label="Remove item">×</button>';
    row.querySelector(".iname-item").value = label || "";
    row.querySelector(".iprice").value = price || "";
    itemRows.appendChild(row);
    syncItemChecks();
  }

  function readTax(errors) {
    let taxRate = 0;
    let taxDollars = null;
    const taxOn = taxToggle.checked;
    const kind = form.querySelector('input[name="tax-kind"]:checked');
    const dollarMode = kind && kind.value === "amount";
    if (taxOn) {
      if (dollarMode) {
        const t = parseNum($("tax-amount").value);
        const bad = Number.isNaN(t) || (t !== null && t > MAX_BILL);
        if (bad) errors.push("Tax amount should be a number from the receipt.");
        setInvalid($("tax-amount"), bad);
        taxDollars = (t === null || bad) ? 0 : t;
      } else {
        const t = parseNum(taxEl.value);
        const taxBad = Number.isNaN(t) || (t !== null && t > 50);
        if (taxBad) errors.push("Tax rate should be a number from 0 to 50.");
        setInvalid(taxEl, taxBad);
        taxRate = (t === null || taxBad) ? 0 : t;
      }
    } else {
      setInvalid(taxEl, false);
      setInvalid($("tax-amount"), false);
    }
    return { taxOn: taxOn, taxRate: taxRate, taxDollars: taxDollars, dollarMode: dollarMode };
  }

  function readTip(errors) {
    let tipRate = parseNum(tipEl.value);
    const tipBad = Number.isNaN(tipRate) || (tipRate !== null && tipRate > 100);
    if (tipBad) errors.push("Tip should be a number from 0 to 100.");
    setInvalid(tipEl, tipBad);
    if (tipRate === null || tipBad) tipRate = 0;
    return tipRate;
  }

  function paintUneven(result, names, tipRate) {
    out.bill.textContent = fmt(result.subtotal);
    out.tax.textContent = fmt(result.tax);
    out.rowTax.hidden = result.tax === 0 && !taxToggle.checked;
    out.tip.textContent = fmt(result.tip);
    out.total.textContent = fmt(result.total);
    out.each.textContent = names.length === 1 ? fmt(result.pays[0] || 0) : "—";
    const lines = names.map(function (name, i) {
      const food = result.food[i];
      const pay = result.pays[i];
      const evenGap = result.evenEach - pay;
      return "<li><strong>" + escapeHtml(name) + "</strong> food " + fmt(food) +
        ", pays " + fmt(pay) +
        (evenGap !== 0 ? " (" + fmt(Math.abs(evenGap)) + (evenGap > 0 ? " less" : " more") + " than an even " + fmt(result.evenEach) + ")" : "") +
        "</li>";
    }).join("");
    out.lines.innerHTML = "<ul class=\"split-lines\">" + lines + "</ul>";
    const diffNote = "Each person pays their food, then tax and tip in proportion to that food. Leftover cents go to the earliest names, so the shares add up to " + fmt(result.total) + ". An even split, rounded up, would be " + fmt(result.evenEach) + " each.";
    out.note.textContent = diffNote;
    shareState = {
      include: true,
      errors: false,
      uneven: true,
      text: names.map(function (name, i) {
        return name + " " + fmt(result.pays[i]);
      }).join("; ") + " · tip " + tipRate + "% · total " + fmt(result.total)
    };
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c];
    });
  }

  function calculateEven() {
    const errors = [];
    let bill = parseNum(billEl.value);
    const billBad = Number.isNaN(bill) || (bill !== null && bill > MAX_BILL);
    if (billBad) errors.push("Enter the bill as a number, like 96.40.");
    setInvalid(billEl, billBad);
    if (bill === null || billBad) bill = 0;
    const tipRate = readTip(errors);
    let people = parseNum(peopleEl.value);
    const peopleBad = Number.isNaN(people) || (people !== null && (people < 1 || people > 100 || !Number.isInteger(people)));
    if (peopleBad) errors.push("People should be a whole number from 1 to 100.");
    setInvalid(peopleEl, peopleBad);
    if (people === null || peopleBad) people = 1;
    const tax = readTax(errors);
    const billC = Math.round(bill * 100);
    const taxC = tax.dollarMode ? TipSliceSplit.toCents(tax.taxDollars || 0) : Math.round(billC * tax.taxRate / 100);
    const tipBaseC = (tax.taxOn && tipOnTaxEl.checked) ? billC + taxC : billC;
    const tipC = Math.round(tipBaseC * tipRate / 100);
    const totalC = billC + taxC + tipC;
    const eachC = Math.ceil(totalC / people);
    const tipEachC = Math.round(tipC / people);
    out.bill.textContent = fmt(billC);
    out.tax.textContent = fmt(taxC);
    out.rowTax.hidden = !tax.taxOn;
    out.tip.textContent = fmt(tipC);
    out.total.textContent = fmt(totalC);
    out.each.textContent = fmt(eachC);
    out.tipEach.textContent = fmt(tipEachC);
    out.lines.innerHTML = "";
    let note = "";
    if (people > 1 && totalC > 0) {
      const diff = eachC * people - totalC;
      note = "Split evenly " + people + " ways.";
      if (diff !== 0) {
        note += " Each share is rounded up so the group covers the bill (" +
          Math.abs(diff) + "¢ " + (diff > 0 ? "over" : "under") + " combined).";
      }
    }
    out.note.textContent = note;
    errorEl.hidden = errors.length === 0;
    errorEl.textContent = errors.join(" ");
    shareState = {
      include: errors.length === 0 && (billC > 0 || people !== DEFAULT_PEOPLE || tipRate !== DEFAULT_TIP || tax.taxOn),
      errors: errors.length > 0,
      bill: billC / 100,
      people: people,
      tipRate: tipRate,
      taxOn: tax.taxOn && !tax.dollarMode,
      tax: tax.taxRate,
      tipOnTax: tax.taxOn && tipOnTaxEl.checked,
      totalC: totalC,
      totalPPC: eachC,
      tipPPC: tipEachC
    };
    if (window.TipSliceShare && errors.length === 0 && !tax.dollarMode) TipSliceShare.syncUrl(shareState);
  }

  function calculatePerson() {
    const errors = [];
    const tipRate = readTip(errors);
    const tax = readTax(errors);
    const rows = personInputs();
    if (rows.length < 2) errors.push("Add at least two people.");
    const names = [];
    const food = [];
    rows.forEach(function (row) {
      const name = row.querySelector(".pname").value.trim() || ("Person " + (names.length + 1));
      const amt = parseNum(row.querySelector(".pamt").value);
      const bad = Number.isNaN(amt) || (amt !== null && amt < 0);
      setInvalid(row.querySelector(".pamt"), bad);
      if (bad) errors.push("Each amount should be a number.");
      names.push(name);
      food.push(TipSliceSplit.toCents(amt || 0));
    });
    if (errors.length) {
      errorEl.hidden = false;
      errorEl.textContent = errors.join(" ");
      shareState = { errors: true };
      return;
    }
    const result = TipSliceSplit.settle({
      people: names.length,
      foodCents: food,
      taxRate: tax.taxRate,
      taxCents: tax.dollarMode ? TipSliceSplit.toCents(tax.taxDollars || 0) : null,
      tipRate: tipRate,
      tipOnTax: tax.taxOn && tipOnTaxEl.checked
    });
    errorEl.hidden = true;
    paintUneven(result, names, tipRate);
    writeUnevenUrl("person", names, food, null, tax, tipRate);
  }

  function calculateItem() {
    const errors = [];
    const tipRate = readTip(errors);
    const tax = readTax(errors);
    const people = itemPersonInputs();
    if (people.length < 2) errors.push("Add at least two people.");
    const names = people.map(function (row, i) {
      return row.querySelector(".iname").value.trim() || ("Person " + (i + 1));
    });
    let treat = null;
    people.forEach(function (row, i) {
      if (row.querySelector(".treat").checked) treat = i;
    });
    const items = [];
    itemRows.querySelectorAll(".item-row").forEach(function (row) {
      const price = parseNum(row.querySelector(".iprice").value);
      const bad = Number.isNaN(price);
      setInvalid(row.querySelector(".iprice"), bad);
      if (bad && row.querySelector(".iprice").value.trim() !== "") errors.push("Item prices should be numbers.");
      const assignees = [];
      row.querySelectorAll(".who").forEach(function (box, i) { if (box.checked) assignees.push(i); });
      if ((price || 0) > 0 && !assignees.length) errors.push("Assign each item to at least one person.");
      if ((price || 0) > 0) items.push({ cents: TipSliceSplit.toCents(price), assignees: assignees });
    });
    if (!items.length) errors.push("Add at least one item.");
    if (errors.length) {
      errorEl.hidden = false;
      errorEl.textContent = errors.join(" ");
      shareState = { errors: true };
      return;
    }
    const food = TipSliceSplit.foodFromItems(names.length, items);
    const result = TipSliceSplit.settle({
      people: names.length,
      foodCents: food,
      treatIndex: treat,
      taxRate: tax.taxRate,
      taxCents: tax.dollarMode ? TipSliceSplit.toCents(tax.taxDollars || 0) : null,
      tipRate: tipRate,
      tipOnTax: tax.taxOn && tipOnTaxEl.checked
    });
    errorEl.hidden = true;
    paintUneven(result, names, tipRate);
    writeUnevenUrl("item", names, food, treat, tax, tipRate);
  }

  function writeUnevenUrl(kind, names, food, treat, tax, tipRate) {
    const q = new URLSearchParams();
    q.set("m", kind);
    q.set("t", String(tipRate));
    q.set("n", names.join("|"));
    q.set("a", food.map(function (c) { return (c / 100).toString(); }).join(","));
    if (treat != null) q.set("tr", String(treat));
    if (tax.taxOn) {
      if (tax.dollarMode) q.set("xd", String(tax.taxDollars || 0));
      else {
        q.set("x", String(tax.taxRate));
        if (tipOnTaxEl.checked) q.set("o", "1");
      }
    }
    const next = SHARE_PATH + "?" + q.toString();
    try { history.replaceState(null, "", next); } catch (err) { /* ignore */ }
    shareState.url = location.origin ? location.origin + next : next;
    shareState.text = shareState.text + " " + shareState.url;
  }

  function calculate() {
    showMode();
    if (mode() === "person") calculatePerson();
    else if (mode() === "item") calculateItem();
    else calculateEven();
  }

  function sharePayload() {
    if (!shareState || shareState.errors) {
      return { error: "Fix the highlighted fields, then copy the summary." };
    }
    if (shareState.uneven) {
      return { text: shareState.text, url: shareState.url || location.href };
    }
    if (!(shareState.totalC > 0)) return { error: "Enter a bill amount first." };
    const url = TipSliceShare.publicUrl(SHARE_PATH, shareState);
    return { text: TipSliceShare.formatSummary(shareState, url), url: url };
  }

  function applySharedState() {
    const q = new URLSearchParams(location.search);
    const m = q.get("m");
    if (m === "person" || m === "item") {
      const radio = form.querySelector('input[name="mode"][value="' + m + '"]');
      if (radio) radio.checked = true;
      if (q.get("t")) tipEl.value = q.get("t");
      if (q.get("x")) {
        taxToggle.checked = true;
        taxEl.value = q.get("x");
        tipOnTaxEl.checked = q.get("o") === "1";
      }
      if (q.get("xd")) {
        taxToggle.checked = true;
        const amount = form.querySelector('input[name="tax-kind"][value="amount"]');
        if (amount) amount.checked = true;
        $("tax-amount").value = q.get("xd");
      }
      const names = (q.get("n") || "").split("|").filter(Boolean);
      const amounts = (q.get("a") || "").split(",");
      if (m === "person") {
        personBox.innerHTML = "";
        (names.length ? names : ["", ""]).forEach(function (name, i) {
          addPersonRow(name, amounts[i] || "");
        });
      } else {
        itemPeople.innerHTML = "";
        (names.length ? names : ["", ""]).forEach(function (name) {
          const row = document.createElement("div");
          row.className = "item-person";
          row.innerHTML = '<input class="iname" type="text" maxlength="40" aria-label="Name">' +
            '<label class="check"><input type="checkbox" class="treat"><span>Treat</span></label>' +
            '<button type="button" class="step remove-ip" aria-label="Remove person">×</button>';
          row.querySelector(".iname").value = name;
          itemPeople.appendChild(row);
        });
        const tr = q.get("tr");
        if (tr != null && itemPersonInputs()[Number(tr)]) itemPersonInputs()[Number(tr)].querySelector(".treat").checked = true;
        addItemRow("", "");
      }
      return;
    }
    if (!window.TipSliceShare) return;
    const s = TipSliceShare.readState(MAX_BILL, 100);
    if (s.bill !== null) billEl.value = TipSliceShare.compact(s.bill, 2);
    if (s.people !== null) peopleEl.value = String(s.people);
    if (s.tip !== null) tipEl.value = TipSliceShare.compact(s.tip, 2);
    if (s.tax !== null) {
      taxToggle.checked = true;
      taxEl.value = TipSliceShare.compact(s.tax, 3);
      tipOnTaxEl.checked = s.tipOnTax;
    }
  }

  form.addEventListener("input", function () {
    if (shareUi) shareUi.clearFeedback();
    if (mode() === "item") syncItemChecks();
    calculate();
  });
  form.addEventListener("change", function (e) {
    if (shareUi) shareUi.clearFeedback();
    if (e.target === taxToggle) {
      taxFields.hidden = !taxToggle.checked;
    }
    if (e.target.classList && e.target.classList.contains("treat") && e.target.checked) {
      itemPersonInputs().forEach(function (row) {
        const box = row.querySelector(".treat");
        if (box !== e.target) box.checked = false;
      });
    }
    calculate();
  });
  form.addEventListener("click", function (e) {
    const btn = e.target.closest("button");
    if (!btn) return;
    if (btn.id === "add-person") addPersonRow("", "");
    if (btn.id === "add-item-person") {
      const row = document.createElement("div");
      row.className = "item-person";
      row.innerHTML = '<input class="iname" type="text" maxlength="40" aria-label="Name" placeholder="Name">' +
        '<label class="check"><input type="checkbox" class="treat"><span>Treat</span></label>' +
        '<button type="button" class="step remove-ip" aria-label="Remove person">×</button>';
      itemPeople.appendChild(row);
      syncItemChecks();
    }
    if (btn.id === "add-item") addItemRow("", "");
    if (btn.classList.contains("remove-person") && personInputs().length > 2) btn.closest(".person-row").remove();
    if (btn.classList.contains("remove-ip") && itemPersonInputs().length > 2) {
      btn.closest(".item-person").remove();
      syncItemChecks();
    }
    if (btn.classList.contains("remove-item") && itemRows.querySelectorAll(".item-row").length > 1) btn.closest(".item-row").remove();
    if (btn.classList.contains("step") && btn.dataset.step) {
      const cur = parseNum(peopleEl.value);
      const base = Number.isFinite(cur) ? Math.round(cur) : 1;
      peopleEl.value = String(Math.min(100, Math.max(1, base + Number(btn.dataset.step))));
    }
    calculate();
  });
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    calculate();
  });
  $("reset-btn").addEventListener("click", function () {
    form.reset();
    peopleEl.value = "2";
    tipEl.value = "18";
    taxFields.hidden = true;
    personBox.innerHTML = "";
    addPersonRow("Ana", "");
    addPersonRow("Ben", "");
    itemPeople.innerHTML = "";
    renderItemPeople();
    itemRows.innerHTML = "";
    addItemRow("", "");
    form.querySelector('input[name="mode"][value="even"]').checked = true;
    calculate();
    billEl.focus();
  });

  addPersonRow("", "");
  addPersonRow("", "");
  renderItemPeople();
  addItemRow("", "");
  applySharedState();
  taxFields.hidden = !taxToggle.checked;
  if (window.TipSliceShare && $("copy-split")) {
    shareUi = TipSliceShare.wire({
      copyButton: $("copy-split"),
      shareButton: $("share-split"),
      statusEl: $("share-status"),
      getPayload: sharePayload
    });
  }
  calculate();
})();
