import React from 'react';

function ReportSightingModal({ isOpen, onClose }) {
  if (!isOpen) return null;
  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 px-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="max-w-md rounded-sm border border-outline-variant/30 bg-surface-container-low p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="report-title"
      >
        <h2 id="report-title" className="text-lg font-bold text-on-surface">
          Report a sighting
        </h2>
        <p className="mt-3 text-sm text-on-surface-variant">
          Crowdsourced reporting is not wired to the API yet. For development, add spawns through the backend seed
          script or POST endpoint described in the project README.
        </p>
        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full rounded-sm bg-surface-variant py-2 text-xs font-bold uppercase tracking-widest text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
        >
          Close
        </button>
      </div>
    </div>
  );
}

export default ReportSightingModal;
