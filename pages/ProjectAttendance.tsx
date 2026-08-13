import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  CheckCircle,
  Clock,
  DollarSign,
  FileText,
  Loader2,
  Save,
  User,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import {
  fetchAttendance,
  saveBulkAttendance,
  fetchAttendanceSummary,
  AttendanceRecord,
  AttendanceSummaryItem,
  BulkAttendanceRecordInput,
} from "../services/Attendance/attendance.service";
import { fetchWorkers, Worker as WorkerType } from "../services/Worker/worker.service";
import { fetchProjectById, Project } from "../services/Project/project.service";
import { useLanguage } from "../context/LanguageContext";

export const ProjectAttendance: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [date, setDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [project, setProject] = useState<Project | null>(null);
  const [workers, setWorkers] = useState<WorkerType[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, {
    status: "present" | "half_day" | "absent" | "overtime_only";
    shift: "day" | "night" | "full_day";
    overtimeWage: number;
    notes: string;
    dailyWageEarned: number;
  }>>({});
  const [summary, setSummary] = useState<AttendanceSummaryItem[]>([]);
  const [activeTab, setActiveTab] = useState<"entry" | "summary">("entry");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadInitialData = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      // 1. Fetch project info
      const projectRes = await fetchProjectById(projectId);
      if (projectRes.success && projectRes.data) {
        const proj = projectRes.data.client;
        setProject(proj);
        setWorkers((proj.workers || []) as any[]);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load initial project or worker data.");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const loadAttendanceForDate = useCallback(async () => {
    if (!projectId || !date || workers.length === 0) return;
    try {
      const res = await fetchAttendance(projectId, date);
      if (res.success) {
        const recordMap: typeof attendanceRecords = {};
        
        // Initialize with default or loaded records
        workers.forEach((w) => {
          const found = res.data.find((rec) => rec.userId._id === w._id);
          if (found) {
            recordMap[w._id] = {
              status: found.status,
              shift: found.shift,
              overtimeWage: found.overtimeWage,
              notes: found.notes || "",
              dailyWageEarned: found.dailyWageEarned,
            };
          } else {
            recordMap[w._id] = {
              status: "absent",
              shift: "day",
              overtimeWage: 0,
              notes: "",
              dailyWageEarned: 0,
            };
          }
        });
        setAttendanceRecords(recordMap);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load attendance records.");
    }
  }, [projectId, date, workers]);

  const loadSummary = useCallback(async () => {
    if (!projectId) return;
    try {
      const res = await fetchAttendanceSummary(projectId);
      if (res.success) {
        setSummary(res.data);
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
    if (workers.length > 0) {
      loadAttendanceForDate();
    }
  }, [workers, loadAttendanceForDate]);

  useEffect(() => {
    if (activeTab === "summary") {
      loadSummary();
    }
  }, [activeTab, loadSummary]);

  // Helper calculation for wage
  const calculateWage = (
    dailyRate: number,
    status: "present" | "half_day" | "absent" | "overtime_only",
    overtimeWage: number
  ) => {
    let multiplier = 0;
    if (status === "present") multiplier = 1.0;
    else if (status === "half_day") multiplier = 0.5;

    return Math.round(dailyRate * multiplier + overtimeWage);
  };

  const handleRecordChange = (
    workerId: string,
    field: "status" | "shift" | "overtimeWage" | "notes",
    value: any,
    dailyRate: number
  ) => {
    setAttendanceRecords((prev) => {
      const current = prev[workerId] || {
        status: "absent",
        shift: "day",
        overtimeWage: 0,
        notes: "",
        dailyWageEarned: 0,
      };

      const updated = {
        ...current,
        [field]: value,
      };

      // Re-calculate wage
      updated.dailyWageEarned = calculateWage(
        dailyRate,
        updated.status,
        updated.overtimeWage
      );

      return {
        ...prev,
        [workerId]: updated,
      };
    });
  };

  const handleMarkAllPresent = () => {
    const recordMap = { ...attendanceRecords };
    workers.forEach((w) => {
      const current = recordMap[w._id] || {
        status: "absent",
        shift: "day",
        overtimeWage: 0,
        notes: "",
        dailyWageEarned: 0,
      };
      recordMap[w._id] = {
        ...current,
        status: "present",
        dailyWageEarned: calculateWage(w.dailyRate || 0, "present", current.overtimeWage),
      };
    });
    setAttendanceRecords(recordMap);
    toast.success("All workers marked as Present");
  };

  const handleSaveAttendance = async () => {
    if (!projectId || !date) return;
    setSaving(true);
    try {
      const recordsInput: BulkAttendanceRecordInput[] = workers.map((w) => {
        const record = attendanceRecords[w._id] || {
          status: "absent",
          shift: "day",
          overtimeWage: 0,
          notes: "",
        };
        return {
          userId: w._id,
          status: record.status,
          shift: record.shift,
          overtimeWage: record.overtimeWage,
          notes: record.notes,
        };
      });

      const res = await saveBulkAttendance(projectId, date, recordsInput);
      if (res.success) {
        toast.success("Attendance sheet saved successfully.");
        loadAttendanceForDate();
      } else {
        toast.error(res.message);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to save attendance records.");
    } finally {
      setSaving(false);
    }
  };

  const totalLaborCost = Object.values(attendanceRecords).reduce(
    (sum, item) => sum + (item.dailyWageEarned || 0),
    0
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ocean-50/10">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-ocean-600 mx-auto mb-4" />
          <p className="text-slate-500 font-medium">Loading Attendance System...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ocean-50/20 px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Back and Title */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/client-projects")}
              className="p-2 bg-white rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-ocean-900">
                Attendance Management
              </h1>
              <p className="text-sm text-slate-500 font-medium">
                Project: <span className="font-semibold text-ocean-700">{project?.siteName || "N/A"}</span>
              </p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-2 px-3 border-r border-slate-100">
              <Users className="w-5 h-5 text-ocean-600" />
              <div>
                <span className="block text-[10px] text-slate-400 uppercase font-bold">Total Workers</span>
                <span className="text-sm font-bold text-slate-800">{workers.length}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3">
              <DollarSign className="w-5 h-5 text-emerald-600" />
              <div>
                <span className="block text-[10px] text-slate-400 uppercase font-bold">Daily Labor Cost</span>
                <span className="text-sm font-bold text-emerald-600">
                  {totalLaborCost.toLocaleString()} Ks
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setActiveTab("entry")}
            className={`py-3 px-6 font-semibold text-sm flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === "entry"
                ? "border-ocean-600 text-ocean-600"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            <Clock className="w-4 h-4" />
            Daily Attendance Entry
          </button>
          <button
            onClick={() => setActiveTab("summary")}
            className={`py-3 px-6 font-semibold text-sm flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === "summary"
                ? "border-ocean-600 text-ocean-600"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            <FileText className="w-4 h-4" />
            Payroll & Summary Report
          </button>
        </div>

        {activeTab === "entry" ? (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
            {/* Toolbar */}
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm w-fit">
                <CalendarIcon className="w-4 h-4 text-slate-400" />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="bg-transparent text-sm font-semibold text-slate-700 outline-none cursor-pointer"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleMarkAllPresent}
                  className="px-4 py-2 text-sm font-semibold rounded-xl border border-ocean-200 text-ocean-700 bg-white hover:bg-ocean-50/50 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <CheckCircle className="w-4 h-4" />
                  Mark All Present
                </button>

                <button
                  onClick={handleSaveAttendance}
                  disabled={saving}
                  className="px-4 py-2 text-sm font-semibold rounded-xl bg-ocean-600 hover:bg-ocean-700 text-white transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" /> Save Attendance
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Attendance Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    <th className="py-4 px-6">Worker Name</th>
                    <th className="py-4 px-6 text-center">Daily Rate</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6">Shift</th>
                    <th className="py-4 px-6 text-center">OT Amount (Ks)</th>
                    <th className="py-4 px-6 text-right">Wage Earned</th>
                    <th className="py-4 px-6">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {workers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-slate-400 text-sm">
                        No registered workers found. Create worker accounts in Settings.
                      </td>
                    </tr>
                  ) : (
                    workers.map((w) => {
                      const record = attendanceRecords[w._id] || {
                        status: "absent",
                        shift: "day",
                        overtimeHours: 0,
                        notes: "",
                        dailyWageEarned: 0,
                      };

                      return (
                        <tr key={w._id} className="hover:bg-slate-50/30 transition-colors">
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                                <User className="w-4 h-4" />
                              </div>
                              <div>
                                <span className="block font-semibold text-slate-800 text-sm">{w.name}</span>
                                <span className="block text-[10px] text-slate-400 font-bold uppercase">
                                  {w.position || "Staff"}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-center text-sm font-semibold text-slate-700">
                            {(w.dailyRate || 0).toLocaleString()} Ks
                          </td>
                          <td className="py-4 px-6">
                            <select
                              value={record.status}
                              onChange={(e) =>
                                handleRecordChange(
                                  w._id,
                                  "status",
                                  e.target.value,
                                  w.dailyRate || 0
                                )
                              }
                              className="border border-slate-200 rounded-lg p-1.5 text-xs font-semibold text-slate-700 outline-none focus:ring-1 focus:ring-ocean-500 bg-white"
                            >
                              <option value="present">Present</option>
                              <option value="half_day">Half Day</option>
                              <option value="overtime_only">OT Only</option>
                              <option value="absent">Absent</option>
                            </select>
                          </td>
                          <td className="py-4 px-6">
                            <select
                              value={record.shift}
                              onChange={(e) =>
                                handleRecordChange(
                                  w._id,
                                  "shift",
                                  e.target.value,
                                  w.dailyRate || 0
                                )
                              }
                              className="border border-slate-200 rounded-lg p-1.5 text-xs font-semibold text-slate-700 outline-none focus:ring-1 focus:ring-ocean-500 bg-white"
                            >
                              <option value="day">Day Shift</option>
                              <option value="night">Night Shift</option>
                              <option value="full_day">Full Day</option>
                            </select>
                          </td>
                          <td className="py-4 px-6 text-center">
                            <input
                              type="number"
                              min="0"
                              value={record.overtimeWage || ""}
                              placeholder="0"
                              onChange={(e) =>
                                handleRecordChange(
                                  w._id,
                                  "overtimeWage",
                                  parseInt(e.target.value) || 0,
                                  w.dailyRate || 0
                                )
                              }
                              className="w-24 border border-slate-200 rounded-lg p-1.5 text-center text-xs font-semibold text-slate-700 outline-none focus:ring-1 focus:ring-ocean-500"
                            />
                          </td>
                          <td className="py-4 px-6 text-right text-sm font-bold text-slate-800">
                            {(record.dailyWageEarned || 0).toLocaleString()} Ks
                          </td>
                          <td className="py-4 px-6">
                            <input
                              type="text"
                              value={record.notes}
                              placeholder="Notes..."
                              onChange={(e) =>
                                handleRecordChange(
                                  w._id,
                                  "notes",
                                  e.target.value,
                                  w.dailyRate || 0
                                )
                              }
                              className="w-full border border-slate-200 rounded-lg p-1.5 text-xs text-slate-700 outline-none focus:ring-1 focus:ring-ocean-500"
                            />
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800">Cumulative Payroll & Attendance Summary</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    <th className="py-4 px-6">Worker Name</th>
                    <th className="py-4 px-6 text-center">Daily Rate</th>
                    <th className="py-4 px-6 text-center">Days Present</th>
                    <th className="py-4 px-6 text-center">Half Days</th>
                    <th className="py-4 px-6 text-center">Days Absent</th>
                    <th className="py-4 px-6 text-center">Total OT Earnings</th>
                    <th className="py-4 px-6 text-right">Total Earnings</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {summary.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-slate-400 text-sm">
                        No attendance history found for this project.
                      </td>
                    </tr>
                  ) : (
                    summary.map((item) => (
                      <tr key={item._id} className="hover:bg-slate-50/30 transition-colors">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                              <User className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="block font-semibold text-slate-800 text-sm">{item.workerName}</span>
                              <span className="block text-[10px] text-slate-400 font-bold uppercase">
                                {item.position || "Staff"}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-center text-sm font-semibold text-slate-700">
                          {(item.dailyRate || 0).toLocaleString()} Ks
                        </td>
                        <td className="py-4 px-6 text-center text-sm font-semibold text-slate-800">
                          {item.totalDaysPresent}
                        </td>
                        <td className="py-4 px-6 text-center text-sm font-semibold text-slate-600">
                          {item.totalHalfDays}
                        </td>
                        <td className="py-4 px-6 text-center text-sm font-semibold text-slate-400">
                          {item.totalDaysAbsent}
                        </td>
                        <td className="py-4 px-6 text-center text-sm font-semibold text-slate-600">
                          {(item.totalOvertimeWage || 0).toLocaleString()} Ks
                        </td>
                        <td className="py-4 px-6 text-right text-sm font-bold text-emerald-600">
                          {(item.totalWageEarned || 0).toLocaleString()} Ks
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
