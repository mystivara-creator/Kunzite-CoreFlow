import React, { useMemo, useState } from 'react';
import { RotateCcw, Search, CheckCircle2, AlertTriangle, AlertOctagon, SlidersHorizontal } from 'lucide-react';
import {
  CoreFlowConfig,
  DiagnosticFinding,
  ParameterSpec,
  PresetId,
  SubsystemId,
} from '../types/coreflow';
import {
  PARAMETER_SPECS,
  PRESET_METADATA,
  STOCK_HYPEROS_CONFIG,
  SUBSYSTEM_LABELS,
} from '../data/presets';

interface WorkbenchViewProps {
  config: CoreFlowConfig;
  activePreset: PresetId;
  findings: DiagnosticFinding[];
  onSelectPreset: (preset: Exclude<PresetId, 'custom'>) => void;
  onUpdateParam: <K extends keyof CoreFlowConfig>(key: K, value: CoreFlowConfig[K]) => void;
  onApplyConfig: (updater: (prev: CoreFlowConfig) => CoreFlowConfig) => void;
}

export const WorkbenchView: React.FC<WorkbenchViewProps> = ({
  config,
  activePreset,
  findings,
  onSelectPreset,
  onUpdateParam,
  onApplyConfig,
}) => {
  const [selectedSubsystem, setSelectedSubsystem] = useState<'all' | SubsystemId>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyModified, setOnlyModified] = useState(false);

  const modifiedCount = useMemo(() => {
    return PARAMETER_SPECS.filter(
      (spec) => config[spec.key] !== STOCK_HYPEROS_CONFIG[spec.key]
    ).length;
  }, [config]);

  const filteredSpecs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return PARAMETER_SPECS.filter((spec) => {
      if (selectedSubsystem !== 'all' && spec.subsystem !== selectedSubsystem) {
        return false;
      }
      if (onlyModified && config[spec.key] === STOCK_HYPEROS_CONFIG[spec.key]) {
        return false;
      }
      if (!q) return true;
      return (
        spec.label.toLowerCase().includes(q) ||
        spec.targetNode.toLowerCase().includes(q) ||
        spec.rationale.toLowerCase().includes(q) ||
        SUBSYSTEM_LABELS[spec.subsystem].name.toLowerCase().includes(q)
      );
    });
  }, [selectedSubsystem, searchQuery, onlyModified, config]);

  const formatVal = (spec: ParameterSpec, val: unknown): string => {
    if (typeof val === 'boolean') return val ? 'true' : 'false';
    if (spec.key === 'topAppUclampMin' && typeof val === 'number') {
      return `${val.toFixed(2)}%`;
    }
    if (spec.unit && typeof val === 'number') {
      return `${val} ${spec.unit}`;
    }
    return String(val);
  };

  return (
    <div className="space-y-8">
      {/* Header & Preset Selector */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs text-slate-500">
            Xiaomi Redmi Note 15 5G (kunzite) · Snapdragon 6 Gen 3 (SM6475) · HyperOS
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
            Sysfs &amp; Kernel Parameter Workbench
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap items-center gap-1 rounded-lg bg-slate-200/70 p-1">
            {PRESET_METADATA.map((preset) => {
              const isActive = activePreset === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => onSelectPreset(preset.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-sky-600 ${
                    isActive
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => onSelectPreset('vfinal_22')}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset to vFinal
          </button>
        </div>
      </div>

      {/* Summary Strip */}
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-slate-200 bg-slate-200 sm:grid-cols-4">
        <div className="bg-white p-4">
          <p className="text-xs text-slate-500">Active Profile</p>
          <p className="mt-1 text-base font-semibold text-slate-900">
            {activePreset === 'custom'
              ? 'Custom Tuned'
              : PRESET_METADATA.find((p) => p.id === activePreset)?.label}
          </p>
          <p className="mt-0.5 text-xs text-slate-500 font-mono tabular-nums">
            {modifiedCount} / {PARAMETER_SPECS.length} nodes modified vs stock
          </p>
        </div>

        <div className="bg-white p-4">
          <p className="text-xs text-slate-500">WALT Rate Limits (up / down)</p>
          <p className="mt-1 text-base font-semibold text-slate-900 font-mono tabular-nums">
            {config.upRateLimitUs} µs / {config.downRateLimitUs} µs
          </p>
          <p className="mt-0.5 text-xs text-slate-500 font-mono tabular-nums">
            hispeed_load {config.hispeedLoad}% · stats {config.schedSchedstats}
          </p>
        </div>

        <div className="bg-white p-4">
          <p className="text-xs text-slate-500">VM Swappiness &amp; Dirty Ratio</p>
          <p className="mt-1 text-base font-semibold text-slate-900 font-mono tabular-nums">
            {config.swappiness} · {config.dirtyBackgroundRatio}% / {config.dirtyRatio}%
          </p>
          <p className="mt-0.5 text-xs text-slate-500 font-mono tabular-nums">
            page-cluster {config.pageCluster} · boost {config.watermarkBoostFactor}
          </p>
        </div>

        <div className="bg-white p-4">
          <p className="text-xs text-slate-500">Primary UFS Queue (sda–sdf)</p>
          <p className="mt-1 text-base font-semibold text-slate-900 font-mono tabular-nums">
            {config.sdaScheduler} · {config.nrRequests} reqs
          </p>
          <p className="mt-0.5 text-xs text-slate-500 font-mono tabular-nums">
            read_ahead {config.readAheadKb} KB · batch {config.ioschedFifoBatch}
          </p>
        </div>
      </div>

      {/* Hardware Safety & Conflict Analyzer */}
      <section aria-label="Hardware Safety Diagnostics" className="rounded-lg border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 px-5 py-3.5">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              SM6475 / PM6450 Hardware &amp; Conflict Verification
            </h2>
            <p className="text-xs text-slate-500">
              Validates current tunables against documented HyperOS Audio HAL, touch latency, and PMIC rules
            </p>
          </div>
          <span className="text-xs font-mono tabular-nums text-slate-600">
            {findings.length === 1 && findings[0].severity === 'nominal'
              ? '0 warnings · Nominal'
              : `${findings.length} active ${findings.length === 1 ? 'advisory' : 'advisories'}`}
          </span>
        </div>

        <div className="divide-y divide-slate-200">
          {findings.map((finding) => (
            <div
              key={finding.id}
              className="flex flex-col gap-3 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-start gap-3">
                {finding.severity === 'nominal' && (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                )}
                {finding.severity === 'warning' && (
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                )}
                {finding.severity === 'critical' && (
                  <AlertOctagon className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                )}
                <div>
                  <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                    <span
                      className={
                        finding.severity === 'critical'
                          ? 'font-semibold text-red-700'
                          : finding.severity === 'warning'
                            ? 'font-semibold text-amber-700'
                            : 'font-semibold text-emerald-700'
                      }
                    >
                      {finding.severity === 'critical'
                        ? 'Critical'
                        : finding.severity === 'warning'
                          ? 'Advisory'
                          : 'Nominal'}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{SUBSYSTEM_LABELS[finding.subsystem].name}</span>
                  </div>
                  <p className="mt-0.5 text-sm font-medium text-slate-900">{finding.title}</p>
                  <p className="mt-0.5 text-xs text-slate-600 leading-relaxed">{finding.detail}</p>
                </div>
              </div>

              {finding.applyFix && finding.fixActionLabel && (
                <button
                  type="button"
                  onClick={() => onApplyConfig(finding.applyFix!)}
                  className="self-start sm:self-center rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-medium text-white hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
                >
                  {finding.fixActionLabel}
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Filter & Search Toolbar */}
      <div className="space-y-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search sysfs node, property, or rationale..."
              aria-label="Search kernel parameters"
              className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-600 focus:outline-none"
            />
          </div>

          <button
            type="button"
            onClick={() => setOnlyModified((prev) => !prev)}
            aria-pressed={onlyModified}
            className={`inline-flex items-center gap-2 rounded-lg border px-3.5 py-2 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              onlyModified
                ? 'border-sky-600 bg-sky-50 text-sky-900'
                : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Modified from Stock Only ({modifiedCount})
          </button>
        </div>

        {/* Interactive Subsystem Filter Buttons */}
        <div className="flex flex-wrap items-center gap-1 rounded-lg bg-slate-200/70 p-1">
          <button
            type="button"
            onClick={() => setSelectedSubsystem('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
              selectedSubsystem === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All ({PARAMETER_SPECS.length})
          </button>
          {(Object.keys(SUBSYSTEM_LABELS) as SubsystemId[]).map((subId) => {
            const count = PARAMETER_SPECS.filter((s) => s.subsystem === subId).length;
            return (
              <button
                key={subId}
                type="button"
                onClick={() => setSelectedSubsystem(subId)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  selectedSubsystem === subId
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {SUBSYSTEM_LABELS[subId].shortName} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* High-Density Parameter Table */}
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        {filteredSpecs.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm font-medium text-slate-900">
              No kernel or sysfs parameters match the current filter
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Clear your search term or show unchanged stock parameters to inspect all 38 nodes.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedSubsystem('all');
                setOnlyModified(false);
              }}
              className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-800 transition-colors whitespace-nowrap"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold text-slate-600">
                  <th className="py-3 pl-5 pr-4">Parameter &amp; Hardware Rationale</th>
                  <th className="px-4 py-3">Sysfs / Prop Target</th>
                  <th className="px-4 py-3 text-right">Stock Baseline</th>
                  <th className="py-3 pl-4 pr-5 text-right w-64">Active Tuning Control</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {filteredSpecs.map((spec) => {
                  const currentVal = config[spec.key];
                  const stockVal = STOCK_HYPEROS_CONFIG[spec.key];
                  const isChanged = currentVal !== stockVal;

                  return (
                    <tr
                      key={spec.key}
                      className="hover:bg-slate-50/70 transition-colors align-top"
                    >
                      <td className="py-3.5 pl-5 pr-4">
                        <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                          <span>{SUBSYSTEM_LABELS[spec.subsystem].shortName}</span>
                          <span aria-hidden="true">·</span>
                          <span className={isChanged ? 'font-medium text-sky-700' : 'text-slate-400'}>
                            {isChanged ? 'Tuned' : 'Stock'}
                          </span>
                        </div>
                        <p className="mt-0.5 font-medium text-slate-900">{spec.label}</p>
                        <p className="mt-0.5 text-xs text-slate-500 max-w-xl leading-relaxed">
                          {spec.rationale}
                        </p>
                      </td>

                      <td className="px-4 py-3.5 font-mono text-xs text-slate-600 break-all">
                        {spec.targetNode}
                      </td>

                      <td className="px-4 py-3.5 text-right font-mono text-xs tabular-nums text-slate-500 whitespace-nowrap">
                        {formatVal(spec, stockVal)}
                      </td>

                      <td className="py-3.5 pl-4 pr-5 text-right">
                        {spec.controlType === 'toggle' && (
                          <div className="inline-flex rounded-md border border-slate-300 bg-slate-100 p-0.5">
                            <button
                              type="button"
                              onClick={() =>
                                onUpdateParam(spec.key, true as CoreFlowConfig[typeof spec.key])
                              }
                              className={`px-2.5 py-1 text-xs font-mono rounded-xs transition-colors whitespace-nowrap ${
                                Boolean(currentVal)
                                  ? 'bg-slate-900 text-white'
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              Enabled
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                onUpdateParam(spec.key, false as CoreFlowConfig[typeof spec.key])
                              }
                              className={`px-2.5 py-1 text-xs font-mono rounded-xs transition-colors whitespace-nowrap ${
                                !currentVal
                                  ? 'bg-slate-900 text-white'
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              Disabled
                            </button>
                          </div>
                        )}

                        {spec.controlType === 'select' && spec.options && (
                          <select
                            aria-label={spec.label}
                            value={String(currentVal)}
                            onChange={(e) => {
                              const raw = e.target.value;
                              const matched = spec.options!.find((o) => String(o.value) === raw);
                              if (matched) {
                                onUpdateParam(spec.key, matched.value);
                              }
                            }}
                            className="w-full max-w-[230px] rounded-md border border-slate-300 bg-white px-2.5 py-1.5 font-mono text-xs tabular-nums text-slate-900 focus:border-sky-600 focus:outline-none"
                          >
                            {spec.options.map((opt) => (
                              <option key={String(opt.value)} value={String(opt.value)}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        )}

                        {spec.controlType === 'number' && (
                          <div className="flex flex-col items-end gap-1.5">
                            <div className="flex items-center gap-1.5">
                              <input
                                type="number"
                                aria-label={spec.label}
                                min={spec.min}
                                max={spec.max}
                                step={spec.step ?? 1}
                                value={Number(currentVal)}
                                onChange={(e) => {
                                  const num = Number(e.target.value);
                                  if (!Number.isNaN(num)) {
                                    onUpdateParam(
                                      spec.key,
                                      num as CoreFlowConfig[typeof spec.key]
                                    );
                                  }
                                }}
                                className="w-24 rounded-md border border-slate-300 bg-white px-2.5 py-1 text-right font-mono text-xs tabular-nums text-slate-900 focus:border-sky-600 focus:outline-none"
                              />
                              {spec.unit && (
                                <span className="w-7 text-left font-mono text-xs text-slate-500">
                                  {spec.unit}
                                </span>
                              )}
                            </div>
                            <input
                              type="range"
                              aria-label={`${spec.label} slider`}
                              min={spec.min}
                              max={spec.max}
                              step={spec.step ?? 1}
                              value={Number(currentVal)}
                              onChange={(e) =>
                                onUpdateParam(
                                  spec.key,
                                  Number(e.target.value) as CoreFlowConfig[typeof spec.key]
                                )
                              }
                              className="w-36 accent-sky-700 cursor-pointer"
                            />
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
