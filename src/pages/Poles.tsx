import { useMemo, useState } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { poleMembers, poles, users } from '@/lib/mock-data';
import type { PoleMember } from '@/types';

export default function Poles() {
  const [polesList] = useState(poles);
  const [selectedPoleId, setSelectedPoleId] = useState(polesList[0]?.id ?? '');
  const [membersByPole, setMembersByPole] = useState<Record<string, PoleMember[]>>(() => {
    return poleMembers.reduce((acc, member) => {
      acc[member.poleId] = [...(acc[member.poleId] ?? []), member];
      return acc;
    }, {} as Record<string, PoleMember[]>);
  });
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');

  const selectedPole = useMemo(
    () => polesList.find((pole) => pole.id === selectedPoleId) ?? polesList[0],
    [polesList, selectedPoleId]
  );

  const memberEntries = membersByPole[selectedPole?.id ?? ''] ?? [];
  const members = memberEntries
    .map((entry) => ({
      entry,
      user: users.find((user) => user.id === entry.userId),
    }))
    .filter((item): item is { entry: PoleMember; user: (typeof users)[number] } => !!item.user);

  const availableUsers = users.filter(
    (user) => !memberEntries.some((entry) => entry.userId === user.id)
  );

  const handleAddMember = () => {
    if (!selectedPole || !selectedUserId) {
      return;
    }

    const nextRole = memberEntries.length === 0 ? 'head' : 'assistant';

    setMembersByPole((prev) => ({
      ...prev,
      [selectedPole.id]: [
        ...(prev[selectedPole.id] ?? []),
        {
          id: `pm-${selectedPole.id}-${selectedUserId}`,
          poleId: selectedPole.id,
          userId: selectedUserId,
          role: nextRole,
        },
      ],
    }));

    setSelectedUserId('');
    setIsAddDialogOpen(false);
  };

  const handleRemoveMember = (userId: string) => {
    if (!selectedPole) {
      return;
    }

    setMembersByPole((prev) => ({
      ...prev,
      [selectedPole.id]: (prev[selectedPole.id] ?? []).filter((entry) => entry.userId !== userId),
    }));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pôles</h1>
        <p className="text-muted-foreground mt-1">
          Consultez la liste des pôles, leurs détails et gérez les membres associés.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-primary" />
              Liste des pôles
            </CardTitle>
            <CardDescription>{polesList.length} pôle(s)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {polesList.map((pole) => (
              <button
                key={pole.id}
                type="button"
                onClick={() => setSelectedPoleId(pole.id)}
                className={cn(
                  'w-full rounded-lg border px-4 py-3 text-left transition-colors',
                  'hover:bg-accent/50',
                  selectedPole?.id === pole.id ? 'border-primary bg-primary/5' : 'border-border'
                )}
              >
                <div className="font-medium">{pole.name}</div>
                {pole.description && (
                  <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {pole.description}
                  </div>
                )}
              </button>
            ))}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Détails du pôle</span>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Ajouter un membre
              </Button>
            </CardTitle>
            <CardDescription>
              {selectedPole?.name ?? 'Sélectionnez un pôle'}
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
                              {entry.role === 'head' ? 'Chef de pôle' : 'Assistant'}
                            </Badge>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
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
    </div>
  );
}
