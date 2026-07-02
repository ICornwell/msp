// money as an extenion of FpDeciamal, with a currency code. This is the canonical representation of money in the system.
import { FpDecimal } from './fpDecimal.js';
import { CurrencyCode } from 'msp_common';


/**
 * A strongly typed Money class matching the string format:
 * 'USD : 45.452 : 3dp'
 */
export class FpMoney {
    private readonly ccy: CurrencyCode;
    private readonly amount: FpDecimal;

    constructor(ccy: CurrencyCode, amount: FpDecimal) {
        this.ccy = ccy;
        this.amount = amount;
    }

    /**
     * Parse from string format 'USD : 45.452 : 3dp'
     */
    static fromString(formatted: string): FpMoney {
        if (!formatted || formatted.trim() === '') {
            throw new Error(`Cannot parse empty string into FpMoney`);
        }
        
        const parts = formatted.split(':').map(p => p.trim());
        if (parts.length < 2) {
             throw new Error(`Invalid money format ${formatted}. Expected at least 'CCY : AMOUNT'`);
        }

        const ccyPart = parts[0] as CurrencyCode;
        
        // Re-join the rest for FpDecimal parsing
        const decPart = parts.slice(1).join(' : ');
        const amount = FpDecimal.fromString(decPart);

        return new FpMoney(ccyPart, amount);
    }

    toString(): string {
        return `${this.ccy} : ${this.amount.toString()}`;
    }

    getCurrency(): CurrencyCode {
        return this.ccy;
    }

    getAmount(): FpDecimal {
        return this.amount;
    }

    /**
     * Add another FpDecimal to this one. Both must have the exact same precision.
     */
    add(other: FpMoney): FpMoney {
        this.ensureMatchingCcy(other);
        const result = new FpMoney(this.ccy, this.amount.add(other.amount));
        return result;
    }

    /**
     * Subtract another FpDecimal from this one. Both must have the exact same precision.
     */
    subtract(other: FpMoney): FpMoney {
        this.ensureMatchingCcy(other);
        const result = new FpMoney(this.ccy, this.amount.subtract(other.amount));
        return result;
    }

    /**
     * Multiply this FpDecimal by another. 
     * Result inherits the precision of the current instance unless cast differently.
     */
    multiply(multiplier: FpDecimal): FpMoney {
        const result = new FpMoney(this.ccy, this.amount.multiply(multiplier));
        return result;
    }

    /**
     * Divide this FpDecimal by another.
     * Result inherits the precision of the current instance unless cast differently.
     */
    divide(divisor: FpDecimal): FpMoney {
        const result = new FpMoney(this.ccy, this.amount.divide(divisor));
        return result;
    }

    /**
     * Calculate the percentage of this FpDecimal.
     * Result inherits the precision of the current instance unless cast differently.
     */
    percentageOf(percent: FpDecimal): FpMoney {
        const result = new FpMoney(this.ccy, this.amount.multiply(percent).divide(FpDecimal.from(100,this.amount.getPrecision())));
        return result;
    }

    private ensureMatchingCcy(other: FpMoney) {
        if (this.ccy !== other.ccy) {
            throw new Error(`Currency mismatch: Cannot operate on different currencies ${this.ccy} and ${other.ccy}`);
        }
    }

}
