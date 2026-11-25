(() => {
  const menuToggle = document.querySelector(".menu-toggle");
  const primaryNav = document.querySelector(".primary-nav");

  if (menuToggle && primaryNav) {
    menuToggle.addEventListener("click", () => {
      const isExpanded = menuToggle.getAttribute("aria-expanded") === "true";
      menuToggle.setAttribute("aria-expanded", String(!isExpanded));
      menuToggle.setAttribute("aria-label", isExpanded ? "Open navigation" : "Close navigation");
      primaryNav.classList.toggle("is-open", !isExpanded);
    });

    primaryNav.addEventListener("click", (event) => {
      if (event.target.closest("a")) {
        menuToggle.setAttribute("aria-expanded", "false");
        menuToggle.setAttribute("aria-label", "Open navigation");
        primaryNav.classList.remove("is-open");
      }
    });
  }

  const form = document.querySelector("#booking-form");
  if (!form) return;

  const dateInput = form.elements.appointmentDate;
  const yearInput = form.elements.vehicleYear;
  const packageSelect = form.elements.package;
  const availabilityMessage = document.querySelector("#availability-message");
  const bookingResult = document.querySelector("#booking-result");
  const packageInfo = {
    interior: { name: "Interior Luxury Detail", price: 149 },
    exterior: { name: "Exterior Luxury Detail", price: 129 },
    complete: { name: "Complete Luxury Detail", price: 249 }
  };
  const slotsKey = "luxuryDetailingPrototypeSlots";
  const today = new Date();
  const todayString = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  dateInput.min = todayString;
  yearInput.max = String(today.getFullYear() + 1);
  yearInput.min = "1950";

  const setError = (name, message) => {
    const field = form.elements[name];
    const error = document.querySelector(`#error-${name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`);
    if (!field || !error) return;
    field.setAttribute("aria-invalid", message ? "true" : "false");
    error.textContent = message;
  };

  const clearErrors = () => {
    ["fullName", "email", "phone", "vehicle", "vehicleYear", "package", "address", "appointmentDate", "appointmentTime"]
      .forEach((name) => setError(name, ""));
  };

  const validate = () => {
    clearErrors();
    let firstInvalid = null;
    const values = new FormData(form);
    const validationErrors = {};
    const currentYear = new Date().getFullYear();

    if (String(values.get("fullName")).trim().length < 2) validationErrors.fullName = "Please enter your full name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(values.get("email")).trim())) validationErrors.email = "Enter a valid email address.";
    if (String(values.get("phone")).trim().replace(/\D/g, "").length < 7) validationErrors.phone = "Enter a valid phone number.";
    if (String(values.get("vehicle")).trim().length < 2) validationErrors.vehicle = "Please enter your vehicle make and model.";
    const year = Number(values.get("vehicleYear"));
    if (!Number.isInteger(year) || year < 1950 || year > currentYear + 1) validationErrors.vehicleYear = `Enter a year between 1950 and ${currentYear + 1}.`;
    if (!packageInfo[values.get("package")]) validationErrors.package = "Choose one of the detailing packages.";
    if (String(values.get("address")).trim().length < 5) validationErrors.address = "Please enter a complete service address.";
    if (!values.get("appointmentDate") || values.get("appointmentDate") < todayString) validationErrors.appointmentDate = "Choose today or a future date.";
    if (!values.get("appointmentTime")) validationErrors.appointmentTime = "Select a preferred appointment time.";

    Object.entries(validationErrors).forEach(([name, message]) => {
      setError(name, message);
      firstInvalid ||= form.elements[name];
    });

    if (firstInvalid) {
      firstInvalid.focus();
      return false;
    }
    return true;
  };

  const readSlots = () => {
    try {
      const saved = JSON.parse(localStorage.getItem(slotsKey) || "[]");
      return Array.isArray(saved) ? saved : [];
    } catch (error) {
      throw new Error("Saved prototype availability could not be read. Please clear this browser's site data and try again.");
    }
  };

  const writeSlots = (slots) => {
    try {
      localStorage.setItem(slotsKey, JSON.stringify(slots));
    } catch (error) {
      throw new Error("This browser could not save the prototype booking. Check browser storage settings and try again.");
    }
  };

  const slotFor = (date, time) => `${date}|${time}`;
  const displayDate = (date) => new Date(`${date}T12:00:00`).toLocaleDateString("en-CA", {
    year: "numeric", month: "long", day: "numeric"
  });
  const displayTime = (time) => {
    const [hours, minutes] = time.split(":").map(Number);
    return new Date(2000, 0, 1, hours, minutes).toLocaleTimeString("en-CA", { hour: "numeric", minute: "2-digit" });
  };

  const setAvailabilityMessage = (message, available = false) => {
    availabilityMessage.textContent = message;
    availabilityMessage.classList.toggle("is-available", available);
    availabilityMessage.hidden = false;
  };

  const summaryItem = (container, label, value) => {
    const item = document.createElement("div");
    item.className = "summary-item";
    const title = document.createElement("span");
    title.textContent = label;
    const content = document.createElement("strong");
    content.textContent = value;
    item.append(title, content);
    container.append(item);
  };

  const updateJourney = (accessible) => {
    const accessStep = document.querySelector("#access-step");
    const detailStep = document.querySelector("#detail-step");
    const receiptStep = document.querySelector("#receipt-step");
    const receiptPreview = document.querySelector("#receipt-preview");
    const receiptCopy = document.querySelector("#receipt-copy");
    const yesButton = document.querySelector('[data-access="yes"]');
    const noButton = document.querySelector('[data-access="no"]');
    const resolution = document.querySelector("#access-resolution");

    if (accessible) {
      accessStep.classList.add("is-complete");
      accessStep.classList.remove("is-active");
      accessStep.querySelector(".journey-dot").textContent = "✓";
      yesButton.hidden = true;
      noButton.hidden = true;
      resolution.hidden = true;
      detailStep.classList.add("is-complete");
      detailStep.querySelector(".journey-dot").textContent = "✓";
      receiptStep.classList.add("is-active");
      receiptStep.querySelector(".journey-dot").textContent = "$";
      receiptCopy.textContent = "Fictional package total only. No payment is collected and no transaction is processed.";
      receiptPreview.innerHTML = `${packageInfo[bookingResult.dataset.package].name} <span>—</span> <strong>$${packageInfo[bookingResult.dataset.package].price} CAD</strong><br><span>Prototype estimate · no payment due</span>`;
      receiptPreview.hidden = false;
    } else {
      accessStep.classList.remove("is-complete", "is-active");
      accessStep.querySelector(".journey-dot").textContent = "03";
      detailStep.classList.remove("is-complete");
      detailStep.querySelector(".journey-dot").textContent = "04";
      receiptStep.classList.remove("is-active");
      receiptStep.querySelector(".journey-dot").textContent = "05";
      receiptCopy.textContent = "A fictional price summary will appear at the final stage. No payment is collected.";
      receiptPreview.hidden = true;
    }
  };

  document.querySelectorAll("[data-select-package]").forEach((button) => {
    button.addEventListener("click", () => {
      packageSelect.value = button.dataset.selectPackage;
      packageSelect.dispatchEvent(new Event("change", { bubbles: true }));
      setError("package", "");
      document.querySelector("#booking").scrollIntoView({ behavior: "smooth" });
      packageSelect.focus({ preventScroll: true });
    });
  });

  const packageFromUrl = new URLSearchParams(window.location.search).get("package");
  if (packageInfo[packageFromUrl]) packageSelect.value = packageFromUrl;

  form.addEventListener("input", (event) => {
    if (event.target.name) setError(event.target.name, "");
    if (!availabilityMessage.hidden) availabilityMessage.hidden = true;
  });
  form.addEventListener("change", (event) => {
    if (event.target.name) setError(event.target.name, "");
    if (!availabilityMessage.hidden) availabilityMessage.hidden = true;
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!validate()) return;

    const values = new FormData(form);
    const requestedSlot = slotFor(values.get("appointmentDate"), values.get("appointmentTime"));
    let existingSlots;
    try {
      existingSlots = readSlots();
    } catch (error) {
      setAvailabilityMessage(error.message);
      return;
    }

    if (existingSlots.includes(requestedSlot)) {
      setAvailabilityMessage("That prototype time is already marked unavailable in this browser. Please choose another date or time and check again.");
      dateInput.focus();
      return;
    }

    const nextSlots = [...existingSlots, requestedSlot];
    try {
      writeSlots(nextSlots);
    } catch (error) {
      setAvailabilityMessage(error.message);
      return;
    }

    const selectedPackage = packageInfo[values.get("package")];
    const reference = `LD-${Math.random().toString(36).slice(2, 6).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    bookingResult.dataset.package = values.get("package");
    document.querySelector("#confirmation-copy").textContent = `Thanks, ${String(values.get("fullName")).trim()}. Your requested appointment is available in this browser's prototype schedule. This is a simulated confirmation only—not a real reservation.`;
    const summary = document.querySelector("#booking-summary");
    summary.replaceChildren();
    summaryItem(summary, "PACKAGE", selectedPackage.name);
    summaryItem(summary, "PREFERRED DATE", displayDate(values.get("appointmentDate")));
    summaryItem(summary, "PREFERRED TIME", displayTime(values.get("appointmentTime")));
    summaryItem(summary, "VEHICLE", `${String(values.get("vehicleYear"))} ${String(values.get("vehicle")).trim()}`);
    summaryItem(summary, "SERVICE ADDRESS", String(values.get("address")).trim());
    summaryItem(summary, "FICTIONAL PRICE", `$${selectedPackage.price} CAD`);
    document.querySelector("#booking-reference").textContent = reference;
    form.hidden = true;
    bookingResult.hidden = false;
    availabilityMessage.hidden = true;
    updateJourney(false);
    bookingResult.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  document.querySelector('[data-access="yes"]').addEventListener("click", () => updateJourney(true));
  document.querySelector('[data-access="no"]').addEventListener("click", () => {
    document.querySelector("#access-resolution").hidden = false;
  });
  document.querySelector("#resolve-access").addEventListener("click", () => updateJourney(true));

  document.querySelector("#reschedule-booking").addEventListener("click", () => {
    const currentSlot = slotFor(dateInput.value, form.elements.appointmentTime.value);
    try {
      writeSlots(readSlots().filter((slot) => slot !== currentSlot));
    } catch (error) {
      setAvailabilityMessage(error.message);
      bookingResult.hidden = true;
      form.hidden = false;
      return;
    }
    bookingResult.hidden = true;
    form.hidden = false;
    setAvailabilityMessage("The prototype slot has been released. Choose a different date or time, then check availability again.");
    availabilityMessage.scrollIntoView({ behavior: "smooth", block: "center" });
    dateInput.focus({ preventScroll: true });
  });

  document.querySelector("#new-booking").addEventListener("click", () => {
    form.reset();
    dateInput.min = todayString;
    bookingResult.hidden = true;
    form.hidden = false;
    clearErrors();
    availabilityMessage.hidden = true;
    form.scrollIntoView({ behavior: "smooth", block: "start" });
    form.elements.fullName.focus({ preventScroll: true });
  });
})();
