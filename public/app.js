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

if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js");
