import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Filter, 
  Phone, 
  CheckCircle2, 
  X, 
  Save,
  RotateCcw
} from 'lucide-react';
import { db } from '../../services/db';
import { Student, Technology, Semester, Shift } from '../../types';
import { useToast } from '../../context/ToastContext';

export const StudentManagement: React.FC = () => {
  const { success, error, info } = useToast();

  const [students, setStudents] = useState<Student[]>(() => db.getStudents());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTech, setSelectedTech] = useState<string>('ALL');
  const [selectedSem, setSelectedSem] = useState<string>('ALL');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Partial<Student> | null>(null);

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchSearch =
        !searchQuery ||
        s.roll.includes(searchQuery) ||
        s.registration.includes(searchQuery) ||
        s.nameBangla.includes(searchQuery) ||
        s.nameEnglish.toLowerCase().includes(searchQuery.toLowerCase());

      const matchTech = selectedTech === 'ALL' || s.technology === selectedTech;
      const matchSem = selectedSem === 'ALL' || s.semester === selectedSem;

      return matchSearch && matchTech && matchSem;
    });
  }, [students, searchQuery, selectedTech, selectedSem]);

  const handleOpenAdd = () => {
    setEditingStudent({
      nameBangla: '',
      nameEnglish: '',
      roll: '',
      registration: '',
      technology: 'কম্পিউটার টেকনোলজি',
      semester: '১ম পর্ব',
      shift: '১ম শিফট',
      session: '2023-2024',
      fatherName: '',
      motherName: '',
      phone: '',
      status: 'ACTIVE'
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (student: Student) => {
    setEditingStudent({ ...student });
    setModalOpen(true);
  };

  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;

    if (!editingStudent.roll?.trim() || !editingStudent.registration?.trim()) {
      error('রোল এবং রেজিস্ট্রেশন নম্বর অবশ্যই প্রদান করতে হবে!', 'যাচাইকরণ ত্রুটি');
      return;
    }

    if (!editingStudent.nameBangla?.trim()) {
      error('শিক্ষার্থীর বাংলা নাম প্রদান করা আবশ্যক!', 'যাচাইকরণ ত্রুটি');
      return;
    }

    try {
      const isNew = !editingStudent.id;
      const saved = db.saveStudent(editingStudent as any);
      setStudents(db.getStudents());
      setModalOpen(false);
      setEditingStudent(null);

      if (isNew) {
        success(`শিক্ষার্থী "${saved.nameBangla}" সফলভাবে ডাটাবেসে যুক্ত হয়েছে।`, 'সংরক্ষণ সফল');
      } else {
        success(`শিক্ষার্থী "${saved.nameBangla}"-এর তথ্য সফলভাবে আপডেট করা হয়েছে।`, 'আপডেট সফল');
      }
    } catch (err: any) {
      error(`সংরক্ষণ করতে ব্যর্থ হয়েছে: ${err.message || 'পুনরায় চেষ্টা করুন'}`, 'ত্রুটি');
    }
  };

  const handleDeleteStudent = (id: string, name: string, roll: string) => {
    if (window.confirm(`আপনি কি নিশ্চিত যে শিক্ষার্থী ${name} (রোল: ${roll})-এর রেকর্ড মুছে ফেলতে চান?`)) {
      const deleted = db.deleteStudent(id);
      if (deleted) {
        setStudents(db.getStudents());
        success(`শিক্ষার্থী "${name}"-এর রেকর্ড মুছে ফেলা হয়েছে।`, 'মুছে ফেলা সম্পন্ন');
      } else {
        error('শিক্ষার্থী মুছতে সমস্যা হয়েছে।', 'ত্রুটি');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Add Action */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-600" />
            শিক্ষার্থী তথ্য ব্যবস্থাপনা
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            ইনস্টিটিউটের সকল পর্ব ও টেকনোলজির শিক্ষার্থীদের পূর্ণাঙ্গ প্রোফাইল পরিচালনা করুন
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-xs transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          নতুন শিক্ষার্থী যোগ করুন
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="রোল / রেজিঃ / নাম দিয়ে খুঁজুন..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-emerald-500 focus:bg-white"
            />
          </div>

          <div>
            <select
              value={selectedTech}
              onChange={(e) => setSelectedTech(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-emerald-500 focus:bg-white"
            >
              <option value="ALL">সকল টেকনোলজি</option>
              <option value="কম্পিউটার টেকনোলজি">কম্পিউটার টেকনোলজি</option>
              <option value="সিভিল টেকনোলজি">সিভিল টেকনোলজি</option>
              <option value="ইলেকট্রিক্যাল টেকনোলজি">ইলেকট্রিক্যাল টেকনোলজি</option>
              <option value="মেকানিক্যাল টেকনোলজি">মেকানিক্যাল টেকনোলজি</option>
              <option value="ইলেকট্রনিক্স টেকনোলজি">ইলেকট্রনিক্স টেকনোলজি</option>
            </select>
          </div>

          <div>
            <select
              value={selectedSem}
              onChange={(e) => setSelectedSem(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-emerald-500 focus:bg-white"
            >
              <option value="ALL">সকল পর্ব</option>
              <option value="১ম পর্ব">১ম পর্ব</option>
              <option value="২য় পর্ব">২য় পর্ব</option>
              <option value="৩য় পর্ব">৩য় পর্ব</option>
              <option value="৪র্থ পর্ব">৪র্থ পর্ব</option>
              <option value="৫ম পর্ব">৫ম পর্ব</option>
              <option value="৬ষ্ঠ পর্ব">৬ষ্ঠ পর্ব</option>
              <option value="৭ম পর্ব">৭ম পর্ব</option>
              <option value="৮ম পর্ব">৮ম পর্ব</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
          <span>মোট {filteredStudents.length} জন শিক্ষার্থী প্রদর্শিত হচ্ছে</span>
          {(searchQuery || selectedTech !== 'ALL' || selectedSem !== 'ALL') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedTech('ALL');
                setSelectedSem('ALL');
                info('ফিল্টার রিসেট করা হয়েছে');
              }}
              className="text-emerald-700 hover:underline cursor-pointer font-medium"
            >
              ফিল্টার রিসেট
            </button>
          )}
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {filteredStudents.length === 0 ? (
          <div className="text-center py-12 px-4 space-y-3">
            <Users className="w-10 h-10 text-slate-300 mx-auto" />
            <h4 className="font-bold text-slate-700 text-sm">কোনো শিক্ষার্থীর তথ্য পাওয়া যায়নি</h4>
            <p className="text-xs text-slate-400">নতুন শিক্ষার্থী যোগ করতে ওপরের বাটনে ক্লিক করুন</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-semibold">
                  <th className="py-3 px-4">রোল ও রেজিঃ</th>
                  <th className="py-3 px-4">শিক্ষার্থীর নাম</th>
                  <th className="py-3 px-4">টেকনোলজি ও পর্ব</th>
                  <th className="py-3 px-4">পিতার নাম</th>
                  <th className="py-3 px-4">যোগাযোগ</th>
                  <th className="py-3 px-4 text-right">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-800 font-mono">{s.roll}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{s.registration}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-800">{s.nameBangla}</div>
                      <div className="text-[11px] text-slate-400">{s.nameEnglish}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-slate-700 font-medium">{s.technology}</div>
                      <div className="text-[11px] text-slate-400">{s.semester} • {s.shift} ({s.session})</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {s.fatherName || '—'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {s.phone ? (
                        <span className="flex items-center gap-1 font-mono text-xs">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {s.phone}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(s)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition cursor-pointer"
                          title="সম্পাদনা করুন"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteStudent(s.id, s.nameBangla, s.roll)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                          title="মুছে ফেলুন"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Student Modal */}
      {modalOpen && editingStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveStudent}
            className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-extrabold text-slate-800 text-base">
                {editingStudent.id ? 'শিক্ষার্থী তথ্য সম্পাদনা' : 'নতুন শিক্ষার্থী নিবন্ধন'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">রোল নম্বর *</label>
                  <input
                    type="text"
                    required
                    value={editingStudent.roll || ''}
                    onChange={(e) => setEditingStudent({ ...editingStudent, roll: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:outline-emerald-500"
                    placeholder="যেমন: 612450"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">রেজিস্ট্রেশন নম্বর *</label>
                  <input
                    type="text"
                    required
                    value={editingStudent.registration || ''}
                    onChange={(e) => setEditingStudent({ ...editingStudent, registration: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:outline-emerald-500"
                    placeholder="যেমন: 1502123456"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">শিক্ষার্থীর নাম (বাংলা) *</label>
                  <input
                    type="text"
                    required
                    value={editingStudent.nameBangla || ''}
                    onChange={(e) => setEditingStudent({ ...editingStudent, nameBangla: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-emerald-500"
                    placeholder="যেমন: মোঃ তানভীর হাসান"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">শিক্ষার্থীর নাম (English)</label>
                  <input
                    type="text"
                    value={editingStudent.nameEnglish || ''}
                    onChange={(e) => setEditingStudent({ ...editingStudent, nameEnglish: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-emerald-500"
                    placeholder="e.g. Md. Tanvir Hasan"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">টেকনোলজি *</label>
                  <select
                    value={editingStudent.technology || 'কম্পিউটার টেকনোলজি'}
                    onChange={(e) => setEditingStudent({ ...editingStudent, technology: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-emerald-500"
                  >
                    <option value="কম্পিউটার টেকনোলজি">কম্পিউটার টেকনোলজি</option>
                    <option value="সিভিল টেকনোলজি">সিভিল টেকনোলজি</option>
                    <option value="ইলেকট্রিক্যাল টেকনোলজি">ইলেকট্রিক্যাল টেকনোলজি</option>
                    <option value="মেকানিক্যাল টেকনোলজি">মেকানিক্যাল টেকনোলজি</option>
                    <option value="ইলেকট্রনিক্স টেকনোলজি">ইলেকট্রনিক্স টেকনোলজি</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">পর্ব / সেমিস্টার *</label>
                  <select
                    value={editingStudent.semester || '১ম পর্ব'}
                    onChange={(e) => setEditingStudent({ ...editingStudent, semester: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-emerald-500"
                  >
                    <option value="১ম পর্ব">১ম পর্ব</option>
                    <option value="২য় পর্ব">২য় পর্ব</option>
                    <option value="৩য় পর্ব">৩য় পর্ব</option>
                    <option value="৪র্থ পর্ব">৪র্থ পর্ব</option>
                    <option value="৫ম পর্ব">৫ম পর্ব</option>
                    <option value="৬ষ্ঠ পর্ব">৬ষ্ঠ পর্ব</option>
                    <option value="৭ম পর্ব">৭ম পর্ব</option>
                    <option value="৮ম পর্ব">৮ম পর্ব</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">শিফট *</label>
                  <select
                    value={editingStudent.shift || '১ম শিফট'}
                    onChange={(e) => setEditingStudent({ ...editingStudent, shift: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-emerald-500"
                  >
                    <option value="১ম শিফট">১ম শিফট</option>
                    <option value="২য় শিফট">২য় শিফট</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">সেশন</label>
                  <input
                    type="text"
                    value={editingStudent.session || '2023-2024'}
                    onChange={(e) => setEditingStudent({ ...editingStudent, session: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-emerald-500 font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">মোবাইল নম্বর</label>
                  <input
                    type="text"
                    value={editingStudent.phone || ''}
                    onChange={(e) => setEditingStudent({ ...editingStudent, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-emerald-500 font-mono"
                    placeholder="017xxxxxxxx"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">পিতার নাম</label>
                  <input
                    type="text"
                    value={editingStudent.fatherName || ''}
                    onChange={(e) => setEditingStudent({ ...editingStudent, fatherName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-emerald-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">মাতার নাম</label>
                  <input
                    type="text"
                    value={editingStudent.motherName || ''}
                    onChange={(e) => setEditingStudent({ ...editingStudent, motherName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-emerald-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 cursor-pointer"
              >
                বাতিল
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer"
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
