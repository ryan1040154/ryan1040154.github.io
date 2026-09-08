document.addEventListener("DOMContentLoaded", () => {
  const typewriter = document.getElementById("typewriter");
  const locationText = document.querySelector(".location-text");
  const canvas = document.getElementById("network-bg");
  const backToTop = document.querySelector(".back-to-top");
  const topbar = document.querySelector(".topbar");
  const navToggle = document.querySelector(".nav-toggle");

  const portrait = document.querySelector("button.profile-photo");
  if (portrait) {
    const lifestyle = portrait.querySelector(".portrait-lifestyle");
    const chinese = document.documentElement.lang.startsWith("zh");
    portrait.addEventListener("click", async () => {
      try {
        await lifestyle.decode();
        const showLifestyle = portrait.getAttribute("aria-pressed") !== "true";
        portrait.setAttribute("aria-pressed", String(showLifestyle));
        portrait.setAttribute("aria-label", chinese
          ? (showLifestyle ? "切換正式照" : "切換生活照")
          : (showLifestyle ? "Show professional photo" : "Show lifestyle photo"));
      } catch {
        portrait.setAttribute("aria-label", chinese ? "生活照載入失敗，點擊重試" : "Photo unavailable, click to retry");
      }
    });
  }

  const timeline = document.querySelector(".experience-timeline");
  if (timeline) {
    const hover = window.matchMedia("(hover: hover)");
    timeline.querySelectorAll("details").forEach((entry) => {
      let openedByHover = false;
      let expanded = entry.open;
      let animation;
      let leaveTimer;
      const summary = entry.querySelector("summary");
      const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
      const setExpanded = (next) => {
        clearTimeout(leaveTimer);
        const from = entry.getBoundingClientRect().height;
        animation?.cancel();
        expanded = next;
        entry.dataset.expanded = String(next);
        entry.open = true;
        const to = next ? entry.getBoundingClientRect().height : summary.getBoundingClientRect().height + 2;
        if (motion.matches) {
          entry.open = next;
          return;
        }
        animation = entry.animate(
          [{ height: from + "px" }, { height: to + "px" }],
          { duration: 360, easing: "cubic-bezier(0.22, 1, 0.36, 1)" }
        );
        animation.onfinish = () => {
          entry.open = expanded;
          animation = null;
        };
      };
      entry.addEventListener("pointerenter", () => {
        clearTimeout(leaveTimer);
        if (hover.matches && !expanded) {
          openedByHover = true;
          setExpanded(true);
        }
      });
      entry.addEventListener("pointerleave", () => {
        if (openedByHover && !entry.contains(document.activeElement)) {
          leaveTimer = setTimeout(() => {
            setExpanded(false);
            openedByHover = false;
          }, 160);
        }
      });
      summary.addEventListener("click", (event) => {
        event.preventDefault();
        openedByHover = false;
        setExpanded(!expanded);
      });
      entry.addEventListener("focusout", (event) => {
        if (openedByHover && !entry.contains(event.relatedTarget) && !entry.matches(":hover")) {
          setExpanded(false);
          openedByHover = false;
        }
      });
      window.addEventListener("resize", () => {
        if (animation) {
          setExpanded(expanded);
        }
      });
    });
    const reveal = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        timeline.classList.add("reveal");
        reveal.disconnect();
      }
    }, { threshold: 0.1 });
    reveal.observe(timeline);
  }

  const emailContact = document.querySelector(".email-contact");
  if (emailContact) {
    const toggle = emailContact.querySelector(".email");
    const panel = emailContact.querySelector(".email-panel");
    const copy = emailContact.querySelector(".copy-email");
    const address = emailContact.querySelector(".email-address");
    const status = emailContact.querySelector(".email-status");
    const isChinese = document.documentElement.lang.startsWith("zh");
    let closeTimer;
    let panelAnimation;
    const panelMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const touchLayout = window.matchMedia("(hover: none)");
    const positionPanel = () => {
      const centeredLeft = (toggle.offsetWidth - panel.offsetWidth) / 2;
      panel.style.left = centeredLeft + "px";
      const bounds = panel.getBoundingClientRect();
      const shift = Math.max(18 - bounds.left, Math.min(0, window.innerWidth - 18 - bounds.right));
      panel.style.left = centeredLeft + shift + "px";
    };
    const closeEmail = (restoreFocus = false) => {
      clearTimeout(closeTimer);
      if (touchLayout.matches) {
        return;
      }
      const opacity = getComputedStyle(panel).opacity;
      panelAnimation?.cancel();
      if (!panel.hidden && !panelMotion.matches) {
        panelAnimation = panel.animate(
          [{ opacity }, { opacity: 0 }],
          { duration: 180, easing: "ease-out" }
        );
        panelAnimation.onfinish = () => {
          panel.hidden = true;
          panelAnimation = null;
        };
      } else {
        panel.hidden = true;
      }
      if (restoreFocus) {
        toggle.focus();
      }
    };
    const showEmail = () => {
      clearTimeout(closeTimer);
      const wasHidden = panel.hidden;
      const opacity = wasHidden ? 0 : getComputedStyle(panel).opacity;
      const wasAnimating = Boolean(panelAnimation);
      panelAnimation?.cancel();
      panel.hidden = false;
      positionPanel();
      if ((wasHidden || wasAnimating) && !panelMotion.matches) {
        panelAnimation = panel.animate(
          [{ opacity }, { opacity: 1 }],
          { duration: 220, easing: "ease-out" }
        );
        panelAnimation.onfinish = () => { panelAnimation = null; };
      }
    };
    emailContact.addEventListener("pointerenter", showEmail);
    emailContact.addEventListener("focusin", showEmail);
    emailContact.addEventListener("pointerleave", () => {
      closeTimer = setTimeout(() => {
        if (!emailContact.contains(document.activeElement)) {
          closeEmail();
        }
      }, 180);
    });
    copy.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(address.textContent.trim());
        status.textContent = isChinese ? "已複製 ✓" : "Copied ✓";
      } catch {
        const range = document.createRange();
        range.selectNodeContents(address);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        status.textContent = isChinese
          ? "無法自動複製，請複製已選取的信箱文字。"
          : "Please copy the selected email address manually.";
      }
    });
    document.addEventListener("pointerdown", (event) => {
      if (!panel.hidden && !emailContact.contains(event.target)) {
        closeEmail(panel.contains(document.activeElement));
      }
    });
    emailContact.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !panel.hidden) {
        event.preventDefault();
        closeEmail(true);
      }
    });
    emailContact.addEventListener("focusout", (event) => {
      if (!emailContact.contains(event.relatedTarget)) {
        closeEmail();
      }
    });
    const syncEmail = () => {
      if (touchLayout.matches) {
        showEmail();
      } else if (!panel.hidden) {
        positionPanel();
      }
    };
    touchLayout.addEventListener("change", syncEmail);
    window.addEventListener("resize", syncEmail);
    syncEmail();
  }

  if (locationText) {
    setTimeout(() => {
      locationText.classList.add("visible");
    }, 250);
  }

  if (typewriter) {
    const text = "Ryan Chuang";
    typewriter.textContent = "";
    let index = 0;

    const type = () => {
      if (index < text.length) {
        typewriter.textContent += text.charAt(index);
        index += 1;
        setTimeout(type, 110);
        return;
      }

      typewriter.style.borderRight = "none";
    };

    type();
  }

  if (backToTop) {
    const toggleBackToTop = () => {
      backToTop.classList.toggle("visible", window.scrollY > 520);
    };

    window.addEventListener("scroll", toggleBackToTop, { passive: true });
    toggleBackToTop();

    backToTop.addEventListener("click", () => {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    });
  }

  if (topbar && navToggle) {
    const mobile = window.matchMedia("(max-width: 760px)");
    const navLinks = topbar.querySelector(".nav-links");
    const openLabel = navToggle.getAttribute("aria-label");
    const closeLabel = document.documentElement.lang.startsWith("zh")
      ? "關閉導覽選單"
      : "Close navigation menu";
    const closeMenu = (restoreFocus = false) => {
      topbar.classList.remove("open");
      document.body.classList.remove("nav-open");
      navToggle.setAttribute("aria-expanded", "false");
      navToggle.setAttribute("aria-label", openLabel);
      if (restoreFocus) {
        navToggle.focus();
      }
    };

    navToggle.addEventListener("click", () => {
      if (topbar.classList.contains("open")) {
        closeMenu(true);
        return;
      }
      topbar.classList.add("open");
      document.body.classList.add("nav-open");
      navToggle.setAttribute("aria-expanded", "true");
      navToggle.setAttribute("aria-label", closeLabel);
      navLinks?.querySelector("a")?.focus();
    });

    topbar.querySelectorAll(".nav-links a").forEach((link) => {
      link.addEventListener("click", () => {
        const wasOpen = topbar.classList.contains("open");
        closeMenu();
        if (!wasOpen) {
          return;
        }
        const href = link.getAttribute("href");
        const destination = href.startsWith("#") ? document.querySelector(href) : null;
        if (destination) {
          destination.setAttribute("tabindex", "-1");
          destination.focus({ preventScroll: true });
          destination.addEventListener("blur", () => destination.removeAttribute("tabindex"), { once: true });
        }
      });
    });

    document.addEventListener("keydown", (event) => {
      if (!mobile.matches || !topbar.classList.contains("open")) {
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        closeMenu(true);
      } else if (event.key === "Tab") {
        const controls = [navToggle, ...topbar.querySelectorAll(".nav-links a")];
        const index = controls.indexOf(document.activeElement);
        if (event.shiftKey && index <= 0) {
          event.preventDefault();
          controls[controls.length - 1].focus();
        } else if (!event.shiftKey && (index === controls.length - 1 || index === -1)) {
          event.preventDefault();
          navToggle.focus();
        }
      }
    });

    mobile.addEventListener("change", () => {
      if (!mobile.matches) {
        const toggleHadFocus = document.activeElement === navToggle;
        closeMenu();
        if (toggleHadFocus) {
          navLinks?.querySelector("a")?.focus();
        }
      } else {
        closeMenu(navLinks?.contains(document.activeElement));
      }
    });
  }

  if (!canvas) {
    return;
  }

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return;
  }

  const hero = canvas.closest(".hero");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const pointer = { x: 0, y: 0, targetX: 0, targetY: 0 };
  // Unit-space points form a volume; rotation and perspective provide real depth.
  const nodes = Array.from({ length: 90 }, () => ({
    x: (Math.random() - 0.5) * 2.4,
    y: (Math.random() - 0.5) * 1.7,
    z: (Math.random() - 0.5) * 1.2,
    phase: Math.random() * Math.PI * 2,
  }));
  let width = 0;
  let height = 0;
  let frame = null;
  let lastTime = 0;
  let elapsed = 0;
  let inView = true;

  function draw(delta = 0) {
    elapsed += delta;
    const easing = 1 - Math.exp(-delta * 5);
    pointer.x += (pointer.targetX - pointer.x) * easing;
    pointer.y += (pointer.targetY - pointer.y) * easing;
    const angleY = Math.sin(elapsed * 0.22) * 0.18 + pointer.x * 0.3;
    const angleX = Math.cos(elapsed * 0.18) * 0.08 - pointer.y * 0.2;
    const scale = Math.min(width * 0.55, height * 0.95);
    const count = width < 760 ? 52 : nodes.length;
    const points = nodes.slice(0, count).map((node) => {
      const x = node.x * (width / height > 1.5 ? 1.25 : 0.85);
      const y = node.y + Math.sin(elapsed * 0.4 + node.phase) * 0.035;
      const rx = x * Math.cos(angleY) + node.z * Math.sin(angleY);
      const rz = -x * Math.sin(angleY) + node.z * Math.cos(angleY);
      const ry = y * Math.cos(angleX) - rz * Math.sin(angleX);
      const z = y * Math.sin(angleX) + rz * Math.cos(angleX);
      const perspective = 2.8 / (2.8 + z);
      return {
        x: width / 2 + rx * scale * perspective,
        y: height / 2 + ry * scale * perspective,
        z, rx, ry, perspective,
      };
    });
    ctx.clearRect(0, 0, width, height);
    const glow = ctx.createRadialGradient(width * 0.65, height * 0.4, 0, width / 2, height / 2, width * 0.8);
    glow.addColorStop(0, "#302642");
    glow.addColorStop(1, "#101018");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);

    for (let i = 0; i < points.length; i += 1) {
      const a = points[i];
      for (let j = i + 1; j < points.length; j += 1) {
        const b = points[j];
        const distance = Math.hypot(a.rx - b.rx, a.ry - b.ry, a.z - b.z);
        if (distance > 0.65) {
          continue;
        }
        const alpha = (1 - distance / 0.65) * 0.42;
        ctx.strokeStyle = `rgba(170, 164, 237, ${alpha})`;
        ctx.lineWidth = Math.min(a.perspective, b.perspective) * 0.8;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }
    points.sort((a, b) => b.z - a.z).forEach((point) => {
      const radius = 1.5 * point.perspective;
      ctx.fillStyle = "rgba(139, 213, 245, 0.07)";
      ctx.beginPath();
      ctx.arc(point.x, point.y, radius * 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgba(180, 224, 250, ${0.45 * point.perspective})`;
      ctx.beginPath();
      ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
      ctx.fill();
    });
    // A soft center shade keeps the portrait and text legible.
    const shade = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, Math.max(width * 0.38, height * 0.6));
    shade.addColorStop(0, "rgba(16, 16, 24, 0.65)");
    shade.addColorStop(1, "rgba(16, 16, 24, 0)");
    ctx.fillStyle = shade;
    ctx.fillRect(0, 0, width, height);
  }

  function animate(time) {
    frame = null;
    draw(lastTime ? Math.min((time - lastTime) / 1000, 0.05) : 0);
    lastTime = time;
    frame = requestAnimationFrame(animate);
  }

  function syncAnimation() {
    if (frame !== null) {
      cancelAnimationFrame(frame);
      frame = null;
    }
    lastTime = 0;
    if (reducedMotion.matches) {
      pointer.x = pointer.y = 0;
      draw();
    } else if (inView && !document.hidden) {
      frame = requestAnimationFrame(animate);
    }
  }

  function resizeCanvas() {
    width = canvas.offsetWidth;
    height = canvas.offsetHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  }

  hero.addEventListener("pointermove", (event) => {
    if (event.pointerType === "touch" || reducedMotion.matches) {
      return;
    }
    const bounds = hero.getBoundingClientRect();
    pointer.targetX = (event.clientX - bounds.left) / bounds.width * 2 - 1;
    pointer.targetY = (event.clientY - bounds.top) / bounds.height * 2 - 1;
  }, { passive: true });
  hero.addEventListener("pointerleave", () => {
    pointer.targetX = pointer.targetY = 0;
  });
  new ResizeObserver(resizeCanvas).observe(hero);
  new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    syncAnimation();
  }).observe(hero);
  document.addEventListener("visibilitychange", syncAnimation);
  reducedMotion.addEventListener("change", syncAnimation);
  resizeCanvas();
  syncAnimation();
});
