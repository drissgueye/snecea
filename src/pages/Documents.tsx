import { useState, useEffect, useMemo } from 'react';
import {
  Search,
  FolderOpen,
  FileText,
  Download,
  Calendar,
  ChevronRight,
  Loader2,
  Shield,
  Users,
  Building2,
  Megaphone,
  Scale,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { getDocuments, getMediaUrl, type DocumentSyndicalDto } from '@/lib/api';
import { cn } from '@/lib/utils';

/** Clés API pour les 5 catégories (backend CategorieDocument) */
const CATEGORY_KEYS = {
  ADMINISTRATIFS: 'administratifs_officiels',
  MEMBRES: 'documents_membres',
  POLES: 'documents_poles',
  COMMUNICATION: 'communication',
  JURIDIQUES: 'juridiques_contentieux',
} as const;

/** Définition des 5 sections avec description et accès */
const DOCUMENT_SECTIONS = [
  {
    id: CATEGORY_KEYS.ADMINISTRATIFS,
    icon: Shield,
    title: '1️⃣ Documents administratifs officiels',
    description:
      'Documents institutionnels du syndicat : statuts du syndicat, règlement intérieur, procès-verbaux d’assemblées générales, rapports annuels, comptes rendus de réunions, décisions officielles du bureau.',
    accessNote: 'Lecture pour tous les membres, modification réservée aux admins.',
  },
  {
    id: CATEGORY_KEYS.MEMBRES,
    icon: Users,
    title: '2️⃣ Documents des membres',
    description:
      'Par membre : carte de membre, attestation d’adhésion, justificatifs fournis (CNI, contrat, etc.), demandes envoyées au syndicat, réponses officielles reçues.',
    accessNote: 'Privé (membre + admin uniquement).',
  },
  {
    id: CATEGORY_KEYS.POLES,
    icon: Building2,
    title: '3️⃣ Documents liés aux pôles',
    description:
      'Par pôle (ex. Pôle Habitat) : dossiers de demande, rapports d’analyse, autorisations, contrats de partenariat, documents juridiques spécifiques.',
    accessNote: 'Membres du pôle + admin.',
  },
  {
    id: CATEGORY_KEYS.COMMUNICATION,
    icon: Megaphone,
    title: '4️⃣ Documents de communication',
    description:
      'Notes d’information, circulaires, annonces, formulaires téléchargeables, guides internes.',
    accessNote: 'Consultation selon droits (membres / public selon le type).',
  },
  {
    id: CATEGORY_KEYS.JURIDIQUES,
    icon: Scale,
    title: '5️⃣ Documents juridiques et contentieux',
    description:
      'Plaintes déposées, réponses officielles, courriers administratifs, conventions signées.',
    accessNote: 'Accès restreint (concernés + admin).',
  },
];

/** Assigne un document à une section à partir du champ API categorie */
function getSectionIdForDocument(doc: DocumentSyndicalDto): string {
  const cat = (doc.categorie || '').trim().toLowerCase();
  if (!cat) return CATEGORY_KEYS.ADMINISTRATIFS;
  if (cat === CATEGORY_KEYS.ADMINISTRATIFS || cat.includes('administratif') || cat.includes('officiel')) return CATEGORY_KEYS.ADMINISTRATIFS;
  if (cat === CATEGORY_KEYS.MEMBRES || cat.includes('membre') || cat.includes('adhésion') || cat.includes('carte')) return CATEGORY_KEYS.MEMBRES;
  if (cat === CATEGORY_KEYS.POLES || cat.includes('pôle') || cat.includes('pole') || cat.includes('habitat')) return CATEGORY_KEYS.POLES;
  if (cat === CATEGORY_KEYS.COMMUNICATION || cat.includes('communication') || cat.includes('circulaire') || cat.includes('note')) return CATEGORY_KEYS.COMMUNICATION;
  if (cat === CATEGORY_KEYS.JURIDIQUES || cat.includes('juridique') || cat.includes('contentieux') || cat.includes('convention')) return CATEGORY_KEYS.JURIDIQUES;
  return CATEGORY_KEYS.ADMINISTRATIFS;
}

export default function Documents() {
  const [searchQuery, setSearchQuery] = useState('');
  const [yearFilter, setYearFilter] = useState('all');
  const [openSections, setOpenSections] = useState<string[]>([CATEGORY_KEYS.ADMINISTRATIFS, CATEGORY_KEYS.COMMUNICATION]);
  const [documents, setDocuments] = useState<DocumentSyndicalDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getDocuments({ ordering: '-annee' })
      .then((data) => {
        setDocuments(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        setDocuments([]);
        const msg =
          (err?.data && typeof err.data === 'object' && 'detail' in err.data && err.data.detail) ||
          (typeof err?.message === 'string' ? err.message : null) ||
          'Impossible de charger les documents';
        setError(String(msg));
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      const matchesSearch =
        !searchQuery ||
        doc.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (doc.description && doc.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (doc.categorie && doc.categorie.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesYear = yearFilter === 'all' || doc.annee === parseInt(yearFilter, 10);
      return matchesSearch && matchesYear;
    });
  }, [documents, searchQuery, yearFilter]);

  const documentsBySection = useMemo(() => {
    const map: Record<string, DocumentSyndicalDto[]> = {};
    DOCUMENT_SECTIONS.forEach((s) => {
      map[s.id] = [];
    });
    filteredDocuments.forEach((doc) => {
      const sectionId = getSectionIdForDocument(doc);
      if (map[sectionId]) map[sectionId].push(doc);
      else map[sectionId] = [doc];
    });
    return map;
  }, [filteredDocuments]);

  const years = useMemo(
    () => [...new Set(documents.map((d) => d.annee))].sort((a, b) => b - a),
    [documents]
  );

  const toggleSection = (id: string) => {
    setOpenSections((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleDownload = (doc: DocumentSyndicalDto) => {
    const url = getMediaUrl(doc.fichier);
    if (!url) return;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Documents</h1>
        <p className="text-muted-foreground mt-1">
          Accédez aux documents syndicaux par catégorie : administratifs, membres, pôles, communication et juridiques.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un document..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={yearFilter} onValueChange={setYearFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Année" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les années</SelectItem>
            {years.map((year) => (
              <SelectItem key={year} value={year.toString()}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive" role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-4">
          {DOCUMENT_SECTIONS.map((section) => {
            const docs = documentsBySection[section.id] ?? [];
            const Icon = section.icon;
            return (
              <Collapsible
                key={section.id}
                open={openSections.includes(section.id)}
                onOpenChange={() => toggleSection(section.id)}
              >
                <CollapsibleTrigger asChild>
                  <button
                    className={cn(
                      'w-full flex items-center justify-between p-4 bg-card rounded-xl border shadow-card text-left',
                      'hover:bg-accent/50 transition-colors'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h2 className="font-semibold">{section.title}</h2>
                        <p className="text-sm text-muted-foreground">
                          {docs.length} document(s)
                        </p>
                      </div>
                    </div>
                    <ChevronRight
                      className={cn(
                        'w-5 h-5 text-muted-foreground transition-transform shrink-0',
                        openSections.includes(section.id) && 'rotate-90'
                      )}
                    />
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="mt-3 pl-4 space-y-3 border-l-2 border-muted pl-6">
                    <p className="text-sm text-muted-foreground">
                      {section.description}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <span className="font-medium">Accès :</span>
                      {section.accessNote}
                    </p>
                    <div className="space-y-2 pt-2">
                      {docs.length === 0 ? (
                        <p className="text-sm text-muted-foreground italic">
                          Aucun document dans cette catégorie.
                        </p>
                      ) : (
                        docs.map((doc) => (
                          <div
                            key={doc.id}
                            className="flex items-center justify-between p-4 bg-card rounded-lg border hover:bg-accent/50 transition-colors"
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center shrink-0">
                                <FileText className="w-5 h-5 text-secondary-foreground" />
                              </div>
                              <div>
                                <p className="font-medium">{doc.nom}</p>
                                <div className="flex items-center gap-3 mt-1 flex-wrap">
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Calendar className="w-3 h-3" />
                                    {doc.annee}
                                  </div>
                                  {doc.pole && (
                                    <Badge variant="outline" className="text-xs">
                                      {doc.pole.nom}
                                    </Badge>
                                  )}
                                  <Badge variant="secondary" className="text-xs">
                                    v{doc.version}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownload(doc)}
                              disabled={!doc.fichier}
                            >
                              <Download className="w-4 h-4 mr-2" />
                              Télécharger
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </div>
      )}

      {!loading && (
        <p className="text-sm text-muted-foreground">
          {filteredDocuments.length} document(s) disponible(s)
        </p>
      )}
    </div>
  );
}
