import { currencyCode } from "./currencyCodes";

export type MoneyType = { currency: currencyCode; amount: number };

export class Money {
  constructor(public value: string) {}

  public static fromString(value: string): Money {
    return new Money(value);
  }
}