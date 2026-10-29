import React, { useMemo, useState } from 'react';
import { Copy, Check, Download, Archive } from 'lucide-react';
import { CoreFlowConfig } from '../types/coreflow';
import {
  compileModuleProp,
  compileServiceSh,
  compileUninstallSh,
  compileUpdateBinary,
  compileUpdateJson,
} from '../utils/moduleCompiler';

type ArtifactTab = 'service.sh' | 'uninstall.sh' | 'module.prop' | 'update-binary' | 'update.json';

interface ModuleBuilderViewProps {
  config: CoreFlowConfig;
  onUpdateParam: <K extends keyof CoreFlowConfig>(key: K, value: CoreFlowConfig[K]) => void;
  onExportZip: () => Promise<void>;
  isExporting: boolean;
}

export const ModuleBuilderView: React.FC<ModuleBuilderViewProps> = ({
  config,
  onUpdateParam,
  onExportZip,
  isExporting,
}) => {
  const [activeFile, setActiveFile] = useState<ArtifactTab>('service.sh');
  const [copied, setCopied] = useState(false);

  const compiledFiles = useMemo<Record<ArtifactTab, string>>(
    () => ({
      'service.sh': compileServiceSh(config),
      'uninstall.sh': compileUninstallSh(),
      'module.prop': compileModuleProp(config),
      'update-binary': compileUpdateBinary(config),
      'update.json': compileUpdateJson(config),
    }),
    [config]
  );

  const currentCode = compiledFiles[activeFile];
  const lines = useMemo(() => currentCode.split('\n'), [currentCode]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Fallback textarea copy if clipboard permission blocked in iframe
      const ta = document.createElement('textarea');
      ta.value = currentCode;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  };

  const handleDownloadSingleFile = () => {
    const blob = new Blob([currentCode], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = activeFile;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs text-slate-500">
            KernelSU Next · Magisk · APatch Compatible Archive Structure
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
            Module Script Compiler &amp; ZIP Builder
          </h1>
        </div>

        <button
          type="button"
          onClick={onExportZip}
          disabled={isExporting}
          className="inline-flex items-center gap-2 rounded-lg bg-sky-700 px-4 py-2.5 text-xs font-semibold text-white hover:bg-sky-800 disabled:opacity-60 transition-colors whitespace-nowrap shrink-0"
        >
          <Archive className="h-4 w-4" />
          {isExporting ? 'Packaging ZIP...' : 'Download Flashable Module (.zip)'}
        </button>
      </div>

      {/* Module Manifest Metadata Form */}
      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="flex flex-col gap-4 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Manifest Properties (module.prop)</h2>
            <p className="text-xs text-slate-500">
              Customize package identifiers before exporting your flashable archive
            </p>
          </div>

          <label className="inline-flex items-center gap-2 text-xs text-slate-700 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={config.fixInstallerServiceSh}
              onChange={(e) => onUpdateParam('fixInstallerServiceSh', e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 accent-sky-700"
            />
            <span>Extract service.sh in META-INF/update-binary (Recommended vFinal fix)</span>
          </label>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label htmlFor="mod-id" className="block text-xs font-medium text-slate-700">
              Module ID
            </label>
            <input
              id="mod-id"
              type="text"
              value={config.moduleId}
              onChange={(e) => onUpdateParam('moduleId', e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 font-mono text-xs text-slate-900 focus:border-sky-600 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="mod-name" className="block text-xs font-medium text-slate-700">
              Module Name
            </label>
            <input
              id="mod-name"
              type="text"
              value={config.moduleName}
              onChange={(e) => onUpdateParam('moduleName', e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-900 focus:border-sky-600 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="mod-ver" className="block text-xs font-medium text-slate-700">
              Version String
            </label>
            <input
              id="mod-ver"
              type="text"
              value={config.moduleVersion}
              onChange={(e) => onUpdateParam('moduleVersion', e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 font-mono text-xs text-slate-900 focus:border-sky-600 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="mod-code" className="block text-xs font-medium text-slate-700">
              Version Code (Integer)
            </label>
            <input
              id="mod-code"
              type="number"
              value={config.moduleVersionCode}
              onChange={(e) =>
                onUpdateParam('moduleVersionCode', Number(e.target.value) || 100)
              }
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 font-mono text-xs tabular-nums text-slate-900 focus:border-sky-600 focus:outline-none"
            />
          </div>
        </div>
      </section>

      {/* Code Viewer */}
      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-2.5">
          <div className="flex flex-wrap items-center gap-1">
            {(
              [
                'service.sh',
                'uninstall.sh',
                'module.prop',
                'update-binary',
                'update.json',
              ] as ArtifactTab[]
            ).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveFile(tab)}
                className={`px-3 py-1.5 font-mono text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  activeFile === tab
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
                }`}
              >
                {tab === 'update-binary' ? 'META-INF/.../update-binary' : tab}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono tabular-nums text-slate-500">
              {lines.length} lines · {new Blob([currentCode]).size} B
            </span>
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  Copy File
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleDownloadSingleFile}
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
            >
              <Download className="h-3.5 w-3.5" />
              Save {activeFile}
            </button>
          </div>
        </div>

        <div className="max-h-[560px] overflow-auto bg-slate-950 p-4 font-mono text-xs leading-relaxed text-slate-100">
          <table className="w-full border-collapse">
            <tbody>
              {lines.map((line, idx) => (
                <tr key={idx} className="hover:bg-slate-900/80">
                  <td className="select-none pr-4 text-right text-slate-500 tabular-nums w-10 align-top">
                    {idx + 1}
                  </td>
                  <td className="whitespace-pre text-slate-100">{line || ' '}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
