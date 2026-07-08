const addon = require('./index.js');
const { fpStr } = addon;

describe('fpStr Native Tools Mapping', () => {
    it('Parses string scalar properly and adds strictly', () => {
        const sum = fpStr.add("100.00: 2dp", "50.00: 2dp");
        expect(sum).toBe("150.00: 2dp");
    });
    
    it('Divides strictly', () => {
        const div = fpStr.divide("100.00: 2dp", "4.00: 2dp");
        expect(div).toBe("25.00: 2dp");
    });

    it('Divide into Installments', () => {
        const outArr = fpStr.divideInto("10.00: 2dp", 3, "LoadFirst");
        expect(outArr).toHaveLength(3);
        expect(outArr[0]).toBe("3.34: 2dp");
        expect(outArr[1]).toBe("3.33: 2dp");
        expect(outArr[2]).toBe("3.33: 2dp");
    });
});
