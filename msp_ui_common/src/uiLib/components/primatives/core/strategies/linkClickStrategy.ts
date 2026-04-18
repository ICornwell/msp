/**
 * LinkClick Strategy
 *
 * Makes a UniversalInput cell render as a clickable link.
 * On click, raises a 'LinkClick' UIEvent with:
 *   { linkName: string, viewDataIdentifier: string }
 *
 * The linkName is configured at plan-build time (passed as a hint or directly
 * to the factory). The viewDataIdentifier is the current cell value at click time.
 *
 * Usage in a table column:
 *   strategyRegistry.registerStrategy(
 *     buildStrategyKey('link', 'readonly', ['work-item-detail']),
 *     linkClickStrategyFactory({ linkName: 'work-item-detail' })
 *   );
 *
 * Or directly on a UniversalInput:
 *   <UniversalInput strategy={linkClickStrategyFactory({ linkName: 'work-item-detail' })} ... />
 *
 * Wire up in a Behaviour:
 *   .whenEventRaised('LinkClick')
 *     .whenEventSatisfies(e => e.payload.linkName === 'work-item-detail')
 *     .dispatch.toPresentation
 *       .openTab('WorkItemDetailTab', e => ({ id: e.payload.viewDataIdentifier }))
 *     .end()
 */


import { eventTypes } from '../../../../contexts/eventTypes.js';
import { LinkClickEvent } from '../../../../events/uiEvents.js';
import {
  InputStrategy,
  ClickActionStrategy,
  AlignmentStrategy,
  FormatterStrategy,
  StrategyContext,
  StrategyFactory,
  strategyRegistry,
  buildStrategyKey,
} from '../inputStrategies.js';

// ============================================================================
// Options
// ============================================================================

export interface LinkClickStrategyOptions {
  /** Logical link name — matched in Behaviour .whenEventSatisfies() */
  linkName: string;
}

// ============================================================================
// Factory
// ============================================================================

export function linkClickStrategyFactory(options: LinkClickStrategyOptions): InputStrategy<string> {
  const { linkName } = options;

  const alignment: AlignmentStrategy = {
    getAlignment: () => 'left',
  };

  const formatter: FormatterStrategy = {
    format: (value: unknown, _ctx: StrategyContext) => String(value ?? ''),
  };

  const clickAction: ClickActionStrategy = {
    getClickEvent: (value: unknown, _ctx: StrategyContext) => {
      const viewDataIdentifier = String(value ?? '');
      if (!viewDataIdentifier) return undefined;
      return createLinkClickEvent(linkName, viewDataIdentifier);
    },
  };

  return { alignment, formatter, clickAction };
}

function createLinkClickEvent(linkName: string, viewDataIdentifier: string): LinkClickEvent {
  return {
    messageType: eventTypes.Navigation.ITEM_CLICK,
    payload: { linkName, viewDataIdentifier },
    timestamp: Date.now(),
  };
}

// ============================================================================
// Factory registration
// ============================================================================

/**
 * Register the link strategy factory against the 'clickAction' data type.
 * After calling this, you can use:
 *   strategyRegistry.getByType('link', 'readonly', ['my-link-name'])
 * and the linkName hint will be extracted automatically.
 */
export function registerLinkClickStrategy(): void {
  const factory: StrategyFactory<LinkClickStrategyOptions, string> = (options) =>
    linkClickStrategyFactory(options ?? { linkName: 'link' });

  strategyRegistry.registerFactory('clickAction' as any, (rawOptions: any) => {
    // The hint 'linkName' is passed as-is from hintsToOptions in inputStrategies.ts
    // but link names are arbitrary strings, so we use the first unrecognised hint
    // as the linkName when options.linkName is not present.
    const linkName: string = rawOptions?.linkName ?? rawOptions?.link ?? 'link';
    return factory({ linkName });
  });
}

// ============================================================================
// Convenience: pre-built strategy for a given linkName
// ============================================================================

/**
 * Register and retrieve a link strategy for a specific linkName.
 * Caches under the key "link:readonly:<linkName>".
 */
export function getLinkClickStrategy(linkName: string): InputStrategy<string> {
  const key = buildStrategyKey('clickAction' as any, 'readonly', [linkName]);
  if (!strategyRegistry.has(key)) {
    strategyRegistry.registerStrategy(key, linkClickStrategyFactory({ linkName }));
  }
  return strategyRegistry.get(key);
}
