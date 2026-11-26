import { describe, expect, it } from "vitest";
import { createCore } from "./core.ts";
import { createFakeCloud } from "../cloud/fake-cloud.ts";
import { createFakeClock } from "../testing/fake-clock.ts";

const MIN = 60_000;

async function setup(stoves = [{ id: "s1", name: "Basement" }]) {
  const clock = createFakeClock(Date.parse("2026-11-27T08:00:00Z"));
  const cloud = createFakeCloud(stoves);
  const core = createCore({ cloud, clock });
  await core.start();
  return { clock, cloud, core };
}

describe("Stove status", () => {
  it("reads every Stove at start-up", async () => {
    const { core, cloud, clock } = await setup();
    expect(cloud.reads("s1")).toBe(1);
    expect(core.stoves()).toEqual([
      {
        id: "s1",
        name: "Basement",
        readAt: clock.now(),
        error: null,
        reading: expect.objectContaining({ state: "off", power: 3, fan: 3, waterSetpoint: 70 }),
      },
    ]);
  });

  it("reads every 5 minutes while the Stove is off", async () => {
    const { cloud, clock } = await setup();
    await clock.advance(5 * MIN - 1);
    expect(cloud.reads("s1")).toBe(1);
    await clock.advance(1);
    expect(cloud.reads("s1")).toBe(2);
    await clock.advance(10 * MIN);
    expect(cloud.reads("s1")).toBe(4);
  });

  it("reads every 2 minutes while the Stove is on", async () => {
    const { cloud, clock } = await setup();
    cloud.setState("s1", { statusCode: 4 });
    await clock.advance(5 * MIN); // the next read finds it on
    expect(cloud.reads("s1")).toBe(2);
    await clock.advance(2 * MIN);
    expect(cloud.reads("s1")).toBe(3);
    await clock.advance(4 * MIN);
    expect(cloud.reads("s1")).toBe(5);
  });

  it("reads every 5 minutes while the Stove is in alarm", async () => {
    const { cloud, clock } = await setup();
    cloud.setState("s1", { statusCode: 10, alarmCode: 4 });
    await clock.advance(5 * MIN);
    await clock.advance(2 * MIN);
    expect(cloud.reads("s1")).toBe(2);
    await clock.advance(3 * MIN);
    expect(cloud.reads("s1")).toBe(3);
  });

  it("reads on demand and restarts the cadence from there", async () => {
    const { core, cloud, clock } = await setup();
    await clock.advance(3 * MIN);
    cloud.setState("s1", { statusCode: 4, power: 5 });
    const view = await core.refresh("s1");
    expect(view.reading?.state).toBe("on");
    expect(view.reading?.power).toBe(5);
    expect(view.readAt).toBe(clock.now());
    expect(cloud.reads("s1")).toBe(2);
    await clock.advance(2 * MIN - 1);
    expect(cloud.reads("s1")).toBe(2);
    await clock.advance(1);
    expect(cloud.reads("s1")).toBe(3);
  });

  it("keeps the last reading and reports the error when the cloud is unreachable", async () => {
    const { core, cloud, clock } = await setup();
    const firstRead = clock.now();
    cloud.setReachable(false);
    await clock.advance(5 * MIN);
    const [view] = core.stoves();
    expect(view.readAt).toBe(firstRead);
    expect(view.reading?.state).toBe("off");
    expect(view.error).toMatch(/unreachable/);
    cloud.setReachable(true);
    await clock.advance(5 * MIN); // keeps trying at the same cadence
    expect(core.stoves()[0].error).toBeNull();
  });

  it("follows two Stoves on one account independently", async () => {
    const { core, cloud, clock } = await setup([
      { id: "s1", name: "Basement" },
      { id: "s2", name: "Cabin" },
    ]);
    cloud.setState("s2", { statusCode: 4 });
    await core.refresh("s2");
    await clock.advance(4 * MIN);
    expect(cloud.reads("s1")).toBe(1);
    expect(cloud.reads("s2")).toBe(4); // start-up, refresh, +2, +4
    expect(core.stoves().map((s) => [s.id, s.reading?.state])).toEqual([
      ["s1", "off"],
      ["s2", "on"],
    ]);
  });

  it("refuses an unknown Stove", async () => {
    const { core } = await setup();
    await expect(core.refresh("nope")).rejects.toThrow(/unknown stove/i);
  });
});
