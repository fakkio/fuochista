const form = document.getElementById("login");
const error = document.getElementById("error");

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  error.hidden = true;
  const data = new FormData(form);
  const res = await fetch("/api/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ username: data.get("username"), password: data.get("password") }),
  });
  if (res.ok) location.assign("/");
  else {
    error.textContent = res.status === 429 ? "Troppi tentativi, riprova tra qualche minuto" : "Utente o password non validi";
    error.hidden = false;
  }
});

if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js");
