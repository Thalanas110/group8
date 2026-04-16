import React, { useMemo, useState } from 'react';
import {
  BadgeCheck,
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  CircleDashed,
  Copy,
  Globe,
  Lock,
  RefreshCw,
  Server,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Zap,
} from 'lucide-react';
import {
  API_ENDPOINTS,
  PHP_BASE_URL,
  dataApi,
  docsApi,
  type ApiDocsVerifyCheck,
  type ApiDocsVerifyResult,
  type EndpointDoc,
  type HttpMethod,
} from '../../services/api';
import { toast } from 'sonner';

type VerifyState = 'idle' | 'loading' | 'verified' | 'error';

const METHOD_STYLES: Record<HttpMethod, { pill: string; panel: string }> = {
  GET: {
    pill: 'bg-blue-50 text-blue-700 border border-blue-200',
    panel: 'border-l-4 border-l-blue-500',
  },
  POST: {
    pill: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    panel: 'border-l-4 border-l-emerald-500',
  },
  PUT: {
    pill: 'bg-amber-50 text-amber-700 border border-amber-200',
    panel: 'border-l-4 border-l-amber-500',
  },
  DELETE: {
    pill: 'bg-rose-50 text-rose-700 border border-rose-200',
    panel: 'border-l-4 border-l-rose-500',
  },
  PATCH: {
    pill: 'bg-cyan-50 text-cyan-700 border border-cyan-200',
    panel: 'border-l-4 border-l-cyan-500',
  },
};

const GROUP_ORDER = ['Auth', 'Profile & Users', 'Exams', 'Results', 'Admin & Reporting'];

function normalizePath(path: string): string {
  let normalized = path.trim();
  if (normalized.startsWith('/api/')) {
    normalized = normalized.slice(4);
  }

  if (normalized === '') {
    normalized = '/';
  }

  normalized = normalized.replace(/:[a-zA-Z_][a-zA-Z0-9_]*/g, '{param}');
  normalized = normalized.replace(/\{[a-zA-Z_][a-zA-Z0-9_]*\}/g, '{param}');
  return normalized;
}

function endpointKey(method: string, path: string): string {
  return `${method.toUpperCase()} ${normalizePath(path)}`;
}

function MethodBadge({ method }: { method: HttpMethod }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold tracking-wide font-mono ${METHOD_STYLES[method].pill}`}>
      {method}
    </span>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button
      onClick={copy}
      className="p-1.5 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-700 transition-colors"
      aria-label="Copy"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

function VerificationBadge({ check }: { check?: ApiDocsVerifyCheck }) {
  if (!check) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full border border-gray-200">
        <CircleDashed className="w-3 h-3" />
        Not verified
      </span>
    );
  }

  if (check.exists) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
        <BadgeCheck className="w-3 h-3" />
        Verified
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 text-[11px] text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
      <ShieldAlert className="w-3 h-3" />
      Missing
    </span>
  );
}

function PhpBackendPanel() {
  const [reseeding, setReseeding] = useState(false);

  const handleReseed = async () => {
    setReseeding(true);
    try {
      const result = await dataApi.reseed();
      toast.success(result.message || 'Database reseeded successfully.');
    } catch (err) {
      toast.error(`Reseed failed: ${err}`);
    } finally {
      setReseeding(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
        <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center">
          <Server className="w-4.5 h-4.5 text-blue-600" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Backend Configuration</h2>
          <p className="text-xs text-gray-500">Frontend is locked to your PHP backend.</p>
        </div>
      </div>

      <div className="p-6 space-y-4">
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
          <div className="text-xs uppercase tracking-wider text-blue-600 font-semibold mb-2">PHP Base URL</div>
          <div className="flex items-center gap-2">
            <code className="text-xs font-mono text-blue-700 break-all">{PHP_BASE_URL}</code>
            <CopyButton text={PHP_BASE_URL} />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleReseed}
            disabled={reseeding}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-60 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${reseeding ? 'animate-spin' : ''}`} />
            {reseeding ? 'Reseeding...' : 'Reset Database to Seed Data'}
          </button>
          <div className="text-xs text-gray-500">
            Runs <code className="bg-gray-100 px-1 rounded font-mono">POST /api/data/reseed</code> on the PHP backend.
          </div>
        </div>
      </div>
    </div>
  );
}

function VerificationPanel({
  state,
  result,
  errorMessage,
  onVerify,
}: {
  state: VerifyState;
  result: ApiDocsVerifyResult | null;
  errorMessage: string;
  onVerify: () => void;
}) {
  const matched = result?.summary.matched ?? 0;
  const required = result?.summary.required ?? 13;
  const missing = result?.summary.missing ?? 0;

  return (
    <div className="rounded-2xl overflow-hidden border border-gray-900 bg-gray-950 text-gray-100">
      <div className="px-6 py-4 border-b border-gray-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gray-800 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">Swagger-style Backend Verification</h2>
            <p className="text-xs text-gray-400">Checks required endpoints against backend route source code.</p>
          </div>
        </div>
        <button
          onClick={onVerify}
          disabled={state === 'loading'}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 text-gray-950 font-semibold text-sm hover:bg-emerald-400 disabled:opacity-60 transition-colors"
        >
          <Sparkles className={`w-4 h-4 ${state === 'loading' ? 'animate-pulse' : ''}`} />
          {state === 'loading' ? 'Verifying...' : 'Verify Endpoints'}
        </button>
      </div>

      <div className="px-6 py-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-xl border border-gray-800 bg-gray-900 px-4 py-3">
            <div className="text-xs text-gray-400 mb-1">Required</div>
            <div className="text-xl font-bold">{required}</div>
          </div>
          <div className="rounded-xl border border-gray-800 bg-gray-900 px-4 py-3">
            <div className="text-xs text-gray-400 mb-1">Verified</div>
            <div className="text-xl font-bold text-emerald-400">{matched}</div>
          </div>
          <div className="rounded-xl border border-gray-800 bg-gray-900 px-4 py-3">
            <div className="text-xs text-gray-400 mb-1">Missing</div>
            <div className={`text-xl font-bold ${missing > 0 ? 'text-rose-400' : 'text-gray-100'}`}>{missing}</div>
          </div>
        </div>

        {state === 'error' && (
          <div className="mt-3 text-xs text-rose-300 bg-rose-950/30 border border-rose-700 rounded-lg px-3 py-2">
            Verification failed: {errorMessage}
          </div>
        )}

        {result && (
          <div className="mt-3 text-xs text-gray-400">
            Last run: <span className="text-gray-200 font-mono">{new Date(result.generatedAt).toLocaleString()}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function EndpointCard({ ep, check }: { ep: EndpointDoc; check?: ApiDocsVerifyCheck }) {
  const [open, setOpen] = useState(false);
  const baseUrl = PHP_BASE_URL;

  return (
    <div className={`border border-gray-200 rounded-xl overflow-hidden bg-white ${METHOD_STYLES[ep.method].panel}`}>
      <button
        className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors text-left"
        onClick={() => setOpen(!open)}
      >
        <MethodBadge method={ep.method} />
        <code className="flex-1 text-sm font-mono font-medium text-gray-800 truncate">{ep.path}</code>
        <VerificationBadge check={check} />
        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
          {ep.auth ? (
            <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              <Lock className="w-3 h-3" />
              Auth
            </span>
          ) : (
            <span className="flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
              <Globe className="w-3 h-3" />
              Public
            </span>
          )}
          {ep.role && (
            <span className="text-xs text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded-full border border-cyan-200 hidden md:inline">
              {ep.role}
            </span>
          )}
          {open ? (
            <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
          )}
        </div>
      </button>

      {open && (
        <div className="border-t border-gray-100 divide-y divide-gray-100">
          <div className="px-5 py-4">
            <p className="text-sm text-gray-600">{ep.description}</p>
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <span className="text-xs text-gray-400">Full URL:</span>
              <code className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-700 font-mono break-all">
                {baseUrl}
                {ep.path.replace('/api', '')}
              </code>
              <CopyButton text={`${baseUrl}${ep.path.replace('/api', '')}`} />
            </div>
          </div>

          <div className="px-5 py-3 bg-gray-50">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Verification Result</h4>
            {check ? (
              <div className="space-y-1 text-xs">
                <div className={check.exists ? 'text-emerald-700' : 'text-rose-700'}>
                  {check.exists ? 'Endpoint is present in backend route code.' : 'Endpoint is missing from backend route code.'}
                </div>
                <div className="text-gray-500">
                  Source file: <code className="bg-white border border-gray-200 px-1 rounded">{check.sourceFile ?? 'n/a'}</code>
                </div>
                <div className="text-gray-500">
                  Matched route: <code className="bg-white border border-gray-200 px-1 rounded">{check.matchedRoute ?? 'n/a'}</code>
                </div>
              </div>
            ) : (
              <div className="text-xs text-gray-500">Run endpoint verification to populate backend match details.</div>
            )}
          </div>

          {ep.requestBody && (
            <div className="px-5 py-4">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Request Body (JSON)</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-gray-400 border-b border-gray-100">
                      <th className="text-left pb-2 font-medium pr-4">Field</th>
                      <th className="text-left pb-2 font-medium pr-4">Type</th>
                      <th className="text-left pb-2 font-medium pr-4">Required</th>
                      <th className="text-left pb-2 font-medium">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {Object.entries(ep.requestBody).map(([field, info]) => (
                      <tr key={field} className="hover:bg-gray-50">
                        <td className="py-2 pr-4">
                          <code className="text-blue-700 font-mono font-medium">{field}</code>
                        </td>
                        <td className="py-2 pr-4">
                          <code className="text-emerald-700 font-mono text-xs">{info.type}</code>
                        </td>
                        <td className="py-2 pr-4">
                          {info.required ? <span className="text-rose-500 font-medium">Required</span> : <span className="text-gray-400">Optional</span>}
                        </td>
                        <td className="py-2 text-gray-500">{info.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="px-5 py-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Response Example (200 OK)</h4>
              <CopyButton text={JSON.stringify(ep.responseExample, null, 2)} />
            </div>
            <pre className="bg-gray-950 text-green-400 rounded-lg p-4 text-xs overflow-x-auto font-mono leading-relaxed">
              {JSON.stringify(ep.responseExample, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

function GroupSection({
  group,
  endpoints,
  verifyIndex,
}: {
  group: string;
  endpoints: EndpointDoc[];
  verifyIndex: Map<string, ApiDocsVerifyCheck>;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const verifiedCount = endpoints.filter((ep) => verifyIndex.get(endpointKey(ep.method, ep.path))?.exists).length;

  return (
    <div>
      <button className="flex items-center gap-2 mb-3 group" onClick={() => setCollapsed(!collapsed)}>
        {collapsed ? (
          <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
        )}
        <h2 className="text-sm font-semibold text-gray-700 group-hover:text-gray-900">{group}</h2>
        <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">{endpoints.length}</span>
        <span className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full">
          {verifiedCount}/{endpoints.length}
        </span>
      </button>
      {!collapsed && (
        <div className="space-y-2 ml-6">
          {endpoints.map((ep) => (
            <EndpointCard key={ep.id} ep={ep} check={verifyIndex.get(endpointKey(ep.method, ep.path))} />
          ))}
        </div>
      )}
    </div>
  );
}

export function AdminApiReference() {
  const [filter, setFilter] = useState<'all' | HttpMethod>('all');
  const [search, setSearch] = useState('');
  const [verifyState, setVerifyState] = useState<VerifyState>('idle');
  const [verifyError, setVerifyError] = useState('');
  const [verifyResult, setVerifyResult] = useState<ApiDocsVerifyResult | null>(null);

  const filtered = API_ENDPOINTS.filter((ep) => {
    const matchesMethod = filter === 'all' || ep.method === filter;
    const q = search.toLowerCase();
    const matchesSearch =
      q === '' ||
      ep.path.toLowerCase().includes(q) ||
      ep.description.toLowerCase().includes(q) ||
      ep.group.toLowerCase().includes(q);
    return matchesMethod && matchesSearch;
  });

  const grouped = GROUP_ORDER.map((g) => ({
    group: g,
    endpoints: filtered.filter((ep) => ep.group === g),
  })).filter((g) => g.endpoints.length > 0);

  const methodCounts: Record<string, number> = {};
  API_ENDPOINTS.forEach((ep) => {
    methodCounts[ep.method] = (methodCounts[ep.method] || 0) + 1;
  });

  const verifyIndex = useMemo(() => {
    const map = new Map<string, ApiDocsVerifyCheck>();
    (verifyResult?.checks ?? []).forEach((check) => {
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

      <VerificationPanel state={verifyState} result={verifyResult} errorMessage={verifyError} onVerify={handleVerify} />

      <PhpBackendPanel />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Endpoints', value: API_ENDPOINTS.length, icon: BookOpen },
          { label: 'GET', value: methodCounts.GET ?? 0, icon: Globe },
          { label: 'POST', value: methodCounts.POST ?? 0, icon: Zap },
          { label: 'PUT / DELETE', value: (methodCounts.PUT ?? 0) + (methodCounts.DELETE ?? 0), icon: ShieldCheck },
        ].map((card) => (
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
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search endpoints..."
            className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {(['all', 'GET', 'POST', 'PUT', 'DELETE'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setFilter(m)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === m
                  ? 'bg-gray-900 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {m === 'all' ? `All (${API_ENDPOINTS.length})` : m}
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
        <strong className="text-gray-700">Verification note:</strong> clicking <code className="bg-white border border-gray-200 px-1.5 py-0.5 rounded font-mono">Verify Endpoints</code>{' '}
        calls <code className="bg-white border border-gray-200 px-1.5 py-0.5 rounded font-mono">GET /api/docs/verify</code> and checks your required routes directly against backend route source files.
      </div>
    </div>
  );
}
