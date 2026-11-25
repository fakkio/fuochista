# M0 feasibility spike

Throwaway scripts that check what the Micronova cloud allows for a Klover stove. Findings go in `docs/platform.md`. See issue #1.

## Run

```sh
python -m venv .venv
.venv/Scripts/python -m pip install -r requirements.txt   # Windows; .venv/bin/python elsewhere
cp .env.example .env    # fill in the Klover account credentials
.venv/Scripts/python read.py
```

`read.py` is read-only: one login, one read per device, and the register dump goes to `out/` (local only, git-ignored).

`write.py water` and `write.py fan` are the two controlled writes. Run them only with the stove ON and someone at the panel: each write asks for confirmation, and the script never switches the stove on or off.
