import { useEffect, useState } from 'react';
import { Search, Phone, Mail, Building2, User } from 'lucide-react';
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
import { delegates as mockDelegates, companies as mockCompanies } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import { apiRequest } from '@/lib/api';

type ApiCompany = {
  id: number;
  nom: string;
  code: string;
};

type ApiDelegate = {
  id: number;
  user_id: number;
  user_first_name?: string;
  user_last_name?: string;
  user_email?: string;
  entreprise?: {
    id: number;
    nom: string;
    code: string;
  } | null;
  telephone?: string;
  email?: string;
  is_active?: boolean;
};

export default function Delegates() {
  const [searchQuery, setSearchQuery] = useState('');
  const [companyFilter, setCompanyFilter] = useState('all');
  const [delegatesList, setDelegatesList] = useState(mockDelegates);
  const [companiesList, setCompaniesList] = useState(mockCompanies);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadCompanies = async () => {
      try {
        const data = await apiRequest<{ results: ApiCompany[] }>('/entreprises/', {
          auth: false,
        });
        setCompaniesList(
          data.results.map((company) => ({
            id: company.id.toString(),
            name: company.nom,
            code: company.code,
          }))
        );
      } catch {
        setCompaniesList(mockCompanies);
      }
    };

    const loadDelegates = async () => {
      try {
        const deleguesRes = await apiRequest<{ results: ApiDelegate[] }>('/delegues/');

        const list = deleguesRes.results.map((delegate) => {
          const company = delegate.entreprise
            ? {
                id: delegate.entreprise.id.toString(),
                name: delegate.entreprise.nom,
                code: delegate.entreprise.code,
              }
            : { id: '', name: 'N/A', code: '' };
          return {
            id: delegate.id.toString(),
            userId: delegate.user_id?.toString() ?? '',
            user: {
              id: delegate.user_id?.toString() ?? '',
              firstName: delegate.user_first_name ?? '',
              lastName: delegate.user_last_name ?? '',
              email: delegate.user_email ?? delegate.email ?? '',
              companyId: company.id,
              role: 'delegate',
              createdAt: new Date(),
            },
            companyId: company.id,
            company,
            phone: delegate.telephone ?? '',
            email: delegate.email ?? delegate.user_email ?? '',
            isActive: delegate.is_active ?? true,
          };
        });

        setDelegatesList(list);
        setErrorMessage(null);
      } catch {
        setDelegatesList(mockDelegates);
        setErrorMessage("Impossible de charger la liste des délégués.");
      } finally {
        setIsLoading(false);
      }
    };

    loadCompanies();
    loadDelegates();
  }, []);

  const filteredDelegates = delegatesList.filter((delegate) => {
    const fullName = `${delegate.user.firstName} ${delegate.user.lastName}`.toLowerCase();
    const matchesSearch = fullName.includes(searchQuery.toLowerCase());
    const matchesCompany = companyFilter === 'all' || delegate.companyId === companyFilter;
    return matchesSearch && matchesCompany && delegate.isActive;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Annuaire des délégués</h1>
        <p className="text-muted-foreground mt-1">
          Trouvez et contactez les délégués syndicaux de votre compagnie.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un délégué..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={companyFilter} onValueChange={setCompanyFilter}>
          <SelectTrigger className="w-full sm:w-64">
            <SelectValue placeholder="Toutes les compagnies" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les compagnies</SelectItem>
            {companiesList.map((company) => (
              <SelectItem key={company.id} value={company.id}>
                {company.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Delegates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            Chargement des délégués...
          </div>
        ) : errorMessage ? (
          <div className="col-span-full text-center py-12 text-destructive">
            {errorMessage}
          </div>
        ) : filteredDelegates.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Aucun délégué trouvé</p>
          </div>
        ) : (
          filteredDelegates.map((delegate) => (
            <div
              key={delegate.id}
              className="bg-card rounded-xl border shadow-card p-6 card-interactive"
            >
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                  <span className="text-lg font-bold text-primary">
                    {delegate.user.firstName[0]}{delegate.user.lastName[0]}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">
                    {delegate.user.firstName} {delegate.user.lastName}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {delegate.company.name}
                    </span>
                  </div>
                  <Badge variant="secondary" className="mt-2">
                    Délégué syndical
                  </Badge>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <a
                    href={`tel:${delegate.phone}`}
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    {delegate.phone}
                  </a>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <a
                    href={`mailto:${delegate.email}`}
                    className="text-muted-foreground hover:text-primary transition-colors truncate"
                  >
                    {delegate.email}
                  </a>
                </div>
              </div>

              <div className="mt-6 flex gap-2">
                <Button className="flex-1" asChild>
                  <a href={`tel:${delegate.phone}`}>
                    <Phone className="w-4 h-4 mr-2" />
                    Appeler
                  </a>
                </Button>
                <Button variant="outline" className="flex-1" asChild>
                  <a href={`mailto:${delegate.email}`}>
                    <Mail className="w-4 h-4 mr-2" />
                    Email
                  </a>
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Summary */}
      <p className="text-sm text-muted-foreground">
        {filteredDelegates.length} délégué(s) trouvé(s)
      </p>
    </div>
  );
}
