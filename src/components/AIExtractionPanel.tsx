import { Sparkles, AlertCircle } from 'lucide-react';
import { AIExtraction } from '@/types/patient';
import { Badge } from './ui/badge';

interface AIExtractionPanelProps {
  extraction: AIExtraction | null;
  isLoading?: boolean;
}

export function AIExtractionPanel({ extraction, isLoading }: AIExtractionPanelProps) {
  if (isLoading) {
    return (
      <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-5 w-5 text-primary animate-pulse" />
          <span className="font-medium text-primary">AI Processing...</span>
        </div>
        <div className="space-y-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-4 bg-primary/10 rounded animate-pulse" style={{ width: `${70 + i * 5}%` }} />
          ))}
        </div>
      </div>
    );
  }

  if (!extraction) return null;

  const fields = [
    { label: 'Age', value: extraction.age },
    { label: 'History', value: extraction.history },
    { label: 'Symptoms', value: extraction.symptoms },
    { label: 'Tests', value: extraction.tests },
    { label: 'Allergies', value: extraction.allergies },
    { label: 'Possible Condition', value: extraction.possibleCondition, highlight: true },
    { label: 'Recommendations', value: extraction.recommendations, highlight: true },
  ].filter(f => f.value);

  return (
    <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 animate-fade-in">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="h-5 w-5 text-primary" />
        <span className="font-medium text-primary">AI Extracted Information</span>
      </div>

      <div className="space-y-3">
        {fields.map(field => (
          <div key={field.label}>
            <span className="text-sm font-medium text-foreground">{field.label}: </span>
            {field.highlight ? (
              <Badge variant="secondary" className="bg-accent/10 text-accent border-0 font-normal">
                {field.value}
              </Badge>
            ) : (
              <span className="text-sm text-muted-foreground">{field.value}</span>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-start gap-2 p-3 rounded-md bg-warning/10 text-warning">
        <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
        <p className="text-xs">
          AI suggestions are for reference only. Final medical decisions should always be made by the treating physician.
        </p>
      </div>
    </div>
  );
}
