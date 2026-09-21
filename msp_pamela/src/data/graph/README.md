# PAMELA Stage 1

This stage intentionally stays small and reviewable.

It introduces:
- a generic Artefact schema
- a generic Assertion schema that inherits from the Artefact schema
- a generic Relation schema for graph edges
- a repository for persisting and retrieving the graph
- a compact dense fixture for unit testing

This is not a UI or platform integration milestone. It is a model-and-persistence proof.
