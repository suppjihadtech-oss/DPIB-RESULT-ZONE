import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  Plus,
  Trash2,
  Edit2,
  Clock,
  MapPin,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Search,
  Filter,
  Layers,
  Save,
  X,
  FileText,
  AlertTriangle,
  Award,
  BookOpen,
  CalendarDays,
  GraduationCap,
  Sparkle,
  Sun,
  ShieldCheck,
  Bell,
  ChevronDown,
  Check,
} from 'lucide-react';
import { AppEvent, EventType } from '../../types';
import {
  getAllEvents,
  saveEvent,
  deleteEvent,
  toggleEventStatus,
} from '../../services/db';
import { toBanglaDigits, formatBanglaDate, formatTime12Hour } from '../../utils/bangla';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { LoadingOverlay } from '../common/LoadingOverlay';
import { EmptyState } from '../common/EmptyState';
import { BottomSheet } from '../common/BottomSheet';
import { SelectBottomSheet, SelectOption } from '../common/SelectBottomSheet';
import { ModernDatePicker, ModernDateTrigger } from '../common/ModernDatePicker';

interface EventTypeOption {
  value: EventType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const EVENT_TYPE_CONFIG: EventTypeOption[] = [
  { value: 'EXAM', label: 'সেমিস্টার সমাপনী পরীক্ষা', icon: CalendarDays, color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  { value: 'MODEL_TEST', label: 'মডেল টেস্ট', icon: BookOpen, color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { value: 'MOCK_TEST', label: 'মক টেস্ট', icon: FileText, color: 'bg-sky-50 text-sky-700 border-sky-200' },
  { value: 'FAREWELL', label: 'বিদায় সংবর্ধনা', icon: Award, color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { value: 'FRESHERS', label: 'নবীন বরণ ও পরিচিতি', icon: Sparkle, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { value: 'SEMINAR', label: 'সেমিনার ও ওয়ার্কশপ', icon: Layers, color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { value: 'CULTURAL', label: 'সাংস্কৃতিক অনুষ্ঠান', icon: Sun, color: 'bg-rose-50 text-rose-700 border-rose-200' },
  { value: 'SPORTS', label: 'বার্ষিক ক্রীড়া প্রতিযোগিতা', icon: ShieldCheck, color: 'bg-teal-50 text-teal-700 border-teal-200' },
  { value: 'HOLIDAY', label: 'ছুটি ও অবকাশ ঘোষণা', icon: Bell, color: 'bg-orange-50 text-orange-700 border-orange-200' },
  { value: 'OTHER', label: 'অন্যান্য প্রাতিষ্ঠানিক কার্যক্রম', icon: Sparkles, color: 'bg-slate-50 text-slate-700 border-slate-200' },
];

export const EventManagement: React.FC = () => {
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('ALL');

  // BottomSheet States
  const [eventSheetOpen, setEventSheetOpen] = useState<boolean>(false);
  const [categoryPickerOpen, setCategoryPickerOpen] = useState<boolean>(false);
  const [datePickerOpen, setDatePickerOpen] = useState<boolean>(false);
  const [filterSheetOpen, setFilterSheetOpen] = useState<boolean>(false);
  const [deleteConfirmEvent, setDeleteConfirmEvent] = useState<AppEvent | null>(null);

  const [editingEvent, setEditingEvent] = useState<AppEvent | null>(null);
  const [saving, setSaving] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Form Fields
  const [title, setTitle] = useState<string>('');
  const [eventType, setEventType] = useState<EventType>('FAREWELL');
  const [eventDate, setEventDate] = useState<string>('');
  const [startTime, setStartTime] = useState<string>('10:00');
  const [endTime, setEndTime] = useState<string>('14:00');
  const [location, setLocation] = useState<string>('ডিপিআইবি অডিটোরিয়াম / ক্যাম্পাস');
  const [description, setDescription] = useState<string>('');
  const [status, setStatus] = useState<'PUBLISHED' | 'DRAFT'>('PUBLISHED');

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const data = await getAllEvents();
      setEvents(data);
    } catch (err) {
      console.error('Failed to load events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleOpenCreateSheet = () => {
    setEditingEvent(null);
    setTitle('');
    setEventType('FAREWELL');
    setEventDate(new Date().toISOString().split('T')[0]);
    setStartTime('10:00');
    setEndTime('14:00');
    setLocation('ইনস্টিটিউট ক্যাম্পাস');
    setDescription('');
    setStatus('PUBLISHED');
    setEventSheetOpen(true);
  };

  const handleOpenEditSheet = (event: AppEvent) => {
    setEditingEvent(event);
    setTitle(event.title);
    setEventType(event.eventType);
    setEventDate(event.eventDate);
    setStartTime(event.startTime || '');
    setEndTime(event.endTime || '');
    setLocation(event.location || '');
    setDescription(event.description || '');
    setStatus(event.status);
    setEventSheetOpen(true);
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !eventDate.trim()) {
      showToast('অনুষ্ঠানের নাম এবং তারিখ প্রদান করা বাধ্যতামূলক।', 'error');
      return;
    }

    setSaving(true);
    try {
      const selectedTypeObj = EVENT_TYPE_CONFIG.find((o) => o.value === eventType);
      const payload: Partial<AppEvent> = {
        id: editingEvent ? editingEvent.id : undefined,
        title: title.trim(),
        eventType,
        eventTypeName: selectedTypeObj?.label || 'অন্যান্য',
        eventDate,
        startTime,
        endTime,
        location: location.trim(),
        description: description.trim(),
        status,
      };

      await saveEvent(payload);
      showToast(
        editingEvent
          ? 'অনুষ্ঠান সফলভাবে সম্পাদনা করা হয়েছে!'
          : 'নতুন অনুষ্ঠান সফলভাবে তৈরি করা হয়েছে!'
      );
      setEventSheetOpen(false);
      fetchEvents();
    } catch (err: any) {
      console.error('Error saving event:', err);
      showToast(`সংরক্ষণে সমস্যা: ${err.message}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleExecuteDelete = async () => {
    if (!deleteConfirmEvent) return;
    setIsDeleting(true);
    try {
      await deleteEvent(deleteConfirmEvent.id);
      showToast('অনুষ্ঠান সফলভাবে মুছে ফেলা হয়েছে।');
      setEvents((prev) => prev.filter((e) => e.id !== deleteConfirmEvent.id));
      setDeleteConfirmEvent(null);
    } catch (err: any) {
      console.error('Delete error:', err);
      showToast('মুছতে সমস্যা হয়েছে।', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleStatus = async (event: AppEvent) => {
    const newStatus = event.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
    try {
      await toggleEventStatus(event.id, newStatus);
      setEvents((prev) =>
        prev.map((e) => (e.id === event.id ? { ...e, status: newStatus } : e))
      );
      showToast(
        newStatus === 'PUBLISHED' ? 'ইভেন্ট প্রকাশিত হয়েছে' : 'ইভেন্ট খসড়া করা হয়েছে'
      );
    } catch (err) {
      showToast('স্ট্যাটাস পরিবর্তন করা সম্ভব হয়নি।', 'error');
    }
  };

  // Filtered list
  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      const matchSearch =
        ev.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ev.eventTypeName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ev.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ev.eventDate.includes(searchQuery);

      const matchType = selectedTypeFilter === 'ALL' || ev.eventType === selectedTypeFilter;
      return matchSearch && matchType;
    });
  }, [events, searchQuery, selectedTypeFilter]);

  const currentTypeConfig = useMemo(() => {
    return EVENT_TYPE_CONFIG.find((o) => o.value === eventType) || EVENT_TYPE_CONFIG[0];
  }, [eventType]);

  return (
    <div className="space-y-6 animate-fade-in font-bengali pb-12">
      {/* Toast alert */}
      {toastMessage && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-2xl shadow-xl border flex items-center space-x-2 text-xs sm:text-sm font-bold animate-slide-in-right ${
            toastMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header & Main Actions */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-blue-50 border border-blue-100 rounded-full text-blue-700 text-xs font-bold font-outfit uppercase mb-2">
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            <span>INSTITUTE EVENTS & NOTICES</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            ইভেন্ট ও নোটিস শিডিউলার (EVENT MANAGEMENT)
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            কলেজের বিভিন্ন অনুষ্ঠান, ফেয়ারওয়েল, নবীন বরণ, সেমিনার ও ছুটির দিন যুক্ত করুন যা স্মার্ট ক্যালেন্ডারে প্রদর্শিত হবে।
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreateSheet}
          className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs sm:text-sm font-bold font-outfit uppercase flex items-center justify-center space-x-2 shadow-md hover:shadow-lg transition-all active:scale-95 self-start md:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>EVENT যোগ করুন</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="ইভেন্ট বা স্থান খুঁজুন..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium outline-none focus:bg-white focus:border-blue-600 transition-all"
          />
        </div>

        {/* Filter Trigger via BottomSheet */}
        <button
          type="button"
          onClick={() => setFilterSheetOpen(true)}
          className="w-full sm:w-auto px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 flex items-center justify-between sm:justify-start gap-2 transition-all cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span>
              ক্যাটাগরি:{' '}
              <span className="text-blue-600 font-extrabold">
                {selectedTypeFilter === 'ALL'
                  ? 'সকল ক্যাটাগরি'
                  : EVENT_TYPE_CONFIG.find((o) => o.value === selectedTypeFilter)?.label || selectedTypeFilter}
              </span>
            </span>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        </button>
      </div>

      {/* Events Table / List View */}
      {loading ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 flex items-center justify-center">
          <LoadingSpinner text="ইভেন্ট তালিকা লোড হচ্ছে..." />
        </div>
      ) : filteredEvents.length === 0 ? (
        <EmptyState
          title="কোনো ইভেন্ট পাওয়া যায়নি"
          description={
            searchQuery
              ? 'আপনার সার্চ কুয়েরির সাথে কোনো ইভেন্ট মেলেনি।'
              : 'এখনো কোনো ইভেন্ট তৈরি করা হয়নি। নতুন ইভেন্ট যোগ করতে উপরের বাটনে ক্লিক করুন।'
          }
          actionText="নতুন ইভেন্ট তৈরি করুন"
          onAction={handleOpenCreateSheet}
        />
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-bold text-slate-600 uppercase font-outfit border-b border-slate-200">
                  <th className="py-3.5 px-4 text-center w-12">ক্রম</th>
                  <th className="py-3.5 px-4 min-w-[220px]">ইভেন্টের নাম ও বিবরণ</th>
                  <th className="py-3.5 px-4 min-w-[140px]">ক্যাটাগরি</th>
                  <th className="py-3.5 px-4 min-w-[140px]">তারিখ ও সময়</th>
                  <th className="py-3.5 px-4 min-w-[140px]">স্থান</th>
                  <th className="py-3.5 px-4 text-center min-w-[100px]">স্ট্যাটাস</th>
                  <th className="py-3.5 px-4 text-right w-24">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredEvents.map((ev, index) => {
                  const typeObj = EVENT_TYPE_CONFIG.find((o) => o.value === ev.eventType);
                  const Icon = typeObj?.icon || Calendar;

                  return (
                    <tr key={ev.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 text-center font-bold text-slate-400 font-outfit">
                        {toBanglaDigits(index + 1)}
                      </td>

                      {/* Title & Description */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                            {ev.title}
                          </h4>
                          {ev.description && (
                            <p className="text-[11px] text-slate-500 line-clamp-1 max-w-xs">
                              {ev.description}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Category Badge */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border ${
                            typeObj?.color || 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5 shrink-0" />
                          <span>{ev.eventTypeName || ev.eventType}</span>
                        </span>
                      </td>

                      {/* Date & Time */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <div className="font-bold text-slate-900 font-outfit">
                            {ev.eventDate}
                          </div>
                          {(ev.startTime || ev.endTime) && (
                            <div className="text-[11px] text-slate-500 flex items-center space-x-1 font-outfit">
                              <Clock className="w-3 h-3 text-slate-400" />
                              <span>
                                {formatTime12Hour(ev.startTime)} {ev.endTime ? ` - ${formatTime12Hour(ev.endTime)}` : ''}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Location */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-1.5 text-slate-700">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[160px]">
                            {ev.location || 'ইনস্টিটিউট ক্যাম্পাস'}
                          </span>
                        </div>
                      </td>

                      {/* Status Toggle */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(ev)}
                          className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-black font-outfit uppercase transition-all cursor-pointer border ${
                            ev.status === 'PUBLISHED'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                          }`}
                          title="স্ট্যাটাস পরিবর্তন করতে ক্লিক করুন"
                        >
                          {ev.status === 'PUBLISHED' ? (
                            <>
                              <Eye className="w-3 h-3" />
                              <span>PUBLISHED</span>
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-3 h-3" />
                              <span>DRAFT</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditSheet(ev)}
                            className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors cursor-pointer"
                            title="সম্পাদনা করুন"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmEvent(ev)}
                            className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                            title="মুছে ফেলুন"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= MODERN BOTTOM SHEETS ================= */}

      {/* 1. CREATE / EDIT EVENT BOTTOM SHEET */}
      <BottomSheet
        isOpen={eventSheetOpen}
        onClose={() => setEventSheetOpen(false)}
        title={editingEvent ? 'ইভেন্ট সম্পাদনা করুন' : 'নতুন ইভেন্ট যোগ করুন'}
        subtitle="ইনস্টিটিউট নোটিশ ও স্মার্ট ক্যালেন্ডারে প্রদর্শিত হবে"
        maxHeight="max-h-[92vh]"
      >
        <form onSubmit={handleSaveEvent} className="space-y-4 pb-6">
          {/* Event Title */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase">
              ইভেন্টের নাম / শিরোনাম <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="ইভেন্টের নাম বা শিরোনাম লিখুন"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-semibold outline-none focus:bg-white focus:border-blue-600 transition-all"
            />
          </div>

          {/* Event Category & Date Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Category BottomSheet Trigger */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase">
                ইভেন্ট ক্যাটাগরি <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => setCategoryPickerOpen(true)}
                className="w-full px-4 py-3 bg-slate-50 hover:bg-white border border-slate-200 hover:border-blue-400 rounded-2xl text-left text-xs sm:text-sm font-bold text-slate-900 flex items-center justify-between transition-all cursor-pointer shadow-2xs group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center border ${currentTypeConfig.color}`}>
                    <currentTypeConfig.icon className="w-3.5 h-3.5" />
                  </div>
                  <span className="truncate">{currentTypeConfig.label}</span>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-transform group-hover:translate-y-0.5" />
              </button>
            </div>

            {/* Modern Date Trigger */}
            <div className="space-y-1.5">
              <ModernDateTrigger
                id="event-date-trigger"
                label="ইভেন্টের তারিখ"
                required
                value={eventDate}
                onClick={() => setDatePickerOpen(true)}
              />
            </div>
          </div>

          {/* Start & End Time Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase">
                শুরুর সময়
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-semibold outline-none focus:bg-white focus:border-blue-600 font-outfit"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase">
                সমাপ্তির সময়
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-semibold outline-none focus:bg-white focus:border-blue-600 font-outfit"
              />
            </div>
          </div>

          {/* Location & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase">অনুষ্ঠানের স্থান</label>
              <input
                type="text"
                placeholder="অনুষ্ঠানের স্থান লিখুন"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-semibold outline-none focus:bg-white focus:border-blue-600"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase">প্রকাশনা স্ট্যাটাস</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setStatus('PUBLISHED')}
                  className={`py-2.5 px-3 rounded-2xl border text-xs font-black uppercase flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    status === 'PUBLISHED'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-400 shadow-xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>প্রকাশিত</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('DRAFT')}
                  className={`py-2.5 px-3 rounded-2xl border text-xs font-black uppercase flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    status === 'DRAFT'
                      ? 'bg-amber-50 text-amber-700 border-amber-400 shadow-xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200'
                  }`}
                >
                  <EyeOff className="w-3.5 h-3.5" />
                  <span>খসড়া</span>
                </button>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase">বিস্তারিত বিবরণ (ঐচ্ছিক)</label>
            <textarea
              rows={3}
              placeholder="ইভেন্টের বিস্তারিত তথ্য বা শিক্ষার্থীদের জন্য বিশেষ নির্দেশনা..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-medium outline-none focus:bg-white focus:border-blue-600 resize-none"
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setEventSheetOpen(false)}
              className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-xs sm:text-sm transition-colors cursor-pointer"
            >
              বাতিল
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl text-xs sm:text-sm transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center space-x-2 cursor-pointer font-outfit"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'সংরক্ষণ হচ্ছে...' : 'ইভেন্ট সংরক্ষণ করুন'}</span>
            </button>
          </div>
        </form>
      </BottomSheet>

      {/* 2. EVENT CATEGORY PICKER BOTTOM SHEET */}
      <BottomSheet
        isOpen={categoryPickerOpen}
        onClose={() => setCategoryPickerOpen(false)}
        title="ইভেন্ট ক্যাটাগরি নির্বাচন করুন"
        subtitle="সংশ্লিষ্ট কার্যক্রমের ধরন নির্বাচন করুন"
      >
        <div className="space-y-2 pb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {EVENT_TYPE_CONFIG.map((opt) => {
              const isSelected = eventType === opt.value;
              const Icon = opt.icon;

              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    setEventType(opt.value);
                    setCategoryPickerOpen(false);
                  }}
                  className={`p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer active:scale-[0.98] ${
                    isSelected
                      ? 'bg-blue-50/90 border-blue-400 text-blue-900 shadow-2xs font-bold'
                      : 'bg-white hover:bg-slate-50 border-slate-200/90 text-slate-700'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center border ${opt.color}`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-xs sm:text-sm text-slate-900">{opt.label}</div>
                    </div>
                  </div>

                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-slate-300'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </BottomSheet>

      {/* 3. CATEGORY FILTER BOTTOM SHEET */}
      <BottomSheet
        isOpen={filterSheetOpen}
        onClose={() => setFilterSheetOpen(false)}
        title="ক্যাটাগরি ফিল্টার"
        subtitle="নির্দিষ্ট ইভেন্ট দেখতে ক্যাটাগরি বেছে নিন"
      >
        <div className="space-y-2 pb-6">
          <button
            type="button"
            onClick={() => {
              setSelectedTypeFilter('ALL');
              setFilterSheetOpen(false);
            }}
            className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer active:scale-[0.98] ${
              selectedTypeFilter === 'ALL'
                ? 'bg-blue-50/90 border-blue-400 text-blue-900 shadow-2xs font-bold'
                : 'bg-white hover:bg-slate-50 border-slate-200/90 text-slate-700'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-xs sm:text-sm text-slate-900">সকল ক্যাটাগরি</div>
                <div className="text-[10px] text-slate-400">সকল প্রকার ইভেন্ট প্রদর্শন করুন</div>
              </div>
            </div>
            {selectedTypeFilter === 'ALL' && (
              <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
            )}
          </button>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
            {EVENT_TYPE_CONFIG.map((opt) => {
              const isSelected = selectedTypeFilter === opt.value;
              const Icon = opt.icon;

              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    setSelectedTypeFilter(opt.value);
                    setFilterSheetOpen(false);
                  }}
                  className={`p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer active:scale-[0.98] ${
                    isSelected
                      ? 'bg-blue-50/90 border-blue-400 text-blue-900 shadow-2xs font-bold'
                      : 'bg-white hover:bg-slate-50 border-slate-200/90 text-slate-700'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${opt.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-xs sm:text-sm text-slate-900">{opt.label}</div>
                    </div>
                  </div>
                  {isSelected && (
                    <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </BottomSheet>

      {/* 4. MODERN DATE PICKER MODAL */}
      <ModernDatePicker
        isOpen={datePickerOpen}
        onClose={() => setDatePickerOpen(false)}
        value={eventDate}
        onChange={(newDate) => setEventDate(newDate)}
        title="ইভেন্টের তারিখ নির্বাচন"
        subtitle="অনুষ্ঠান বা কার্যক্রমের তারিখ নির্ধারণ করুন"
        minYear={2020}
        maxYear={2035}
      />

      {/* 4. DELETE CONFIRMATION BOTTOM SHEET */}
      <BottomSheet
        isOpen={Boolean(deleteConfirmEvent)}
        onClose={() => setDeleteConfirmEvent(null)}
        title="ইভেন্ট মুছে ফেলতে চান?"
        subtitle={deleteConfirmEvent?.title}
      >
        <div className="space-y-4 pb-6 text-center">
          <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto border border-rose-200">
            <Trash2 className="w-7 h-7" />
          </div>
          <p className="text-xs sm:text-sm text-slate-600 max-w-sm mx-auto leading-relaxed">
            আপনি কি নিশ্চিত যে <span className="font-bold text-slate-900">"{deleteConfirmEvent?.title}"</span> অনুষ্ঠানটি চিরতরে মুছে ফেলতে চান?
          </p>
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={() => setDeleteConfirmEvent(null)}
              className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer"
            >
              বাতিল
            </button>
            <button
              type="button"
              onClick={handleExecuteDelete}
              disabled={isDeleting}
              className="py-3 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {isDeleting ? 'মুছে ফেলা হচ্ছে...' : 'মুছে ফেলুন'}
            </button>
          </div>
        </div>
      </BottomSheet>

      {/* Event Save / Delete Loading Overlay */}
      <LoadingOverlay
        isVisible={saving || isDeleting}
        message={
          isDeleting
            ? 'তথ্য মুছে ফেলা হচ্ছে...'
            : saving
            ? (editingEvent ? 'তথ্য আপডেট করা হচ্ছে...' : 'তথ্য সংরক্ষণ করা হচ্ছে...')
            : 'তথ্য সংরক্ষণ করা হচ্ছে...'
        }
        subtext="ক্লাউড ডাটাবেস আপডেট হচ্ছে..."
      />
    </div>
  );
};
