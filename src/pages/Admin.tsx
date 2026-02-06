import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { 
  Users, 
  Building2, 
  Layers, 
  UserCheck,
  Plus,
  Pencil,
  Trash2,
  Search,
  Shield,
  Mail,
  Phone
} from 'lucide-react';
import { users, companies, poles, delegates } from '@/lib/mock-data';
import type { User, Company, Pole, Delegate, UserRole } from '@/types';

const roleLabels: Record<UserRole, string> = {
  admin: 'Administrateur',
  pole_manager: 'Responsable Pôle',
  delegate: 'Délégué',
  member: 'Membre',
};

const roleBadgeVariants: Record<UserRole, string> = {
  admin: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  pole_manager: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  delegate: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  member: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
};

export default function Admin() {
  const [activeTab, setActiveTab] = useState('users');
  const [searchQuery, setSearchQuery] = useState('');

  // Users state
  const [usersList, setUsersList] = useState<User[]>(users);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);

  // Companies state
  const [companiesList, setCompaniesList] = useState<Company[]>(companies);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [isCompanyDialogOpen, setIsCompanyDialogOpen] = useState(false);

  // Poles state
  const [polesList, setPolesList] = useState<Pole[]>(poles);
  const [editingPole, setEditingPole] = useState<Pole | null>(null);
  const [isPoleDialogOpen, setIsPoleDialogOpen] = useState(false);

  // Delegates state
  const [delegatesList, setDelegatesList] = useState<Delegate[]>(delegates);
  const [editingDelegate, setEditingDelegate] = useState<Delegate | null>(null);
  const [isDelegateDialogOpen, setIsDelegateDialogOpen] = useState(false);

  const getCompanyName = (companyId: string) => {
    return companiesList.find(c => c.id === companyId)?.name || 'N/A';
  };

  const filteredUsers = usersList.filter(user => 
    `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCompanies = companiesList.filter(company =>
    company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    company.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPoles = polesList.filter(pole =>
    pole.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredDelegates = delegatesList.filter(delegate =>
    `${delegate.user.firstName} ${delegate.user.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <Shield className="w-8 h-8 text-primary" />
          Administration
        </h1>
        <p className="text-muted-foreground mt-1">
          Gérez les utilisateurs, compagnies, pôles et délégués de la plateforme
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 max-w-2xl">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Utilisateurs</span>
          </TabsTrigger>
          <TabsTrigger value="companies" className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            <span className="hidden sm:inline">Compagnies</span>
          </TabsTrigger>
          <TabsTrigger value="poles" className="flex items-center gap-2">
            <Layers className="w-4 h-4" />
            <span className="hidden sm:inline">Pôles</span>
          </TabsTrigger>
          <TabsTrigger value="delegates" className="flex items-center gap-2">
            <UserCheck className="w-4 h-4" />
            <span className="hidden sm:inline">Délégués</span>
          </TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Utilisateurs</CardTitle>
                <CardDescription>
                  {filteredUsers.length} utilisateur{filteredUsers.length > 1 ? 's' : ''} enregistré{filteredUsers.length > 1 ? 's' : ''}
                </CardDescription>
              </div>
              <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => setEditingUser(null)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Ajouter
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingUser ? 'Modifier' : 'Ajouter'} un utilisateur</DialogTitle>
                    <DialogDescription>
                      {editingUser ? 'Modifiez les informations de l\'utilisateur' : 'Créez un nouveau compte utilisateur'}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">Prénom</Label>
                        <Input id="firstName" defaultValue={editingUser?.firstName} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Nom</Label>
                        <Input id="lastName" defaultValue={editingUser?.lastName} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" defaultValue={editingUser?.email} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Téléphone</Label>
                      <Input id="phone" defaultValue={editingUser?.phone} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="company">Compagnie</Label>
                        <Select defaultValue={editingUser?.companyId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner" />
                          </SelectTrigger>
                          <SelectContent>
                            {companiesList.map(company => (
                              <SelectItem key={company.id} value={company.id}>
                                {company.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="role">Rôle</Label>
                        <Select defaultValue={editingUser?.role || 'member'}>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Administrateur</SelectItem>
                            <SelectItem value="pole_manager">Responsable Pôle</SelectItem>
                            <SelectItem value="delegate">Délégué</SelectItem>
                            <SelectItem value="member">Membre</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsUserDialogOpen(false)}>
                      Annuler
                    </Button>
                    <Button onClick={() => setIsUserDialogOpen(false)}>
                      {editingUser ? 'Enregistrer' : 'Créer'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Compagnie</TableHead>
                    <TableHead>Rôle</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map(user => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {user.firstName} {user.lastName}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="w-3 h-3" />
                          {user.email}
                        </div>
                      </TableCell>
                      <TableCell>{getCompanyName(user.companyId)}</TableCell>
                      <TableCell>
                        <Badge className={roleBadgeVariants[user.role]}>
                          {roleLabels[user.role]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditingUser(user);
                              setIsUserDialogOpen(true);
                            }}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Supprimer l'utilisateur ?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Cette action est irréversible. L'utilisateur {user.firstName} {user.lastName} sera définitivement supprimé.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                <AlertDialogAction 
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  onClick={() => setUsersList(usersList.filter(u => u.id !== user.id))}
                                >
                                  Supprimer
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Companies Tab */}
        <TabsContent value="companies">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Compagnies</CardTitle>
                <CardDescription>
                  {filteredCompanies.length} compagnie{filteredCompanies.length > 1 ? 's' : ''} enregistrée{filteredCompanies.length > 1 ? 's' : ''}
                </CardDescription>
              </div>
              <Dialog open={isCompanyDialogOpen} onOpenChange={setIsCompanyDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => setEditingCompany(null)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Ajouter
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingCompany ? 'Modifier' : 'Ajouter'} une compagnie</DialogTitle>
                    <DialogDescription>
                      {editingCompany ? 'Modifiez les informations de la compagnie' : 'Ajoutez une nouvelle compagnie'}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="companyName">Nom de la compagnie</Label>
                      <Input id="companyName" defaultValue={editingCompany?.name} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="companyCode">Code</Label>
                      <Input id="companyCode" defaultValue={editingCompany?.code} placeholder="Ex: AS, SA..." />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCompanyDialogOpen(false)}>
                      Annuler
                    </Button>
                    <Button onClick={() => setIsCompanyDialogOpen(false)}>
                      {editingCompany ? 'Enregistrer' : 'Créer'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Utilisateurs</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCompanies.map(company => {
                    const userCount = usersList.filter(u => u.companyId === company.id).length;
                    return (
                      <TableRow key={company.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-muted-foreground" />
                            {company.name}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{company.code}</Badge>
                        </TableCell>
                        <TableCell>{userCount} utilisateur{userCount > 1 ? 's' : ''}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setEditingCompany(company);
                                setIsCompanyDialogOpen(true);
                              }}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Supprimer la compagnie ?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Cette action est irréversible. La compagnie {company.name} sera définitivement supprimée.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                                  <AlertDialogAction 
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    onClick={() => setCompaniesList(companiesList.filter(c => c.id !== company.id))}
                                  >
                                    Supprimer
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Poles Tab */}
        <TabsContent value="poles">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Pôles</CardTitle>
                <CardDescription>
                  {filteredPoles.length} pôle{filteredPoles.length > 1 ? 's' : ''} configuré{filteredPoles.length > 1 ? 's' : ''}
                </CardDescription>
              </div>
              <Dialog open={isPoleDialogOpen} onOpenChange={setIsPoleDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => setEditingPole(null)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Ajouter
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingPole ? 'Modifier' : 'Ajouter'} un pôle</DialogTitle>
                    <DialogDescription>
                      {editingPole ? 'Modifiez les informations du pôle' : 'Créez un nouveau pôle de gestion'}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="poleName">Nom du pôle</Label>
                      <Input id="poleName" defaultValue={editingPole?.name} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="poleDescription">Description</Label>
                      <Textarea 
                        id="poleDescription" 
                        defaultValue={editingPole?.description} 
                        placeholder="Décrivez les responsabilités de ce pôle..."
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsPoleDialogOpen(false)}>
                      Annuler
                    </Button>
                    <Button onClick={() => setIsPoleDialogOpen(false)}>
                      {editingPole ? 'Enregistrer' : 'Créer'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPoles.map(pole => (
                    <TableRow key={pole.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Layers className="w-4 h-4 text-muted-foreground" />
                          {pole.name}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground max-w-md truncate">
                        {pole.description || '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditingPole(pole);
                              setIsPoleDialogOpen(true);
                            }}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Supprimer le pôle ?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Cette action est irréversible. Le pôle {pole.name} sera définitivement supprimé.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                <AlertDialogAction 
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  onClick={() => setPolesList(polesList.filter(p => p.id !== pole.id))}
                                >
                                  Supprimer
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Delegates Tab */}
        <TabsContent value="delegates">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Délégués</CardTitle>
                <CardDescription>
                  {filteredDelegates.length} délégué{filteredDelegates.length > 1 ? 's' : ''} actif{filteredDelegates.length > 1 ? 's' : ''}
                </CardDescription>
              </div>
              <Dialog open={isDelegateDialogOpen} onOpenChange={setIsDelegateDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => setEditingDelegate(null)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Ajouter
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingDelegate ? 'Modifier' : 'Ajouter'} un délégué</DialogTitle>
                    <DialogDescription>
                      {editingDelegate ? 'Modifiez les informations du délégué' : 'Désignez un nouveau délégué syndical'}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="delegateUser">Utilisateur</Label>
                      <Select defaultValue={editingDelegate?.userId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un utilisateur" />
                        </SelectTrigger>
                        <SelectContent>
                          {usersList.map(user => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.firstName} {user.lastName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="delegateCompany">Compagnie</Label>
                      <Select defaultValue={editingDelegate?.companyId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner une compagnie" />
                        </SelectTrigger>
                        <SelectContent>
                          {companiesList.map(company => (
                            <SelectItem key={company.id} value={company.id}>
                              {company.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="delegateEmail">Email</Label>
                        <Input id="delegateEmail" type="email" defaultValue={editingDelegate?.email} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="delegatePhone">Téléphone</Label>
                        <Input id="delegatePhone" defaultValue={editingDelegate?.phone} />
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="delegateActive" defaultChecked={editingDelegate?.isActive ?? true} />
                      <Label htmlFor="delegateActive">Délégué actif</Label>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsDelegateDialogOpen(false)}>
                      Annuler
                    </Button>
                    <Button onClick={() => setIsDelegateDialogOpen(false)}>
                      {editingDelegate ? 'Enregistrer' : 'Créer'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Compagnie</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDelegates.map(delegate => (
                    <TableRow key={delegate.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <UserCheck className="w-4 h-4 text-muted-foreground" />
                          {delegate.user.firstName} {delegate.user.lastName}
                        </div>
                      </TableCell>
                      <TableCell>{delegate.company.name}</TableCell>
                      <TableCell>
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Mail className="w-3 h-3" />
                            {delegate.email}
                          </div>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Phone className="w-3 h-3" />
                            {delegate.phone}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={delegate.isActive 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                        }>
                          {delegate.isActive ? 'Actif' : 'Inactif'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditingDelegate(delegate);
                              setIsDelegateDialogOpen(true);
                            }}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Supprimer le délégué ?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Cette action est irréversible. Le délégué {delegate.user.firstName} {delegate.user.lastName} sera définitivement supprimé.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                <AlertDialogAction 
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  onClick={() => setDelegatesList(delegatesList.filter(d => d.id !== delegate.id))}
                                >
                                  Supprimer
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
