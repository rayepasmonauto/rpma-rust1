'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, FileText, Filter } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { useQuotesList, QuoteStatusBadge, computeQuoteStats } from '@/domains/quotes';
import { formatCents } from '@/domains/quotes/utils/formatting';
import { PageShell } from '@/shared/ui/layout/PageShell';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { QuoteStatus } from '@/shared/types';

type ActiveTab = 'all' | 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired' | 'converted';

export default function QuotesPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<ActiveTab>('all');

  const { quotes, total, loading, error, updateFilters } = useQuotesList({
    autoFetch: true,
  });

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    updateFilters({ search: value || undefined });
  };

  const handleTabChange = (tab: ActiveTab) => {
    setActiveTab(tab);
    updateFilters({
      status: tab !== 'all' ? tab as QuoteStatus : undefined,
    });
  };

  const stats = useMemo(() => {
    const baseStats = computeQuoteStats(quotes, total);
    return {
      ...baseStats,
      draft: quotes.filter(q => q.status === 'draft').length,
      sent: quotes.filter(q => q.status === 'sent').length,
      accepted: quotes.filter(q => q.status === 'accepted').length,
      rejected: quotes.filter(q => q.status === 'rejected').length,
      expired: quotes.filter(q => q.status === 'expired').length,
      converted: quotes.filter(q => q.status === 'converted').length,
    };
  }, [quotes, total]);

  const filteredQuotes = useMemo(() => {
    if (activeTab === 'all') return quotes;
    return quotes.filter(q => q.status === activeTab);
  }, [quotes, activeTab]);

  useEffect(() => {
    if (error?.message) {
      toast.error(error.message);
    }
  }, [error]);

  return (
    <PageShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Devis</h1>
            <p className="text-sm text-gray-500 mt-1">
              {total} devis au total
            </p>
          </div>
          <Link
            href="/quotes/new"
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Nouveau devis
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: 'Total', value: stats.total, color: 'text-gray-900' },
            { label: 'Brouillons', value: stats.draft, color: 'text-gray-600' },
            { label: 'Envoyés', value: stats.sent, color: 'text-blue-600' },
            { label: 'Acceptés', value: stats.accepted, color: 'text-green-600' },
            { label: 'Convertis', value: stats.converted, color: 'text-purple-600' },
          ].map(stat => (
            <div key={stat.label} className="rounded-lg border bg-white p-4">
              <p className="text-sm text-gray-500">{stat.label}</p>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Status Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => handleTabChange(v as ActiveTab)}>
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="all">Tous ({total})</TabsTrigger>
            <TabsTrigger value="draft">Brouillons ({stats.draft})</TabsTrigger>
            <TabsTrigger value="sent">Envoyés ({stats.sent})</TabsTrigger>
            <TabsTrigger value="accepted">Acceptés ({stats.accepted})</TabsTrigger>
            <TabsTrigger value="rejected">Refusés ({stats.rejected})</TabsTrigger>
            <TabsTrigger value="expired">Expirés ({stats.expired})</TabsTrigger>
            <TabsTrigger value="converted">Convertis ({stats.converted})</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un devis..."
              value={searchQuery}
              onChange={e => handleSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && updateFilters({ search: searchQuery })}
              className="w-full rounded-md border border-gray-300 pl-10 pr-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={() => updateFilters({ search: searchQuery })}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Filtrer
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
            {error.message}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          </div>
        )}

        {/* Quote list */}
        {!loading && !error && filteredQuotes.length === 0 && (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">Aucun devis</h3>
            <p className="mt-2 text-sm text-gray-500">
              {activeTab === 'all' 
                ? 'Commencez par créer un nouveau devis.'
                : `Aucun devis ${activeTab}`}
            </p>
            <Link
              href="/quotes/new"
              className="mt-4 inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Créer un devis
            </Link>
          </div>
        )}

        {!loading && !error && filteredQuotes.length > 0 && (
          <div className="overflow-hidden rounded-lg border bg-white">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    N° Devis
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Véhicule
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    Total
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredQuotes.map(quote => {
                  return (
                    <tr
                      key={quote.id}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => router.push(`/quotes/${quote.id}`)}
                    >
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                        {quote.quote_number}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <QuoteStatusBadge status={quote.status} />
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        {[quote.vehicle_make, quote.vehicle_model, quote.vehicle_plate]
                          .filter(Boolean)
                          .join(' ') || '—'}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium text-gray-900">
                        {formatCents(quote.total)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-500">
                        {new Date(quote.created_at).toLocaleDateString('fr-FR')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PageShell>
  );
}
