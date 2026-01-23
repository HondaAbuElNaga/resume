#!/usr/bin/env python3
"""
Scan python files under backend/ for third-party imports and append missing
package names to backend/requirements.txt (without pinned versions).

Usage:
    python backend/scripts/generate_requirements.py

This script is a heuristic helper — please review the appended packages
and pin versions before using in production.
"""
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
REQ_FILE = ROOT / "requirements.txt"

IMPORT_RE = re.compile(r'^(?:from\s+([a-zA-Z0-9_\.]+)\s+import|import\s+([a-zA-Z0-9_\.]+))')

# Common stdlib modules to ignore
STDLIB = {
    'os', 'sys', 're', 'json', 'logging', 'subprocess', 'tempfile', 'uuid',
    'pathlib', 'typing', 'datetime', 'time', 'math', 'functools', 'itertools',
    'collections', 'http', 'email', 'unittest', 'inspect'
}


def find_imports(path: Path):
    mods = set()
    for p in path.rglob('*.py'):
        try:
            text = p.read_text(encoding='utf-8')
        except Exception:
            continue
        for line in text.splitlines():
            m = IMPORT_RE.match(line.strip())
            if m:
                name = m.group(1) or m.group(2)
                if not name:
                    continue
                top = name.split('.')[0]
                mods.add(top)
    return mods


def parse_requirements(req_path: Path):
    if not req_path.exists():
        return set()
    names = set()
    for line in req_path.read_text(encoding='utf-8').splitlines():
        line = line.strip()
        if not line or line.startswith('#') or line.startswith('```'):
            continue
        # split on == or >= or <= or ~= or @ or extras
        pkg = re.split(r'[=<>~@\[\]]', line)[0].strip()
        if pkg:
            names.add(pkg.lower())
    return names


def main():
    backend_path = ROOT
    imports = find_imports(backend_path)
    imports = {m for m in imports if m not in STDLIB and not m.startswith('django') and m != Path(__file__).stem}

    existing = parse_requirements(REQ_FILE)

    # map import name -> candidate package name (heuristic: same name)
    missing = sorted([m for m in imports if m.lower() not in existing])

    if not missing:
        print('No missing top-level packages detected.')
        return 0

    print('Detected top-level imports that are not listed in requirements.txt:')
    for m in missing:
        print(' -', m)

    # Append to requirements file as unpinned packages for review
    with REQ_FILE.open('a', encoding='utf-8') as fh:
        fh.write('\n\n# AUTO-ADDED (review and pin versions)\n')
        for m in missing:
            fh.write(f'{m}\n')

    print(f'Appended {len(missing)} packages to {REQ_FILE}. Please review and pin versions.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
