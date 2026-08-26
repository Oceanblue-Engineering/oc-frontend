import React, { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  CheckCircle,
  CheckCircle2,
  Clock,
  DollarSign,
  FileText,
  Loader2,
  Plus,
  Save,
  User,
  Users,
  Edit,
  Trash2,
  X,
  Sparkles,
  Search,
  Briefcase,
  Phone,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  fetchAttendance,
  saveBulkAttendance,
  saveSingleAttendance,
  deleteAttendance,
  fetchAttendanceSummary,
  AttendanceRecord,
  AttendanceSummaryItem,
  BulkAttendanceRecordInput,
} from "../services/Attendance/attendance.service";
import {
  fetchWorkers,
  Worker as WorkerType,
} from "../services/Worker/worker.service";
import { fetchProjectById, Project } from "../services/Project/project.service";
import { useLanguage } from "../context/LanguageContext";
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Input,
  Select,
  Badge,
  TableContainer,
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableEmpty,
} from "../components/ui";
import { ConfirmModal } from "../components/Common/ConfirmModal";

export const ProjectAttendance: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [date, setDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [project, setProject] = useState<Project | null>(null);
  const [allWorkers, setAllWorkers] = useState<WorkerType[]>([]);
  const [attendanceList, setAttendanceList] = useState<AttendanceRecord[]>([]);
  const [summary, setSummary] = useState<AttendanceSummaryItem[]>([]);
  const [activeTab, setActiveTab] = useState<"entry" | "summary">("entry");

  const [loading, setLoading] = useState(true);
  const [loadingAttendance, setLoadingAttendance] = useState(false);

  // Modal State for Add/Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [workerSearchQuery, setWorkerSearchQuery] = useState("");
  const [modalForm, setModalForm] = useState<{
    date: string;
    userId: string;
    status: "present" | "half_day" | "absent" | "overtime_only";
    shift: "day" | "night" | "full_day";
    overtimeWage: number;
    notes: string;
  }>({
    date: new Date().toISOString().split("T")[0],
    userId: "",
    status: "present",
    shift: "day",
    overtimeWage: 0,
    notes: "",
  });
  const [savingRecord, setSavingRecord] = useState(false);

  // Delete State
  const [recordToDelete, setRecordToDelete] = useState<AttendanceRecord | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);

  // 1. Initial Load: Project and all registered workers
  const loadInitialData = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const [projectRes, workersRes] = await Promise.all([
        fetchProjectById(projectId),
        fetchWorkers(),
      ]);

      if (projectRes.success && projectRes.data) {
        setProject(projectRes.data.client);
      }

      if (workersRes.success && workersRes.data) {
        const raw = workersRes.data as any;
        const list: WorkerType[] = Array.isArray(raw)
          ? raw
          : Array.isArray(raw.workers)
          ? raw.workers
          : [];
        setAllWorkers(list);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load project or workers.");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  // 2. Load Attendance Records for chosen Date
  const loadAttendanceForDate = useCallback(async () => {
    if (!projectId || !date) return;
    setLoadingAttendance(true);
    try {
      const res = await fetchAttendance(projectId, date);
      if (res.success) {
        setAttendanceList(res.data || []);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load attendance records.");
    } finally {
      setLoadingAttendance(false);
    }
  }, [projectId, date]);

  // 3. Load Cumulative Summary
  const loadSummary = useCallback(async () => {
    if (!projectId) return;
    try {
      const res = await fetchAttendanceSummary(projectId);
      if (res.success) {
        setSummary(res.data || []);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load attendance summary.");
    }
  }, [projectId]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  useEffect(() => {
    loadAttendanceForDate();
  }, [loadAttendanceForDate]);

  useEffect(() => {
    if (activeTab === "summary") {
      loadSummary();
    }
  }, [activeTab, loadSummary]);

  // Lock body scroll when modal is active to prevent background scroll
  useEffect(() => {
    if (isModalOpen || !!recordToDelete) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isModalOpen, recordToDelete]);

  // Helper for wage calculation
  const calculateWage = (
    dailyRate: number,
    status: "present" | "half_day" | "absent" | "overtime_only",
    overtimeWage: number
  ) => {
    let multiplier = 0;
    if (status === "present") multiplier = 1.0;
    else if (status === "half_day") multiplier = 0.5;

    return Math.round(dailyRate * multiplier + (Number(overtimeWage) || 0));
  };

  const safeWorkers = Array.isArray(allWorkers) ? allWorkers : [];

  // Open Create Modal
  const handleOpenCreateModal = () => {
    // Default to first available worker if not already recorded today
    const unrecordedWorkers = safeWorkers.filter(
      (w) => !attendanceList.some((rec) => rec.userId?._id === w._id)
    );
    const defaultUserId =
      unrecordedWorkers.length > 0
        ? unrecordedWorkers[0]._id
        : safeWorkers[0]?._id || "";

    setModalForm({
      date,
      userId: defaultUserId,
      status: "present",
      shift: "day",
      overtimeWage: 0,
      notes: "",
    });
    setWorkerSearchQuery("");
    setEditingRecordId(null);
    setModalMode("create");
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (rec: AttendanceRecord) => {
    setModalForm({
      date: rec.date ? new Date(rec.date).toISOString().split("T")[0] : date,
      userId: rec.userId?._id || "",
      status: rec.status,
      shift: rec.shift,
      overtimeWage: rec.overtimeWage || 0,
      notes: rec.notes || "",
    });
    setWorkerSearchQuery("");
    setEditingRecordId(rec._id || null);
    setModalMode("edit");
    setIsModalOpen(true);
  };

  // Save Modal Form
  const handleSaveModalForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !modalForm.userId) {
      toast.error("Please select a worker.");
      return;
    }

    setSavingRecord(true);
    try {
      const recordInput: BulkAttendanceRecordInput = {
        userId: modalForm.userId,
        status: modalForm.status,
        shift: modalForm.shift,
        overtimeWage: Number(modalForm.overtimeWage) || 0,
        notes: modalForm.notes || "",
      };

      const res = await saveSingleAttendance(
        projectId,
        modalForm.date,
        recordInput
      );

      if (res.success) {
        toast.success(
          modalMode === "create"
            ? "Worker attendance added successfully!"
            : "Attendance updated successfully!"
        );
        setIsModalOpen(false);
        if (modalForm.date === date) {
          loadAttendanceForDate();
        } else {
          setDate(modalForm.date);
        }
      } else {
        toast.error(res.message || "Failed to save attendance.");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Error saving attendance.");
    } finally {
      setSavingRecord(false);
    }
  };

  // Delete Record Handler
  const handleDeleteRecord = async () => {
    if (!projectId || !recordToDelete?._id) return;
    setIsDeleting(true);
    try {
      const res = await deleteAttendance(projectId, recordToDelete._id);
      if (res.success) {
        toast.success("Attendance record deleted successfully.");
        setRecordToDelete(null);
        loadAttendanceForDate();
      } else {
        toast.error(res.message || "Failed to delete attendance record.");
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Error deleting record.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Quick Action: Mark All Assigned Workers as Present
  const handleMarkAllAssignedPresent = async () => {
    if (!projectId || !date) return;
    const candidateWorkers =
      project?.workers && project.workers.length > 0
        ? (project.workers as any[])
        : safeWorkers;

    if (candidateWorkers.length === 0) {
      toast.error("No workers available to record.");
      return;
    }

    const recordsInput: BulkAttendanceRecordInput[] = candidateWorkers.map(
      (w) => ({
        userId: w._id,
        status: "present",
        shift: "day",
        overtimeWage: 0,
        notes: "",
      })
    );

    try {
      const res = await saveBulkAttendance(projectId, date, recordsInput);
      if (res.success) {
        toast.success(
          `Marked all ${candidateWorkers.length} workers as Present.`
        );
        loadAttendanceForDate();
      } else {
        toast.error(res.message || "Failed to bulk update.");
      }
    } catch (err: any) {
      toast.error("Failed to mark all present.");
    }
  };

  const selectedWorkerInfo = safeWorkers.find(
    (w) => w._id === modalForm.userId
  );
  const calculatedPreviewWage = selectedWorkerInfo
    ? calculateWage(
        selectedWorkerInfo.dailyRate || 0,
        modalForm.status,
        modalForm.overtimeWage
      )
    : 0;

  const totalDailyCost = attendanceList.reduce(
    (sum, item) => sum + (item.dailyWageEarned || 0),
    0
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "present":
        return <Badge variant="success">Present</Badge>;
      case "half_day":
        return <Badge variant="warning">Half Day</Badge>;
      case "ot_only":
      case "overtime_only":
        return <Badge variant="purple">OT Only</Badge>;
      case "absent":
        return <Badge variant="destructive">Absent</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  // Filter workers by search query
  const filteredWorkers = safeWorkers.filter((w) => {
    if (!workerSearchQuery.trim()) return true;
    const q = workerSearchQuery.toLowerCase();
    return (
      (w.name || "").toLowerCase().includes(q) ||
      (w.position || "").toLowerCase().includes(q) ||
      (w.phone || "").toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ocean-50/10">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-ocean-600 mx-auto mb-4" />
          <p className="text-slate-500 font-semibold text-sm">
            Loading Attendance System...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/40 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/client-projects")}
            className="p-2.5 bg-white rounded-2xl border border-slate-200 hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Attendance Management
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Project:{" "}
              <span className="font-bold text-ocean-700">
                {project?.siteName || project?.name || "Novotal"}
              </span>
            </p>
          </div>
        </div>

        {/* Quick KPI Stats */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="w-9 h-9 rounded-xl bg-ocean-50 text-ocean-600 flex items-center justify-center border border-ocean-100">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                Recorded Today
              </span>
              <span className="text-sm font-black text-slate-900">
                {attendanceList.length} Workers
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <DollarSign className="w-4 h-4" />
            </div>
            <div>
              <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                Daily Labor Cost
              </span>
              <span className="text-sm font-black text-emerald-600">
                {totalDailyCost.toLocaleString()} Ks
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab("entry")}
          className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === "entry"
              ? "bg-white text-ocean-700 shadow-xs border border-slate-200/80"
              : "text-slate-500 hover:text-slate-900"
          }`}
        >
          <Clock className="w-4 h-4" />
          Daily Attendance Entry
        </button>
        <button
          onClick={() => setActiveTab("summary")}
          className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === "summary"
              ? "bg-white text-ocean-700 shadow-xs border border-slate-200/80"
              : "text-slate-500 hover:text-slate-900"
          }`}
        >
          <FileText className="w-4 h-4" />
          Payroll & Summary Report
        </button>
      </div>

      {/* TAB 1: DAILY ATTENDANCE ENTRY */}
      {activeTab === "entry" && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Toolbar */}
          <Card>
            <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-2 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200 w-fit">
                <CalendarIcon className="w-4 h-4 text-slate-500" />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="bg-transparent text-xs sm:text-sm font-bold text-slate-800 outline-none cursor-pointer"
                />
              </div>

              <div className="flex items-center flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="default"
                  onClick={handleMarkAllAssignedPresent}
                  leftIcon={<CheckCircle className="w-4 h-4 text-ocean-600" />}
                >
                  Mark All Present
                </Button>

                <Button
                  variant="default"
                  size="default"
                  onClick={handleOpenCreateModal}
                  leftIcon={<Plus className="w-4 h-4" />}
                >
                  + Add Worker Attendance
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recorded Attendance Table */}
          <TableContainer>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12 text-center">No</TableHead>
                  <TableHead>Worker Name</TableHead>
                  <TableHead className="text-center">Daily Rate</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-center">Shift</TableHead>
                  <TableHead className="text-center">OT Amount (Ks)</TableHead>
                  <TableHead className="text-right">Wage Earned</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="text-center w-28">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingAttendance ? (
                  <TableRow>
                    <TableCell colSpan={9} className="py-12 text-center">
                      <Loader2 className="w-6 h-6 animate-spin text-ocean-600 mx-auto mb-2" />
                      <span className="text-slate-500 font-semibold text-xs">
                        Loading Attendance Records...
                      </span>
                    </TableCell>
                  </TableRow>
                ) : attendanceList.length === 0 ? (
                  <TableEmpty
                    colSpan={9}
                    title="No workers recorded for this date"
                    description={`Click [+ Add Worker Attendance] to record attendance for ${date}`}
                    actionLabel="+ Add Worker Attendance"
                    onAction={handleOpenCreateModal}
                  />
                ) : (
                  attendanceList.map((rec, idx) => (
                    <TableRow key={rec._id || idx}>
                      <TableCell className="text-center font-bold text-slate-500">
                        {idx + 1}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-ocean-50 text-ocean-600 flex items-center justify-center font-bold text-xs border border-ocean-100 shrink-0">
                            <User className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block text-xs sm:text-sm">
                              {rec.userId?.name || "Worker"}
                            </span>
                            <span className="text-[10px] text-slate-400 font-semibold block uppercase">
                              {rec.userId?.position || rec.userId?.role || "Staff"}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center text-xs font-semibold text-slate-700">
                        {(rec.userId?.dailyRate || 0).toLocaleString()} Ks
                      </TableCell>
                      <TableCell className="text-center">
                        {getStatusBadge(rec.status)}
                      </TableCell>
                      <TableCell className="text-center text-xs font-semibold text-slate-700 capitalize">
                        {rec.shift === "full_day"
                          ? "Full Day"
                          : rec.shift === "night"
                          ? "Night Shift"
                          : "Day Shift"}
                      </TableCell>
                      <TableCell className="text-center text-xs font-semibold text-slate-700">
                        {(rec.overtimeWage || 0).toLocaleString()} Ks
                      </TableCell>
                      <TableCell className="text-right text-xs sm:text-sm font-black text-slate-900">
                        {(rec.dailyWageEarned || 0).toLocaleString()} Ks
                      </TableCell>
                      <TableCell className="text-xs text-slate-500 max-w-[140px] truncate">
                        {rec.notes || "-"}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="outline"
                            size="icon-sm"
                            onClick={() => handleOpenEditModal(rec)}
                            title="Edit Record"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="icon-sm"
                            onClick={() => setRecordToDelete(rec)}
                            title="Delete Record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </div>
      )}

      {/* TAB 2: PAYROLL & SUMMARY REPORT */}
      {activeTab === "summary" && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <Card>
            <CardHeader className="border-b border-slate-100 pb-3">
              <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                <FileText className="w-4 h-4 text-ocean-600" /> Cumulative
                Payroll & Attendance Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <TableContainer>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12 text-center">No</TableHead>
                      <TableHead>Worker Name</TableHead>
                      <TableHead className="text-center">Daily Rate</TableHead>
                      <TableHead className="text-center">Days Present</TableHead>
                      <TableHead className="text-center">Half Days</TableHead>
                      <TableHead className="text-center">Days Absent</TableHead>
                      <TableHead className="text-center">Total OT (Ks)</TableHead>
                      <TableHead className="text-right">Total Earnings</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {summary.length === 0 ? (
                      <TableEmpty
                        colSpan={8}
                        title="No attendance history found"
                        description="Start recording daily attendance to view the project payroll summary."
                      />
                    ) : (
                      summary.map((item, idx) => (
                        <TableRow key={item._id || idx}>
                          <TableCell className="text-center font-bold text-slate-500">
                            {idx + 1}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-xl bg-ocean-50 text-ocean-600 flex items-center justify-center font-bold text-xs shrink-0">
                                <User className="w-4 h-4" />
                              </div>
                              <div>
                                <span className="font-bold text-slate-900 block text-xs sm:text-sm">
                                  {item.workerName}
                                </span>
                                <span className="text-[10px] text-slate-400 font-semibold block uppercase">
                                  {item.position || item.role || "Staff"}
                                </span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center text-xs font-semibold text-slate-700">
                            {(item.dailyRate || 0).toLocaleString()} Ks
                          </TableCell>
                          <TableCell className="text-center text-xs font-bold text-slate-800">
                            {item.totalDaysPresent}
                          </TableCell>
                          <TableCell className="text-center text-xs font-semibold text-amber-600">
                            {item.totalHalfDays}
                          </TableCell>
                          <TableCell className="text-center text-xs font-semibold text-slate-400">
                            {item.totalDaysAbsent}
                          </TableCell>
                          <TableCell className="text-center text-xs font-semibold text-slate-700">
                            {(item.totalOvertimeWage || 0).toLocaleString()} Ks
                          </TableCell>
                          <TableCell className="text-right text-xs sm:text-sm font-black text-emerald-600">
                            {(item.totalWageEarned || 0).toLocaleString()} Ks
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ADD / EDIT ATTENDANCE MODAL WITH SEARCHABLE WORKER SELECTOR */}
      {isModalOpen &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-ocean-50 text-ocean-600 flex items-center justify-center border border-ocean-100 shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                      {modalMode === "create"
                        ? "Record Worker Attendance"
                        : "Edit Worker Attendance"}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Project:{" "}
                      <span className="font-bold text-ocean-700">
                        {project?.siteName || "Novotal"}
                      </span>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="w-9 h-9 rounded-2xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body / Form */}
              <form
                onSubmit={handleSaveModalForm}
                className="p-6 space-y-5 overflow-y-auto flex-1"
              >
                {/* Date Row */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <CalendarIcon className="w-3.5 h-3.5 text-ocean-600" />
                    Attendance Date <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="date"
                    value={modalForm.date}
                    onChange={(e) =>
                      setModalForm({ ...modalForm, date: e.target.value })
                    }
                    required
                    className="h-11 font-semibold text-sm bg-slate-50/50"
                  />
                </div>

                {/* SEARCHABLE WORKER SELECTOR SECTION */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-ocean-600" />
                      Select Worker <span className="text-red-500">*</span>
                    </label>
                    <span className="text-[11px] font-semibold text-slate-400">
                      {filteredWorkers.length} Workers Available
                    </span>
                  </div>

                  {modalMode === "edit" ? (
                    // Edit Mode: Fixed selected worker card
                    <div className="p-3.5 bg-ocean-50/60 border border-ocean-200 rounded-2xl flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-ocean-600 text-white font-black text-sm flex items-center justify-center shrink-0">
                          {selectedWorkerInfo?.name?.substring(0, 2).toUpperCase() || "WK"}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 text-sm block">
                            {selectedWorkerInfo?.name}
                          </span>
                          <span className="text-xs text-slate-500 font-medium block">
                            {selectedWorkerInfo?.position || "Staff"} •{" "}
                            {(selectedWorkerInfo?.dailyRate || 0).toLocaleString()} Ks/day
                          </span>
                        </div>
                      </div>
                      <Badge variant="secondary">Selected</Badge>
                    </div>
                  ) : (
                    // Create Mode: Search & Selectable List
                    <div className="space-y-2">
                      {/* Search Input */}
                      <div className="relative">
                        <Input
                          placeholder="Search worker by name, position, or phone..."
                          value={workerSearchQuery}
                          onChange={(e) => setWorkerSearchQuery(e.target.value)}
                          leftIcon={<Search className="w-4 h-4 text-slate-400" />}
                          className="h-11 text-xs sm:text-sm bg-slate-50/50"
                        />
                        {workerSearchQuery && (
                          <button
                            type="button"
                            onClick={() => setWorkerSearchQuery("")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                          >
                            Clear
                          </button>
                        )}
                      </div>

                      {/* Scrollable Worker Cards List */}
                      <div className="max-h-48 overflow-y-auto pr-1 space-y-1.5 border border-slate-200 rounded-2xl p-2 bg-slate-50/30">
                        {filteredWorkers.length === 0 ? (
                          <div className="py-6 text-center text-xs text-slate-400 font-medium">
                            No workers match "{workerSearchQuery}"
                          </div>
                        ) : (
                          filteredWorkers.map((w) => {
                            const isSelected = modalForm.userId === w._id;
                            const isAlreadyRecorded = attendanceList.some(
                              (rec) => rec.userId?._id === w._id
                            );

                            return (
                              <div
                                key={w._id}
                                onClick={() =>
                                  setModalForm({ ...modalForm, userId: w._id })
                                }
                                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                                  isSelected
                                    ? "bg-ocean-50/90 border-ocean-500 shadow-xs ring-1 ring-ocean-500"
                                    : "bg-white border-slate-200/80 hover:border-ocean-300 hover:bg-slate-50/70"
                                }`}
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <div
                                    className={`w-9 h-9 rounded-xl font-bold text-xs flex items-center justify-center shrink-0 ${
                                      isSelected
                                        ? "bg-ocean-600 text-white"
                                        : "bg-slate-100 text-slate-600"
                                    }`}
                                  >
                                    {w.name ? w.name.substring(0, 2).toUpperCase() : "W"}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-bold text-slate-900 text-xs sm:text-sm truncate">
                                        {w.name}
                                      </span>
                                      {isAlreadyRecorded && (
                                        <span className="text-[9px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded-md">
                                          Recorded
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2 text-[11px] text-slate-500">
                                      <span>{w.position || "Staff"}</span>
                                      {w.phone && (
                                        <>
                                          <span>•</span>
                                          <span>{w.phone}</span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  <span className="font-black text-xs text-ocean-700 bg-ocean-50 px-2 py-1 rounded-lg border border-ocean-100">
                                    {(w.dailyRate || 0).toLocaleString()} Ks
                                  </span>
                                  {isSelected && (
                                    <CheckCircle2 className="w-5 h-5 text-ocean-600 shrink-0" />
                                  )}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Status & Shift */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">
                      Attendance Status <span className="text-red-500">*</span>
                    </label>
                    <Select
                      value={modalForm.status}
                      onChange={(e) =>
                        setModalForm({
                          ...modalForm,
                          status: e.target.value as any,
                        })
                      }
                      className="h-11 text-xs sm:text-sm font-semibold"
                    >
                      <option value="present">Present (100% Base Wage)</option>
                      <option value="half_day">Half Day (50% Base Wage)</option>
                      <option value="overtime_only">OT Only (OT Wage only)</option>
                      <option value="absent">Absent (0 Wage)</option>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">
                      Working Shift
                    </label>
                    <Select
                      value={modalForm.shift}
                      onChange={(e) =>
                        setModalForm({
                          ...modalForm,
                          shift: e.target.value as any,
                        })
                      }
                      className="h-11 text-xs sm:text-sm font-semibold"
                    >
                      <option value="day">Day Shift</option>
                      <option value="night">Night Shift</option>
                      <option value="full_day">Full Day Shift</option>
                    </Select>
                  </div>
                </div>

                {/* OT Amount */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span>Overtime (OT) Amount (Ks)</span>
                    <span className="text-[11px] text-slate-400 font-normal">
                      Optional
                    </span>
                  </label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="0 Ks"
                    value={modalForm.overtimeWage || ""}
                    onChange={(e) =>
                      setModalForm({
                        ...modalForm,
                        overtimeWage: Number(e.target.value) || 0,
                      })
                    }
                    className="h-11 text-sm font-semibold"
                  />
                </div>

                {/* Live Calculation Preview Banner */}
                {selectedWorkerInfo && (
                  <div className="p-4 bg-gradient-to-r from-ocean-50 to-blue-50/50 border border-ocean-200/80 rounded-2xl flex items-center justify-between text-xs">
                    <div className="space-y-0.5">
                      <span className="text-slate-600 font-medium block">
                        Base Rate:{" "}
                        <span className="font-bold text-slate-800">
                          {(selectedWorkerInfo.dailyRate || 0).toLocaleString()}{" "}
                          Ks
                        </span>{" "}
                        (
                        {modalForm.status === "present"
                          ? "100%"
                          : modalForm.status === "half_day"
                          ? "50%"
                          : "0%"}
                        )
                      </span>
                      {modalForm.overtimeWage > 0 && (
                        <span className="text-slate-500 font-medium block">
                          + OT:{" "}
                          <span className="font-bold text-ocean-700">
                            {Number(modalForm.overtimeWage).toLocaleString()} Ks
                          </span>
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">
                        Total Wage Earned
                      </span>
                      <span className="text-lg font-black text-ocean-900">
                        {calculatedPreviewWage.toLocaleString()} Ks
                      </span>
                    </div>
                  </div>
                )}

                {/* Notes */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Notes / Work Details (Optional)
                  </label>
                  <Input
                    placeholder="e.g. Swimming pool tiles installation, pump repair..."
                    value={modalForm.notes}
                    onChange={(e) =>
                      setModalForm({ ...modalForm, notes: e.target.value })
                    }
                    className="h-11 text-xs sm:text-sm"
                  />
                </div>

                {/* Modal Footer Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="default"
                    onClick={() => setIsModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="default"
                    size="default"
                    isLoading={savingRecord}
                    leftIcon={<Save className="w-4 h-4" />}
                  >
                    Save Attendance
                  </Button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!recordToDelete}
        onClose={() => setRecordToDelete(null)}
        onConfirm={handleDeleteRecord}
        title="Delete Attendance Record"
        message={`Are you sure you want to remove attendance for "${recordToDelete?.userId?.name}" on ${date}?`}
        confirmText="Delete"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default ProjectAttendance;
