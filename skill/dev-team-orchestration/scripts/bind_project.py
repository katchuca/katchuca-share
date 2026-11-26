#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
bind_project.py — Dev Team Installation v3.0.0
Provisionador universal de equipe de 7 especialistas sobre Slice Orchestration Governor v8.3.0.
Suporta OpenMausBot, OpenBot, Paperclip, Grok Bot / OpenClaw e runtimes genéricos.
"""

import argparse
import hashlib
import json
import os
import shutil
import subprocess
import sys

if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

ROLES_SPEC = [
    {
        "key": "tech_lead",
        "slug": "tech-lead",
        "soul_file": "01_tech_lead_soul.md",
        "role_name": "Tech Lead & Coordenador",
        "title": "Líder de Engenharia (Chief)",
        "paperclip_role": "cto",
        "reports_to": None,
        "chief": True,
        "read_only": False,
        "can_edit_code": False,
        "mascot_body": "star",
        "color": "yellow",
        "capabilities": ["orchestration", "slicing", "risk-routing", "hawd", "tracking"],
    },
    {
        "key": "architect",
        "slug": "architect",
        "soul_file": "02_architect_soul.md",
        "role_name": "Arquiteto de Software",
        "title": "Arquiteto de Sistemas (Spec)",
        "paperclip_role": "architect",
        "reports_to": "tech-lead",
        "chief": False,
        "read_only": True,
        "can_edit_code": False,
        "mascot_body": "hexagon",
        "color": "teal",
        "capabilities": ["c4-spec", "contracts", "schemas", "adr"],
    },
    {
        "key": "builder",
        "slug": "builder",
        "soul_file": "03_builder_soul.md",
        "role_name": "Builder (Implementação)",
        "title": "Engenheiro de Código (Builder)",
        "paperclip_role": "engineer",
        "reports_to": "tech-lead",
        "chief": False,
        "read_only": False,
        "can_edit_code": True,
        "mascot_body": "squircle",
        "color": "coral",
        "capabilities": ["backend", "red-green", "simplify-pass", "test-integrity"],
    },
    {
        "key": "ui_ux",
        "slug": "ui-ux",
        "soul_file": "04_ui_ux_soul.md",
        "role_name": "UI/UX & Design System",
        "title": "Especialista em Interface & UX",
        "paperclip_role": "designer",
        "reports_to": "tech-lead",
        "chief": False,
        "read_only": False,
        "can_edit_code": False,
        "mascot_body": "diamond",
        "color": "green",
        "capabilities": ["design-taste", "anti-pill", "agy-ux-v2", "accessibility"],
    },
    {
        "key": "frontend",
        "slug": "frontend",
        "soul_file": "05_frontend_soul.md",
        "role_name": "Frontend & Componentes",
        "title": "Especialista em Frontend & Interação",
        "paperclip_role": "engineer",
        "reports_to": "tech-lead",
        "chief": False,
        "read_only": False,
        "can_edit_code": True,
        "mascot_body": "capsule",
        "color": "blue",
        "capabilities": ["frontend", "ui-states", "motion", "design-lint"],
    },
    {
        "key": "qa",
        "slug": "qa",
        "soul_file": "06_qa_soul.md",
        "role_name": "QA & Validação Real",
        "title": "Engenheiro de QA (QA)",
        "paperclip_role": "qa",
        "reports_to": "tech-lead",
        "chief": False,
        "read_only": False,
        "can_edit_code": False,
        "mascot_body": "circle",
        "color": "red",
        "capabilities": ["q-runner", "playwright", "chrome-devtools", "self-repair", "agent-desktop"],
    },
    {
        "key": "gate_auditor",
        "slug": "gate-auditor",
        "soul_file": "07_gate_auditor_soul.md",
        "role_name": "Auditor de Portões (Gate Auditor)",
        "title": "Auditor de Governança & Reviewer",
        "paperclip_role": "reviewer",
        "reports_to": "tech-lead",
        "chief": False,
        "read_only": True,
        "can_edit_code": False,
        "mascot_body": "shield",
        "color": "orange",
        "capabilities": ["read-only-review", "stride-owasp", "handoff-verify", "agy-ux-v2"],
    },
]

PLATFORM_LABELS = {
    "openmausbot": ("OpenMausBot", "coordinate_bots / propose_team_setup"),
    "openbot": ("OpenBot", "coordinate_bots / team_setup"),
    "paperclip": ("Paperclip", "delegação hierárquica (Reports to / Execution Policy)"),
    "grok-bot": ("Grok Bot / OpenClaw", "despacho de subagentes ou roteamento por papel"),
    "generic": ("Agentes Genéricos (CLI / MCP)", "subagentes isolados / pipeline orquestrado"),
}


def norm_posix(p):
    return os.path.abspath(p).replace("\\", "/")


def read_text(path):
    with open(path, "r", encoding="utf-8") as f:
        return f.read()


def write_text(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)


def yaml_escape_block(text, indent=2):
    pad = " " * indent
    return "\n".join(pad + line for line in text.rstrip().splitlines())


def run_node(args, cwd):
    node = shutil.which("node")
    if not node:
        return None, "node_not_found"
    res = subprocess.run(
        [node] + args,
        cwd=cwd,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
    )
    return res, None


def verify_checksums(target_dir, sums_file):
    if not os.path.exists(sums_file) or not os.path.exists(target_dir):
        return False
    try:
        for line in read_text(sums_file).splitlines():
            line = line.strip()
            if not line:
                continue
            parts = line.split(None, 1)
            if len(parts) != 2:
                continue
            expected, rel = parts[0], parts[1].lstrip("*").strip().replace("\\", "/")
            fpath = os.path.join(target_dir, rel.replace("/", os.sep))
            if not os.path.isfile(fpath):
                return False
            with open(fpath, "rb") as fh:
                actual = hashlib.sha256(fh.read()).hexdigest()
            if actual != expected:
                return False
        return True
    except Exception:
        return False


def detect_lifecycle(project_path, requested):
    if requested in ("greenfield", "brownfield"):
        return requested.upper()
    ignore = {".git", ".slices", ".agents", ".agy-vault", ".agy-backups", ".scratch", "node_modules"}
    if not os.path.exists(project_path):
        return "GREENFIELD"
    for entry in os.listdir(project_path):
        if entry in ignore:
            continue
        if entry in ("package.json", "pyproject.toml", "Cargo.toml", "go.mod", "src", "app", "lib"):
            return "BROWNFIELD"
    entries = [e for e in os.listdir(project_path) if e not in ignore]
    return "BROWNFIELD" if len(entries) >= 3 else "GREENFIELD"


def sync_global_slice_v83(pack_root, force=False):
    gov_pkg = os.path.join(pack_root, "core-engines", "slice-orchestration-governor")
    install_mjs = os.path.join(gov_pkg, "scripts", "install.mjs")
    home = os.path.expanduser("~")
    global_target = os.path.join(home, ".gemini", "config", "skills", "slice-orchestration-governor")
    target_ver_file = os.path.join(global_target, "VERSION")
    pkg_ver = read_text(os.path.join(gov_pkg, "VERSION")).strip()
    cur_ver = read_text(target_ver_file).strip() if os.path.exists(target_ver_file) else None
    pkg_sums = os.path.join(gov_pkg, "SHA256SUMS.txt")

    if not force and cur_ver == pkg_ver and verify_checksums(global_target, pkg_sums):
        print(f"[+] Motor global slice-orchestration-governor v{pkg_ver} verificado (SHA-256) em: {norm_posix(global_target)}")
        return global_target

    if shutil.which("node") and os.path.exists(install_mjs):
        res, _ = run_node([install_mjs, "--global-only", "--non-interactive", "--skip-self-test"], cwd=gov_pkg)
        if res and res.returncode == 0:
            print(f"[+] Motor global slice-orchestration-governor v{pkg_ver} instalado em: {norm_posix(global_target)}")
            return global_target
        print("[!] Aviso: install.mjs --global-only retornou erro; copiando com preservação de backup.")

    if os.path.exists(global_target):
        backup_dir = os.path.join(home, ".gemini", "backups", "skills", "slice-orchestration-governor-prev")
        if os.path.exists(backup_dir):
            shutil.rmtree(backup_dir)
        os.makedirs(os.path.dirname(backup_dir), exist_ok=True)
        shutil.move(global_target, backup_dir)
    shutil.copytree(gov_pkg, global_target)
    print(f"[+] Motor global sincronizado em: {norm_posix(global_target)}")
    return global_target


def sync_companion_skills(pack_root, force=False):
    home = os.path.expanduser("~")
    skills_root = os.path.join(home, ".gemini", "config", "skills")
    os.makedirs(skills_root, exist_ok=True)
    for skill_name in ("craft-design", "cinematic-site-components"):
        src = os.path.join(pack_root, "core-engines", skill_name)
        dst = os.path.join(skills_root, skill_name)
        if not os.path.exists(src):
            continue
        if os.path.exists(dst):
            if not force:
                print(f"[-] Skill complementar já presente em {norm_posix(dst)} (preservada).")
                continue
            shutil.rmtree(dst)
        shutil.copytree(src, dst)
        print(f"[+] Skill complementar sincronizada em: {norm_posix(dst)}")


def ensure_product_constitution_and_docs(pack_root, project_name, project_path, lifecycle):
    tpl_dir = os.path.join(pack_root, "templates", "project-binding")
    agents_path = os.path.join(project_path, "AGENTS.md")
    tpl_agents = (
        read_text(os.path.join(tpl_dir, "AGENTS.md"))
        .replace("{{PROJECT_NAME}}", project_name)
        .replace("{{PROJECT_ROOT}}", norm_posix(project_path))
    )
    bootstrap_marker = "<!-- AGYBOT_BOOTSTRAP:START -->"

    if not os.path.exists(agents_path):
        write_text(agents_path, tpl_agents + "\n")
        print("[+] Criado AGENTS.md com Constituição do Produto.")
    else:
        existing = read_text(agents_path)
        if bootstrap_marker in existing and existing.lstrip().startswith(bootstrap_marker):
            write_text(agents_path, tpl_agents.rstrip() + "\n\n" + existing.lstrip())
            print("[+] Constituição do Produto adicionada acima do AGYBOT_BOOTSTRAP em AGENTS.md.")
        else:
            print("[-] AGENTS.md existente preservado acima do AGYBOT_BOOTSTRAP.")

    design_dst = os.path.join(project_path, "DESIGN.md")
    if not os.path.exists(design_dst):
        tpl_design = read_text(os.path.join(tpl_dir, "DESIGN.md")).replace("{{PROJECT_NAME}}", project_name)
        write_text(design_dst, tpl_design)
        print("[+] Criado DESIGN.md.")
    else:
        print("[-] DESIGN.md existente preservado.")

    if lifecycle == "GREENFIELD":
        for rel in ("docs/SPEC.md", "docs/ARCHITECTURE_C4.md", "docs/ROADMAP.md"):
            dst = os.path.join(project_path, rel.replace("/", os.sep))
            if not os.path.exists(dst):
                content = (
                    read_text(os.path.join(tpl_dir, rel.replace("/", os.sep)))
                    .replace("{{PROJECT_NAME}}", project_name)
                    .replace("{{PROJECT_ROOT}}", norm_posix(project_path))
                )
                write_text(dst, content)
                print(f"[+] Criado documento Greenfield: {rel}")


def bind_v83_project(global_gov, project_path, lifecycle, args):
    install_mjs = os.path.join(global_gov, "scripts", "install.mjs")
    if not shutil.which("node"):
        print("[-] Node.js não encontrado no PATH; execute `node <global>/scripts/install.mjs --bind-only --bind-project <path>` depois.")
        return False

    res, _ = run_node(
        [install_mjs, "--bind-only", "--bind-project", project_path, "--non-interactive", "--enable-qualified-auto"],
        cwd=project_path,
    )
    if res and res.returncode == 0:
        print("[+] Projeto vinculado ao Slice Orchestration Governor v8.3.0 (Zero-Shadow + .slices/ forwarders + .agents/hooks.json).")
    else:
        msg = (res.stderr or res.stdout or "").strip() if res else "unknown"
        print(f"[!] Aviso ao vincular com install.mjs: {msg}")
        return False

    agybot_mjs = os.path.join(project_path, ".slices", "agybot.mjs")
    if not os.path.exists(agybot_mjs):
        return True

    cfg_path = os.path.join(project_path, ".slices", "SLICE_GOVERNOR.json")
    should_setup = (not args.skip_setup) and (not os.path.exists(cfg_path) or args.reconfigure)
    if should_setup:
        setup_args = [
            agybot_mjs,
            "setup",
            "--autonomy", args.autonomy,
            "--swarm", "QUALIFIED_AUTO",
            "--transport", "NATIVE_SUBAGENTS",
            "--vault-mode", "PROJECT_LOCAL",
            "--visual", args.visual,
            "--browser-mode", args.browser_mode,
        ]
        if args.tracking_mode != "auto":
            setup_args.extend(["--tracking-mode", args.tracking_mode])
        spec_path = os.path.join(project_path, "docs", "SPEC.md")
        if lifecycle == "GREENFIELD" and os.path.exists(spec_path):
            setup_args.extend(["--canonical-source", "docs/SPEC.md", "--canonical-source-id", "SPEC-PRIMARY"])
        res_setup, _ = run_node(setup_args, cwd=project_path)
        if res_setup and res_setup.returncode == 0:
            print("[+] Setup v8.3.0 inicializado (.slices/SLICE_GOVERNOR.json, .agy-vault/, TODO.md, CHANGELOG.md, MASTER_SLICE_CHECKLIST.md).")
        else:
            msg = (res_setup.stderr or res_setup.stdout or "").strip() if res_setup else "unknown"
            print(f"[!] Aviso em `agybot setup`: {msg}")
    else:
        res_vault, _ = run_node([agybot_mjs, "vault-init"], cwd=project_path)
        if res_vault and res_vault.returncode == 0:
            print("[+] .agy-vault/ verificada e atualizada.")

    spec_path = os.path.join(project_path, "docs", "SPEC.md")
    if lifecycle == "GREENFIELD" and os.path.exists(spec_path) and os.path.exists(cfg_path):
        res_src, _ = run_node(
            [agybot_mjs, "source-register", "--id", "SPEC-PRIMARY", "--ref", "docs/SPEC.md", "--persistence", "LIVING"],
            cwd=project_path,
        )
        if res_src and res_src.returncode == 0:
            print("[+] Fonte canônica `SPEC-PRIMARY` (`docs/SPEC.md`, LIVING) registrada no Governor.")

    res_taste, _ = run_node([agybot_mjs, "design-taste-init"], cwd=project_path)
    if res_taste and res_taste.returncode == 0:
        print("[+] .slices/DESIGN_TASTE.md inicializado (Anti-Pill U1/U9/U26).")
    return True


def render_roles(pack_root, project_name, project_path, team_name, platform_label, coord_channel):
    roles_dir = os.path.join(pack_root, "roles")
    root_posix = norm_posix(project_path)
    rendered = []
    for spec in ROLES_SPEC:
        raw = read_text(os.path.join(roles_dir, spec["soul_file"]))
        soul = (
            raw.replace("{{PROJECT_NAME}}", project_name)
            .replace("{{PROJECT_ROOT}}", root_posix)
            .replace("{{TEAM_NAME}}", team_name)
            .replace("{{PLATFORM_NAME}}", platform_label)
            .replace("{{COORDINATION_CHANNEL}}", coord_channel)
        )
        rendered.append((spec, soul))
    return rendered


def emit_adapters(pack_root, project_name, project_path, team_name, lifecycle, args):
    adapters_dir = os.path.join(project_path, ".slices", "team-adapters")
    os.makedirs(adapters_dir, exist_ok=True)
    root_posix = norm_posix(project_path)
    selected = (
        ["openmausbot", "openbot", "paperclip", "grok-bot", "generic"]
        if args.platform == "all"
        else [args.platform]
    )

    canonical_roles = render_roles(
        pack_root, project_name, project_path, team_name,
        "Ambiente Agêntico Compatível", "orquestração nativa do ambiente"
    )
    canonical = {
        "schemaVersion": "dev-team-installation/3.0.0",
        "governor": "slice-orchestration-governor@8.3.0",
        "projectName": project_name,
        "projectRoot": root_posix,
        "teamName": team_name,
        "lifecycle": lifecycle,
        "skills": [
            "slice-orchestration-governor",
            "craft-design",
            "cinematic-site-components",
        ],
        "roles": [
            {
                "key": spec["key"],
                "slug": spec["slug"],
                "name": f"{team_name} · {spec['role_name']}",
                "title": spec["title"],
                "isCoordinator": spec["chief"],
                "reportsTo": spec["reports_to"],
                "readOnly": spec["read_only"],
                "canEditCode": spec["can_edit_code"],
                "visual": {"mascotBody": spec["mascot_body"], "color": spec["color"]},
                "capabilities": spec["capabilities"],
                "instructions": soul,
            }
            for spec, soul in canonical_roles
        ],
    }
    write_text(os.path.join(adapters_dir, "team_spec.canonical.json"), json.dumps(canonical, indent=2, ensure_ascii=False) + "\n")

    model_sel = {}
    if args.instance_id:
        model_sel["instanceId"] = args.instance_id
    if args.model:
        model_sel["model"] = args.model
    if not model_sel:
        model_sel = None

    if "openmausbot" in selected:
        plat_name, coord = PLATFORM_LABELS["openmausbot"]
        roles = render_roles(pack_root, project_name, project_path, team_name, plat_name, coord)
        ops = []
        for spec, soul in roles:
            fields = {
                "name": f"{team_name} · {spec['role_name']}",
                "title": spec["title"],
                "section": team_name,
                "chiefOfStaff": spec["chief"],
                "mascotBody": spec["mascot_body"],
                "color": spec["color"],
                "cwd": project_path,
                "soul": soul,
            }
            if model_sel:
                fields["modelSelection"] = model_sel
            ops.append({"action": "create", "key": spec["key"], "fields": fields})
        payload = {
            "platform": "openmausbot",
            "note": "Aplicar com propose_team_setup após validar modelos disponíveis via list_team_setup.",
            "newTeams": [team_name],
            "reason": f"Criar equipe autônoma v3.0.0 (Governor v8.3.0) para {project_name}",
            "operations": ops,
        }
        write_text(os.path.join(adapters_dir, "openmausbot.propose_team_setup.json"), json.dumps(payload, indent=2, ensure_ascii=False) + "\n")

    if "openbot" in selected:
        plat_name, coord = PLATFORM_LABELS["openbot"]
        roles = render_roles(pack_root, project_name, project_path, team_name, plat_name, coord)
        openbot_spec = {
            "platform": "openbot",
            "teamName": team_name,
            "projectRoot": root_posix,
            "governorVersion": "8.3.0",
            "bots": [
                {
                    "id": spec["slug"],
                    "name": f"{team_name} · {spec['role_name']}",
                    "title": spec["title"],
                    "department": team_name,
                    "chiefOfStaff": spec["chief"],
                    "mascotBody": spec["mascot_body"],
                    "color": spec["color"],
                    "cwd": root_posix,
                    **({"modelSelection": model_sel} if model_sel else {}),
                    "instructions": soul,
                }
                for spec, soul in roles
            ],
        }
        write_text(os.path.join(adapters_dir, "openbot.team_setup.json"), json.dumps(openbot_spec, indent=2, ensure_ascii=False) + "\n")

    if "paperclip" in selected:
        plat_name, coord = PLATFORM_LABELS["paperclip"]
        roles = render_roles(pack_root, project_name, project_path, team_name, plat_name, coord)
        pc_agents_dir = os.path.join(adapters_dir, "paperclip_agents")
        os.makedirs(pc_agents_dir, exist_ok=True)
        runtime_adapter = args.adapter_runtime or "auto"
        pack_lines = [
            'schemaVersion: "paperclip-team-pack/v1"',
            f'name: "{team_name}"',
            f'projectName: "{project_name}"',
            f'projectRoot: "{root_posix}"',
            'governor: "slice-orchestration-governor@8.3.0"',
            "executionPolicy:",
            "  reviewStage:",
            "    enabled: true",
            '    reviewers: ["qa", "gate-auditor"]',
            "  approvalStage:",
            "    enabled: true",
            '    approver: "human-board"',
            "workspaces:",
            "  isolatedWorktrees: true",
            "agents:",
        ]
        for spec, soul in roles:
            reports_line = f'"{spec["reports_to"]}"' if spec["reports_to"] else "null"
            agent_yaml = "\n".join([
                f'slug: "{spec["slug"]}"',
                f'name: "{spec["role_name"]}"',
                f'title: "{spec["title"]}"',
                f'role: "{spec["paperclip_role"]}"',
                f'department: "{team_name}"',
                f"reportsTo: {reports_line}",
                f'adapter: "{runtime_adapter}"',
                f'cwd: "{root_posix}"',
                f'isolatedWorkspaces: {"true" if spec["can_edit_code"] else "false"}',
                "skills:",
                '  - "slice-orchestration-governor"',
                '  - "craft-design"',
                '  - "cinematic-site-components"',
                "instructions: |",
                yaml_escape_block(soul, indent=2),
                "",
            ])
            write_text(os.path.join(pc_agents_dir, f"{spec['slug']}.yaml"), agent_yaml)
            pack_lines.extend([
                f'  - slug: "{spec["slug"]}"',
                f'    name: "{spec["role_name"]}"',
                f'    role: "{spec["paperclip_role"]}"',
                f"    reportsTo: {reports_line}",
                f'    adapter: "{runtime_adapter}"',
                f'    configFile: "paperclip_agents/{spec["slug"]}.yaml"',
            ])
        write_text(os.path.join(adapters_dir, "paperclip.company_pack.yaml"), "\n".join(pack_lines) + "\n")

    if "grok-bot" in selected:
        plat_name, coord = PLATFORM_LABELS["grok-bot"]
        roles = render_roles(pack_root, project_name, project_path, team_name, plat_name, coord)
        grok_spec = {
            "platform": "grok-bot",
            "teamName": team_name,
            "projectRoot": root_posix,
            "governor": "slice-orchestration-governor@8.3.0",
            "defaultModel": args.model or "grok-4.7",
            "routing": {
                "coordinator": "tech-lead",
                "classes": {
                    "A": ["builder", "gate-auditor"],
                    "B": ["architect", "builder", "frontend", "qa", "gate-auditor"],
                    "C_D": ["architect", "builder", "ui-ux", "frontend", "qa", "gate-auditor"],
                },
            },
            "agents": [
                {
                    "id": spec["slug"],
                    "name": spec["role_name"],
                    "title": spec["title"],
                    "coordinator": spec["chief"],
                    "readOnly": spec["read_only"],
                    "systemPrompt": soul,
                }
                for spec, soul in roles
            ],
        }
        write_text(os.path.join(adapters_dir, "grok-bot.team.json"), json.dumps(grok_spec, indent=2, ensure_ascii=False) + "\n")

    if "generic" in selected or args.platform == "all":
        plat_name, coord = PLATFORM_LABELS["generic"]
        roles = render_roles(pack_root, project_name, project_path, team_name, plat_name, coord)
        md_parts = [
            f"# {team_name} — Prompts dos Especialistas (v3.0.0 / Governor v8.3.0)\n",
            f"- Projeto: **{project_name}** (`{root_posix}`)",
            f"- Ciclo de vida detectado: `{lifecycle}`\n",
        ]
        for spec, soul in roles:
            md_parts.append(f"---\n\n## {spec['role_name']} (`{spec['slug']}`)\n\n{soul.strip()}\n")
        write_text(os.path.join(adapters_dir, "generic-agents.md"), "\n".join(md_parts))

    return adapters_dir


def main():
    parser = argparse.ArgumentParser(description="Vincula equipe de dev universal v3.0.0 (Slice Governor v8.3.0) a um projeto.")
    parser.add_argument("--project-name", required=True, help="Nome do projeto (ex: MeuProjeto)")
    parser.add_argument("--project-path", required=True, help="Caminho absoluto da raiz do projeto")
    parser.add_argument("--platform", default="all", choices=["all", "openmausbot", "openbot", "paperclip", "grok-bot", "generic"], help="Plataforma alvo dos adaptadores")
    parser.add_argument("--lifecycle", default="auto", choices=["auto", "greenfield", "brownfield"], help="Modo de ciclo de vida")
    parser.add_argument("--team-name", default=None, help="Nome da equipe (padrão: '<PROJECT_NAME> Devs')")
    parser.add_argument("--model", default=None, help="Modelo padrão opcional para os agentes")
    parser.add_argument("--instance-id", default=None, help="ID de instância/provedor opcional (OpenMausBot/OpenBot)")
    parser.add_argument("--adapter-runtime", default="auto", help="Runtime de execução Paperclip (codex, claude_local, opencode, grok, gemini, process, auto)")
    parser.add_argument("--autonomy", default="AUTONOMY_FIRST", choices=["AUTONOMY_FIRST", "BALANCED", "OWNER_GUIDED"], help="Política de autonomia inicial do v8.3.0")
    parser.add_argument("--visual", default="HYBRID", choices=["HUMAN_MANUAL", "HYBRID", "AUTOMATED_FOCUSED"], help="Política de aceitação visual")
    parser.add_argument("--browser-mode", default="CHROME_DEVTOOLS_OR_PLAYWRIGHT", choices=["CHROME_DEVTOOLS_OR_PLAYWRIGHT", "CHROME_DEVTOOLS", "PLAYWRIGHT_HEADLESS", "MANUAL_ONLY"], help="Modo de verificação de navegador")
    parser.add_argument("--tracking-mode", default="auto", choices=["auto", "GOVERNOR_MANAGED", "PROJECT_OWN_DOCS"], help="Modo de tracking (TODO/CHANGELOG/MASTER)")
    parser.add_argument("--skip-setup", action="store_true", help="Pular `agybot setup` automático (deixar onboarding para `/grill-me`)")
    parser.add_argument("--reconfigure", action="store_true", help="Reaplicar `agybot setup` mesmo se já houver SLICE_GOVERNOR.json")
    parser.add_argument("--skip-global-sync", action="store_true", help="Não instalar/atualizar o motor global em ~/.gemini/config/skills/")
    parser.add_argument("--force-global-sync", action="store_true", help="Forçar reinstalação do motor global mesmo se SHA-256 bater")
    parser.add_argument("--sync-companions", action="store_true", help="Sincronizar também craft-design e cinematic-site-components em ~/.gemini/config/skills/")
    args = parser.parse_args()

    project_path = os.path.abspath(args.project_path)
    os.makedirs(project_path, exist_ok=True)
    team_name = args.team_name or f"{args.project_name} Devs"
    pack_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    lifecycle = detect_lifecycle(project_path, args.lifecycle)

    print(f"[*] Projeto: {args.project_name} ({norm_posix(project_path)}) | Ciclo: {lifecycle} | Plataforma: {args.platform}")

    ensure_product_constitution_and_docs(pack_root, args.project_name, project_path, lifecycle)

    if not args.skip_global_sync:
        global_gov = sync_global_slice_v83(pack_root, force=args.force_global_sync)
        if args.sync_companions:
            sync_companion_skills(pack_root, force=args.force_global_sync)
        bind_v83_project(global_gov, project_path, lifecycle, args)
    else:
        global_gov = os.path.join(os.path.expanduser("~"), ".gemini", "config", "skills", "slice-orchestration-governor")
        if os.path.exists(global_gov):
            bind_v83_project(global_gov, project_path, lifecycle, args)

    adapters_dir = emit_adapters(pack_root, args.project_name, project_path, team_name, lifecycle, args)

    print(f"[+] Adaptadores multiplataforma gerados em: {norm_posix(adapters_dir)}")
    print("[*] Vínculo v3.0.0 concluído com sucesso.")


if __name__ == "__main__":
    main()
