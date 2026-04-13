import React from "react";
import { HardDrive, Files, FolderOpen, AlertTriangle } from "lucide-react";

const getUsageColor = (pct) => {
  if (pct >= 90) return "red";
  if (pct >= 70) return "yellow";
  return "green";
};

const StorageHeader = ({ storage, onUpgradeClick }) => {
  if (!storage) return null;

  const { quotaMB, usedMB, fileCount, subFolders, usedPercent } = storage;
  const pct = usedPercent || 0;
  const color = getUsageColor(pct);
  const folderCount = (subFolders || []).length;

  return (
    <>
      <div className="drive-header">
        <div className="drive-header-top">
          <div className="drive-header-title">
            <div className="drive-header-icon">
              <HardDrive size={18} />
            </div>
            <h1>My Drive</h1>
          </div>

          <div className="drive-header-stats">
            <div className="drive-stat-chip">
              <Files size={13} />
              <strong>{fileCount ?? 0}</strong> Files
            </div>
            <div className="drive-stat-chip">
              <FolderOpen size={13} />
              <strong>{folderCount}</strong> Folders
            </div>
          </div>
        </div>

        <div className="drive-quota-bar-wrap">
          <span className="drive-quota-label">
            {usedMB?.toFixed(1) ?? "0"} MB used of {quotaMB} MB
          </span>
          <div className="drive-quota-track">
            <div
              className={`drive-quota-fill ${color}`}
              style={{ width: `${Math.min(pct, 100)}%` }}
            />
          </div>
          <span className={`drive-quota-pct ${color}`}>{pct.toFixed(1)}%</span>
        </div>
      </div>

      {pct >= 90 && (
        <div className="drive-low-banner">
          <AlertTriangle size={16} />
          <span>
            Running low on storage ({pct.toFixed(1)}% used). Upgrade your quota to continue uploading.
          </span>
          <button className="drive-low-banner-btn" onClick={onUpgradeClick}>
            Raise a Ticket ↗
          </button>
        </div>
      )}
    </>
  );
};

export default StorageHeader;
