import React, { useState, useEffect } from 'react';
import { Announcement } from '../types.js';
import { api } from '../lib/api.js';
import { VertexSparkleIcon } from './VertexSparkleIcon.js';
import { Megaphone, Calendar, Tag, ExternalLink, Flame } from 'lucide-react';

interface AnnouncementsViewProps {
  onAskAiWithQuestion: (question: string) => void;
}

export const AnnouncementsView: React.FC<AnnouncementsViewProps> = ({ onAskAiWithQuestion }) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAnnouncements = async () => {
      try {
        setLoading(true);
        const data = await api.getAnnouncements(true);
        setAnnouncements(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to load announcements:', err);
        setAnnouncements([]);
      } finally {
        setLoading(false);
      }
    };
    loadAnnouncements();
  }, []);

  return (
    <div id="announcements-view" className="max-w-4xl mx-auto px-3 sm:px-6 py-6 space-y-6">
      {/* Gemini Header Banner */}
      <div className="rounded-3xl bg-[#1e1f20] border border-[#282a2c] p-6 sm:p-8 relative overflow-hidden shadow-2xl text-center bg-gemini-ambient">
        <div className="w-12 h-12 rounded-2xl bg-[#131314] border border-[#333538] flex items-center justify-center text-[#78D9EC] mx-auto mb-3 shadow-inner">
          <VertexSparkleIcon className="w-6 h-6" animated={true} />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-display tracking-tight">
          <span className="gemini-gradient-text">Collection Drops, Notices & Exclusive Perks</span>
        </h1>
        <p className="text-xs sm:text-sm text-[#9aa0a6] max-w-xl mx-auto mt-2 leading-relaxed">
          Stay informed on limited heavyweight drops, promotional coupon codes, and customer service updates.
        </p>
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-12 text-center text-[#9aa0a6] text-sm">Loading verified announcements...</div>
        ) : announcements.length === 0 ? (
          <div className="py-12 text-center rounded-3xl bg-[#1e1f20] border border-[#282a2c]">
            <p className="text-sm text-[#9aa0a6]">No active announcements at the moment.</p>
          </div>
        ) : (
          announcements.map(ann => {
            const isPromo = ann.type === 'promotion';
            const isDrop = ann.type === 'drop';
            const isNotice = ann.type === 'notice';

            return (
              <div
                key={ann.id}
                id={`announcement-card-${ann.id}`}
                className="relative rounded-3xl bg-[#1e1f20] border border-[#282a2c] hover:border-[#3c4043] overflow-hidden shadow-lg transition-all p-5 sm:p-6"
              >
                {/* Header Row */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    {isPromo && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#D96570]/15 text-[#f28b82] border border-[#D96570]/30">
                        <Flame className="w-3.5 h-3.5 text-[#D96570]" />
                        Exclusive Promo
                      </span>
                    )}
                    {isDrop && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#4285F4]/15 text-[#a8c7fa] border border-[#4285F4]/30">
                        <VertexSparkleIcon className="w-3 h-3" size={12} />
                        New Drop
                      </span>
                    )}
                    {isNotice && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#9B72CB]/15 text-[#c5b4e3] border border-[#9B72CB]/30">
                        <Tag className="w-3.5 h-3.5 text-[#9B72CB]" />
                        Notice
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 text-[11px] text-[#9aa0a6]">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{new Date(ann.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Title & Body */}
                <h3 className="text-lg font-bold text-white tracking-tight mb-2">
                  {ann.title}
                </h3>
                <p className="text-xs sm:text-sm text-[#c4c7c5] leading-relaxed mb-4 whitespace-pre-wrap">
                  {ann.content}
                </p>

                {/* Actions */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#282a2c]">
                  <button
                    type="button"
                    onClick={() => onAskAiWithQuestion(`Can you tell me more about this announcement: "${ann.title}"?`)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#a8c7fa] hover:text-white transition-colors"
                  >
                    <VertexSparkleIcon className="w-3.5 h-3.5" size={14} />
                    <span>Ask Vertex AI Concierge</span>
                  </button>

                  {ann.actionUrl && (
                    <a
                      href={ann.actionUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-gradient-to-r from-[#4285F4] to-[#6366F1] hover:opacity-90 text-white shadow-md transition-all active:scale-95"
                    >
                      <span>{ann.actionText || 'Shop Collection'}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
