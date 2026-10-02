# TRUST V258 — Reality Capability Evidence Resolution

V258 adds a conservative forensic resolver for the 58 capability contracts compiled in V257.

## Contract

Each capability is evaluated against four layers:

1. authoritative evidence fields already authored in the contract;
2. implementation artifact discovery;
3. runtime-marker discovery;
4. regression-test discovery.

Discovery is explicitly non-authoritative. A lexical match can produce a candidate, but it cannot become proof or promotion evidence.

## Outcome

The current V257 contracts contain no authoritative implementation/runtime/test fields by design. Therefore V258 resolves the 58 capabilities as discovery `PARTIAL` records rather than promoting them.

- 58 capability contracts inspected.
- 58 have implementation candidates.
- 58 have runtime/test discovery candidates.
- 0 promoted.
- 0 claims silently converted from documentation to proof.

The next authoring step must replace discovery candidates with exact evidence references and executable tests.
