import React, { useState, useEffect } from 'react';
import { Clock, Video, X, ExternalLink, Calendar } from 'lucide-react';
import { notificationService, UpcomingMeetingReminder } from '../services/notificationService';

interface UpcomingMeetingAlertBannerProps {
  onOpenAppointment?: (appointmentId: number) => void;
}

export const UpcomingMeetingAlertBanner: React.FC<UpcomingMeetingAlertBannerProps> = ({ onOpenAppointment }) => {
  const [urgentMeeting, setUrgentMeeting] = useState<UpcomingMeetingReminder | null>(null);
  const [minutesUntil, setMinutesUntil] = useState<number>(0);
  const [dismissedId, setDismissedId] = useState<number | null>(null);

  const checkUrgentMeetings = async () => {
    try {
      const upcoming = await notificationService.getUpcomingReminders();
      const now = new Date().getTime();

      // Find the earliest upcoming meeting starting within the next 45 minutes
      const soon = upcoming
        .map((m) => {
          const startTime = new Date(m.startTime).getTime();
          const diffMinutes = Math.round((startTime - now) / 60000);
          return { meeting: m, diffMinutes };
        })
        .filter((item) => item.diffMinutes >= -15 && item.diffMinutes <= 45 && item.meeting.id !== dismissedId)
        .sort((a, b) => a.diffMinutes - b.diffMinutes)[0];

      if (soon) {
        setUrgentMeeting(soon.meeting);
        setMinutesUntil(soon.diffMinutes);
      } else {
        setUrgentMeeting(null);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    checkUrgentMeetings();
    const interval = setInterval(checkUrgentMeetings, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, [dismissedId]);

  if (!urgentMeeting) return null;

  const isStartingNow = minutesUntil <= 0;

  return (
    <div className="bg-gradient-to-r from-indigo-900/90 via-purple-900/90 to-slate-900/90 border-b border-indigo-500/40 text-slate-100 px-4 py-2 text-xs flex items-center justify-between shadow-lg backdrop-blur-md sticky top-16 z-20 animate-in slide-in-from-top duration-300">
      <div className="flex items-center gap-2.5 flex-wrap">
        <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider text-[10px] ${
          isStartingNow
            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse'
            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
        }`}>
          <Clock className="w-3 h-3" />
          <span>{isStartingNow ? 'Happening Now' : `In ${minutesUntil} mins`}</span>
        </div>

        <span className="font-semibold text-slate-200">
          Upcoming Meeting:
        </span>
        <span className="text-indigo-200 font-medium truncate max-w-xs md:max-w-md">
          {urgentMeeting.title} with <strong className="text-white">{urgentMeeting.attendeeName}</strong>
        </span>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {urgentMeeting.meetingLink && (
          <a
            href={urgentMeeting.meetingLink}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/30 transition transform hover:scale-105"
          >
            <Video className="w-3.5 h-3.5" />
            <span>Join Meeting</span>
            <ExternalLink className="w-3 h-3 opacity-70" />
          </a>
        )}

        {onOpenAppointment && (
          <button
            onClick={() => onOpenAppointment(urgentMeeting.id)}
            className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs border border-slate-700 transition"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Details</span>
          </button>
        )}

        <button
          onClick={() => {
            setDismissedId(urgentMeeting.id);
            setUrgentMeeting(null);
          }}
          title="Dismiss banner"
          className="p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 transition"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
