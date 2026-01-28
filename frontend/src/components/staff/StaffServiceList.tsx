import type { Service } from '../../types';
import { ClientServiceList } from '../client/ClientServiceList';

interface Props {
  orderId: number | undefined;
  services?: Service[];
}

export function StaffServiceList({ orderId, services }: Props) {
  return (
    <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-5 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 h-fit">
      <ClientServiceList 
        orderId={orderId} 
        services={services} 
        variant="staff"
        gridCols="grid-cols-2 md:grid-cols-3 lg:grid-cols-4" 
      />
    </div>
  );
}
