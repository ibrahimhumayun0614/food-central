document.documentElement.classList.add("js-ready");

const navToggle = document.querySelector(".nav-toggle");
const navLinks = document.querySelector(".nav-links");
const topBanner = document.querySelector("#top-banner");
const topBannerClose = document.querySelector(".top-banner-close");
const registerModal = document.querySelector("#register-modal");
const openRegisterButtons = document.querySelectorAll("[data-open-register]");
const closeRegisterButton = document.querySelector(".modal-close");
const blogTrack = document.querySelector("[data-blog-track]");
const blogPrevButton = document.querySelector("[data-blog-prev]");
const blogNextButton = document.querySelector("[data-blog-next]");
const registerCourseSelect = document.querySelector("#register-course");
const registerForm = document.querySelector(".register-form");
const registerModalDismissedKey = "veltara-register-modal-dismissed";

const courseSelectValues = {
  "Food Safety Foundations": "food-safety-foundations",
  "HACCP Implementation Workshop": "haccp-workshop",
  "Leadership for Operations Teams": "leadership-operations",
  "Corporate Team Sessions": "corporate-sessions",
};

const resolveCourseValue = (courseKey = "") => {
  if (!courseKey) {
    return "";
  }

  return courseSelectValues[courseKey] || courseKey;
};

const parseCourseOptionLabel = (label) => {
  const separator = " – ";
  const splitIndex = label.indexOf(separator);

  if (splitIndex === -1) {
    return { title: label, date: "" };
  }

  return {
    title: label.slice(0, splitIndex),
    date: label.slice(splitIndex + separator.length),
  };
};

const syncCourseSelectDisplay = () => {
  if (!registerCourseSelect || !courseSelectUI) {
    return;
  }

  courseSelectUI.renderMenu();
  courseSelectUI.syncFromNative();
};

let courseSelectUI = null;

const initCourseSelect = () => {
  const wrapper = document.querySelector("#register-course-wrapper");
  const select = registerCourseSelect;
  const trigger = document.querySelector("#register-course-trigger");
  const valueEl = trigger?.querySelector(".course-select-value");
  const menu = document.querySelector("#register-course-menu");

  if (!wrapper || !select || !trigger || !valueEl || !menu) {
    return null;
  }

  let focusedIndex = -1;
  let isCourseLocked = false;

  const setCourseLocked = (locked) => {
    isCourseLocked = locked;
    wrapper.classList.toggle("is-locked", locked);
    trigger.tabIndex = locked ? -1 : 0;
    trigger.setAttribute("aria-disabled", locked ? "true" : "false");

    if (locked) {
      closeMenu();
      trigger.removeAttribute("aria-haspopup");
      trigger.removeAttribute("aria-expanded");
      trigger.removeAttribute("aria-controls");
      return;
    }

    trigger.setAttribute("aria-haspopup", "listbox");
    trigger.setAttribute("aria-expanded", "false");
    trigger.setAttribute("aria-controls", "register-course-menu");
  };

  const buildOptionContent = (label, isPlaceholder) => {
    if (isPlaceholder) {
      return label;
    }

    const { title, date } = parseCourseOptionLabel(label);
    const titleEl = document.createElement("span");
    titleEl.className = "course-select-option-title";
    titleEl.textContent = title;

    if (!date) {
      return titleEl;
    }

    const dateEl = document.createElement("span");
    dateEl.className = "course-select-option-date";
    dateEl.textContent = date;

    const fragment = document.createDocumentFragment();
    fragment.append(titleEl, dateEl);
    return fragment;
  };

  const renderMenu = () => {
    menu.innerHTML = "";

    [...select.options].forEach((option, index) => {
      const item = document.createElement("li");
      const isPlaceholder = !option.value;

      item.className = "course-select-option";
      item.dataset.value = option.value;
      item.dataset.index = String(index);
      item.setAttribute("role", "option");
      item.setAttribute("aria-selected", option.selected ? "true" : "false");

      if (isPlaceholder) {
        item.classList.add("is-placeholder");
      }

      if (option.selected && option.value) {
        item.classList.add("is-selected");
      }

      item.append(buildOptionContent(option.textContent.trim(), isPlaceholder));
      menu.appendChild(item);
    });
  };

  const getOptionElements = () => [...menu.querySelectorAll(".course-select-option")];

  const setFocusedOption = (index) => {
    const options = getOptionElements();
    focusedIndex = Math.max(0, Math.min(index, options.length - 1));

    options.forEach((option, optionIndex) => {
      option.classList.toggle("is-focused", optionIndex === focusedIndex);
    });

    options[focusedIndex]?.scrollIntoView({ block: "nearest" });
  };

  const closeMenu = () => {
    wrapper.classList.remove("is-open");
    trigger.setAttribute("aria-expanded", "false");
    menu.hidden = true;
    focusedIndex = -1;
    getOptionElements().forEach((option) => option.classList.remove("is-focused"));
  };

  const openMenu = () => {
    renderMenu();
    wrapper.classList.add("is-open");
    trigger.setAttribute("aria-expanded", "true");
    menu.hidden = false;

    const selectedIndex = [...select.options].findIndex((option) => option.selected);
    setFocusedOption(selectedIndex >= 0 ? selectedIndex : 0);
  };

  const setValue = (value) => {
    select.value = value;
    select.dispatchEvent(new Event("change", { bubbles: true }));
    syncFromNative();
    closeMenu();
  };

  const syncFromNative = () => {
    const selectedOption = select.options[select.selectedIndex];
    const hasValue = Boolean(select.value);

    valueEl.textContent = selectedOption?.textContent.trim() || "Select a course";
    trigger.classList.toggle("is-placeholder", !hasValue);

    getOptionElements().forEach((option) => {
      const isSelected = option.dataset.value === select.value && Boolean(select.value);
      option.classList.toggle("is-selected", isSelected);
      option.setAttribute("aria-selected", isSelected ? "true" : "false");
    });
  };

  renderMenu();
  syncFromNative();

  trigger.addEventListener("click", () => {
    if (isCourseLocked) {
      return;
    }

    if (wrapper.classList.contains("is-open")) {
      closeMenu();
      return;
    }

    openMenu();
  });

  menu.addEventListener("click", (event) => {
    const option = event.target.closest(".course-select-option");
    if (!option) {
      return;
    }

    setValue(option.dataset.value || "");
  });

  trigger.addEventListener("keydown", (event) => {
    if (isCourseLocked) {
      return;
    }

    if (event.key === "ArrowDown" || event.key === "ArrowUp" || event.key === "Enter" || event.key === " ") {
      event.preventDefault();
    }

    if (event.key === "ArrowDown") {
      if (!wrapper.classList.contains("is-open")) {
        openMenu();
        return;
      }

      setFocusedOption(focusedIndex + 1);
    }

    if (event.key === "ArrowUp") {
      if (!wrapper.classList.contains("is-open")) {
        openMenu();
        return;
      }

      setFocusedOption(focusedIndex - 1);
    }

    if ((event.key === "Enter" || event.key === " ") && wrapper.classList.contains("is-open")) {
      const focusedOption = getOptionElements()[focusedIndex];
      if (focusedOption) {
        setValue(focusedOption.dataset.value || "");
      }
    }

    if (event.key === "Escape" && wrapper.classList.contains("is-open")) {
      closeMenu();
      event.stopPropagation();
    }
  });

  document.addEventListener("click", (event) => {
    if (!wrapper.contains(event.target)) {
      closeMenu();
    }
  });

  if (registerForm) {
    registerForm.addEventListener("reset", () => {
      requestAnimationFrame(() => {
        setCourseLocked(false);
        syncFromNative();
      });
    });
  }

  return { syncFromNative, closeMenu, renderMenu, setCourseLocked };
};

courseSelectUI = initCourseSelect();

if (blogTrack && blogPrevButton && blogNextButton) {
  const blogCards = [...blogTrack.querySelectorAll(".blog-card")];
  let activeBlogIndex = 0;

  const scrollToBlogCard = (index) => {
    if (!blogCards.length) {
      return;
    }

    activeBlogIndex = Math.max(0, Math.min(index, blogCards.length - 1));
    blogTrack.scrollTo({
      left: blogCards[activeBlogIndex].offsetLeft,
      behavior: "smooth",
    });
  };

  const syncActiveBlogFromScroll = () => {
    if (!blogCards.length) {
      return;
    }

    let closestIndex = 0;
    let closestDistance = Number.POSITIVE_INFINITY;

    blogCards.forEach((card, index) => {
      const distance = Math.abs(card.offsetLeft - blogTrack.scrollLeft);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });

    activeBlogIndex = closestIndex;
  };

  blogPrevButton.addEventListener("click", () => scrollToBlogCard(activeBlogIndex - 1));
  blogNextButton.addEventListener("click", () => scrollToBlogCard(activeBlogIndex + 1));
  blogTrack.addEventListener("scroll", syncActiveBlogFromScroll, { passive: true });
}

if (navToggle && navLinks) {
  navToggle.addEventListener("click", () => {
    const isOpen = navToggle.getAttribute("aria-expanded") === "true";

    navToggle.setAttribute("aria-expanded", String(!isOpen));
    navLinks.classList.toggle("is-open", !isOpen);
    document.body.classList.toggle("menu-open", !isOpen);
  });

  navLinks.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      navToggle.setAttribute("aria-expanded", "false");
      navLinks.classList.remove("is-open");
      document.body.classList.remove("menu-open");
    });
  });
}

if (topBanner && topBannerClose) {
  topBannerClose.addEventListener("click", () => {
    topBanner.classList.add("is-hidden");
  });
}

const openRegisterModal = (courseKey = "") => {
  if (!registerModal) {
    return;
  }

  const courseValue = resolveCourseValue(courseKey);
  const lockCourse = Boolean(courseValue);

  sessionStorage.removeItem(registerModalDismissedKey);
  registerModal.hidden = false;
  document.body.classList.add("modal-open");
  courseSelectUI?.closeMenu();

  if (registerCourseSelect) {
    registerCourseSelect.value = courseValue;
    courseSelectUI?.setCourseLocked(lockCourse);
    syncCourseSelectDisplay();
  }
};

const closeRegisterModal = () => {
  if (!registerModal) {
    return;
  }

  registerModal.hidden = true;
  document.body.classList.remove("modal-open");
  courseSelectUI?.closeMenu();
  courseSelectUI?.setCourseLocked(false);
  sessionStorage.setItem(registerModalDismissedKey, "true");
};

if (registerModal) {
  const wasRegisterModalDismissed =
    sessionStorage.getItem(registerModalDismissedKey) === "true";

  registerModal.hidden = true;
  document.body.classList.remove("modal-open");

  if (wasRegisterModalDismissed) {
    registerModal.hidden = true;
  }
}

openRegisterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    openRegisterModal(button.dataset.course || "");
  });
});

if (closeRegisterButton) {
  closeRegisterButton.addEventListener("click", closeRegisterModal);
}

if (registerModal) {
  registerModal.addEventListener("click", (event) => {
    if (event.target === registerModal) {
      closeRegisterModal();
    }
  });

  const modalDialog = registerModal.querySelector(".modal-dialog");
  if (modalDialog) {
    modalDialog.addEventListener("click", (event) => {
      event.stopPropagation();
    });
  }
}

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && registerModal && !registerModal.hidden) {
    closeRegisterModal();
  }
});

if (registerForm) {
  registerForm.addEventListener("submit", (event) => {
    event.preventDefault();
    registerForm.reset();
    closeRegisterModal();
  });
}

const countUpItems = document.querySelectorAll(".count-up");

if (countUpItems.length) {
  const animateCount = (element) => {
    const target = Number(element.dataset.count || 0);
    const duration = 1400;
    const startTime = performance.now();

    const step = (currentTime) => {
      const progress = Math.min((currentTime - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      element.textContent = Math.round(target * eased).toString();

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };

    requestAnimationFrame(step);
  };

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        animateCount(entry.target);
        obs.unobserve(entry.target);
      });
    },
    { threshold: 0.45 }
  );

  countUpItems.forEach((item) => observer.observe(item));
}
