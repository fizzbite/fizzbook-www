(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  // ---------- Nav border on scroll ----------
  const nav = $(".nav");
  const onScroll = () => nav.classList.toggle("is-scrolled", window.scrollY > 8);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // ---------- Radio-group helper ----------
  function select(group, btn) {
    $$('[role="radio"]', group).forEach(b => b.setAttribute("aria-checked", String(b === btn)));
  }

  // ---------- Booking demo ----------
  const daysEl = $("#days");
  const slotsEl = $("#slots");
  const bookBtn = $("#bookBtn");
  const demo = $("#demo");
  const done = $("#done");
  const servicesEl = $(".services");

  const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const OPEN = 9 * 60, CLOSE = 18 * 60, STEP = 30;

  const state = { service: $(".svc", servicesEl), day: null, time: null };

  // Deterministic pseudo-random "already booked" slots so the demo feels real.
  function isTaken(date, mins) {
    let h = date.getDate() * 131 + date.getMonth() * 31 + mins * 7;
    h = (h ^ (h >>> 3)) * 2654435761 >>> 0;
    return h % 100 < 38;
  }

  function fmt(mins) {
    const h = Math.floor(mins / 60), m = mins % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  }

  function renderDays() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    daysEl.innerHTML = "";
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const b = document.createElement("button");
      b.type = "button";
      b.className = "day";
      b.setAttribute("role", "radio");
      b.setAttribute("aria-checked", "false");
      b.setAttribute("aria-label", d.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" }));
      b.innerHTML = `<span>${i === 0 ? "Today" : DAY_NAMES[d.getDay()]}</span><b>${d.getDate()}</b>`;
      b.dataset.date = d.toISOString();
      daysEl.append(b);
    }
    // Default to the next open day (from tomorrow) so there are always slots left
    const first = [...daysEl.children].slice(1).find(b => new Date(b.dataset.date).getDay() !== 0);
    select(daysEl, first);
    state.day = new Date(first.dataset.date);
  }

  function renderSlots() {
    const mins = Number(state.service.dataset.mins);
    const day = state.day;
    const now = new Date();
    const isToday = day.toDateString() === now.toDateString();
    const nowMins = now.getHours() * 60 + now.getMinutes();
    slotsEl.innerHTML = "";
    state.time = null;
    updateBookBtn();

    if (day.getDay() === 0) {
      slotsEl.innerHTML = `<p class="slots__empty">Closed Sundays — Jay's at the match ⚽</p>`;
      return;
    }

    let count = 0;
    for (let t = OPEN; t + mins <= CLOSE; t += STEP) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "slot";
      b.setAttribute("role", "radio");
      b.setAttribute("aria-checked", "false");
      b.textContent = fmt(t);
      b.dataset.mins = t;
      b.style.animationDelay = `${count * 18}ms`;
      if ((isToday && t <= nowMins) || isTaken(day, t)) {
        b.disabled = true;
        b.setAttribute("aria-label", `${fmt(t)} unavailable`);
      }
      slotsEl.append(b);
      count++;
    }
  }

  function updateBookBtn() {
    if (state.time == null) {
      bookBtn.disabled = true;
      bookBtn.textContent = "Choose a time";
    } else {
      bookBtn.disabled = false;
      bookBtn.textContent = `Book ${fmt(state.time)} · £${state.service.dataset.price}`;
    }
  }

  servicesEl.addEventListener("click", e => {
    const b = e.target.closest(".svc");
    if (!b) return;
    select(servicesEl, b);
    state.service = b;
    renderSlots();
  });

  daysEl.addEventListener("click", e => {
    const b = e.target.closest(".day");
    if (!b) return;
    select(daysEl, b);
    state.day = new Date(b.dataset.date);
    renderSlots();
  });

  slotsEl.addEventListener("click", e => {
    const b = e.target.closest(".slot");
    if (!b || b.disabled) return;
    select(slotsEl, b);
    state.time = Number(b.dataset.mins);
    updateBookBtn();
  });

  bookBtn.addEventListener("click", () => {
    if (state.time == null) return;
    const when = state.day.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "short" });
    $("#doneText").innerHTML =
      `<strong>${state.service.dataset.name}</strong> with Jay<br>${when} at ${fmt(state.time)}`;
    demo.hidden = true;
    done.hidden = false;
    $("#again").focus();
  });

  $("#again").addEventListener("click", () => {
    done.hidden = true;
    demo.hidden = false;
    renderSlots();
    bookBtn.focus();
  });

  renderDays();
  renderSlots();

  // ---------- Pricing toggle ----------
  $$(".billing__opt").forEach(btn => {
    btn.addEventListener("click", () => {
      const period = btn.dataset.period;
      $$(".billing__opt").forEach(b => b.setAttribute("aria-pressed", String(b === btn)));
      $$(".amt").forEach(el => {
        el.classList.add("flip");
        setTimeout(() => {
          const v = Number(el.dataset[period]);
          el.textContent = `£${Number.isInteger(v) ? v : v.toFixed(2)}`;
          el.classList.remove("flip");
        }, 150);
      });
    });
  });

  // ---------- Signup (placeholder until a backend is wired up) ----------
  const form = $("#signup");
  const msg = $("#signupMsg");
  form.addEventListener("submit", e => {
    e.preventDefault();
    const email = form.email.value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      msg.textContent = "That email doesn't look quite right.";
      form.classList.remove("shake");
      void form.offsetWidth;
      form.classList.add("shake");
      form.email.focus();
      return;
    }
    // TODO: POST to the real signup endpoint.
    msg.textContent = "🎉 You're on the list — check your inbox to claim your link.";
    form.reset();
  });

  // ---------- Reveal on scroll ----------
  const targets = $$(".section h2, .card, .steps li, .plan, .table, .faq details");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (en.isIntersecting) {
          const el = en.target;
          el.classList.add("in");
          io.unobserve(el);
          // Hand transitions back to the element's own hover styles once revealed
          setTimeout(() => { el.classList.remove("reveal", "in"); el.style.transitionDelay = ""; }, 900);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px" });
    targets.forEach((el, i) => {
      el.classList.add("reveal");
      el.style.transitionDelay = `${(i % 4) * 60}ms`;
      io.observe(el);
    });
  }

  $("#year").textContent = new Date().getFullYear();
})();
