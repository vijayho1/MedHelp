import { ClipboardList } from 'lucide-react';

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
      <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-primary/10">
        <ClipboardList className="h-12 w-12 text-primary" />
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-2">No patients yet.</h3>
      <p className="text-muted-foreground max-w-sm">
        Click "+ New Patient" to add your first patient record.
      </p>
    </div>
  );
}
