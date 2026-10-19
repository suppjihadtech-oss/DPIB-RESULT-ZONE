import React, { useState } from 'react';
import { 
  Calendar, 
  Plus, 
  Trash2, 
  Clock, 
  MapPin, 
  User, 
  X, 
  Save, 
  BookOpen 
} from 'lucide-react';
import { db } from '../../services/db';
import { RoutineItem, Technology, Semester, Shift } from '../../types';
import { useToast } from '../../context/ToastContext';

export const RoutineManagement: React.FC = () => {
  const { success, error, info } = useToast();

  const [routines, setRoutines] = useState<RoutineItem[]>(() => db.getRoutines());
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<Partial<RoutineItem> | null>(null);

  const [filterDay, setFilterDay] = useState<string>('ALL');

  const filteredRoutines = routines.filter((r) => filterDay === 'ALL' || r.day === filterDay);

  const handleOpenAdd = () => {
    setEditingRoutine({
      day: 'রবিবার',
      time: '০৯:০০ - ১০:৩০',
      subjectCode: '66641',
      subjectName: '',
      teacherName: '',
      roomNo: 'ল্যাব-০১',
      technology: 'কম্পিউটার টেকনোলজি',
      semester: '৪র্থ পর্ব',
      shift: '১ম শিফট'
    });
    setModalOpen(true);
  };

  const handleSaveRoutine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRoutine) return;

    if (!editingRoutine.subjectName?.trim() || !editingRoutine.time?.trim()) {
      error('বিষয়ের নাম এবং সময়সূচি প্রদান করা আবশ্যক!', 'যাচাইকরণ ত্রুটি');
      return;
    }

    try {
      const saved = db.saveRoutine(editingRoutine as any);
      setRoutines(db.getRoutines());
      setModalOpen(false);
      setEditingRoutine(null);
      success(`"${saved.subjectName}"-এর রুটিন সফলভাবে সংরক্ষিত হয়েছে।`, 'রুটিন আপডেট');
    } catch (err: any) {
      error(`সংরক্ষণ করতে ব্যর্থ হয়েছে: ${err.message || 'পুনরায় চেষ্টা করুন'}`, 'ত্রুটি');
    }
  };

  const handleDeleteRoutine = (id: string, name: string) => {
    if (window.confirm(`আপনি কি "${name}" ক্লাসের রুটিন মুছে ফেলতে চান?`)) {
      const deleted = db.deleteRoutine(id);
      if (deleted) {
        setRoutines(db.getRoutines());
        success('ক্লাসের সময়সূচি মুছে ফেলা হয়েছে।', 'মুছে ফেলা সম্পন্ন');
      } else {
        error('রুটিন মুছতে ব্যর্থ হয়েছে।', 'ত্রুটি');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-600" />
            ক্লাস ও পরীক্ষার রুটিন ব্যবস্থাপনা
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            টেকনোলজি ও পর্বভিত্তিক ক্লাসের দিন, শিক্ষক ও সময়সূচি পরিচালনা করুন
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-xs transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          নতুন শিডিউল যোগ করুন
        </button>
      </div>

      {/* Day Filter */}
      <div className="bg-white rounded-2xl p-3 border border-slate-200/80 shadow-xs flex flex-wrap gap-2 text-xs">
        {['ALL', 'শনিবার', 'রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার'].map((day) => (
          <button
            key={day}
            type="button"
            onClick={() => setFilterDay(day)}
            className={`px-3 py-1.5 rounded-xl font-semibold transition cursor-pointer ${
              filterDay === day
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {day === 'ALL' ? 'সকল দিন' : day}
          </button>
        ))}
      </div>

      {/* Routine Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRoutines.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-3 hover:border-emerald-300 transition"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                {item.day}
              </span>
              <button
                type="button"
                onClick={() => handleDeleteRoutine(item.id, item.subjectName)}
                className="text-slate-400 hover:text-rose-600 cursor-pointer p-1"
                title="মুছে ফেলুন"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            <div>
              <div className="text-[11px] font-mono text-slate-400">{item.subjectCode}</div>
              <h4 className="font-bold text-slate-800 text-sm leading-snug">{item.subjectName}</h4>
              <p className="text-xs text-slate-500 mt-0.5">{item.technology} • {item.semester}</p>
            </div>

            <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-600" />
                <span className="font-medium font-mono">{item.time}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>{item.teacherName || 'অনর্ধারিত শিক্ষক'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-semibold text-slate-700">{item.roomNo}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {modalOpen && editingRoutine && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveRoutine}
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-extrabold text-slate-800 text-base">
                ক্লাস শিডিউল এন্ট্রি
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">সপ্তাহের দিন</label>
                  <select
                    value={editingRoutine.day || 'রবিবার'}
                    onChange={(e) => setEditingRoutine({ ...editingRoutine, day: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="শনিবার">শনিবার</option>
                    <option value="রবিবার">রবিবার</option>
                    <option value="সোমবার">সোমবার</option>
                    <option value="মঙ্গলবার">মঙ্গলবার</option>
                    <option value="বুধবার">বুধবার</option>
                    <option value="বৃহস্পতিবার">বৃহস্পতিবার</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">সময়সূচি *</label>
                  <input
                    type="text"
                    required
                    value={editingRoutine.time || ''}
                    onChange={(e) => setEditingRoutine({ ...editingRoutine, time: e.target.value })}
                    placeholder="যেমন: ০৯:০০ - ১০:৩০"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">বিষয়ের নাম *</label>
                <input
                  type="text"
                  required
                  value={editingRoutine.subjectName || ''}
                  onChange={(e) => setEditingRoutine({ ...editingRoutine, subjectName: e.target.value })}
                  placeholder="যেমন: অবজেক্ট ওরিয়েন্টেড প্রোগ্রামিং"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">বিষয় কোড</label>
                  <input
                    type="text"
                    value={editingRoutine.subjectCode || ''}
                    onChange={(e) => setEditingRoutine({ ...editingRoutine, subjectCode: e.target.value })}
                    placeholder="যেমন: 66641"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">রুম / ল্যাব নং</label>
                  <input
                    type="text"
                    value={editingRoutine.roomNo || ''}
                    onChange={(e) => setEditingRoutine({ ...editingRoutine, roomNo: e.target.value })}
                    placeholder="যেমন: ল্যাব-০১"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">শিক্ষকের নাম</label>
                <input
                  type="text"
                  value={editingRoutine.teacherName || ''}
                  onChange={(e) => setEditingRoutine({ ...editingRoutine, teacherName: e.target.value })}
                  placeholder="যেমন: ইঞ্জিঃ মোঃ জাহিদুল ইসলাম"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
              >
                বাতিল
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                সংরক্ষণ করুন
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
