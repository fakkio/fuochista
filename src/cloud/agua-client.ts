import { CloudError, stateFromCodes, type Cloud, type StoveInfo, type StoveReading } from "./cloud.ts";

/** Klover Home brand settings, verified by the M0 spike (docs/platform.md). */
const API_URL = "https://klover.agua-iot.com";
const CUSTOMER_CODE = "143789";
const BRAND_ID = "1";
const JOB_POLL_INTERVAL_MS = 1000;
const JOB_MAX_POLLS = 10;
/** Refresh the token this long before it expires. */
const TOKEN_MARGIN_S = 60;

export interface AguaClientOptions {
  email: string;
  password: string;
  /** Random id per installation, sent at sign-up and login. */
  appId: string;
  apiUrl?: string;
  fetch?: typeof globalThis.fetch;
  sleep?: (ms: number) => Promise<void>;
}

interface Register {
  reg_key: string;
  offset: number;
  formula: string;
  mask: number;
}

interface Device {
  id_device: string;
  id_product: string;
  name: string;
  registersMapId: string;
  registers?: Map<string, Register>;
}


/** Evaluates a register formula such as `#`, `#/2` or `#+2000` (left to right, `*`/`x`/`/` before `+`/`-`). */
export function evaluateFormula(formula: string, value: number): number {
  const expr = formula.replaceAll(" ", "").replaceAll("#", String(value));
  const terms = expr.match(/[+-]?[^+-]+/g) ?? [];
  let total = 0;
  for (const term of terms) {
    const sign = term.startsWith("-") ? -1 : 1;
    const factors = term.replace(/^[+-]/, "").split(/([x*/])/);
    let product = Number(factors[0]);
    for (let i = 1; i < factors.length; i += 2) {
      const n = Number(factors[i + 1]);
      product = factors[i] === "/" ? product / n : product * n;
    }
    total += sign * product;
  }
  return Math.trunc(total);
}

function tokenExpiry(token: string): number {
  try {
    const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString("utf8"));
    return typeof payload.exp === "number" ? payload.exp : 0;
  } catch {
    return 0;
  }
}

export function createAguaClient(options: AguaClientOptions): Cloud {
  const apiUrl = (options.apiUrl ?? API_URL).replace(/\/$/, "");
  const fetch = options.fetch ?? globalThis.fetch;
  const sleep = options.sleep ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)));

  let token: string | null = null;
  let refreshToken: string | null = null;
  let expiresAt = 0;
  let devices: Map<string, Device> | null = null;

  const baseHeaders = () => ({
    Accept: "application/json, text/javascript, */*; q=0.01",
    "Content-Type": "application/json",
    Origin: "file://",
    id_brand: BRAND_ID,
    customer_code: CUSTOMER_CODE,
  });

  async function post(path: string, body: unknown, headers: Record<string, string>) {
    try {
      return await fetch(apiUrl + path, { method: "POST", headers, body: JSON.stringify(body) });
    } catch (err) {
      throw new CloudError(`cloud unreachable (${path}): ${(err as Error).message}`);
    }
  }

  async function login() {
    const signup = await post(
      "/appSignup",
      {
        phone_type: "Android",
        phone_id: options.appId,
        phone_version: "1.0",
        language: "en",
        id_app: options.appId,
        push_notification_token: options.appId,
        push_notification_active: false,
      },
      baseHeaders(),
    );
    if (signup.status !== 201) throw new CloudError(`app sign-up failed (${signup.status})`);
    const res = await post(
      "/userLogin",
      { email: options.email, password: options.password },
      { ...baseHeaders(), local: "true", Authorization: options.appId },
    );
    if (res.status !== 200) throw new CloudError(`login failed (${res.status})`);
    const json = (await res.json()) as { token: string; refresh_token: string };
    token = json.token;
    refreshToken = json.refresh_token;
    expiresAt = tokenExpiry(token);
  }

  async function refresh() {
    const res = await post("/refreshToken", { refresh_token: refreshToken }, baseHeaders());
    if (res.status !== 201) return login();
    token = ((await res.json()) as { token: string }).token;
    expiresAt = tokenExpiry(token);
  }

  async function ensureToken() {
    if (!token) return login();
    if (Date.now() / 1000 > expiresAt - TOKEN_MARGIN_S) return refresh();
  }

  async function call<T>(method: "GET" | "POST", path: string, body: unknown = {}, retried = false): Promise<T> {
    await ensureToken();
    const headers = { ...baseHeaders(), local: "false", Authorization: token! };
    let res: Response;
    try {
      res = await fetch(apiUrl + path, method === "POST" ? { method, headers, body: JSON.stringify(body) } : { method, headers });
    } catch (err) {
      throw new CloudError(`cloud unreachable (${path}): ${(err as Error).message}`);
    }
    if (res.status === 401 && !retried) {
      await refresh();
      return call(method, path, body, true);
    }
    if (res.status !== 200) throw new CloudError(`${path} failed (${res.status})`);
    return (await res.json()) as T;
  }

  async function loadDevices(): Promise<Map<string, Device>> {
    if (devices) return devices;
    const list = await call<{ device: { id_device: string; id_product: string; name: string }[] }>("POST", "/deviceList");
    const found = new Map<string, Device>();
    for (const d of list.device) {
      const info = await call<{ device_info: { id_registers_map: string }[] }>("POST", "/deviceGetInfo", {
        id_device: d.id_device,
        id_product: d.id_product,
      });
      found.set(d.id_device, {
        id_device: d.id_device,
        id_product: d.id_product,
        name: d.name,
        registersMapId: info.device_info[0].id_registers_map,
      });
    }
    devices = found;
    return found;
  }

  async function device(stoveId: string): Promise<Device> {
    const d = (await loadDevices()).get(stoveId);
    if (!d) throw new CloudError(`unknown stove ${stoveId}`);
    return d;
  }

  /** The register map is static: fetched once per Stove, then cached. */
  async function registers(d: Device): Promise<Map<string, Register>> {
    if (d.registers) return d.registers;
    const res = await call<{ device_registers_map: { registers_map: { id: string; registers: Register[] }[] } }>(
      "POST",
      "/deviceGetRegistersMap",
      { id_device: d.id_device, id_product: d.id_product, last_update: "2018-06-03T08:59:54.043" },
    );
    const map = res.device_registers_map.registers_map.find((m) => m.id === d.registersMapId);
    if (!map) throw new CloudError(`register map ${d.registersMapId} not found`);
    d.registers = new Map(map.registers.map((r) => [r.reg_key, r]));
    return d.registers;
  }

  async function waitForJob(idRequest: string) {
    for (let i = 0; i <= JOB_MAX_POLLS; i++) {
      if (i > 0) await sleep(JOB_POLL_INTERVAL_MS);
      const res = await call<{ jobAnswerStatus: string; jobAnswerData?: { Items: number[]; Values: number[] } }>(
        "GET",
        `/deviceJobStatus/${idRequest}`,
      ).catch(() => null);
      if (res?.jobAnswerStatus === "completed") return res;
    }
    throw new CloudError(`job ${idRequest} did not complete`);
  }

  return {
    async listStoves(): Promise<StoveInfo[]> {
      return [...(await loadDevices()).values()].map((d) => ({ id: d.id_device, name: d.name }));
    },

    async readStatus(stoveId: string): Promise<StoveReading> {
      const d = await device(stoveId);
      const regs = await registers(d);
      const { idRequest } = await call<{ idRequest: string }>("POST", "/deviceGetBufferReading", {
        id_device: d.id_device,
        id_product: d.id_product,
        BufferId: 1,
      });
      const job = await waitForJob(idRequest);
      const data = job.jobAnswerData;
      if (!data) throw new CloudError(`job ${idRequest} returned no data`);
      const raw = new Map(data.Items.map((offset, i) => [offset, data.Values[i]]));
      const value = (key: string) => {
        const r = regs.get(key);
        const v = r && raw.get(r.offset);
        if (r === undefined || v === undefined) throw new CloudError(`register ${key} missing from the read`);
        return evaluateFormula(r.formula, v & r.mask);
      };
      const statusCode = value("status_get");
      const alarmCode = value("alarms_get");
      return {
        state: stateFromCodes(statusCode, alarmCode),
        statusCode,
        alarmCode,
        power: value("power_set"),
        fan: value("vent_front_set"),
        waterSetpoint: value("temp_water_set"),
        waterTemperature: value("temp_water_get"),
      };
    },
  };
}
