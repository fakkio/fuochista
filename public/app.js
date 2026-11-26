const res = await fetch("/api/me");
if (!res.ok) {
  location.assign("/login");
  throw new Error("not logged in");
}
const { username } = await res.json();
document.getElementById("greeting").textContent = username;

document.getElementById("logout").addEventListener("click", async () => {
  await fetch("/api/logout", { method: "POST" });
  location.assign("/login");
});

const STATE_LABELS = {
  off: "Spenta",
  starting: "In accensione",
  on: "Accesa",
  shutting_down: "In spegnimento",
  alarm: "In allarme",
  unknown: "Stato sconosciuto",
};

const section = document.getElementById("stove");
const field = (id) => section.querySelector(`[data-testid="${id}"]`);
const refreshButton = document.getElementById("refresh");
let stoveId = null;

function render(stove) {
  const show = (value, unit = "") => (value === null ? "–" : `${value}${unit}`);
  field("state").textContent = stove.state ? STATE_LABELS[stove.state] : "Non ancora letta";
  field("state").dataset.state = stove.state ?? "";
  field("power").textContent = show(stove.power);
  field("fan").textContent = show(stove.fan);
  field("water-setpoint").textContent = show(stove.waterSetpoint, " °C");
  field("water-temperature").textContent = show(stove.waterTemperature, " °C");
  field("read-at").textContent = stove.readAt ? new Date(stove.readAt).toLocaleTimeString("it-IT") : "–";
  const error = field("error");
  error.hidden = !stove.error;
  error.textContent = stove.error ? "Il cloud non risponde: lo stato mostrato potrebbe non essere aggiornato." : "";
}

async function refresh() {
  if (!stoveId) return;
  refreshButton.disabled = true;
  try {
    const res = await fetch(`/api/stoves/${encodeURIComponent(stoveId)}/refresh`, { method: "POST" });
    if (res.ok) render(await res.json());
  } finally {
    refreshButton.disabled = false;
  }
}

refreshButton.addEventListener("click", refresh);

// Show the last known status at once, then read the Stove fresh (the UI shows the first Stove).
const stoves = await (await fetch("/api/stoves")).json();
if (stoves.length > 0) {
  stoveId = stoves[0].id;
  render(stoves[0]);
  refresh();
} else {
  field("state").textContent = "Nessuna stufa trovata";
}

if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js");
