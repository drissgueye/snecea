import { useEffect, useState } from 'react';
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
import { apiRequest, getRequeteActivites, createRequeteActivite } from '@/lib/api';

export type ActivityType = 'call' | 'meeting' | 'document' | 'note';
export type ActivityStatus = 'planned' | 'completed' | 'cancelled';

export interface Activity {
  id: string;
  type: ActivityType;
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
}

const activityTypeLabels: Record<ActivityType, string> = {
  call: 'Appel téléphonique',
  meeting: 'Rendez-vous',
  document: 'Document à fournir',
  note: 'Note interne',
};

const activityTypeIcons: Record<ActivityType, React.ReactNode> = {
  call: <Phone className="w-4 h-4" />,
  meeting: <CalendarCheck className="w-4 h-4" />,
  document: <FileText className="w-4 h-4" />,
  note: <MessageSquare className="w-4 h-4" />,
};

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
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [isCompletingActivity, setIsCompletingActivity] = useState(false);
  const [isSendingNotification, setIsSendingNotification] = useState(false);
  
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

  // Charger les activités planifiées depuis l'API (affichées dans le calendrier)
  useEffect(() => {
    if (!ticketId) return;
    let cancelled = false;
    getRequeteActivites(ticketId)
      .then((data) => {
        if (cancelled) return;
        const mapped: Activity[] = (Array.isArray(data) ? data : []).map((a) => ({
          id: String(a.id),
          type: a.type_activite as ActivityType,
          title: a.titre,
          description: a.description || undefined,
          scheduledDate: new Date(a.date_planifiee),
          completedDate: a.date_realisation ? new Date(a.date_realisation) : undefined,
          status: a.statut as ActivityStatus,
          comment: a.commentaire || undefined,
          createdBy: '',
          createdAt: new Date(a.created_at),
        }));
        setActivities(mapped);
      })
      .catch(() => {
        if (!cancelled) setActivities([]);
      });
    return () => { cancelled = true; };
  }, [ticketId]);

  // New activity form state
  const [newActivity, setNewActivity] = useState({
    type: 'call' as ActivityType,
    title: '',
    description: '',
    scheduledDate: '',
  });

  // Complete activity form state
  const [completeForm, setCompleteForm] = useState({
    comment: '',
    attachmentName: '',
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
      const created = await createRequeteActivite(ticketId, {
        type_activite: newActivity.type,
        titre: newActivity.title,
        description: newActivity.description || '',
        date_planifiee: new Date(newActivity.scheduledDate).toISOString(),
      });
      const activity: Activity = {
        id: String(created.id),
        type: created.type_activite as ActivityType,
        title: created.titre,
        description: created.description || undefined,
        scheduledDate: new Date(created.date_planifiee),
        status: (created.statut as ActivityStatus) || 'planned',
        createdBy: '',
        createdAt: new Date(created.created_at),
      };
      setActivities([activity, ...activities]);
      setNewActivity({ type: 'call', title: '', description: '', scheduledDate: '' });
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
    if (!selectedActivity) return;

    setIsSendingNotification(true);

    const updatedActivities = activities.map((a) =>
      a.id === selectedActivity.id
        ? {
            ...a,
            status: 'completed' as ActivityStatus,
            completedDate: new Date(),
            comment: completeForm.comment,
            attachmentName: completeForm.attachmentName || undefined,
          }
        : a
    );

    setActivities(updatedActivities);
    setIsCompletingActivity(false);

    // Send email notification for completed activity
    await sendActivityNotification(
      selectedActivity.type,
      selectedActivity.title,
      new Date().toISOString(),
      'completed',
      completeForm.comment
    );

    setSelectedActivity(null);
    setCompleteForm({ comment: '', attachmentName: '' });
    setIsSendingNotification(false);

    toast({
      title: 'Activité terminée',
      description: 'L\'activité a été marquée comme terminée.',
    });
  };

  const handleCancelActivity = (activityId: string) => {
    const updatedActivities = activities.map((a) =>
      a.id === activityId ? { ...a, status: 'cancelled' as ActivityStatus } : a
    );
    setActivities(updatedActivities);

    toast({
      title: 'Activité annulée',
      description: 'L\'activité a été annulée.',
    });
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
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nouvelle activité</DialogTitle>
                <DialogDescription>
                  Planifiez une nouvelle activité pour cette requête
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 mt-4">
                <div>
                  <Label className="mb-2 block">Type d'activité</Label>
                  <RadioGroup
                    value={newActivity.type}
                    onValueChange={(value) => setNewActivity({ ...newActivity, type: value as ActivityType })}
                    className="grid grid-cols-2 gap-2"
                  >
                    {(Object.keys(activityTypeLabels) as ActivityType[]).map((type) => (
                      <div key={type}>
                        <RadioGroupItem
                          value={type}
                          id={`type-${type}`}
                          className="peer sr-only"
                        />
                        <Label
                          htmlFor={`type-${type}`}
                          className={cn(
                            'flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all',
                            'hover:bg-accent/50',
                            newActivity.type === type
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-border'
                          )}
                        >
                          {activityTypeIcons[type]}
                          <span className="text-sm">{activityTypeLabels[type]}</span>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

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

                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button onClick={handleAddActivity}>
                    Planifier l'activité
                  </Button>
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
              {selectedActivity?.title}
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
              <Label htmlFor="attachment">Pièce jointe (compte-rendu)</Label>
              <div className="mt-1 flex gap-2">
                <Input
                  id="attachment"
                  value={completeForm.attachmentName}
                  onChange={(e) => setCompleteForm({ ...completeForm, attachmentName: e.target.value })}
                  placeholder="Nom du fichier..."
                  className="flex-1"
                />
                <Button variant="outline" size="icon">
                  <Upload className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Joignez un PV, compte-rendu ou autre document si disponible
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
            <div className="space-y-2 max-h-64 overflow-y-auto">
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
                            {activityTypeIcons[activity.type]}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{activity.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {activityTypeLabels[activity.type]}
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
                          {activityTypeIcons[activity.type]}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm">{activity.title}</p>
                            <Badge variant="outline" className="text-status-resolved border-status-resolved/30">
                              Terminé
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {activityTypeLabels[activity.type]}
                          </p>
                          {activity.comment && (
                            <div className="mt-2 p-2 rounded bg-muted/50">
                              <p className="text-xs font-medium text-muted-foreground mb-1">
                                Compte-rendu:
                              </p>
                              <p className="text-sm">{activity.comment}</p>
                            </div>
                          )}
                          {activity.attachmentName && (
                            <Button
                              variant="link"
                              size="sm"
                              className="h-auto p-0 mt-2"
                            >
                              <Paperclip className="w-3 h-3 mr-1" />
                              {activity.attachmentName}
                            </Button>
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
                          {activityTypeIcons[activity.type]}
                        </div>
                        <div>
                          <p className="font-medium text-sm line-through">{activity.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {activityTypeLabels[activity.type]} - Annulé
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
  );
}
