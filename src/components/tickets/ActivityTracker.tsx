import { useEffect, useRef, useState } from 'react';
import { 
  Phone, 
  CalendarCheck, 
  FileText, 
  Plus, 
  CheckCircle2, 
  Clock, 
  Paperclip,
  MessageSquare,
  X,
  Upload
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import {
  apiRequest,
  getRequeteActivites,
  createRequeteActivite,
  updateRequeteActivite,
  getRequeteActivityTypeChoices,
  getMediaUrl,
  type RequeteActivityTypeChoicesDto,
  type ActivityTypeChoice,
} from '@/lib/api';

export type ActivityType = string; // dynamique selon le pôle (call, meeting, note, ou types métier)
export type ActivityStatus = 'planned' | 'completed' | 'cancelled';

export interface Activity {
  id: string;
  type: ActivityType;
  typeDisplay?: string;
  title: string;
  description?: string;
  scheduledDate: Date;
  completedDate?: Date;
  status: ActivityStatus;
  comment?: string;
  attachmentName?: string;
  attachmentUrl?: string;
  createdBy: string;
  createdAt: Date;
  extraData?: Record<string, unknown>;
}

/** Libellés par défaut pour les types courants (fallback si pas de type_activite_display) */
const defaultActivityTypeLabels: Record<string, string> = {
  call: 'Appel téléphonique',
  meeting: 'Rendez-vous',
  document: 'Document à fournir',
  note: 'Note interne',
};

function getActivityTypeLabel(type: string, typeDisplay?: string): string {
  return typeDisplay ?? defaultActivityTypeLabels[type] ?? type;
}

function getActivityTypeIcon(type: string): React.ReactNode {
  const iconMap: Record<string, React.ReactNode> = {
    call: <Phone className="w-4 h-4" />,
    meeting: <CalendarCheck className="w-4 h-4" />,
    document: <FileText className="w-4 h-4" />,
    note: <MessageSquare className="w-4 h-4" />,
  };
  return iconMap[type] ?? <FileText className="w-4 h-4" />;
}

const statusLabels: Record<ActivityStatus, string> = {
  planned: 'Planifié',
  completed: 'Terminé',
  cancelled: 'Annulé',
};

const INITIAL_ACTIVITIES: Activity[] = [];

interface ActivityTrackerProps {
  ticketId: string;
  ticketReference?: string;
  ticketSubject?: string;
  recipientEmail?: string;
  recipientName?: string;
  canManage: boolean;
}

/** Entrée d'historique renvoyée par l'API (HistoriqueAction). */
export type HistoriqueEntry = {
  id: number;
  action: string;
  action_display: string;
  utilisateur_display: string;
  commentaire: string | null;
  champ_modifie: string | null;
  ancienne_valeur: string | null;
  nouvelle_valeur: string | null;
  timestamp: string;
};

export function ActivityTracker({ 
  ticketId, 
  ticketReference = 'REQ-XXXX', 
  ticketSubject = '',
  recipientEmail,
  recipientName,
  canManage 
}: ActivityTrackerProps) {
  const { toast } = useToast();
  const [historique, setHistorique] = useState<HistoriqueEntry[]>([]);
  const [historiqueLoading, setHistoriqueLoading] = useState(true);
  const [activities, setActivities] = useState<Activity[]>(INITIAL_ACTIVITIES);
  const [activityTypeChoices, setActivityTypeChoices] = useState<RequeteActivityTypeChoicesDto | null>(null);
  const [activityTypeChoicesLoading, setActivityTypeChoicesLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [isCompletingActivity, setIsCompletingActivity] = useState(false);
  const [isSendingNotification, setIsSendingNotification] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Charger l'historique des actions depuis l'API
  useEffect(() => {
    if (!ticketId) return;
    let cancelled = false;
    setHistoriqueLoading(true);
    apiRequest<HistoriqueEntry[]>(`/requetes/${ticketId}/historique/`)
      .then((data) => {
        if (!cancelled) setHistorique(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) setHistorique([]);
      })
      .finally(() => {
        if (!cancelled) setHistoriqueLoading(false);
      });
    return () => { cancelled = true; };
  }, [ticketId]);

  // Charger les types d'activité selon le pôle (pour le formulaire « Ajouter une activité »)
  useEffect(() => {
    if (!ticketId) return;
    let cancelled = false;
    setActivityTypeChoicesLoading(true);
    getRequeteActivityTypeChoices(ticketId)
      .then((data) => {
        if (!cancelled) setActivityTypeChoices(data);
      })
      .catch(() => {
        if (!cancelled) setActivityTypeChoices(null);
      })
      .finally(() => {
        if (!cancelled) setActivityTypeChoicesLoading(false);
      });
    return () => { cancelled = true; };
  }, [ticketId]);

  // Charger les activités planifiées depuis l'API (affichées dans le calendrier)
  useEffect(() => {
    if (!ticketId) return;
    let cancelled = false;
    getRequeteActivites(ticketId)
      .then((data) => {
        if (cancelled) return;
        const mapped: Activity[] = (Array.isArray(data) ? data : []).map((a) => {
          const path = a.piece_jointe_compte_rendu;
          const attachmentName = path ? path.replace(/^.*[/\\]/, '') : undefined;
          return {
            id: String(a.id),
            type: a.type_activite,
            typeDisplay: a.type_activite_display,
            title: a.titre,
            description: a.description || undefined,
            scheduledDate: new Date(a.date_planifiee),
            completedDate: a.date_realisation ? new Date(a.date_realisation) : undefined,
            status: a.statut as ActivityStatus,
            comment: a.commentaire || undefined,
            attachmentName,
            attachmentUrl: path ? getMediaUrl(path) : undefined,
            createdBy: '',
            createdAt: new Date(a.created_at),
            extraData: a.extra_data,
          };
        });
        setActivities(mapped);
      })
      .catch(() => {
        if (!cancelled) setActivities([]);
      });
    return () => { cancelled = true; };
  }, [ticketId]);

  const typesList: ActivityTypeChoice[] = activityTypeChoices?.types ?? [];
  const firstTypeValue = typesList.length > 0 ? typesList[0].value : 'call';

  // New activity form state (type, titre, description, date, champs dynamiques extra_data)
  const [newActivity, setNewActivity] = useState<{
    type: string;
    title: string;
    description: string;
    scheduledDate: string;
    extra_data: Record<string, string>;
  }>({
    type: firstTypeValue,
    title: '',
    description: '',
    scheduledDate: (() => {
      const d = new Date();
      d.setMinutes(0, 0, 0);
      d.setHours(d.getHours() + 1);
      return d.toISOString().slice(0, 16);
    })(),
    extra_data: {},
  });

  // Quand les types par pôle sont chargés, s'assurer que le type sélectionné est dans la liste
  useEffect(() => {
    if (typesList.length === 0) return;
    const exists = typesList.some((t) => t.value === newActivity.type);
    if (!exists) {
      setNewActivity((prev) => ({ ...prev, type: firstTypeValue, extra_data: {} }));
    }
  }, [activityTypeChoices]);

  // Complete activity form state
  const [completeForm, setCompleteForm] = useState<{
    comment: string;
    attachmentFile: File | null;
  }>({
    comment: '',
    attachmentFile: null,
  });

  const sendActivityNotification = async (
    _activityType: ActivityType,
    _activityTitle: string,
    _activityDate: string,
    _notificationType: 'planned' | 'completed',
    _completionComment?: string
  ) => {
    if (!recipientEmail) return;
    // Notification par email : à brancher sur le backend (ex. Django email) si besoin
  };

  const selectedTypeDef = typesList.find((t) => t.value === newActivity.type);

  const handleAddActivity = async () => {
    if (!newActivity.title || !newActivity.scheduledDate || !ticketId) {
      toast({
        title: 'Champs requis',
        description: 'Veuillez remplir le titre et la date.',
        variant: 'destructive',
      });
      return;
    }

    setIsSendingNotification(true);
    try {
      const extraDataPayload: Record<string, unknown> = {};
      if (selectedTypeDef?.fields?.length && newActivity.extra_data) {
        selectedTypeDef.fields.forEach((f) => {
          const v = newActivity.extra_data[f.name];
          if (v !== undefined && v !== '') extraDataPayload[f.name] = v;
        });
      }
      const created = await createRequeteActivite(ticketId, {
        type_activite: newActivity.type,
        titre: newActivity.title,
        description: newActivity.description || '',
        date_planifiee: new Date(newActivity.scheduledDate).toISOString(),
        extra_data: Object.keys(extraDataPayload).length > 0 ? extraDataPayload : undefined,
      });
      const activity: Activity = {
        id: String(created.id),
        type: created.type_activite,
        typeDisplay: created.type_activite_display,
        title: created.titre,
        description: created.description || undefined,
        scheduledDate: new Date(created.date_planifiee),
        status: (created.statut as ActivityStatus) || 'planned',
        createdBy: '',
        createdAt: new Date(created.created_at),
        extraData: created.extra_data,
      };
      setActivities([activity, ...activities]);
      const nextDefault = new Date();
      nextDefault.setMinutes(0, 0, 0);
      nextDefault.setHours(nextDefault.getHours() + 1);
      setNewActivity({
        type: firstTypeValue,
        title: '',
        description: '',
        scheduledDate: nextDefault.toISOString().slice(0, 16),
        extra_data: {},
      });
      setIsDialogOpen(false);
      await sendActivityNotification(
        activity.type,
        activity.title,
        activity.scheduledDate.toISOString(),
        'planned'
      );
      toast({
        title: 'Activité ajoutée',
        description: "L'activité a été planifiée. Elle s'affichera dans le calendrier.",
      });
    } catch (err) {
      toast({
        title: 'Erreur',
        description: (err as { data?: { detail?: string } })?.data?.detail ?? "Impossible d'ajouter l'activité.",
        variant: 'destructive',
      });
    } finally {
      setIsSendingNotification(false);
    }
  };

  const handleCompleteActivity = async () => {
    if (!selectedActivity || !ticketId) return;

    setIsSendingNotification(true);
    try {
      const updated = await updateRequeteActivite(ticketId, selectedActivity.id, {
        statut: 'completed',
        date_realisation: new Date().toISOString(),
        commentaire: completeForm.comment || '',
        piece_jointe_compte_rendu: completeForm.attachmentFile || undefined,
      });
      const path = updated.piece_jointe_compte_rendu;
      const updatedActivities = activities.map((a) =>
        a.id === selectedActivity.id
          ? {
              ...a,
              status: 'completed' as ActivityStatus,
              completedDate: new Date(updated.date_realisation ?? ''),
              comment: updated.commentaire || completeForm.comment,
              attachmentName: path ? path.replace(/^.*[/\\]/, '') : undefined,
              attachmentUrl: path ? getMediaUrl(path) : undefined,
            }
          : a
      );
      setActivities(updatedActivities);
      setIsCompletingActivity(false);
      setSelectedActivity(null);
      setCompleteForm({ comment: '', attachmentFile: null });
      if (fileInputRef.current) fileInputRef.current.value = '';
      await sendActivityNotification(
        selectedActivity.type,
        selectedActivity.title,
        new Date().toISOString(),
        'completed',
        completeForm.comment
      );
      toast({
        title: 'Activité terminée',
        description: "L'activité a été marquée comme terminée et enregistrée.",
      });
    } catch (err) {
      toast({
        title: 'Erreur',
        description:
          (err as { data?: { detail?: string } })?.data?.detail ??
          "Impossible d'enregistrer la mise à jour.",
        variant: 'destructive',
      });
    } finally {
      setIsSendingNotification(false);
    }
  };

  const handleCancelActivity = async (activityId: string) => {
    if (!ticketId) return;
    try {
      await updateRequeteActivite(ticketId, activityId, { statut: 'cancelled' });
      const updatedActivities = activities.map((a) =>
        a.id === activityId ? { ...a, status: 'cancelled' as ActivityStatus } : a
      );
      setActivities(updatedActivities);
      toast({
        title: 'Activité annulée',
        description: "L'activité a été annulée et enregistrée.",
      });
    } catch (err) {
      toast({
        title: 'Erreur',
        description:
          (err as { data?: { detail?: string } })?.data?.detail ??
          "Impossible d'annuler l'activité.",
        variant: 'destructive',
      });
    }
  };

  const plannedActivities = activities.filter((a) => a.status === 'planned');
  const completedActivities = activities.filter((a) => a.status === 'completed');
  const cancelledActivities = activities.filter((a) => a.status === 'cancelled');

  return (
    <div className="bg-card rounded-xl border shadow-card">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarCheck className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Suivi des activités</h3>
          <Badge variant="secondary">{historique.length + activities.length}</Badge>
        </div>
        
        {canManage && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-1" />
                Ajouter
              </Button>
            </DialogTrigger>
            <DialogContent className="flex h-[90vh] max-h-[90vh] flex-col gap-0 overflow-hidden p-6">
              <DialogHeader className="shrink-0 pb-2">
                <DialogTitle>Nouvelle activité</DialogTitle>
                <DialogDescription>
                  {activityTypeChoices?.pole_name ? (
                    <>Types d'activité pour le pôle : <strong>{activityTypeChoices.pole_name}</strong></>
                  ) : (
                    'Planifiez une nouvelle activité pour cette requête'
                  )}
                </DialogDescription>
              </DialogHeader>

              <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
                <div className="space-y-4 mt-2">
                <div>
                  <Label className="mb-2 block">Type d'activité</Label>
                  {activityTypeChoicesLoading ? (
                    <p className="text-sm text-muted-foreground">Chargement des types...</p>
                  ) : typesList.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Aucun type disponible.</p>
                  ) : (
                    <RadioGroup
                      value={newActivity.type}
                      onValueChange={(value) =>
                        setNewActivity({ ...newActivity, type: value, extra_data: {} })
                      }
                      className="grid grid-cols-2 gap-2"
                    >
                      {typesList.map((choice) => (
                        <div key={choice.value}>
                          <RadioGroupItem
                            value={choice.value}
                            id={`type-${choice.value}`}
                            className="peer sr-only"
                          />
                          <Label
                            htmlFor={`type-${choice.value}`}
                            className={cn(
                              'flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all',
                              'hover:bg-accent/50',
                              newActivity.type === choice.value
                                ? 'border-primary bg-primary/10 text-primary'
                                : 'border-border'
                            )}
                          >
                            {getActivityTypeIcon(choice.value)}
                            <span className="text-sm">{choice.label}</span>
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  )}
                </div>

                {selectedTypeDef?.fields && selectedTypeDef.fields.length > 0 && (
                  <div className="space-y-3 p-3 rounded-lg bg-muted/30 border border-border">
                    <Label className="text-sm font-medium">Champs complémentaires (optionnels)</Label>
                    {selectedTypeDef.fields.map((field) => (
                      <div key={field.name}>
                        <Label htmlFor={`extra-${field.name}`} className="text-xs">
                          {field.label}
                          {field.required ? ' *' : ''}
                        </Label>
                        {field.type === 'textarea' ? (
                          <Textarea
                            id={`extra-${field.name}`}
                            value={newActivity.extra_data?.[field.name] ?? ''}
                            onChange={(e) =>
                              setNewActivity({
                                ...newActivity,
                                extra_data: {
                                  ...newActivity.extra_data,
                                  [field.name]: e.target.value,
                                },
                              })
                            }
                            placeholder={field.label}
                            className="mt-1 min-h-[60px]"
                          />
                        ) : (
                          <Input
                            id={`extra-${field.name}`}
                            type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : field.type === 'datetime' ? 'datetime-local' : 'text'}
                            value={newActivity.extra_data?.[field.name] ?? ''}
                            onChange={(e) =>
                              setNewActivity({
                                ...newActivity,
                                extra_data: {
                                  ...newActivity.extra_data,
                                  [field.name]: e.target.value,
                                },
                              })
                            }
                            placeholder={field.label}
                            className="mt-1"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div>
                  <Label htmlFor="title">Titre *</Label>
                  <Input
                    id="title"
                    value={newActivity.title}
                    onChange={(e) => setNewActivity({ ...newActivity, title: e.target.value })}
                    placeholder="Ex: Appel avec M. Diop"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newActivity.description}
                    onChange={(e) => setNewActivity({ ...newActivity, description: e.target.value })}
                    placeholder="Détails de l'activité..."
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="date">Date prévue *</Label>
                  <Input
                    id="date"
                    type="datetime-local"
                    value={newActivity.scheduledDate}
                    onChange={(e) => setNewActivity({ ...newActivity, scheduledDate: e.target.value })}
                    className="mt-1"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 pb-2">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button
                    onClick={handleAddActivity}
                    disabled={activityTypeChoicesLoading || typesList.length === 0}
                  >
                    Planifier l'activité
                  </Button>
                </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Complete activity dialog */}
      <Dialog open={isCompletingActivity} onOpenChange={setIsCompletingActivity}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Marquer comme terminée</DialogTitle>
            <DialogDescription>
              {selectedActivity?.title ?? 'Activité'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="comment">Commentaire / Compte-rendu *</Label>
              <Textarea
                id="comment"
                value={completeForm.comment}
                onChange={(e) => setCompleteForm({ ...completeForm, comment: e.target.value })}
                placeholder="Résumé de l'activité, résultats obtenus..."
                className="mt-1 min-h-[100px]"
              />
            </div>

            <div>
              <Label>Pièce jointe (compte-rendu)</Label>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx,.odt,.png,.jpg,.jpeg"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  setCompleteForm((prev) => ({ ...prev, attachmentFile: file ?? null }));
                }}
              />
              <div className="mt-1 flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {completeForm.attachmentFile
                    ? completeForm.attachmentFile.name
                    : 'Choisir un fichier'}
                </Button>
                {completeForm.attachmentFile && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setCompleteForm((prev) => ({ ...prev, attachmentFile: null }));
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                PDF, Word, images (optionnel)
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setIsCompletingActivity(false)}>
                Annuler
              </Button>
              <Button 
                onClick={handleCompleteActivity}
                disabled={!completeForm.comment.trim()}
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Confirmer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div
        className="overflow-y-auto overflow-x-hidden max-h-[70vh] min-h-[12rem] pr-1"
        style={{ scrollbarGutter: 'stable' }}
      >
        <div className="p-4 space-y-4">
          {/* Historique des actions (API) */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Historique des actions
            </h4>
            {historiqueLoading ? (
              <p className="text-sm text-muted-foreground py-4">Chargement...</p>
            ) : historique.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">
                Aucune action enregistrée pour le moment.
              </p>
            ) : (
              <div className="space-y-2">
              {historique.map((entry) => (
                <div
                  key={entry.id}
                  className="p-3 rounded-lg border border-border bg-muted/20 text-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-medium text-primary">
                      {entry.action_display}
                    </span>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {new Date(entry.timestamp).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  {entry.utilisateur_display && (
                    <p className="text-xs text-muted-foreground mt-1">
                      par {entry.utilisateur_display}
                    </p>
                  )}
                  {entry.commentaire && (
                    <p className="mt-2 text-muted-foreground">{entry.commentaire}</p>
                  )}
                  {(entry.ancienne_valeur || entry.nouvelle_valeur) && (
                    <p className="text-xs mt-1 text-muted-foreground">
                      {entry.ancienne_valeur && (
                        <span>Ancien : {entry.ancienne_valeur}</span>
                      )}
                      {entry.ancienne_valeur && entry.nouvelle_valeur && ' → '}
                      {entry.nouvelle_valeur && (
                        <span>Nouveau : {entry.nouvelle_valeur}</span>
                      )}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <Separator />

        {/* Activités planifiées (locales, à terme reliées au backend) */}
        {activities.length === 0 ? (
          <p className="text-center text-muted-foreground py-4 text-sm">
            Aucune activité planifiée. Utilisez « Ajouter » pour en créer une (enregistrement local).
          </p>
        ) : (
          <>
            {/* Planned activities */}
            {plannedActivities.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  À venir ({plannedActivities.length})
                </h4>
                <div className="space-y-2">
                  {plannedActivities.map((activity) => (
                    <div
                      key={activity.id}
                      className="p-3 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-primary/10 text-primary">
                            {getActivityTypeIcon(activity.type)}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{activity.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {getActivityTypeLabel(activity.type, activity.typeDisplay)}
                            </p>
                            {activity.description && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {activity.description}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground mt-2">
                              📅 {new Date(activity.scheduledDate).toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                        </div>
                        {canManage && (
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2 text-status-resolved hover:text-status-resolved"
                              onClick={() => {
                                setSelectedActivity(activity);
                                setIsCompletingActivity(true);
                              }}
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2 text-destructive hover:text-destructive"
                              onClick={() => handleCancelActivity(activity.id)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Completed activities */}
            {completedActivities.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-status-resolved" />
                  Terminées ({completedActivities.length})
                </h4>
                <div className="space-y-2">
                  {completedActivities.map((activity) => (
                    <div
                      key={activity.id}
                      className="p-3 rounded-lg border border-status-resolved/30 bg-status-resolved/5"
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-status-resolved/10 text-status-resolved">
                          {getActivityTypeIcon(activity.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm">{activity.title}</p>
                            <Badge variant="outline" className="text-status-resolved border-status-resolved/30">
                              Terminé
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {getActivityTypeLabel(activity.type, activity.typeDisplay)}
                          </p>
                          {activity.comment && (
                            <div className="mt-2 p-2 rounded bg-muted/50">
                              <p className="text-xs font-medium text-muted-foreground mb-1">
                                Compte-rendu:
                              </p>
                              <p className="text-sm">{activity.comment}</p>
                            </div>
                          )}
                          {(activity.attachmentUrl || activity.attachmentName) && (
                            <a
                              href={activity.attachmentUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 mt-2 text-sm text-primary hover:underline"
                            >
                              <Paperclip className="w-3 h-3 shrink-0" />
                              {activity.attachmentName ?? 'Pièce jointe'}
                            </a>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span>
                              Réalisé le {new Date(activity.completedDate!).toLocaleDateString('fr-FR')}
                            </span>
                            <span>par {activity.createdBy}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Cancelled activities */}
            {cancelledActivities.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">
                  Annulées ({cancelledActivities.length})
                </h4>
                <div className="space-y-2">
                  {cancelledActivities.map((activity) => (
                    <div
                      key={activity.id}
                      className="p-3 rounded-lg border border-border bg-muted/20 opacity-60"
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-muted text-muted-foreground">
                          {getActivityTypeIcon(activity.type)}
                        </div>
                        <div>
                          <p className="font-medium text-sm line-through">{activity.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {getActivityTypeLabel(activity.type, activity.typeDisplay)} - Annulé
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
        </div>
      </div>
    </div>
  );
}
