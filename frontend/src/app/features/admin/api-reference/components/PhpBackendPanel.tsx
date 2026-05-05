import React, { useState } from 'react';
import { RefreshCw, Server } from 'lucide-react';
import { toast } from 'sonner';
import { Modal } from '../../../../components/shared/Modal';
import { dataApi, PHP_BASE_URL } from '../../../../services/api';
import { CopyButton } from './CopyButton';

const RESEED_CONFIRMATION_FACTORS = Array.from(
  { length: 20 },
  (_, index) => `RESET FACTOR ${String(index + 1).padStart(2, '0')}`,
);

export function PhpBackendPanel() {
  const [reseeding, setReseeding] = useState(false);
  const [showReseedAuth, setShowReseedAuth] = useState(false);
  const [reseedFactors, setReseedFactors] = useState<string[]>(() => Array(RESEED_CONFIRMATION_FACTORS.length).fill(''));
  const [reseedAuthError, setReseedAuthError] = useState('');

  const resetReseedAuth = () => {
    setReseedFactors(Array(RESEED_CONFIRMATION_FACTORS.length).fill(''));
    setReseedAuthError('');
  };

  const openReseedAuth = () => {
    resetReseedAuth();
    setShowReseedAuth(true);
  };

  const closeReseedAuth = () => {
    if (reseeding) {
      return;
    }

    setShowReseedAuth(false);
    resetReseedAuth();
  };

  const updateReseedFactor = (index: number, value: string) => {
    setReseedFactors(current => current.map((factor, factorIndex) => (factorIndex === index ? value : factor)));
    if (reseedAuthError) {
      setReseedAuthError('');
    }
  };

  const handleReseed = async () => {
    const normalizedFactors = reseedFactors.map(factor => factor.trim());
    const hasAllFactors = RESEED_CONFIRMATION_FACTORS.every((factor, index) => normalizedFactors[index] === factor);
    if (!hasAllFactors) {
      setReseedAuthError('All 20 reset factors must match exactly before reseeding.');
      return;
    }

    setReseeding(true);
    try {
      const result = await dataApi.reseed(normalizedFactors);
      setShowReseedAuth(false);
      resetReseedAuth();
      toast.success(result.message || 'Database reseeded successfully.');
    } catch (error) {
      toast.error(`Reseed failed: ${error}`);
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
            onClick={openReseedAuth}
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

      <Modal
        isOpen={showReseedAuth}
        onClose={closeReseedAuth}
        title="20-Factor Reset Authentication"
        size="lg"
        footer={(
          <>
            <button
              type="button"
              onClick={closeReseedAuth}
              disabled={reseeding}
              className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50 disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="reseed-auth-form"
              disabled={reseeding}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${reseeding ? 'animate-spin' : ''}`} />
              {reseeding ? 'Reseeding...' : 'Authenticate and Reset'}
            </button>
          </>
        )}
      >
        <form
          id="reseed-auth-form"
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            handleReseed();
          }}
        >
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            This will wipe all current data and restore the database to its seed state.
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {RESEED_CONFIRMATION_FACTORS.map((factor, index) => (
              <label key={factor} className="block">
                <span className="block text-xs font-semibold text-gray-500 mb-1">Factor {index + 1}</span>
                <input
                  value={reseedFactors[index] ?? ''}
                  onChange={event => updateReseedFactor(index, event.target.value)}
                  placeholder={factor}
                  autoComplete="off"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </label>
            ))}
          </div>
          {reseedAuthError && (
            <div className="text-xs text-red-600">{reseedAuthError}</div>
          )}
        </form>
      </Modal>
    </div>
  );
}
