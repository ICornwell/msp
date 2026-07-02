import { FpDecimal } from '../data/fpDecimal.js';
import { FpMoney } from '../data/fpMoney.js';
import { registerJsonCodec } from './jsonCodecs.js';

/**
 * Registers the standard financial precision codecs to the global codec registry.
 * Once registered, `serializeWithCodecs` and `deserializeWithCodecs` will automatically 
 * recognize and transform wire payloads matching these shapes.
 */
export function registerFinancialCodecs() {
    registerJsonCodec('fpDecimal', {
        serialize: (value: unknown): string => {
            if (value instanceof FpDecimal) {
                return value.toString();
            }
            throw new Error(`Invalid serialization attempt for fpDecimal codec. Got type: ${typeof value}`);
        },
        deserialize: (text: string): unknown => {
            return FpDecimal.fromString(text);
        }
    });

    registerJsonCodec('fpMoney', {
        serialize: (value: unknown): string => {
            if (value instanceof FpMoney) {
                return (value as FpMoney).toString();
            }
            throw new Error(`Invalid serialization attempt for fpMoney codec. Got type: ${typeof value}`);
        },
        deserialize: (text: string): unknown => {
            return FpMoney.fromString(text);
        }
    });
}
