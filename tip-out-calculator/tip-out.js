/* Tip-out by role, or a tip pool by hours. Percents are what you type. */
(function (factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (typeof document !== "undefined") api.mount();
})(function () {
  "use strict";

  function toMinor(amount) {
    return Math.round((Number(amount) + Number.EPSILON) * 100);
  }
  function formatUSD(minor) {
    const sign = minor < 0 ? "-" : "";
    return sign + "$" + (Math.abs(minor) / 100).toFixed(2);
  }

  function roleAmount(role, bases) {
    if (role.base === "flat") return toMinor(role.percent);
    const base = bases[role.base] || 0;
    return Math.round(base * Number(role.percent) / 100);
  }

  function computeRoles(input) {
    const bases = {
      sales: toMinor(input.sales || 0),
      food: toMinor(input.food || 0),
      bar: toMinor(input.bar || 0),
      tips: toMinor(input.tips || 0)
    };
    const roles = (input.roles || []).map(function (role) {
      return { name: role.name, amount: roleAmount(role, bases), base: role.base, percent: role.percent };
    });
    const out = roles.reduce(function (sum, role) { return sum + role.amount; }, 0);
    return { bases: bases, roles: roles, out: out, net: bases.tips - out };
  }

  function computePool(input) {
    const pool = toMinor(input.pool || 0);
    const people = input.people || [];
    const weights = people.map(function (p) {
      const hours = Number(p.hours) || 0;
      const points = p.points == null || p.points === "" ? 1 : Number(p.points);
      return Math.round(hours * points * 100);
    });
    const weightSum = weights.reduce(function (a, b) { return a + b; }, 0);
    const shares = new Array(people.length).fill(0);
    if (weightSum > 0 && pool !== 0) {
      let used = 0;
      weights.forEach(function (w, i) {
        shares[i] = Math.floor(pool * w / weightSum);
        used += shares[i];
      });
      let rem = pool - used;
      for (let i = 0; i < shares.length && rem > 0; i++) {
        if (weights[i] <= 0) continue;
        shares[i] += 1;
        rem -= 1;
      }
    }
    const hours = people.reduce(function (sum, p) { return sum + (Number(p.hours) || 0); }, 0);
    return { pool: pool, shares: shares, hours: hours, rate: hours > 0 ? Math.round(pool / hours) : 0 };
  }

  function compute(input) {
    const mode = input.mode === "tips" ? "tips" : "sales";
    return computeRoles({
      sales: input.sales,
      tips: input.tips,
      roles: [
        { name: "Busser", percent: input.busser, base: mode },
        { name: "Bartender", percent: input.bartender, base: mode },
        { name: "Host", percent: input.host, base: mode }
      ]
    });
  }

  function mount() {
    const form = document.getElementById("tipout-form");
    if (!form) return;
    const $ = (id) => document.getElementById(id);
    const roleBox = $("role-box");
    const poolBox = $("pool-box");

    function num(el) {
      const s = String(el.value || "").trim().replace(/[$,\s]/g, "");
      if (s === "") return null;
      if (!/^\d*\.?\d*$/.test(s) || s === ".") return NaN;
      return parseFloat(s);
    }

    function toolMode() {
      const picked = form.querySelector('input[name="tool"]:checked');
      return picked ? picked.value : "tipout";
    }

    function addRole(name, percent, base) {
      const row = document.createElement("div");
      row.className = "role-row";
      row.innerHTML = '<input class="rname" type="text" maxlength="40" aria-label="Role" placeholder="Role">' +
        '<input class="rpct" type="text" inputmode="decimal" aria-label="Percent or dollars" value="0">' +
        '<select class="rbase" aria-label="Base">' +
        '<option value="sales">% of sales</option><option value="food">% of food sales</option>' +
        '<option value="bar">% of bar sales</option><option value="tips">% of tips</option>' +
        '<option value="flat">flat dollars</option></select>' +
        '<label class="check"><input type="checkbox" class="rmgr"><span>Manager</span></label>' +
        '<label class="check"><input type="checkbox" class="rcook"><span>Cook or dishwasher</span></label>' +
        '<button type="button" class="step remove-role">×</button>';
      row.querySelector(".rname").value = name || "";
      row.querySelector(".rpct").value = percent == null ? "0" : String(percent);
      row.querySelector(".rbase").value = base || "sales";
      roleBox.appendChild(row);
    }

    function addPool(name, hours, points) {
      const row = document.createElement("div");
      row.className = "pool-row";
      row.innerHTML = '<input class="pname" type="text" maxlength="40" aria-label="Name" placeholder="Name">' +
        '<input class="phours" type="text" inputmode="decimal" aria-label="Hours" placeholder="Hours">' +
        '<input class="ppoints" type="text" inputmode="decimal" aria-label="Points" placeholder="Points" value="1">' +
        '<button type="button" class="step remove-pool">×</button>';
      row.querySelector(".pname").value = name || "";
      row.querySelector(".phours").value = hours || "";
      row.querySelector(".ppoints").value = points == null ? "1" : String(points);
      poolBox.appendChild(row);
    }

    function readRoles() {
      return Array.from(roleBox.querySelectorAll(".role-row")).map(function (row) {
        return {
          name: row.querySelector(".rname").value.trim() || "Role",
          percent: num(row.querySelector(".rpct")) || 0,
          base: row.querySelector(".rbase").value,
          manager: row.querySelector(".rmgr").checked,
          cook: row.querySelector(".rcook").checked
        };
      });
    }

    function render(result) {
      const lines = $("out-lines");
      lines.innerHTML = "";
      result.roles.forEach(function (role) {
        const div = document.createElement("div");
        div.innerHTML = "<dt>" + role.name + "</dt><dd>" + formatUSD(role.amount) + "</dd>";
        lines.appendChild(div);
      });
      $("out-total").textContent = formatUSD(result.out);
      $("out-tips").textContent = formatUSD(result.bases.tips);
      $("out-net").textContent = formatUSD(result.net);
      const tips = result.bases.tips;
      const sales = result.bases.sales;
      const ofTips = tips ? (result.out / tips * 100).toFixed(1) : "0.0";
      const ofSales = sales ? (result.out / sales * 100).toFixed(1) : "0.0";
      let note = "Tip-out is " + ofTips + "% of tips and " + ofSales + "% of sales. These percents are the ones you typed, not a federal standard.";
      if (result.net < 0) note += " The tip-out is larger than the tips you entered.";
      const roles = readRoles();
      if (roles.some(function (r) { return r.manager; })) {
        note += " Fact Sheet #15 says employers, managers, and supervisors may not receive tips from a pool.";
      }
      const wage = num($("cash-wage"));
      if (roles.some(function (r) { return r.cook; }) && wage != null && wage < 7.25) {
        note += " A pool that includes cooks or dishwashers requires a cash wage of at least the full federal minimum, $7.25, under Fact Sheet #15.";
      }
      $("out-note").textContent = note;
    }

    function renderPool(result, people) {
      const lines = $("out-lines");
      lines.innerHTML = "";
      people.forEach(function (p, i) {
        const div = document.createElement("div");
        div.innerHTML = "<dt>" + (p.name || "Person") + "</dt><dd>" + formatUSD(result.shares[i]) + "</dd>";
        lines.appendChild(div);
      });
      $("out-total").textContent = formatUSD(result.pool);
      $("out-tips").textContent = "—";
      $("out-net").textContent = formatUSD(result.rate) + "/h";
      $("out-note").textContent = "Pool rate is the pool divided by total hours when every point weight is 1. Leftover cents go to the first rows so the shares add up. Points change the weight. This is not a required split.";
    }

    function calculate() {
      $("tipout-fields").hidden = toolMode() !== "tipout";
      $("pool-fields").hidden = toolMode() !== "pool";
      if (toolMode() === "pool") {
        const people = Array.from(poolBox.querySelectorAll(".pool-row")).map(function (row) {
          return {
            name: row.querySelector(".pname").value.trim() || "Person",
            hours: num(row.querySelector(".phours")) || 0,
            points: num(row.querySelector(".ppoints"))
          };
        });
        renderPool(computePool({ pool: num($("pool")) || 0, people: people }), people);
        return;
      }
      const result = computeRoles({
        sales: num($("sales")) || 0,
        food: num($("food")) || 0,
        bar: num($("bar")) || 0,
        tips: num($("tips")) || 0,
        roles: readRoles()
      });
      render(result);
    }

    form.addEventListener("input", calculate);
    form.addEventListener("change", calculate);
    form.addEventListener("click", function (e) {
      const btn = e.target.closest("button");
      if (!btn) return;
      if (btn.id === "add-role") addRole("", 0, "sales");
      if (btn.id === "add-pool-person") addPool("", "", 1);
      if (btn.classList.contains("remove-role") && roleBox.querySelectorAll(".role-row").length > 1) btn.closest(".role-row").remove();
      if (btn.classList.contains("remove-pool") && poolBox.querySelectorAll(".pool-row").length > 1) btn.closest(".pool-row").remove();
      calculate();
    });
    form.addEventListener("submit", function (e) { e.preventDefault(); calculate(); });
    const copyBtn = $("copy-btn");
    if (copyBtn) {
      copyBtn.addEventListener("click", function () {
        const status = $("copy-status");
        const text = location.href;
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(function () {
            if (status) status.textContent = "Link copied.";
          }).catch(function () {
            if (status) status.textContent = text;
          });
        } else if (status) status.textContent = text;
      });
    }

    const q = new URLSearchParams(location.search);
    addRole("Busser", q.get("bu") || 0, q.get("m") === "tips" ? "tips" : "sales");
    addRole("Bartender", q.get("ba") || 0, q.get("m") === "tips" ? "tips" : "sales");
    addRole("Host", q.get("ho") || 0, q.get("m") === "tips" ? "tips" : "sales");
    addPool("", "6", 1);
    addPool("", "5", 1);
    addPool("", "4", 1);
    if (q.get("s")) $("sales").value = q.get("s");
    if (q.get("i")) $("tips").value = q.get("i");
    if (q.get("pool") === "1") form.querySelector('input[name="tool"][value="pool"]').checked = true;
    calculate();
  }

  return { compute: compute, computeRoles: computeRoles, computePool: computePool, mount: mount, toMinor: toMinor, formatUSD: formatUSD };
});
