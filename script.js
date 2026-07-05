const toast = document.querySelector(".toast");
const overallState = document.querySelector("[data-server-state]");
const playerCount = document.querySelector("[data-player-count]");
const javaState = document.querySelector("[data-java-state]");
const bedrockState = document.querySelector("[data-bedrock-state]");
const pulseConsole = document.querySelector(".pulse-console");
const networkState = document.querySelector("[data-network-state]");
const livePlayers = document.querySelector("[data-live-players]");
const liveVersion = document.querySelector("[data-live-version]");
const liveLatency = document.querySelector("[data-live-latency]");
const liveUpdated = document.querySelector("[data-live-updated]");
const liveMotd = document.querySelector("[data-live-motd]");
const javaLight = document.querySelector("[data-java-light]");
const bedrockLight = document.querySelector("[data-bedrock-light]");
const javaRoute = document.querySelector("[data-java-route]");
const bedrockRoute = document.querySelector("[data-bedrock-route]");
let toastTimer;

function showToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("visible"), 1800);
}

document.querySelectorAll("[data-copy]").forEach((button) => {
  button.addEventListener("click", async () => {
    const value = button.dataset.copy;

    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const field = document.createElement("textarea");
      field.value = value;
      field.setAttribute("readonly", "");
      field.style.position = "fixed";
      field.style.opacity = "0";
      document.body.appendChild(field);
      field.select();
      document.execCommand("copy");
      field.remove();
    }

    showToast(`Copied ${value}`);
  });
});

function setEditionState(element, server) {
  if (!element) return;

  const detail = element.querySelector("b");
  const online = Boolean(server?.online);
  element.classList.toggle("online", online);
  element.classList.toggle("offline", !online);

  if (!online) {
    detail.textContent = "Offline";
    return;
  }

  const players = server.players?.online ?? 0;
  detail.textContent = `${players} online`;
}

function setRouteState(light, detail, server) {
  const online = Boolean(server?.online);
  light?.classList.toggle("online", online);
  light?.classList.toggle("offline", !online);
  if (detail) detail.textContent = online ? "Reachable" : "Offline";
}

async function fetchStatus(url) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`Status request failed: ${response.status}`);
  return response.json();
}

async function updateServerStatus() {
  const startedAt = Date.now();
  const [javaResult, bedrockResult] = await Promise.allSettled([
    fetchStatus("https://api.mcstatus.io/v2/status/java/play.polarsmp.com"),
    fetchStatus("https://api.mcstatus.io/v2/status/bedrock/play.polarsmp.com:15014")
  ]);

  const java = javaResult.status === "fulfilled" ? javaResult.value : null;
  const bedrock = bedrockResult.status === "fulfilled" ? bedrockResult.value : null;

  setEditionState(javaState, java);
  setEditionState(bedrockState, bedrock);
  setRouteState(javaLight, javaRoute, java);
  setRouteState(bedrockLight, bedrockRoute, bedrock);

  const online = Boolean(java?.online || bedrock?.online);
  overallState?.classList.toggle("online", online);
  overallState?.classList.toggle("offline", !online);
  pulseConsole?.classList.toggle("online", online);
  pulseConsole?.classList.toggle("offline", !online);

  const overallText = overallState?.querySelector("span");
  if (overallText) overallText.textContent = online ? "Server online" : "Server offline";

  const players = java?.online
    ? java.players?.online ?? 0
    : bedrock?.online
      ? bedrock.players?.online ?? 0
      : null;

  if (playerCount) {
    playerCount.textContent = players === null
      ? "Server offline"
      : `${players} player${players === 1 ? "" : "s"} online`;
  }

  const maxPlayers = java?.players?.max ?? bedrock?.players?.max ?? "--";
  if (livePlayers) {
    livePlayers.textContent = players === null ? "-- / --" : `${players} / ${maxPlayers}`;
  }

  const version = java?.version?.name_clean || bedrock?.version?.name || "Paper 1.21.11";
  if (liveVersion) liveVersion.textContent = String(version).replace(/^Paper\s*/i, "");

  const elapsed = Date.now() - startedAt;
  if (liveLatency) liveLatency.textContent = online ? `${elapsed} ms` : "-- ms";
  if (liveUpdated) {
    liveUpdated.textContent = new Intl.DateTimeFormat([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    }).format(new Date());
  }

  let motd = java?.motd?.clean || bedrock?.motd?.clean;
  if (Array.isArray(motd)) motd = motd.join(" ");
  if (liveMotd) {
    liveMotd.textContent = online
      ? motd || "One shared survival world for Java and Bedrock."
      : "The public routes are not responding right now.";
  }
  if (networkState) networkState.textContent = online ? "All systems ready" : "Routes unavailable";
}

updateServerStatus();
setInterval(updateServerStatus, 30000);

document.addEventListener("visibilitychange", () => {
  if (!document.hidden) updateServerStatus();
});

const menuButton = document.querySelector("[data-menu-button]");
const mobileMenu = document.querySelector("[data-mobile-menu]");

function closeMenu() {
  mobileMenu?.classList.remove("open");
  menuButton?.setAttribute("aria-expanded", "false");
  menuButton?.setAttribute("aria-label", "Open navigation");
}

menuButton?.addEventListener("click", () => {
  const willOpen = !mobileMenu?.classList.contains("open");
  mobileMenu?.classList.toggle("open", willOpen);
  menuButton.setAttribute("aria-expanded", String(willOpen));
  menuButton.setAttribute("aria-label", willOpen ? "Close navigation" : "Open navigation");
});

mobileMenu?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", closeMenu);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeMenu();
});

const commandSearch = document.querySelector("[data-command-search]");
const commandCards = Array.from(document.querySelectorAll("[data-command-card]"));
const commandFilters = Array.from(document.querySelectorAll("[data-command-filter]"));
const commandEmpty = document.querySelector("[data-command-empty]");
let commandCategory = "all";

function filterCommands() {
  const query = commandSearch?.value.trim().toLowerCase() || "";
  let visible = 0;

  commandCards.forEach((card) => {
    const matchesCategory = commandCategory === "all" || card.dataset.category === commandCategory;
    const searchable = `${card.dataset.search || ""} ${card.textContent}`.toLowerCase();
    const matchesQuery = !query || searchable.includes(query);
    const show = matchesCategory && matchesQuery;
    card.hidden = !show;
    if (show) visible += 1;
  });

  commandEmpty?.classList.toggle("visible", visible === 0);
}

commandSearch?.addEventListener("input", filterCommands);

commandFilters.forEach((button) => {
  button.addEventListener("click", () => {
    commandCategory = button.dataset.commandFilter;
    commandFilters.forEach((item) => item.classList.toggle("active", item === button));
    filterCommands();
  });
});
