import type { Service } from '../../types';
import { ClientServiceList } from '../client/ClientServiceList';

interface Props {
  orderId: number | undefined;
  services?: Service[];
}

export function StaffServiceList({ orderId, services }: Props) {
  return (
    <div className="h-full flex flex-col">
      <ClientServiceList 
        orderId={orderId} 
        services={services} 
        variant="staff"
        gridCols="grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5" 
        drawerLayout="horizontal"
      />
    </div>
  );
}
