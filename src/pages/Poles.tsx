import { useEffect, useMemo, useState } from 'react';
import { Layers, Mail, Plus, Trash2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { poleMembers, users as mockUsers } from '@/lib/mock-data';
import { apiRequest } from '@/lib/api';
import type { PoleMember } from '@/types';

type ApiPole = {
  id: number;
  nom: string;
  description?: string;
};

type PaginatedResponse<T> = {
  results: T[];
  count: number;
  next: string | null;
  previous: string | null;
};

type ApiPoleMember = {
  id: number;
  user_id?: number;
  user_first_name?: string;
  user_last_name?: string;
  user_email?: string;
  role: 'head' | 'assistant' | 'member';
};

type ApiProfile = {
  id: number;
  prenom?: string;
  nom?: string;
  email?: string;
};

export default function Poles() {
  const [polesList, setPolesList] = useState<ApiPole[]>([]);
  const [selectedPoleId, setSelectedPoleId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [membersByPole, setMembersByPole] = useState<Record<string, PoleMember[]>>(() => {
    return poleMembers.reduce((acc, member) => {
      acc[member.poleId] = [...(acc[member.poleId] ?? []), member];
      return acc;
    }, {} as Record<string, PoleMember[]>);
  });
  const [usersList, setUsersList] = useState(mockUsers);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [isPoleDialogOpen, setIsPoleDialogOpen] = useState(false);
  const [newPoleName, setNewPoleName] = useState('');
  const [newPoleDescription, setNewPoleDescription] = useState('');

  useEffect(() => {
    const loadPoles = async () => {
      try {
        setIsLoading(true);
        const data = await apiRequest<PaginatedResponse<ApiPole>>('/poles/');
        setPolesList(data.results);
        setSelectedPoleId((prev) => prev || (data.results[0]?.id?.toString() ?? ''));
        setErrorMessage(null);
      } catch (error) {
        setErrorMessage("Impossible de charger la liste des pôles.");
      } finally {
        setIsLoading(false);
      }
    };

    const loadUsers = async () => {
      try {
        const data = await apiRequest<PaginatedResponse<ApiProfile>>('/profils/');
        setUsersList(
          data.results.map((profile) => ({
            id: profile.id.toString(),
            firstName: profile.prenom ?? '',
            lastName: profile.nom ?? '',
            email: profile.email ?? '',
            companyId: '',
            role: 'member',
            createdAt: new Date(),
          }))
        );
      } catch {
        setUsersList(mockUsers);
      }
    };

    loadPoles();
    loadUsers();
  }, []);

  useEffect(() => {
    const loadMembers = async () => {
      if (!selectedPoleId) {
        return;
      }
      try {
        const data = await apiRequest<ApiPoleMember[]>(`/poles/${selectedPoleId}/members/`);
        const mapped: PoleMember[] = data.map((member) => ({
          id: member.id.toString(),
          poleId: selectedPoleId,
          userId: member.user_id?.toString() ?? '',
          role: member.role,
        }));
        setMembersByPole((prev) => ({ ...prev, [selectedPoleId]: mapped }));
      } catch {
        // keep existing
      }
    };

    loadMembers();
  }, [selectedPoleId]);

  const selectedPole = useMemo(
    () =>
      polesList.find((pole) => pole.id.toString() === selectedPoleId) ??
      polesList[0],
    [polesList, selectedPoleId]
  );

  const memberEntries = membersByPole[selectedPole?.id ?? ''] ?? [];
  const isAtCapacity = memberEntries.length >= 6;
  const members = memberEntries
    .map((entry) => ({
      entry,
      user: usersList.find((user) => user.id === entry.userId),
    }))
    .filter(
      (item): item is { entry: PoleMember; user: (typeof usersList)[number] } => !!item.user
    );

  const availableUsers = usersList.filter(
    (user) => !memberEntries.some((entry) => entry.userId === user.id)
  );

  const handleAddMember = async () => {
    if (!selectedPole || !selectedUserId) {
      return;
    }

    if (memberEntries.length >= 6) {
      return;
    }

    const hasHead = memberEntries.some((entry) => entry.role === 'head');
    const hasAssistant = memberEntries.some((entry) => entry.role === 'assistant');
    const nextRole = !hasHead ? 'head' : !hasAssistant ? 'assistant' : 'member';

    try {
      const created = await apiRequest<ApiPoleMember>(`/poles/${selectedPole.id}/members/`, {
        method: 'POST',
        body: JSON.stringify({
          user_id: Number(selectedUserId),
          role: nextRole,
        }),
      });
      setMembersByPole((prev) => ({
        ...prev,
        [selectedPole.id]: [
          ...(prev[selectedPole.id] ?? []),
          {
            id: created.id.toString(),
            poleId: selectedPole.id,
            userId: created.user_id?.toString() ?? selectedUserId,
            role: created.role,
          },
        ],
      }));
    } catch {
      return;
    }

    setSelectedUserId('');
    setIsAddDialogOpen(false);
  };

  const handleRemoveMember = async (userId: string) => {
    if (!selectedPole) {
      return;
    }

    const member = (membersByPole[selectedPole.id] ?? []).find((entry) => entry.userId === userId);
    if (!member) {
      return;
    }
    try {
      await apiRequest(`/pole-members/${member.id}/`, { method: 'DELETE' });
      setMembersByPole((prev) => ({
        ...prev,
        [selectedPole.id]: (prev[selectedPole.id] ?? []).filter((entry) => entry.userId !== userId),
      }));
    } catch {
      return;
    }
  };

  const handleCreatePole = async () => {
    const trimmedName = newPoleName.trim();
    if (!trimmedName) {
      return;
    }

    try {
      const created = await apiRequest<ApiPole>('/poles/', {
        method: 'POST',
        body: JSON.stringify({
          nom: trimmedName,
          description: newPoleDescription.trim() || '',
          types_problemes: [],
        }),
      });
      setPolesList((prev) => [...prev, created]);
      setSelectedPoleId(created.id.toString());
      setNewPoleName('');
      setNewPoleDescription('');
      setIsPoleDialogOpen(false);
    } catch (error) {
      setErrorMessage("Impossible de créer le pôle.");
    }
  };

  const canRemoveMember = (entry: PoleMember) => {
    if (!selectedPole) {
      return false;
    }
    if (entry.role !== 'head') {
      return true;
    }
    const otherHeadExists = memberEntries.some(
      (member) => member.role === 'head' && member.userId !== entry.userId
    );
    return otherHeadExists;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pôles</h1>
          <p className="text-muted-foreground mt-1">
            Consultez la liste des pôles, leurs détails et gérez les membres associés.
          </p>
        </div>
        <Button onClick={() => setIsPoleDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Créer un pôle
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 h-fit">
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-primary" />
                Liste des pôles
              </CardTitle>
              <CardDescription>{polesList.length} pôle(s)</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => setIsPoleDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Créer
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {isLoading ? (
              <div className="text-sm text-muted-foreground">Chargement...</div>
            ) : errorMessage ? (
              <div className="text-sm text-destructive">{errorMessage}</div>
            ) : (
              polesList.map((pole) => (
              <button
                key={pole.id}
                type="button"
                onClick={() => setSelectedPoleId(pole.id.toString())}
                className={cn(
                  'w-full rounded-lg border px-4 py-3 text-left transition-colors',
                  'hover:bg-accent/50',
                  selectedPole?.id === pole.id ? 'border-primary bg-primary/5' : 'border-border'
                )}
              >
                <div className="font-medium">{pole.nom}</div>
                {pole.description && (
                  <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {pole.description}
                  </div>
                )}
              </button>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span>Détails du pôle</span>
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" onClick={() => setIsPoleDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Créer un pôle
                </Button>
                <Button onClick={() => setIsAddDialogOpen(true)} disabled={isAtCapacity}>
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter un membre
                </Button>
              </div>
            </CardTitle>
            <CardDescription>
              {selectedPole?.nom ?? 'Sélectionnez un pôle'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {selectedPole ? (
              <>
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Description</div>
                  <div className="text-sm">
                    {selectedPole.description || 'Aucune description disponible.'}
                  </div>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">Membres du pôle</span>
                  </div>
                  <Badge variant="secondary">{members.length} membre(s)</Badge>
                </div>
                {isAtCapacity && (
                  <p className="text-xs text-muted-foreground">
                    Limite atteinte : 6 membres maximum par pôle.
                  </p>
                )}

                <div className="space-y-3">
                  {members.length === 0 ? (
                    <div className="text-sm text-muted-foreground">
                      Aucun membre associé à ce pôle pour le moment.
                    </div>
                  ) : (
                    members.map(({ entry, user }) => (
                      <div
                        key={entry.id}
                        className="flex items-center justify-between rounded-lg border p-3"
                      >
                        <div className="min-w-0">
                          <div className="font-medium">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                            <Mail className="w-3 h-3" />
                            <span className="truncate">{user.email}</span>
                          </div>
                          <div className="mt-2">
                            <Badge variant={entry.role === 'head' ? 'default' : 'secondary'}>
                              {entry.role === 'head'
                                ? 'Chef de pôle'
                                : entry.role === 'assistant'
                                  ? 'Assistant'
                                  : 'Membre'}
                            </Badge>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          disabled={!canRemoveMember(entry)}
                          onClick={() => handleRemoveMember(user.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </>
            ) : (
              <div className="text-sm text-muted-foreground">
                Sélectionnez un pôle dans la liste pour afficher ses détails.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-end rounded-xl border bg-card p-4">
        <Button onClick={() => setIsPoleDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Créer un pôle
        </Button>
      </div>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un membre</DialogTitle>
            <DialogDescription>
              Sélectionnez un utilisateur à associer au pôle.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger>
                <SelectValue placeholder="Choisir un utilisateur" />
              </SelectTrigger>
              <SelectContent>
                {availableUsers.length === 0 ? (
                  <SelectItem value="none" disabled>
                    Aucun utilisateur disponible
                  </SelectItem>
                ) : (
                  availableUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.firstName} {user.lastName} — {user.email}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleAddMember} disabled={!selectedUserId}>
              Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isPoleDialogOpen} onOpenChange={setIsPoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Créer un pôle</DialogTitle>
            <DialogDescription>
              Renseignez le nom et la description du nouveau pôle.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nom du pôle</label>
              <Input
                value={newPoleName}
                onChange={(e) => setNewPoleName(e.target.value)}
                placeholder="Ex: Formation et Carrière"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={newPoleDescription}
                onChange={(e) => setNewPoleDescription(e.target.value)}
                placeholder="Décrivez la mission principale du pôle..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPoleDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreatePole} disabled={!newPoleName.trim()}>
              Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
