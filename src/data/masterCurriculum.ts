import { CurriculumSubject } from '../types';

/**
 * MASTER CURRICULUM DATABASE
 * Extracted directly from official DPIB Curriculum Reference PDF.
 * Covers 6 Technologies: CIVIL, COMPUTER, ELECTRICAL, MECHANICAL, MARINE, SURVEYING.
 * Total 313 curriculum subject entries across semesters.
 * 
 * NOTE: curriculumFullMarks is ONLY a reference value from BTEB syllabus.
 * Exam-specific actual full marks are dynamically set per exam.
 */
export const MASTER_CURRICULUM_DATA: CurriculumSubject[] = [
  // ==========================================
  // CIVIL TECHNOLOGY (53 Subjects)
  // ==========================================
  // CIVIL - 1st Semester
  { id: 'CIVIL_1st_21011', technology: 'CIVIL', semester: '1st', semesterId: '1', subjectCode: '21011', subjectName: 'ইঞ্জিনিয়ারিং ড্রয়িং', curriculumFullMarks: 100 },
  { id: 'CIVIL_1st_25711', technology: 'CIVIL', semester: '1st', semesterId: '1', subjectCode: '25711', subjectName: 'বাংলা-১', curriculumFullMarks: 100 },
  { id: 'CIVIL_1st_25712', technology: 'CIVIL', semester: '1st', semesterId: '1', subjectCode: '25712', subjectName: 'ইংরেজি-১', curriculumFullMarks: 100 },
  { id: 'CIVIL_1st_25811', technology: 'CIVIL', semester: '1st', semesterId: '1', subjectCode: '25811', subjectName: 'সোশ্যাল সাইন্স', curriculumFullMarks: 100 },
  { id: 'CIVIL_1st_25911', technology: 'CIVIL', semester: '1st', semesterId: '1', subjectCode: '25911', subjectName: 'গণিত-১', curriculumFullMarks: 200 },
  { id: 'CIVIL_1st_25913', technology: 'CIVIL', semester: '1st', semesterId: '1', subjectCode: '25913', subjectName: 'রসায়ন', curriculumFullMarks: 200 },
  { id: 'CIVIL_1st_26411', technology: 'CIVIL', semester: '1st', semesterId: '1', subjectCode: '26411', subjectName: 'সিভিল ইঞ্জিনিয়ারিং মেটেরিয়ালস', curriculumFullMarks: 150 },
  { id: 'CIVIL_1st_26711', technology: 'CIVIL', semester: '1st', semesterId: '1', subjectCode: '26711', subjectName: 'বেসিক ইলেকট্রিসিটি', curriculumFullMarks: 200 },

  // CIVIL - 2nd Semester
  { id: 'CIVIL_2nd_25721', technology: 'CIVIL', semester: '2nd', semesterId: '2', subjectCode: '25721', subjectName: 'বাংলা-২', curriculumFullMarks: 100 },
  { id: 'CIVIL_2nd_25722', technology: 'CIVIL', semester: '2nd', semesterId: '2', subjectCode: '25722', subjectName: 'ইংরেজি-২', curriculumFullMarks: 100 },
  { id: 'CIVIL_2nd_25812', technology: 'CIVIL', semester: '2nd', semesterId: '2', subjectCode: '25812', subjectName: 'শারীরিক শিক্ষা ও জীবনদক্ষতা উন্নয়ন', curriculumFullMarks: 50 },
  { id: 'CIVIL_2nd_25912', technology: 'CIVIL', semester: '2nd', semesterId: '2', subjectCode: '25912', subjectName: 'পদার্থবিজ্ঞান-১', curriculumFullMarks: 200 },
  { id: 'CIVIL_2nd_25921', technology: 'CIVIL', semester: '2nd', semesterId: '2', subjectCode: '25921', subjectName: 'গণিত-২', curriculumFullMarks: 200 },
  { id: 'CIVIL_2nd_26421', technology: 'CIVIL', semester: '2nd', semesterId: '2', subjectCode: '26421', subjectName: 'সিভিল ইঞ্জিনিয়ারিং ড্রয়িং', curriculumFullMarks: 150 },
  { id: 'CIVIL_2nd_26811', technology: 'CIVIL', semester: '2nd', semesterId: '2', subjectCode: '26811', subjectName: 'বেসিক ইলেকট্রনিক্স', curriculumFullMarks: 150 },
  { id: 'CIVIL_2nd_27011', technology: 'CIVIL', semester: '2nd', semesterId: '2', subjectCode: '27011', subjectName: 'বেসিক ওয়ার্কশপ প্র্যাকটিস', curriculumFullMarks: 50 },

  // CIVIL - 3rd Semester
  { id: 'CIVIL_3rd_25831', technology: 'CIVIL', semester: '3rd', semesterId: '3', subjectCode: '25831', subjectName: 'বিজনেস কমিউনিকেশন', curriculumFullMarks: 100 },
  { id: 'CIVIL_3rd_25922', technology: 'CIVIL', semester: '3rd', semesterId: '3', subjectCode: '25922', subjectName: 'পদার্থবিজ্ঞান-২', curriculumFullMarks: 200 },
  { id: 'CIVIL_3rd_25931', technology: 'CIVIL', semester: '3rd', semesterId: '3', subjectCode: '25931', subjectName: 'গণিত-৩', curriculumFullMarks: 200 },
  { id: 'CIVIL_3rd_26431', technology: 'CIVIL', semester: '3rd', semesterId: '3', subjectCode: '26431', subjectName: 'স্ট্রাকচারাল মেকানিক্স', curriculumFullMarks: 150 },
  { id: 'CIVIL_3rd_26432', technology: 'CIVIL', semester: '3rd', semesterId: '3', subjectCode: '26432', subjectName: 'সার্ভেয়িং-১', curriculumFullMarks: 150 },
  { id: 'CIVIL_3rd_26433', technology: 'CIVIL', semester: '3rd', semesterId: '3', subjectCode: '26433', subjectName: 'কনস্ট্রাকশন প্রসেস-১', curriculumFullMarks: 150 },
  { id: 'CIVIL_3rd_28511', technology: 'CIVIL', semester: '3rd', semesterId: '3', subjectCode: '28511', subjectName: 'কম্পিউটার অফিস অ্যাপ্লিকেশন', curriculumFullMarks: 100 },

  // CIVIL - 4th Semester
  { id: 'CIVIL_4th_25841', technology: 'CIVIL', semester: '4th', semesterId: '4', subjectCode: '25841', subjectName: 'একাউন্টিং', curriculumFullMarks: 100 },
  { id: 'CIVIL_4th_26441', technology: 'CIVIL', semester: '4th', semesterId: '4', subjectCode: '26441', subjectName: 'কনস্ট্রাকশন প্রসেস-২', curriculumFullMarks: 150 },
  { id: 'CIVIL_4th_26442', technology: 'CIVIL', semester: '4th', semesterId: '4', subjectCode: '26442', subjectName: 'এস্টিমেটিং অ্যান্ড কস্টিং-১', curriculumFullMarks: 150 },
  { id: 'CIVIL_4th_26443', technology: 'CIVIL', semester: '4th', semesterId: '4', subjectCode: '26443', subjectName: 'সিভিল ক্যাড-১', curriculumFullMarks: 100 },
  { id: 'CIVIL_4th_26444', technology: 'CIVIL', semester: '4th', semesterId: '4', subjectCode: '26444', subjectName: 'সার্ভেয়িং-২', curriculumFullMarks: 150 },
  { id: 'CIVIL_4th_26445', technology: 'CIVIL', semester: '4th', semesterId: '4', subjectCode: '26445', subjectName: 'জিওটেকনিক্যাল ইঞ্জিনিয়ারিং', curriculumFullMarks: 150 },
  { id: 'CIVIL_4th_26446', technology: 'CIVIL', semester: '4th', semesterId: '4', subjectCode: '26446', subjectName: 'হাইড্রোলজি', curriculumFullMarks: 150 },
  { id: 'CIVIL_4th_26521', technology: 'CIVIL', semester: '4th', semesterId: '4', subjectCode: '26521', subjectName: 'উড ওয়ার্কশপ প্র্যাকটিস', curriculumFullMarks: 100 },

  // CIVIL - 5th Semester
  { id: 'CIVIL_5th_25852', technology: 'CIVIL', semester: '5th', semesterId: '5', subjectCode: '25852', subjectName: 'ইন্ডাস্ট্রিয়াল ম্যানেজমেন্ট', curriculumFullMarks: 100 },
  { id: 'CIVIL_5th_26451', technology: 'CIVIL', semester: '5th', semesterId: '5', subjectCode: '26451', subjectName: 'ফাউন্ডেশন ইঞ্জিনিয়ারিং', curriculumFullMarks: 150 },
  { id: 'CIVIL_5th_26452', technology: 'CIVIL', semester: '5th', semesterId: '5', subjectCode: '26452', subjectName: 'সিভিল ক্যাড-২', curriculumFullMarks: 150 },
  { id: 'CIVIL_5th_26453', technology: 'CIVIL', semester: '5th', semesterId: '5', subjectCode: '26453', subjectName: 'সার্ভেয়িং-৩', curriculumFullMarks: 150 },
  { id: 'CIVIL_5th_26454', technology: 'CIVIL', semester: '5th', semesterId: '5', subjectCode: '26454', subjectName: 'থিওরি অফ স্ট্রাকচার', curriculumFullMarks: 150 },
  { id: 'CIVIL_5th_26455', technology: 'CIVIL', semester: '5th', semesterId: '5', subjectCode: '26455', subjectName: 'ওয়াটার সাপ্লাই ইঞ্জিনিয়ারিং', curriculumFullMarks: 150 },
  { id: 'CIVIL_5th_26456', technology: 'CIVIL', semester: '5th', semesterId: '5', subjectCode: '26456', subjectName: 'হাইড্রোলিক্স', curriculumFullMarks: 150 },

  // CIVIL - 6th Semester
  { id: 'CIVIL_6th_26461', technology: 'CIVIL', semester: '6th', semesterId: '6', subjectCode: '26461', subjectName: 'ওয়াটার রিসোর্সেস ইঞ্জিনিয়ারিং', curriculumFullMarks: 150 },
  { id: 'CIVIL_6th_26462', technology: 'CIVIL', semester: '6th', semesterId: '6', subjectCode: '26462', subjectName: 'এডভান্স সার্ভেয়িং', curriculumFullMarks: 150 },
  { id: 'CIVIL_6th_26463', technology: 'CIVIL', semester: '6th', semesterId: '6', subjectCode: '26463', subjectName: 'ট্রান্সপোর্টেশন ইঞ্জিনিয়ারিং-১', curriculumFullMarks: 150 },
  { id: 'CIVIL_6th_26464', technology: 'CIVIL', semester: '6th', semesterId: '6', subjectCode: '26464', subjectName: 'ডিজাইন অফ স্ট্রাকচার-১', curriculumFullMarks: 150 },
  { id: 'CIVIL_6th_28863', technology: 'CIVIL', semester: '6th', semesterId: '6', subjectCode: '28863', subjectName: 'স্টিল স্ট্রাকচারস', curriculumFullMarks: 150 },
  { id: 'CIVIL_6th_28861', technology: 'CIVIL', semester: '6th', semesterId: '6', subjectCode: '28861', subjectName: 'এডভান্সড কনস্ট্রাকশন', curriculumFullMarks: 150 },
  { id: 'CIVIL_6th_29041', technology: 'CIVIL', semester: '6th', semesterId: '6', subjectCode: '29041', subjectName: 'এনভায়রনমেন্টাল স্টাডিজ', curriculumFullMarks: 150 },

  // CIVIL - 7th Semester
  { id: 'CIVIL_7th_25851', technology: 'CIVIL', semester: '7th', semesterId: '7', subjectCode: '25851', subjectName: 'প্রিন্সিপালস অফ মার্কেটিং', curriculumFullMarks: 100 },
  { id: 'CIVIL_7th_25853', technology: 'CIVIL', semester: '7th', semesterId: '7', subjectCode: '25853', subjectName: 'ইনোভেশন অ্যান্ড এন্টারপ্রেনারশিপ', curriculumFullMarks: 100 },
  { id: 'CIVIL_7th_26471', technology: 'CIVIL', semester: '7th', semesterId: '7', subjectCode: '26471', subjectName: 'সিভিল ইঞ্জিনিয়ারিং প্রজেক্ট', curriculumFullMarks: 100 },
  { id: 'CIVIL_7th_26472', technology: 'CIVIL', semester: '7th', semesterId: '7', subjectCode: '26472', subjectName: 'স্যানিটারি ইঞ্জিনিয়ারিং', curriculumFullMarks: 150 },
  { id: 'CIVIL_7th_26473', technology: 'CIVIL', semester: '7th', semesterId: '7', subjectCode: '26473', subjectName: 'ট্রান্সপোর্টেশন ইঞ্জিনিয়ারিং-২', curriculumFullMarks: 150 },
  { id: 'CIVIL_7th_26474', technology: 'CIVIL', semester: '7th', semesterId: '7', subjectCode: '26474', subjectName: 'ডিজাইন অফ স্ট্রাকচার-২', curriculumFullMarks: 150 },
  { id: 'CIVIL_7th_26475', technology: 'CIVIL', semester: '7th', semesterId: '7', subjectCode: '26475', subjectName: 'এস্টিমেটিং অ্যান্ড কস্টিং-২', curriculumFullMarks: 150 },
  { id: 'CIVIL_7th_28871', technology: 'CIVIL', semester: '7th', semesterId: '7', subjectCode: '28871', subjectName: 'কনস্ট্রাকশন ম্যানেজমেন্ট অ্যান্ড ডকুমেন্টেশন', curriculumFullMarks: 150 },

  // ==========================================
  // COMPUTER TECHNOLOGY (51 Subjects)
  // ==========================================
  // COMPUTER - 1st Semester
  { id: 'COMPUTER_1st_21011', technology: 'COMPUTER', semester: '1st', semesterId: '1', subjectCode: '21011', subjectName: 'ইঞ্জিনিয়ারিং ড্রয়িং', curriculumFullMarks: 100 },
  { id: 'COMPUTER_1st_25711', technology: 'COMPUTER', semester: '1st', semesterId: '1', subjectCode: '25711', subjectName: 'বাংলা-১', curriculumFullMarks: 100 },
  { id: 'COMPUTER_1st_25712', technology: 'COMPUTER', semester: '1st', semesterId: '1', subjectCode: '25712', subjectName: 'ইংরেজি-১', curriculumFullMarks: 100 },
  { id: 'COMPUTER_1st_25911', technology: 'COMPUTER', semester: '1st', semesterId: '1', subjectCode: '25911', subjectName: 'গণিত-১', curriculumFullMarks: 200 },
  { id: 'COMPUTER_1st_25912', technology: 'COMPUTER', semester: '1st', semesterId: '1', subjectCode: '25912', subjectName: 'পদার্থবিজ্ঞান-১', curriculumFullMarks: 200 },
  { id: 'COMPUTER_1st_28511', technology: 'COMPUTER', semester: '1st', semesterId: '1', subjectCode: '28511', subjectName: 'কম্পিউটার অফিস অ্যাপ্লিকেশন', curriculumFullMarks: 100 },
  { id: 'COMPUTER_1st_26711', technology: 'COMPUTER', semester: '1st', semesterId: '1', subjectCode: '26711', subjectName: 'বেসিক ইলেকট্রিসিটি', curriculumFullMarks: 200 },

  // COMPUTER - 2nd Semester
  { id: 'COMPUTER_2nd_25721', technology: 'COMPUTER', semester: '2nd', semesterId: '2', subjectCode: '25721', subjectName: 'বাংলা-২', curriculumFullMarks: 100 },
  { id: 'COMPUTER_2nd_25722', technology: 'COMPUTER', semester: '2nd', semesterId: '2', subjectCode: '25722', subjectName: 'ইংরেজি-২', curriculumFullMarks: 100 },
  { id: 'COMPUTER_2nd_25812', technology: 'COMPUTER', semester: '2nd', semesterId: '2', subjectCode: '25812', subjectName: 'শারীরিক শিক্ষা ও জীবনদক্ষতা উন্নয়ন', curriculumFullMarks: 50 },
  { id: 'COMPUTER_2nd_25913', technology: 'COMPUTER', semester: '2nd', semesterId: '2', subjectCode: '25913', subjectName: 'রসায়ন', curriculumFullMarks: 200 },
  { id: 'COMPUTER_2nd_25921', technology: 'COMPUTER', semester: '2nd', semesterId: '2', subjectCode: '25921', subjectName: 'গণিত-২', curriculumFullMarks: 200 },
  { id: 'COMPUTER_2nd_28521', technology: 'COMPUTER', semester: '2nd', semesterId: '2', subjectCode: '28521', subjectName: 'পাইথন প্রোগ্রামিং', curriculumFullMarks: 150 },
  { id: 'COMPUTER_2nd_28522', technology: 'COMPUTER', semester: '2nd', semesterId: '2', subjectCode: '28522', subjectName: 'কম্পিউটার গ্রাফিক্স ডিজাইন-১', curriculumFullMarks: 100 },
  { id: 'COMPUTER_2nd_26811', technology: 'COMPUTER', semester: '2nd', semesterId: '2', subjectCode: '26811', subjectName: 'বেসিক ইলেকট্রনিক্স', curriculumFullMarks: 150 },

  // COMPUTER - 3rd Semester
  { id: 'COMPUTER_3rd_25811', technology: 'COMPUTER', semester: '3rd', semesterId: '3', subjectCode: '25811', subjectName: 'সোশ্যাল সাইন্স', curriculumFullMarks: 100 },
  { id: 'COMPUTER_3rd_25922', technology: 'COMPUTER', semester: '3rd', semesterId: '3', subjectCode: '25922', subjectName: 'পদার্থবিজ্ঞান-২', curriculumFullMarks: 200 },
  { id: 'COMPUTER_3rd_25931', technology: 'COMPUTER', semester: '3rd', semesterId: '3', subjectCode: '25931', subjectName: 'গণিত-৩', curriculumFullMarks: 200 },
  { id: 'COMPUTER_3rd_28531', technology: 'COMPUTER', semester: '3rd', semesterId: '3', subjectCode: '28531', subjectName: 'অ্যাপ্লিকেশন ডেভেলপমেন্ট ইউজিং পাইথন', curriculumFullMarks: 150 },
  { id: 'COMPUTER_3rd_28532', technology: 'COMPUTER', semester: '3rd', semesterId: '3', subjectCode: '28532', subjectName: 'কম্পিউটার গ্রাফিক্স ডিজাইন-২', curriculumFullMarks: 50 },
  { id: 'COMPUTER_3rd_28533', technology: 'COMPUTER', semester: '3rd', semesterId: '3', subjectCode: '28533', subjectName: 'আইটি সাপোর্ট সার্ভিসেস', curriculumFullMarks: 200 },
  { id: 'COMPUTER_3rd_26831', technology: 'COMPUTER', semester: '3rd', semesterId: '3', subjectCode: '26831', subjectName: 'ডিজিটাল ইলেকট্রনিক্স-১', curriculumFullMarks: 150 },

  // COMPUTER - 4th Semester
  { id: 'COMPUTER_4th_25831', technology: 'COMPUTER', semester: '4th', semesterId: '4', subjectCode: '25831', subjectName: 'বিজনেস কমিউনিকেশন', curriculumFullMarks: 100 },
  { id: 'COMPUTER_4th_28541', technology: 'COMPUTER', semester: '4th', semesterId: '4', subjectCode: '28541', subjectName: 'জাভা প্রোগ্রামিং', curriculumFullMarks: 150 },
  { id: 'COMPUTER_4th_28542', technology: 'COMPUTER', semester: '4th', semesterId: '4', subjectCode: '28542', subjectName: 'ডাটা স্ট্রাকচার অ্যান্ড অ্যালগরিদম', curriculumFullMarks: 150 },
  { id: 'COMPUTER_4th_28543', technology: 'COMPUTER', semester: '4th', semesterId: '4', subjectCode: '28543', subjectName: 'কম্পিউটার পেরিফেরালস অ্যান্ড ইন্টারফেসিং', curriculumFullMarks: 200 },
  { id: 'COMPUTER_4th_28544', technology: 'COMPUTER', semester: '4th', semesterId: '4', subjectCode: '28544', subjectName: 'ওয়েব ডিজাইন অ্যান্ড ডেভেলপমেন্ট-১', curriculumFullMarks: 150 },
  { id: 'COMPUTER_4th_26841', technology: 'COMPUTER', semester: '4th', semesterId: '4', subjectCode: '26841', subjectName: 'ডিজিটাল ইলেকট্রনিক্স-২', curriculumFullMarks: 150 },
  { id: 'COMPUTER_4th_29041', technology: 'COMPUTER', semester: '4th', semesterId: '4', subjectCode: '29041', subjectName: 'এনভায়রনমেন্টাল স্টাডিজ', curriculumFullMarks: 150 },

  // COMPUTER - 5th Semester
  { id: 'COMPUTER_5th_25841', technology: 'COMPUTER', semester: '5th', semesterId: '5', subjectCode: '25841', subjectName: 'একাউন্টিং', curriculumFullMarks: 100 },
  { id: 'COMPUTER_5th_28551', technology: 'COMPUTER', semester: '5th', semesterId: '5', subjectCode: '28551', subjectName: 'অ্যাপ্লিকেশন ডেভেলপমেন্ট ইউজিং জাভা', curriculumFullMarks: 150 },
  { id: 'COMPUTER_5th_28552', technology: 'COMPUTER', semester: '5th', semesterId: '5', subjectCode: '28552', subjectName: 'ওয়েব ডিজাইন অ্যান্ড ডেভেলপমেন্ট-২', curriculumFullMarks: 150 },
  { id: 'COMPUTER_5th_28553', technology: 'COMPUTER', semester: '5th', semesterId: '5', subjectCode: '28553', subjectName: 'কম্পিউটার আর্কিটেকচার অ্যান্ড মাইক্রোপ্রসেসর', curriculumFullMarks: 200 },
  { id: 'COMPUTER_5th_28554', technology: 'COMPUTER', semester: '5th', semesterId: '5', subjectCode: '28554', subjectName: 'ডাটা কমিউনিকেশন', curriculumFullMarks: 200 },
  { id: 'COMPUTER_5th_28555', technology: 'COMPUTER', semester: '5th', semesterId: '5', subjectCode: '28555', subjectName: 'অপারেটিং সিস্টেম', curriculumFullMarks: 150 },
  { id: 'COMPUTER_5th_28556', technology: 'COMPUTER', semester: '5th', semesterId: '5', subjectCode: '28556', subjectName: 'প্রজেক্ট ওয়ার্ক-১', curriculumFullMarks: 50 },

  // COMPUTER - 6th Semester
  { id: 'COMPUTER_6th_25851', technology: 'COMPUTER', semester: '6th', semesterId: '6', subjectCode: '25851', subjectName: 'প্রিন্সিপালস অফ মার্কেটিং', curriculumFullMarks: 100 },
  { id: 'COMPUTER_6th_25852', technology: 'COMPUTER', semester: '6th', semesterId: '6', subjectCode: '25852', subjectName: 'ইন্ডাস্ট্রিয়াল ম্যানেজমেন্ট', curriculumFullMarks: 100 },
  { id: 'COMPUTER_6th_28561', technology: 'COMPUTER', semester: '6th', semesterId: '6', subjectCode: '28561', subjectName: 'ডাটাবেজ ম্যানেজমেন্ট সিস্টেম', curriculumFullMarks: 150 },
  { id: 'COMPUTER_6th_28562', technology: 'COMPUTER', semester: '6th', semesterId: '6', subjectCode: '28562', subjectName: 'কম্পিউটার নেটওয়ার্কিং', curriculumFullMarks: 150 },
  { id: 'COMPUTER_6th_28563', technology: 'COMPUTER', semester: '6th', semesterId: '6', subjectCode: '28563', subjectName: 'সেন্সর অ্যান্ড আইওটি সিস্টেম', curriculumFullMarks: 150 },
  { id: 'COMPUTER_6th_28564', technology: 'COMPUTER', semester: '6th', semesterId: '6', subjectCode: '28564', subjectName: 'মাইক্রোকন্ট্রোলার বেসড সিস্টেম ডিজাইন অ্যান্ড ডেভেলপমেন্ট', curriculumFullMarks: 200 },
  { id: 'COMPUTER_6th_28565', technology: 'COMPUTER', semester: '6th', semesterId: '6', subjectCode: '28565', subjectName: 'সার্ভেইল্যান্ড সিকিউরিটি সিস্টেম', curriculumFullMarks: 100 },
  { id: 'COMPUTER_6th_28566', technology: 'COMPUTER', semester: '6th', semesterId: '6', subjectCode: '28566', subjectName: 'ওয়েব ডেভেলপমেন্ট প্রজেক্ট', curriculumFullMarks: 50 },

  // COMPUTER - 7th Semester
  { id: 'COMPUTER_7th_25853', technology: 'COMPUTER', semester: '7th', semesterId: '7', subjectCode: '25853', subjectName: 'ইনোভেশন অ্যান্ড এন্টারপ্রেনারশিপ', curriculumFullMarks: 100 },
  { id: 'COMPUTER_7th_28571', technology: 'COMPUTER', semester: '7th', semesterId: '7', subjectCode: '28571', subjectName: 'ডিজিটাল মার্কেটিং টেকনিক', curriculumFullMarks: 150 },
  { id: 'COMPUTER_7th_28572', technology: 'COMPUTER', semester: '7th', semesterId: '7', subjectCode: '28572', subjectName: 'নেটওয়ার্ক অ্যাডমিনিস্ট্রেশন অ্যান্ড সার্ভিসেস', curriculumFullMarks: 200 },
  { id: 'COMPUTER_7th_28573', technology: 'COMPUTER', semester: '7th', semesterId: '7', subjectCode: '28573', subjectName: 'সাইবার সিকিউরিটি অ্যান্ড এথিক্স', curriculumFullMarks: 150 },
  { id: 'COMPUTER_7th_28574', technology: 'COMPUTER', semester: '7th', semesterId: '7', subjectCode: '28574', subjectName: 'অ্যাপস ডেভেলপমেন্ট প্রজেক্ট', curriculumFullMarks: 100 },
  { id: 'COMPUTER_7th_28575', technology: 'COMPUTER', semester: '7th', semesterId: '7', subjectCode: '28575', subjectName: 'মাল্টিমিডিয়া অ্যান্ড এনিমেশন', curriculumFullMarks: 150 },
  { id: 'COMPUTER_7th_28576', technology: 'COMPUTER', semester: '7th', semesterId: '7', subjectCode: '28576', subjectName: 'প্রজেক্ট ওয়ার্ক-২', curriculumFullMarks: 100 },

  // ==========================================
  // ELECTRICAL TECHNOLOGY (48 Subjects)
  // ==========================================
  // ELECTRICAL - 1st Semester
  { id: 'ELECTRICAL_1st_21011', technology: 'ELECTRICAL', semester: '1st', semesterId: '1', subjectCode: '21011', subjectName: 'ইঞ্জিনিয়ারিং ড্রয়িং', curriculumFullMarks: 100 },
  { id: 'ELECTRICAL_1st_25711', technology: 'ELECTRICAL', semester: '1st', semesterId: '1', subjectCode: '25711', subjectName: 'বাংলা-১', curriculumFullMarks: 100 },
  { id: 'ELECTRICAL_1st_25712', technology: 'ELECTRICAL', semester: '1st', semesterId: '1', subjectCode: '25712', subjectName: 'ইংরেজি-১', curriculumFullMarks: 100 },
  { id: 'ELECTRICAL_1st_25812', technology: 'ELECTRICAL', semester: '1st', semesterId: '1', subjectCode: '25812', subjectName: 'শারীরিক শিক্ষা ও জীবনদক্ষতা উন্নয়ন', curriculumFullMarks: 50 },
  { id: 'ELECTRICAL_1st_25911', technology: 'ELECTRICAL', semester: '1st', semesterId: '1', subjectCode: '25911', subjectName: 'গণিত-১', curriculumFullMarks: 200 },
  { id: 'ELECTRICAL_1st_25912', technology: 'ELECTRICAL', semester: '1st', semesterId: '1', subjectCode: '25912', subjectName: 'পদার্থবিজ্ঞান-১', curriculumFullMarks: 200 },
  { id: 'ELECTRICAL_1st_26711', technology: 'ELECTRICAL', semester: '1st', semesterId: '1', subjectCode: '26711', subjectName: 'বেসিক ইলেকট্রিসিটি', curriculumFullMarks: 200 },
  { id: 'ELECTRICAL_1st_26712', technology: 'ELECTRICAL', semester: '1st', semesterId: '1', subjectCode: '26712', subjectName: 'ইলেকট্রিক্যাল ইঞ্জিনিয়ারিং মেটেরিয়ালস', curriculumFullMarks: 100 },

  // ELECTRICAL - 2nd Semester
  { id: 'ELECTRICAL_2nd_25721', technology: 'ELECTRICAL', semester: '2nd', semesterId: '2', subjectCode: '25721', subjectName: 'বাংলা-২', curriculumFullMarks: 100 },
  { id: 'ELECTRICAL_2nd_25722', technology: 'ELECTRICAL', semester: '2nd', semesterId: '2', subjectCode: '25722', subjectName: 'ইংরেজি-২', curriculumFullMarks: 100 },
  { id: 'ELECTRICAL_2nd_25921', technology: 'ELECTRICAL', semester: '2nd', semesterId: '2', subjectCode: '25921', subjectName: 'গণিত-২', curriculumFullMarks: 200 },
  { id: 'ELECTRICAL_2nd_25922', technology: 'ELECTRICAL', semester: '2nd', semesterId: '2', subjectCode: '25922', subjectName: 'পদার্থবিজ্ঞান-২', curriculumFullMarks: 200 },
  { id: 'ELECTRICAL_2nd_26721', technology: 'ELECTRICAL', semester: '2nd', semesterId: '2', subjectCode: '26721', subjectName: 'ইলেকট্রিক্যাল সার্কিট-১', curriculumFullMarks: 200 },
  { id: 'ELECTRICAL_2nd_26722', technology: 'ELECTRICAL', semester: '2nd', semesterId: '2', subjectCode: '26722', subjectName: 'ইলেকট্রিক্যাল ইঞ্জিনিয়ারিং ড্রয়িং', curriculumFullMarks: 150 },
  { id: 'ELECTRICAL_2nd_26811', technology: 'ELECTRICAL', semester: '2nd', semesterId: '2', subjectCode: '26811', subjectName: 'বেসিক ইলেকট্রনিক্স', curriculumFullMarks: 150 },

  // ELECTRICAL - 3rd Semester
  { id: 'ELECTRICAL_3rd_25931', technology: 'ELECTRICAL', semester: '3rd', semesterId: '3', subjectCode: '25931', subjectName: 'গণিত-৩', curriculumFullMarks: 200 },
  { id: 'ELECTRICAL_3rd_25913', technology: 'ELECTRICAL', semester: '3rd', semesterId: '3', subjectCode: '25913', subjectName: 'রসায়ন', curriculumFullMarks: 200 },
  { id: 'ELECTRICAL_3rd_28511', technology: 'ELECTRICAL', semester: '3rd', semesterId: '3', subjectCode: '28511', subjectName: 'কম্পিউটার অফিস অ্যাপ্লিকেশনস', curriculumFullMarks: 100 },
  { id: 'ELECTRICAL_3rd_26731', technology: 'ELECTRICAL', semester: '3rd', semesterId: '3', subjectCode: '26731', subjectName: 'ইলেকট্রিক্যাল সার্কিট-২', curriculumFullMarks: 200 },
  { id: 'ELECTRICAL_3rd_26732', technology: 'ELECTRICAL', semester: '3rd', semesterId: '3', subjectCode: '26732', subjectName: 'ইলেকট্রিক্যাল অ্যাপ্লায়েন্সেস', curriculumFullMarks: 150 },
  { id: 'ELECTRICAL_3rd_26833', technology: 'ELECTRICAL', semester: '3rd', semesterId: '3', subjectCode: '26833', subjectName: 'ইন্ডাস্ট্রিয়াল ইলেকট্রনিক্স', curriculumFullMarks: 200 },

  // ELECTRICAL - 4th Semester
  { id: 'ELECTRICAL_4th_25811', technology: 'ELECTRICAL', semester: '4th', semesterId: '4', subjectCode: '25811', subjectName: 'সোশ্যাল সাইন্স', curriculumFullMarks: 100 },
  { id: 'ELECTRICAL_4th_25841', technology: 'ELECTRICAL', semester: '4th', semesterId: '4', subjectCode: '25841', subjectName: 'একাউন্টিং', curriculumFullMarks: 100 },
  { id: 'ELECTRICAL_4th_26741', technology: 'ELECTRICAL', semester: '4th', semesterId: '4', subjectCode: '26741', subjectName: 'ইলেকট্রিক্যাল ইনস্টলেশন, প্ল্যানিং অ্যান্ড এস্টিমেটিং', curriculumFullMarks: 200 },
  { id: 'ELECTRICAL_4th_26742', technology: 'ELECTRICAL', semester: '4th', semesterId: '4', subjectCode: '26742', subjectName: 'ডি সি মেশিন', curriculumFullMarks: 200 },
  { id: 'ELECTRICAL_4th_26743', technology: 'ELECTRICAL', semester: '4th', semesterId: '4', subjectCode: '26743', subjectName: 'ইলেকট্রিক্যাল ইঞ্জিনিয়ারিং প্রজেক্ট-১', curriculumFullMarks: 100 },
  { id: 'ELECTRICAL_4th_26845', technology: 'ELECTRICAL', semester: '4th', semesterId: '4', subjectCode: '26845', subjectName: 'ডিজিটাল ইলেকট্রনিক্স', curriculumFullMarks: 200 },
  { id: 'ELECTRICAL_4th_27044', technology: 'ELECTRICAL', semester: '4th', semesterId: '4', subjectCode: '27044', subjectName: 'অ্যাপ্লায়েড মেকানিক্স', curriculumFullMarks: 150 },

  // ELECTRICAL - 5th Semester
  { id: 'ELECTRICAL_5th_25851', technology: 'ELECTRICAL', semester: '5th', semesterId: '5', subjectCode: '25851', subjectName: 'প্রিন্সিপাল অফ মার্কেটিং', curriculumFullMarks: 100 },
  { id: 'ELECTRICAL_5th_25852', technology: 'ELECTRICAL', semester: '5th', semesterId: '5', subjectCode: '25852', subjectName: 'ইন্ডাস্ট্রিয়াল ম্যানেজমেন্ট', curriculumFullMarks: 100 },
  { id: 'ELECTRICAL_5th_26751', technology: 'ELECTRICAL', semester: '5th', semesterId: '5', subjectCode: '26751', subjectName: 'জেনারেশন অফ ইলেকট্রিক্যাল পাওয়ার', curriculumFullMarks: 200 },
  { id: 'ELECTRICAL_5th_26752', technology: 'ELECTRICAL', semester: '5th', semesterId: '5', subjectCode: '26752', subjectName: 'ইলেকট্রিক্যাল অ্যান্ড ইলেকট্রনিক মেজারমেন্টস-১', curriculumFullMarks: 150 },
  { id: 'ELECTRICAL_5th_26753', technology: 'ELECTRICAL', semester: '5th', semesterId: '5', subjectCode: '26753', subjectName: 'টেস্টিং অ্যান্ড মেইনটেন্যান্স অফ ইলেকট্রিক্যাল ইকুইপমেন্টস', curriculumFullMarks: 150 },
  { id: 'ELECTRICAL_5th_26754', technology: 'ELECTRICAL', semester: '5th', semesterId: '5', subjectCode: '26754', subjectName: 'ইলেকট্রিক্যাল ইঞ্জিনিয়ারিং প্রজেক্ট-২', curriculumFullMarks: 100 },
  { id: 'ELECTRICAL_5th_26853', technology: 'ELECTRICAL', semester: '5th', semesterId: '5', subjectCode: '26853', subjectName: 'মাইক্রোপ্রসেসর অ্যান্ড মাইক্রোকন্ট্রোলার', curriculumFullMarks: 200 },

  // ELECTRICAL - 6th Semester
  { id: 'ELECTRICAL_6th_28567', technology: 'ELECTRICAL', semester: '6th', semesterId: '6', subjectCode: '28567', subjectName: 'প্রোগ্রামিং ইন সি', curriculumFullMarks: 150 },
  { id: 'ELECTRICAL_6th_26761', technology: 'ELECTRICAL', semester: '6th', semesterId: '6', subjectCode: '26761', subjectName: 'এসি মেশিন-১', curriculumFullMarks: 200 },
  { id: 'ELECTRICAL_6th_26762', technology: 'ELECTRICAL', semester: '6th', semesterId: '6', subjectCode: '26762', subjectName: 'ট্রান্সমিশন অ্যান্ড ডিস্ট্রিবিউশন অফ ইলেকট্রিক্যাল পাওয়ার-১', curriculumFullMarks: 200 },
  { id: 'ELECTRICAL_6th_26763', technology: 'ELECTRICAL', semester: '6th', semesterId: '6', subjectCode: '26763', subjectName: 'ইলেকট্রিক্যাল অ্যান্ড ইলেকট্রনিক মেজারমেন্টস-২', curriculumFullMarks: 150 },
  { id: 'ELECTRICAL_6th_26842', technology: 'ELECTRICAL', semester: '6th', semesterId: '6', subjectCode: '26842', subjectName: 'কমিউনিকেশন ইঞ্জিনিয়ারিং', curriculumFullMarks: 150 },
  { id: 'ELECTRICAL_6th_29041', technology: 'ELECTRICAL', semester: '6th', semesterId: '6', subjectCode: '29041', subjectName: 'এনভায়রনমেন্টাল স্টাডিজ', curriculumFullMarks: 150 },

  // ELECTRICAL - 7th Semester
  { id: 'ELECTRICAL_7th_25831', technology: 'ELECTRICAL', semester: '7th', semesterId: '7', subjectCode: '25831', subjectName: 'বিজনেস কমিউনিকেশন', curriculumFullMarks: 100 },
  { id: 'ELECTRICAL_7th_25853', technology: 'ELECTRICAL', semester: '7th', semesterId: '7', subjectCode: '25853', subjectName: 'ইনোভেশন অ্যান্ড এন্টারপ্রেনারশিপ', curriculumFullMarks: 100 },
  { id: 'ELECTRICAL_7th_26771', technology: 'ELECTRICAL', semester: '7th', semesterId: '7', subjectCode: '26771', subjectName: 'এসি মেশিন-২', curriculumFullMarks: 200 },
  { id: 'ELECTRICAL_7th_26772', technology: 'ELECTRICAL', semester: '7th', semesterId: '7', subjectCode: '26772', subjectName: 'ট্রান্সমিশন অ্যান্ড ডিস্ট্রিবিউশন অফ ইলেকট্রিক্যাল পাওয়ার-২', curriculumFullMarks: 200 },
  { id: 'ELECTRICAL_7th_26773', technology: 'ELECTRICAL', semester: '7th', semesterId: '7', subjectCode: '26773', subjectName: 'সুইচ গিয়ার অ্যান্ড প্রোটেকশন', curriculumFullMarks: 200 },
  { id: 'ELECTRICAL_7th_26774', technology: 'ELECTRICAL', semester: '7th', semesterId: '7', subjectCode: '26774', subjectName: 'ইলেকট্রিক্যাল ইঞ্জিনিয়ারিং প্রজেক্ট-৩', curriculumFullMarks: 100 },
  { id: 'ELECTRICAL_7th_26875', technology: 'ELECTRICAL', semester: '7th', semesterId: '7', subjectCode: '26875', subjectName: 'অটোমেশন ইঞ্জিনিয়ারিং অ্যান্ড পিএলসি', curriculumFullMarks: 200 },

  // ==========================================
  // MECHANICAL TECHNOLOGY (50 Subjects)
  // ==========================================
  // MECHANICAL - 1st Semester
  { id: 'MECHANICAL_1st_21011', technology: 'MECHANICAL', semester: '1st', semesterId: '1', subjectCode: '21011', subjectName: 'ইঞ্জিনিয়ারিং ড্রয়িং', curriculumFullMarks: 100 },
  { id: 'MECHANICAL_1st_25711', technology: 'MECHANICAL', semester: '1st', semesterId: '1', subjectCode: '25711', subjectName: 'বাংলা-১', curriculumFullMarks: 100 },
  { id: 'MECHANICAL_1st_25712', technology: 'MECHANICAL', semester: '1st', semesterId: '1', subjectCode: '25712', subjectName: 'ইংরেজি-১', curriculumFullMarks: 100 },
  { id: 'MECHANICAL_1st_25812', technology: 'MECHANICAL', semester: '1st', semesterId: '1', subjectCode: '25812', subjectName: 'শারীরিক শিক্ষা ও জীবনদক্ষতা উন্নয়ন', curriculumFullMarks: 50 },
  { id: 'MECHANICAL_1st_25911', technology: 'MECHANICAL', semester: '1st', semesterId: '1', subjectCode: '25911', subjectName: 'গণিত-১', curriculumFullMarks: 200 },
  { id: 'MECHANICAL_1st_25912', technology: 'MECHANICAL', semester: '1st', semesterId: '1', subjectCode: '25912', subjectName: 'পদার্থবিজ্ঞান-১', curriculumFullMarks: 200 },
  { id: 'MECHANICAL_1st_27011', technology: 'MECHANICAL', semester: '1st', semesterId: '1', subjectCode: '27011', subjectName: 'বেসিক ওয়ার্কশপ প্র্যাকটিস', curriculumFullMarks: 50 },
  { id: 'MECHANICAL_1st_27012', technology: 'MECHANICAL', semester: '1st', semesterId: '1', subjectCode: '27012', subjectName: 'মেশিন শপ প্র্যাকটিস-১', curriculumFullMarks: 150 },

  // MECHANICAL - 2nd Semester
  { id: 'MECHANICAL_2nd_25721', technology: 'MECHANICAL', semester: '2nd', semesterId: '2', subjectCode: '25721', subjectName: 'বাংলা-২', curriculumFullMarks: 100 },
  { id: 'MECHANICAL_2nd_25722', technology: 'MECHANICAL', semester: '2nd', semesterId: '2', subjectCode: '25722', subjectName: 'ইংরেজি-২', curriculumFullMarks: 100 },
  { id: 'MECHANICAL_2nd_25913', technology: 'MECHANICAL', semester: '2nd', semesterId: '2', subjectCode: '25913', subjectName: 'রসায়ন', curriculumFullMarks: 200 },
  { id: 'MECHANICAL_2nd_25921', technology: 'MECHANICAL', semester: '2nd', semesterId: '2', subjectCode: '25921', subjectName: 'গণিত-২', curriculumFullMarks: 200 },
  { id: 'MECHANICAL_2nd_25922', technology: 'MECHANICAL', semester: '2nd', semesterId: '2', subjectCode: '25922', subjectName: 'পদার্থবিজ্ঞান-২', curriculumFullMarks: 200 },
  { id: 'MECHANICAL_2nd_26711', technology: 'MECHANICAL', semester: '2nd', semesterId: '2', subjectCode: '26711', subjectName: 'বেসিক ইলেকট্রিসিটি', curriculumFullMarks: 200 },
  { id: 'MECHANICAL_2nd_27021', technology: 'MECHANICAL', semester: '2nd', semesterId: '2', subjectCode: '27021', subjectName: 'মেকানিক্যাল ইঞ্জিনিয়ারিং ড্রয়িং', curriculumFullMarks: 150 },

  // MECHANICAL - 3rd Semester
  { id: 'MECHANICAL_3rd_25811', technology: 'MECHANICAL', semester: '3rd', semesterId: '3', subjectCode: '25811', subjectName: 'সোশ্যাল সাইন্স', curriculumFullMarks: 100 },
  { id: 'MECHANICAL_3rd_25831', technology: 'MECHANICAL', semester: '3rd', semesterId: '3', subjectCode: '25831', subjectName: 'বিজনেস কমিউনিকেশন', curriculumFullMarks: 100 },
  { id: 'MECHANICAL_3rd_25931', technology: 'MECHANICAL', semester: '3rd', semesterId: '3', subjectCode: '25931', subjectName: 'গণিত-৩', curriculumFullMarks: 200 },
  { id: 'MECHANICAL_3rd_27031', technology: 'MECHANICAL', semester: '3rd', semesterId: '3', subjectCode: '27031', subjectName: 'মেকানিক্যাল ইঞ্জিনিয়ারিং মেটেরিয়ালস', curriculumFullMarks: 100 },
  { id: 'MECHANICAL_3rd_27032', technology: 'MECHANICAL', semester: '3rd', semesterId: '3', subjectCode: '27032', subjectName: 'মেশিন শপ প্র্যাকটিস-২', curriculumFullMarks: 150 },
  { id: 'MECHANICAL_3rd_27231', technology: 'MECHANICAL', semester: '3rd', semesterId: '3', subjectCode: '27231', subjectName: 'আরএসি সাইকেলস অ্যান্ড কম্পোনেন্টস', curriculumFullMarks: 150 },
  { id: 'MECHANICAL_3rd_28511', technology: 'MECHANICAL', semester: '3rd', semesterId: '3', subjectCode: '28511', subjectName: 'কম্পিউটার অফিস অ্যাপ্লিকেশন', curriculumFullMarks: 100 },

  // MECHANICAL - 4th Semester
  { id: 'MECHANICAL_4th_25841', technology: 'MECHANICAL', semester: '4th', semesterId: '4', subjectCode: '25841', subjectName: 'একাউন্টিং', curriculumFullMarks: 100 },
  { id: 'MECHANICAL_4th_26811', technology: 'MECHANICAL', semester: '4th', semesterId: '4', subjectCode: '26811', subjectName: 'বেসিক ইলেকট্রনিক্স', curriculumFullMarks: 150 },
  { id: 'MECHANICAL_4th_27041', technology: 'MECHANICAL', semester: '4th', semesterId: '4', subjectCode: '27041', subjectName: 'ইঞ্জিনিয়ারিং মেকানিক্স', curriculumFullMarks: 150 },
  { id: 'MECHANICAL_4th_27042', technology: 'MECHANICAL', semester: '4th', semesterId: '4', subjectCode: '27042', subjectName: 'মেশিন শপ প্র্যাকটিস-৩', curriculumFullMarks: 150 },
  { id: 'MECHANICAL_4th_27043', technology: 'MECHANICAL', semester: '4th', semesterId: '4', subjectCode: '27043', subjectName: 'মেটালার্জি', curriculumFullMarks: 150 },
  { id: 'MECHANICAL_4th_27131', technology: 'MECHANICAL', semester: '4th', semesterId: '4', subjectCode: '27131', subjectName: 'ইঞ্জিনিয়ারিং থার্মোডায়নামিক্স', curriculumFullMarks: 200 },
  { id: 'MECHANICAL_4th_29041', technology: 'MECHANICAL', semester: '4th', semesterId: '4', subjectCode: '29041', subjectName: 'এনভায়রনমেন্টাল স্টাডিজ', curriculumFullMarks: 150 },

  // MECHANICAL - 5th Semester
  { id: 'MECHANICAL_5th_25852', technology: 'MECHANICAL', semester: '5th', semesterId: '5', subjectCode: '25852', subjectName: 'ইন্ডাস্ট্রিয়াল ম্যানেজমেন্ট', curriculumFullMarks: 100 },
  { id: 'MECHANICAL_5th_27051', technology: 'MECHANICAL', semester: '5th', semesterId: '5', subjectCode: '27051', subjectName: 'ফ্লুইড মেকানিক্স অ্যান্ড মেশিনারিজ', curriculumFullMarks: 200 },
  { id: 'MECHANICAL_5th_27052', technology: 'MECHANICAL', semester: '5th', semesterId: '5', subjectCode: '27052', subjectName: 'মেকানিক্যাল এস্টিমেটিং অ্যান্ড কস্টিং', curriculumFullMarks: 150 },
  { id: 'MECHANICAL_5th_27053', technology: 'MECHANICAL', semester: '5th', semesterId: '5', subjectCode: '27053', subjectName: 'এডভান্সড ওয়েল্ডিং-১', curriculumFullMarks: 200 },
  { id: 'MECHANICAL_5th_27054', technology: 'MECHANICAL', semester: '5th', semesterId: '5', subjectCode: '27054', subjectName: 'ফাউণ্ড্রি অ্যান্ড প্যাটার্ন মেকিং', curriculumFullMarks: 150 },
  { id: 'MECHANICAL_5th_27055', technology: 'MECHANICAL', semester: '5th', semesterId: '5', subjectCode: '27055', subjectName: 'ম্যানুফ্যাকচারিং প্রসেস', curriculumFullMarks: 150 },
  { id: 'MECHANICAL_5th_28567', technology: 'MECHANICAL', semester: '5th', semesterId: '5', subjectCode: '28567', subjectName: 'প্রোগ্রামিং ইন সি', curriculumFullMarks: 150 },

  // MECHANICAL - 6th Semester
  { id: 'MECHANICAL_6th_25851', technology: 'MECHANICAL', semester: '6th', semesterId: '6', subjectCode: '25851', subjectName: 'প্রিন্সিপালস অফ মার্কেটিং', curriculumFullMarks: 100 },
  { id: 'MECHANICAL_6th_26211', technology: 'MECHANICAL', semester: '6th', semesterId: '6', subjectCode: '26211', subjectName: 'অটোমোবাইল ফান্ডামেন্টালস', curriculumFullMarks: 150 },
  { id: 'MECHANICAL_6th_27061', technology: 'MECHANICAL', semester: '6th', semesterId: '6', subjectCode: '27061', subjectName: 'স্ট্রেন্থ অফ মেটেরিয়ালস', curriculumFullMarks: 200 },
  { id: 'MECHANICAL_6th_27062', technology: 'MECHANICAL', semester: '6th', semesterId: '6', subjectCode: '27062', subjectName: 'মেকানিক্যাল মেজারমেন্ট অ্যান্ড মেট্রোলজি', curriculumFullMarks: 150 },
  { id: 'MECHANICAL_6th_27063', technology: 'MECHANICAL', semester: '6th', semesterId: '6', subjectCode: '27063', subjectName: 'ক্যাড অ্যান্ড ক্যাম', curriculumFullMarks: 150 },
  { id: 'MECHANICAL_6th_27064', technology: 'MECHANICAL', semester: '6th', semesterId: '6', subjectCode: '27064', subjectName: 'এডভান্সড ওয়েল্ডিং-২', curriculumFullMarks: 150 },
  { id: 'MECHANICAL_6th_27065', technology: 'MECHANICAL', semester: '6th', semesterId: '6', subjectCode: '27065', subjectName: 'প্ল্যান্ট ইঞ্জিনিয়ারিং অ্যান্ড মেইনটেন্যান্স', curriculumFullMarks: 150 },

  // MECHANICAL - 7th Semester
  { id: 'MECHANICAL_7th_25853', technology: 'MECHANICAL', semester: '7th', semesterId: '7', subjectCode: '25853', subjectName: 'ইনোভেশন অ্যান্ড এন্টারপ্রেনারশিপ', curriculumFullMarks: 100 },
  { id: 'MECHANICAL_7th_27071', technology: 'MECHANICAL', semester: '7th', semesterId: '7', subjectCode: '27071', subjectName: 'ডিজাইন অফ মেশিন এলিমেন্টস', curriculumFullMarks: 200 },
  { id: 'MECHANICAL_7th_27072', technology: 'MECHANICAL', semester: '7th', semesterId: '7', subjectCode: '27072', subjectName: 'টুল ডিজাইন', curriculumFullMarks: 200 },
  { id: 'MECHANICAL_7th_27073', technology: 'MECHANICAL', semester: '7th', semesterId: '7', subjectCode: '27073', subjectName: 'হিট ট্রিটমেন্ট অফ মেটাল', curriculumFullMarks: 150 },
  { id: 'MECHANICAL_7th_27074', technology: 'MECHANICAL', semester: '7th', semesterId: '7', subjectCode: '27074', subjectName: 'মেকানিক্যাল ইঞ্জিনিয়ারিং প্রজেক্ট', curriculumFullMarks: 100 },
  { id: 'MECHANICAL_7th_27075', technology: 'MECHANICAL', semester: '7th', semesterId: '7', subjectCode: '27075', subjectName: 'প্রোডাকশন প্ল্যানিং অ্যান্ড কন্ট্রোল', curriculumFullMarks: 150 },
  { id: 'MECHANICAL_7th_29231', technology: 'MECHANICAL', semester: '7th', semesterId: '7', subjectCode: '29231', subjectName: 'মেকাট্রনিক্স অ্যান্ড পিএলসি', curriculumFullMarks: 200 },

  // ==========================================
  // MARINE TECHNOLOGY (54 Subjects)
  // ==========================================
  // MARINE - 1st Semester
  { id: 'MARINE_1st_21011', technology: 'MARINE', semester: '1st', semesterId: '1', subjectCode: '21011', subjectName: 'ইঞ্জিনিয়ারিং ড্রয়িং', curriculumFullMarks: 100 },
  { id: 'MARINE_1st_25711', technology: 'MARINE', semester: '1st', semesterId: '1', subjectCode: '25711', subjectName: 'বাংলা-১', curriculumFullMarks: 100 },
  { id: 'MARINE_1st_25712', technology: 'MARINE', semester: '1st', semesterId: '1', subjectCode: '25712', subjectName: 'ইংরেজি-১', curriculumFullMarks: 100 },
  { id: 'MARINE_1st_25812', technology: 'MARINE', semester: '1st', semesterId: '1', subjectCode: '25812', subjectName: 'শারীরিক শিক্ষা ও জীবনদক্ষতা উন্নয়ন', curriculumFullMarks: 50 },
  { id: 'MARINE_1st_25911', technology: 'MARINE', semester: '1st', semesterId: '1', subjectCode: '25911', subjectName: 'গণিত-১', curriculumFullMarks: 200 },
  { id: 'MARINE_1st_25912', technology: 'MARINE', semester: '1st', semesterId: '1', subjectCode: '25912', subjectName: 'পদার্থবিজ্ঞান-১', curriculumFullMarks: 200 },
  { id: 'MARINE_1st_26711', technology: 'MARINE', semester: '1st', semesterId: '1', subjectCode: '26711', subjectName: 'বেসিক ইলেকট্রিসিটি', curriculumFullMarks: 200 },
  { id: 'MARINE_1st_27011', technology: 'MARINE', semester: '1st', semesterId: '1', subjectCode: '27011', subjectName: 'বেসিক ওয়ার্কশপ প্র্যাকটিস', curriculumFullMarks: 50 },

  // MARINE - 2nd Semester
  { id: 'MARINE_2nd_25721', technology: 'MARINE', semester: '2nd', semesterId: '2', subjectCode: '25721', subjectName: 'বাংলা-২', curriculumFullMarks: 100 },
  { id: 'MARINE_2nd_25722', technology: 'MARINE', semester: '2nd', semesterId: '2', subjectCode: '25722', subjectName: 'ইংরেজি-২', curriculumFullMarks: 100 },
  { id: 'MARINE_2nd_25913', technology: 'MARINE', semester: '2nd', semesterId: '2', subjectCode: '25913', subjectName: 'রসায়ন', curriculumFullMarks: 200 },
  { id: 'MARINE_2nd_25921', technology: 'MARINE', semester: '2nd', semesterId: '2', subjectCode: '25921', subjectName: 'গণিত-২', curriculumFullMarks: 200 },
  { id: 'MARINE_2nd_25922', technology: 'MARINE', semester: '2nd', semesterId: '2', subjectCode: '25922', subjectName: 'পদার্থবিজ্ঞান-২', curriculumFullMarks: 200 },
  { id: 'MARINE_2nd_26811', technology: 'MARINE', semester: '2nd', semesterId: '2', subjectCode: '26811', subjectName: 'বেসিক ইলেকট্রনিক্স', curriculumFullMarks: 150 },
  { id: 'MARINE_2nd_27012', technology: 'MARINE', semester: '2nd', semesterId: '2', subjectCode: '27012', subjectName: 'মেশিন শপ প্র্যাকটিস-১', curriculumFullMarks: 150 },
  { id: 'MARINE_2nd_28021', technology: 'MARINE', semester: '2nd', semesterId: '2', subjectCode: '28021', subjectName: 'জেনারেল শিপ নলেজ', curriculumFullMarks: 50 },

  // MARINE - 3rd Semester
  { id: 'MARINE_3rd_25811', technology: 'MARINE', semester: '3rd', semesterId: '3', subjectCode: '25811', subjectName: 'সোশ্যাল সাইন্স', curriculumFullMarks: 100 },
  { id: 'MARINE_3rd_25931', technology: 'MARINE', semester: '3rd', semesterId: '3', subjectCode: '25931', subjectName: 'গণিত-৩', curriculumFullMarks: 200 },
  { id: 'MARINE_3rd_27032', technology: 'MARINE', semester: '3rd', semesterId: '3', subjectCode: '27032', subjectName: 'মেশিন শপ প্র্যাকটিস-২', curriculumFullMarks: 150 },
  { id: 'MARINE_3rd_27041', technology: 'MARINE', semester: '3rd', semesterId: '3', subjectCode: '27041', subjectName: 'ইঞ্জিনিয়ারিং মেকানিক্স', curriculumFullMarks: 150 },
  { id: 'MARINE_3rd_27131', technology: 'MARINE', semester: '3rd', semesterId: '3', subjectCode: '27131', subjectName: 'ইঞ্জিনিয়ারিং থার্মোডায়নামিক্স', curriculumFullMarks: 200 },
  { id: 'MARINE_3rd_27931', technology: 'MARINE', semester: '3rd', semesterId: '3', subjectCode: '27931', subjectName: 'মেরিন আইসি ইঞ্জিন-১', curriculumFullMarks: 150 },

  // MARINE - 4th Semester
  { id: 'MARINE_4th_25841', technology: 'MARINE', semester: '4th', semesterId: '4', subjectCode: '25841', subjectName: 'একাউন্টিং', curriculumFullMarks: 100 },
  { id: 'MARINE_4th_27043', technology: 'MARINE', semester: '4th', semesterId: '4', subjectCode: '27043', subjectName: 'মেটালার্জি', curriculumFullMarks: 150 },
  { id: 'MARINE_4th_27941', technology: 'MARINE', semester: '4th', semesterId: '4', subjectCode: '27941', subjectName: 'ফ্লুইড মেকানিক্স অ্যান্ড হাইড্রোলিক মেশিনারি', curriculumFullMarks: 200 },
  { id: 'MARINE_4th_27942', technology: 'MARINE', semester: '4th', semesterId: '4', subjectCode: '27942', subjectName: 'মেরিন আইসি ইঞ্জিন-২', curriculumFullMarks: 200 },
  { id: 'MARINE_4th_28041', technology: 'MARINE', semester: '4th', semesterId: '4', subjectCode: '28041', subjectName: 'নেভাল আর্কিটেকচার', curriculumFullMarks: 150 },
  { id: 'MARINE_4th_28042', technology: 'MARINE', semester: '4th', semesterId: '4', subjectCode: '28042', subjectName: 'ওয়েল্ডিং', curriculumFullMarks: 150 },
  { id: 'MARINE_4th_28511', technology: 'MARINE', semester: '4th', semesterId: '4', subjectCode: '28511', subjectName: 'কম্পিউটার অফিস অ্যাপ্লিকেশন', curriculumFullMarks: 100 },

  // MARINE - 5th Semester
  { id: 'MARINE_5th_27951', technology: 'MARINE', semester: '5th', semesterId: '5', subjectCode: '27951', subjectName: 'মেরিন অক্সিলিয়ারি সিস্টেমস', curriculumFullMarks: 150 },
  { id: 'MARINE_5th_27952', technology: 'MARINE', semester: '5th', semesterId: '5', subjectCode: '27952', subjectName: 'মেরিন বয়লার অ্যান্ড স্টিম ইঞ্জিনিয়ারিং', curriculumFullMarks: 150 },
  { id: 'MARINE_5th_27953', technology: 'MARINE', semester: '5th', semesterId: '5', subjectCode: '27953', subjectName: 'মেরিন ফুয়েলস অ্যান্ড লুব্রিকেন্টস', curriculumFullMarks: 100 },
  { id: 'MARINE_5th_27954', technology: 'MARINE', semester: '5th', semesterId: '5', subjectCode: '27954', subjectName: 'মেরিন আইসি ইঞ্জিন অপারেশন অ্যান্ড মেইনট্যান্যান্স', curriculumFullMarks: 100 },
  { id: 'MARINE_5th_27955', technology: 'MARINE', semester: '5th', semesterId: '5', subjectCode: '27955', subjectName: 'বেসিক সেফটি অ্যান্ড সিকিউরিটি', curriculumFullMarks: 200 },
  { id: 'MARINE_5th_27956', technology: 'MARINE', semester: '5th', semesterId: '5', subjectCode: '27956', subjectName: 'মেরিটাইম লজ', curriculumFullMarks: 100 },
  { id: 'MARINE_5th_27957', technology: 'MARINE', semester: '5th', semesterId: '5', subjectCode: '27957', subjectName: 'মেরিন ড্রয়িং', curriculumFullMarks: 50 },
  { id: 'MARINE_5th_28053', technology: 'MARINE', semester: '5th', semesterId: '5', subjectCode: '28053', subjectName: 'শিপ কনস্ট্রাকশন অ্যান্ড রিপেয়ার', curriculumFullMarks: 200 },

  // MARINE - 6th Semester
  { id: 'MARINE_6th_25852', technology: 'MARINE', semester: '6th', semesterId: '6', subjectCode: '25852', subjectName: 'ইন্ডাস্ট্রিয়াল ম্যানেজমেন্ট', curriculumFullMarks: 100 },
  { id: 'MARINE_6th_27061', technology: 'MARINE', semester: '6th', semesterId: '6', subjectCode: '27061', subjectName: 'স্ট্রেন্থ অফ মেটেরিয়ালস', curriculumFullMarks: 200 },
  { id: 'MARINE_6th_27063', technology: 'MARINE', semester: '6th', semesterId: '6', subjectCode: '27063', subjectName: 'ক্যাড অ্যান্ড ক্যাম (CAD & CAM)', curriculumFullMarks: 150 },
  { id: 'MARINE_6th_27961', technology: 'MARINE', semester: '6th', semesterId: '6', subjectCode: '27961', subjectName: 'পাওয়ার সিস্টেম প্রটেকশন', curriculumFullMarks: 100 },
  { id: 'MARINE_6th_27962', technology: 'MARINE', semester: '6th', semesterId: '6', subjectCode: '27962', subjectName: 'মেরিন ইলেকট্রিক্যাল ইনস্টলেশন অ্যান্ড ইন্সট্রুমেন্টেশন', curriculumFullMarks: 150 },
  { id: 'MARINE_6th_27963', technology: 'MARINE', semester: '6th', semesterId: '6', subjectCode: '27963', subjectName: 'শিপবোর্ড ডেক যন্ত্রপাতি, আউট-ফিটিংস এবং ব্রিজ ইকুইপমেন্ট', curriculumFullMarks: 100 },
  { id: 'MARINE_6th_27964', technology: 'MARINE', semester: '6th', semesterId: '6', subjectCode: '27964', subjectName: 'মেরিন প্রোপালশন অ্যান্ড স্টিয়ারিং সিস্টেম', curriculumFullMarks: 150 },
  { id: 'MARINE_6th_27965', technology: 'MARINE', semester: '6th', semesterId: '6', subjectCode: '27965', subjectName: 'মেরিন এনভায়রনমেন্টাল সাইন্স', curriculumFullMarks: 100 },

  // MARINE - 7th Semester
  { id: 'MARINE_7th_25851', technology: 'MARINE', semester: '7th', semesterId: '7', subjectCode: '25851', subjectName: 'প্রিন্সিপালস অফ মার্কেটিং', curriculumFullMarks: 100 },
  { id: 'MARINE_7th_25853', technology: 'MARINE', semester: '7th', semesterId: '7', subjectCode: '25853', subjectName: 'ইনোভেশন অ্যান্ড এন্টারপ্রেনারশিপ', curriculumFullMarks: 100 },
  { id: 'MARINE_7th_27971', technology: 'MARINE', semester: '7th', semesterId: '7', subjectCode: '27971', subjectName: 'লিডারশিপ অ্যান্ড প্রফেশনাল এথিক্স', curriculumFullMarks: 100 },
  { id: 'MARINE_7th_27972', technology: 'MARINE', semester: '7th', semesterId: '7', subjectCode: '27972', subjectName: 'এডভান্সড মেশিন ড্রয়িং', curriculumFullMarks: 100 },
  { id: 'MARINE_7th_27973', technology: 'MARINE', semester: '7th', semesterId: '7', subjectCode: '27973', subjectName: 'মেরিন আইসি ইঞ্জিন ওভারহলিং অ্যান্ড রেকর্ড কিপিং', curriculumFullMarks: 150 },
  { id: 'MARINE_7th_27974', technology: 'MARINE', semester: '7th', semesterId: '7', subjectCode: '27974', subjectName: 'ক্যারিয়ার গাইডলাইন ইন মেরিটাইম সেক্টর', curriculumFullMarks: 100 },
  { id: 'MARINE_7th_27231', technology: 'MARINE', semester: '7th', semesterId: '7', subjectCode: '27231', subjectName: 'আরএসি সাইকেলস অ্যান্ড কম্পোনেন্টস', curriculumFullMarks: 150 },
  { id: 'MARINE_7th_27975', technology: 'MARINE', semester: '7th', semesterId: '7', subjectCode: '27975', subjectName: 'অ্যাপ্লায়েড হিট', curriculumFullMarks: 100 },
  { id: 'MARINE_7th_27976', technology: 'MARINE', semester: '7th', semesterId: '7', subjectCode: '27976', subjectName: 'কন্ট্রোল ইঞ্জিনিয়ারিং অ্যান্ড মেকাট্রনিক্স', curriculumFullMarks: 200 },

  // ==========================================
  // SURVEYING TECHNOLOGY (57 Subjects)
  // ==========================================
  // SURVEYING - 1st Semester
  { id: 'SURVEYING_1st_21011', technology: 'SURVEYING', semester: '1st', semesterId: '1', subjectCode: '21011', subjectName: 'ইঞ্জিনিয়ারিং ড্রয়িং', curriculumFullMarks: 100 },
  { id: 'SURVEYING_1st_25711', technology: 'SURVEYING', semester: '1st', semesterId: '1', subjectCode: '25711', subjectName: 'বাংলা-১', curriculumFullMarks: 100 },
  { id: 'SURVEYING_1st_25712', technology: 'SURVEYING', semester: '1st', semesterId: '1', subjectCode: '25712', subjectName: 'ইংরেজি-১', curriculumFullMarks: 100 },
  { id: 'SURVEYING_1st_25811', technology: 'SURVEYING', semester: '1st', semesterId: '1', subjectCode: '25811', subjectName: 'সোশ্যাল সাইন্স', curriculumFullMarks: 100 },
  { id: 'SURVEYING_1st_25911', technology: 'SURVEYING', semester: '1st', semesterId: '1', subjectCode: '25911', subjectName: 'গণিত-১', curriculumFullMarks: 200 },
  { id: 'SURVEYING_1st_25912', technology: 'SURVEYING', semester: '1st', semesterId: '1', subjectCode: '25912', subjectName: 'পদার্থবিজ্ঞান-১', curriculumFullMarks: 200 },
  { id: 'SURVEYING_1st_26411', technology: 'SURVEYING', semester: '1st', semesterId: '1', subjectCode: '26411', subjectName: 'সিভিল ইঞ্জিনিয়ারিং মেটেরিয়ালস', curriculumFullMarks: 150 },
  { id: 'SURVEYING_1st_26711', technology: 'SURVEYING', semester: '1st', semesterId: '1', subjectCode: '26711', subjectName: 'বেসিক ইলেকট্রিসিটি', curriculumFullMarks: 200 },

  // SURVEYING - 2nd Semester
  { id: 'SURVEYING_2nd_25721', technology: 'SURVEYING', semester: '2nd', semesterId: '2', subjectCode: '25721', subjectName: 'বাংলা-২', curriculumFullMarks: 100 },
  { id: 'SURVEYING_2nd_25722', technology: 'SURVEYING', semester: '2nd', semesterId: '2', subjectCode: '25722', subjectName: 'ইংরেজি-২', curriculumFullMarks: 100 },
  { id: 'SURVEYING_2nd_25812', technology: 'SURVEYING', semester: '2nd', semesterId: '2', subjectCode: '25812', subjectName: 'শারীরিক শিক্ষা ও জীবনদক্ষতা উন্নয়ন', curriculumFullMarks: 50 },
  { id: 'SURVEYING_2nd_25921', technology: 'SURVEYING', semester: '2nd', semesterId: '2', subjectCode: '25921', subjectName: 'গণিত-২', curriculumFullMarks: 200 },
  { id: 'SURVEYING_2nd_25922', technology: 'SURVEYING', semester: '2nd', semesterId: '2', subjectCode: '25922', subjectName: 'পদার্থবিজ্ঞান-২', curriculumFullMarks: 200 },
  { id: 'SURVEYING_2nd_28511', technology: 'SURVEYING', semester: '2nd', semesterId: '2', subjectCode: '28511', subjectName: 'কম্পিউটার অফিস অ্যাপ্লিকেশন', curriculumFullMarks: 100 },
  { id: 'SURVEYING_2nd_26811', technology: 'SURVEYING', semester: '2nd', semesterId: '2', subjectCode: '26811', subjectName: 'বেসিক ইলেকট্রনিক্স', curriculumFullMarks: 150 },
  { id: 'SURVEYING_2nd_27821', technology: 'SURVEYING', semester: '2nd', semesterId: '2', subjectCode: '27821', subjectName: 'বেসিক সার্ভেয়িং', curriculumFullMarks: 150 },

  // SURVEYING - 3rd Semester
  { id: 'SURVEYING_3rd_25913', technology: 'SURVEYING', semester: '3rd', semesterId: '3', subjectCode: '25913', subjectName: 'রসায়ন', curriculumFullMarks: 200 },
  { id: 'SURVEYING_3rd_25931', technology: 'SURVEYING', semester: '3rd', semesterId: '3', subjectCode: '25931', subjectName: 'গণিত-৩', curriculumFullMarks: 200 },
  { id: 'SURVEYING_3rd_25916', technology: 'SURVEYING', semester: '3rd', semesterId: '3', subjectCode: '25916', subjectName: 'স্ট্যাটিস্টিকস', curriculumFullMarks: 100 },
  { id: 'SURVEYING_3rd_26434', technology: 'SURVEYING', semester: '3rd', semesterId: '3', subjectCode: '26434', subjectName: 'বেসিক কনস্ট্রাকশন প্রসেস', curriculumFullMarks: 150 },
  { id: 'SURVEYING_3rd_27831', technology: 'SURVEYING', semester: '3rd', semesterId: '3', subjectCode: '27831', subjectName: 'লেভেলিং', curriculumFullMarks: 150 },
  { id: 'SURVEYING_3rd_27832', technology: 'SURVEYING', semester: '3rd', semesterId: '3', subjectCode: '27832', subjectName: 'সার্ভে ক্যাড', curriculumFullMarks: 100 },
  { id: 'SURVEYING_3rd_27833', technology: 'SURVEYING', semester: '3rd', semesterId: '3', subjectCode: '27833', subjectName: 'জিওগ্রাফি অফ বাংলাদেশ', curriculumFullMarks: 100 },
  { id: 'SURVEYING_3rd_27834', technology: 'SURVEYING', semester: '3rd', semesterId: '3', subjectCode: '27834', subjectName: 'জিওডেটিক সার্ভেয়িং', curriculumFullMarks: 150 },

  // SURVEYING - 4th Semester
  { id: 'SURVEYING_4th_25831', technology: 'SURVEYING', semester: '4th', semesterId: '4', subjectCode: '25831', subjectName: 'বিজনেস কমিউনিকেশন', curriculumFullMarks: 100 },
  { id: 'SURVEYING_4th_26431', technology: 'SURVEYING', semester: '4th', semesterId: '4', subjectCode: '26431', subjectName: 'স্ট্রাকচারাল মেকানিক্স', curriculumFullMarks: 150 },
  { id: 'SURVEYING_4th_26447', technology: 'SURVEYING', semester: '4th', semesterId: '4', subjectCode: '26447', subjectName: 'বেসিক এস্টিমেটিং অ্যান্ড কস্টিং', curriculumFullMarks: 150 },
  { id: 'SURVEYING_4th_27841', technology: 'SURVEYING', semester: '4th', semesterId: '4', subjectCode: '27841', subjectName: 'এরিয়াল ফটোগ্রাফি অ্যান্ড ফটোগ্রামেট্রি', curriculumFullMarks: 100 },
  { id: 'SURVEYING_4th_27842', technology: 'SURVEYING', semester: '4th', semesterId: '4', subjectCode: '27842', subjectName: 'ফান্ডামেন্টালস অফ জিআইএস', curriculumFullMarks: 150 },
  { id: 'SURVEYING_4th_27843', technology: 'SURVEYING', semester: '4th', semesterId: '4', subjectCode: '27843', subjectName: 'এডভান্সড সার্ভেয়িং-১', curriculumFullMarks: 200 },
  { id: 'SURVEYING_4th_27844', technology: 'SURVEYING', semester: '4th', semesterId: '4', subjectCode: '27844', subjectName: 'ডিজিটাল কার্টোগ্রাফি', curriculumFullMarks: 150 },

  // SURVEYING - 5th Semester
  { id: 'SURVEYING_5th_25841', technology: 'SURVEYING', semester: '5th', semesterId: '5', subjectCode: '25841', subjectName: 'একাউন্টিং', curriculumFullMarks: 100 },
  { id: 'SURVEYING_5th_26454', technology: 'SURVEYING', semester: '5th', semesterId: '5', subjectCode: '26454', subjectName: 'থিওরি অফ স্ট্রাকচার', curriculumFullMarks: 150 },
  { id: 'SURVEYING_5th_26621', technology: 'SURVEYING', semester: '5th', semesterId: '5', subjectCode: '26621', subjectName: 'পাইথন প্রোগ্রামিং', curriculumFullMarks: 150 },
  { id: 'SURVEYING_5th_27851', technology: 'SURVEYING', semester: '5th', semesterId: '5', subjectCode: '27851', subjectName: 'এডভান্সড জিআইএস', curriculumFullMarks: 150 },
  { id: 'SURVEYING_5th_27852', technology: 'SURVEYING', semester: '5th', semesterId: '5', subjectCode: '27852', subjectName: 'হাইড্রোলিক্স অ্যান্ড হাইড্রোলজি', curriculumFullMarks: 150 },
  { id: 'SURVEYING_5th_27853', technology: 'SURVEYING', semester: '5th', semesterId: '5', subjectCode: '27853', subjectName: 'এডভান্সড সার্ভেয়িং-২', curriculumFullMarks: 150 },
  { id: 'SURVEYING_5th_27854', technology: 'SURVEYING', semester: '5th', semesterId: '5', subjectCode: '27854', subjectName: 'ল্যান্ড লস অফ বাংলাদেশ', curriculumFullMarks: 100 },
  { id: 'SURVEYING_5th_29041', technology: 'SURVEYING', semester: '5th', semesterId: '5', subjectCode: '29041', subjectName: 'এনভায়রনমেন্টাল স্টাডিজ', curriculumFullMarks: 150 },

  // SURVEYING - 6th Semester
  { id: 'SURVEYING_6th_25852', technology: 'SURVEYING', semester: '6th', semesterId: '6', subjectCode: '25852', subjectName: 'ইন্ডাস্ট্রিয়াল ম্যানেজমেন্ট', curriculumFullMarks: 100 },
  { id: 'SURVEYING_6th_26463', technology: 'SURVEYING', semester: '6th', semesterId: '6', subjectCode: '26463', subjectName: 'ট্রান্সপোর্টেশন ইঞ্জিনিয়ারিং-১', curriculumFullMarks: 150 },
  { id: 'SURVEYING_6th_26464', technology: 'SURVEYING', semester: '6th', semesterId: '6', subjectCode: '26464', subjectName: 'ডিজাইন অফ স্ট্রাকচার-১', curriculumFullMarks: 150 },
  { id: 'SURVEYING_6th_27861', technology: 'SURVEYING', semester: '6th', semesterId: '6', subjectCode: '27861', subjectName: 'প্রিন্সিপালস অফ টপোগ্রাফিক সার্ভে', curriculumFullMarks: 100 },
  { id: 'SURVEYING_6th_27862', technology: 'SURVEYING', semester: '6th', semesterId: '6', subjectCode: '27862', subjectName: 'অ্যাপ্লিকেশন অফ পাইথন প্রোগ্রামিং', curriculumFullMarks: 100 },
  { id: 'SURVEYING_6th_27863', technology: 'SURVEYING', semester: '6th', semesterId: '6', subjectCode: '27863', subjectName: 'হাইড্রোগ্রাফিক সার্ভেয়িং', curriculumFullMarks: 150 },
  { id: 'SURVEYING_6th_27864', technology: 'SURVEYING', semester: '6th', semesterId: '6', subjectCode: '27864', subjectName: 'সার্ভে প্রজেক্ট-১', curriculumFullMarks: 100 },
  { id: 'SURVEYING_6th_27865', technology: 'SURVEYING', semester: '6th', semesterId: '6', subjectCode: '27865', subjectName: 'প্রিপারেশন অ্যান্ড মেইনট্যান্যান্স অফ ল্যান্ড রেকর্ডস', curriculumFullMarks: 100 },

  // SURVEYING - 7th Semester
  { id: 'SURVEYING_7th_25851', technology: 'SURVEYING', semester: '7th', semesterId: '7', subjectCode: '25851', subjectName: 'প্রিন্সিপালস অফ মার্কেটিং', curriculumFullMarks: 100 },
  { id: 'SURVEYING_7th_25853', technology: 'SURVEYING', semester: '7th', semesterId: '7', subjectCode: '25853', subjectName: 'ইনোভেশন অ্যান্ড এন্টারপ্রেনারশিপ', curriculumFullMarks: 100 },
  { id: 'SURVEYING_7th_26473', technology: 'SURVEYING', semester: '7th', semesterId: '7', subjectCode: '26473', subjectName: 'ট্রান্সপোর্টেশন ইঞ্জিনিয়ারিং-২', curriculumFullMarks: 150 },
  { id: 'SURVEYING_7th_26474', technology: 'SURVEYING', semester: '7th', semesterId: '7', subjectCode: '26474', subjectName: 'ডিজাইন অফ স্ট্রাকচার-২', curriculumFullMarks: 150 },
  { id: 'SURVEYING_7th_27871', technology: 'SURVEYING', semester: '7th', semesterId: '7', subjectCode: '27871', subjectName: 'মাইনিং সার্ভেয়িং', curriculumFullMarks: 150 },
  { id: 'SURVEYING_7th_27872', technology: 'SURVEYING', semester: '7th', semesterId: '7', subjectCode: '27872', subjectName: 'সার্ভে প্রজেক্ট-২', curriculumFullMarks: 100 },
  { id: 'SURVEYING_7th_27873', technology: 'SURVEYING', semester: '7th', semesterId: '7', subjectCode: '27873', subjectName: 'রিমোট সেন্সিং', curriculumFullMarks: 150 },
  { id: 'SURVEYING_7th_28871', technology: 'SURVEYING', semester: '7th', semesterId: '7', subjectCode: '28871', subjectName: 'কনস্ট্রাকশন ম্যানেজমেন্ট অ্যান্ড ডকুমেন্ট', curriculumFullMarks: 150 },

  // SURVEYING - 8th Semester
  { id: 'SURVEYING_8th_27881', technology: 'SURVEYING', semester: '8th', semesterId: '8', subjectCode: '27881', subjectName: 'ইন্ডাস্ট্রিয়াল অ্যাটাচমেন্ট', curriculumFullMarks: 400 },
  { id: 'SURVEYING_8th_67881', technology: 'SURVEYING', semester: '8th', semesterId: '8', subjectCode: '67881', subjectName: 'প্রজেক্ট প্রেজেন্টেশন', curriculumFullMarks: 200 },
];

/**
 * Normalizes input technology strings to canonical technology codes.
 * Supports English codes/names, Bangla names, and custom department IDs.
 */
export function normalizeTechnologyKey(
  tech: string,
  departments?: Array<{ id: string; name: string; code: string }>
): string {
  if (!tech) return 'COMPUTER';
  const clean = tech.trim().toUpperCase();
  if (clean === 'ALL' || clean === 'ALL_TECH' || clean.includes('সকল')) return 'ALL';

  // Check if matching department exists
  if (departments && departments.length > 0) {
    const rawLower = tech.toLowerCase().trim();
    const found = departments.find(
      (d) =>
        d.id.toLowerCase() === rawLower ||
        d.code.toLowerCase() === rawLower ||
        d.name.toLowerCase() === rawLower
    );
    if (found) {
      const codeClean = found.code.trim().toUpperCase();
      if (codeClean.includes('CIVIL') || codeClean === 'CE' || codeClean === 'CT') return 'CIVIL';
      if (codeClean.includes('COMP') || codeClean === 'CMT' || codeClean === 'CST' || codeClean === 'CSE') return 'COMPUTER';
      if (codeClean.includes('ELEC') || codeClean === 'ET' || codeClean === 'EEE') return 'ELECTRICAL';
      if (codeClean.includes('MECH') || codeClean === 'MT') return 'MECHANICAL';
      if (codeClean.includes('MARI') || codeClean === 'MRT') return 'MARINE';
      if (codeClean.includes('SURV') || codeClean === 'ST') return 'SURVEYING';

      const nameClean = found.name;
      if (/civil|সিভিল/i.test(nameClean)) return 'CIVIL';
      if (/comp|কম্পিউটার/i.test(nameClean)) return 'COMPUTER';
      if (/elec|ইলেকট্রিক্যাল|বিদ্যুৎ/i.test(nameClean)) return 'ELECTRICAL';
      if (/mech|মেকানিক্যাল|যন্ত্র/i.test(nameClean)) return 'MECHANICAL';
      if (/mari|মেরিন|নৌ/i.test(nameClean)) return 'MARINE';
      if (/surv|সার্ভে|জরিপ/i.test(nameClean)) return 'SURVEYING';
    }
  }

  // Direct checking
  if (clean.includes('CIVIL') || clean === 'CE' || clean === 'CT' || tech.includes('সিভিল')) return 'CIVIL';
  if (clean.includes('COMP') || clean === 'CMT' || clean === 'CST' || clean === 'CSE' || clean.includes('COMPUTER') || tech.includes('কম্পিউটার')) return 'COMPUTER';
  if (clean.includes('ELEC') || clean === 'ET' || clean === 'EEE' || tech.includes('ইলেকট্রিক্যাল')) return 'ELECTRICAL';
  if (clean.includes('MECH') || clean === 'MT' || tech.includes('মেকানিক্যাল')) return 'MECHANICAL';
  if (clean.includes('MARI') || clean === 'MRT' || tech.includes('মেরিন')) return 'MARINE';
  if (clean.includes('SURV') || clean === 'ST' || tech.includes('সার্ভে')) return 'SURVEYING';

  return clean;
}

/**
 * List of available technologies with Bangla Display Name and Lucide Icon identifier
 */
export const AVAILABLE_TECHNOLOGIES = [
  { id: 'ALL', code: 'ALL', name: 'সকল প্রযুক্তি', shortName: 'সকল প্রযুক্তি', icon: 'Layers' },
  { id: 'cmt', code: 'COMPUTER', name: 'কম্পিউটার টেকনোলজি', shortName: 'কম্পিউটার', icon: 'Cpu' },
  { id: 'ce', code: 'CIVIL', name: 'সিভিল টেকনোলজি', shortName: 'সিভিল', icon: 'Building' },
  { id: 'et', code: 'ELECTRICAL', name: 'ইলেকট্রিক্যাল টেকনোলজি', shortName: 'ইলেকট্রিক্যাল', icon: 'Zap' },
  { id: 'mt', code: 'MECHANICAL', name: 'মেকানিক্যাল টেকনোলজি', shortName: 'মেকানিক্যাল', icon: 'Wrench' },
  { id: 'mrt', code: 'MARINE', name: 'মেরিন টেকনোলজি', shortName: 'মেরিন', icon: 'Anchor' },
  { id: 'st', code: 'SURVEYING', name: 'সার্ভেয়িং টেকনোলজি', shortName: 'সার্ভেয়িং', icon: 'Compass' },
];

export interface AutoLoadedCurriculumSubject {
  code: string;
  name: string;
  subjectCode: string;
  subjectName: string;
  curriculumFullMarks: number;
  technologies: string[];
}

/**
 * Returns deduplicated curriculum subjects for the given technologies and semester.
 * Merges matching technology labels when a subject belongs to multiple selected technologies.
 * De-duplicates strictly by Subject Code.
 */
export function getAutoLoadedCurriculumSubjects(
  technologies: string[],
  semesterId: string
): AutoLoadedCurriculumSubject[] {
  if (!technologies || technologies.length === 0 || !semesterId) return [];

  const canonicalTechs = new Set(technologies.map((t) => normalizeTechnologyKey(t)));
  const cleanSem = String(semesterId).trim();
  const isAllTech = canonicalTechs.has('ALL') || canonicalTechs.has('ALL_TECH');

  const matchingEntries = MASTER_CURRICULUM_DATA.filter((sub) => {
    const techMatch = isAllTech || canonicalTechs.has(normalizeTechnologyKey(sub.technology));
    const semMatch =
      String(sub.semesterId).trim() === cleanSem || sub.semester.startsWith(cleanSem);
    return techMatch && semMatch;
  });

  const subjectMap = new Map<string, AutoLoadedCurriculumSubject>();

  for (const item of matchingEntries) {
    const code = item.subjectCode.trim();
    if (!subjectMap.has(code)) {
      subjectMap.set(code, {
        code,
        name: item.subjectName.trim(),
        subjectCode: code,
        subjectName: item.subjectName.trim(),
        curriculumFullMarks: item.curriculumFullMarks,
        technologies: [item.technology],
      });
    } else {
      const existing = subjectMap.get(code)!;
      if (!existing.technologies.includes(item.technology)) {
        existing.technologies.push(item.technology);
      }
    }
  }

  return Array.from(subjectMap.values());
}

