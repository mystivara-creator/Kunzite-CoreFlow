import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { PresetId } from '../types/coreflow';
import { HARDWARE_SPEC_TABLE, VERSION_HISTORY } from '../data/presets';

interface EvolutionSpecsViewProps {
  activePreset: PresetId;
  onLoadReleaseIntoWorkbench: (preset: Exclude<PresetId, 'custom'>) => void;
}

export const EvolutionSpecsView: React.FC<EvolutionSpecsViewProps> = ({
  activePreset,
  onLoadReleaseIntoWorkbench,
}) => {
  return (
    <div className="space-y-10">
      <div>
        <p className="text-xs text-slate-500">
          Hardware Target Architecture · Chronological Kernel Calibration History
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
          SM6475 Architecture &amp; Release Evolution
        </h1>
      </div>

      {/* Hardware Target Specification Table */}
      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-sm font-semibold text-slate-900">
            Target Hardware Platform (kunzite)
          </h2>
          <p className="text-xs text-slate-500">
            Strictly engineered for Redmi Note 15 5G — combining conflicting performance modules is unsupported
          </p>
        </div>

        <div className="grid grid-cols-1 divide-y divide-slate-200 sm:grid-cols-2 sm:divide-x lg:grid-cols-3">
          {HARDWARE_SPEC_TABLE.map((spec) => (
            <div key={spec.label} className="p-4">
              <p className="text-xs text-slate-500">{spec.label}</p>
              <p className="mt-1 text-sm font-medium text-slate-900">{spec.value}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Chronological Evolution Log */}
      <section className="space-y-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Chronological Calibration &amp; Root-Cause Bug Log
          </h2>
          <p className="text-xs text-slate-500">
            Load any historical iteration directly into the Workbench to inspect its exact sysfs deltas and advisories
          </p>
        </div>

        <div className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
          {VERSION_HISTORY.map((rel) => {
            const isLoaded = activePreset === rel.id;
            return (
              <article key={rel.id} className="p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                      <span className="font-mono font-semibold text-slate-800">
                        {rel.versionTag}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{rel.date}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono">{rel.executionMethod}</span>
                      <span aria-hidden="true">·</span>
                      <span
                        className={
                          rel.status === 'Recommended'
                            ? 'font-semibold text-emerald-700'
                            : rel.status === 'Experimental'
                              ? 'font-semibold text-amber-700'
                              : 'text-slate-600'
                        }
                      >
                        {rel.status}
                      </span>
                    </div>
                    <h3 className="mt-1 text-base font-semibold text-slate-900">{rel.title}</h3>
                    <p className="mt-1 text-sm text-slate-600 max-w-3xl leading-relaxed">
                      {rel.summary}
                    </p>
                  </div>

                  {rel.id !== 'custom' && (
                    <button
                      type="button"
                      onClick={() => onLoadReleaseIntoWorkbench(rel.id as Exclude<PresetId, 'custom'>)}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                        isLoaded
                          ? 'border border-sky-600 bg-sky-50 text-sky-900'
                          : 'border border-slate-300 bg-white text-slate-800 hover:bg-slate-50'
                      }`}
                    >
                      {isLoaded ? 'Loaded in Workbench' : 'Load in Workbench'}
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                <div className="mt-4 space-y-1.5">
                  <p className="text-xs font-semibold text-slate-700">Engineering Changes</p>
                  <ul className="list-disc space-y-1 pl-5 text-xs text-slate-600 leading-relaxed">
                    {rel.highlights.map((h, i) => (
                      <li key={i}>{h}</li>
                    ))}
                  </ul>
                </div>

                {rel.knownIssues && rel.knownIssues.length > 0 && (
                  <div className="mt-4 rounded-md border border-amber-200 bg-amber-50/60 p-3.5">
                    <p className="text-xs font-semibold text-amber-900">
                      Documented Regressions Resolved in vFinal 2.2
                    </p>
                    <ul className="mt-1.5 list-disc space-y-1 pl-5 text-xs text-amber-900/90 leading-relaxed">
                      {rel.knownIssues.map((issue, idx) => (
                        <li key={idx}>{issue}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
};
