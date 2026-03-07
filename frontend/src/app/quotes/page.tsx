'use client';

import { useRouter } from 'next/navigation';
import { Plus, FileText, Search, TrendingUp, TrendingDown } from 'lucide-react';
import Link from 'next/link';
import { PageShell } from '@/shared/ui/layout/PageShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { QuotesListTable, QuotesStatusTabs } from '@/domains/quotes';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { FadeIn } from '@/shared/ui/animations/FadeIn';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import { useQuotesPage } from '@/domains/quotes';

export default function QuotesPage() {
  const router = useRouter();
  const {
    searchQuery,
    activeTab,
    clientsLoading,
    quotes,
    quotesWithClients,
    total,
    loading,
    stats,
    pieChartData,
    monthlyData,
    trend,
    statusTabs,
    handleSearch,
    handleSearchSubmit,
    handleStatusChange,
    handleDeleteQuote,
    handleViewQuote,
    handleEditQuote,
    handleDuplicateQuote,
    handleConvertQuote,
    handleExportQuote,
  } = useQuotesPage();

  return (
    <PageShell>
      <FadeIn>
        <PageHeader
          title="Devis"
          subtitle={`${total} devis au total`}
          actions={
            <Link href="/quotes/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nouveau devis
              </Button>
            </Link>
          }
        />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total', value: stats.total, color: 'text-foreground', trend },
            { label: 'Brouillons', value: stats.draft, color: 'text-muted-foreground', trend: null },
            { label: 'Envoyés', value: stats.sent, color: 'text-primary', trend: null },
            { label: 'Acceptés', value: stats.accepted, color: 'text-green-600 dark:text-green-400', trend: null },
          ].map(stat => (
            <div key={stat.label} className="rounded-lg border bg-card p-4">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <div className="flex items-baseline gap-2">
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                {stat.trend !== null && stat.trend !== 0 && (
                  <span className={`flex items-center text-xs ${stat.trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {stat.trend > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {Math.abs(stat.trend)}%
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Répartition par statut</CardTitle>
            </CardHeader>
            <CardContent>
              {pieChartData.length > 0 ? (
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {pieChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                  Aucune donnée
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Tendance mensuelle</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--primary))' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <QuotesStatusTabs
          activeTab={activeTab}
          tabs={statusTabs}
          onTabChange={handleStatusChange}
        />

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="quote-search"
              type="text"
              placeholder="Rechercher un devis... (⌘K)"
              value={searchQuery}
              onChange={e => handleSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearchSubmit()}
              className="pl-10"
            />
          </div>
          <Button onClick={handleSearchSubmit}>
            Rechercher
          </Button>
        </div>

        {quotes.length === 0 && !loading ? (
          <EmptyState
            icon={<FileText className="h-12 w-12" />}
            title="Aucun devis"
            description="Commencez par créer votre premier devis pour un client."
            action={{
              label: 'Créer un devis',
              onClick: () => router.push('/quotes/new'),
              icon: <Plus className="h-4 w-4" />,
            }}
          />
        ) : (
          <QuotesListTable
            quotes={quotesWithClients}
            loading={loading || clientsLoading}
            onRowClick={handleViewQuote}
            onView={handleViewQuote}
            onEdit={handleEditQuote}
            onDuplicate={handleDuplicateQuote}
            onDelete={handleDeleteQuote}
            onConvert={handleConvertQuote}
            onExport={handleExportQuote}
          />
        )}
      </FadeIn>
    </PageShell>
  );
}
