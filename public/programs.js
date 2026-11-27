// Programs of the first Stove: list, editor, and its Active Program.
const DAYS = [
  ["mon", "Lun"], ["tue", "Mar"], ["wed", "Mer"], ["thu", "Gio"], ["fri", "Ven"], ["sat", "Sab"], ["sun", "Dom"],
];
const DAY_NAMES = { mon: "lunedì", tue: "martedì", wed: "mercoledì", thu: "giovedì", fri: "venerdì", sat: "sabato", sun: "domenica" };
const FIELDS = [
  ["power", "Potenza", 1, 5],
  ["fan", "Ventola", 0, 6],
  ["waterTemperature", "Temperatura acqua", 55, 80],
];
const FIELD_NAMES = { power: "la potenza", fan: "la ventola", waterTemperature: "la temperatura dell'acqua" };

const section = document.getElementById("programs");
const list = document.getElementById("program-list");
const activeLabel = section.querySelector('[data-testid="active-program"]');
const pauseButton = document.getElementById("pause");
const editor = document.getElementById("program-editor");
const groupsBox = document.getElementById("day-groups");
const errorBox = editor.querySelector('[role="alert"]');

let programs = [];
let active = { programId: null, paused: false };
let editingId = null;
let stoveId = null;

const el = (tag, props = {}, ...children) => {
  const node = Object.assign(document.createElement(tag), props);
  node.append(...children);
  return node;
};

const stovePath = (path) => `/api/stoves/${encodeURIComponent(stoveId)}${path}`;

async function api(method, path, body) {
  const res = await fetch(path, {
    method,
    headers: body === undefined ? {} : { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { ok: res.ok, json: res.status === 204 ? null : await res.json() };
}

function renderList() {
  list.replaceChildren(
    ...programs.map((p) => {
      const item = el("li", {}, el("span", { textContent: p.name }));
      if (p.id === active.programId) item.setAttribute("aria-current", "true");
      else item.append(el("button", { type: "button", textContent: "Attiva", onclick: () => setActive(p.id, false) }));
      item.append(
        el("button", { type: "button", className: "secondary", textContent: "Modifica", onclick: () => openEditor(p) }),
        el("button", { type: "button", className: "secondary", textContent: "Elimina", onclick: () => remove(p) }),
      );
      return item;
    }),
  );
  const current = programs.find((p) => p.id === active.programId);
  activeLabel.textContent = current ? `Attivo: ${current.name}${active.paused ? " (in pausa)" : ""}` : "Nessun programma attivo";
  pauseButton.hidden = !current;
  pauseButton.textContent = active.paused ? "Riprendi" : "Metti in pausa";
}

async function load() {
  programs = (await api("GET", stovePath("/programs"))).json;
  active = (await api("GET", stovePath("/active-program"))).json;
  renderList();
}

async function setActive(programId, paused) {
  const res = await api("PUT", stovePath("/active-program"), { programId, paused });
  if (res.ok) active = res.json;
  renderList();
}

async function remove(program) {
  await api("DELETE", stovePath(`/programs/${program.id}`));
  await load();
}

pauseButton.addEventListener("click", () => setActive(active.programId, !active.paused));

// --- Editor ---

function stepRow(step, index) {
  const action = step.off ? "off" : step.on ? "on" : "set";
  const select = el(
    "select",
    { name: "action" },
    el("option", { value: "on", textContent: "Accendi" }),
    el("option", { value: "off", textContent: "Spegni" }),
    el("option", { value: "set", textContent: "Solo valori" }),
  );
  select.value = action;
  const values = FIELDS.map(([name, label, min, max]) =>
    el("label", {}, label, el("input", { name, type: "number", min, max, step: 1, value: step[name] ?? "" })),
  );
  const syncValues = () => values.forEach((v) => (v.hidden = select.value === "off"));
  select.addEventListener("change", syncValues);
  syncValues();
  const row = el(
    "fieldset",
    { className: "step" },
    el("legend", { textContent: `Passo ${index + 1}` }),
    el("label", {}, "Ora", el("input", { name: "time", type: "time", required: true, value: step.time ?? "" })),
    el("label", {}, "Azione", select),
    ...values,
  );
  row.append(el("button", { type: "button", className: "secondary", textContent: "Togli", onclick: () => { row.remove(); renumber(); } }));
  return row;
}

function groupBox(group, index) {
  const steps = el("div", { className: "steps" });
  group.steps.forEach((s, i) => steps.append(stepRow(s, i)));
  const box = el(
    "fieldset",
    { className: "group" },
    el("legend", { textContent: `Gruppo ${index + 1}` }),
    el(
      "div",
      { className: "days" },
      ...DAYS.map(([day, label]) =>
        el("label", {}, el("input", { type: "checkbox", name: "day", value: day, checked: group.days.includes(day) }), label),
      ),
    ),
    steps,
    el("button", {
      type: "button",
      className: "secondary",
      textContent: "Aggiungi passo",
      onclick: () => steps.append(stepRow({}, steps.children.length)),
    }),
    el("button", { type: "button", className: "secondary", textContent: "Togli gruppo", onclick: () => { box.remove(); renumber(); } }),
  );
  return box;
}

function renumber() {
  [...groupsBox.children].forEach((g, i) => {
    g.querySelector("legend").textContent = `Gruppo ${i + 1}`;
    [...g.querySelector(".steps").children].forEach((s, j) => (s.querySelector("legend").textContent = `Passo ${j + 1}`));
  });
}

function openEditor(program) {
  editingId = program?.id ?? null;
  editor.elements.name.value = program?.name ?? "";
  const groups = program?.dayGroups.length ? program.dayGroups : [{ days: [], steps: [] }];
  groupsBox.replaceChildren(...groups.map(groupBox));
  errorBox.hidden = true;
  editor.hidden = false;
}

function readEditor() {
  return {
    name: editor.elements.name.value,
    dayGroups: [...groupsBox.children].map((g) => ({
      days: [...g.querySelectorAll('input[name="day"]:checked')].map((c) => c.value),
      steps: [...g.querySelector(".steps").children].map((row) => {
        const time = row.querySelector('[name="time"]').value;
        const action = row.querySelector('[name="action"]').value;
        if (action === "off") return { time, off: true };
        const step = { time };
        if (action === "on") step.on = true;
        for (const [name] of FIELDS) {
          const raw = row.querySelector(`[name="${name}"]`).value;
          if (raw !== "") step[name] = Number(raw);
        }
        return step;
      }),
    })),
  };
}

function describe(problem) {
  const at = (a) => `${DAY_NAMES[a.day]} alle ${a.time}`;
  switch (problem.code) {
    case "name_required": return "Dai un nome al programma.";
    case "invalid_day": return "Giorno non valido.";
    case "day_in_two_groups": return `Il ${DAY_NAMES[problem.day]} è in più di un gruppo.`;
    case "invalid_time": return `Gruppo ${problem.group + 1}: un passo non ha un'ora valida.`;
    case "empty_step": return `Gruppo ${problem.group + 1}, ore ${problem.time}: il passo non cambia nulla.`;
    case "off_with_values": return `Gruppo ${problem.group + 1}, ore ${problem.time}: lo spegnimento non prende valori.`;
    case "duplicate_time": return `Gruppo ${problem.group + 1}: due passi alle ${problem.time}.`;
    case "out_of_range":
      return `Gruppo ${problem.group + 1}, ore ${problem.time}: ${FIELD_NAMES[problem.field]} va da ${problem.min} a ${problem.max}.`;
    case "too_close":
      return `Accensione e spegnimento devono distare almeno ${problem.minGap} minuti: ${at(problem.first)} e ${at(problem.second)}.`;
    default: return "Programma non valido.";
  }
}

editor.addEventListener("submit", async (event) => {
  event.preventDefault();
  const body = readEditor();
  const res = editingId === null ? await api("POST", stovePath("/programs"), body) : await api("PUT", stovePath(`/programs/${editingId}`), body);
  if (!res.ok) {
    errorBox.textContent = (res.json.problems ?? [{}]).map(describe).join(" ");
    errorBox.hidden = false;
    return;
  }
  editor.hidden = true;
  await load();
});

document.getElementById("new-program").addEventListener("click", () => openEditor(null));
document.getElementById("add-group").addEventListener("click", () => groupsBox.append(groupBox({ days: [], steps: [] }, groupsBox.children.length)));
document.getElementById("cancel-edit").addEventListener("click", () => (editor.hidden = true));

const stoves = await (await fetch("/api/stoves")).json();
stoveId = stoves[0]?.id ?? null;
if (stoveId) await load();
else section.hidden = true;
