import { User, Calendar, FileText, Trash2, Edit } from 'lucide-react';
import { Patient } from '@/types/patient';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

interface PatientCardProps {
  patient: Patient;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function PatientCard({ patient, onEdit, onDelete }: PatientCardProps) {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="medical-card p-5 animate-fade-in">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <User className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{patient.name}</h3>
            <p className="text-sm text-muted-foreground">
              {patient.age} years old • {patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1)}
            </p>
          </div>
        </div>
        
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={() => onEdit(patient.id)}>
            <Edit className="h-4 w-4 text-muted-foreground" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onDelete(patient.id)}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {patient.symptoms && (
          <div className="flex items-start gap-2">
            <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
            <p className="text-sm text-muted-foreground line-clamp-2">
              <span className="font-medium text-foreground">Symptoms:</span> {patient.symptoms}
            </p>
          </div>
        )}
        
        {patient.possibleCondition && (
          <Badge variant="secondary" className="bg-accent/10 text-accent border-0">
            {patient.possibleCondition}
          </Badge>
        )}
      </div>

      <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground border-t border-border pt-3">
        <Calendar className="h-3.5 w-3.5" />
        <span>Added {formatDate(patient.createdAt)}</span>
      </div>
    </div>
  );
}
