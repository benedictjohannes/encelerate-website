const languages = {
  Javascript: 'https://img.shields.io/badge/language-JavaScript-F7DF1E?&logo=javascript&logoColor=white',
  Rust: 'https://img.shields.io/badge/language-Rust-dea584?&logo=rust&logoColor=white',
  TypeScript: 'https://img.shields.io/badge/language-TypeScript-3178C6?&logo=typescript&logoColor=white',
  Bash: 'https://img.shields.io/badge/language-Bash-4EAA25?&logo=gnubash&logoColor=white',
  Go: 'https://img.shields.io/badge/language-Go-00ADD8?&logo=go&logoColor=white',
}

export interface Shield {
  label: string;
  img: string;
  url: string;
}

export interface OSSProject {
  name: string;
  language: keyof typeof languages;
  repo: string;
  description: string;
  lastCommit?: string;
  shields?: Shield[];
  repoShortText?: string;
}

export const ossRepoList: OSSProject[] = [
  {
    name: "RAM Sentinel",
    language: "Rust",
    repo: "https://github.com/benedictjohannes/ram-sentinel",
    description: "A surgical memory guardian for Linux desktops. In addition to traditional thresholds, it uses **Pressure Stall Information (PSI)** to surgically target processes (like browser renderer tabs) before they cause a system-wide freeze. It can run as a standard user, and sends notifications of low memory events to the user.",
    shields: [
      {
        label: "Crates.io",
        img: "https://img.shields.io/crates/v/ram-sentinel",
        url: "https://crates.io/crates/ram-sentinel"
      },
      {
        label: "Build Status",
        img: "https://img.shields.io/github/actions/workflow/status/benedictjohannes/ram-sentinel/releases.yml",
        url: "https://github.com/benedictjohannes/ram-sentinel/actions"
      }
    ]
  },
  {
    name: "Quadlets Control Center",
    language: "Bash",
    repo: "https://github.com/benedictjohannes/quadlets-control-center",
    description: "A unified **\"Control Centre\"** template to build your own orchestration with ultimate ease. Ditch the need to remember which command to run or which port to open anymore. It separates application code from deployment-specific \"glue\" using Podman Quadlets, Caddy, and Cloudflare Tunnels, providing a version-controlled repository."
  },
  {
    name: "ComplianceProbe",
    language: "Go",
    repo: "https://github.com/benedictjohannes/ComplianceProbe",
    description: "A cross-platform security compliance reporting agent. It executes automated checks defined in YAML \"playbooks\" to verify system integrity, security configurations, and hardware state. Features embedded JavaScript logic, weighted scoring, and multi-platform support (Linux, Windows, macOS).",
    shields: [
      {
        label: "Build Status",
        img: "https://img.shields.io/github/actions/workflow/status/benedictjohannes/ComplianceProbe/release.yml",
        url: "https://github.com/benedictjohannes/ComplianceProbe/actions"
      }
    ]
  },
  {
    name: "env-config-parse",
    language: "TypeScript",
    repo: "https://github.com/benedictjohannes/env-config-parse",
    description: "A type-safe library that auto-generates `.env.example` files from your schema and validates environment variables at runtime. No need to cast `process.env` directly again, and eliminate *code drift* by making the codebase the single source of truth for configuration requirements.",
    shields: [
      {
        label: "npm version",
        img: "https://img.shields.io/npm/v/env-config-parse.svg",
        url: "https://www.npmjs.com/package/env-config-parse"
      }
    ]
  },
  {
    name: "HTTP Task Runner",
    language: "Go",
    repo: "https://github.com/benedictjohannes/http-task-runner",
    description: "A lightweight, YAML-configured task runner designed for self-hosted CI/CD. It listens for HTTP requests to trigger predefined tasks (like build/deploy scripts) and provides a simple web interface for viewing execution logs (stdout/stderr)."
  },
  {
    name: "PM2 Recover",
    language: "Javascript",
    repo: "https://github.com/benedictjohannes/pm2-recover",
    description: "A utility for reconstructing PM2 process lists after environment changes like NVM switches or OS reinstalls. It \"fixes\" PM2 dumps by stripping absolute binary paths, ensuring processes can be restarted regardless of where Node or other runtimes are installed.",
    shields: [
      {
        label: "npm version",
        img: "https://img.shields.io/npm/v/pm2-recover.svg",
        url: "https://www.npmjs.com/package/pm2-recover"
      }
    ]
  },
  {
    name: "MPD Config Switcher",
    language: "Go",
    repo: "https://github.com/benedictjohannes/mpd-config-switcher",
    description: "A Go application with a web GUI for dynamically switching `mpd` configurations. It allows users to toggle between different output modes (e.g., ALSA exclusive vs. Pipewire shared) by concatenating configuration \"parts\" and restarting the service.",
    shields: [
      {
        label: "Build Status",
        img: "https://img.shields.io/github/actions/workflow/status/benedictjohannes/mpd-config-switcher/release.yml",
        url: "https://github.com/benedictjohannes/mpd-config-switcher/releases"
      }
    ]
  },
  {
    name: "GracefulContext",
    language: "Go",
    repo: "https://github.com/benedictjohannes/gracefulcontext",
    description: "An extension of Go's `context.Context` that includes built-in support for cleanup orchestration and timeouts. It simplifies the management of graceful shutdowns by allowing services to register cleanup functions that are triggered upon context cancellation."
  },
];

export function getLanguageLogo(language: keyof typeof languages): string {
  return languages[language];
}

