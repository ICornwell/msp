export type JsonCodec = {
  serialize: (value: unknown) => string;
  deserialize: (text: string) => unknown;
};

export type NamedCodec<N extends string> = Record<N, JsonCodec>;
export type JsonCodecMap = NamedCodec<string>;

// Extracts the union of all codec name keys from a concrete codec map type.
export type AllCodecNames<Cs extends JsonCodecMap> = keyof Cs & string;

const registeredJsonCodecs = new Map<string, JsonCodec>();

export function registerJsonCodec<const Name extends string>(name: Name, codec: JsonCodec): Name {
  const key = name.trim();
  if (!key) {
    throw new Error('registerJsonCodec requires a non-empty codec name.');
  }

  registeredJsonCodecs.set(key, codec);
  return name;
}

export function registerJsonCodecs<const Codecs extends JsonCodecMap>(codecs: Codecs) {
  const names = {} as { [K in AllCodecNames<Codecs>]: K };

  for (const [codecName, codec] of Object.entries(codecs) as Array<[AllCodecNames<Codecs>, JsonCodec]>) {
    registerJsonCodec(codecName, codec);
    names[codecName] = codecName;
  }

  return {
    names,
  };
}

export function getRegisteredJsonCodec<const Key extends string>(codecKey: Key): JsonCodec | undefined {
  return registeredJsonCodecs.get(codecKey);
}

// Returns a typed names object for a codec map defined elsewhere, without registering anything.
export function getCodecNames<const Codecs extends JsonCodecMap>(codecs: Codecs): { names: { [K in AllCodecNames<Codecs>]: K } } {
  const names = {} as { [K in AllCodecNames<Codecs>]: K };
  for (const codecName of Object.keys(codecs) as Array<AllCodecNames<Codecs>>) {
    names[codecName] = codecName;
  }
  return { names };
}
