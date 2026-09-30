import React, { useState, useMemo } from "react";
import {
  CheckCircle2,
  Plus,
  Edit2,
  Trash2,
  Search,
  Calendar,
  Filter,
  Layers,
} from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "../../context/LanguageContext";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Badge,
  Input,
  Select,
  TableContainer,
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableEmpty,
} from "../ui";
import {
  ProjectTask,
  deleteProjectTask,
} from "../../services/ProjectTask/projectTask.service";
import { ProjectTaskModal } from "./ProjectTaskModal";
import { ConfirmModal } from "../Common/ConfirmModal";

interface ProjectFinishedTasksTableProps {
  projectId: string;
  projectName?: string;
  tasks: ProjectTask[];
  isLoading?: boolean;
  onTasksChanged: () => void;
}

export const ProjectFinishedTasksTable: React.FC<
  ProjectFinishedTasksTableProps
> = ({
  projectId,
  projectName,
  tasks = [],
  isLoading = false,
  onTasksChanged,
}) => {
  const { language } = useLanguage();
  const isMy = language === "my";

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<ProjectTask | null>(null);

  // Delete state
  const [taskToDelete, setTaskToDelete] = useState<ProjectTask | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Extract unique categories from tasks
  const uniqueCategories = useMemo(() => {
    const set = new Set<string>();
    tasks.forEach((t) => {
      if (t.category && t.category.trim()) {
        set.add(t.category.trim());
      }
    });
    return Array.from(set).sort();
  }, [tasks]);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    const q = search.toLowerCase().trim();
    return tasks.filter((t) => {
      const matchCategory =
        categoryFilter === "all" ||
        t.category.toLowerCase() === categoryFilter.toLowerCase();

      const matchSearch =
        !q ||
        t.taskName.toLowerCase().includes(q) ||
        (t.remark && t.remark.toLowerCase().includes(q)) ||
        t.category.toLowerCase().includes(q);

      return matchCategory && matchSearch;
    });
  }, [tasks, search, categoryFilter]);

  const handleOpenAddModal = () => {
    setTaskToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (task: ProjectTask) => {
    setTaskToEdit(task);
    setIsModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!taskToDelete) return;

    setIsDeleting(true);
    try {
      const res = await deleteProjectTask(taskToDelete._id);
      if (res.success) {
        toast.success(
          isMy
            ? "လုပ်ငန်းမှတ်တမ်း ဖျက်ပစ်ပြီးပါပြီ"
            : "Task deleted successfully"
        );
        setTaskToDelete(null);
        onTasksChanged();
      } else {
        toast.error(res.message || "Failed to delete task");
      }
    } catch (err: any) {
      console.error("Error deleting task:", err);
      toast.error(err.message || "Failed to delete task");
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <Card className="border border-slate-200/80 shadow-sm overflow-hidden">
      {/* Header */}
      <CardHeader className="border-b border-slate-100 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center border border-emerald-200/60 shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-bold text-slate-900">
                  {isMy ? "ပြီးစီးသွားသော လုပ်ငန်းစဉ်များ" : "Finished Tasks"}
                </CardTitle>
                <span className="text-xs bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded-full">
                  {tasks.length}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                {isMy
                  ? "ပြီးစီးခဲ့သော လုပ်ငန်းခွင်အဆင့်များနှင့် မှတ်တမ်းများ"
                  : "List of completed tasks, stages, and work milestones"}
              </p>
            </div>
          </div>

          <Button
            variant="default"
            size="sm"
            onClick={handleOpenAddModal}
            leftIcon={<Plus className="w-4 h-4" />}
            className="shrink-0 bg-ocean-600 hover:bg-ocean-700"
          >
            {isMy ? "လုပ်ငန်းသစ် မှတ်တမ်းတင်မည်" : "Record Finished Task"}
          </Button>
        </div>

        {/* Filter & Search Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 mt-1 border-t border-slate-100">
          <div className="sm:col-span-2">
            <Input
              type="text"
              placeholder={
                isMy
                  ? "လုပ်ငန်းအမည် သို့မဟုတ် မှတ်ချက်ဖြင့် ရှာဖွေပါ..."
                  : "Search task name or remarks..."
              }
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search className="w-4 h-4 text-slate-400" />}
              className="w-full text-xs"
            />
          </div>

          <div>
            <Select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full text-xs"
            >
              <option value="all">
                {isMy ? "အမျိုးအစားအားလုံး" : "All Categories"} ({tasks.length})
              </option>
              {uniqueCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat} (
                  {tasks.filter((t) => t.category.toLowerCase() === cat.toLowerCase()).length}
                  )
                </option>
              ))}
            </Select>
          </div>
        </div>
      </CardHeader>

      {/* Table Content */}
      <CardContent className="p-0">
        <TableContainer>
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/70">
                <TableHead className="w-12 text-center text-xs font-bold">#</TableHead>
                <TableHead className="w-32 text-xs font-bold">
                  {isMy ? "ပြီးစီးသည့် နေ့စွဲ" : "Completion Date"}
                </TableHead>
                <TableHead className="text-xs font-bold">
                  {isMy ? "လုပ်ငန်းအမည်" : "Task Name"}
                </TableHead>
                <TableHead className="w-44 text-xs font-bold">
                  {isMy ? "အမျိုးအစား" : "Category"}
                </TableHead>
                <TableHead className="text-xs font-bold">
                  {isMy ? "မှတ်ချက် / အသေးစိတ်" : "Remark / Details"}
                </TableHead>
                <TableHead className="w-32 text-xs font-bold">
                  {isMy ? "ရေးသွင်းသူ" : "Recorded By"}
                </TableHead>
                <TableHead className="w-24 text-right text-xs font-bold">
                  {isMy ? "လုပ်ဆောင်ချက်" : "Actions"}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableEmpty
                  colSpan={7}
                  message={isMy ? "လုပ်ငန်းစဉ်များ ရယူနေပါသည်..." : "Loading finished tasks..."}
                />
              ) : filteredTasks.length === 0 ? (
                <TableEmpty
                  colSpan={7}
                  icon={<Layers className="w-8 h-8 text-slate-300" />}
                  title={
                    tasks.length === 0
                      ? isMy
                        ? "ပြီးစီးသွားသော လုပ်ငန်းစဉ် မှတ်တမ်း မရှိသေးပါ"
                        : "No Finished Tasks Recorded Yet"
                      : isMy
                      ? "ကိုက်ညီသော လုပ်ငန်းမှတ်တမ်း မတွေ့ပါ"
                      : "No matching tasks found"
                  }
                  description={
                    tasks.length === 0
                      ? isMy
                        ? "လုပ်ငန်းခွင်ပြီးစီးမှု မှတ်တမ်းများကို နေ့စွဲ၊ အမျိုးအစားများနှင့်အတူ စနစ်တကျ မှတ်တမ်းတင်နိုင်ပါသည်။"
                        : "Record tasks completed during this project with dates, custom categories, and remarks."
                      : undefined
                  }
                  action={
                    tasks.length === 0 ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleOpenAddModal}
                        leftIcon={<Plus className="w-3.5 h-3.5" />}
                      >
                        {isMy ? "ပထမဆုံး လုပ်ငန်းမှတ်တမ်း ထည့်မည်" : "Add First Finished Task"}
                      </Button>
                    ) : undefined
                  }
                />
              ) : (
                filteredTasks.map((task, idx) => (
                  <TableRow key={task._id} hoverable>
                    <TableCell className="text-center font-bold text-slate-400 text-xs">
                      {String(idx + 1).padStart(2, "0")}
                    </TableCell>

                    <TableCell className="text-xs font-medium text-slate-600 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{formatDate(task.date)}</span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <span className="font-bold text-slate-900 text-xs sm:text-sm block">
                        {task.taskName}
                      </span>
                    </TableCell>

                    <TableCell className="whitespace-nowrap">
                      <Badge variant="purple" className="capitalize text-xs font-semibold">
                        {task.category}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-xs text-slate-600 max-w-xs truncate">
                      {task.remark ? (
                        <span>{task.remark}</span>
                      ) : (
                        <span className="text-slate-300 italic">-</span>
                      )}
                    </TableCell>

                    <TableCell className="text-xs text-slate-500 whitespace-nowrap">
                      {task.createdBy?.name || "-"}
                    </TableCell>

                    <TableCell className="text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => handleOpenEditModal(task)}
                          className="h-7 w-7 p-0 text-slate-500 hover:text-ocean-600 hover:bg-ocean-50"
                          title="Edit Task"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => setTaskToDelete(task)}
                          className="h-7 w-7 p-0 text-slate-500 hover:text-red-600 hover:bg-red-50"
                          title="Delete Task"
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
      </CardContent>

      {/* Task Modal (Add / Edit) */}
      {isModalOpen && (
        <ProjectTaskModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setTaskToEdit(null);
          }}
          projectId={projectId}
          projectName={projectName}
          existingCategories={uniqueCategories}
          taskToEdit={taskToEdit}
          onTaskSaved={onTasksChanged}
        />
      )}

      {/* Delete Confirmation Modal */}
      {taskToDelete && (
        <ConfirmModal
          isOpen={!!taskToDelete}
          title={isMy ? "လုပ်ငန်းမှတ်တမ်း ဖျက်ရန် သေချာပါသလား?" : "Delete Finished Task?"}
          message={
            isMy
              ? `"${taskToDelete.taskName}" လုပ်ငန်းမှတ်တမ်းကို ဖျက်ပစ်ပါမည်။ ဤလုပ်ဆောင်ချက်ကို ပြန်ပြင်၍ မရနိုင်ပါ။`
              : `Are you sure you want to delete task "${taskToDelete.taskName}"? This action cannot be undone.`
          }
          confirmText={isMy ? "ဖျက်မည်" : "Delete"}
          cancelText={isMy ? "မဖျက်တော့ပါ" : "Cancel"}
          confirmButtonColor="red"
          isLoading={isDeleting}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setTaskToDelete(null)}
        />
      )}
    </Card>
  );
};
