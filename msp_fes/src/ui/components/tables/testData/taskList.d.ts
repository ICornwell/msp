import { FluxorData } from '../../../renderEngine/fluxor/fluxorData.js';
import { AggregationType } from '../table.js';
export interface Task {
    taskId: string;
    caseId: string;
    taskName: string;
    assignee: string;
    createdDate: Date;
    dueDate: Date;
    priority: 'low' | 'medium' | 'high' | 'critical';
    status: 'pending' | 'in-progress' | 'blocked' | 'completed';
    estimatedHours: number;
    actualHours: number;
    value: number;
}
export type TaskFluxorData = FluxorData<Task>;
export declare const taskAggregationMeta: Record<keyof Task, AggregationType>;
export declare const taskLabels: Record<keyof Task, string>;
export declare const taskTestData: Task[];
