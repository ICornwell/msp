// Instead of relying on raw strings scattered everywhere or passing (string, precision)
// pairs to standard JS methods, we wrap msp_fp_js in a strongly typed TS class to provide
// safe chaining and guaranteed precision retention.

// Load the compiled Rust library
// eslint-disable-next-line @typescript-eslint/no-var-requires
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const fp = require('msp_fp_js'); // This is the compiled Rust Neon module


/**
 * A TypeScript wrapper for the underlying Rust FixedDecimal Neon module.
 * Provides a fluent, type-safe API for financial calculations.
 */
export class FpDecimal {
    private readonly value: string;
    private readonly precision: number;

    /**
     * Private constructor. Use the static `from` method to instantiate.
     */
    private constructor(value: string, precision: number) {
        this.value = value;
        this.precision = precision;
    }

    /**
     * Create a new FixedDecimal. Automatically formats & validates the string through Rust.
     */
    static from(value: string | number, precision: number): FpDecimal {
        const strVal = typeof value === 'number' ? value.toString() : value;
        // This validates the string format via the Rust bridge
        const formatted = fp.createFixedDecimal(strVal, precision);
        return new FpDecimal(formatted, precision);
    }

    /**
     * Parse a formatted string like '123.678 : 3dp' or '123.678' back into an FpDecimal.
     */
    static fromString(formatted: string): FpDecimal {
        if (!formatted || formatted.trim() === '') {
            throw new Error(`Cannot parse empty string into FpDecimal`);
        }
        
        const parts = formatted.split(':').map(p => p.trim());
        const amountStr = parts[0];
        
        // Detect precision
        let precision: number;
        if (parts.length > 1) {
            const dpPart = parts[1].toLowerCase();
            if (!dpPart.endsWith('dp')) {
                throw new Error(`Invalid precision format. Expected 'Xdp', got '${parts[1]}' in string '${formatted}'`);
            }
            precision = parseInt(dpPart.replace('dp', ''), 10);
            if (isNaN(precision)) {
                throw new Error(`Cannot parse precision '${dpPart}' in string '${formatted}'`);
            }
        } else {
            // Implicit precision based on decimal places if no ':' is found
            const decimalSplit = amountStr.split('.');
            precision = decimalSplit.length > 1 ? decimalSplit[1].length : 0;
        }

        // Validate the explicitly declared precision matches the decimal string length
        const decimalSplit = amountStr.split('.');
        const actualDecimals = decimalSplit.length > 1 ? decimalSplit[1].length : 0;
        if (actualDecimals > precision) {
            throw new Error(`Declared precision ${precision}dp is too small for actual value '${amountStr}'`);
        }

        return FpDecimal.from(amountStr, precision);
    }

    /**
     * Add another FpDecimal to this one. Both must have the exact same precision.
     */
    add(other: FpDecimal): FpDecimal {
        this.ensureMatchingPrecision(other);
        const result = fp.add(this.value, this.precision, other.value, other.precision);
        return new FpDecimal(result, this.precision);
    }

    /**
     * Subtract another FpDecimal from this one. Both must have the exact same precision.
     */
    subtract(other: FpDecimal): FpDecimal {
        this.ensureMatchingPrecision(other);
        const result = fp.subtract(this.value, this.precision, other.value, other.precision);
        return new FpDecimal(result, this.precision);
    }

    /**
     * Multiply this FpDecimal by another. 
     * Result inherits the precision of the current instance unless cast differently.
     */
    multiply(other: FpDecimal): FpDecimal {
        const result = fp.multiply(this.value, this.precision, other.value, other.precision);
        return new FpDecimal(result, this.precision);
    }

    /**
     * Divide this FpDecimal by another.
     * Result inherits the precision of the current instance unless cast differently.
     */
    divide(other: FpDecimal): FpDecimal {
        const result = fp.divide(this.value, this.precision, other.value, other.precision);
        return new FpDecimal(result, this.precision);
    }

    /**
     * Safely returns the string representation.
     */
    toString(): string {
        return `${this.value} : ${this.precision}dp`;
    }

    /**
     * Revert to the raw value without the ` : Xdp` suffix if needed.
     */
    toRawString(): string {
        return this.value;
    }

    /**
     * Expose internal precision level.
     */
    getPrecision(): number {
        return this.precision;
    }

    private ensureMatchingPrecision(other: FpDecimal) {
        if (this.precision !== other.precision) {
            throw new Error(`Precision mismatch: Cannot operate on precisions ${this.precision} and ${other.precision}`);
        }
    }
}

