import { Metadata } from 'next';
import { AddonsManager } from '@/components/settings/addons-manager';

export const metadata: Metadata = {
  title: 'Add-ons - Configuración',
  description: 'Agrega ubicaciones extra y doctores adicionales a tu plan',
};

export default function AddonsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Add-ons</h1>
        <p className="text-muted-foreground mt-2">
          Expande las capacidades de tu plan con ubicaciones y doctores adicionales
        </p>
      </div>

      <AddonsManager />
    </div>
  );
}
