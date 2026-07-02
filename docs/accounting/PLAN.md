# London Market Technical Accounting Plan

## Outline

Implementing a resilient, graph-backed view of Policy Administration System (PAS) and London Market Technical Account journals and ledgers.
The aim is to represent policies, risk binding, financial movements, premium booking, syndicate splits, and USM processing within `msp_bus_data` through a series of declarative schemas and views.

## Steps

- [x] **Step 1:** Establish this plan.
- [ ] **Step 2:** Define the full list of ledgers and journals. Name them, describe their purpose.
- [ ] **Step 3:** Validate against standard Lloyd's processing and PAS norms. Check for omissions.
- [ ] **Step 4:** Define the exact schemas & objects, classifying Entities (independent lifecycle, strong identity) vs Value Objects (bound lifecycle).
- [ ] **Step 5:** Define relationships and edges (with well-defined directional names).
- [ ] **Step 6:** Identify distinct business operations for "binding" and "booking."
- [ ] **Step 7:** Create data `Views` for each operation containing just enough scope to perform the task.
- [ ] **Step 8:** Write integration tests exercising each operation and edge case.
- [ ] **Step 9:** Draft the orchestrating module to compose operations into business functions.
- [ ] **Step 10:** Test the orchestrating module.
- [ ] **Step 11:** Build React UIs mapping `msp_bus_data` objects to the Render Engine (`UiPlanDSL`).
- [ ] **Step 12:** Handle complex edge cases (e.g. mismatched UMR corrections, partial manual allocations, bad USM linkages).
