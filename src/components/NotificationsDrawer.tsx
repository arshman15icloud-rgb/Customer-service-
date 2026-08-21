import React, { useState, useEffect } from 'react';
import { X, Bell, Check, Sparkles, AlertCircle, Send, ExternalLink } from 'lucide-react';
import { requestWebPushPermission } from '../lib/pwa.js';
import { api } from '../lib/api.js';
import { BroadcastNotification } from '../types.js';

interface NotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  customerId: string;
  onAskAiWithQuestion?: (question: string) => void;
}

export const NotificationsDrawer: React.FC<NotificationsDrawerProps> = ({
  isOpen,
  onClose,
  customerId,
  onAskAiWithQuestion,
}) => {
  const [broadcasts, setBroadcasts] = useState<BroadcastNotification[]>([]);
  const [pushStatus, setPushStatus] = useState<string | null>(null);
  const [isEnabling, setIsEnabling] = useState(false);

  useEffect(() => {
    if (isOpen) {
      api.getBroadcasts().then(setBroadcasts).catch(console.error);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleEnablePush = async () => {
    setIsEnabling(true);
    const result = await requestWebPushPermission(customerId);
    setPushStatus(result.message);
    setIsEnabling(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md h-full bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col p-6 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-950 text-indigo-400 border border-indigo-800/60">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Notifications & Drops</h3>
              <p className="text-xs text-slate-400">Vertex Lab updates for your device</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Push Notification Banner */}
        <div className="my-4 p-4 rounded-2xl bg-indigo-950/40 border border-indigo-800/50 flex flex-col gap-2.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-300">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>Enable Web Push Alerts</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Get instant alerts on your phone or desktop when an agent replies or when limited-edition drops release.
          </p>

          <button
            type="button"
            onClick={handleEnablePush}
            disabled={isEnabling}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-950/50 transition-all active:scale-95 disabled:opacity-50"
          >
            {isEnabling ? 'Enabling Alerts...' : 'Turn On Push Notifications'}
          </button>

          {pushStatus && (
            <p className="text-[11px] text-emerald-400 bg-emerald-950/60 p-2 rounded-lg border border-emerald-800/50">
              {pushStatus}
            </p>
          )}
        </div>

        {/* Broadcasts List */}
        <div className="flex-1 space-y-3 mt-2">
          <h4 className="text-xs font-semibold tracking-wider uppercase text-slate-400">
            Recent Broadcasts
          </h4>

          {broadcasts.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No recent notifications. You are all caught up!
            </div>
          ) : (
            broadcasts.map(bcast => (
              <div
                key={bcast.id}
                className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 transition-all space-y-2"
              >
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span className="font-semibold text-indigo-400 uppercase tracking-wide">
                    Vertex Official
                  </span>
                  <span>{new Date(bcast.sentAt).toLocaleDateString()}</span>
                </div>
                <h5 className="font-bold text-sm text-white">{bcast.title}</h5>
                <p className="text-xs text-slate-300 leading-relaxed">{bcast.message}</p>

                {bcast.actionUrl && (
                  <a
                    href={bcast.actionUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300 pt-1"
                  >
                    <span>View Drop Details</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
