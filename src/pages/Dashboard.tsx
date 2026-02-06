import { FileText, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { RecentTickets } from '@/components/dashboard/RecentTickets';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { CompanyInsights } from '@/components/dashboard/CompanyInsights';
import { currentUser, memberDashboardStats } from '@/lib/mock-data';

export default function Dashboard() {
  const stats = memberDashboardStats;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Bonjour, {currentUser.firstName} 👋
        </h1>
        <p className="text-muted-foreground mt-1">
          Bienvenue sur votre espace S.N.E.C.E.A. Voici un aperçu de vos requêtes.
        </p>
      </div>

      {/* Quick Actions */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Actions rapides</h2>
        <QuickActions />
      </section>

      {/* Stats */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Mes statistiques</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Requêtes en cours"
            value={stats.ticketsInProgress}
            icon={Clock}
            variant="warning"
          />
          <StatsCard
            title="Requêtes clôturées"
            value={stats.ticketsClosed}
            icon={CheckCircle}
            variant="success"
          />
          <StatsCard
            title="Total requêtes"
            value={stats.ticketsInProgress + stats.ticketsClosed}
            icon={FileText}
            variant="primary"
          />
          <StatsCard
            title="En attente d'infos"
            value={stats.ticketsByStatus.info_needed}
            description="Action requise"
            icon={AlertTriangle}
            variant="danger"
          />
        </div>
      </section>

      {/* Recent Tickets */}
      <section>
        <RecentTickets tickets={stats.recentTickets} />
      </section>

      <CompanyInsights />
    </div>
  );
}
