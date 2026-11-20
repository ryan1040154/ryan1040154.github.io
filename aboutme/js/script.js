document.addEventListener("DOMContentLoaded", () => {
  const calmMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const readingSections = [...document.querySelectorAll("main > .section[id]")];
  const languageLink = document.querySelector(".language-switch a");
  let languageChanging = false;
  const pageUrl = new URL(window.location.href);
  const reading = window.portfolioReading || pageUrl.searchParams;
  const isLanguageArrival = reading.has("language-switch");
  const readingKeys = ["language-switch", "reading", "progress", "card", "card-progress"];
  if (readingKeys.some((key) => pageUrl.searchParams.has(key))) {
    readingKeys.forEach((key) => pageUrl.searchParams.delete(key));
    if (pageUrl.protocol !== "file:") pageUrl.pathname = pageUrl.pathname.replace(/\/index\.html$/, "/");
    window.history.replaceState(window.history.state, "", pageUrl.href);
  }
  window.addEventListener("pageshow", () => {
    document.body.classList.remove("language-leaving");
    document.querySelector(".language-switch")?.classList.remove("is-switching");
    languageChanging = false;
  });
  const readingSection = readingSections.find((section) => section.id === reading.get("reading"));
  const progress = Number(reading.get("progress"));
  const readingOffset = () => document.querySelector(".topbar")?.getBoundingClientRect().height ?? 0;

  // Offset coordinates avoid transient transforms from section reveal animations.
  const layoutTop = (element) => {
    let top = 0;
    for (let node = element; node; node = node.offsetParent) top += node.offsetTop;
    return top;
  };
  const readingCard = readingSection && [...readingSection.querySelectorAll("[data-reading-key]")]
    .find((card) => card.dataset.readingKey === reading.get("card"));
  const cardProgress = Number(reading.get("card-progress"));

  const restoreReadingPosition = () => {
    if (!readingSection || !Number.isFinite(progress)) return;
    const target = readingCard || readingSection;
    const fraction = readingCard && Number.isFinite(cardProgress) ? cardProgress : progress;
    const top = layoutTop(target) + target.offsetHeight * Math.max(0, Math.min(1, fraction));
    const destination = Math.max(0, top - readingOffset());
    if (smoothScroll) smoothScroll.scrollTo(destination, { immediate: true, force: true });
    else window.scrollTo({ top: destination, behavior: "instant" });
    // The restored section should already be visible when the veil lifts.
    readingSection.classList.remove("section-waiting");
  };

  if (isLanguageArrival) {
    // Font metrics affect section heights. Position behind an opaque veil,
    // then reveal on the following frame rather than animating past the hero.
    const fontsReady = document.fonts?.ready || Promise.resolve();
    Promise.race([fontsReady, new Promise((resolve) => window.setTimeout(resolve, 1200))])
      .then(() => requestAnimationFrame(() => {
        restoreReadingPosition();
        requestAnimationFrame(() => {
          if (!calmMotion.matches) {
            document.body.classList.add("language-arriving");
            window.setTimeout(() => document.body.classList.remove("language-arriving"), 400);
          }
          document.documentElement.classList.remove("language-positioning");
        });
      }));
  } else if (readingSection) {
    requestAnimationFrame(restoreReadingPosition);
  }

  languageLink?.addEventListener("click", (event) => {
    if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    const readingLine = window.scrollY + readingOffset();
    const section = readingSections.findLast((item) => item.offsetTop <= readingLine);
    if (languageChanging) {
      event.preventDefault();
      return;
    }
    const destination = new URL(languageLink.href);
    const nextReading = new URLSearchParams();
    if (section) {
      nextReading.set("reading", section.id);
      const cards = [...section.querySelectorAll("[data-reading-key]")];
      // In a two-column row, keep the first card as the stable reading anchor.
      const card = cards.filter((item) => layoutTop(item) <= readingLine + 24)
        .sort((a, b) => layoutTop(b) - layoutTop(a))[0];
      if (card) {
        nextReading.set("card", card.dataset.readingKey);
        nextReading.set("card-progress", ((readingLine - layoutTop(card)) / card.offsetHeight).toFixed(4));
      }
      nextReading.set("progress", ((readingLine - section.offsetTop) / section.offsetHeight).toFixed(4));
    }
    nextReading.set("language-switch", "1");
    try {
      sessionStorage.setItem("portfolio-language-reading", JSON.stringify({
        path: destination.pathname,
        time: Date.now(),
        reading: nextReading.toString(),
      }));
    } catch {
      // Fall back to URL data, which the destination removes after reading.
      nextReading.forEach((value, name) => destination.searchParams.set(name, value));
    }
    event.preventDefault();
    languageChanging = true;
    document.querySelector(".language-switch")?.classList.add("is-switching");
    document.body.classList.add("language-leaving");
    window.setTimeout(() => window.location.assign(destination.href), calmMotion.matches ? 0 : 280);
  });
  if ("IntersectionObserver" in window) {
    const linkObserver = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("link-highlighted");
        linkObserver.unobserve(entry.target);
      }
    }, { threshold: 0.5 });

    document.querySelectorAll(".card-links .project-link, .education-link").forEach((link) => {
      linkObserver.observe(link);
    });
  }
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  let smoothScroll = null;
  const syncSmoothScroll = () => {
    smoothScroll?.destroy();
    smoothScroll = null;
    if (calmMotion.matches || !finePointer.matches || typeof window.Lenis !== "function") return;
    smoothScroll = new window.Lenis({
      autoRaf: true,
      lerp: 0.085,
      smoothWheel: true,
      syncTouch: false,
      anchors: true,
      allowNestedScroll: true,
    });
    syncScrollLock();
  };
  const syncScrollLock = () => {
    const blocked = document.body.classList.contains("nav-open") ||
      document.querySelector(".site-entrance:not(.is-hidden)");
    if (blocked) smoothScroll?.stop();
    else smoothScroll?.start();
  };
  new MutationObserver(syncScrollLock).observe(document.body, {
    attributes: true, subtree: true, attributeFilter: ["class"],
  });
  calmMotion.addEventListener("change", syncSmoothScroll);
  finePointer.addEventListener("change", syncSmoothScroll);
  syncSmoothScroll();

  if (!calmMotion.matches && "IntersectionObserver" in window) {
    const sections = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.remove("section-waiting");
        sections.unobserve(entry.target);
      });
    }, { threshold: 0.06 });
    document.querySelectorAll("main > .section").forEach((section) => {
      section.classList.add("section-waiting");
      sections.observe(section);
    });
    calmMotion.addEventListener("change", () => {
      if (calmMotion.matches) {
        sections.disconnect();
        document.querySelectorAll(".section-waiting").forEach((section) => section.classList.remove("section-waiting"));
      }
    });
  }
  const entrance = document.querySelector(".site-entrance");
  if (entrance) {
    const entranceCanvas = entrance.querySelector(".entrance-network");
    const reducedEntranceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const entranceKey = "ryan-portfolio-entrance-seen";
    let entranceFrame = null;

    const hasEntered = (() => {
      try {
        return window.sessionStorage.getItem(entranceKey) === "true";
      } catch {
        return false;
      }
    })();

    const hideEntrance = () => {
      cancelAnimationFrame(entranceFrame);
      entrance.classList.add("is-hidden");
    };

    if (hasEntered || readingSection || document.documentElement.classList.contains("skip-entrance")) {
      hideEntrance();
    } else {
      entrance.focus({ preventScroll: true });
      if (entranceCanvas && !reducedEntranceMotion.matches) {
        const context = entranceCanvas.getContext("2d");
        const nodes = Array.from({ length: 42 }, () => ({
          x: Math.random(),
          y: Math.random(),
          z: Math.random() * 0.75 + 0.25,
          phase: Math.random() * Math.PI * 2,
        }));
        let width = 0;
        let height = 0;

        const resizeEntrance = () => {
          width = entranceCanvas.offsetWidth;
          height = entranceCanvas.offsetHeight;
          const dpr = Math.min(window.devicePixelRatio || 1, 2);
          entranceCanvas.width = Math.round(width * dpr);
          entranceCanvas.height = Math.round(height * dpr);
          context.setTransform(dpr, 0, 0, dpr, 0, 0);
        };

        const drawEntrance = () => {
          context.clearRect(0, 0, width, height);
          const points = nodes.map((node) => {
            return {
              x: node.x * width,
              y: node.y * height,
              z: node.z,
            };
          });
          for (let index = 0; index < points.length; index += 1) {
            const point = points[index];
            for (let other = index + 1; other < points.length; other += 1) {
              const neighbor = points[other];
              const distance = Math.hypot(point.x - neighbor.x, point.y - neighbor.y);
              if (distance > Math.min(width, height) * 0.23) continue;
              const alpha = (1 - distance / (Math.min(width, height) * 0.23)) * 0.32;
              context.strokeStyle = `rgba(164, 155, 237, ${alpha})`;
              context.lineWidth = Math.min(point.z, neighbor.z);
              context.beginPath();
              context.moveTo(point.x, point.y);
              context.lineTo(neighbor.x, neighbor.y);
              context.stroke();
            }
          }
          points.forEach((point) => {
            context.fillStyle = "rgba(139, 213, 245, 0.38)";
            context.beginPath();
            context.arc(point.x, point.y, 1.2 * point.z, 0, Math.PI * 2);
            context.fill();
          });
        };

        resizeEntrance();
        window.addEventListener("resize", () => {
          resizeEntrance();
          drawEntrance();
        }, { passive: true });
        drawEntrance();
      }

      const enterPortfolio = () => {
        if (entrance.classList.contains("is-entering")) return;
        entrance.classList.add("is-entering");
        document.body.classList.add("entrance-arriving");
        window.setTimeout(() => document.body.classList.remove("entrance-arriving"), 1850);
        entrance.setAttribute("aria-busy", "true");
        try {
          window.sessionStorage.setItem(entranceKey, "true");
        } catch {
          // Private browsing can block storage; the animation still works.
        }
        window.setTimeout(() => {
          const hadFocus = document.activeElement === entrance;
          hideEntrance();
          if (hadFocus) {
            const heading = document.querySelector(".hero-name");
            heading?.setAttribute("tabindex", "-1");
            heading?.focus({ preventScroll: true });
          }
        }, reducedEntranceMotion.matches ? 80 : 1680);
      };

      entrance.addEventListener("pointerdown", (event) => {
        if (entrance.classList.contains("is-entering")) return;
        const bounds = entrance.getBoundingClientRect();
        entrance.style.setProperty("--entrance-x", `${event.clientX - bounds.left}px`);
        entrance.style.setProperty("--entrance-y", `${event.clientY - bounds.top}px`);
      });
      entrance.addEventListener("click", enterPortfolio);
      entrance.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          enterPortfolio();
        }
      });
    }
  }

  const locationText = document.querySelector(".location-text");
  const canvas = document.getElementById("network-bg");
  const backToTop = document.querySelector(".back-to-top");
  const topbar = document.querySelector(".topbar");
  const navToggle = document.querySelector(".nav-toggle");
  const scrollCue = document.querySelector(".scroll-cue");

  if (scrollCue) {
    const summary = document.getElementById("summary");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    scrollCue.addEventListener("click", () => {
      if (smoothScroll && summary) {
        smoothScroll.scrollTo(summary);
        return;
      }
      summary?.scrollIntoView({
        behavior: reducedMotion.matches ? "auto" : "smooth",
        block: "start",
      });
    });
  }

  const portrait = document.querySelector("button.profile-photo");
  if (portrait) {
    const photos = ["original", "new", "original", "previous"];
    const images = [portrait.querySelector(".portrait-original"), portrait.querySelector(".portrait-lifestyle:not(.portrait-previous)"), portrait.querySelector(".portrait-original"), portrait.querySelector(".portrait-previous")];
    const chinese = document.documentElement.lang.startsWith("zh");
    let currentPhoto = 0;
    let loadingPhoto = false;
    portrait.addEventListener("click", async () => {
      if (loadingPhoto) return;
      loadingPhoto = true;
      try {
        const nextPhoto = (currentPhoto + 1) % photos.length;
        if (!images[nextPhoto]) throw new Error("Photo unavailable");
        await images[nextPhoto].decode();
        currentPhoto = nextPhoto;
        portrait.dataset.photo = photos[currentPhoto];
        const showingLifestyle = photos[currentPhoto] !== "original";
        portrait.setAttribute("aria-pressed", String(showingLifestyle));
        portrait.setAttribute("aria-label", chinese
          ? (showingLifestyle ? "切換正式照" : "切換生活照")
          : (showingLifestyle ? "Show professional photo" : "Show lifestyle photo"));
      } catch {
        portrait.setAttribute("aria-label", chinese ? "生活照載入失敗，點擊重試" : "Photo unavailable, click to retry");
      } finally {
        loadingPhoto = false;
      }
    });
  }

  const timeline = document.querySelector(".experience-timeline");
  if (timeline) {
    const hover = window.matchMedia("(hover: hover)");
    timeline.querySelectorAll("details").forEach((entry) => {
      let expanded = entry.open;
      let animation;
      let leaveTimer;
      let lastPointerType = "";
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
        if (hover.matches) {
          setExpanded(true);
        }
      });
      entry.addEventListener("pointerleave", () => {
        if (hover.matches) {
          leaveTimer = setTimeout(() => {
            setExpanded(false);
          }, 120);
        }
      });
      summary.addEventListener("pointerdown", (event) => {
        lastPointerType = event.pointerType;
      });
      summary.addEventListener("click", (event) => {
        event.preventDefault();
        // A mouse click on an already-hovered card should not reverse the
        // hover interaction. Touch and keyboard activation remain toggles.
        if (hover.matches && lastPointerType === "mouse") {
          setExpanded(true);
          lastPointerType = "";
          return;
        }
        lastPointerType = "";
        setExpanded(!expanded);
      });
      entry.addEventListener("focusout", (event) => {
        if (!entry.contains(event.relatedTarget) && !entry.matches(":hover")) {
          setExpanded(false);
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

  for (const emailButton of document.querySelectorAll("[data-copy-email]")) {
    const email = "ryan1040154@gmail.com";
    const status = emailButton.parentElement.querySelector(".email-copy-status");
    if (!status) continue;
    const isChinese = document.documentElement.lang.startsWith("zh");
    let resetTimer;

    const copyEmail = async () => {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(email);
        return;
      }
      const input = document.createElement("textarea");
      input.value = email;
      input.setAttribute("readonly", "");
      input.style.position = "fixed";
      input.style.opacity = "0";
      document.body.append(input);
      input.select();
      const copied = document.execCommand("copy");
      input.remove();
      if (!copied) {
        throw new Error("Clipboard copy failed");
      }
    };

    emailButton.addEventListener("pointerleave", (event) => {
      if (event.pointerType === "mouse") emailButton.classList.remove("copied");
    });

    emailButton.addEventListener("click", async (event) => {
      try {
        await copyEmail();
        status.textContent = isChinese ? "已複製電子郵件地址。" : "Email address copied.";
        if (event.pointerType !== "mouse" || emailButton.matches(":hover")) {
          emailButton.classList.add("copied");
        }
        emailButton.setAttribute("aria-label", isChinese ? "電子郵件地址已複製" : "Email address copied");
      } catch {
        status.textContent = isChinese ? "無法複製電子郵件地址。" : "Unable to copy email address.";
      }
      status.classList.add("visible");
      clearTimeout(resetTimer);
      resetTimer = setTimeout(() => {
        status.classList.remove("visible");
        emailButton.classList.remove("copied");
        emailButton.setAttribute("aria-label", isChinese ? `複製信箱 ${email}` : `Copy email address ${email}`);
      }, 2200);
    });
  }

  if (locationText) {
    setTimeout(() => {
      locationText.classList.add("visible");
    }, 250);
  }

  if (backToTop) {
    const toggleBackToTop = () => {
      backToTop.classList.toggle("visible", window.scrollY > 520);
    };

    window.addEventListener("scroll", toggleBackToTop, { passive: true });
    toggleBackToTop();

    backToTop.addEventListener("click", () => {
      if (smoothScroll) {
        smoothScroll.scrollTo(0);
        return;
      }
      window.scrollTo({
        top: 0,
        behavior: calmMotion.matches ? "instant" : "smooth",
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
        navToggle.focus({ preventScroll: true });
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
      navLinks?.querySelector("a")?.focus({ preventScroll: true });
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
        const controls = [navToggle, ...topbar.querySelectorAll(".nav-links a, .language-switch a")];
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
