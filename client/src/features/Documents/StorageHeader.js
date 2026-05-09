import React from "react";
import { HardDrive, Files, FolderOpen, AlertTriangle } from "lucide-react";

const getUsageColor = (pct) => {
  if (pct >= 90) return "var(--color-error)";
  if (pct >= 70) return "var(--color-warning)";
  return "var(--color-success)";
};

const StorageHeader = ({ storage, onUpgradeClick }) => {
  if (!storage) return null;

  const { quotaMB, usedMB, fileCount, subFolders, usedPercent } = storage;
  const pct = usedPercent || 0;
  const color = getUsageColor(pct);
  const folderCount = (subFolders || []).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-6)' }}>
         <div className="nc-stat-card">
            <span className="metric-label">Files Hosted</span>
            <span className="metric-value">{fileCount ?? 0}</span>
         </div>
         <div className="nc-stat-card">
            <span className="metric-label">Folders</span>
            <span className="metric-value">{folderCount}</span>
         </div>
         <div className="nc-stat-card" style={{ flex: 2 }}>
            <span className="metric-label">Storage Usage</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginTop: 'var(--space-1)' }}>
               <div style={{ flex: 1, height: '8px', background: 'var(--color-bg-elevated)', borderRadius: 'var(--radius-full)', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.min(pct, 100)}%`, background: color, borderRadius: 'var(--radius-full)', transition: 'width 0.5s ease' }} />
               </div>
               <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-bold)', color }}>{pct.toFixed(1)}%</span>
            </div>
            <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginTop: 'var(--space-1)' }}>
               {usedMB?.toFixed(1) ?? "0"} MB of {quotaMB} MB used
            </span>
         </div>
      </div>

      {pct >= 90 && (
        <div className="badge badge-error" style={{ padding: 'var(--space-3) var(--space-4)', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
             <AlertTriangle size={16} />
             <span>Running low on storage space.</span>
          </div>
          <button className="btn btn--sm btn-ghost" style={{ color: 'var(--color-error)' }} onClick={onUpgradeClick}>Upgrade Quota</button>
        </div>
      )}
    </div>
  );
};

export default StorageHeader;
