import { useState } from 'react';
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
import { supabase } from '@/integrations/supabase/client';

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

interface ActivityTrackerProps {
  ticketId: string;
  ticketReference?: string;
  ticketSubject?: string;
  recipientEmail?: string;
  recipientName?: string;
  canManage: boolean;
}

// Mock activities data
const mockActivities: Activity[] = [
  {
    id: '1',
    type: 'call',
    title: 'Appel avec les RH',
    description: 'Premier contact avec le service RH pour discuter du dossier',
    scheduledDate: new Date('2026-01-27'),
    completedDate: new Date('2026-01-27'),
    status: 'completed',
    comment: 'RH a confirmé la réception du dossier. En attente de réponse sous 48h.',
    createdBy: 'Fatou Sow',
    createdAt: new Date('2026-01-26'),
  },
  {
    id: '2',
    type: 'meeting',
    title: 'Réunion tripartite',
    description: 'Réunion avec l\'employé, le délégué et les RH',
    scheduledDate: new Date('2026-02-03'),
    status: 'planned',
    createdBy: 'Fatou Sow',
    createdAt: new Date('2026-01-27'),
  },
];

export function ActivityTracker({ 
  ticketId, 
  ticketReference = 'REQ-XXXX', 
  ticketSubject = '',
  recipientEmail,
  recipientName,
  canManage 
}: ActivityTrackerProps) {
  const { toast } = useToast();
  const [activities, setActivities] = useState<Activity[]>(mockActivities);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [isCompletingActivity, setIsCompletingActivity] = useState(false);
  const [isSendingNotification, setIsSendingNotification] = useState(false);
  
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
    activityType: ActivityType,
    activityTitle: string,
    activityDate: string,
    notificationType: 'planned' | 'completed',
    completionComment?: string
  ) => {
    if (!recipientEmail) {
      console.log('No recipient email provided, skipping notification');
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('send-activity-notification', {
        body: {
          recipientEmail,
          recipientName: recipientName || '',
          ticketReference,
          ticketSubject,
          activityType,
          activityTitle,
          activityDate,
          notificationType,
          completionComment,
        },
      });

      if (error) {
        console.error('Error sending notification:', error);
        toast({
          title: 'Notification non envoyée',
          description: 'L\'email de notification n\'a pas pu être envoyé.',
          variant: 'destructive',
        });
      } else {
        console.log('Notification sent:', data);
        toast({
          title: 'Notification envoyée',
          description: `L'adhérent a été notifié par email.`,
        });
      }
    } catch (err) {
      console.error('Error calling notification function:', err);
    }
  };

  const handleAddActivity = async () => {
    if (!newActivity.title || !newActivity.scheduledDate) {
      toast({
        title: 'Champs requis',
        description: 'Veuillez remplir le titre et la date.',
        variant: 'destructive',
      });
      return;
    }

    setIsSendingNotification(true);

    const activity: Activity = {
      id: Date.now().toString(),
      type: newActivity.type,
      title: newActivity.title,
      description: newActivity.description,
      scheduledDate: new Date(newActivity.scheduledDate),
      status: 'planned',
      createdBy: 'Utilisateur actuel',
      createdAt: new Date(),
    };

    setActivities([activity, ...activities]);
    setNewActivity({ type: 'call', title: '', description: '', scheduledDate: '' });
    setIsDialogOpen(false);
    
    // Send email notification
    await sendActivityNotification(
      activity.type,
      activity.title,
      activity.scheduledDate.toISOString(),
      'planned'
    );

    setIsSendingNotification(false);
    
    toast({
      title: 'Activité ajoutée',
      description: 'L\'activité a été planifiée avec succès.',
    });
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
          <Badge variant="secondary">{activities.length}</Badge>
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
        {activities.length === 0 ? (
          <p className="text-center text-muted-foreground py-6">
            Aucune activité planifiée
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
