import { Policy, Syndicate, Broker, Money, Installment } from './data/schemas.js';

/**
 * Valid distinct business operations that relate to 'binding' and 'booking'
 * on the London Market via London Market Messages (e.g. USM, SCM).
 */
export const BusinessOperations = {
  /**
   * BIND_RISK: The initial creation or binding of an insurance policy.
   * This operation establishes the root Policy entity and connects the primary
   * counterparties (Syndicates, Brokers) as nodes. Before a risk can have
   * premiums mapped against it, it must first be bound.
   */
  BIND_RISK: 'BIND_RISK',

  /**
   * BOOK_PREMIUM: The technical accounting operation where a premium
   * or premium installment is assigned to a bound risk. This attaches an
   * `Installment` entity or `Money` object to the `Policy`, usually via
   * schedule definitions and due dates.
   */
  BOOK_PREMIUM: 'BOOK_PREMIUM',

  /**
   * APPLY_MARKET_SIGNINGS: Validates and assigns Market Share representations
   * against the Syndicates on a risk. In London Market, multiple syndicates
   * subscribe to a portion of the risk (e.g., 20% to Syndicate 1234, 80% to 5678).
   */
  APPLY_MARKET_SIGNINGS: 'APPLY_MARKET_SIGNINGS',

  /**
   * SETTLE_PREMIUM: Applies a cash-ledger Settlement record from a Broker
   * towards an outstanding booked premium on a Policy. It records a movement
   * satisfying an installment due.
   */
  SETTLE_PREMIUM: 'SETTLE_PREMIUM',

  /**
   * BIND_ENDORSEMENT: Modifies the original bound risk during its lifecycle
   * via an endorsement (e.g. AP/RP - Additional Premium / Return Premium).
   * This might change line sizes or terms.
   */
  BIND_ENDORSEMENT: 'BIND_ENDORSEMENT'
} as const;

export type BusinessOperation = keyof typeof BusinessOperations;
