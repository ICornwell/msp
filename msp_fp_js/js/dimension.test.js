const addon = require('./index.js');
const { fp, dim, dimSet } = addon;

describe('DimensionedAmount and ConversionContext Native Tools Mapping', () => {

    // -------------------------------------------------------------
    // Namespace: dim 
    // -------------------------------------------------------------
    describe('dim (Strict Dimension Math)', () => {
        it('Strict Addition applies constraints', () => {
            const a = { value: "100.00", precision: 2, dimension: "USD" };
            const b = { value: "50.00", precision: 2, dimension: "USD" };
            const c = { value: "20.00", precision: 2, dimension: "EUR" };
            
            const sum = dim.strictAdd(a, b);
            expect(sum.value).toBe("150.00");
            
            expect(() => { dim.strictAdd(a, c) }).toThrow();
        });

        it('Strict Sum Over Array', () => {
            const items = [
                { value: "10.00", precision: 2, dimension: "USD" },
                { value: "50.00", precision: 2, dimension: "USD" },
                { value: "20.00", precision: 2, dimension: "USD" }
            ];
            
            const sum = dim.strictSumOver(items);
            expect(sum.value).toBe("80.00");
            
            // Fails dynamically from Neon if corrupted array contents
            items.push({ value: "20.00", precision: 2, dimension: "EUR" });
            expect(() => { dim.strictSumOver(items) }).toThrow();
        });

        it('Multiplication by scalar', () => {
            const a = { value: "100.00", precision: 2, dimension: "USD" };
            const m = { value: "1.50", precision: 2 };
            
            const result = dim.multiply(a, m);
            expect(result.value).toBe("150.00");
            expect(result.dimension).toBe("USD");
        });
    });

    // -------------------------------------------------------------
    // Namespace: dimSet
    // -------------------------------------------------------------
    describe('dimSet (Grouped Dimension Math)', () => {

        it('Summing multiple dimensions accurately into explicit Sets', () => {
            const items = [
                { value: "100.00", precision: 2, dimension: "USD" },
                { value: "50.00", precision: 2, dimension: "USD" },
                { value: "20.00", precision: 2, dimension: "EUR" }
            ];
            
            const resultBag = dimSet.sumDimensions(items, "ConvertEarly", ["EUR"], 4, 2);
            
            expect(resultBag.length).toBe(1);
            const finalEur = resultBag.find((r) => r.dimension === "EUR");
            // 150 * 0.85 = 127.50 + 20.00 = 147.50
            expect(finalEur.value).toBe("147.50");
        });

        it('Set Division Into Installments (Load First)', () => {
            const premiumLines = [
                { value: "10.00", precision: 2, dimension: "USD" },
                { value: "50.00", precision: 2, dimension: "EUR" }
            ];
    
            const instBags = dimSet.divideInto(premiumLines, 3, "LoadFirst");
            expect(instBags).toHaveLength(3);
            
            // USD 10/3 = 3.33 R 0.01 (Loaded into exactly element 0 natively holding USD tracking limit)
            expect(instBags[0].find(i => i.dimension === "USD").value).toBe("3.34");
            expect(instBags[0].find(i => i.dimension === "EUR").value).toBe("16.68");
    
            expect(instBags[1].find(i => i.dimension === "USD").value).toBe("3.33");
            expect(instBags[2].find(i => i.dimension === "EUR").value).toBe("16.66");
        });
    });
});
