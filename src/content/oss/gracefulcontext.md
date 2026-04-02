---
name: GracefulContext
language: Go
repo: https://github.com/benedictjohannes/gracefulcontext
---
An extension of Go's `context.Context` that includes built-in support for cleanup orchestration and timeouts. It simplifies the management of graceful shutdowns by allowing services to register cleanup functions that are triggered upon context cancellation.
