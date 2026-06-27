# docgraph

as of 2026/6/27: 
Source Rust files (msp_tech_data/src, .rs): 3305 lines
Test Rust files (msp_tech_data/tests, .rs): 1423 lines
Total (src + tests): 4728 lines

Requires a running instance of Postgres, use:
podman run --name my-postgres -p 5432:5432 -e POSTGRES_PASSWORD=docgraph -e POSTGRES_USER=docgraph -d postgres:18