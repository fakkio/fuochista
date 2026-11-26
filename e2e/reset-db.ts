// Deletes the e2e database so every run starts from a fresh file.
import { rmSync } from "node:fs";

for (const suffix of ["", "-wal", "-shm"]) rmSync(`test-results/e2e.db${suffix}`, { force: true });
