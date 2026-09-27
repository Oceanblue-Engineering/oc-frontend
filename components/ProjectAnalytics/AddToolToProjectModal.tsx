import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { X, Search, Check, Wrench, Loader2, Plus, Minus, Layers } from "lucide-react";
import { toast } from "sonner";
import { fetchTools, ToolItem } from "../../services/ToolInventory/toolInventory.service";
import { addAllocation } from "../../services/ProjectToolAllocation/projectToolAllocation.service";

interface Props {
  projectId: string;
  onClose: () => void;
  onAdded: () => void;
}

interface SelectedToolConfig {
  tool: ToolItem;
  quantity: number;
}

const AddToolToProjectModal: React.FC<Props> = ({ projectId, onClose, onAdded }) => {
  const [query, setQuery] = useState("");
  const [allTools, setAllTools] = useState<ToolItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [viewFilter, setViewFilter] = useState<"all" | "selected">("all");

  // Multi-select map: toolId -> { tool, quantity }
  const [selectedTools, setSelectedTools] = useState<Record<string, SelectedToolConfig>>({});

  useEffect(() => {
    const loadTools = async () => {
      setLoading(true);
      try {
        const res = await fetchTools({ limit: 200 });
        setAllTools(res.data || []);
      } catch (err: any) {
        toast.error("Failed to load tools list");
      } finally {
        setLoading(false);
      }
    };
    loadTools();
  }, []);

  // Filter tools based on query and view filter
  const filteredTools = useMemo(() => {
    let list = allTools;
    if (viewFilter === "selected") {
      list = list.filter((t) => !!selectedTools[t._id]);
    }
    if (!query.trim()) return list;
    const q = query.toLowerCase().trim();
    return list.filter(
      (tool) =>
        tool.name.toLowerCase().includes(q) ||
        tool.category.toLowerCase().includes(q) ||
        (tool.serialNumber && tool.serialNumber.toLowerCase().includes(q))
    );
  }, [allTools, query, viewFilter, selectedTools]);

  const selectedCount = Object.keys(selectedTools).length;
  const totalUnits = Object.values(selectedTools).reduce((acc, item) => acc + item.quantity, 0);

  // Toggle tool selection
  const toggleSelect = (tool: ToolItem) => {
    setSelectedTools((prev) => {
      const copy = { ...prev };
      if (copy[tool._id]) {
        delete copy[tool._id];
      } else {
        copy[tool._id] = { tool, quantity: 1 };
      }
      return copy;
    });
  };

  // Change quantity for a specific tool
  const updateQuantity = (toolId: string, qty: number, max: number) => {
    const sanitized = Math.max(1, Math.min(qty, max));
    setSelectedTools((prev) => {
      if (!prev[toolId]) return prev;
      return {
        ...prev,
        [toolId]: { ...prev[toolId], quantity: sanitized },
      };
    });
  };

  // Select all currently filtered tools
  const handleSelectAllFiltered = () => {
    setSelectedTools((prev) => {
      const copy = { ...prev };
      filteredTools.forEach((tool) => {
        if (!copy[tool._id]) {
          copy[tool._id] = { tool, quantity: 1 };
        }
      });
      return copy;
    });
  };

  // Deselect all
  const handleClearSelection = () => {
    setSelectedTools({});
    if (viewFilter === "selected") setViewFilter("all");
  };

  // Batch save to project
  const handleSave = async () => {
    if (selectedCount === 0) {
      toast.error("Please select at least one tool");
      return;
    }

    const payload = Object.values(selectedTools).map((item) => ({
      toolId: item.tool._id,
      allocatedQty: item.quantity,
    }));

    setSaving(true);
    try {
      await addAllocation(projectId, { tools: payload });
      toast.success(`${selectedCount} tool(s) allocated to project (${totalUnits} total units)`);
      onAdded();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to allocate tools");
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b flex-shrink-0">
          <div>
            <h2 className="font-semibold text-gray-900 text-lg flex items-center gap-2">
              <Layers className="w-5 h-5 text-slate-700" />
              Add Tools to Project
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Select multiple tools and adjust quantities for each tool
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Search Box + Quick Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search tools by name, category, or S/N..."
                className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition"
              />
            </div>
            {/* Filter Toggle Buttons */}
            <div className="flex rounded-xl bg-gray-100 p-1 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setViewFilter("all")}
                className={`px-3 py-1.5 rounded-lg transition ${
                  viewFilter === "all"
                    ? "bg-white text-gray-900 shadow-xs"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                All ({allTools.length})
              </button>
              <button
                type="button"
                onClick={() => setViewFilter("selected")}
                className={`px-3 py-1.5 rounded-lg transition ${
                  viewFilter === "selected"
                    ? "bg-[#18181b] text-white shadow-xs"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Selected ({selectedCount})
              </button>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between text-xs text-gray-500 px-1 font-medium">
            <div className="flex items-center gap-2">
              <span>
                Showing {filteredTools.length} of {allTools.length} tools
              </span>
              {selectedCount > 0 && (
                <span className="inline-flex items-center gap-1 text-slate-800 bg-slate-100 px-2 py-0.5 rounded-full font-bold">
                  {selectedCount} selected · {totalUnits} unit{totalUnits > 1 ? "s" : ""}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {filteredTools.length > 0 && viewFilter !== "selected" && (
                <button
                  type="button"
                  onClick={handleSelectAllFiltered}
                  className="text-xs text-slate-700 hover:text-slate-900 font-semibold"
                >
                  Select All
                </button>
              )}
              {selectedCount > 0 && (
                <button
                  type="button"
                  onClick={handleClearSelection}
                  className="text-xs text-gray-400 hover:text-red-600 font-semibold"
                >
                  Clear All
                </button>
              )}
            </div>
          </div>

          {/* Tools List */}
          <div className="border border-gray-200 rounded-xl max-h-72 overflow-y-auto divide-y divide-gray-100 bg-white shadow-inner">
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-12 text-gray-400 text-sm">
                <Loader2 className="w-4 h-4 animate-spin text-slate-700" />
                Loading inventory tools...
              </div>
            ) : filteredTools.length === 0 ? (
              <div className="py-12 text-center text-gray-400 text-sm">
                <Wrench className="w-8 h-8 mx-auto mb-2 opacity-30" />
                {allTools.length === 0 ? (
                  <p>No tools in inventory yet. Add tools in Tool Inventory first.</p>
                ) : viewFilter === "selected" ? (
                  <p>No tools selected yet. Switch to "All" to select tools.</p>
                ) : (
                  <p>No tools matching "{query}"</p>
                )}
              </div>
            ) : (
              filteredTools.map((tool) => {
                const config = selectedTools[tool._id];
                const isSelected = !!config;

                return (
                  <div
                    key={tool._id}
                    onClick={() => toggleSelect(tool)}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between p-3.5 pr-4 gap-3 transition cursor-pointer select-none ${
                      isSelected
                        ? "bg-slate-50/90 border-l-4 border-slate-900"
                        : "hover:bg-gray-50 border-l-4 border-transparent"
                    }`}
                  >
                    {/* Tool info & Checkbox */}
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center border mt-0.5 flex-shrink-0 transition ${
                          isSelected
                            ? "bg-slate-900 border-slate-900 text-white"
                            : "border-gray-300 bg-white"
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                      </div>
                      <div className="min-w-0">
                        <p
                          className={`font-semibold text-sm truncate ${
                            isSelected ? "text-slate-950 font-bold" : "text-gray-900"
                          }`}
                        >
                          {tool.name}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                          <span className="font-medium text-gray-600">{tool.category}</span>
                          {tool.serialNumber && (
                            <>
                              <span>·</span>
                              <span className="text-gray-400">S/N: {tool.serialNumber}</span>
                            </>
                          )}
                          <span>·</span>
                          <span className="bg-gray-100 text-gray-600 px-1.5 py-0.2 rounded text-[11px] font-medium">
                            Stock: {tool.totalQuantity}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Quantity controls when selected - fixed column width and aligned */}
                    {isSelected && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center justify-between sm:justify-end gap-2.5 flex-shrink-0 sm:w-36 bg-white sm:bg-transparent p-2 sm:p-0 rounded-lg border sm:border-0 border-slate-200"
                      >
                        <span className="text-xs font-semibold text-gray-600 sm:hidden">
                          Allocate Qty:
                        </span>
                        <div className="flex items-center border border-slate-200 bg-white rounded-lg overflow-hidden shadow-xs">
                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(tool._id, config.quantity - 1, tool.totalQuantity)
                            }
                            className="p-1.5 text-gray-500 hover:text-slate-900 hover:bg-slate-100 active:bg-slate-200 transition"
                            title="Decrease quantity"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <input
                            type="number"
                            min={1}
                            max={tool.totalQuantity}
                            value={config.quantity}
                            onChange={(e) =>
                              updateQuantity(tool._id, Number(e.target.value), tool.totalQuantity)
                            }
                            className="w-11 text-center text-xs font-bold text-gray-900 focus:outline-none py-1 border-x border-slate-100"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(tool._id, config.quantity + 1, tool.totalQuantity)
                            }
                            className="p-1.5 text-gray-500 hover:text-slate-900 hover:bg-slate-100 active:bg-slate-200 transition"
                            title="Increase quantity"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <span className="text-[11px] text-gray-400 font-medium w-8 text-left tabular-nums hidden sm:inline">
                          / {tool.totalQuantity}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t flex items-center justify-between gap-3 flex-shrink-0 bg-gray-50/70 rounded-b-2xl">
          <div className="text-xs text-gray-500">
            {selectedCount > 0 ? (
              <span>
                <strong className="text-gray-900">{selectedCount}</strong> tool(s) selected (
                <strong className="text-slate-900 font-bold">{totalUnits}</strong> units total)
              </span>
            ) : (
              <span>Click items to select tools</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-100 text-gray-700 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={selectedCount === 0 || saving}
              className="px-5 py-2.5 bg-[#18181b] hover:bg-[#09090b] text-white rounded-xl text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm flex items-center gap-2 active:scale-[0.98]"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Adding...
                </>
              ) : selectedCount > 0 ? (
                `Add ${selectedCount} Tool${selectedCount > 1 ? "s" : ""} (${totalUnits} units)`
              ) : (
                "Select Tools to Add"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default AddToolToProjectModal;
