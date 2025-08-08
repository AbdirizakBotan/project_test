import { useEffect, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Modal } from "../ui/modal";
import { useModal } from "../../hooks/useModal";
import api from "../../utils/axios";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import Badge from "../ui/badge/Badge";
import DatePicker from "../form/date-picker";
import toast from "react-hot-toast";
import moment from "moment";

// Helper for month options
const monthOptions = [
  { value: 1, label: "1 month" },
  { value: 3, label: "3 months" },
  { value: 6, label: "6 months" },
  { value: 12, label: "12 months" },
];

interface Member {
  _id: string;
  full_name: string;
  phone: string;
  monthly_contribution: number;
}

interface Payment {
  _id: string;
  member: string | Member;
  amountPaid: number;
  monthsPaidFor: number;
  monthsCovered: { month: number; year: number }[];
  datePaid: string | null;
  status: "paid" | "unpaid";
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export default function PaymentsTable() {
  // --- PDF Export Handler with member/date range filter ---
  // UI state for export filters
  const [exportDateRange, setExportDateRange] = useState<{
    start: Date | null;
    end: Date | null;
  }>({ start: null, end: null });
  // Use the same members state for both table and export
  const [members, setMembers] = useState<Member[]>([]);
  // Use the same search input for both table and export (memberSearch)
  // ...existing code...

  // Removed getExportPayments (unused)

  const handleExportPDF = () => {
    // Always export exactly what is shown in table (filteredPayments)
    const exportRows = [];
    const columns = [
      "#",
      "Name",
      "Phone",
      "Monthly Contribution",
      "Amount",
      "Status",
      "Date Paid",
      "Month(s)",
    ];
    let reportTitle = "Payments Report";
    let reportPeriod = "";
    let fileName = "payments_report.pdf";
    exportRows.push(
      ...filteredPayments.map((payment, idx) => {
        const member = payment.member;
        let monthsText = "";
        if (payment.status === "unpaid") {
          monthsText = "None";
        } else if (payment.monthsCovered.length === 1) {
          monthsText = moment({
            year: payment.monthsCovered[0].year,
            month: payment.monthsCovered[0].month - 1,
          }).format("MMM YYYY");
        } else {
          const monthsList = payment.monthsCovered
            .map((mc) =>
              moment({ year: mc.year, month: mc.month - 1 }).format("MMM")
            )
            .join(", ");
          monthsText = `${payment.monthsCovered.length} months, ${monthsList}`;
        }
        return [
          idx + 1,
          member?.full_name || "-",
          member?.phone || "-",
          formatCurrency(member?.monthly_contribution || 0),
          formatCurrency(payment.amountPaid || 0),
          payment.status === "paid" ? "Paid" : "Unpaid",
          payment.status === "paid" && payment.datePaid
            ? moment(payment.datePaid).format("YYYY-MM-DD")
            : "-",
          monthsText,
        ];
      })
    );
    // Title/period
    const startDate = exportDateRange.start;
    const endDate = exportDateRange.end;
    if (filteredPayments.length === 1) {
      reportTitle = `Payments Report for ${filteredPayments[0].member.full_name}`;
    } else if (filters.status === "unpaid") {
      reportTitle = "Unpaid Members Report";
    } else if (filters.status === "paid") {
      reportTitle = "Paid Members Report";
    } else {
      reportTitle = "Payments Report (All Statuses)";
    }
    if (startDate && endDate) {
      reportPeriod = `Period: ${moment(startDate).format(
        "MMM D, YYYY"
      )} - ${moment(endDate).format("MMM D, YYYY")}`;
      fileName = `${reportTitle.replace(/\s+/g, "_").toLowerCase()}_${moment(
        startDate
      ).format("YYYYMMDD")}-${moment(endDate).format("YYYYMMDD")}.pdf`;
    } else if (startDate) {
      reportPeriod = `From: ${moment(startDate).format("MMM D, YYYY")}`;
      fileName = `${reportTitle
        .replace(/\s+/g, "_")
        .toLowerCase()}_from_${moment(startDate).format("YYYYMMDD")}.pdf`;
    } else if (endDate) {
      reportPeriod = `Up to: ${moment(endDate).format("MMM D, YYYY")}`;
      fileName = `${reportTitle
        .replace(/\s+/g, "_")
        .toLowerCase()}_upto_${moment(endDate).format("YYYYMMDD")}.pdf`;
    } else {
      reportPeriod = `Report Date: ${moment().format("MMMM D, YYYY")}`;
      fileName = `${reportTitle
        .replace(/\s+/g, "_")
        .toLowerCase()}_${moment().format("YYYYMMDD")}.pdf`;
    }
    const doc = new jsPDF();
    doc.text(reportTitle, 14, 16);
    doc.setFontSize(10);
    doc.text(reportPeriod, 14, 23);
    autoTable(doc, {
      head: [columns],
      body: exportRows,
      startY: 28,
      styles: { fontSize: 9 },
      headStyles: {
        fillColor: filters.status === "unpaid" ? [255, 70, 70] : [70, 95, 255],
      },
    });
    doc.save(fileName);
  };
  const { isOpen, openModal, closeModal } = useModal();
  // Info modal state
  const [infoPayment, setInfoPayment] = useState<Payment | null>(null);
  // (moved above to fix initialization order)
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    memberId: "",
    memberIdInput: "",
    showMemberDropdown: false,
    monthsPaidFor: 1,
    startMonth: moment().month() + 1,
    startYear: moment().year(),
    monthsCovered: [{ month: moment().month() + 1, year: moment().year() }],
    amountPaid: 0,
  });
  // Edit modal state
  const [editPayment, setEditPayment] = useState<Payment | null>(null);
  type EditForm = {
    memberId: string;
    monthsPaidFor: number;
    startMonth: number;
    startYear: number;
    monthsCovered: { month: number; year: number }[];
    amountPaid: number;
    status: "paid" | "unpaid";
  } | null;
  const [editForm, setEditForm] = useState<EditForm>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  // When editPayment is set, initialize editForm
  useEffect(() => {
    if (editPayment) {
      setEditForm({
        memberId:
          typeof editPayment.member === "string"
            ? editPayment.member
            : editPayment.member._id,
        monthsPaidFor: editPayment.monthsCovered.length,
        startMonth: editPayment.monthsCovered[0]?.month || moment().month() + 1,
        startYear: editPayment.monthsCovered[0]?.year || moment().year(),
        monthsCovered: editPayment.monthsCovered,
        amountPaid: editPayment.amountPaid,
        status: editPayment.status,
      });
      setEditError(null);
    }
  }, [editPayment]);

  // Update monthsCovered and amountPaid in editForm when relevant fields change
  const editFormMemberId = editForm ? editForm.memberId : undefined;
  const editFormMonthsPaidFor = editForm ? editForm.monthsPaidFor : undefined;
  const editFormStartMonth = editForm ? editForm.startMonth : undefined;
  const editFormStartYear = editForm ? editForm.startYear : undefined;
  useEffect(() => {
    if (!editForm || !editPayment) return;
    let months: { month: number; year: number }[] = [];
    if (editForm.monthsPaidFor === 1) {
      months = [{ month: editForm.startMonth, year: editForm.startYear }];
    } else {
      let m = editForm.startMonth;
      let y = editForm.startYear;
      for (let i = 0; i < editForm.monthsPaidFor; i++) {
        months.push({ month: m, year: y });
        m++;
        if (m > 12) {
          m = 1;
          y++;
        }
      }
    }
    const member = members.find((m) => m._id === editForm.memberId);
    setEditForm((f) =>
      f
        ? {
            ...f,
            monthsCovered: months,
            amountPaid: member
              ? member.monthly_contribution * f.monthsPaidFor
              : 0,
          }
        : f
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editFormMemberId, editFormMonthsPaidFor, editFormStartMonth, editFormStartYear, members, editPayment]);

  const handleEditFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setEditForm((f) =>
      f
        ? {
            ...f,
            [name]: name === "monthsPaidFor" ? Number(value) : value,
          }
        : f
    );
  };

  const handleEditPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditSaving(true);
    setEditError(null);
    try {
      await api.put(`/api/payments/update/${editPayment?._id}`, {
        memberId: editForm?.memberId,
        monthsPaidFor: editForm?.monthsPaidFor,
        startMonth: editForm?.startMonth,
        startYear: editForm?.startYear,
        monthsCovered: editForm?.monthsCovered,
        amountPaid: editForm?.amountPaid,
        status: editForm?.status,
      });
      toast.success("Payment updated successfully!", {
        position: "top-center",
      });
      setEditPayment(null);
      setEditForm(null);
      // Refresh payments
      api.get("/api/payments/all").then((paymentsRes) => {
        setPayments(paymentsRes.data);
      });
    } catch (err: unknown) {
      let errorMsg = "Failed to update payment";
      if (
        typeof err === "object" &&
        err !== null &&
        "response" in err &&
        typeof (err as { response?: { data?: { error?: string } } }).response?.data?.error === "string"
      ) {
        errorMsg = (err as { response: { data: { error: string } } }).response.data.error;
      }
      setEditError(errorMsg);
      toast.error(errorMsg, { position: "top-center" });
    } finally {
      setEditSaving(false);
    }
  };

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Filter state for Payments
  const [filters, setFilters] = useState({
    memberId: "",
    month: "", // format: MM-YYYY
    status: "",
    monthsPaidFor: "", // new filter: exact months paid for (1, 3, 6, 12)
  });
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 25;

  // Helper for unique months in payments (not needed for datepicker)

  // Update amountPaid when member or months change
  // Update monthsCovered and amountPaid when startMonth/startYear/monthsPaidFor/memberId changes
  useEffect(() => {
    let months: { month: number; year: number }[] = [];
    if (form.monthsPaidFor === 1) {
      // For 1 month, allow any month selection (past/future)
      months = [{ month: form.startMonth, year: form.startYear }];
    } else {
      // For >1 month, start from selected startMonth/startYear and go forward
      let m = form.startMonth;
      let y = form.startYear;
      for (let i = 0; i < form.monthsPaidFor; i++) {
        months.push({ month: m, year: y });
        m++;
        if (m > 12) {
          m = 1;
          y++;
        }
      }
    }
    const member = members.find((m) => m._id === form.memberId);
    setForm((f) => ({
      ...f,
      monthsCovered: months,
      amountPaid: member ? member.monthly_contribution * f.monthsPaidFor : 0,
    }));
  }, [form.memberId, form.monthsPaidFor, form.startMonth, form.startYear, members]);

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((f) => ({
      ...f,
      [name]: name === "monthsPaidFor" ? Number(value) : value,
    }));
  };

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    // Prevent duplicate member name or phone (UI check)
    const member = members.find((m) => m._id === form.memberId);
    if (!member) {
      setFormError("Please select a valid member.");
      setSaving(false);
      return;
    }
    const nameDuplicate = members.some(
      (m) =>
        m.full_name.trim().toLowerCase() ===
          member.full_name.trim().toLowerCase() && m._id !== member._id
    );
    if (nameDuplicate) {
      setFormError("A member with this name already exists.");
      setSaving(false);
      return;
    }
    const phoneDuplicate = members.some(
      (m) => m.phone.trim() === member.phone.trim() && m._id !== member._id
    );
    if (phoneDuplicate) {
      setFormError("A member with this phone number already exists.");
      setSaving(false);
      return;
    }
    // Prevent duplicate payment for the same member and months
    const duplicate = payments.find(
      (p) =>
        (typeof p.member === "string" ? p.member : p.member._id) ===
          form.memberId &&
        p.status === "paid" &&
        p.monthsCovered.some((mc) =>
          form.monthsCovered.some(
            (fmc) => fmc.month === mc.month && fmc.year === mc.year
          )
        )
    );
    if (duplicate) {
      setFormError(
        "Payment already exists for one or more of the selected months."
      );
      setSaving(false);
      return;
    }
    try {
      await api.post("/api/payments/pay", {
        memberId: form.memberId,
        monthsPaidFor: form.monthsPaidFor,
        startMonth: form.startMonth,
        startYear: form.startYear,
        monthsCovered: form.monthsCovered,
        amountPaid: form.amountPaid,
      });
      toast.success("Payment recorded successfully!", {
        position: "top-center",
      });
      closeModal();
      setForm((f) => ({
        ...f,
        memberId: "",
        memberIdInput: "",
        showMemberDropdown: false,
        monthsPaidFor: 1,
        startMonth: moment().month() + 1,
        startYear: moment().year(),
        monthsCovered: [{ month: moment().month() + 1, year: moment().year() }],
        amountPaid: 0,
      }));
      // Refresh payments, but don't set loading to true (so UI doesn't get stuck)
      api.get("/api/payments/all").then((paymentsRes) => {
        setPayments(paymentsRes.data);
      });
    } catch (err: unknown) {
      let msg = "Failed to record payment";
      if (
        typeof err === "object" &&
        err !== null &&
        "response" in err &&
        typeof (err as { response?: { data?: { error?: string } } }).response?.data?.error === "string"
      ) {
        msg = (err as { response: { data: { error: string } } }).response.data.error;
      }
      setFormError(msg);
      toast.error(msg, { position: "top-center" });
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([api.get("/api/members"), api.get("/api/payments/all")])
      .then(([membersRes, paymentsRes]) => {
        setMembers(membersRes.data);
        setPayments(paymentsRes.data);
      })
      .catch(() => setError("Failed to load data"))
      .finally(() => setLoading(false));
  }, []);

  // Sort payments by datePaid desc, then by member name
  // Removed sortedPayments (unused)

  // Remove filterDate state
  // const [filterDate, setFilterDate] = useState<Date | null>(null);

  // Use exportDateRange for filtering table rows
  // --- Enhanced Filtering: Members by Date Range & Status ---
  // Helper: check if a payment covers any month in the selected range
  const isMonthInRange = (
    month: number,
    year: number,
    start: Date | null,
    end: Date | null
  ) => {
    const date = moment({ year, month: month - 1, day: 1 });
    if (start && date.isBefore(moment(start).startOf("month"))) return false;
    if (end && date.isAfter(moment(end).endOf("month"))) return false;
    return true;
  };

  // For each member, determine payment status in the selected range
  const [memberSearch, setMemberSearch] = useState("");
  const filteredMembers = members
    .sort((a, b) => a.full_name.localeCompare(b.full_name))
    .filter((m) => {
      if (!memberSearch.trim()) return true;
      const search = memberSearch.trim().toLowerCase();
      return (
        m.full_name.toLowerCase().includes(search) ||
        m.phone.toLowerCase().includes(search)
      );
    })
    .filter((m) => {
      // Status filter: paid/unpaid/all
      if (!filters.status) return true;
      // Find payments for this member in the selected range
      const memberPayments = payments.filter((p) => {
        const pid = typeof p.member === "string" ? p.member : p.member._id;
        if (pid !== m._id) return false;
        return p.monthsCovered.some((mc) =>
          isMonthInRange(
            mc.month,
            mc.year,
            exportDateRange.start,
            exportDateRange.end
          )
        );
      });
      if (filters.status === "paid") {
        // Show if any paid payment in range
        return memberPayments.some((p) => p.status === "paid");
      } else if (filters.status === "unpaid") {
        // Show if NO paid payment in range
        return !memberPayments.some((p) => p.status === "paid");
      }
      return true;
    })
    .filter((m) => {
      // MonthsPaidFor filter
      if (!filters.monthsPaidFor) return true;
      // Find payments for this member in range
      const memberPayments = payments.filter((p) => {
        const pid = typeof p.member === "string" ? p.member : p.member._id;
        if (pid !== m._id) return false;
        return p.monthsCovered.some((mc) =>
          isMonthInRange(
            mc.month,
            mc.year,
            exportDateRange.start,
            exportDateRange.end
          )
        );
      });
      // For paid: match monthsPaidFor
      if (filters.status === "paid") {
        return memberPayments.some(
          (p) =>
            p.status === "paid" &&
            String(p.monthsCovered.length) === filters.monthsPaidFor
        );
      }
      // For unpaid: only show if no paid payment in range and monthsPaidFor is 1
      if (filters.status === "unpaid") {
        return filters.monthsPaidFor === "1";
      }
      // For all: show if any payment matches, or if unpaid and monthsPaidFor is 1
      return (
        memberPayments.some(
          (p) => String(p.monthsCovered.length) === filters.monthsPaidFor
        ) ||
        (!memberPayments.some((p) => p.status === "paid") &&
          filters.monthsPaidFor === "1")
      );
    });

  // Compose filteredPayments for table: for each filtered member, show their payment in range (or unpaid)
  const filteredPayments = filteredMembers.map((member) => {
    // Find paid payment in range
    const memberPayments = payments.filter((p) => {
      const pid = typeof p.member === "string" ? p.member : p.member._id;
      if (pid !== member._id) return false;
      return p.monthsCovered.some((mc) =>
        isMonthInRange(
          mc.month,
          mc.year,
          exportDateRange.start,
          exportDateRange.end
        )
      );
    });
    const paidPayment = memberPayments.find((p) => p.status === "paid");
    if (paidPayment) {
      return { ...paidPayment, member };
    } else {
      // Show as unpaid for first month in range (or current month)
      let monthToCheck;
      if (exportDateRange.start) {
        const d = moment(exportDateRange.start);
        monthToCheck = { month: d.month() + 1, year: d.year() };
      } else {
        const now = moment();
        monthToCheck = { month: now.month() + 1, year: now.year() };
      }
      return {
        _id: `unpaid-${member._id}-${monthToCheck.month}-${monthToCheck.year}`,
        member,
        amountPaid: 0,
        monthsPaidFor: 1,
        monthsCovered: [monthToCheck],
        datePaid: null,
        status: "unpaid" as const,
      };
    }
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredPayments.length / pageSize);
  const paginatedPayments = filteredPayments.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div>
      {/* Record Payment Button centered */}
      <div className="flex justify-center items-center mb-4 flex-wrap gap-2">
        <button
          className="btn btn-success flex items-center px-4 py-2 rounded-sm bg-brand-500 text-white hover:bg-brand-600"
          onClick={openModal}
        >
          + Record Payment
        </button>
      </div>
      {/* Filter Inputs + Export Button next to Reset */}

      <div className="flex flex-wrap gap-6 items-center">
        {/* Filter Controls */}
        <div className="flex flex-wrap gap-6 items-center">
          <div className="flex flex-col">
            <label className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-400">
              Search or Select Member
            </label>
            <input
              type="text"
              className="rounded border border-gray-300 px-8 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
              placeholder="Search by name or phone (for table and export)"
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
            />
          </div>

          <div className="flex flex-col">
            <label className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-400">
              Select Status
            </label>
            <select
              className="rounded border border-gray-300 px-8 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
              value={filters.status}
              onChange={(e) =>
                setFilters((f) => ({ ...f, status: e.target.value }))
              }
            >
              <option value="">All Statuses</option>
              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid</option>
            </select>
          </div>

          <div className="flex flex-col">
            <label className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-400">
              Months Paid For
            </label>
            <select
              className="rounded border border-gray-300 px-8 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
              value={filters.monthsPaidFor}
              onChange={(e) =>
                setFilters((f) => ({ ...f, monthsPaidFor: e.target.value }))
              }
            >
              <option value="">All Months Paid For</option>
              <option value="1">1 month</option>
              <option value="3">3 months</option>
              <option value="6">6 months</option>
              <option value="12">12 months</option>
            </select>
          </div>

          <div className="flex flex-col justify-end">
            <label className="mb-1 text-xs text-transparent select-none">
              Reset
            </label>
            <button
              className="btn btn-success flex items-center px-10 py-2.5 rounded-sm bg-brand-500 text-white hover:bg-brand-600"
              onClick={() => {
                setFilters({
                  memberId: "",
                  month: "",
                  status: "",
                  monthsPaidFor: "",
                });
                // Remove setFilterDate
                setMemberSearch("");
                setExportDateRange({
                  start: null,
                  end: null,
                });
                setCurrentPage(1);
              }}
            >
              Reset
            </button>
          </div>
        </div>

        {/* Export Controls */}
        <div className="flex flex-wrap gap-6 mb-4 items-center">
          <div className="flex flex-col">
            <label className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-400">
              Report Start Date
            </label>
            <DatePicker
              id="export-date-start"
              placeholder="Export: Start date"
              defaultDate={exportDateRange.start || undefined}
              onChange={([date]) =>
                setExportDateRange((r) => ({ ...r, start: date || null }))
              }
            />
          </div>
          <div className="flex flex-col">
            <label className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-400">
              Report End Date
            </label>
            <DatePicker
              id="export-date-end"
              placeholder="Export: End date"
              defaultDate={exportDateRange.end || undefined}
              onChange={([date]) =>
                setExportDateRange((r) => ({ ...r, end: date || null }))
              }
            />
          </div>
          <div className="flex flex-col justify-end">
            <label className="mb-1 text-xs text-transparent select-none">
              Export
            </label>
            <button
              className="btn btn-primary flex items-center px-4 py-2.5 rounded-sm bg-blue-600 text-white hover:bg-blue-700"
              onClick={handleExportPDF}
            >
              Export to PDF
            </button>
          </div>
        </div>
      </div>

      {/* Add Payment Modal */}
      <Modal
        isOpen={isOpen}
        onClose={closeModal}
        className="max-w-[600px] p-6 lg:p-8"
      >
        <div className="flex flex-col px-2 overflow-y-auto custom-scrollbar">
          <h5 className="mb-2 font-semibold text-gray-800 modal-title text-theme-xl dark:text-white/90 lg:text-2xl">
            Record Payment
          </h5>
          <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
            Fill in the details to record a payment for a member.
          </p>
          {formError && <div className="mb-2 text-red-500">{formError}</div>}
          <form
            onSubmit={handleAddPayment}
            className="space-y-5 p-4 flex flex-col"
          >
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-400">
                  Member
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Type name or phone to search"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                    value={
                      form.memberId
                        ? (() => {
                            const m = members.find(
                              (mem) => mem._id === form.memberId
                            );
                            return m ? `${m.full_name} (${m.phone})` : "";
                          })()
                        : form.memberIdInput || ""
                    }
                    onChange={(e) => {
                      setForm((f) => ({
                        ...f,
                        memberIdInput: e.target.value,
                        memberId: "",
                        showMemberDropdown: true,
                      }));
                    }}
                    autoComplete="off"
                    required
                    onFocus={() =>
                      setForm((f) => ({ ...f, showMemberDropdown: true }))
                    }
                    onBlur={() =>
                      setTimeout(
                        () =>
                          setForm((f) => ({ ...f, showMemberDropdown: false })),
                        150
                      )
                    }
                  />
                  {form.memberIdInput && form.showMemberDropdown && (
                    <div className="absolute z-10 w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded shadow-lg max-h-56 overflow-y-auto mt-1 dark:text-gray-400">
                      {members
                        .filter((m) => {
                          const v = form.memberIdInput?.toLowerCase() || "";
                          return (
                            !v ||
                            m.full_name.toLowerCase().includes(v) ||
                            m.phone.toLowerCase().includes(v)
                          );
                        })
                        .slice(0, 10)
                        .map((m) => (
                          <div
                            key={m._id}
                            className={`px-4 py-2 cursor-pointer hover:bg-brand-100 dark:hover:bg-brand-900 ${
                              form.memberId === m._id
                                ? "bg-brand-50 dark:bg-brand-800"
                                : ""
                            }`}
                            onMouseDown={() => {
                              setForm((f) => ({
                                ...f,
                                memberId: m._id,
                                memberIdInput: `${m.full_name} (${m.phone})`,
                                showMemberDropdown: false,
                              }));
                            }}
                          >
                            <span className="font-medium">{m.full_name}</span>{" "}
                            <span className="text-xs text-gray-500">
                              ({m.phone})
                            </span>
                          </div>
                        ))}
                      {members.filter((m) => {
                        const v = form.memberIdInput?.toLowerCase() || "";
                        return (
                          !v ||
                          m.full_name.toLowerCase().includes(v) ||
                          m.phone.toLowerCase().includes(v)
                        );
                      }).length === 0 && (
                        <div className="px-4 py-2 text-gray-400 text-sm">
                          No members found
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-400">
                  Months to Pay For
                </label>
                <select
                  name="monthsPaidFor"
                  value={form.monthsPaidFor}
                  onChange={handleFormChange}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                  required
                >
                  {monthOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-400">
                  Start Month/Year
                </label>
                <DatePicker
                  id="start-month-picker"
                  placeholder="Select start month"
                  defaultDate={new Date(form.startYear, form.startMonth - 1, 1)}
                  onChange={([date]) => {
                    if (date) {
                      setForm((f) => ({
                        ...f,
                        startMonth: date.getMonth() + 1,
                        startYear: date.getFullYear(),
                      }));
                    }
                  }}
                />
                {form.monthsPaidFor > 1 && (
                  <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    Paying for:{" "}
                    {form.monthsCovered
                      .map((mc) =>
                        moment({ year: mc.year, month: mc.month - 1 }).format(
                          "MMMM YYYY"
                        )
                      )
                      .join(", ")}
                  </div>
                )}
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-400">
                  Amount
                </label>
                <input
                  name="amountPaid"
                  type="number"
                  value={form.amountPaid}
                  readOnly
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-800 bg-gray-100 dark:bg-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                />
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

      {/* Info Modal */}
      <Modal
        isOpen={!!infoPayment}
        onClose={() => setInfoPayment(null)}
        className="max-w-[600px] p-6 lg:p-10"
      >
        <div className="flex flex-col px-2 overflow-y-auto custom-scrollbar">
          <h5 className="mb-4 font-semibold text-gray-800 text-theme-xl dark:text-white/90">
            Payment Details
          </h5>
          {infoPayment && (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32 text-gray-700 dark:text-gray-400">
              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  Member
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {(() => {
                    const member = members.find(
                      (m) =>
                        m._id ===
                        (typeof infoPayment.member === "string"
                          ? infoPayment.member
                          : infoPayment.member._id)
                    );
                    return member ? member.full_name : "-";
                  })()}
                </p>
              </div>
              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  Amount
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {formatCurrency(infoPayment.amountPaid)}
                </p>
              </div>
              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  Months Covered
                </p>
                {infoPayment.status === "unpaid" ? (
                  <span className="text-sm font-medium text-gray-800 dark:text-white/90">
                    None
                  </span>
                ) : (
                  <ul className="list-disc ml-5 text-sm font-medium text-gray-800 dark:text-white/90">
                    {infoPayment.monthsCovered.map((m) => (
                      <li key={`${m.month}-${m.year}`}>
                        {moment({ year: m.year, month: m.month - 1 }).format(
                          "MMMM YYYY"
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  Paid At
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {infoPayment.datePaid
                    ? moment(infoPayment.datePaid).format("l, LTS")
                    : "-"}
                </p>
              </div>
            </div>
          )}
          <div className="flex items-center gap-3 mt-6 sm:justify-end">
            <button
              onClick={() => setInfoPayment(null)}
              type="button"
              className="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] sm:w-auto"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>

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
                  Name
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-sm dark:text-gray-400"
                >
                  Phone
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
                  Status
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-sm dark:text-gray-400"
                >
                  Date Paid
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-sm dark:text-gray-400"
                >
                  Months
                </TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="py-24 text-center align-middle"
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
              ) : error ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="py-16 text-center align-middle text-red-500"
                  >
                    {error}
                  </TableCell>
                </TableRow>
              ) : filteredPayments.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
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
                        No payment records found.
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedPayments.map((payment, idx) => {
                  const member = members.find(
                    (m) =>
                      m._id ===
                      (typeof payment.member === "string"
                        ? payment.member
                        : payment.member._id)
                  );
                  return (
                    <TableRow key={payment._id}>
                      <TableCell className="px-5 py-4 text-start dark:text-gray-400 ">
                        {(currentPage - 1) * pageSize + idx + 1}
                      </TableCell>
                      <TableCell className="px-5 py-4 text-start dark:text-gray-400">
                        {member?.full_name || "-"}
                      </TableCell>
                      <TableCell className="px-5 py-4 text-start dark:text-gray-400">
                        {member?.phone || "-"}
                      </TableCell>
                      <TableCell className="px-5 py-4 text-start dark:text-gray-400">
                        {formatCurrency(member?.monthly_contribution || 0)}
                      </TableCell>
                      <TableCell className="px-5 py-4 text-start">
                        <Badge
                          size="sm"
                          color={
                            payment.status === "paid" ? "success" : "error"
                          }
                        >
                          {payment.status === "paid" ? "Paid" : "Unpaid"}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-5 py-4 text-start dark:text-gray-400">
                        {payment.status === "paid" && payment.datePaid
                          ? moment(payment.datePaid).format("YYYY-MM-DD")
                          : "-"}
                      </TableCell>
                      <TableCell className="px-5 py-4 text-start dark:text-gray-400">
                        {payment.status === "unpaid"
                          ? "None"
                          : payment.monthsCovered.length === 1
                          ? moment({
                              year: payment.monthsCovered[0].year,
                              month: payment.monthsCovered[0].month - 1,
                            }).format("MMM YYYY")
                          : `${payment.monthsCovered.length} months`}
                      </TableCell>
                      <TableCell className="px-5 py-4 text-start dark:text-gray-400">
                        {/* Wrap both buttons in a div, not a fragment, to avoid adjacent JSX error */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditPayment(payment)}
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
                                d="M15.0911 2.78206C14.2125 1.90338 12.7878 1.90338 11.9092 2.78206L4.57524 10.116C4.26682 10.4244 4.0547 10.8158 3.96468 11.2426L3.31231 14.3352C3.25997 14.5833 3.33653 14.841 3.51583 15.0203C3.69512 15.1996 3.95286 15.2761 4.20096 15.2238L7.29355 14.5714C7.72031 14.4814 8.11172 14.2693 8.42013 13.9609L15.7541 6.62695C16.6327 5.74827 16.6327 4.32365 15.7541 3.44497L15.0911 2.78206ZM12.9698 3.84272C13.2627 3.54982 13.7376 3.54982 14.0305 3.84272L14.6934 4.50563C14.9863 4.79852 14.9863 5.2734 14.6934 5.56629L14.044 6.21573L12.3204 4.49215L12.9698 3.84272ZM11.2597 5.55281L5.6359 11.1766C5.53309 11.2794 5.46238 11.4099 5.43238 11.5522L5.01758 13.5185L6.98394 13.1037C7.1262 13.0737 7.25666 13.003 7.35947 12.9002L12.9833 7.27639L11.2597 5.55281Z"
                                fill=""
                              />
                            </svg>
                          </button>
                          <button
                            onClick={() => setInfoPayment(payment)}
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
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      {/* Edit Payment Modal (moved outside the table rendering) */}
      <Modal
        isOpen={!!editPayment}
        onClose={() => {
          setEditPayment(null);
          setEditForm(null);
        }}
        className="max-w-[600px] p-6 lg:p-8"
      >
        <div className="flex flex-col px-2 overflow-y-auto custom-scrollbar">
          <h5 className="mb-2 font-semibold text-gray-800 modal-title text-theme-xl dark:text-white/90 lg:text-2xl">
            Edit Payment
          </h5>
          <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
            Update the details for this payment.
          </p>
          {editError && <div className="mb-2 text-red-500">{editError}</div>}
          {editForm && (
            <form
              onSubmit={handleEditPayment}
              className="space-y-5 p-4 flex flex-col"
            >
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-400">
                    Member
                  </label>
                  <select
                    name="memberId"
                    value={editForm.memberId}
                    onChange={handleEditFormChange}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                    required
                  >
                    <option value="">Select member</option>
                    {members.map((m) => (
                      <option key={m._id} value={m._id}>
                        {m.full_name} ({m.phone})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-400">
                    Status
                  </label>
                  <select
                    name="status"
                    value={editForm.status}
                    onChange={handleEditFormChange}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                    required
                  >
                    <option value="paid">Paid</option>
                    <option value="unpaid">Unpaid</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-400">
                    Months to Pay For
                  </label>
                  <select
                    name="monthsPaidFor"
                    value={editForm.monthsPaidFor}
                    onChange={handleEditFormChange}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                    required
                  >
                    {monthOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-400">
                    Start Month/Year
                  </label>
                  <DatePicker
                    id="edit-start-month-picker"
                    placeholder="Select start month"
                    defaultDate={
                      new Date(editForm.startYear, editForm.startMonth - 1, 1)
                    }
                    onChange={([date]) => {
                      if (date) {
                        setEditForm((f) =>
                          f
                            ? {
                                ...f,
                                startMonth: date.getMonth() + 1,
                                startYear: date.getFullYear(),
                              }
                            : f
                        );
                      }
                    }}
                  />
                  {editForm.monthsPaidFor > 1 && (
                    <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      Paying for:{" "}
                      {editForm.monthsCovered
                        .map((mc) =>
                          moment({
                            year: mc.year,
                            month: mc.month - 1,
                          }).format("MMMM YYYY")
                        )
                        .join(", ")}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-400">
                    Amount
                  </label>
                  <input
                    name="amountPaid"
                    type="number"
                    value={editForm.amountPaid}
                    readOnly
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-800 bg-gray-100 dark:bg-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3 px-2 mt-6 sm:justify-end">
                <button
                  onClick={() => {
                    setEditPayment(null);
                    setEditForm(null);
                  }}
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
                {/* No delete button. Status can be set to unpaid, which will reset the payment. */}
              </div>
            </form>
          )}
        </div>
      </Modal>

      <div className="flex justify-between items-center mt-4 dark:text-gray-400">
        <span>
          Showing {(currentPage - 1) * pageSize + 1} -{" "}
          {Math.min(currentPage * pageSize, filteredPayments.length)} of{" "}
          {filteredPayments.length} entries
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
