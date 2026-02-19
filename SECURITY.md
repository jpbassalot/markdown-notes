# Security Policy

## Auditing dependencies

Run a production-only audit (what ships in the static build):

```bash
npm run audit:prod
```

Run a full audit including dev dependencies:

```bash
npm audit
```

### Production vs development dependencies

This project generates a **fully static site** — no Node.js runtime ships to users.
Only `dependencies` in `package.json` are used at build time to produce HTML/CSS/JS;
`devDependencies` (eslint, vitest, etc.) are only used on developer machines.

Because of this, the security-critical audit is `npm run audit:prod`. Findings
limited to devDependencies do not affect end users.

### Fixing vulnerabilities

1. **`npm audit fix`** — applies non-breaking fixes (safe to run anytime).
2. **`npm audit fix --force`** — applies fixes that may include breaking major-version
   bumps. Test thoroughly after running (`npm test && npm run lint`).
3. **npm overrides** — if a transitive dependency is vulnerable and the direct
   dependency hasn't released a fix yet, add an
   [`overrides`](https://docs.npmjs.com/cli/v10/configuring-npm/package-json#overrides)
   entry in `package.json` to force a patched version. Only do this when the patched
   version is API-compatible:
   ```json
   "overrides": {
     "vulnerable-package": ">=fixed.version"
   }
   ```
4. **Accept and document** — if a vulnerability only affects devDependencies and
   the upstream hasn't released a compatible fix, document it in the
   [Accepted risks](#accepted-risks) section below and revisit periodically.

## Accepted risks

<!-- Update this section whenever you run npm audit and find unfixable findings. -->

**Last reviewed: 2026-02-19**

| Advisory | Package | Severity | Affected tree | Notes |
|----------|---------|----------|---------------|-------|
| [GHSA-2g4f-4pwh-qvx6](https://github.com/advisories/GHSA-2g4f-4pwh-qvx6) | ajv <8.18.0 | Moderate | eslint (dev) | ReDoS via `$data` option. eslint does not use `$data`; no practical exploit in local linting. No fix available within ajv 6.x (eslint's required major). |
| [GHSA-3ppc-4f35-3m26](https://github.com/advisories/GHSA-3ppc-4f35-3m26) | minimatch <10.2.1 | High | eslint, eslint-plugin-import, eslint-plugin-react, eslint-plugin-jsx-a11y, @typescript-eslint (all dev) | ReDoS via crafted glob patterns. Only processes local file paths during linting; no user-supplied input. No fix in minimatch 3.x/9.x; 10.x has incompatible API. |

**Mitigation**: Both findings are confined to the eslint dev toolchain and have no
path to production. The static output (`out/`) contains no Node.js runtime. These
will be resolved when upstream packages release compatible updates.

## Reporting a vulnerability

If you discover a security issue in this project's own code, please open an issue
or contact the maintainer directly.
