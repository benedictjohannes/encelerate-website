---
name: RAM Sentinel
language: Rust
repo: https://github.com/benedictjohannes/ram-sentinel
shields:
  - label: Crates.io
    img: https://img.shields.io/crates/v/ram-sentinel
    url: https://crates.io/crates/ram-sentinel
  - label: Build Status
    img: https://img.shields.io/github/actions/workflow/status/benedictjohannes/ram-sentinel/releases.yml
    url: https://github.com/benedictjohannes/ram-sentinel/actions
---
A surgical memory guardian for Linux desktops. In addition to traditional thresholds, it uses **Pressure Stall Information (PSI)** to surgically target processes (like browser renderer tabs) before they cause a system-wide freeze. It can run as a standard user, and sends notifications of low memory events to the user.
