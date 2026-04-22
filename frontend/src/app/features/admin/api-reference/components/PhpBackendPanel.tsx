import React, { useState } from 'react';
import { RefreshCw, Server } from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmDialog } from '../../../../components/shared/Modal';
import { dataApi, PHP_BASE_URL } from '../../../../services/api';
import { CopyButton } from './CopyButton';

export function PhpBackendPanel() {
  const [reseeding, setReseeding] = useState(false);
  const [confirmReseed, setConfirmReseed] = useState(false);

  const handleReseed = async () => {
    setReseeding(true);
    try {
      const result = await dataApi.reseed();
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
            onClick={() => setConfirmReseed(true)}
            disabled={reseeding}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-60 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${reseeding ? 'animate-spin' : ''}`} />
            {reseeding ? 'Reseeding...' : 'Reset Database to Seed Data'}
          </button>

          <ConfirmDialog
            isOpen={confirmReseed}
            onClose={() => setConfirmReseed(false)}
            onConfirm={handleReseed}
            title="Reset Database"
            message="This will wipe all current data and restore the database to its seed state. This action cannot be undone. Are you sure?"
            confirmLabel="Reset Database"
          />

          <div className="text-xs text-gray-500">
            Runs <code className="bg-gray-100 px-1 rounded font-mono">POST /api/data/reseed</code> on the PHP backend.
          </div>
        </div>
      </div>
    </div>
  );
}
