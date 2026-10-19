(function () {
  var header = document.querySelector(".site-header");
  if (!header) return;

  var mobileQuery = window.matchMedia("(max-width: 959px)");

  function openDetails() {
    return Array.prototype.slice.call(header.querySelectorAll("details")).filter(function (d) {
      return d.open;
    });
  }

  function closeDetails(detail) {
    detail.open = false;
    var summary = detail.querySelector("summary");
    if (summary) summary.focus();
  }

  document.addEventListener("keydown", function (e) {
    var open = openDetails();
    if (!open.length) return;

    if (e.key === "Escape") {
      e.preventDefault();
      closeDetails(open[open.length - 1]);
      return;
    }

    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    var more = open[open.length - 1];
    if (!more.classList.contains("more-details")) return;
    if (!more.contains(document.activeElement)) return;
    var items = Array.prototype.slice.call(more.querySelectorAll(".more-menu a"));
    if (!items.length) return;
    var index = items.indexOf(document.activeElement);
    if (e.key === "ArrowDown") index = index < 0 ? 0 : (index + 1) % items.length;
    else index = index <= 0 ? items.length - 1 : index - 1;
    e.preventDefault();
    items[index].focus();
  });

  document.addEventListener("keydown", function (e) {
    if (e.key !== "Tab" || !mobileQuery.matches) return;
    var menu = header.querySelector(".menu-details");
    var nav = document.getElementById("site-menu");
    if (!menu || !menu.open || !nav) return;
    var items = [menu.querySelector("summary")].concat(Array.prototype.slice.call(nav.querySelectorAll("a, summary"))).filter(function (el) {
      return el && el.offsetParent !== null;
    });
    if (items.length < 2) return;
    var first = items[0];
    var last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });

  document.addEventListener("pointerdown", function (e) {
    if (header.contains(e.target)) return;
    openDetails().forEach(function (d) { d.open = false; });
  });

  header.addEventListener("click", function (e) {
    if (!e.target.closest("a")) return;
    openDetails().forEach(function (d) { d.open = false; });
  });
})();
