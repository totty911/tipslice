/* Itemized and by-person split. Leftover cents go to the earliest people so shares add up. */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.TipSliceSplit = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  function toCents(amount) {
    return Math.round((Number(amount) + Number.EPSILON) * 100);
  }

  function spread(total, count, allow) {
    const out = [];
    if (count <= 0 || total === 0) {
      for (let i = 0; i < count; i++) out.push(0);
      return out;
    }
    const base = Math.floor(total / count);
    let rem = total - base * count;
    for (let i = 0; i < count; i++) {
      const extra = rem > 0 ? 1 : 0;
      if (rem > 0) rem -= 1;
      out.push(base + extra);
    }
    return out;
  }

  function allocate(total, weights) {
    const n = weights.length;
    const out = new Array(n).fill(0);
    const sum = weights.reduce(function (a, b) { return a + b; }, 0);
    if (total === 0 || sum === 0) return out;
    let used = 0;
    for (let i = 0; i < n; i++) {
      if (weights[i] <= 0) continue;
      out[i] = Math.floor(total * weights[i] / sum);
      used += out[i];
    }
    let rem = total - used;
    for (let i = 0; i < n && rem > 0; i++) {
      if (weights[i] <= 0) continue;
      out[i] += 1;
      rem -= 1;
    }
    return out;
  }

  function foodFromItems(people, items) {
    const food = new Array(people).fill(0);
    items.forEach(function (item) {
      const who = item.assignees.filter(function (i) { return i >= 0 && i < people; });
      if (!who.length || item.cents <= 0) return;
      const parts = spread(item.cents, who.length);
      who.forEach(function (idx, i) { food[idx] += parts[i]; });
    });
    return food;
  }

  function applyTreat(food, treatIndex) {
    const next = food.slice();
    if (treatIndex == null || treatIndex < 0 || treatIndex >= food.length) return next;
    const gift = next[treatIndex];
    next[treatIndex] = 0;
    if (gift <= 0) return next;
    const weights = next.map(function (v, i) { return i === treatIndex ? 0 : v; });
    const sum = weights.reduce(function (a, b) { return a + b; }, 0);
    if (sum === 0) {
      const who = [];
      for (let i = 0; i < next.length; i++) if (i !== treatIndex) who.push(i);
      const parts = spread(gift, who.length);
      who.forEach(function (idx, i) { next[idx] += parts[i]; });
      return next;
    }
    const extra = allocate(gift, weights);
    extra.forEach(function (v, i) { next[i] += v; });
    return next;
  }

  function settle(input) {
    const people = input.people;
    let food = input.foodCents.slice();
    if (input.treatIndex != null) food = applyTreat(food, input.treatIndex);
    const subtotal = food.reduce(function (a, b) { return a + b; }, 0);
    const tax = input.taxCents != null ? input.taxCents : Math.round(subtotal * input.taxRate / 100);
    const tipBase = input.tipOnTax ? subtotal + tax : subtotal;
    const tip = Math.round(tipBase * input.tipRate / 100);
    const extra = tax + tip;
    const extras = allocate(extra, food);
    const pays = food.map(function (f, i) { return f + extras[i]; });
    const total = subtotal + extra;
    const evenEach = people > 0 ? Math.ceil(total / people) : 0;
    return {
      food: food,
      subtotal: subtotal,
      tax: tax,
      tip: tip,
      total: total,
      pays: pays,
      evenEach: evenEach
    };
  }

  return {
    toCents: toCents,
    foodFromItems: foodFromItems,
    settle: settle
  };
});
