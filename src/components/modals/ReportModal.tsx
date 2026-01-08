"use client";

import { useState, useEffect } from "react";
import { Icons } from "@/components/ui/Icons";
import type { Report, Project } from "@/types";
import { calculateEVM } from "@/lib/calculations";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Report>) => Promise<void>;
  report?: Report | null;
  projects: Project[];
}

type TabId =
  | "general"
  | "progress"
  | "cashflow"
  | "hse"
  | "quality"
  | "activities"
  | "milestones"
  | "uploads";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FormState = Record<string, any>;

const defaultActivities = {
  engineering: [""],
  procurement: [""],
  construction: [""],
  precommissioning: [""],
};

export function ReportModal({
  isOpen,
  onClose,
  onSave,
  report,
  projects,
}: ReportModalProps) {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("general");
  const [qualityTab, setQualityTab] = useState<"headOffice" | "siteOffice">(
    "headOffice"
  );
  const [formData, setFormData] = useState<FormState>({});

  const selectedProject = projects.find((p) => p.id === formData.projectId);

  useEffect(() => {
    if (report) {
      setFormData({
        projectId: report.projectId,
        weekNo: report.weekNo,
        docNo: report.docNo,
        status: report.status,
        approvalStatus: report.approvalStatus,
        periodStart: report.periodStart,
        periodEnd: report.periodEnd,
        preparedBy: report.preparedBy,
        checkedBy: report.checkedBy,
        approvedBy: report.approvedBy,
        evm: report.evm,
        epcc: report.epcc,
        overallProgress: report.overallProgress,
        hse: report.hse,
        quality: report.quality,
        cashFlow: report.cashFlow,
        tkdn: report.tkdn,
        thisWeekActivities: report.thisWeekActivities || defaultActivities,
        nextWeekPlan: report.nextWeekPlan || defaultActivities,
        milestonesSchedule: report.milestonesSchedule || [],
        milestonesPayment: report.milestonesPayment || [],
        actualForecastPower: report.actualForecastPower,
        uploads: report.uploads || {},
      });
    } else {
      setFormData({
        projectId: projects[0]?.id || "",
        weekNo: 1,
        status: "Draft",
        approvalStatus: "Pending",
        evm: { bac: 0, bcws: 0, bcwp: 0, acwp: 0, spiValue: 0, cpiValue: 0 },
        epcc: {},
        overallProgress: { plan: 0, actual: 0, variance: 0 },
        hse: {
          lagging: { fatality: 0, lti: 0, medicalTreatment: 0, firstAid: 0 },
          leading: {
            nearMiss: 0,
            safetyObservation: 0,
            hsseInspection: 0,
            hsseTraining: 0,
          },
          manpower: { office: 0, siteSubcontractor: 0, total: 0 },
          safeHours: 0,
          trir: 0,
        },
        quality: { headOffice: {}, siteOffice: {}, certificate: {} },
        cashFlow: { cashOut: 0, billing: 0, cashIn: 0 },
        tkdn: { plan: 40, actual: 0 },
        thisWeekActivities: defaultActivities,
        nextWeekPlan: defaultActivities,
        milestonesSchedule: [],
        milestonesPayment: [],
        actualForecastPower: 0,
        uploads: {},
      });
    }
  }, [report, projects, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(formData as Partial<Report>);
      onClose();
    } catch (error) {
      console.error("Save failed:", error);
    } finally {
      setLoading(false);
    }
  };

  // EVM auto-calculation
  const updateEVM = (key: string, value: number) => {
    const evm = { ...(formData.evm || {}) };
    evm[key] = value;

    if (["bcws", "bcwp", "acwp", "bac"].includes(key)) {
      const calculated = calculateEVM(
        evm.bcws || 0,
        evm.bcwp || 0,
        evm.acwp || 0,
        evm.bac || 0
      );
      Object.assign(evm, calculated);
    }

    setFormData((prev) => ({ ...prev, evm }));
  };

  // Update nested quality data
  const updateQuality = (path: string, value: number) => {
    const paths = path.split(".");
    setFormData((prev) => {
      const newQ = { ...(prev.quality || {}) };
      let current: Record<string, unknown> = newQ;
      for (let i = 0; i < paths.length - 1; i++) {
        current[paths[i]] = current[paths[i]]
          ? { ...(current[paths[i]] as Record<string, unknown>) }
          : {};
        current = current[paths[i]] as Record<string, unknown>;
      }
      current[paths[paths.length - 1]] = value;
      return { ...prev, quality: newQ };
    });
  };

  // Activity management
  const updateActivity = (
    type: string,
    category: string,
    index: number,
    value: string
  ) => {
    setFormData((prev) => {
      const activities = { ...(prev[type] || defaultActivities) };
      activities[category] = [...(activities[category] || [""])];
      activities[category][index] = value;
      return { ...prev, [type]: activities };
    });
  };

  const addActivityItem = (type: string, category: string) => {
    setFormData((prev) => {
      const activities = { ...(prev[type] || defaultActivities) };
      activities[category] = [...(activities[category] || []), ""];
      return { ...prev, [type]: activities };
    });
  };

  const removeActivityItem = (
    type: string,
    category: string,
    index: number
  ) => {
    setFormData((prev) => {
      const activities = { ...(prev[type] || defaultActivities) };
      activities[category] = activities[category].filter(
        (_: string, i: number) => i !== index
      );
      if (activities[category].length === 0) activities[category] = [""];
      return { ...prev, [type]: activities };
    });
  };

  // Milestone management
  const addMilestone = (type: "schedule" | "payment") => {
    const key =
      type === "schedule" ? "milestonesSchedule" : "milestonesPayment";
    setFormData((prev) => ({
      ...prev,
      [key]: [
        ...(prev[key] || []),
        {
          no: (prev[key]?.length || 0) + 1,
          description: "",
          planDate: "",
          actualForecastDate: "",
          status: "On Track",
        },
      ],
    }));
  };

  const updateMilestone = (
    type: "schedule" | "payment",
    index: number,
    field: string,
    value: string | number
  ) => {
    const key =
      type === "schedule" ? "milestonesSchedule" : "milestonesPayment";
    setFormData((prev) => {
      const milestones = [...(prev[key] || [])];
      milestones[index] = { ...milestones[index], [field]: value };
      return { ...prev, [key]: milestones };
    });
  };

  const removeMilestone = (type: "schedule" | "payment", index: number) => {
    const key =
      type === "schedule" ? "milestonesSchedule" : "milestonesPayment";
    setFormData((prev) => ({
      ...prev,
      [key]: (prev[key] || []).filter((_: unknown, i: number) => i !== index),
    }));
  };

  // File upload handler
  const handleFileUpload = (
    field: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setFormData((prev) => ({
        ...prev,
        uploads: {
          ...prev.uploads,
          [field]: { name: file.name, data: ev.target?.result as string },
        },
      }));
    };
    reader.readAsDataURL(file);
  };

  const tabs = [
    { id: "general" as TabId, label: "General" },
    { id: "progress" as TabId, label: "Progress & EVM" },
    { id: "cashflow" as TabId, label: "💵 Cash Flow" },
    { id: "hse" as TabId, label: "🦺 HSE" },
    { id: "quality" as TabId, label: "📋 Quality" },
    { id: "activities" as TabId, label: "Activities" },
    { id: "milestones" as TabId, label: "Milestones" },
    { id: "uploads" as TabId, label: "Uploads" },
  ];

  const disciplines = [
    "process",
    "mechanical",
    "piping",
    "electrical",
    "instrument",
    "civil",
  ];
  const evm = formData.evm || {};
  const hse = formData.hse || {};
  const quality = formData.quality || {};
  const tkdn = formData.tkdn || {};

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-[95%] max-w-5xl max-h-[90vh] overflow-hidden rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 p-4">
          <h2 className="text-lg font-bold">
            {report ? "Edit" : "Create"} Weekly Report
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded">
            <Icons.X />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex overflow-x-auto border-b border-slate-200">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`whitespace-nowrap px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === t.id
                  ? "text-teal-600 border-teal-600"
                  : "text-slate-500 border-transparent hover:text-slate-700"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit}>
          <div className="p-4 max-h-[55vh] overflow-y-auto">
            {/* General Tab */}
            {activeTab === "general" && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Project
                  </label>
                  <select
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    value={formData.projectId || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, projectId: e.target.value })
                    }
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Week No
                  </label>
                  <input
                    type="number"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    value={formData.weekNo || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        weekNo: Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Document Number
                  </label>
                  <input
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    value={formData.docNo || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, docNo: e.target.value })
                    }
                    placeholder="e.g. SEGSK7PMGN00RPW0052"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Status
                  </label>
                  <select
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    value={formData.status || "Draft"}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value })
                    }
                  >
                    <option>Draft</option>
                    <option>Issued</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Period Start
                  </label>
                  <input
                    type="date"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    value={formData.periodStart || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, periodStart: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Period End
                  </label>
                  <input
                    type="date"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    value={formData.periodEnd || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, periodEnd: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Prepared By
                  </label>
                  <input
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    value={formData.preparedBy || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, preparedBy: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Checked By
                  </label>
                  <input
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    value={formData.checkedBy || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, checkedBy: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Approved By
                  </label>
                  <input
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    value={formData.approvedBy || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, approvedBy: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Approval Status
                  </label>
                  <select
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    value={formData.approvalStatus || "Pending"}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        approvalStatus: e.target.value,
                      })
                    }
                  >
                    <option value="Pending">⏳ Pending</option>
                    <option value="Under Review">📋 Under Review</option>
                    <option value="Approved">✅ Approved</option>
                    <option value="Rejected">❌ Rejected</option>
                    <option value="Revision Required">
                      🔄 Revision Required
                    </option>
                  </select>
                </div>
              </div>
            )}

            {/* Progress & EVM Tab */}
            {activeTab === "progress" && (
              <div className="space-y-6">
                {/* EPCC Progress */}
                <div>
                  <h4 className="font-semibold mb-3">EPCC Progress (%)</h4>
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      "engineering",
                      "procurement",
                      "construction",
                      "commissioning",
                    ].map((cat) => (
                      <div key={cat} className="rounded-lg bg-slate-50 p-3">
                        <label className="block text-xs font-semibold capitalize mb-2">
                          {cat}
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <span className="text-[10px] text-slate-500">
                              Plan
                            </span>
                            <input
                              type="number"
                              step="0.01"
                              className="w-full rounded border px-2 py-1 text-sm"
                              value={formData.epcc?.[cat]?.plan || ""}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  epcc: {
                                    ...formData.epcc,
                                    [cat]: {
                                      ...formData.epcc?.[cat],
                                      plan: Number(e.target.value),
                                    },
                                  },
                                })
                              }
                            />
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500">
                              Actual
                            </span>
                            <input
                              type="number"
                              step="0.01"
                              className="w-full rounded border px-2 py-1 text-sm"
                              value={formData.epcc?.[cat]?.actual || ""}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  epcc: {
                                    ...formData.epcc,
                                    [cat]: {
                                      ...formData.epcc?.[cat],
                                      actual: Number(e.target.value),
                                    },
                                  },
                                })
                              }
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Overall Progress */}
                <div>
                  <h4 className="font-semibold mb-3">Overall Progress</h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Plan %
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        className="w-full rounded-lg border px-3 py-2 text-sm"
                        value={formData.overallProgress?.plan || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            overallProgress: {
                              ...formData.overallProgress,
                              plan: Number(e.target.value),
                            },
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Actual %
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        className="w-full rounded-lg border px-3 py-2 text-sm"
                        value={formData.overallProgress?.actual || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            overallProgress: {
                              ...formData.overallProgress,
                              actual: Number(e.target.value),
                            },
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Variance
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        className="w-full rounded-lg border px-3 py-2 text-sm"
                        value={formData.overallProgress?.variance || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            overallProgress: {
                              ...formData.overallProgress,
                              variance: Number(e.target.value),
                            },
                          })
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* EVM Inputs */}
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    📊 EVM Input{" "}
                    <span className="text-xs font-normal text-slate-500">
                      (SPI, CPI, EAC auto-calculated)
                    </span>
                  </h4>
                  <div className="grid grid-cols-4 gap-3 mb-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        BAC
                      </label>
                      <input
                        type="number"
                        className="w-full rounded-lg border px-3 py-2 text-sm"
                        value={evm.bac || selectedProject?.bac || ""}
                        onChange={(e) =>
                          updateEVM("bac", Number(e.target.value))
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        BCWS (Planned)
                      </label>
                      <input
                        type="number"
                        className="w-full rounded-lg border px-3 py-2 text-sm"
                        value={evm.bcws || ""}
                        onChange={(e) =>
                          updateEVM("bcws", Number(e.target.value))
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        BCWP (Earned)
                      </label>
                      <input
                        type="number"
                        className="w-full rounded-lg border px-3 py-2 text-sm"
                        value={evm.bcwp || ""}
                        onChange={(e) =>
                          updateEVM("bcwp", Number(e.target.value))
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        ACWP (Actual)
                      </label>
                      <input
                        type="number"
                        className="w-full rounded-lg border px-3 py-2 text-sm"
                        value={evm.acwp || ""}
                        onChange={(e) =>
                          updateEVM("acwp", Number(e.target.value))
                        }
                      />
                    </div>
                  </div>

                  {/* Auto-calculated results */}
                  <div className="rounded-lg bg-amber-50 border border-amber-300 p-4">
                    <h5 className="font-semibold text-amber-800 mb-3">
                      📊 Auto-Calculated Results
                    </h5>
                    {/* Row 1: SPI, CPI, CV */}
                    <div className="grid grid-cols-3 gap-3 mb-3">
                      <div className="rounded-lg bg-green-50 p-3 text-center">
                        <p className="text-[10px] text-green-600 font-medium">
                          SPI = BCWP/BCWS
                        </p>
                        <p className="text-lg font-bold text-green-700">
                          {(evm.spiValue || 0).toFixed(4)}
                        </p>
                      </div>
                      <div className="rounded-lg bg-amber-100 p-3 text-center">
                        <p className="text-[10px] text-amber-600 font-medium">
                          CPI = BCWP/ACWP
                        </p>
                        <p className="text-lg font-bold text-amber-700">
                          {(evm.cpiValue || 0).toFixed(4)}
                        </p>
                      </div>
                      <div
                        className={`rounded-lg p-3 text-center ${
                          (evm.cv || 0) >= 0 ? "bg-green-50" : "bg-red-50"
                        }`}
                      >
                        <p className="text-[10px] text-red-600 font-medium">
                          CV = BCWP-ACWP
                        </p>
                        <p
                          className={`text-lg font-bold ${
                            (evm.cv || 0) >= 0
                              ? "text-green-700"
                              : "text-red-700"
                          }`}
                        >
                          ${((evm.cv || 0) / 1e6).toFixed(2)}M
                        </p>
                      </div>
                    </div>
                    {/* Row 2: EAC variants and VAC */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-lg bg-slate-100 p-2 flex justify-between items-center">
                        <span className="text-[10px] text-slate-600">
                          EAC (Typical) = BAC/CPI
                        </span>
                        <span className="text-sm font-bold">
                          ${((evm.eacTypical || evm.eac || 0) / 1e6).toFixed(2)}
                          M
                        </span>
                      </div>
                      <div className="rounded-lg bg-slate-100 p-2 flex justify-between items-center">
                        <span className="text-[10px] text-slate-600">
                          EAC (Atypical)
                        </span>
                        <span className="text-sm font-bold">
                          ${((evm.eacAtypical || 0) / 1e6).toFixed(2)}M
                        </span>
                      </div>
                      <div className="rounded-lg bg-slate-100 p-2 flex justify-between items-center">
                        <span className="text-[10px] text-slate-600">
                          EAC (Combined)
                        </span>
                        <span className="text-sm font-bold">
                          ${((evm.eacCombined || 0) / 1e6).toFixed(2)}M
                        </span>
                      </div>
                      <div
                        className={`rounded-lg p-2 flex justify-between items-center ${
                          (evm.vac || 0) >= 0 ? "bg-green-100" : "bg-red-100"
                        }`}
                      >
                        <span className="text-[10px] text-slate-600">
                          VAC = BAC - EAC
                        </span>
                        <span
                          className={`text-sm font-bold ${
                            (evm.vac || 0) >= 0
                              ? "text-green-700"
                              : "text-red-700"
                          }`}
                        >
                          ${((evm.vac || 0) / 1e6).toFixed(2)}M
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* TKDN */}
                <div className="rounded-lg bg-cyan-50 border border-cyan-300 p-4">
                  <h4 className="font-semibold text-cyan-800 mb-3">
                    🏭 TKDN (Tingkat Komponen Dalam Negeri)
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-blue-600 mb-1">
                        Target TKDN (Plan) %
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        className="w-full rounded-lg border px-3 py-2 text-sm"
                        value={tkdn.plan || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            tkdn: { ...tkdn, plan: Number(e.target.value) },
                          })
                        }
                        placeholder="e.g. 40"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-cyan-600 mb-1">
                        Realisasi TKDN (Actual) %
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        className="w-full rounded-lg border px-3 py-2 text-sm"
                        value={tkdn.actual || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            tkdn: { ...tkdn, actual: Number(e.target.value) },
                          })
                        }
                        placeholder="e.g. 42.5"
                      />
                    </div>
                  </div>
                  {(tkdn.plan > 0 || tkdn.actual > 0) && (
                    <div
                      className={`mt-3 p-3 rounded-lg border-2 ${
                        (tkdn.actual || 0) >= (tkdn.plan || 0)
                          ? "border-green-500 bg-green-50"
                          : "border-red-500 bg-red-50"
                      }`}
                    >
                      <div className="grid grid-cols-4 gap-3 text-center">
                        <div>
                          <p className="text-xs text-slate-500">Target</p>
                          <p className="text-xl font-bold text-blue-600">
                            {tkdn.plan}%
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Actual</p>
                          <p className="text-xl font-bold text-cyan-600">
                            {(tkdn.actual || 0).toFixed(1)}%
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Variance</p>
                          <p
                            className={`text-xl font-bold ${
                              tkdn.actual - tkdn.plan >= 0
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {tkdn.actual - tkdn.plan >= 0 ? "+" : ""}
                            {((tkdn.actual || 0) - (tkdn.plan || 0)).toFixed(1)}
                            %
                          </p>
                        </div>
                        <div
                          className={`rounded-lg p-2 ${
                            (tkdn.actual || 0) >= (tkdn.plan || 0)
                              ? "bg-green-500"
                              : "bg-red-500"
                          }`}
                        >
                          <p className="text-xs text-white opacity-80">
                            Status
                          </p>
                          <p className="text-sm font-bold text-white">
                            {(tkdn.actual || 0) >= (tkdn.plan || 0)
                              ? "✅ PASS"
                              : "❌ RISK"}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Power Output */}
                <div className="rounded-lg bg-blue-50 border border-blue-300 p-4">
                  <h4 className="font-semibold text-blue-800 mb-3">
                    ⚡ Power Output
                  </h4>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Actual / Forecast Net Power Output (MW)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      className="w-full rounded-lg border px-3 py-2 text-sm"
                      value={formData.actualForecastPower || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          actualForecastPower: Number(e.target.value),
                        })
                      }
                      placeholder={`Guaranteed: ${
                        selectedProject?.guaranteedPower || 0
                      } MW`}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Cash Flow Tab */}
            {activeTab === "cashflow" && (
              <div className="space-y-4">
                <h4 className="font-semibold">💵 Cash Flow Input</h4>
                {/* Revenue from BCWP */}
                <div className="rounded-lg bg-green-50 border border-green-300 p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block text-xs font-semibold text-green-700">
                        Revenue (BCWP)
                      </label>
                      <p className="text-[10px] text-slate-500">
                        Auto-populated from EVM → BCWP (Earned Value)
                      </p>
                    </div>
                    <p className="text-xl font-bold text-green-600">
                      ${((evm.bcwp || 0) / 1e6).toFixed(2)}M
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-red-600 mb-1">
                      Cash Out
                    </label>
                    <input
                      type="number"
                      className="w-full rounded-lg border px-3 py-2 text-sm"
                      value={formData.cashFlow?.cashOut || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          cashFlow: {
                            ...formData.cashFlow,
                            cashOut: Number(e.target.value),
                          },
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-blue-600 mb-1">
                      Billing
                    </label>
                    <input
                      type="number"
                      className="w-full rounded-lg border px-3 py-2 text-sm"
                      value={formData.cashFlow?.billing || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          cashFlow: {
                            ...formData.cashFlow,
                            billing: Number(e.target.value),
                          },
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-purple-600 mb-1">
                      Cash In / AR
                    </label>
                    <input
                      type="number"
                      className="w-full rounded-lg border px-3 py-2 text-sm"
                      value={formData.cashFlow?.cashIn || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          cashFlow: {
                            ...formData.cashFlow,
                            cashIn: Number(e.target.value),
                          },
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            )}

            {/* HSE Tab */}
            {activeTab === "hse" && (
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold text-red-600 mb-3">
                    Lagging Indicators
                  </h4>
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { k: "fatality", l: "Fatality" },
                      { k: "lti", l: "LTI" },
                      { k: "medicalTreatment", l: "Medical Treatment" },
                      { k: "firstAid", l: "First Aid" },
                    ].map(({ k, l }) => (
                      <div key={k}>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">
                          {l}
                        </label>
                        <input
                          type="number"
                          className="w-full rounded-lg border px-3 py-2 text-sm"
                          value={hse.lagging?.[k] || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              hse: {
                                ...hse,
                                lagging: {
                                  ...hse.lagging,
                                  [k]: Number(e.target.value),
                                },
                              },
                            })
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-green-600 mb-3">
                    Leading Indicators
                  </h4>
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { k: "nearMiss", l: "Near Miss" },
                      { k: "safetyObservation", l: "Safety Observation" },
                      { k: "hsseInspection", l: "Inspection" },
                      { k: "hsseTraining", l: "Training" },
                    ].map(({ k, l }) => (
                      <div key={k}>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">
                          {l}
                        </label>
                        <input
                          type="number"
                          className="w-full rounded-lg border px-3 py-2 text-sm"
                          value={hse.leading?.[k] || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              hse: {
                                ...hse,
                                leading: {
                                  ...hse.leading,
                                  [k]: Number(e.target.value),
                                },
                              },
                            })
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Manpower & Hours</h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Office
                      </label>
                      <input
                        type="number"
                        className="w-full rounded-lg border px-3 py-2 text-sm"
                        value={hse.manpower?.office || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            hse: {
                              ...hse,
                              manpower: {
                                ...hse.manpower,
                                office: Number(e.target.value),
                                total:
                                  Number(e.target.value) +
                                  (hse.manpower?.siteSubcontractor || 0),
                              },
                            },
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Site
                      </label>
                      <input
                        type="number"
                        className="w-full rounded-lg border px-3 py-2 text-sm"
                        value={hse.manpower?.siteSubcontractor || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            hse: {
                              ...hse,
                              manpower: {
                                ...hse.manpower,
                                siteSubcontractor: Number(e.target.value),
                                total:
                                  (hse.manpower?.office || 0) +
                                  Number(e.target.value),
                              },
                            },
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Safe Hours
                      </label>
                      <input
                        type="number"
                        className="w-full rounded-lg border px-3 py-2 text-sm"
                        value={hse.safeHours || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            hse: { ...hse, safeHours: Number(e.target.value) },
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Quality Tab */}
            {activeTab === "quality" && (
              <div className="space-y-4">
                {/* Sub-tabs */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setQualityTab("headOffice")}
                    className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium ${
                      qualityTab === "headOffice"
                        ? "bg-teal-600 text-white"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    🏢 Head Office (Shop)
                  </button>
                  <button
                    type="button"
                    onClick={() => setQualityTab("siteOffice")}
                    className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium ${
                      qualityTab === "siteOffice"
                        ? "bg-teal-600 text-white"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    🏗️ Site Office (Construction)
                  </button>
                </div>

                {/* AFI Table */}
                <div className="rounded-lg bg-slate-50 p-4">
                  <h5 className="font-semibold text-blue-600 mb-3">
                    📋 Application for Inspection (AFI)
                  </h5>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-200">
                        <th className="px-2 py-1 text-left">Discipline</th>
                        <th className="px-2 py-1 text-center w-16">Fail</th>
                        <th className="px-2 py-1 text-center w-16">Ongoing</th>
                        <th className="px-2 py-1 text-center w-16">Pass</th>
                      </tr>
                    </thead>
                    <tbody>
                      {disciplines.map((d) => {
                        const afi = quality[qualityTab]?.afi?.[d] || {};
                        return (
                          <tr key={d} className="border-b">
                            <td className="px-2 py-1 capitalize font-medium">
                              {d}
                            </td>
                            <td className="px-2 py-1">
                              <input
                                type="number"
                                className="w-14 rounded border px-1 py-0.5 text-center text-xs"
                                value={afi.fail || ""}
                                onChange={(e) =>
                                  updateQuality(
                                    `${qualityTab}.afi.${d}.fail`,
                                    Number(e.target.value)
                                  )
                                }
                              />
                            </td>
                            <td className="px-2 py-1">
                              <input
                                type="number"
                                className="w-14 rounded border px-1 py-0.5 text-center text-xs"
                                value={afi.ongoing || ""}
                                onChange={(e) =>
                                  updateQuality(
                                    `${qualityTab}.afi.${d}.ongoing`,
                                    Number(e.target.value)
                                  )
                                }
                              />
                            </td>
                            <td className="px-2 py-1">
                              <input
                                type="number"
                                className="w-14 rounded border px-1 py-0.5 text-center text-xs"
                                value={afi.pass || ""}
                                onChange={(e) =>
                                  updateQuality(
                                    `${qualityTab}.afi.${d}.pass`,
                                    Number(e.target.value)
                                  )
                                }
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* NCR Tables */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg bg-red-50 p-3">
                    <h6 className="font-semibold text-red-700 mb-2 text-xs">
                      📝 NCR Owner→Contractor
                    </h6>
                    <table className="w-full text-xs">
                      <thead>
                        <tr>
                          <th className="text-left">Disc</th>
                          <th className="w-12">Open</th>
                          <th className="w-12">Closed</th>
                        </tr>
                      </thead>
                      <tbody>
                        {disciplines.map((d) => {
                          const ncr =
                            quality[qualityTab]?.ncr?.ownerToContractor?.[d] ||
                            {};
                          return (
                            <tr key={d}>
                              <td className="capitalize">{d.slice(0, 4)}</td>
                              <td>
                                <input
                                  type="number"
                                  className="w-10 rounded border px-1 text-center text-xs"
                                  value={ncr.open || ""}
                                  onChange={(e) =>
                                    updateQuality(
                                      `${qualityTab}.ncr.ownerToContractor.${d}.open`,
                                      Number(e.target.value)
                                    )
                                  }
                                />
                              </td>
                              <td>
                                <input
                                  type="number"
                                  className="w-10 rounded border px-1 text-center text-xs"
                                  value={ncr.closed || ""}
                                  onChange={(e) =>
                                    updateQuality(
                                      `${qualityTab}.ncr.ownerToContractor.${d}.closed`,
                                      Number(e.target.value)
                                    )
                                  }
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div className="rounded-lg bg-orange-50 p-3">
                    <h6 className="font-semibold text-orange-700 mb-2 text-xs">
                      📝 NCR Contractor→Vendor
                    </h6>
                    <table className="w-full text-xs">
                      <thead>
                        <tr>
                          <th className="text-left">Disc</th>
                          <th className="w-12">Open</th>
                          <th className="w-12">Closed</th>
                        </tr>
                      </thead>
                      <tbody>
                        {disciplines.map((d) => {
                          const ncr =
                            quality[qualityTab]?.ncr?.contractorToVendor?.[d] ||
                            {};
                          return (
                            <tr key={d}>
                              <td className="capitalize">{d.slice(0, 4)}</td>
                              <td>
                                <input
                                  type="number"
                                  className="w-10 rounded border px-1 text-center text-xs"
                                  value={ncr.open || ""}
                                  onChange={(e) =>
                                    updateQuality(
                                      `${qualityTab}.ncr.contractorToVendor.${d}.open`,
                                      Number(e.target.value)
                                    )
                                  }
                                />
                              </td>
                              <td>
                                <input
                                  type="number"
                                  className="w-10 rounded border px-1 text-center text-xs"
                                  value={ncr.closed || ""}
                                  onChange={(e) =>
                                    updateQuality(
                                      `${qualityTab}.ncr.contractorToVendor.${d}.closed`,
                                      Number(e.target.value)
                                    )
                                  }
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Punch List Tables */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg bg-amber-50 p-3">
                    <h6 className="font-semibold text-amber-700 mb-2 text-xs">
                      📌 Punch List Owner→Contractor
                    </h6>
                    <table className="w-full text-xs">
                      <thead>
                        <tr>
                          <th className="text-left">Disc</th>
                          <th className="w-12">Open</th>
                          <th className="w-12">Closed</th>
                        </tr>
                      </thead>
                      <tbody>
                        {disciplines.map((d) => {
                          const punch =
                            quality[qualityTab]?.punchList?.ownerToContractor?.[
                              d
                            ] || {};
                          return (
                            <tr key={d}>
                              <td className="capitalize">{d.slice(0, 4)}</td>
                              <td>
                                <input
                                  type="number"
                                  className="w-10 rounded border px-1 text-center text-xs"
                                  value={punch.open || ""}
                                  onChange={(e) =>
                                    updateQuality(
                                      `${qualityTab}.punchList.ownerToContractor.${d}.open`,
                                      Number(e.target.value)
                                    )
                                  }
                                />
                              </td>
                              <td>
                                <input
                                  type="number"
                                  className="w-10 rounded border px-1 text-center text-xs"
                                  value={punch.closed || ""}
                                  onChange={(e) =>
                                    updateQuality(
                                      `${qualityTab}.punchList.ownerToContractor.${d}.closed`,
                                      Number(e.target.value)
                                    )
                                  }
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div className="rounded-lg bg-green-50 p-3">
                    <h6 className="font-semibold text-green-700 mb-2 text-xs">
                      📌 Punch List Contractor→Vendor
                    </h6>
                    <table className="w-full text-xs">
                      <thead>
                        <tr>
                          <th className="text-left">Disc</th>
                          <th className="w-12">Open</th>
                          <th className="w-12">Closed</th>
                        </tr>
                      </thead>
                      <tbody>
                        {disciplines.map((d) => {
                          const punch =
                            quality[qualityTab]?.punchList
                              ?.contractorToVendor?.[d] || {};
                          return (
                            <tr key={d}>
                              <td className="capitalize">{d.slice(0, 4)}</td>
                              <td>
                                <input
                                  type="number"
                                  className="w-10 rounded border px-1 text-center text-xs"
                                  value={punch.open || ""}
                                  onChange={(e) =>
                                    updateQuality(
                                      `${qualityTab}.punchList.contractorToVendor.${d}.open`,
                                      Number(e.target.value)
                                    )
                                  }
                                />
                              </td>
                              <td>
                                <input
                                  type="number"
                                  className="w-10 rounded border px-1 text-center text-xs"
                                  value={punch.closed || ""}
                                  onChange={(e) =>
                                    updateQuality(
                                      `${qualityTab}.punchList.contractorToVendor.${d}.closed`,
                                      Number(e.target.value)
                                    )
                                  }
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Certificate */}
                <div className="rounded-lg bg-purple-50 border border-purple-300 p-4">
                  <h5 className="font-semibold text-purple-700 mb-3">
                    📜 Certificate Status
                  </h5>
                  <div className="grid grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Not Yet Applied
                      </label>
                      <input
                        type="number"
                        className="w-full rounded-lg border px-3 py-2 text-sm"
                        value={quality.certificate?.notYetApplied || ""}
                        onChange={(e) =>
                          updateQuality(
                            "certificate.notYetApplied",
                            Number(e.target.value)
                          )
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Under Application
                      </label>
                      <input
                        type="number"
                        className="w-full rounded-lg border px-3 py-2 text-sm"
                        value={quality.certificate?.underApplication || ""}
                        onChange={(e) =>
                          updateQuality(
                            "certificate.underApplication",
                            Number(e.target.value)
                          )
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Completed
                      </label>
                      <input
                        type="number"
                        className="w-full rounded-lg border px-3 py-2 text-sm"
                        value={quality.certificate?.completed || ""}
                        onChange={(e) =>
                          updateQuality(
                            "certificate.completed",
                            Number(e.target.value)
                          )
                        }
                      />
                    </div>
                    <div className="rounded-lg bg-purple-600 p-3 text-center text-white">
                      <p className="text-xs opacity-80">Total</p>
                      <p className="text-xl font-bold">
                        {(quality.certificate?.notYetApplied || 0) +
                          (quality.certificate?.underApplication || 0) +
                          (quality.certificate?.completed || 0)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Welding (Site Office only) */}
                {qualityTab === "siteOffice" && (
                  <div className="rounded-lg bg-green-50 border border-green-300 p-4">
                    <h5 className="font-semibold text-green-700 mb-3">
                      🔧 Welding Performance
                    </h5>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">
                          NDT Accepted
                        </label>
                        <input
                          type="number"
                          className="w-full rounded-lg border px-3 py-2 text-sm"
                          value={quality.siteOffice?.welding?.ndtAccepted || ""}
                          onChange={(e) =>
                            updateQuality(
                              "siteOffice.welding.ndtAccepted",
                              Number(e.target.value)
                            )
                          }
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">
                          NDT Rejected
                        </label>
                        <input
                          type="number"
                          className="w-full rounded-lg border px-3 py-2 text-sm"
                          value={quality.siteOffice?.welding?.ndtRejected || ""}
                          onChange={(e) =>
                            updateQuality(
                              "siteOffice.welding.ndtRejected",
                              Number(e.target.value)
                            )
                          }
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">
                          Rejection Rate Plan (%)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          className="w-full rounded-lg border px-3 py-2 text-sm"
                          value={
                            quality.siteOffice?.welding?.rejectionRatePlan || ""
                          }
                          onChange={(e) =>
                            updateQuality(
                              "siteOffice.welding.rejectionRatePlan",
                              Number(e.target.value)
                            )
                          }
                          placeholder="e.g. 2"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Activities Tab */}
            {activeTab === "activities" && (
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-teal-600 mb-3">
                    This Week
                  </h4>
                  {[
                    "engineering",
                    "procurement",
                    "construction",
                    "precommissioning",
                  ].map((cat) => (
                    <div key={cat} className="mb-4">
                      <label className="block text-xs font-semibold capitalize text-slate-600 mb-1">
                        {cat}
                      </label>
                      {(formData.thisWeekActivities?.[cat] || [""]).map(
                        (item: string, i: number) => (
                          <div key={i} className="flex gap-2 mb-1">
                            <input
                              className="flex-1 rounded border px-2 py-1 text-sm"
                              value={item}
                              onChange={(e) =>
                                updateActivity(
                                  "thisWeekActivities",
                                  cat,
                                  i,
                                  e.target.value
                                )
                              }
                            />
                            <button
                              type="button"
                              className="px-2 text-red-500 hover:bg-red-50 rounded"
                              onClick={() =>
                                removeActivityItem("thisWeekActivities", cat, i)
                              }
                            >
                              ×
                            </button>
                          </div>
                        )
                      )}
                      <button
                        type="button"
                        className="text-xs text-teal-600 hover:underline"
                        onClick={() =>
                          addActivityItem("thisWeekActivities", cat)
                        }
                      >
                        + Add
                      </button>
                    </div>
                  ))}
                </div>
                <div>
                  <h4 className="font-semibold text-blue-600 mb-3">
                    Next Week Plan
                  </h4>
                  {[
                    "engineering",
                    "procurement",
                    "construction",
                    "precommissioning",
                  ].map((cat) => (
                    <div key={cat} className="mb-4">
                      <label className="block text-xs font-semibold capitalize text-slate-600 mb-1">
                        {cat}
                      </label>
                      {(formData.nextWeekPlan?.[cat] || [""]).map(
                        (item: string, i: number) => (
                          <div key={i} className="flex gap-2 mb-1">
                            <input
                              className="flex-1 rounded border px-2 py-1 text-sm"
                              value={item}
                              onChange={(e) =>
                                updateActivity(
                                  "nextWeekPlan",
                                  cat,
                                  i,
                                  e.target.value
                                )
                              }
                            />
                            <button
                              type="button"
                              className="px-2 text-red-500 hover:bg-red-50 rounded"
                              onClick={() =>
                                removeActivityItem("nextWeekPlan", cat, i)
                              }
                            >
                              ×
                            </button>
                          </div>
                        )
                      )}
                      <button
                        type="button"
                        className="text-xs text-blue-600 hover:underline"
                        onClick={() => addActivityItem("nextWeekPlan", cat)}
                      >
                        + Add
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Milestones Tab */}
            {activeTab === "milestones" && (
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-semibold text-teal-600">
                      📅 Schedule Milestones
                    </h4>
                    <button
                      type="button"
                      onClick={() => addMilestone("schedule")}
                      className="text-xs bg-teal-600 text-white px-2 py-1 rounded"
                    >
                      + Add
                    </button>
                  </div>
                  {(formData.milestonesSchedule || []).map(
                    (m: Record<string, unknown>, i: number) => (
                      <div key={i} className="rounded-lg bg-slate-50 p-3 mb-2">
                        <div className="flex gap-2 mb-2">
                          <input
                            type="number"
                            placeholder="#"
                            className="w-10 rounded border px-1 py-1 text-sm text-center"
                            value={m.no as number}
                            onChange={(e) =>
                              updateMilestone(
                                "schedule",
                                i,
                                "no",
                                Number(e.target.value)
                              )
                            }
                          />
                          <input
                            placeholder="Description"
                            className="flex-1 rounded border px-2 py-1 text-sm"
                            value={m.description as string}
                            onChange={(e) =>
                              updateMilestone(
                                "schedule",
                                i,
                                "description",
                                e.target.value
                              )
                            }
                          />
                          <button
                            type="button"
                            className="text-red-500 px-2"
                            onClick={() => removeMilestone("schedule", i)}
                          >
                            ×
                          </button>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <input
                            type="date"
                            className="rounded border px-2 py-1 text-xs"
                            value={(m.planDate as string) || ""}
                            onChange={(e) =>
                              updateMilestone(
                                "schedule",
                                i,
                                "planDate",
                                e.target.value
                              )
                            }
                          />
                          <input
                            type="date"
                            className="rounded border px-2 py-1 text-xs"
                            value={(m.actualForecastDate as string) || ""}
                            onChange={(e) =>
                              updateMilestone(
                                "schedule",
                                i,
                                "actualForecastDate",
                                e.target.value
                              )
                            }
                          />
                          <select
                            className="rounded border px-2 py-1 text-xs"
                            value={(m.status as string) || "On Track"}
                            onChange={(e) =>
                              updateMilestone(
                                "schedule",
                                i,
                                "status",
                                e.target.value
                              )
                            }
                          >
                            <option value="Delay">🔴 Delay</option>
                            <option value="On Track">🟡 On Track</option>
                            <option value="Completed">🟢 Completed</option>
                          </select>
                        </div>
                      </div>
                    )
                  )}
                  {(!formData.milestonesSchedule ||
                    formData.milestonesSchedule.length === 0) && (
                    <p className="text-center text-slate-400 text-sm py-4">
                      No schedule milestones
                    </p>
                  )}
                </div>
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-semibold text-amber-600">
                      💰 Payment Milestones
                    </h4>
                    <button
                      type="button"
                      onClick={() => addMilestone("payment")}
                      className="text-xs bg-amber-600 text-white px-2 py-1 rounded"
                    >
                      + Add
                    </button>
                  </div>
                  {(formData.milestonesPayment || []).map(
                    (m: Record<string, unknown>, i: number) => (
                      <div key={i} className="rounded-lg bg-amber-50 p-3 mb-2">
                        <div className="flex gap-2 mb-2">
                          <input
                            type="number"
                            placeholder="#"
                            className="w-10 rounded border px-1 py-1 text-sm text-center"
                            value={m.no as number}
                            onChange={(e) =>
                              updateMilestone(
                                "payment",
                                i,
                                "no",
                                Number(e.target.value)
                              )
                            }
                          />
                          <input
                            placeholder="Description"
                            className="flex-1 rounded border px-2 py-1 text-sm"
                            value={m.description as string}
                            onChange={(e) =>
                              updateMilestone(
                                "payment",
                                i,
                                "description",
                                e.target.value
                              )
                            }
                          />
                          <button
                            type="button"
                            className="text-red-500 px-2"
                            onClick={() => removeMilestone("payment", i)}
                          >
                            ×
                          </button>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <input
                            type="date"
                            className="rounded border px-2 py-1 text-xs"
                            value={(m.planDate as string) || ""}
                            onChange={(e) =>
                              updateMilestone(
                                "payment",
                                i,
                                "planDate",
                                e.target.value
                              )
                            }
                          />
                          <input
                            type="date"
                            className="rounded border px-2 py-1 text-xs"
                            value={(m.actualForecastDate as string) || ""}
                            onChange={(e) =>
                              updateMilestone(
                                "payment",
                                i,
                                "actualForecastDate",
                                e.target.value
                              )
                            }
                          />
                          <select
                            className="rounded border px-2 py-1 text-xs"
                            value={(m.status as string) || "On Track"}
                            onChange={(e) =>
                              updateMilestone(
                                "payment",
                                i,
                                "status",
                                e.target.value
                              )
                            }
                          >
                            <option value="Delay">🔴 Delay</option>
                            <option value="On Track">🟡 On Track</option>
                            <option value="Completed">🟢 Completed</option>
                          </select>
                        </div>
                      </div>
                    )
                  )}
                  {(!formData.milestonesPayment ||
                    formData.milestonesPayment.length === 0) && (
                    <p className="text-center text-slate-400 text-sm py-4">
                      No payment milestones
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Uploads Tab */}
            {activeTab === "uploads" && (
              <div className="grid grid-cols-3 gap-4">
                {[
                  "sCurveGeneral",
                  "sCurveEngineering",
                  "sCurveProcurement",
                  "sCurveConstruction",
                  "cashFlow",
                  "qrPhotos",
                  "qrVideos",
                  "qrReport",
                ].map((field) => (
                  <div key={field} className="rounded-lg bg-slate-50 p-3">
                    <label className="block text-xs font-semibold text-slate-600 mb-2">
                      {field
                        .replace(/([A-Z])/g, " $1")
                        .replace("s Curve", "S-Curve")}
                    </label>
                    {formData.uploads?.[field] ? (
                      <div>
                        <img
                          src={formData.uploads[field].data}
                          alt={field}
                          className="w-full h-20 object-cover rounded mb-2"
                        />
                        <button
                          type="button"
                          className="w-full text-xs bg-red-100 text-red-600 py-1 rounded"
                          onClick={() =>
                            setFormData({
                              ...formData,
                              uploads: { ...formData.uploads, [field]: null },
                            })
                          }
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <label className="block border-2 border-dashed border-slate-300 rounded-lg p-4 text-center cursor-pointer hover:border-teal-500">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleFileUpload(field, e)}
                        />
                        <span className="text-xs text-slate-500">
                          Click to upload
                        </span>
                      </label>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 border-t border-slate-200 p-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-100 text-slate-600 font-medium text-sm hover:bg-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-teal-600 text-white font-medium text-sm hover:bg-teal-700 disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <span className="animate-spin">⏳</span>
              ) : (
                <Icons.Save />
              )}{" "}
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
