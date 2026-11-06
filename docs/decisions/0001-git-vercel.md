# ADR-0001 — Private GitHub as the source of truth

**Status:** Accepted (27 October 2026)

- Repository: `radekdomagalski1978-glitch/pamize-synapse`, private.
- Source history is preserved in Git; Vercel publishes built artifacts but is not the source repository.
- `main` is the approved source branch. Implement on short-lived feature branches and review Pull Requests.
- Production deployment after documented review, tests, environment checks and explicit authorization for sensitive changes.
- Use immutable version tags and release notes for production releases.
- Do not store customer data, credentials, tokens or logs with sensitive payloads.
- Keep PAMIZE public marketing site `pamize-site` isolated; avoid attaching `pamize.pl` to Synapse.
