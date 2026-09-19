import React, { useState, useEffect, useMemo } from 'react';
import {
  UserCheck,
  Plus,
  Trash2,
  Edit2,
  Search,
  Building2,
  Phone,
  GraduationCap,
  Check,
  RefreshCw,
  Sparkles,
  Cpu,
  Layers,
  BookOpen,
  Calculator,
  Atom,
  FlaskConical,
  Languages,
  Briefcase,
  Activity,
  Globe,
  Zap,
  Wrench,
  Anchor,
  Compass,
  Info,
} from 'lucide-react';
import { Teacher, Department } from '../../types';
import { getTeachers, saveTeacher, deleteTeacher } from '../../services/db';
import { SelectBottomSheet, SelectTrigger, SelectOption } from '../common/SelectBottomSheet';
import { BottomSheet } from '../common/BottomSheet';

interface TeacherManagementProps {
  departments?: Department[];
}

type TeacherCategory = 'TECH' | 'NON_TECH' | 'ALL_TECH';

interface NonTechSubjectOption {
  id: string;
  name: string;
  enCode: string; // ALL UPPERCASE
  icon: React.ComponentType<{ className?: string }>;
}

const NON_TECH_SUBJECTS: NonTechSubjectOption[] = [
  { id: 'BANGLA', name: 'বাংলা', enCode: 'BANGLA', icon: Languages },
  { id: 'ENGLISH', name: 'ইংরেজি', enCode: 'ENGLISH', icon: BookOpen },
  { id: 'MATHEMATICS', name: 'গণিত', enCode: 'MATHEMATICS', icon: Calculator },
  { id: 'PHYSICS', name: 'পদার্থবিজ্ঞান', enCode: 'PHYSICS', icon: Atom },
  { id: 'CHEMISTRY', name: 'রসায়ন', enCode: 'CHEMISTRY', icon: FlaskConical },
  { id: 'SOCIAL_SCIENCE', name: 'সমাজবিজ্ঞান ও অর্থনীতি', enCode: 'SOCIAL SCIENCE', icon: Globe },
  { id: 'ACCOUNTING', name: 'হিসাববিজ্ঞান ও ব্যবস্থাপনা', enCode: 'ACCOUNTING & MANAGEMENT', icon: Briefcase },
  { id: 'PHYSICAL_ED', name: 'শারীরিক শিক্ষা', enCode: 'PHYSICAL EDUCATION', icon: Activity },
  { id: 'GENERAL', name: 'সাধারণ নন-টেক', enCode: 'GENERAL NON-TECH', icon: Sparkles },
];

const DEFAULT_DEPARTMENTS = [
  { id: 'COMPUTER', name: 'কম্পিউটার টেকনোলজি', enCode: 'COMPUTER', icon: Cpu },
  { id: 'CIVIL', name: 'সিভিল টেকনোলজি', enCode: 'CIVIL', icon: Building2 },
  { id: 'ELECTRICAL', name: 'ইলেকট্রিক্যাল টেকনোলজি', enCode: 'ELECTRICAL', icon: Zap },
  { id: 'MECHANICAL', name: 'মেকানিক্যাল টেকনোলজি', enCode: 'MECHANICAL', icon: Wrench },
  { id: 'MARINE', name: 'মেরিন টেকনোলজি', enCode: 'MARINE', icon: Anchor },
  { id: 'SURVEYING', name: 'সার্ভেয়িং টেকনোলজি', enCode: 'SURVEYING', icon: Compass },
];

const getDepartmentIcon = (deptId: string): React.ComponentType<{ className?: string }> => {
  const id = deptId.toUpperCase();
  if (id.includes('COMP') || id.includes('CST')) return Cpu;
  if (id.includes('CIVIL')) return Building2;
  if (id.includes('ELEC')) return Zap;
  if (id.includes('MECH')) return Wrench;
  if (id.includes('MARIN')) return Anchor;
  if (id.includes('SURV')) return Compass;
  if (id.includes('NON') || id.includes('GEN')) return BookOpen;
  if (id.includes('ALL')) return Layers;
  return Building2;
};

export const TeacherManagement: React.FC<TeacherManagementProps> = ({ departments }) => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'TECH' | 'NON_TECH' | 'ALL_TECH'>('ALL');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('ALL');

  // Sheet states for Add/Edit Modal & Action Sheets
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTeacherId, setEditingTeacherId] = useState<string | null>(null);

  // Action Sheet (Bottom Sheet) states
  const [deptSheetOpen, setDeptSheetOpen] = useState(false);
  const [nonTechSheetOpen, setNonTechSheetOpen] = useState(false);
  const [filterDeptSheetOpen, setFilterDeptSheetOpen] = useState(false);

  // Form fields
  const [name, setName] = useState('');
  const [designation, setDesignation] = useState('');
  const [category, setCategory] = useState<TeacherCategory>('TECH');
  const [departmentId, setDepartmentId] = useState('COMPUTER');
  const [nonTechSubjectId, setNonTechSubjectId] = useState('MATHEMATICS');
  const [customSubjectName, setCustomSubjectName] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load teachers from Firestore
  const loadTeacherList = async () => {
    setLoading(true);
    try {
      const list = await getTeachers();
      setTeachers(list);
    } catch (err) {
      console.error('Error loading teachers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeacherList();
  }, []);

  const availableDepts = useMemo(() => {
    if (departments && departments.length > 0) {
      return departments.map((d) => ({
        id: d.id,
        name: d.name,
        enCode: d.id.toUpperCase(),
        icon: getDepartmentIcon(d.id),
      }));
    }
    return DEFAULT_DEPARTMENTS;
  }, [departments]);

  const handleOpenAddForm = () => {
    setEditingTeacherId(null);
    setName('');
    setDesignation('ইন্সট্রাক্টর');
    setCategory('TECH');
    setDepartmentId(availableDepts[0]?.id || 'COMPUTER');
    setNonTechSubjectId('MATHEMATICS');
    setCustomSubjectName('');
    setPhone('');
    setIsFormOpen(true);
    setStatusMessage(null);
  };

  const handleOpenEditForm = (teacher: Teacher) => {
    setEditingTeacherId(teacher.id);
    setName(teacher.name || '');
    setDesignation(teacher.designation || '');
    setPhone(teacher.phone || '');

    // Detect category safely
    if (teacher.category === 'NON_TECH' || teacher.isNonTech || teacher.departmentId === 'NON_TECH') {
      setCategory('NON_TECH');
      setDepartmentId('NON_TECH');
    } else if (teacher.category === 'ALL_TECH' || teacher.departmentId === 'ALL_TECH') {
      setCategory('ALL_TECH');
      setDepartmentId('ALL_TECH');
    } else {
      setCategory('TECH');
      setDepartmentId(teacher.departmentId || availableDepts[0]?.id || 'COMPUTER');
    }

    // Match Non-Tech subject
    const matchedSubject = NON_TECH_SUBJECTS.find(
      (s) => s.name === teacher.nonTechSubject || s.id === teacher.nonTechSubject
    );
    if (matchedSubject) {
      setNonTechSubjectId(matchedSubject.id);
      setCustomSubjectName('');
    } else if (teacher.nonTechSubject) {
      setNonTechSubjectId('CUSTOM');
      setCustomSubjectName(teacher.nonTechSubject);
    } else {
      setNonTechSubjectId('MATHEMATICS');
      setCustomSubjectName('');
    }

    setIsFormOpen(true);
    setStatusMessage(null);
  };

  const handleSaveTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setStatusMessage({ type: 'error', text: 'অনুগ্রহ করে শিক্ষকের নাম লিখুন।' });
      return;
    }

    setSaving(true);
    setStatusMessage(null);
    try {
      let finalDeptId = departmentId;
      let finalDeptName = '';
      let nonTechSubject = '';

      if (category === 'NON_TECH') {
        finalDeptId = 'NON_TECH';
        const selectedSub = NON_TECH_SUBJECTS.find((s) => s.id === nonTechSubjectId);
        if (customSubjectName.trim()) {
          nonTechSubject = customSubjectName.trim();
          finalDeptName = `নন-টেক (${customSubjectName.trim()})`;
        } else if (selectedSub) {
          nonTechSubject = selectedSub.name;
          finalDeptName = `নন-টেক (${selectedSub.name})`;
        } else {
          nonTechSubject = 'সাধারণ বিষয়';
          finalDeptName = 'নন-টেক বিভাগ';
        }
      } else if (category === 'ALL_TECH') {
        finalDeptId = 'ALL_TECH';
        finalDeptName = 'সকল টেকনোলজি (সার্বজনীন)';
        nonTechSubject = '';
      } else {
        // TECH
        const selectedDept = availableDepts.find((d) => d.id === departmentId);
        finalDeptId = departmentId;
        finalDeptName = selectedDept?.name || departmentId;
        nonTechSubject = '';
      }

      const teacherPayload: Omit<Teacher, 'id'> = {
        name: name.trim(),
        designation: designation.trim() || 'ইন্সট্রাক্টর',
        departmentId: finalDeptId,
        departmentName: finalDeptName,
        phone: phone.trim() || '',
        category: category,
        isNonTech: category === 'NON_TECH',
        nonTechSubject: nonTechSubject,
      };

      await saveTeacher(teacherPayload, editingTeacherId || undefined);
      await loadTeacherList();
      setIsFormOpen(false);
    } catch (err) {
      console.error('Error saving teacher:', err);
      setStatusMessage({ type: 'error', text: 'শিক্ষকের তথ্য সংরক্ষণ করতে ব্যর্থ হয়েছে।' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTeacher = async (id: string, teacherName: string) => {
    if (!window.confirm(`আপনি কি নিশ্চিত যে "${teacherName}"-কে মুছে ফেলতে চান?`)) {
      return;
    }

    try {
      await deleteTeacher(id);
      await loadTeacherList();
    } catch (err) {
      console.error('Error deleting teacher:', err);
      alert('শিক্ষক মুছে ফেলতে ব্যর্থ হয়েছে।');
    }
  };

  // Filtered list
  const filteredTeachers = useMemo(() => {
    return teachers.filter((t) => {
      const matchSearch =
        (t.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.designation || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.departmentName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.nonTechSubject || '').toLowerCase().includes(searchQuery.toLowerCase());

      // Category filter
      let matchCat = true;
      if (categoryFilter === 'NON_TECH') {
        matchCat = Boolean(t.isNonTech || t.departmentId === 'NON_TECH' || t.category === 'NON_TECH');
      } else if (categoryFilter === 'ALL_TECH') {
        matchCat = Boolean(t.departmentId === 'ALL_TECH' || t.category === 'ALL_TECH');
      } else if (categoryFilter === 'TECH') {
        matchCat = !t.isNonTech && t.departmentId !== 'NON_TECH' && t.departmentId !== 'ALL_TECH' && t.category !== 'ALL_TECH';
      }

      // Department filter
      const matchDept = selectedDeptFilter === 'ALL' || t.departmentId === selectedDeptFilter;

      return matchSearch && matchCat && matchDept;
    });
  }, [teachers, searchQuery, categoryFilter, selectedDeptFilter]);

  // Counts
  const counts = useMemo(() => {
    let tech = 0;
    let nonTech = 0;
    let allTech = 0;
    teachers.forEach((t) => {
      if (t.isNonTech || t.departmentId === 'NON_TECH' || t.category === 'NON_TECH') {
        nonTech++;
      } else if (t.departmentId === 'ALL_TECH' || t.category === 'ALL_TECH') {
        allTech++;
      } else {
        tech++;
      }
    });
    return { all: teachers.length, tech, nonTech, allTech };
  }, [teachers]);

  // Options for Tech Departments
  const deptOptions: SelectOption[] = availableDepts.map((d) => ({
    value: d.id,
    label: d.name,
    sublabel: d.enCode,
    badge: 'TECH',
    icon: d.icon,
  }));

  // Options for Non-Tech Subjects (Action Sheet)
  const nonTechOptions: SelectOption[] = NON_TECH_SUBJECTS.map((s) => ({
    value: s.id,
    label: s.name,
    sublabel: s.enCode,
    badge: 'NON-TECH',
    icon: s.icon,
  }));

  const selectedDeptObj = availableDepts.find((d) => d.id === departmentId);
  const selectedNonTechObj = NON_TECH_SUBJECTS.find((s) => s.id === nonTechSubjectId);

  return (
    <div className="space-y-6 max-w-6xl mx-auto font-bengali">
      {/* Top Header Card */}
      <div className="bg-white/90 backdrop-blur-xl p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3.5 rounded-2xl bg-teal-50 text-teal-700 border border-teal-200/70 shadow-2xs">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">শিক্ষক ব্যবস্থাপনা</h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-teal-50 text-teal-800 border border-teal-200 font-outfit uppercase tracking-wider">
                  {teachers.length} FACULTY
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                টেকনোলজি ভিত্তিক, নন-টেক বা সার্বজনীন শিক্ষকদের ডাটাবেজ ও ক্লাস রুটিন সংযোগ।
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={loadTeacherList}
              disabled={loading}
              className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
              title="রিফ্রেশ করুন"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={handleOpenAddForm}
              className="px-4 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer active:scale-98"
            >
              <Plus className="w-4 h-4" />
              <span>নতুন শিক্ষক যোগ করুন</span>
            </button>
          </div>
        </div>

        {/* Quick Category Filter Pills */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => {
              setCategoryFilter('ALL');
              setSelectedDeptFilter('ALL');
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              categoryFilter === 'ALL' && selectedDeptFilter === 'ALL'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700'
            }`}
          >
            <GraduationCap className="w-4 h-4 shrink-0" />
            <span>সকল শিক্ষক</span>
            <span
              className={`text-[10px] font-outfit font-black px-1.5 py-0.2 rounded-md ${
                categoryFilter === 'ALL' && selectedDeptFilter === 'ALL'
                  ? 'bg-teal-800 text-teal-100'
                  : 'bg-white text-slate-600'
              }`}
            >
              {counts.all}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setCategoryFilter('TECH')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              categoryFilter === 'TECH'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700'
            }`}
          >
            <Cpu className="w-4 h-4 shrink-0" />
            <span>টেকনোলজি ভিত্তিক</span>
            <span
              className={`text-[10px] font-outfit font-black px-1.5 py-0.2 rounded-md ${
                categoryFilter === 'TECH' ? 'bg-teal-800 text-teal-100' : 'bg-white text-slate-600'
              }`}
            >
              {counts.tech}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setCategoryFilter('NON_TECH')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              categoryFilter === 'NON_TECH'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50 hover:bg-amber-100/80 text-amber-900 border border-amber-200/70'
            }`}
          >
            <BookOpen className="w-4 h-4 shrink-0" />
            <span>নন-টেক / সাধারণ শিক্ষক</span>
            <span
              className={`text-[10px] font-outfit font-black px-1.5 py-0.2 rounded-md ${
                categoryFilter === 'NON_TECH' ? 'bg-amber-700 text-amber-100' : 'bg-white text-amber-800'
              }`}
            >
              {counts.nonTech}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setCategoryFilter('ALL_TECH')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              categoryFilter === 'ALL_TECH'
                ? 'bg-purple-700 text-white shadow-xs'
                : 'bg-purple-50 hover:bg-purple-100/80 text-purple-900 border border-purple-200/70'
            }`}
          >
            <Layers className="w-4 h-4 shrink-0" />
            <span>সার্বজনীন / সকল টেকনোলজি</span>
            <span
              className={`text-[10px] font-outfit font-black px-1.5 py-0.2 rounded-md ${
                categoryFilter === 'ALL_TECH' ? 'bg-purple-800 text-purple-100' : 'bg-white text-purple-800'
              }`}
            >
              {counts.allTech}
            </span>
          </button>
        </div>

        {/* Search & Department Filter Bar */}
        <div className="mt-3.5 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="শিক্ষকের নাম, পদবি বা বিষয় লিখে খুঁজুন..."
              className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-teal-600 focus:outline-hidden font-medium"
            />
          </div>

          <div>
            <SelectTrigger
              label=""
              value={selectedDeptFilter}
              displayValue={
                selectedDeptFilter === 'ALL'
                  ? 'সকল বিভাগ / টেকনোলজি'
                  : selectedDeptFilter === 'NON_TECH'
                  ? 'নন-টেক বিভাগ'
                  : selectedDeptFilter === 'ALL_TECH'
                  ? 'সকল টেকনোলজি'
                  : availableDepts.find((d) => d.id === selectedDeptFilter)?.name || selectedDeptFilter
              }
              placeholder="সকল বিভাগ"
              onClick={() => setFilterDeptSheetOpen(true)}
              icon={Building2}
            />
          </div>
        </div>
      </div>

      {/* Teachers List Grid / Empty State */}
      {loading ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-500">
          <RefreshCw className="w-8 h-8 text-teal-600 animate-spin mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-700">শিক্ষক তালিকা লোড হচ্ছে...</p>
        </div>
      ) : filteredTeachers.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center text-slate-500">
          <UserCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="font-bold text-slate-800 text-sm">কোনো শিক্ষক পাওয়া যায়নি</p>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {teachers.length === 0
              ? 'বর্তমানে ডেটাবেজে কোনো শিক্ষক যুক্ত নেই। উপরের "নতুন শিক্ষক যোগ করুন" বোতামে ক্লিক করে শিক্ষক যোগ করুন।'
              : 'আপনার অনুসন্ধান অনুযায়ী কোনো শিক্ষক পাওয়া যায়নি। ফিল্টার পরিবর্তন করুন বা অন্য কিছু লিখে খুঁজুন।'}
          </p>
          {teachers.length === 0 && (
            <button
              onClick={handleOpenAddForm}
              className="mt-4 px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold transition-all shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>প্রথম শিক্ষক যোগ করুন</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTeachers.map((teacher) => {
            const isNonTech = Boolean(
              teacher.isNonTech || teacher.departmentId === 'NON_TECH' || teacher.category === 'NON_TECH'
            );
            const isAllTech = Boolean(teacher.departmentId === 'ALL_TECH' || teacher.category === 'ALL_TECH');

            let CardIcon = Cpu;
            let avatarBg = 'bg-teal-50 text-teal-700 border-teal-200/80';
            let badgeBg = 'bg-teal-50 border-teal-200 text-teal-900';
            let badgeLabel = 'TECH';

            if (isNonTech) {
              CardIcon = BookOpen;
              avatarBg = 'bg-amber-50 text-amber-800 border-amber-200/80';
              badgeBg = 'bg-amber-50 border-amber-200 text-amber-900';
              badgeLabel = 'NON-TECH';
            } else if (isAllTech) {
              CardIcon = Layers;
              avatarBg = 'bg-purple-50 text-purple-800 border-purple-200/80';
              badgeBg = 'bg-purple-50 border-purple-200 text-purple-900';
              badgeLabel = 'ALL TECH';
            }

            return (
              <div
                key={teacher.id}
                className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs hover:border-teal-600 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2.5">
                    <div className={`p-2.5 rounded-xl border ${avatarBg} shrink-0 shadow-2xs`}>
                      <CardIcon className="w-4 h-4" />
                    </div>

                    {/* Badge with SVG Icon and strictly UPPERCASE English */}
                    <div
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-black font-outfit uppercase tracking-wider ${badgeBg}`}
                    >
                      <CardIcon className="w-3 h-3 shrink-0" />
                      <span>{badgeLabel}</span>
                    </div>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-teal-700 transition-colors">
                    {teacher.name}
                  </h3>
                  <p className="text-xs text-slate-600 font-medium mt-0.5">
                    {teacher.designation || 'ইন্সট্রাক্টর'}
                  </p>

                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span className="font-semibold text-slate-700 truncate">
                      {teacher.departmentName || teacher.departmentId}
                    </span>
                    {teacher.nonTechSubject && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 shrink-0 ml-1">
                        {teacher.nonTechSubject}
                      </span>
                    )}
                  </div>

                  {teacher.phone && (
                    <div className="mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                      <p className="flex items-center gap-1.5">
                        <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="font-outfit font-semibold text-slate-700">{teacher.phone}</span>
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleOpenEditForm(teacher)}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-700 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>সম্পাদনা</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteTeacher(teacher.id, teacher.name)}
                    className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition-colors cursor-pointer"
                    title="মুছে ফেলুন"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modern Sliding Bottom Sheet for Add/Edit Teacher */}
      <BottomSheet
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingTeacherId ? 'শিক্ষকের তথ্য সম্পাদনা' : 'নতুন শিক্ষক যোগ করুন'}
        subtitle="টেকনোলজি ভিত্তিক অথবা নন-টেক ও সাধারণ শিক্ষক নির্বাচন করুন"
        maxHeight="max-h-[90vh]"
      >
        <div className="space-y-4 pb-4">
          {statusMessage && (
            <div
              className={`p-3 rounded-xl text-xs font-bold ${
                statusMessage.type === 'error'
                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}
            >
              {statusMessage.text}
            </div>
          )}

          <form onSubmit={handleSaveTeacher} className="space-y-4">
            {/* Category Selector Cards (SVG icons + strictly UPPERCASE tags) */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-2">
                শিক্ষকের ধরন / ক্যাটাগরি নির্বাচন করুন <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {/* 1. Tech Faculty */}
                <button
                  type="button"
                  onClick={() => setCategory('TECH')}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                    category === 'TECH'
                      ? 'bg-teal-50/90 border-teal-600 ring-2 ring-teal-600/20 shadow-xs'
                      : 'bg-white hover:bg-slate-50 border-slate-200/80'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div
                      className={`p-2 rounded-xl border ${
                        category === 'TECH'
                          ? 'bg-teal-600 text-white border-teal-600'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      <Cpu className="w-4 h-4" />
                    </div>
                    <span className="text-[9px] font-black font-outfit uppercase tracking-wider px-1.5 py-0.5 rounded bg-teal-100 text-teal-800">
                      TECH
                    </span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">টেকনোলজি ভিত্তিক</p>
                    <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">
                      কম্পিউটার, সিভিল, ইলেকট্রিক্যাল ইত্যাদি নির্দিষ্ট টেকনোলজি
                    </p>
                  </div>
                </button>

                {/* 2. Non-Tech Faculty */}
                <button
                  type="button"
                  onClick={() => setCategory('NON_TECH')}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                    category === 'NON_TECH'
                      ? 'bg-amber-50/90 border-amber-600 ring-2 ring-amber-600/20 shadow-xs'
                      : 'bg-white hover:bg-slate-50 border-slate-200/80'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div
                      className={`p-2 rounded-xl border ${
                        category === 'NON_TECH'
                          ? 'bg-amber-600 text-white border-amber-600'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <span className="text-[9px] font-black font-outfit uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-100 text-amber-900">
                      NON-TECH
                    </span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">নন-টেক / সাধারণ শিক্ষক</p>
                    <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">
                      বাংলা, ইংরেজি, গণিত, পদার্থ, রসায়ন বা সাধারণ বিষয়
                    </p>
                  </div>
                </button>

                {/* 3. All-Tech / Central Faculty */}
                <button
                  type="button"
                  onClick={() => setCategory('ALL_TECH')}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                    category === 'ALL_TECH'
                      ? 'bg-purple-50/90 border-purple-600 ring-2 ring-purple-600/20 shadow-xs'
                      : 'bg-white hover:bg-slate-50 border-slate-200/80'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div
                      className={`p-2 rounded-xl border ${
                        category === 'ALL_TECH'
                          ? 'bg-purple-600 text-white border-purple-600'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      <Layers className="w-4 h-4" />
                    </div>
                    <span className="text-[9px] font-black font-outfit uppercase tracking-wider px-1.5 py-0.5 rounded bg-purple-100 text-purple-900">
                      ALL TECH
                    </span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">সার্বজনীন / সব টেকনোলজি</p>
                    <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">
                      কোনো নির্দিষ্ট টেকনোলজির নয়, সব ডিপার্টমেন্টে ক্লাস নেন
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* Non-Tech Subject Selection via Action Sheet (SelectTrigger) */}
            {category === 'NON_TECH' && (
              <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/90 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-950">
                    <BookOpen className="w-4 h-4 text-amber-800" />
                    <span>নন-টেক বিষয় নির্বাচন</span>
                  </div>
                  <span className="text-[10px] font-black font-outfit uppercase tracking-wider text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                    NON-TECH SUBJECT
                  </span>
                </div>

                {/* Modern Action Sheet Trigger for Non-Tech Subject */}
                <SelectTrigger
                  label="নন-টেক বিষয়ের ধরন"
                  value={nonTechSubjectId}
                  displayValue={selectedNonTechObj?.name || 'বিষয় নির্বাচন করুন'}
                  placeholder="বিষয় নির্বাচন করুন"
                  onClick={() => setNonTechSheetOpen(true)}
                  icon={selectedNonTechObj?.icon || BookOpen}
                />

                <div>
                  <label className="block text-[11px] font-bold text-amber-950 mb-1">
                    নির্দিষ্ট পেপার বা বিষয়ের নাম (ঐচ্ছিক)
                  </label>
                  <input
                    type="text"
                    value={customSubjectName}
                    onChange={(e) => setCustomSubjectName(e.target.value)}
                    placeholder="বিষয়ের নাম লিখুন"
                    className="w-full px-3.5 py-2.5 text-xs bg-white border border-amber-300/80 rounded-xl focus:border-amber-600 focus:outline-hidden font-medium text-slate-800"
                  />
                  <p className="text-[10px] text-amber-800 mt-1">
                    * সিলেক্টকৃত বিষয় শিক্ষকের বিভাগের পাশে যুক্ত হবে
                  </p>
                </div>
              </div>
            )}

            {/* Tech Department Selection Sub-panel via Action Sheet */}
            {category === 'TECH' && (
              <div>
                <SelectTrigger
                  label="সংশ্লিষ্ট টেকনোলজি নির্বাচন"
                  value={departmentId}
                  displayValue={selectedDeptObj?.name || departmentId}
                  placeholder="টেকনোলজি সিলেক্ট করুন"
                  onClick={() => setDeptSheetOpen(true)}
                  icon={selectedDeptObj?.icon || Cpu}
                />
              </div>
            )}

            {/* All-Tech Informational Notice */}
            {category === 'ALL_TECH' && (
              <div className="p-3.5 rounded-2xl bg-purple-50/80 border border-purple-200/80 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
                <div className="text-xs text-purple-950 leading-relaxed font-medium">
                  <strong className="font-bold">সার্বজনীন শিক্ষক:</strong> এই শিক্ষক কোনো নির্দিষ্ট টেকনোলজির অধীনে নন;
                  প্রতিষ্ঠানটির যেকোনো টেকনোলজির ক্লাস রুটিনে এনাকে শিক্ষক হিসেবে যুক্ত করা যাবে।
                </div>
              </div>
            )}

            {/* Name input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                শিক্ষকের নাম <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="শিক্ষকের পূর্ণ নাম লিখুন"
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-teal-600 focus:outline-hidden font-medium"
              />
            </div>

            {/* Designation input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                পদবি <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                placeholder="শিক্ষকের পদবি লিখুন"
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-teal-600 focus:outline-hidden font-medium"
              />
            </div>

            {/* Phone input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">মোবাইল নম্বর (ঐচ্ছিক)</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="মোবাইল নম্বর লিখুন"
                  className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-teal-600 focus:outline-hidden font-outfit font-medium"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                বাতিল
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 text-xs font-bold bg-teal-700 hover:bg-teal-800 text-white rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-98"
              >
                {saving ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>সংরক্ষণ হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>সংরক্ষণ করুন</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </BottomSheet>

      {/* Action Sheet (SelectBottomSheet) for Non-Tech Subject */}
      <SelectBottomSheet
        isOpen={nonTechSheetOpen}
        onClose={() => setNonTechSheetOpen(false)}
        title="নন-টেক বিষয় নির্বাচন"
        subtitle="সংশ্লিষ্ট নন-টেক বা সাধারণ বিষয় সিলেক্ট করুন"
        options={nonTechOptions}
        selectedValue={nonTechSubjectId}
        onSelect={(val) => {
          setNonTechSubjectId(val);
          setCustomSubjectName('');
        }}
      />

      {/* Action Sheet (SelectBottomSheet) for Tech Department */}
      <SelectBottomSheet
        isOpen={deptSheetOpen}
        onClose={() => setDeptSheetOpen(false)}
        title="টেকনোলজি নির্বাচন"
        subtitle="শিক্ষকের সংশ্লিষ্ট টেকনোলজি সিলেক্ট করুন"
        options={deptOptions}
        selectedValue={departmentId}
        onSelect={(val) => setDepartmentId(val)}
      />

      {/* Action Sheet (SelectBottomSheet) for Department Filter */}
      <SelectBottomSheet
        isOpen={filterDeptSheetOpen}
        onClose={() => setFilterDeptSheetOpen(false)}
        title="বিভাগ অনুযায়ী ফিল্টার"
        subtitle="তালিকায় দেখার জন্য বিভাগ নির্বাচন করুন"
        options={[
          { value: 'ALL', label: 'সকল বিভাগ / টেকনোলজি', sublabel: 'ALL DEPARTMENTS', icon: GraduationCap },
          { value: 'NON_TECH', label: 'নন-টেক বিভাগ', sublabel: 'NON-TECH & GENERAL', icon: BookOpen },
          { value: 'ALL_TECH', label: 'সকল টেকনোলজি (সার্বজনীন)', sublabel: 'ALL TECHNOLOGY', icon: Layers },
          ...deptOptions,
        ]}
        selectedValue={selectedDeptFilter}
        onSelect={(val) => setSelectedDeptFilter(val)}
      />
    </div>
  );
};
