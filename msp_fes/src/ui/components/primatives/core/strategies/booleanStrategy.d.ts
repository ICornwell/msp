/**
 * Boolean Strategy
 *
 * Features:
 * - Configurable text representation (Yes/No, True/False, On/Off, etc.)
 * - Checkbox or toggle adornment
 * - Center alignment
 */
import { InputStrategy } from '../inputStrategies';
export interface BooleanStrategyOptions {
    /** Text labels for true/false/undefined states */
    labels?: {
        true: string;
        false: string;
        undefined?: string;
    };
    /** Control type: checkbox, toggle switch, or icon */
    controlType?: 'checkbox' | 'toggle' | 'icon';
    /** Allow tri-state (true/false/undefined) */
    allowIndeterminate?: boolean;
}
export declare function createBooleanStrategy(options?: BooleanStrategyOptions): InputStrategy<boolean | undefined>;
export default createBooleanStrategy;
