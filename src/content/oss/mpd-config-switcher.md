---
name: MPD Config Switcher
language: Go
repo: https://github.com/benedictjohannes/mpd-config-switcher
shields:
  - label: Build Status
    img: https://img.shields.io/github/actions/workflow/status/benedictjohannes/mpd-config-switcher/release.yml
    url: https://github.com/benedictjohannes/mpd-config-switcher/releases
---
A Go application with a web GUI for dynamically switching `mpd` configurations. It allows users to toggle between different output modes (e.g., ALSA exclusive vs. Pipewire shared) by concatenating configuration "parts" and restarting the service.
