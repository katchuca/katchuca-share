#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
install_agent_desktop.py
Instalador e Validador determinístico do agent-desktop (Vercel Labs, Apache-2.0)
para uso opcional em projetos desktop pelo time de engenharia (OpenMausBot, OpenBot,
Paperclip, Grok Bot e runtimes compatíveis).

Versão fixada canônica: 1.2.0
"""

import sys
import shutil
import platform
import subprocess

PINNED_AGENT_DESKTOP_VERSION = "1.2.0"

if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass


def check_cli_installed():
    bin_path = shutil.which("agent-desktop")
    if not bin_path and platform.system() == "Windows":
        bin_path = shutil.which("agent-desktop.cmd")
    return bin_path


def get_installed_version():
    try:
        res = subprocess.run(
            "agent-desktop --version",
            shell=True,
            capture_output=True,
            text=True,
            encoding="utf-8",
        )
        if res.returncode == 0 and res.stdout.strip():
            return res.stdout.strip().split()[-1]
    except Exception:
        pass
    return None


def install_via_npm(version=PINNED_AGENT_DESKTOP_VERSION):
    npm_path = shutil.which("npm")
    if not npm_path and platform.system() == "Windows":
        npm_path = shutil.which("npm.cmd")
    if not npm_path:
        print("[-] npm não encontrado no PATH. Pré-requisito: Node.js 18+.")
        return False

    pkg_spec = f"agent-desktop@{version}"
    print(f"[*] Instalando deterministicamente '{pkg_spec}' via npm...")
    try:
        res = subprocess.run(
            [npm_path, "install", "-g", pkg_spec],
            capture_output=True,
            text=True,
            encoding="utf-8",
            shell=(platform.system() == "Windows"),
        )
        if res.returncode == 0:
            print(f"[+] '{pkg_spec}' instalado com sucesso.")
            return True
        print(f"[-] Erro no npm install: {res.stderr.strip() or res.stdout.strip()}")
        return False
    except Exception as exc:
        print(f"[-] Falha na instalação via npm: {exc}")
        return False


def main():
    print("============================================================")
    print(f" VALIDADOR DO MOTOR AGENT-DESKTOP (v{PINNED_AGENT_DESKTOP_VERSION})")
    print("============================================================")
    bin_path = check_cli_installed()
    version = get_installed_version() if bin_path else None
    if bin_path and version == PINNED_AGENT_DESKTOP_VERSION:
        print(f"[+] agent-desktop v{version} já está pronto em: {bin_path}")
    else:
        if not install_via_npm(PINNED_AGENT_DESKTOP_VERSION):
            sys.exit(1)
        version = get_installed_version()
        if version != PINNED_AGENT_DESKTOP_VERSION:
            print(f"[-] Versão detectada ({version}) difere da fixada ({PINNED_AGENT_DESKTOP_VERSION}).")
            sys.exit(1)

    res = subprocess.run(
        "agent-desktop status",
        shell=True,
        capture_output=True,
        text=True,
        encoding="utf-8",
    )
    print(res.stdout.strip() or res.stderr.strip())


if __name__ == "__main__":
    main()
