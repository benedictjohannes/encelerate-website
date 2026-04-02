---
name: env-config-parse
language: TypeScript
repo: https://github.com/benedictjohannes/env-config-parse
shields:
  - label: npm version
    img: https://img.shields.io/npm/v/env-config-parse.svg
    url: https://www.npmjs.com/package/env-config-parse
---
A type-safe library that auto-generates `.env.example` files from your schema and validates environment variables at runtime. No need to cast `process.env` directly again, and eliminate *code drift* by making the codebase the single source of truth for configuration requirements.
