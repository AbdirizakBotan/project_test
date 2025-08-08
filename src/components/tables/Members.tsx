import { useEffect, useState, useMemo } from "react";
import api from "../../utils/axios";
import { AxiosError } from "axios";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Modal } from "../ui/modal";
import { useModal } from "../../hooks/useModal";
import PhoneInput from "../form/input/PhoneInput.tsx";
import Label from "../form/Label";
import DatePicker from "../form/date-picker.tsx";
import toast from "react-hot-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Helper function to format currency
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

// Helper function to check if a name is exactly 4 words
function isFourWordName(name: string): boolean {
  return name.trim().split(/\s+/).length === 4;
}

// Shared type for member form fields
interface MemberFormFields {
  full_name: string;
  phone: string;
  gender: string;
  district: string;
  blood_type: string;
  education_level: string;
  education_type: string;
  occupation: string;
  monthly_contribution: number;
  date_of_birth: string;
}

// Helper function to validate phone number (basic check for non-empty and digits)
function isValidPhone(phone: string): boolean {
  return /^\+?\d{7,}$/.test(phone.trim());
}

// Helper function to validate date of birth (at least 18 years old, not in future)
function isValidDOB(dob: string): { valid: boolean; error?: string } {
  if (!dob) return { valid: false, error: "Date of birth is required." };
  const birthDate = new Date(dob);
  const now = new Date();
  if (birthDate > now) return { valid: false, error: "Date of birth cannot be in the future." };
  const age = now.getFullYear() - birthDate.getFullYear();
  const m = now.getMonth() - birthDate.getMonth();
  const day = now.getDate() - birthDate.getDate();
  let realAge = age;
  if (m < 0 || (m === 0 && day < 0)) realAge--;
  if (realAge < 18) return { valid: false, error: "Member must be at least 18 years old." };
  return { valid: true };
}

// Validate all fields for Add/Edit Member
function validateMemberForm(form: MemberFormFields): string | null {
  if (!isFourWordName(form.full_name)) return "Full name must be exactly 4 words.";
  if (!isValidPhone(form.phone)) return "A valid phone number is required.";
  if (!form.gender) return "Gender is required.";
  if (!form.district) return "District is required.";
  if (!form.blood_type) return "Blood type is required.";
  if (!form.education_level) return "Education level is required.";
  if (form.education_level !== "None" && !form.education_type) return "Education type is required.";
  if (!form.occupation) return "Occupation is required.";
  if (form.monthly_contribution < 0) return "Monthly contribution cannot be less than 0.";
  const dobCheck = isValidDOB(form.date_of_birth);
  if (!dobCheck.valid) return dobCheck.error || "Invalid date of birth.";
  return null;
}

interface Member {
  _id: string;
  full_name: string;
  phone: string;
  gender: string;
  // marital_status: string;
  district: string;
  blood_type: string;
  education_level: string;
  education_type?: string;
  occupation: string;
  monthly_contribution: number;
  date_of_birth: string;
  age: number;
  createdAt?: string;
  created_by: {
    _id: string;
    username: string;
    email: string;
    role: string;
  };
}

// Add education type options data
const EDUCATION_TYPE_OPTIONS = {
  Undergraduate: [
    // Diplomas and technical/vocational
    "Diploma in Computer Applications (DCA)",
    "Diploma in Mechanical Engineering",
    "Diploma in Graphic Design",
    "Diploma in Video Editing",
    "Diploma in Hotel Management",
    "Diploma in Nursing",
    "Diploma in Agriculture",
    "Diploma in Early Childhood Education",
    "Diploma in Fashion Design",
    "Diploma in Business Administration",
    "Diploma in Information Technology",
    "Diploma in Civil Engineering",
    "Diploma in Data Science",
    "Diploma in Digital Marketing",
    "Diploma in Project Management",
    "Diploma in Artificial Intelligence",
    "Diploma in Public Health",
    "Diploma in Supply Chain Management",
    "Diploma in Electrical Installation",
    "Diploma in Automotive Technology",
    "Diploma in Welding and Fabrication",
    "Diploma in Carpentry",
    // Engineering
    "Civil Engineering",
    "Mechanical Engineering",
    "Electrical Engineering",
    "Mechatronics",
    // IT
    "Software Engineering",
    "Networking",
    "Cybersecurity",
    "Data Analysis",
    // Business
    "Accounting",
    "Marketing",
    "HR",
    "Supply Chain",
    // Health Sciences
    "Nursing",
    "Pharmacy Assistant",
    "Physiotherapy Assistant",
    // Hospitality
    "Culinary Arts",
    "Hotel Management",
    // Arts & Design
    "Fashion Design",
    "Animation",
    "Multimedia",
    // Law
    "Paralegal Studies",
    "Legal Practice",
    // ...existing
    "Computer Applications",
    "Mechanical Engineering",
    "Electrical Engineering",
    "Graphic Design",
    "Video Editing",
    "Fashion Design",
    "Hotel Management",
    "Early Childhood Education",
    "Nursing",
    "Agriculture",
    "Business Administration",
    "Information Technology",
    "Civil Engineering",
    "Automotive Technology",
    "Welding and Fabrication",
    "Carpentry",
    "Shariah and Islamic Studies",
    "Islamic Finance",
  ],
  Bachelor: [
    // Faculties and programs
    "Faculty of Arts / Humanities",
    "English Literature",
    "History",
    "Philosophy",
    "Linguistics",
    "Political Science",
    "International Relations",
    "Faculty of Science",
    "Physics",
    "Chemistry",
    "Biology",
    "Mathematics",
    "Statistics",
    "Environmental Science",
    "Faculty of Business / Commerce",
    "Accounting",
    "Finance",
    "Marketing",
    "Management",
    "Economics",
    "Human Resource Management",
    "Faculty of Engineering & Technology",
    "Computer Engineering",
    "Mechanical Engineering",
    "Civil Engineering",
    "Electrical & Electronics Engineering",
    "Software Engineering",
    "Mechatronics",
    "Faculty of Computer Science / Information Technology",
    "Data Science",
    "Cybersecurity",
    "Artificial Intelligence",
    "Game Development",
    "Software Development",
    "Faculty of Health Sciences",
    "Nursing",
    "Public Health",
    "Physiotherapy",
    "Pharmacy",
    "Dental Surgery",
    "Medicine and Surgery",
    "Faculty of Education",
    "Primary Education",
    "Secondary Education",
    "Early Childhood Education",
    "Special Education",
    "Faculty of Law",
    "Law",
    "Faculty of Fine Arts / Design / Performing Arts",
    "Graphic Design",
    "Music",
    "Theatre",
    "Animation",
    "Fashion Design",
    "Faculty of Agriculture / Environmental Studies",
    "Agriculture",
    "Environmental Science",
    "Forestry",
    // ...existing
    "Arts",
    "Science",
    "Engineering",
    "Business Administration (BBA)",
    "Commerce (BCom)",
    "Education (BEd)",
    "Computer Science (BCS)",
    "Information Technology (BIT)",
    "Health Sciences",
    "Law (LLB)",
    "Fine Arts / Design / Performing Arts",
    "Social Work",
    "Nutrition",
    "Islamic Studies",
    "Shariah and Law",
    "Usul al-Din",
    "Quranic Studies",
    "Islamic Economics",
  ],
  Master: [
    // Faculties and programs
    "Faculty of Arts / Humanities",
    "English Literature",
    "History",
    "Linguistics",
    "Philosophy",
    "Political Science",
    "Sociology",
    "International Relations",
    "Cultural Studies",
    "Faculty of Science",
    "Physics",
    "Chemistry",
    "Biology",
    "Mathematics",
    "Statistics",
    "Environmental Science",
    "Data Science",
    "Faculty of Business / Commerce / Management",
    "Finance",
    "Marketing",
    "Supply Chain Management",
    "Human Resource Management",
    "Business Analytics",
    "Entrepreneurship",
    "Economics",
    "Faculty of Engineering & Technology",
    "Civil Engineering",
    "Mechanical Engineering",
    "Electrical Engineering",
    "Computer Engineering",
    "Artificial Intelligence",
    "Robotics",
    "Faculty of Computer Science / IT",
    "Cybersecurity",
    "Software Engineering",
    "Data Science",
    "Machine Learning",
    "Computer Networks",
    "Cloud Computing",
    "Faculty of Law",
    "International Law",
    "Corporate Law",
    "Constitutional Law",
    "Human Rights Law",
    "Faculty of Education",
    "Curriculum & Instruction",
    "Educational Leadership",
    "Special Education",
    "Higher Education",
    "Faculty of Health Sciences",
    "Epidemiology",
    "Health Policy & Management",
    "Clinical Nursing",
    "Nutrition",
    "Faculty of Fine Arts / Design",
    "Graphic Design",
    "Fashion Design",
    "Animation",
    "Theatre",
    "Visual Arts",
    "Faculty of Agriculture / Environmental Sciences",
    "Agronomy",
    "Horticulture",
    "Soil Science",
    "Environmental Management",
    "Forestry",
    // ...existing
    "Arts (MA)",
    "Science (MSc)",
    "Engineering (ME / MTech)",
    "Business Administration (MBA)",
    "Commerce (MCom)",
    "Management (MiM)",
    "Education (MEd)",
    "Computer Science (MCS)",
    "Information Technology (MIT)",
    "Health Sciences (MPH, MSN, MPT, MPharm)",
    "Law (LLM)",
    "Agriculture",
    "Environmental Science",
    "Fine Arts / Design (MFA, MDes)",
    "Social Work",
    "Nutrition",
    "Islamic Studies",
    "Shariah and Law",
    "Islamic Finance",
    "Usul al-Din",
    "Hadith Studies",
    "Fiqh and Usul al-Fiqh",
    "Comparative Religion",
  ],
  PhD: [
    // Faculties and programs
    "Faculty of Arts / Humanities",
    "English Literature",
    "History",
    "Linguistics",
    "Philosophy",
    "Cultural Studies",
    "Political Science",
    "Religious Studies",
    "International Relations",
    "Faculty of Science",
    "Physics",
    "Chemistry",
    "Biology",
    "Mathematics",
    "Statistics",
    "Environmental Science",
    "Geology",
    "Astronomy",
    "Faculty of Business / Management",
    "Business Administration",
    "Finance",
    "Marketing",
    "Human Resource Management",
    "Management Studies",
    "Economics",
    "Doctor of Business Administration (DBA)",
    "Faculty of Engineering & Technology",
    "Civil Engineering",
    "Electrical Engineering",
    "Mechanical Engineering",
    "Computer Engineering",
    "Artificial Intelligence",
    "Robotics",
    "Materials Science",
    "Aerospace Engineering",
    "Faculty of Computer Science / IT",
    "Computer Science",
    "Data Science",
    "Information Systems",
    "Machine Learning",
    "Software Engineering",
    "Cybersecurity",
    "Human-Computer Interaction",
    "Faculty of Law",
    "Constitutional Law",
    "International Law",
    "Criminal Law",
    "Human Rights Law",
    "Environmental Law",
    "Faculty of Education",
    "Educational Leadership",
    "Curriculum Studies",
    "Educational Psychology",
    "Special Education",
    "Teacher Education",
    "Faculty of Health Sciences",
    "Public Health",
    "Nursing",
    "Pharmacy",
    "Physiotherapy",
    "Biomedical Sciences",
    "Health Policy",
    "Faculty of Fine Arts / Design",
    "Fine Arts",
    "Visual Arts",
    "Music",
    "Theatre",
    "Design",
    "Film Studies",
    "Art History",
    "Faculty of Agriculture / Environmental Studies",
    "Agricultural Sciences",
    "Soil Science",
    "Horticulture",
    "Agronomy",
    "Environmental Science",
    "Forestry",
    "Sustainable Development",
    // ...existing
    "Arts",
    "Science",
    "Engineering",
    "Business Administration / Management",
    "Education (PhD / EdD)",
    "Computer Science",
    "Health Sciences",
    "Law (PhD / SJD)",
    "Agriculture",
    "Environmental Science",
    "Fine Arts / Design",
    "Social Work",
    "Nutrition",
    "Islamic Studies",
    "Shariah and Law",
    "Islamic Finance",
    "Usul al-Din",
    "Fiqh and Usul al-Fiqh",
    "Quran and Sunnah",
    "Comparative Islamic Jurisprudence",
  ],
};

// Helper to get filtered education type options
function getEducationTypeOptions(level: string, input: string): string[] {
  let options: string[] = [];
  if (level === "Undergraduate") {
    options = [...EDUCATION_TYPE_OPTIONS.Undergraduate, ...EDUCATION_TYPE_OPTIONS.Bachelor];
  } else if (level === "Bachelor") {
    options = EDUCATION_TYPE_OPTIONS.Bachelor;
  } else if (level === "Master") {
    options = EDUCATION_TYPE_OPTIONS.Master;
  } else if (level === "PhD") {
    options = EDUCATION_TYPE_OPTIONS.PhD;
  }
  // Filter out group/faculty names (those starting with 'Faculty of' or similar)
  options = options.filter(opt =>
    !/^Faculty of|^Doctor of|^Master of|^Bachelor of|^Diploma in|^Doctor /.test(opt)
  );
  if (!input) return options;
  return options.filter(opt => opt.toLowerCase().includes(input.toLowerCase()));
}

export default function MembersTable() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state for Add Member
  const { isOpen, openModal, closeModal } = useModal();
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    gender: "male",
    // marital_status: "single",
    district: "",
    blood_type: "",
    education_level: "None",
    education_type: "",
    occupation: "",
    monthly_contribution: 0,
    date_of_birth: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Add state for education type search and dropdown
  const [educationTypeInput, setEducationTypeInput] = useState("");
  const [showEducationTypeDropdown, setShowEducationTypeDropdown] = useState(false);
  // Reset education type input when education level changes
  useEffect(() => {
    setEducationTypeInput("");
    setForm(f => ({ ...f, education_type: "" }));
  }, [form.education_level]);

  const countries = [
    { code: "US", label: "+1" },
    { code: "SO", label: "+252" }, // Somalia
    { code: "GB", label: "+44" }, // UK
    { code: "DE", label: "+49" }, // Germany
    { code: "SE", label: "+46" }, // Sweden
    { code: "NO", label: "+47" }, // Norway
    { code: "FI", label: "+358" }, // Finland
    { code: "FR", label: "+33" }, // France
    { code: "TR", label: "+90" }, // Turkey
    { code: "KE", label: "+254" }, // Kenya
    { code: "ET", label: "+251" }, // Ethiopia
    { code: "DJ", label: "+253" }, // Djibouti
    { code: "ER", label: "+291" }, // Eritrea
    { code: "UG", label: "+256" }, // Uganda
    { code: "TZ", label: "+255" }, // Tanzania
  ];

  const districts = [
    "Boondheere",
    "Kaxda",
    "Hodan",
    "Howlwadaag",
    "Kaaraan",
    "Cabdi Casiis",
    "Wadajir",
    "Deyniile",
    "Xamarweyne",
    "Xamar Jajab",
    "Yaaqshiid",
    "Daarusalaam",
    "Shibis",
    "Waaberi",
    "Shangaani",
    "Warta Nabada",
    "Garasbaaleey",
    "Gubadleey",
    "Dharkenleey",
    "Heliwaa",
  ];

  const [editMember, setEditMember] = useState<Member | null>(null);
  const [editForm, setEditForm] = useState({
    full_name: "",
    phone: "",
    gender: "",
    // marital_status: "",
    district: "",
    blood_type: "",
    education_level: "",
    education_type: "",
    occupation: "",
    monthly_contribution: 0,
    date_of_birth: "",
  });
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Add state for edit education type search and dropdown
  const [editEducationTypeInput, setEditEducationTypeInput] = useState("");
  const [showEditEducationTypeDropdown, setShowEditEducationTypeDropdown] = useState(false);
  // Reset edit education type input when edit education level changes
  useEffect(() => {
    setEditEducationTypeInput("");
    setEditForm(f => ({ ...f, education_type: "" }));
  }, [editForm.education_level]);

  // Modal state for Details Member
  const {
    isOpen: isDetailsOpen,
    openModal: openDetailsModal,
    closeModal: closeDetailsModal,
  } = useModal();
  const [detailsMember, setDetailsMember] = useState<Member | null>(null);

  // Update filters state to have separate fields
  const [filters, setFilters] = useState({
    search: "",
    gender: "",
    district: "",
    monthlyContribution: "",
    educationType: "",
    age: "",
    bloodType: "",
    educationLevel: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 25;

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = () => {
    setLoading(true);
    api
      .get("/api/members")
      .then((res) => setMembers(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAddMember = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    setError(null);

    const validationError = validateMemberForm(form);
    if (validationError) {
      setError(validationError);
      setSaving(false);
      return;
    }

    try {
      await api.post("/api/members/add", form);
      toast.success("Member added successfully!", { position: "top-center" });
      closeModal();
      setForm({
        full_name: "",
        phone: "",
        gender: "male",
        // marital_status: "single",
        district: "",
        blood_type: "",
        education_level: "None",
        education_type: "",
        occupation: "",
        monthly_contribution: 0,
        date_of_birth: "",
      });
      fetchMembers();
    } catch (err: unknown) {
      if (err instanceof AxiosError && err.response) {
        const msg = err.response.data?.error || "Failed to add member";
        setError(msg);
        toast.error(msg, { position: "top-center" });
      } else {
        setError("Failed to add member");
        toast.error("Failed to add member", { position: "top-center" });
      }
    } finally {
      setSaving(false);
    }
  };

  const openEditModal = (member: Member) => {
    setEditMember(member);
    setEditForm({
      full_name: member.full_name,
      phone: member.phone,
      gender: member.gender,
      // marital_status: member.marital_status,
      district: member.district,
      blood_type: member.blood_type,
      education_level: member.education_level,
      education_type: member.education_type || "",
      occupation: member.occupation,
      monthly_contribution: member.monthly_contribution,
      date_of_birth: new Date(member.date_of_birth).toISOString().split("T")[0],
    });
  };

  const closeEditModal = () => {
    setEditMember(null);
    setEditError(null);
  };

  const handleEditInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleEditMember = async () => {
    if (!editMember) return;
    setEditSaving(true);
    setEditError(null);

    const validationError = validateMemberForm(editForm);
    if (validationError) {
      setEditError(validationError);
      setEditSaving(false);
      return;
    }

    try {
      await api.put(`/api/members/${editMember._id}`, editForm);
      toast.success("Member updated successfully!", { position: "top-center" });
      closeEditModal();
      fetchMembers();
    } catch (err: unknown) {
      if (err instanceof AxiosError && err.response) {
        const msg = err.response.data?.error || "Failed to update member";
        setEditError(msg);
        toast.error(msg, { position: "top-center" });
      } else {
        setEditError("Failed to update member");
        toast.error("Failed to update member", { position: "top-center" });
      }
    } finally {
      setEditSaving(false);
    }
  };

  // Replace previous minAge, maxAge, and ageRanges logic with useMemo
  const ageRanges = useMemo(() => {
    if (!members || members.length === 0) return [];
    const minAge = Math.min(...members.map(m => m.age));
    const maxAge = Math.max(...members.map(m => m.age));
    const ranges: { label: string; value: string }[] = [];
    for (let start = minAge - (minAge % 5); start <= maxAge; start += 5) {
      const end = start + 5;
      ranges.push({ label: `${start}-${end}`, value: `${start}-${end}` });
    }
    return ranges;
  }, [members]);

  // Filtering logic
  // Sort members alphabetically by full_name before filtering
  const filteredMembers = members
    .slice()
    .sort((a, b) => a.full_name.localeCompare(b.full_name))
    .filter((member) => {
      const matchesSearch =
        filters.search === "" ||
        member.full_name.toLowerCase().includes(filters.search.toLowerCase()) ||
        member.phone.includes(filters.search);

      const matchesGender = !filters.gender || member.gender === filters.gender;

      const matchesDistrict =
        filters.district === "" ||
        member.district.toLowerCase().includes(filters.district.toLowerCase());

      const matchesMonthlyContribution =
        filters.monthlyContribution === "" ||
        member.monthly_contribution.toString().includes(filters.monthlyContribution);

      const matchesEducationType =
        filters.educationType === "" ||
        (member.education_type && member.education_type.toLowerCase().includes(filters.educationType.toLowerCase()));

      let matchesAge = true;
      if (filters.age) {
        const [start, end] = filters.age.split("-").map(Number);
        matchesAge = member.age >= start && member.age < end;
      }

      const matchesBloodType =
        !filters.bloodType || member.blood_type === filters.bloodType;

      const matchesEducationLevel =
        !filters.educationLevel ||
        member.education_level === filters.educationLevel;

      return (
        matchesSearch &&
        matchesGender &&
        matchesDistrict &&
        matchesMonthlyContribution &&
        matchesAge &&
        matchesBloodType &&
        matchesEducationLevel &&
        matchesEducationType
      );
    });

  // Pagination logic
  const totalPages = Math.ceil(filteredMembers.length / pageSize);
  const paginatedMembers = filteredMembers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleExportPDF = () => {
    const columns = [
      "#",
      "Full Name",
      "Phone",
      "District",
      "Blood Type",
      "Education Level",
      "Education Type",
      "Occupation",
      "Monthly Contribution",
      "Age",
    ];
    const exportRows = filteredMembers.map((member, idx) => [
      idx + 1,
      member.full_name,
      member.phone,
      member.district,
      member.blood_type,
      member.education_level,
      member.education_type || "None",
      member.occupation,
      formatCurrency(member.monthly_contribution),
      member.age,
    ]);
    const doc = new jsPDF();
    doc.text("Members Report", 14, 16);
    doc.setFontSize(10);
    doc.text(
      `Report Date: ${new Date().toLocaleDateString()}`,
      14,
      23
    );
    autoTable(doc, {
      head: [columns],
      body: exportRows,
      startY: 28,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [70, 95, 255] },
    });
    doc.save(
      `members_report_${new Date()
        .toISOString()
        .slice(0, 10)}.pdf`
    );
  };

  return (
    <div>
      {/* Add Member Button */}
      <div className="flex justify-center mb-4">
        <button
          className="btn btn-success flex items-center px-4 py-2 rounded-sm bg-brand-500 text-white hover:bg-brand-600"
          onClick={openModal}
        >
          + Add Member
        </button>
      </div>

      {/* Filter Inputs */}
      <div className="flex flex-wrap gap-4 mb-4">
        {/* ...existing filter inputs... */}
        <input
          className="rounded border border-gray-300 px-8 py-2 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
          placeholder="Name or Phone"
          value={filters.search}
          onChange={(e) =>
            setFilters((f) => ({ ...f, search: e.target.value }))
          }
        />
        <select
          className="rounded border border-gray-300 px-8 py-2 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
          value={filters.gender}
          onChange={(e) =>
            setFilters((f) => ({ ...f, gender: e.target.value }))
          }
        >
          <option value="">Gender</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
        </select>
        <input
          className="rounded border border-gray-300 px-8 py-2 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
          placeholder="District"
          value={filters.district}
          onChange={e => setFilters(f => ({ ...f, district: e.target.value }))}
        />
        <input
          className="rounded border border-gray-300 px-8 py-2 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
          placeholder="Monthly Contribution"
          type="number"
          min="0"
          value={filters.monthlyContribution}
          onChange={e => setFilters(f => ({ ...f, monthlyContribution: e.target.value }))}
        />
        <input
          className="rounded border border-gray-300 px-8 py-2 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
          placeholder="Education Type"
          value={filters.educationType}
          onChange={e => setFilters(f => ({ ...f, educationType: e.target.value }))}
        />
        <select
          className="rounded border border-gray-300 px-8 py-2 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
          value={filters.age}
          onChange={e => setFilters(f => ({ ...f, age: e.target.value }))}
        >
          <option value="">Age Range</option>
          {ageRanges.map((range) => (
            <option key={range.value} value={range.value}>{range.label}</option>
          ))}
        </select>
        <select
          className="rounded border border-gray-300 px-8 py-2 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
          value={filters.bloodType}
          onChange={(e) =>
            setFilters((f) => ({ ...f, bloodType: e.target.value }))
          }
        >
          <option value="">Blood Type</option>
          <option value="A+">A+</option>
          <option value="A-">A-</option>
          <option value="B+">B+</option>
          <option value="B-">B-</option>
          <option value="AB+">AB+</option>
          <option value="AB-">AB-</option>
          <option value="O+">O+</option>
          <option value="O-">O-</option>
        </select>
        <select
          className="rounded border border-gray-300 px-8 py-2 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
          value={filters.educationLevel}
          onChange={(e) =>
            setFilters((f) => ({ ...f, educationLevel: e.target.value }))
          }
        >
          <option value="">Education Level</option>
          <option value="None">None</option>
          <option value="Undergraduate">Undergraduate</option>
          <option value="Bachelor">Bachelor</option>
          <option value="Master">Master</option>
          <option value="PhD">PhD</option>
        </select>
        <button
          className="btn btn-success flex items-center px-10 py-2 rounded-sm bg-brand-500 text-white hover:bg-brand-600"
          onClick={() =>
            setFilters({
              search: "",
              gender: "",
              district: "",
              monthlyContribution: "",
              educationType: "",
              age: "",
              bloodType: "",
              educationLevel: "",
            })
          }
        >
          Reset
        </button>
        <button
          className="btn btn-success flex items-center px-4 py-2 rounded-sm bg-brand-500 text-white hover:bg-brand-600 "
          onClick={handleExportPDF}
          type="button"
        >
          Export to PDF
        </button>
      </div>

      {/* Members Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="max-w-full overflow-x-auto">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-sm dark:text-gray-400"
                >
                  #
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-sm dark:text-gray-400"
                >
                  Full Name
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-sm dark:text-gray-400"
                >
                  Phone
                </TableCell>
                {/* <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-sm dark:text-gray-400">Marital Status</TableCell> */}
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-sm dark:text-gray-400"
                >
                  District
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-sm dark:text-gray-400"
                >
                  Blood Type
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-sm dark:text-gray-400"
                >
                  Education Level
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-sm dark:text-gray-400"
                >
                  Education Type
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-sm dark:text-gray-400"
                >
                  Occupation
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-sm dark:text-gray-400"
                >
                  Monthly Contribution
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-sm dark:text-gray-400"
                >
                  Age
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-sm dark:text-gray-400"
                >
                  Action
                </TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={12}
                    className="py-16 text-center align-middle"
                  >
                    <div className="flex flex-col items-center justify-center min-h-[180px] w-full">
                      <svg
                        className="animate-spin mb-3 text-brand-500"
                        width="40"
                        height="40"
                        viewBox="0 0 20 20"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <circle
                          cx="10"
                          cy="10"
                          r="8"
                          stroke="#465FFF"
                          strokeWidth="3"
                          strokeDasharray="32"
                          strokeDashoffset="24"
                          fill="none"
                        />
                      </svg>
                      <span className="text-gray-500 dark:text-gray-400 text-lg font-medium">
                        Loading...
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredMembers.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={12}
                    className="py-24 text-center align-middle"
                  >
                    <div className="flex flex-col items-center justify-center min-h-[180px] w-full">
                      <svg
                        className="mb-4 text-gray-400 animate-bounce"
                        width="64"
                        height="64"
                        viewBox="0 0 20 20"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          fillRule="evenodd"
                          clipRule="evenodd"
                          d="M3.04175 9.37363C3.04175 5.87693 5.87711 3.04199 9.37508 3.04199C12.8731 3.04199 15.7084 5.87693 15.7084 9.37363C15.7084 12.8703 12.8731 15.7053 9.37508 15.7053C5.87711 15.7053 3.04175 12.8703 3.04175 9.37363ZM9.37508 1.54199C5.04902 1.54199 1.54175 5.04817 1.54175 9.37363C1.54175 13.6991 5.04902 17.2053 9.37508 17.2053C11.2674 17.2053 13.003 16.5344 14.357 15.4176L17.177 18.238C17.4699 18.5309 17.9448 18.5309 18.2377 18.238C18.5306 17.9451 18.5306 17.4703 18.2377 17.1774L15.418 14.3573C16.5365 13.0033 17.2084 11.2669 17.2084 9.37363C17.2084 5.04817 13.7011 1.54199 9.37508 1.54199Z"
                          fill="#A3AED0"
                        />
                        <circle cx="9.375" cy="9.375" r="2" fill="#465FFF" />
                      </svg>
                      <span className="text-gray-500 dark:text-gray-400 text-lg font-semibold">
                        Sorry! No Result Found
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedMembers.map((member, idx) => (
                  <TableRow key={member._id}>
                    <TableCell className="px-5 py-4 text-start dark:text-gray-400 ">
                      {(currentPage - 1) * pageSize + idx + 1}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-start dark:text-gray-400">
                      {member.full_name}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-start dark:text-gray-400">
                      {member.phone}
                    </TableCell>
                    {/* <TableCell className="px-5 py-4 text-start dark:text-gray-400">{member.marital_status}</TableCell> */}
                    <TableCell className="px-5 py-4 text-start dark:text-gray-400">
                      {member.district}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-start dark:text-gray-400">
                      {member.blood_type}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-start dark:text-gray-400">
                      {member.education_level}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-start dark:text-gray-400">
                      {member.education_type || "None"}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-start dark:text-gray-400">
                      {member.occupation}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-start dark:text-gray-400">
                      {formatCurrency(member.monthly_contribution)}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-start dark:text-gray-400">
                      {member.age}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-start dark:text-gray-400">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditModal(member)}
                          className="flex items-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
                        >
                          <svg
                            className="fill-current"
                            width="18"
                            height="18"
                            viewBox="0 0 18 18"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              fillRule="evenodd"
                              clipRule="evenodd"
                              d="M15.0911 2.78206C14.2125 1.90338 12.7878 1.90338 11.9092 2.78206L4.57524 10.116C4.26682 10.4244 4.05470 10.8158 3.96468 11.2426L3.31231 14.3352C3.25997 14.5833 3.33653 14.841 3.51583 15.0203C3.69512 15.1996 3.95286 15.2761 4.20096 15.2238L7.29355 14.5714C7.72031 14.4814 8.11172 14.2693 8.42013 13.9609L15.7541 6.62695C16.6327 5.74827 16.6327 4.32365 15.7541 3.44497L15.0911 2.78206ZM12.9698 3.84272C13.2627 3.54982 13.7376 3.54982 14.0305 3.84272L14.6934 4.50563C14.9863 4.79852 14.9863 5.27340 14.6934 5.56629L14.0440 6.21573L12.3204 4.49215L12.9698 3.84272ZM11.2597 5.55281L5.63590 11.1766C5.53309 11.2794 5.46238 11.4099 5.43238 11.5522L5.01758 13.5185L6.98394 13.1037C7.12620 13.0737 7.25666 13.0030 7.35947 12.9002L12.9833 7.27639L11.2597 5.55281Z"
                              fill=""
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() => {
                            setDetailsMember(member);
                            openDetailsModal();
                          }}
                          className="flex items-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="lucide lucide-info"
                          >
                            <circle cx="12" cy="12" r="10" />
                            <path d="M12 16v-4" />
                            <path d="M12 8h.01" />
                          </svg>
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Add Member Modal */}
      <Modal
        isOpen={isOpen}
        onClose={closeModal}
        className="max-w-[700px] p-6 lg:p-10"
      >
        <div className="flex flex-col px-2 overflow-y-auto custom-scrollbar">
          <div>
            <h5 className="mb-2 font-semibold text-gray-800 modal-title text-theme-xl dark:text-white/90 lg:text-2xl">
              Add New Member
            </h5>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
              Fill in the details to add a new community member.
            </p>
            {error && <div className="mb-2 text-red-500">{error}</div>}
          </div>
          <form
            onSubmit={handleAddMember}
            className="space-y-5 p-4 flex flex-col"
          >
            <div className="custom-scrollbar h-[450px] overflow-y-auto px-2 pb-3">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-400">
                    Full Name
                  </label>
                  <input
                    name="full_name"
                    value={form.full_name}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                    required
                  />
                </div>
                <div>
                  <Label>Phone</Label>
                  <PhoneInput
                    selectPosition="start"
                    countries={countries}
                    placeholder="+252 61xxxxxxx"
                    initialPhoneNumber={form.phone}
                    onChange={(value) => setForm({ ...form, phone: value })}
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium dark:border-gray-700 text-gray-700 dark:text-gray-400">
                    Gender
                  </label>
                  <select
                    name="gender"
                    value={form.gender}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                    required
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
                {/* <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-400">Marital Status</label>
                  <select
                    name="marital_status"
                    value={form.marital_status}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                    required
                  >
                    <option value="single">Single</option>
                    <option value="married">Married</option>
                    <option value="divorced">Divorced</option>
                    <option value="widowed">Widowed</option>
                  </select>
                </div> */}
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-400">
                    District
                  </label>
                  <select
                    name="district"
                    value={form.district}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                    required
                  >
                    <option value="">Select District</option>
                    {districts.map((district) => (
                      <option key={district} value={district}>
                        {district}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-400">
                    Blood Type
                  </label>
                  <select
                    name="blood_type"
                    value={form.blood_type}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                    required
                  >
                    <option value="">Select Blood Type</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
                <div>
                  <DatePicker
                    id="add-member-date-picker"
                    label="Date of Birth"
                    placeholder="Select date of birth"
                    defaultDate={form.date_of_birth || undefined}
                    onChange={([date]) => {
                      setForm((f) => ({
                        ...f,
                        date_of_birth: date
                          ? date.toISOString().split("T")[0]
                          : "",
                      }));
                    }}
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-400">
                    Education Level
                  </label>
                  <select
                    name="education_level"
                    value={form.education_level}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                    required
                  >
                    <option value="None">None</option>
                    <option value="Undergraduate">Undergraduate</option>
                    <option value="Bachelor">Bachelor</option>
                    <option value="Master">Master</option>
                    <option value="PhD">PhD</option>
                  </select>
                </div>
                {form.education_level !== "None" && (
                  <div className="relative">
                    <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-400">
                      Education Type
                    </label>
                    <input
                      type="text"
                      placeholder="Type to search education type"
                      className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                      value={form.education_type ? form.education_type : educationTypeInput}
                      onChange={e => {
                        setEducationTypeInput(e.target.value);
                        setForm(f => ({ ...f, education_type: "" }));
                        setShowEducationTypeDropdown(true);
                      }}
                      autoComplete="off"
                      required
                      onFocus={() => setShowEducationTypeDropdown(true)}
                      onBlur={() => setTimeout(() => setShowEducationTypeDropdown(false), 150)}
                    />
                    {showEducationTypeDropdown && (
                      <div className="absolute z-10 w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded shadow-lg max-h-56 overflow-y-auto mt-1 dark:text-gray-400">
                        {getEducationTypeOptions(form.education_level, educationTypeInput).length > 0 ? (
                          getEducationTypeOptions(form.education_level, educationTypeInput).slice(0, 10).map((type) => (
                            <div
                              key={type}
                              className={`px-4 py-2 cursor-pointer hover:bg-brand-100 dark:hover:bg-brand-900`}
                              onMouseDown={() => {
                                setForm(f => ({ ...f, education_type: type }));
                                setEducationTypeInput("");
                                setShowEducationTypeDropdown(false);
                              }}
                            >
                              {type}
                            </div>
                          ))
                        ) : (
                          <div className="px-4 py-2 text-gray-400 text-sm">No types found</div>
                        )}
                      </div>
                    )}
                  </div>
                )}
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-400">
                    Occupation
                  </label>
                  <input
                    name="occupation"
                    value={form.occupation}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-400">
                    Monthly Contribution
                  </label>
                  <input
                    name="monthly_contribution"
                    type="number"
                    min="0"
                    value={form.monthly_contribution}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                    required
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 px-2 mt-6 sm:justify-end">
              <button
                onClick={closeModal}
                type="button"
                className="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] sm:w-auto"
                disabled={saving}
              >
                Close
              </button>
              <button
                type="submit"
                className="btn btn-success flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 sm:w-auto"
                disabled={saving}
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Edit Member Modal */}
      <Modal
        isOpen={!!editMember}
        onClose={closeEditModal}
        className="max-w-[700px] p-6 lg:p-6"
      >
        <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h5 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Edit Member
            </h5>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
              Update member details here.
            </p>
            {editError && <div className="mb-2 text-red-500">{editError}</div>}
          </div>
          <form
            className="flex flex-col"
            onSubmit={(e) => {
              e.preventDefault();
              handleEditMember();
            }}
          >
            <div className="custom-scrollbar h-[450px] overflow-y-auto px-2 pb-3">
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-400">
                    Full Name
                  </label>
                  <input
                    name="full_name"
                    value={editForm.full_name}
                    onChange={handleEditInputChange}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                    required
                  />
                </div>
                <div>
                  <Label>Phone</Label>
                  <PhoneInput
                    selectPosition="start"
                    countries={countries}
                    placeholder="+252 61xxxxxxx"
                    initialPhoneNumber={editForm.phone}
                    onChange={(value) =>
                      setEditForm({ ...editForm, phone: value })
                    }
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-400">
                    Gender
                  </label>
                  <select
                    name="gender"
                    value={editForm.gender}
                    onChange={handleEditInputChange}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                    required
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
                {/* <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-400">Marital Status</label>
                  <select
                    name="marital_status"
                    value={editForm.marital_status}
                    onChange={handleEditInputChange}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                    required
                  >
                    <option value="single">Single</option>
                    <option value="married">Married</option>
                    <option value="divorced">Divorced</option>
                    <option value="widowed">Widowed</option>
                  </select>
                </div> */}
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-400">
                    District
                  </label>
                  <select
                    name="district"
                    value={editForm.district}
                    onChange={handleEditInputChange}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                    required
                  >
                    <option value="">Select District</option>
                    {districts.map((district) => (
                      <option key={district} value={district}>
                        {district}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-400">
                    Blood Type
                  </label>
                  <select
                    name="blood_type"
                    value={editForm.blood_type}
                    onChange={handleEditInputChange}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                    required
                  >
                    <option value="">Select Blood Type</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
                <div>
                  <DatePicker
                    id="edit-member-date-picker"
                    label="Date of Birth"
                    placeholder="Select date of birth"
                    defaultDate={editForm.date_of_birth || undefined}
                    onChange={([date]) => {
                      setEditForm((f) => ({
                        ...f,
                        date_of_birth: date
                          ? date.toISOString().split("T")[0]
                          : "",
                      }));
                    }}
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-400">
                    Education Level
                  </label>
                  <select
                    name="education_level"
                    value={editForm.education_level}
                    onChange={handleEditInputChange}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                    required
                  >
                    <option value="None">None</option>
                    <option value="Undergraduate">Undergraduate</option>
                    <option value="Bachelor">Bachelor</option>
                    <option value="Master">Master</option>
                    <option value="PhD">PhD</option>
                  </select>
                </div>
                {editForm.education_level !== "None" && (
                  <div className="relative">
                    <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-400">
                      Education Type
                    </label>
                    <input
                      type="text"
                      placeholder="Type to search education type"
                      className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                      value={editForm.education_type ? editForm.education_type : editEducationTypeInput}
                      onChange={e => {
                        setEditEducationTypeInput(e.target.value);
                        setEditForm(f => ({ ...f, education_type: "" }));
                        setShowEditEducationTypeDropdown(true);
                      }}
                      autoComplete="off"
                      required
                      onFocus={() => setShowEditEducationTypeDropdown(true)}
                      onBlur={() => setTimeout(() => setShowEditEducationTypeDropdown(false), 150)}
                    />
                    {showEditEducationTypeDropdown && (
                      <div className="absolute z-10 w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded shadow-lg max-h-56 overflow-y-auto mt-1 dark:text-gray-400">
                        {getEducationTypeOptions(editForm.education_level, editEducationTypeInput).length > 0 ? (
                          getEducationTypeOptions(editForm.education_level, editEducationTypeInput).slice(0, 10).map((type) => (
                            <div
                              key={type}
                              className={`px-4 py-2 cursor-pointer hover:bg-brand-100 dark:hover:bg-brand-900`}
                              onMouseDown={() => {
                                setEditForm(f => ({ ...f, education_type: type }));
                                setEditEducationTypeInput("");
                                setShowEditEducationTypeDropdown(false);
                              }}
                            >
                              {type}
                            </div>
                          ))
                        ) : (
                          <div className="px-4 py-2 text-gray-400 text-sm">No types found</div>
                        )}
                      </div>
                    )}
                  </div>
                )}
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-400">
                    Occupation
                  </label>
                  <input
                    name="occupation"
                    value={editForm.occupation}
                    onChange={handleEditInputChange}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-400">
                    Monthly Contribution
                  </label>
                  <input
                    name="monthly_contribution"
                    type="number"
                    min="0"
                    value={editForm.monthly_contribution}
                    onChange={handleEditInputChange}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                    required
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 px-2 mt-6 sm:justify-end">
              <button
                onClick={closeEditModal}
                type="button"
                className="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] sm:w-auto"
                disabled={editSaving}
              >
                Close
              </button>
              <button
                type="submit"
                className="btn btn-success flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 sm:w-auto"
                disabled={editSaving}
              >
                {editSaving ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Details Member Modal */}
      <Modal
        isOpen={isDetailsOpen}
        onClose={closeDetailsModal}
        className="max-w-[700px] p-6 lg:p-10"
      >
        <div className="flex flex-col px-2 overflow-y-auto custom-scrollbar">
          <h5 className="mb-4 font-semibold text-gray-800 text-theme-xl dark:text-white/90">
            Member Details
          </h5>
          {detailsMember && (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32 text-gray-700 dark:text-gray-400">
              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  Full Name
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {detailsMember.full_name}
                </p>
              </div>
              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  Phone
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {detailsMember.phone}
                </p>
              </div>
              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  Gender
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {detailsMember.gender}
                </p>
              </div>
              {/* <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">Marital Status</p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">{detailsMember.marital_status}</p>
              </div> */}
              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  District
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {detailsMember.district}
                </p>
              </div>
              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  Blood Type
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {detailsMember.blood_type}
                </p>
              </div>
              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  Education Level
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {detailsMember.education_level}
                </p>
              </div>
              {detailsMember.education_type && (
                <div>
                  <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                    Education Type
                  </p>
                  <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                    {detailsMember.education_type}
                  </p>
                </div>
              )}
              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  Occupation
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {detailsMember.occupation}
                </p>
              </div>
              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  Monthly Contribution
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {formatCurrency(detailsMember.monthly_contribution)}
                </p>
              </div>
              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  Date of Birth
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {detailsMember.date_of_birth}
                </p>
              </div>
              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  Age
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {detailsMember.age}
                </p>
              </div>
              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  Created By
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {detailsMember.created_by.username}
                </p>
              </div>
              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  Registered Date
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {detailsMember.createdAt
                    ? new Date(detailsMember.createdAt).toLocaleString()
                    : "N/A"}
                </p>
              </div>
            </div>
          )}
          <div className="flex items-center gap-3 mt-6 sm:justify-end">
            <button
              onClick={closeDetailsModal}
              type="button"
              className="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] sm:w-auto"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>

      <div className="flex justify-between items-center mt-4 dark:text-gray-400">
        <span>
          Showing {(currentPage - 1) * pageSize + 1} -{" "}
          {Math.min(currentPage * pageSize, filteredMembers.length)} of{" "}
          {filteredMembers.length} entries
        </span>
        <div className="flex gap-2">
          <button
            className="px-3 py-1 rounded border"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </button>
          {[...Array(totalPages)].map((_, idx) => (
            <button
              key={idx}
              className={`px-3 py-1 rounded border ${
                currentPage === idx + 1 ? "bg-brand-500 text-white" : ""
              }`}
              onClick={() => setCurrentPage(idx + 1)}
            >
              {idx + 1}
            </button>
          ))}
          <button
            className="px-3 py-1 rounded border"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
