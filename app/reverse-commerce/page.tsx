import ReverseCommerceSurface from '../../components/domains/reverse-commerce-surface';

export const dynamic = 'force-dynamic';

const workflow = [
  ['Recovery', 'Inspect returned units, select a warehouse disposition, and post an inventory ledger delta only when stock actually changes.'],
  ['Replacement', 'Create a customer-scoped replacement order, verify current stock, reserve inventory atomically, and keep the lifecycle constrained.'],
  ['Store credit', 'Issue a durable customer credit, redeem it under a row lock, and reverse a redemption exactly once when a correction is required.'],
  ['Ledger', 'Record financial evidence with unique reference keys and compensating entries instead of mutating history in place.'],
  ['Reconciliation', 'Lease background work with SKIP LOCKED, bounded retry, expired-lease recovery and dead-letter visibility.'],
  ['Auditability', 'Every important mutation creates durable event/outbox evidence so operators can reconstruct the execution path.'],
];

function WorkflowCard({ title, body }: { title: string; body: string }) {
  return (
    <article className="rounded-xl border border-white/10 p-4">
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-2 text-sm opacity-70">{body}</p>
    </article>
  );
}

export default function ReverseCommercePage() {
  return (
    <div className="min-h-screen">
      <ReverseCommerceSurface />
      <section className="mx-auto max-w-6xl px-6 pb-12">
        <div className="rounded-2xl border p-6">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] opacity-50">Trust Commerce Kernel</p>
              <h1 className="mt-1 text-2xl font-semibold">Reverse-commerce execution map</h1>
            </div>
            <p className="max-w-xl text-sm opacity-60">The reverse side of commerce is durable execution, not a status label. Inventory, replacements, customer value and financial evidence each have their own state and audit trail.</p>
          </div>
          <div className="mt-6 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {workflow.map(([title, body]) => <WorkflowCard key={title} title={title} body={body} />)}
          </div>
        </div>
      </section>
    </div>
  );
}
