const toast = document.querySelector(".toast");
const overallState = document.querySelector("[data-server-state]");
const playerCount = document.querySelector("[data-player-count]");
const javaState = document.querySelector("[data-java-state]");
const bedrockState = document.querySelector("[data-bedrock-state]");
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

async function fetchStatus(url) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`Status request failed: ${response.status}`);
  return response.json();
}

async function updateServerStatus() {
  const [javaResult, bedrockResult] = await Promise.allSettled([
    fetchStatus("https://api.mcstatus.io/v2/status/java/play.polarsmp.com"),
    fetchStatus("https://api.mcstatus.io/v2/status/bedrock/play.polarsmp.com:15014")
  ]);

  const java = javaResult.status === "fulfilled" ? javaResult.value : null;
  const bedrock = bedrockResult.status === "fulfilled" ? bedrockResult.value : null;

  setEditionState(javaState, java);
  setEditionState(bedrockState, bedrock);

  const online = Boolean(java?.online || bedrock?.online);
  overallState?.classList.toggle("online", online);
  overallState?.classList.toggle("offline", !online);

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
}

updateServerStatus();
setInterval(updateServerStatus, 30000);

document.addEventListener("visibilitychange", () => {
  if (!document.hidden) updateServerStatus();
});
