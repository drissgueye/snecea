import { useState } from 'react';
import { Search, Megaphone, Calendar, User, Paperclip, Globe, Building2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { communicationPosts, companies } from '@/lib/mock-data';
import { cn } from '@/lib/utils';

const visibilityLabels = {
  global: 'Tous les adhérents',
  company: 'Par compagnie',
  pole: 'Par pôle',
};

const visibilityIcons = {
  global: Globe,
  company: Building2,
  pole: Megaphone,
};

export default function Communication() {
  const [searchQuery, setSearchQuery] = useState('');
  const [visibilityFilter, setVisibilityFilter] = useState('all');

  const filteredPosts = communicationPosts.filter((post) => {
    const matchesSearch =
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesVisibility =
      visibilityFilter === 'all' || post.visibility === visibilityFilter;
    return matchesSearch && matchesVisibility;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Communication syndicale</h1>
        <p className="text-muted-foreground mt-1">
          Restez informé des actualités et annonces du S.N.E.C.E.A.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher une publication..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={visibilityFilter} onValueChange={setVisibilityFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Visibilité" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes</SelectItem>
            <SelectItem value="global">Globales</SelectItem>
            <SelectItem value="company">Par compagnie</SelectItem>
            <SelectItem value="pole">Par pôle</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Posts */}
      <div className="space-y-6">
        {filteredPosts.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-xl border">
            <Megaphone className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Aucune publication trouvée</p>
          </div>
        ) : (
          filteredPosts.map((post) => {
            const VisibilityIcon = visibilityIcons[post.visibility];
            const targetCompany =
              post.visibility === 'company'
                ? companies.find((c) => c.id === post.targetId)
                : null;

            return (
              <article
                key={post.id}
                className="bg-card rounded-xl border shadow-card overflow-hidden card-interactive"
              >
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <Megaphone className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <VisibilityIcon className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {visibilityLabels[post.visibility]}
                            {targetCompany && ` — ${targetCompany.name}`}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                          <Calendar className="w-3 h-3" />
                          {new Date(post.createdAt).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Title */}
                  <h2 className="text-xl font-bold mb-3">{post.title}</h2>

                  {/* Content */}
                  <p className="text-muted-foreground leading-relaxed">
                    {post.content}
                  </p>

                  {/* Attachments */}
                  {post.attachments.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {post.attachments.map((file) => (
                        <Badge
                          key={file.id}
                          variant="secondary"
                          className="cursor-pointer hover:bg-secondary/80"
                        >
                          <Paperclip className="w-3 h-3 mr-1" />
                          {file.name}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <Separator className="my-4" />

                  {/* Author */}
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-secondary-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {post.author.firstName} {post.author.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Bureau national
                      </p>
                    </div>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>

      {/* Summary */}
      <p className="text-sm text-muted-foreground">
        {filteredPosts.length} publication(s)
      </p>
    </div>
  );
}
