---
name: PM2 Recover
language: Javascript
repo: https://github.com/benedictjohannes/pm2-recover
shields:
  - label: npm version
    img: https://img.shields.io/npm/v/pm2-recover.svg
    url: https://www.npmjs.com/package/pm2-recover
---
A utility for reconstructing PM2 process lists after environment changes like NVM switches or OS reinstalls. It "fixes" PM2 dumps by stripping absolute binary paths, ensuring processes can be restarted regardless of where Node or other runtimes are installed.
