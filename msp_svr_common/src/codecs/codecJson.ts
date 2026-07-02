import { getRegisteredJsonCodec } from './jsonCodecs.js';

const CODEC_KEY_PREFIX = '__$codec::';

/**
 * A custom stringify method that inspects the object for classes matched by codecs (or wrapped codec requests)
 * and mutates the serialized payload into a safe boundary envelope.
 */
export function serializeWithCodecs(payload: any): string {
    return JSON.stringify(payload, function replacer(_key: string, value: any) {
        // If the object implements a native toJSON, it will already be evaluated before `replacer` executes.
        // But we want to explicitly envelope our registered class instances.
        if (value && typeof value === 'object') {
            // Because FpMoney and FpDecimal don't inherently have '__codecKey' markers,
            // we could either monkeypatch them, duck-type them, or rely on them explicitly
            // calling out their codec needs natively. 
            // The cleanest approach is duck-typing during serialization, or letting them emit a special marker.
            
            // Standard approach: if the payload author wrapped it ` { __codecKey: 'fpMoney', value: myMoney } `
            // then we serialize using the codec.
            if (value.__codecKey && value.value !== undefined) {
                const codec = getRegisteredJsonCodec(value.__codecKey);
                if (codec) {
                    return `${CODEC_KEY_PREFIX}${value.__codecKey}::${codec.serialize(value.value)}`;
                }
            }
        }
        return value;
    });
}

/**
 * A custom parser that listens for the CODEC_KEY_PREFIX envelope and hydrates
 * them back into class instances through the registered codec maps.
 */
export function deserializeWithCodecs(text: string): any {
    return JSON.parse(text, function reviver(_key: string, value: any) {
        if (typeof value === 'string' && value.startsWith(CODEC_KEY_PREFIX)) {
            const separatorIndex = value.indexOf('::', CODEC_KEY_PREFIX.length);
            if (separatorIndex !== -1) {
                const codecKey = value.substring(CODEC_KEY_PREFIX.length, separatorIndex);
                const stringPayload = value.substring(separatorIndex + 2);
                
                const codec = getRegisteredJsonCodec(codecKey);
                if (codec) {
                    return codec.deserialize(stringPayload);
                }
            }
        }
        return value;
    });
}
