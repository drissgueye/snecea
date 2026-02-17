import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, tokenStorage } from '@/lib/api';

type Profile = {
  id: number;
  user: string;
  role: string;
  nom?: string;
  prenom?: string;
  date_naissance?: string;
  lieu_naissance?: string;
  sexe?: string;
  nationalite?: string;
  numero_piece_identite?: string;
  adresse_residence?: string;
  telephone?: string;
  email?: string;
  entreprise?: {
    id: number;
    nom: string;
    code: string;
  } | null;
  poste?: string;
  departement?: string;
  type_contrat?: string;
  date_embauche?: string;
  matricule_interne?: string;
  lieu_travail?: string;
  premiere_adhesion?: boolean;
  ancien_syndicat?: boolean;
  nom_ancien_syndicat?: string;
  motivation_adhesion?: string;
  engagement_statuts?: boolean;
  consentement_donnees?: boolean;
  date_adhesion?: string;
  photo?: string;
  signature?: string;
  piece_identite?: string;
  contrat_travail?: string;
  photo_identite?: string;
  dernier_bulletin_salaire?: string;
};

type ProfileForm = {
  nom: string;
  prenom: string;
  date_naissance: string;
  lieu_naissance: string;
  sexe: string;
  nationalite: string;
  numero_piece_identite: string;
  adresse_residence: string;
  telephone: string;
  email: string;
  poste: string;
  departement: string;
  type_contrat: string;
  date_embauche: string;
  matricule_interne: string;
  lieu_travail: string;
  premiere_adhesion: string;
  ancien_syndicat: string;
  nom_ancien_syndicat: string;
  motivation_adhesion: string;
  engagement_statuts: string;
  consentement_donnees: string;
  date_adhesion: string;
};

export default function Profile() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [formData, setFormData] = useState<ProfileForm | null>(null);
  const [files, setFiles] = useState<Record<string, File | null>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        if (!tokenStorage.getAccess()) {
          navigate('/login');
          return;
        }
        setIsLoading(true);
        const data = await apiRequest<Profile>('/profils/me/');
        setProfile(data);
        setFormData({
          nom: data.nom ?? '',
          prenom: data.prenom ?? '',
          date_naissance: data.date_naissance ?? '',
          lieu_naissance: data.lieu_naissance ?? '',
          sexe: data.sexe ?? '',
          nationalite: data.nationalite ?? '',
          numero_piece_identite: data.numero_piece_identite ?? '',
          adresse_residence: data.adresse_residence ?? '',
          telephone: data.telephone ?? '',
          email: data.email ?? '',
          poste: data.poste ?? '',
          departement: data.departement ?? '',
          type_contrat: data.type_contrat ?? '',
          date_embauche: data.date_embauche ?? '',
          matricule_interne: data.matricule_interne ?? '',
          lieu_travail: data.lieu_travail ?? '',
          premiere_adhesion: data.premiere_adhesion ? 'true' : 'false',
          ancien_syndicat: data.ancien_syndicat ? 'true' : 'false',
          nom_ancien_syndicat: data.nom_ancien_syndicat ?? '',
          motivation_adhesion: data.motivation_adhesion ?? '',
          engagement_statuts: data.engagement_statuts ? 'true' : 'false',
          consentement_donnees: data.consentement_donnees ? 'true' : 'false',
          date_adhesion: data.date_adhesion ?? '',
        });
        setErrorMessage(null);
      } catch (error) {
        tokenStorage.clear();
        navigate('/login');
        setErrorMessage("Impossible de charger le profil.");
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleChange = (field: keyof ProfileForm, value: string) => {
    if (!formData) {
      return;
    }
    setFormData({ ...formData, [field]: value });
  };

  const handleFileChange = (field: string, file: File | null) => {
    setFiles((prev) => ({ ...prev, [field]: file }));
  };

  const handleSubmit = async () => {
    if (!formData) {
      return;
    }
    try {
      setIsSaving(true);
      const payload = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== '') {
          payload.append(key, value);
        }
      });
      Object.entries(files).forEach(([key, file]) => {
        if (file) {
          payload.append(key, file);
        }
      });
      const updated = await apiRequest<Profile>('/profils/me/', {
        method: 'PATCH',
        body: payload,
      });
      setProfile(updated);
      toast({
        title: 'Profil mis à jour',
        description: 'Vos informations ont été enregistrées.',
      });
    } catch (error) {
      toast({
        title: 'Échec de mise à jour',
        description: "Impossible d'enregistrer les informations.",
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Chargement du profil...</div>;
  }

  if (errorMessage) {
    return <div className="text-sm text-destructive">{errorMessage}</div>;
  }

  if (!profile) {
    return <div className="text-sm text-muted-foreground">Aucun profil trouvé.</div>;
  }

  const entrepriseLabel = profile.entreprise?.nom ?? '—';
  const roleLabels: Record<string, string> = {
    admin: 'Administrateur',
    pole_manager: 'Responsable de pôle',
    head: 'Chef de pôle (membre)',
    assistant: 'Assistant de pôle',
    delegate: 'Délégué',
    member: 'Membre',
  };
  const roleLabel = profile.role ? roleLabels[profile.role] ?? profile.role : '—';
  const fileUrl = (value?: string) => {
    if (!value) {
      return null;
    }
    if (value.startsWith('http')) {
      return value;
    }
    return `http://127.0.0.1:8000${value}`;
  };
  const photoUrl = fileUrl(profile.photo);
  const signatureUrl = fileUrl(profile.signature);
  const pieceIdentiteUrl = fileUrl(profile.piece_identite);
  const contratUrl = fileUrl(profile.contrat_travail);
  const photoIdentiteUrl = fileUrl(profile.photo_identite);
  const bulletinUrl = fileUrl(profile.dernier_bulletin_salaire);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Mon profil</h1>
        <p className="text-muted-foreground mt-1">
          Consultez et complétez vos informations personnelles.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informations personnelles</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <div className="text-xs text-muted-foreground">Rôle</div>
            <div className="text-sm font-medium">{roleLabel}</div>
          </div>
          <div />
          <div>
            <div className="text-xs text-muted-foreground">Nom</div>
            <Input value={formData?.nom ?? ''} onChange={(e) => handleChange('nom', e.target.value)} />
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Prénom</div>
            <Input value={formData?.prenom ?? ''} onChange={(e) => handleChange('prenom', e.target.value)} />
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Date de naissance</div>
            <Input type="date" value={formData?.date_naissance ?? ''} onChange={(e) => handleChange('date_naissance', e.target.value)} />
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Lieu de naissance</div>
            <Input value={formData?.lieu_naissance ?? ''} onChange={(e) => handleChange('lieu_naissance', e.target.value)} />
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Sexe</div>
            <Select value={formData?.sexe ?? ''} onValueChange={(value) => handleChange('sexe', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="masculin">Masculin</SelectItem>
                <SelectItem value="feminin">Féminin</SelectItem>
                <SelectItem value="autre">Autre</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Nationalité</div>
            <Input value={formData?.nationalite ?? ''} onChange={(e) => handleChange('nationalite', e.target.value)} />
          </div>
          <div>
            <div className="text-xs text-muted-foreground">N° pièce d'identité</div>
            <Input value={formData?.numero_piece_identite ?? ''} onChange={(e) => handleChange('numero_piece_identite', e.target.value)} />
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Adresse</div>
            <Input value={formData?.adresse_residence ?? ''} onChange={(e) => handleChange('adresse_residence', e.target.value)} />
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Téléphone</div>
            <Input value={formData?.telephone ?? ''} onChange={(e) => handleChange('telephone', e.target.value)} />
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Email</div>
            <Input type="email" value={formData?.email ?? ''} onChange={(e) => handleChange('email', e.target.value)} />
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Photo</div>
            <Input type="file" onChange={(e) => handleFileChange('photo', e.target.files?.[0] ?? null)} />
            {photoUrl && (
              <img src={photoUrl} alt="Photo de profil" className="mt-2 h-24 w-24 rounded-full object-cover" />
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Informations professionnelles</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <div className="text-xs text-muted-foreground">Entreprise</div>
            <div className="text-sm">{entrepriseLabel}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Poste</div>
            <Input value={formData?.poste ?? ''} onChange={(e) => handleChange('poste', e.target.value)} />
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Département</div>
            <Input value={formData?.departement ?? ''} onChange={(e) => handleChange('departement', e.target.value)} />
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Type de contrat</div>
            <Select value={formData?.type_contrat ?? ''} onValueChange={(value) => handleChange('type_contrat', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cdi">CDI</SelectItem>
                <SelectItem value="cdd">CDD</SelectItem>
                <SelectItem value="stage">Stage</SelectItem>
                <SelectItem value="journalier">Journalier</SelectItem>
                <SelectItem value="interim">Intérim</SelectItem>
                <SelectItem value="autre">Autre</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Date d'embauche</div>
            <Input type="date" value={formData?.date_embauche ?? ''} onChange={(e) => handleChange('date_embauche', e.target.value)} />
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Matricule interne</div>
            <Input value={formData?.matricule_interne ?? ''} onChange={(e) => handleChange('matricule_interne', e.target.value)} />
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Lieu de travail</div>
            <Input value={formData?.lieu_travail ?? ''} onChange={(e) => handleChange('lieu_travail', e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Situation syndicale</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <div className="text-xs text-muted-foreground">Première adhésion</div>
            <Select value={formData?.premiere_adhesion ?? 'false'} onValueChange={(value) => handleChange('premiere_adhesion', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Oui</SelectItem>
                <SelectItem value="false">Non</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Ancien syndicat</div>
            <Select value={formData?.ancien_syndicat ?? 'false'} onValueChange={(value) => handleChange('ancien_syndicat', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Oui</SelectItem>
                <SelectItem value="false">Non</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Nom ancien syndicat</div>
            <Input value={formData?.nom_ancien_syndicat ?? ''} onChange={(e) => handleChange('nom_ancien_syndicat', e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <div className="text-xs text-muted-foreground">Motivation</div>
            <Textarea value={formData?.motivation_adhesion ?? ''} onChange={(e) => handleChange('motivation_adhesion', e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Engagement et acceptation</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <div className="text-xs text-muted-foreground">Statuts et règlement</div>
            <Select value={formData?.engagement_statuts ?? 'false'} onValueChange={(value) => handleChange('engagement_statuts', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Oui</SelectItem>
                <SelectItem value="false">Non</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Consentement données</div>
            <Select value={formData?.consentement_donnees ?? 'false'} onValueChange={(value) => handleChange('consentement_donnees', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Oui</SelectItem>
                <SelectItem value="false">Non</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Date d'adhésion</div>
            <Input type="date" value={formData?.date_adhesion ?? ''} onChange={(e) => handleChange('date_adhesion', e.target.value)} />
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Signature</div>
            <Input type="file" onChange={(e) => handleFileChange('signature', e.target.files?.[0] ?? null)} />
            {signatureUrl && (
              <img src={signatureUrl} alt="Signature" className="mt-2 h-16 w-auto object-contain" />
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pièces à fournir</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <div className="text-xs text-muted-foreground">Pièce d'identité</div>
            <Input type="file" onChange={(e) => handleFileChange('piece_identite', e.target.files?.[0] ?? null)} />
            {pieceIdentiteUrl && (
              <a href={pieceIdentiteUrl} className="mt-2 block text-sm text-primary hover:underline" target="_blank" rel="noreferrer">
                Voir la pièce d'identité
              </a>
            )}
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Contrat de travail</div>
            <Input type="file" onChange={(e) => handleFileChange('contrat_travail', e.target.files?.[0] ?? null)} />
            {contratUrl && (
              <a href={contratUrl} className="mt-2 block text-sm text-primary hover:underline" target="_blank" rel="noreferrer">
                Voir le contrat de travail
              </a>
            )}
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Photo d'identité</div>
            <Input type="file" onChange={(e) => handleFileChange('photo_identite', e.target.files?.[0] ?? null)} />
            {photoIdentiteUrl && (
              <img src={photoIdentiteUrl} alt="Photo d'identité" className="mt-2 h-24 w-24 rounded object-cover" />
            )}
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Dernier bulletin de salaire</div>
            <Input type="file" onChange={(e) => handleFileChange('dernier_bulletin_salaire', e.target.files?.[0] ?? null)} />
            {bulletinUrl && (
              <a href={bulletinUrl} className="mt-2 block text-sm text-primary hover:underline" target="_blank" rel="noreferrer">
                Voir le bulletin de salaire
              </a>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSubmit} disabled={isSaving}>
          {isSaving ? 'Enregistrement...' : 'Enregistrer'}
        </Button>
      </div>
    </div>
  );
}
