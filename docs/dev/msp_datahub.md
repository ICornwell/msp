# MSP Platform — msp_datahub

_April 2026_

DataHub is the data minimisation boundary. Custom Service Modules never
receive un-minimised data — DataHub sits between them and Custom Data Modules.

---

## Responsibilities

- Receive data requests from ServiceHub (never directly from Service Modules)
- Apply the requesting module's declared minimisation policy
- Apply the declared redaction policy
- Execute the request against the appropriate Custom Data Module
- Return only the minimised, redacted result

---

## Data flow

```
Custom Service Module
       │  (via ServiceHub)
       ▼
  ServiceHub  ──►  DataHub
                      │  1. identify minimisation policy (from manifest)
                      │  2. identify redaction policy (from manifest)
                      │  3. call Custom Data Module
                      │  4. apply minimisation + redaction to result
                      ▼
              minimised result  ──►  back to ServiceHub  ──►  Service Module
```

The Service Module never touches raw data. What it cannot see, it cannot leak.

---

## Minimisation and redaction DSLs

Policies are declared in the module's manifest as DSL blocks (planned):
- **Minimisation**: which fields are included in the response for a given
  request type and Work context
- **Redaction**: which field values are masked or replaced for a given
  Actor classification

Both are deterministic functions — the same policy + same input always
produces the same output. This is required for forensic audit reproducibility
(see [../security/RGAM.md](../security/RGAM.md)).

---

## Custom Data Module pattern

A Custom Data Module:
- Implements data access for a specific domain (e.g. policy records, claims)
- Is called exclusively by DataHub
- Returns raw results to DataHub (minimisation/redaction happens in DataHub)
- Never exposes itself externally

---

## Development

Build: `yarn workspace msp_datahub run build`
Start: `yarn workspace msp_datahub run start`
Test: `yarn workspace msp_datahub run test`

Source: `src/`
Built output: `distApi/` and `build/`
