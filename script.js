const toast = document.querySelector(".toast");
let toastTimer;

document.querySelectorAll("[data-copy]").forEach((button) => {
  button.addEventListener("click", async () => {
    const value = button.dataset.copy;
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const field = document.createElement("textarea");
      field.value = value;
      document.body.appendChild(field);
      field.select();
      document.execCommand("copy");
      field.remove();
    }

    toast.textContent = `Copied ${value}`;
    toast.classList.add("visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("visible"), 1800);
  });
});

async function updateServerStatus() {
  const state = document.querySelector("[data-server-state]");
  const stateText = state.querySelector("span");
  const playerCount = document.querySelector("[data-player-count]");

  try {
    const response = await fetch(
      "https://api.mcstatus.io/v2/status/bedrock/play.polarsmp.com:15014",
      { cache: "no-store" }
    );
    const server = await response.json();

    if (!server.online) throw new Error("offline");

    state.classList.add("online");
    stateText.textContent = "Server online";
    const online = server.players?.online ?? 0;
    playerCount.textContent = `${online} player${online === 1 ? "" : "s"} online · Whitelist required`;
  } catch {
    state.classList.add("offline");
    stateText.textContent = "Server offline";
    playerCount.textContent = "Whitelist access required";
  }
}

updateServerStatus();
