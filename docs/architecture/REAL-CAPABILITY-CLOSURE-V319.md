# Real Capability Closure — V319

The project previously exposed several APIs that returned FOUNDATION/NOT_IMPLEMENTED responses. V319 replaces those responses with durable implementations.

The release also introduces a reality rule: a sandbox test is evidence of the sandbox implementation, not evidence of production infrastructure. Live checks must report SKIPPED when the dependency is absent and must include an executed receipt when they pass.

No credential, provider secret, or database URL is stored in source control.
