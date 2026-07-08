// Configuration definition for dynamic UI rendering and robust validation
export interface StrategyConfigParam {
    name: string;
    label: string;
    dataType: 'string' | 'number' | 'boolean' | 'date';
}

// Common shape output by Installment Strategies
export interface CalculatedInstallment {
    dueDate: string;
    amount: string; // fpMoney string
}

export interface InstallmentStrategy {
    strategyName: string;
    getConfigParams(): StrategyConfigParam[];
    calculateInstallments(
        totalPremium: string, // fpMoney string
        inceptionDate: string,
        expiryDate: string,
        config: Record<string, any> // E.g. { dayOfMonth: 15 }
    ): CalculatedInstallment[];
}

export interface CalculatedEarningPeriod {
    periodEndDate: string;
    amountToEarn: string; // fpMoney string
}

export interface EarningStrategy {
    strategyName: string;
    getConfigParams(): StrategyConfigParam[];
    calculateEarnings(
        totalPremium: string, // fpMoney string
        inceptionDate: string,
        expiryDate: string,
        config: Record<string, any> // E.g. { loadMonth: 8 }
    ): CalculatedEarningPeriod[];
}
