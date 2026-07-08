const addon = require('./index.js');
const { ccy, ccySet } = addon;

describe('Currency (Ccy and CcySet) Native Tools Mapping', () => {

    describe('ccy (Strict Scalar Currency Math)', () => {
        it('Parses string dimension properly and adds strictly', () => {
            const sum = ccy.strictAdd("USD: 100.00: 2dp", "USD: 50.00: 2dp");
            expect(sum).toBe("USD: 150.00: 2dp");
            
            expect(() => { ccy.strictAdd("USD: 100.00: 2dp", "EUR: 20.00: 2dp") }).toThrow();
        });

        it('Calculates Sum Over Array correctly natively', () => {
            const arr = ["USD: 10.00: 2dp", "USD: 5.00: 2dp"];
            const sum = ccy.strictSumOver(arr);
            expect(sum).toBe("USD: 15.00: 2dp");
        });
        
        it('Divide into Installments natively mapped directly out to JS Arrays', () => {
            const outArr = ccy.divideInto("USD: 10.00: 2dp", 3, "LoadFirst");
            expect(outArr).toHaveLength(3);
            expect(outArr[0]).toBe("USD: 3.34: 2dp");
            expect(outArr[1]).toBe("USD: 3.33: 2dp");
            expect(outArr[2]).toBe("USD: 3.33: 2dp");
        });

        it('Sum over products calculates fractions cleanly', () => {
             const items = [
                 { amount: "USD: 100.00: 2dp", multiplier: { value: "0.20", precision: 2 } }, // 20
                 { amount: "USD: 50.00: 2dp", multiplier: { value: "0.40", precision: 2 } }  // 20
             ];
             const sum = ccy.strictSumOverProducts(items);
             expect(sum).toBe("USD: 40.00: 2dp"); // Scale expanded properly to 40 natively!
        });
    });

    describe('ccySet (Grouped Currency Math)', () => {

        it('Bag Division Into Installments (Load First)', () => {
            const premiumLines = [
                "USD: 10.00: 2dp",
                "EUR: 50.00: 2dp"
            ];
    
            const instBags = ccySet.divideInto(premiumLines, 3, "LoadFirst");
            expect(instBags).toHaveLength(3);
            
            // USD 10/3 = 3.33 R 0.01 (Loaded precisely back against element bounds mapping arrays natively!)
            expect(instBags[0].find(i => i.startsWith("USD"))).toBe("USD: 3.34: 2dp");
            expect(instBags[0].find(i => i.startsWith("EUR"))).toBe("EUR: 16.68: 2dp");
    
            expect(instBags[1].find(i => i.startsWith("USD"))).toBe("USD: 3.33: 2dp");
            expect(instBags[2].find(i => i.startsWith("EUR"))).toBe("EUR: 16.66: 2dp");
        });
        
        it('Set Strict Adding sums disparite matching dimensions dynamically', () => {
           let set = ["GBP: 100.00: 2dp", "USD: 10.00: 2dp"];
           
           const added = ccySet.add(set, "USD: 10.00: 2dp");
           expect(added).toHaveLength(2);
           expect(added.find(i => i.startsWith("USD"))).toBe("USD: 20.00: 2dp");
           expect(added.find(i => i.startsWith("GBP"))).toBe("GBP: 100.00: 2dp");
           
           const newCurrency = ccySet.add(added, "EUR: 50.00: 2dp");
           expect(newCurrency).toHaveLength(3);
        });
    });
});
