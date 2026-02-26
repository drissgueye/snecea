import { useCallback, useEffect, useState } from 'react';
import { Building2, Star, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  getEntreprises,
  getNotationsEntreprise,
  upsertNotationEntreprise,
  CRITERES_NOTATION,
  type EntrepriseDto,
  type NotationEntrepriseDto,
} from '@/lib/api';
import { cn } from '@/lib/utils';

type NotationByCompany = {
  entreprise: EntrepriseDto;
  notations: NotationEntrepriseDto[];
  /** Moyenne par critère */
  avgByCritere: Record<string, { avg: number; count: number }>;
  /** Moyenne globale */
  overallAvg: number;
};

const NOTE_MAX = 5;

function StarRating({
  value,
  onChange,
  readonly = false,
}: {
  value: number;
  onChange?: (n: number) => void;
  readonly?: boolean;
}) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={readonly}
          className={cn(
            'p-0.5 rounded transition-colors',
            readonly ? 'cursor-default' : 'hover:scale-110',
            value >= n ? 'text-amber-500' : 'text-muted-foreground/40'
          )}
          onClick={() => !readonly && onChange?.(n)}
          aria-label={`${n} sur ${NOTE_MAX}`}
        >
          <Star className="w-6 h-6 fill-current" />
        </button>
      ))}
    </div>
  );
}

export default function CompanyRatings() {
  const [entreprises, setEntreprises] = useState<EntrepriseDto[]>([]);
  const [notations, setNotations] = useState<NotationEntrepriseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);
  const [formNotes, setFormNotes] = useState<Record<string, number>>({});
  const [formComments, setFormComments] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [entreprisesRes, notationsRes] = await Promise.all([
        getEntreprises(),
        getNotationsEntreprise(),
      ]);
      setEntreprises(Array.isArray(entreprisesRes) ? entreprisesRes : []);
      setNotations(Array.isArray(notationsRes) ? notationsRes : []);
    } catch {
      setError('Impossible de charger les entreprises et les notations.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const summaryByCompany: NotationByCompany[] = entreprises.map((entreprise) => {
    const companyNotations = notations.filter((n) => n.entreprise?.id === entreprise.id);
    const avgByCritere: Record<string, { avg: number; count: number }> = {};
    CRITERES_NOTATION.forEach(({ value }) => {
      const forCritere = companyNotations.filter((n) => n.critere === value);
      const count = forCritere.length;
      const sum = forCritere.reduce((s, n) => s + n.note, 0);
      avgByCritere[value] = {
        avg: count ? Math.round((sum / count) * 10) / 10 : 0,
        count,
      };
    });
    const totalSum = companyNotations.reduce((s, n) => s + n.note, 0);
    const totalCount = companyNotations.length;
    const overallAvg =
      totalCount > 0 ? Math.round((totalSum / totalCount) * 10) / 10 : 0;
    return {
      entreprise,
      notations: companyNotations,
      avgByCritere,
      overallAvg,
    };
  });

  const openNoter = (entrepriseId: number) => {
    const existing = notations.filter(
      (n) => n.entreprise?.id === entrepriseId
    ) as NotationEntrepriseDto[];
    const notes: Record<string, number> = {};
    const comments: Record<string, string> = {};
    CRITERES_NOTATION.forEach(({ value }) => {
      const one = existing.find((n) => n.critere === value);
      notes[value] = one?.note ?? 0;
      comments[value] = one?.commentaire ?? '';
    });
    setFormNotes(notes);
    setFormComments(comments);
    setSelectedCompanyId(entrepriseId);
    setDialogOpen(true);
  };

  const handleSaveNotation = async () => {
    if (selectedCompanyId == null) return;
    setSaving(true);
    try {
      for (const { value } of CRITERES_NOTATION) {
        const note = formNotes[value] ?? 0;
        if (note < 1 || note > NOTE_MAX) continue;
        await upsertNotationEntreprise({
          entreprise_id: selectedCompanyId,
          critere: value,
          note,
          commentaire: formComments[value]?.trim() || undefined,
        });
      }
      await loadData();
      setDialogOpen(false);
    } catch {
      setError('Erreur lors de l\'enregistrement des notes.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Star className="w-7 h-7 text-amber-500" />
          Notation des entreprises
        </h1>
        <p className="text-muted-foreground mt-1">
          Consultez et renseignez les notes par critère pour chaque entreprise (1 = très
          insuffisant, 5 = excellent).
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Légende des critères */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Critères de notation</CardTitle>
          <CardDescription>
            Ces critères permettent d&apos;évaluer la relation employeur / syndicat et les
            conditions perçues.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-muted-foreground">
            {CRITERES_NOTATION.map((c) => (
              <li key={c.value} className="flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-500/70 shrink-0" />
                {c.label}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Liste des entreprises avec notes */}
      <section>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Building2 className="w-5 h-5" />
          Notes par entreprise
        </h2>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-xl border p-6 h-40 animate-pulse bg-muted/30"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {summaryByCompany.map(({ entreprise, overallAvg, avgByCritere, notations: nList }) => (
              <Card key={entreprise.id} className="flex flex-col">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base">{entreprise.nom}</CardTitle>
                    <Badge variant="secondary" className="shrink-0">
                      {nList.length} note{nList.length !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                  <CardDescription>
                    Moyenne globale :{' '}
                    {overallAvg > 0 ? (
                      <span className="font-medium text-foreground">
                        {overallAvg.toFixed(1)} / 5
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col gap-3">
                  <div className="text-xs text-muted-foreground space-y-1">
                    {CRITERES_NOTATION.slice(0, 3).map((c) => (
                      <div key={c.value} className="flex justify-between">
                        <span>{c.label}</span>
                        <span>
                          {avgByCritere[c.value]?.count
                            ? `${avgByCritere[c.value].avg.toFixed(1)} (${avgByCritere[c.value].count})`
                            : '—'}
                        </span>
                      </div>
                    ))}
                    {CRITERES_NOTATION.length > 3 && (
                      <div className="pt-1 border-t">
                        + {CRITERES_NOTATION.length - 3} autre
                        {CRITERES_NOTATION.length - 3 > 1 ? 's' : ''} critère
                        {CRITERES_NOTATION.length - 3 > 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-auto w-full"
                    onClick={() => openNoter(entreprise.id)}
                  >
                    <Star className="w-4 h-4 mr-2" />
                    Noter cette entreprise
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Détail des notations (tableau récap) */}
      {!loading && notations.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Détail des notations
          </h2>
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-3 font-medium">Entreprise</th>
                      <th className="text-left p-3 font-medium">Critère</th>
                      <th className="text-left p-3 font-medium">Note</th>
                      <th className="text-left p-3 font-medium">Commentaire</th>
                      <th className="text-left p-3 font-medium">Par</th>
                    </tr>
                  </thead>
                  <tbody>
                    {notations
                      .sort(
                        (a, b) =>
                          (a.entreprise?.nom ?? '').localeCompare(b.entreprise?.nom ?? '') ||
                          a.critere.localeCompare(b.critere)
                      )
                      .map((n) => (
                        <tr key={n.id} className="border-b last:border-0">
                          <td className="p-3">{n.entreprise?.nom ?? '—'}</td>
                          <td className="p-3">{n.critere_display}</td>
                          <td className="p-3">
                            <StarRating value={n.note} readonly />
                          </td>
                          <td className="p-3 max-w-[200px] truncate text-muted-foreground">
                            {n.commentaire || '—'}
                          </td>
                          <td className="p-3 text-muted-foreground">
                            {n.created_by_display ?? '—'}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Dialog Noter */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Noter l&apos;entreprise</DialogTitle>
            <DialogDescription>
              {selectedCompanyId != null &&
                entreprises.find((e) => e.id === selectedCompanyId)?.nom}
              . Donnez une note de 1 à 5 pour chaque critère (optionnel : commentaire).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {CRITERES_NOTATION.map((c) => (
              <div key={c.value} className="space-y-2">
                <Label>{c.label}</Label>
                <StarRating
                  value={formNotes[c.value] ?? 0}
                  onChange={(n) => setFormNotes((prev) => ({ ...prev, [c.value]: n }))}
                />
                <Textarea
                  placeholder="Commentaire (optionnel)"
                  value={formComments[c.value] ?? ''}
                  onChange={(e) =>
                    setFormComments((prev) => ({ ...prev, [c.value]: e.target.value }))
                  }
                  className="min-h-[60px] resize-none"
                  rows={2}
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSaveNotation} disabled={saving}>
              {saving ? 'Enregistrement…' : 'Enregistrer les notes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
