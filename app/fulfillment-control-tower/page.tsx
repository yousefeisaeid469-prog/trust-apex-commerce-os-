import FulfillmentControlTowerSurface from '../../components/domains/fulfillment-control-tower-surface';

export const metadata = {
  title: 'Fulfillment Control Tower | TRUST',
  description: 'Database-backed fulfillment operations, provider reconciliation and delivery exception visibility.',
};

export default function FulfillmentControlTowerPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <FulfillmentControlTowerSurface />
    </main>
  );
}
