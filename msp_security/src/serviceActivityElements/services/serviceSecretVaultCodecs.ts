import { registerJsonCodecs } from 'msp_data_common';

// NOTE: These codecs use standard JSON.stringify/JSON.parse behaviour and are
// functionally identical to the default dgm SDK fallback. They are registered
// here purely as a reference example showing how the codec registration system
// works for schemas that *do* require custom serialisation (e.g. encryption,
// binary encoding, or non-standard data shapes where the default codec would be
// insufficient). Remove the explicit jsonCodecKey from the schema definitions
// and delete this file if you decide the default behaviour is sufficient.

export const vaultCodecs = registerJsonCodecs({
  'security.vault.metadata.v1': {
    serialize: (value) => JSON.stringify(value),
    deserialize: (text) => JSON.parse(text as string),
  },
  'security.vault.index.keys.v1': {
    serialize: (value) => JSON.stringify(value),
    deserialize: (text) => JSON.parse(text as string),
  },
});
