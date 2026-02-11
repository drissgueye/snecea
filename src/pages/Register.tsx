import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { companies as mockCompanies } from '@/lib/mock-data';
import { apiRequest } from '@/lib/api';

type Company = {
  id: number;
  nom: string;
  code: string;
};

export default function Register() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [companyOptions, setCompanyOptions] = useState<Company[]>([]);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    companyId: '',
    password: '',
    confirmPassword: '',
  });

  useEffect(() => {
    const loadCompanies = async () => {
      try {
        const data = await apiRequest<{ results: Company[] }>('/entreprises/', {
          auth: false,
        });
        setCompanyOptions(data.results ?? []);
      } catch {
        setCompanyOptions(
          mockCompanies.map((company) => ({
            id: Number(company.id),
            nom: company.name,
            code: company.code,
          }))
        );
      }
    };

    loadCompanies();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: 'Erreur',
        description: 'Les mots de passe ne correspondent pas.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      await apiRequest('/auth/register/', {
        method: 'POST',
        auth: false,
        body: JSON.stringify({
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          telephone: formData.phone,
          entreprise_id: formData.companyId ? Number(formData.companyId) : null,
          password: formData.password,
        }),
      });

      toast({
        title: 'Compte créé !',
        description: 'Vous pouvez maintenant vous connecter.',
      });

      navigate('/login');
    } catch (error: any) {
      const serverMessage =
        error?.data?.email?.[0] ||
        error?.data?.password?.[0] ||
        error?.data?.first_name?.[0] ||
        error?.data?.last_name?.[0] ||
        error?.data?.entreprise_id?.[0] ||
        error?.data?.non_field_errors?.[0] ||
        error?.data?.detail ||
        (error?.data ? JSON.stringify(error.data) : null);
      toast({
        title: 'Erreur',
        description:
          serverMessage ??
          "Impossible de créer le compte. Vérifiez vos informations.",
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel - Branding */}
      <div 
        className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12"
        style={{ background: 'var(--gradient-sidebar)' }}
      >
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-sidebar-primary rounded-xl flex items-center justify-center">
              <span className="text-sidebar-primary-foreground font-bold text-xl">SN</span>
            </div>
            <span className="text-2xl font-bold text-sidebar-foreground">SNECEA</span>
          </div>
        </div>

        <div className="space-y-6">
          <h1 className="text-4xl font-bold text-sidebar-foreground leading-tight">
            Rejoignez le S.N.E.C.E.A
          </h1>
          <p className="text-lg text-sidebar-foreground/80">
            Créez votre compte pour accéder à tous les services de la plateforme : soumission de requêtes, suivi des dossiers, documents et communications.
          </p>
          <ul className="space-y-3 text-sidebar-foreground/80">
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-sidebar-primary rounded-full" />
              Soumettez vos requêtes en ligne
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-sidebar-primary rounded-full" />
              Suivez l'avancement en temps réel
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-sidebar-primary rounded-full" />
              Contactez vos délégués
            </li>
          </ul>
        </div>

        <p className="text-sm text-sidebar-foreground/60">
          © 2026 SNECEA. Tous droits réservés.
        </p>
      </div>

      {/* Right panel - Register form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                <span className="text-primary-foreground font-bold">SN</span>
              </div>
              <span className="text-xl font-bold">SNECEA</span>
            </div>
          </div>

          <div className="text-center lg:text-left">
            <h2 className="text-2xl font-bold">Créer un compte</h2>
            <p className="text-muted-foreground mt-2">
              Inscrivez-vous pour accéder à la plateforme
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">Prénom *</Label>
                <Input
                  id="firstName"
                  placeholder="Votre prénom"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  required
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="lastName">Nom *</Label>
                <Input
                  id="lastName"
                  placeholder="Votre nom"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  required
                  className="mt-1.5"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="company">Compagnie *</Label>
              <Select
                value={formData.companyId}
                onValueChange={(value) => setFormData({ ...formData, companyId: value })}
                required
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Sélectionnez votre compagnie" />
                </SelectTrigger>
                <SelectContent>
                  {companyOptions.map((company) => (
                    <SelectItem key={company.id} value={company.id.toString()}>
                      {company.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="email">Adresse email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="votre.email@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="phone">Téléphone</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+221 77 123 45 67"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="password">Mot de passe *</Label>
              <div className="relative mt-1.5">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  minLength={8}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Minimum 8 caractères
              </p>
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirmer le mot de passe *</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required
                className="mt-1.5"
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                'Création...'
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Créer mon compte
                </>
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Déjà inscrit ?{' '}
            <Link to="/login" className="text-primary font-medium hover:underline">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
