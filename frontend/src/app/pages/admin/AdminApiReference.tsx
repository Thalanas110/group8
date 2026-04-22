import React, { useMemo, useState } from 'react';
import {
  BookOpen,
  Server,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import {
  API_ENDPOINTS,
  docsApi,
  PHP_BASE_URL,
  type ApiDocsVerifyCheck,
  type ApiDocsVerifyResult,
  type HttpMethod,
} from '../../services/api';
import { toast } from 'sonner';
import { endpointKey, GROUP_ORDER } from '../../features/admin/api-reference/lib/api-reference';
import { CopyButton } from '../../features/admin/api-reference/components/CopyButton';
import { GroupSection } from '../../features/admin/api-reference/components/EndpointCard';
import { PhpBackendPanel } from '../../features/admin/api-reference/components/PhpBackendPanel';
import { VerificationPanel } from '../../features/admin/api-reference/components/VerificationPanel';

type VerifyState = 'idle' | 'loading' | 'verified' | 'error';

export function AdminApiReference() {
  const [filter, setFilter] = useState<'all' | HttpMethod>('all');
  const [search, setSearch] = useState('');
  const [verifyState, setVerifyState] = useState<VerifyState>('idle');
  const [verifyError, setVerifyError] = useState('');
  const [verifyResult, setVerifyResult] = useState<ApiDocsVerifyResult | null>(null);

  const filtered = API_ENDPOINTS.filter(endpoint => {
    const matchesMethod = filter === 'all' || endpoint.method === filter;
    const query = search.toLowerCase();
    const matchesSearch = query === ''
      || endpoint.path.toLowerCase().includes(query)
      || endpoint.description.toLowerCase().includes(query)
      || endpoint.group.toLowerCase().includes(query);

    return matchesMethod && matchesSearch;
  });

  const grouped = GROUP_ORDER
    .map(group => ({
      group,
      endpoints: filtered.filter(endpoint => endpoint.group === group),
    }))
    .filter(group => group.endpoints.length > 0);

  const methodCounts: Record<string, number> = {};
  API_ENDPOINTS.forEach(endpoint => {
    methodCounts[endpoint.method] = (methodCounts[endpoint.method] || 0) + 1;
  });

  const verifyIndex = useMemo(() => {
    const map = new Map<string, ApiDocsVerifyCheck>();
    (verifyResult?.checks ?? []).forEach(check => {
      map.set(endpointKey(check.method, check.path), check);
    });
    return map;
  }, [verifyResult]);

  const handleVerify = async () => {
    setVerifyState('loading');
    setVerifyError('');
    try {
      const result = await docsApi.verify();
      setVerifyResult(result);
      setVerifyState('verified');

      if (result.summary.missing === 0) {
        toast.success(`All ${result.summary.required} required endpoints were verified.`);
      } else {
        toast.error(`${result.summary.missing} required endpoints are missing in backend route code.`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setVerifyError(message);
      setVerifyState('error');
      toast.error(`Endpoint verification failed: ${message}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <h1 className="text-2xl font-bold text-gray-900">API Reference + Verification</h1>
          </div>
          <p className="text-sm text-gray-500">
            <strong>GROUP 8</strong> - Online Examination System - <span className="text-emerald-700 font-medium">Swagger-style route verification</span>
          </p>
        </div>
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm">
          <Server className="w-4 h-4 text-gray-400" />
          <span className="text-gray-500">Base URL:</span>
          <code className="font-mono text-blue-700 text-xs truncate max-w-xs">{PHP_BASE_URL}</code>
          <CopyButton text={PHP_BASE_URL} />
        </div>
      </div>

      <VerificationPanel
        state={verifyState}
        result={verifyResult}
        errorMessage={verifyError}
        onVerify={handleVerify}
      />

      <PhpBackendPanel />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Endpoints', value: API_ENDPOINTS.length, icon: BookOpen },
          { label: 'GET', value: methodCounts.GET ?? 0, icon: Server },
          { label: 'POST', value: methodCounts.POST ?? 0, icon: Zap },
          { label: 'PUT / DELETE', value: (methodCounts.PUT ?? 0) + (methodCounts.DELETE ?? 0), icon: ShieldCheck },
        ].map(card => (
          <div key={card.label} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
            <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <card.icon className="w-4.5 h-4.5 text-gray-600" />
            </div>
            <div>
              <div className="text-xl font-bold text-gray-900">{card.value}</div>
              <div className="text-xs text-gray-500">{card.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-48">
          <input
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder="Search endpoints..."
            className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {(['all', 'GET', 'POST', 'PUT', 'DELETE'] as const).map(method => (
            <button
              key={method}
              onClick={() => setFilter(method)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === method
                  ? 'bg-gray-900 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {method === 'all' ? `All (${API_ENDPOINTS.length})` : method}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        {grouped.length > 0 ? (
          grouped.map(({ group, endpoints }) => (
            <GroupSection key={group} group={group} endpoints={endpoints} verifyIndex={verifyIndex} />
          ))
        ) : (
          <div className="text-center py-12 text-gray-400 text-sm">No endpoints match your search.</div>
        )}
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-xl px-5 py-4 text-xs text-gray-500">
        <strong className="text-gray-700">Verification note:</strong>{' '}
        clicking <code className="bg-white border border-gray-200 px-1.5 py-0.5 rounded font-mono">Verify Endpoints</code>{' '}
        calls <code className="bg-white border border-gray-200 px-1.5 py-0.5 rounded font-mono">GET /api/docs/verify</code>{' '}
        and checks your required routes directly against backend route source files.
      </div>
    </div>
  );
}
