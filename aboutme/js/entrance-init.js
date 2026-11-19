// Decide before the first paint; language navigation must never show the entrance.
(() => {
  const params = new URLSearchParams(window.location.search);
  if (params.has("language-switch")) {
    document.documentElement.classList.add("language-positioning");
    // Do not leave the page hidden if the main script fails to load.
    window.setTimeout(() => document.documentElement.classList.remove("language-positioning"), 4000);
  }
  let skip = params.has("language-switch") || params.has("reading");
  try {
    skip ||= window.sessionStorage.getItem("ryan-portfolio-entrance-seen") === "true";
  } catch {
    // Language navigation also works when browser storage is unavailable.
  }
  if (skip) document.documentElement.classList.add("skip-entrance");
})();
