import React from 'react';
import {
  GraduationCap,
  MapPin,
  Clock,
  Phone,
  ShieldCheck,
  Building,
  FileText,
  CheckCircle2,
} from 'lucide-react';
import { toBanglaDigits, toEnglishDigits } from '../../utils/bangla';
import { parsePhoneNumbers } from '../../services/admissionService';
import { AdmissionSettings } from '../../types';

interface AdmissionFooterProps {
  settings?: AdmissionSettings;
  className?: string;
}

export const AdmissionFooter: React.FC<AdmissionFooterProps> = ({
  settings,
  className = '',
}) => {
  const contactPhones = settings?.contactPhone
    ? parsePhoneNumbers(settings.contactPhone)
    : ['01712-345678', '01912-345678'];

  return (
    <footer
      id="admission-portal-footer"
      className={`bg-[#F0F8FF] text-slate-700 border-t border-sky-200/75 font-bengali ${className}`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 sm:pt-12 pb-36 sm:pb-20">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-8 border-b border-sky-200/60">
          {/* Col 1: Institute Brand & Identity */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-11 h-11 rounded-2xl bg-white p-0.5 border border-blue-200 flex items-center justify-center shrink-0 shadow-xs">
                <img
                  src="https://i.postimg.cc/j5K3pb0M/sovapoti-images1.png"
                  alt="DPIB Logo"
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <span className="font-outfit text-slate-900 font-black text-base tracking-tight block">
                  DPIB <span className="text-blue-600">ADMISSION PORTAL</span>
                </span>
                <span className="text-xs text-slate-600 font-bold block">
                  দক্ষিণবঙ্গ পলিটেকনিক ইনস্টিটিউট
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed max-w-md font-medium">
              বাংলাদেশ কারিগরি শিক্ষা বোর্ড (BTEB) অনুমোদিত ভোলা জেলার শীর্ষস্থানীয় কারিগরি শিক্ষাপ্রতিষ্ঠান। চার বছর মেয়াদি ডিপ্লোমা ইন ইঞ্জিনিয়ারিং শিক্ষাক্রমে বাস্তবমুখী ও কর্মসংস্থানমূলক প্রকৌশল শিক্ষার নিশ্চয়তা।
            </p>

            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 pt-1">
              <span className="flex items-center gap-1.5 bg-white border border-blue-100 px-2.5 py-1 rounded-lg text-blue-900 font-semibold shadow-2xs">
                <Building className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>ইনস্টিটিউট কোড: ৪০০৫২</span>
              </span>
              <span className="flex items-center gap-1.5 bg-white border border-emerald-100 px-2.5 py-1 rounded-lg text-emerald-900 font-semibold shadow-2xs">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>BTEB অনুমোদিত</span>
              </span>
            </div>
          </div>

          {/* Col 2: Admission Help & Campus Location */}
          <div className="md:col-span-4 space-y-3">
            <h4 className="text-slate-900 font-bold text-xs uppercase tracking-wider font-outfit flex items-center gap-2">
              <Phone className="w-4 h-4 text-blue-600" />
              <span>ভর্তি হেল্পডেস্ক ও ক্যাম্পাস</span>
            </h4>

            <div className="space-y-2.5 text-xs text-slate-600 font-medium">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span className="leading-relaxed">
                  বীরশ্রেষ্ঠ মোস্তফা কামাল বাস স্ট্যান্ড সংলগ্ন, ভোলা সদর, ভোলা।
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600 shrink-0" />
                <span>
                  অফিস সময়: <strong className="text-slate-900 font-bold">{settings?.helplineHours || 'সকাল ০৯:০০ - বিকাল ০৫:০০'}</strong>
                </span>
              </div>

              <div className="pt-1.5 space-y-1">
                <span className="text-[11px] text-slate-500 font-bold block">জরুরি হটলাইন:</span>
                <div className="flex flex-wrap gap-2">
                  {contactPhones.map((phone, idx) => (
                    <a
                      key={idx}
                      href={`tel:${toEnglishDigits(phone).replace(/[^0-9+]/g, '')}`}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors font-outfit text-xs font-bold"
                    >
                      <Phone className="w-3 h-3 text-blue-600" />
                      <span>{phone}</span>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Col 3: Academic Programs & Highlights */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-slate-900 font-bold text-xs uppercase tracking-wider font-outfit flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-blue-600" />
              <span>প্রকৌশল বিভাগসমূহ</span>
            </h4>

            <ul className="space-y-1.5 text-xs text-slate-600 font-medium">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>কম্পিউটার টেকনোলজি</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>সিভিল টেকনোলজি</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>ইলেকট্রিক্যাল টেকনোলজি</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>মেকানিক্যাল টেকনোলজি</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>ইলেকট্রনিক্স টেকনোলজি</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright & certification */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 font-medium">
          <p>© ২০২৪-২০২৬ দক্ষিণবঙ্গ পলিটেকনিক ইনস্টিটিউট • সর্বস্বত্ব সংরক্ষিত</p>
          <p className="font-outfit text-slate-600 text-[11px] uppercase tracking-wider font-bold">
            BTEB APPROVED POLYTECHNIC INSTITUTE • BHOLA
          </p>
        </div>
      </div>
    </footer>
  );
};
