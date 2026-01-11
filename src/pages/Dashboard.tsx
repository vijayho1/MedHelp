import { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { Header } from '@/components/Header';
import { PatientCard } from '@/components/PatientCard';
import { PatientForm } from '@/components/PatientForm';
import { EmptyState } from '@/components/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { usePatients } from '@/contexts/PatientContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

type View = 'list' | 'form';

export default function Dashboard() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { patients, searchPatients, deletePatient, loading, generateRandomPatientsWithAI } = usePatients();
  const [isSeeding, setIsSeeding] = useState(false);
  const [view, setView] = useState<View>('list');
  const [editingPatientId, setEditingPatientId] = useState<string | undefined>();
  const [searchQuery, setSearchQuery] = useState('');
  const [dateStringFilter, setDateStringFilter] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  // Filter patients by search and dd/mm/yy string
  let filteredPatients = searchPatients(searchQuery);
  if (dateStringFilter) {
    filteredPatients = filteredPatients.filter(p => {
      const d = new Date(p.createdAt);
      const dd = d.getDate().toString().padStart(2, '0');
      const mm = (d.getMonth() + 1).toString().padStart(2, '0');
      const yyyy = d.getFullYear().toString();
      const yy = yyyy.slice(-2);
      // Accept both dd/mm/yy and dd/mm/yyyy
      const dateStrShort = `${dd}/${mm}/${yy}`;
      const dateStrLong = `${dd}/${mm}/${yyyy}`;
      return (
        dateStrShort === dateStringFilter.trim() ||
        dateStrLong === dateStringFilter.trim()
      );
    });
  }

  const handleNewPatient = () => {
    setEditingPatientId(undefined);
    setView('form');
  };

  const handleEditPatient = (id: string) => {
    setEditingPatientId(id);
    setView('form');
  };

  const handleDeleteClick = (id: string) => {
    setPatientToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (patientToDelete) {
      try {
        await deletePatient(patientToDelete);
        toast.success('Patient record deleted');
      } catch (error) {
        toast.error('Failed to delete patient');
      }
    }
    setDeleteDialogOpen(false);
    setPatientToDelete(null);
  };

  const handleBack = () => {
    setView('list');
    setEditingPatientId(undefined);
  };

  if (view === 'form') {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="container py-6">
          <PatientForm patientId={editingPatientId} onBack={handleBack} />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container py-6">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold text-foreground">Patient Dashboard</h1>
          <Button onClick={handleNewPatient} className="gap-2">
            <Plus className="h-4 w-4" />
            New Patient
          </Button>
        </div>

        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:gap-6">
          {import.meta.env.DEV && (
            <Button onClick={async () => {
              setIsSeeding(true);
              await generateRandomPatientsWithAI();
              setIsSeeding(false);
              toast.success('Random patients generated!');
            }} disabled={isSeeding} variant="outline" className="mb-2 md:mb-0">
              {isSeeding ? 'Generating...' : 'Generate Random Patients'}
            </Button>
          )}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search patients by name, symptoms..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div>
            <Input
              id="date-string-filter"
              placeholder="dd/mm/yy"
              value={dateStringFilter}
              onChange={e => setDateStringFilter(e.target.value)}
              className="w-32"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">
            Loading patients...
          </div>
        ) : patients.length === 0 ? (
          <EmptyState />
        ) : filteredPatients.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No patients found matching "{searchQuery}"
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredPatients.map(patient => (
              <PatientCard
                key={patient.id}
                patient={patient}
                onEdit={handleEditPatient}
                onDelete={handleDeleteClick}
              />
            ))}
          </div>
        )}
      </main>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Patient Record</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this patient record? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
