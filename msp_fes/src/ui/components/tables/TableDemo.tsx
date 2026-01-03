import { 
  AggregationType, 
  RangeStyle,
  CellRendererProps, 
  TableConfig
} from './table';
import Table from './table';
import { 
  vehicleTestData, 
  Vehicle,
} from './testData/vehicleList';
import { vehicleFluxorData } from './testData';
import { 
  taskTestData, 
  Task,
} from './testData/taskList';
import { FluxorData } from '../../renderEngine/fluxor/fluxorData';
import { taskFluxorData } from './TableDemoLayouts';

// ============================================
// Custom Cell Renderers
// ============================================

// Money renderer - formats as currency
function MoneyRenderer({ value }: CellRendererProps<any, number>) {
  return (
    <span style={{ fontFamily: 'monospace', textAlign: 'right', display: 'block' }}>
      ${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
    </span>
  );
}

// Modifier renderer - shows deviation from 1.0
function ModifierRenderer({ value }: CellRendererProps<any, number>) {
  const deviation = value - 1.0;
  const color = deviation > 0.1 ? '#d32f2f' : deviation < -0.1 ? '#2e7d32' : '#666';
  return (
    <span style={{ fontFamily: 'monospace', color, fontWeight: Math.abs(deviation) > 0.1 ? 'bold' : 'normal' }}>
      {value.toFixed(2)}
    </span>
  );
}

// Priority badge renderer
function PriorityRenderer({ value }: CellRendererProps<FluxorData<Task>, Task['priority']>) {
  const colors: Record<Task['priority'], string> = {
    low: '#90caf9',
    medium: '#ffb74d',
    high: '#ef5350',
    critical: '#c62828'
  };
  return (
    <span style={{ 
      backgroundColor: colors[value], 
      padding: '2px 8px', 
      borderRadius: '4px',
      color: value === 'critical' ? 'white' : 'black',
      fontSize: '12px',
      textTransform: 'uppercase'
    }}>
      {value}
    </span>
  );
}

// Status badge renderer
function StatusRenderer({ value }: CellRendererProps<FluxorData<Task>, Task['status']>) {
  const colors: Record<Task['status'], string> = {
    pending: '#9e9e9e',
    'in-progress': '#42a5f5',
    completed: '#66bb6a',
    blocked: '#ef5350'
  };
  return (
    <span style={{ 
      backgroundColor: colors[value], 
      padding: '2px 8px', 
      borderRadius: '4px',
      color: 'white',
      fontSize: '12px'
    }}>
      {value}
    </span>
  );
}

// ============================================
// Demo: Vehicle Table with Fluent API
// ============================================

/**
 * This demonstrates the fluent table API with:
 * - Type-safe column accessors (s => s.propertyName)
 * - Custom renderers for different value types
 * - Aggregation semantics
 * - Sorting and filtering enabled
 */
export function VehicleTableDemo() {
  return (
    <div style={{ padding: '20px' }}>
      <h2>Vehicle Fleet - Fluent Table API Demo</h2>
      <p>Demonstrating type-safe column definition with <code>s =&gt; s.property</code> syntax</p>
      
      {/* 
        The fluent API in action!
        
        In a full ReUiPlan, this would be:
        
        .showingItem
          .fromComponentElement(TableComponent)
            .forDataType<Vehicle>()
            .withColumns()
              .column(s => s.registration).withHeader('Reg').pinned('left')
              .column(s => s.type).withHeader('Type').sortable()
              ...
            .endColumns
          .end
        
        For now, we'll build the config manually to test the component
      */}
      
      <VehicleTableWithConfig />
    </div>
  );
}

// Build a table with manually constructed config (simulating what the builder creates)
function VehicleTableWithConfig() {
  // This is what the builder would create:
  const tableConfig: TableConfig<FluxorData<Vehicle>> = {
    orientation: 'rows-horizontal' as const,
    columns: [
      { 
        id: 'registration', 
        accessorKey: 'registration' as keyof Vehicle,
        accessorFn: (v: Vehicle) => v.registration,
        header: 'Registration',
        pin: 'left' as const,
        sortable: true,
      },
      { 
        id: 'type', 
        accessorKey: 'type' as keyof Vehicle,
        accessorFn: (v: Vehicle) => v.type,
        header: 'Type',
        sortable: true,
        filterable: true,
      },
      { 
        id: 'use', 
        accessorKey: 'use' as keyof Vehicle,
        accessorFn: (v: Vehicle) => v.use,
        header: 'Use',
        sortable: true,
      },
      { 
        id: 'make', 
        accessorKey: 'make' as keyof Vehicle,
        accessorFn: (v: Vehicle) => v.make,
        header: 'Make',
        sortable: true,
      },
      { 
        id: 'model', 
        accessorKey: 'model' as keyof Vehicle,
        accessorFn: (v: Vehicle) => v.model,
        header: 'Model',
      },
      { 
        id: 'year', 
        accessorKey: 'year' as keyof Vehicle,
        accessorFn: (v: Vehicle) => v.year,
        header: 'Year',
        sortable: true,
      },
      { 
        id: 'value', 
        accessorKey: 'value' as keyof Vehicle,
        accessorFn: (v: Vehicle) => v.value,
        header: 'Value',
        sortable: true,
        aggregationType: AggregationType.Sum,
        cellRenderer: MoneyRenderer,
      },
      { 
        id: 'basePremium', 
        accessorKey: 'basePremium' as keyof Vehicle,
        accessorFn: (v: Vehicle) => v.basePremium,
        header: 'Base Premium',
        sortable: true,
        aggregationType: AggregationType.Sum,
        cellRenderer: MoneyRenderer,
      },
      { 
        id: 'totalModifier', 
        accessorKey: 'totalModifier' as keyof Vehicle,
        accessorFn: (v: Vehicle) => v.totalModifier,
        header: 'Total Modifier',
        sortable: true,
        aggregationType: AggregationType.Average,
        cellRenderer: ModifierRenderer,
        rangeStyle: RangeStyle.RedToGreen,
      },
      { 
        id: 'adjustedPremium', 
        accessorKey: 'adjustedPremium' as keyof Vehicle,
        accessorFn: (v: Vehicle) => v.adjustedPremium,
        header: 'Adjusted Premium',
        sortable: true,
        aggregationType: AggregationType.Sum,
        cellRenderer: MoneyRenderer,
      },
    ],
    columnGroups: [],
    enableSorting: true,
    enableFiltering: true,
  };
  
  return (
    <Table 
    dataDescriptor={vehicleFluxorData}
      tableConfig={tableConfig} 
      data={vehicleTestData.slice(0, 20)} // First 20 for demo
    />
  );
}

// ============================================
// Demo: Task Table
// ============================================

export function TaskTableDemo() {
  const tableConfig: TableConfig<FluxorData<Task>> = {
    orientation: 'rows-horizontal' as const,
    columns: [
      { 
        id: 'taskId', 
        accessorKey: 'taskId' as keyof Task,
        accessorFn: (t: Task) => t.taskId,
        header: 'ID',
        pin: 'left' as const,
        width: 80,
      },
      { 
        id: 'taskName', 
        accessorKey: 'taskName' as keyof Task,
        accessorFn: (t: Task) => t.taskName,
        header: 'Task',
        sortable: true,
      },
      { 
        id: 'priority', 
        accessorKey: 'priority' as keyof Task,
        accessorFn: (t: Task) => t.priority,
        header: 'Priority',
        sortable: true,
        cellRenderer: PriorityRenderer,
      },
      { 
        id: 'status', 
        accessorKey: 'status' as keyof Task,
        accessorFn: (t: Task) => t.status,
        header: 'Status',
        sortable: true,
        cellRenderer: StatusRenderer,
      },
      { 
        id: 'assignee', 
        accessorKey: 'assignee' as keyof Task,
        accessorFn: (t: Task) => t.assignee,
        header: 'Assignee',
        sortable: true,
      },
      { 
        id: 'value', 
        accessorKey: 'value' as keyof Task,
        accessorFn: (t: Task) => t.value,
        header: 'Value',
        sortable: true,
        aggregationType: AggregationType.Sum,
        cellRenderer: MoneyRenderer,
      },
    ],
    columnGroups: [],
    enableSorting: true,
  };
  
  return (
    <div style={{ padding: '20px' }}>
      <h2>Task Queue - Table Demo</h2>
      <Table 
        dataDescriptor={taskFluxorData}
        tableConfig={tableConfig} 
        data={taskTestData}
      />
    </div>
  );
}

// ============================================
// Combined Demo
// ============================================

export default function TableDemo() {
  return (
    <div>
      <TaskTableDemo />
      <hr style={{ margin: '40px 0' }} />
      <VehicleTableDemo />
    </div>
  );
}
