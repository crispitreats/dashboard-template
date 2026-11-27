export function AppleLogoIcon({ size = 24 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.96 6.33c.67-.81 1.12-1.94 1-3.08-.96.04-2.13.64-2.82 1.45-.61.71-1.15 1.86-1.01 2.97 1.08.08 2.16-.54 2.83-1.34Z" />
    </svg>
  );
}

export function HouseIcon({ size = 20 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 3.172 2.293 11.293a1 1 0 0 0 .64 1.768H5v7a1 1 0 0 0 1 1h4.5v-5.5h3V21H18a1 1 0 0 0 1-1v-7h2.067a1 1 0 0 0 .64-1.768L12 3.172Z" />
    </svg>
  );
}

export function SquareIcon({ size = 20, rotation = 0 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <rect
        x="5.5"
        y="5.5"
        width="13"
        height="13"
        rx="1.5"
        transform={rotation ? `rotate(${rotation} 12 12)` : undefined}
      />
    </svg>
  );
}

export function SuperAdminConsoleIcon({ size = 20 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5Zm4.207 3.793a1 1 0 0 0-1.414 1.414L7.586 12l-1.793 1.793a1 1 0 1 0 1.414 1.414l2.5-2.5a1 1 0 0 0 0-1.414l-2.5-2.5ZM12 14a1 1 0 1 0 0 2h5a1 1 0 1 0 0-2h-5Z"
      />
    </svg>
  );
}

export function VersionHistoryIcon({ size = 20 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2.5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 12 2.5Zm.85 5a.85.85 0 0 0-1.7 0v4.85c0 .31.17.6.44.75l3.35 1.85a.85.85 0 1 0 .82-1.49l-2.91-1.6V7.5Z"
      />
    </svg>
  );
}

export function HelpIcon({ size = 20 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2.5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 12 2.5Zm-.02 4.65c-1.56 0-2.73.92-2.93 2.3a.85.85 0 0 0 1.68.24c.09-.56.55-.89 1.25-.89.66 0 1.15.36 1.15.92 0 .45-.23.75-.91 1.19-.82.52-1.15 1.1-1.15 2.04v.25a.85.85 0 1 0 1.7 0v-.2c0-.47.16-.72.73-1.08.92-.59 1.4-1.25 1.4-2.28 0-1.49-1.21-2.49-2.92-2.49Zm.02 8.2a1.05 1.05 0 1 0 0 2.1 1.05 1.05 0 0 0 0-2.1Z"
      />
    </svg>
  );
}

export function UserIcon({ size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 12a4.5 4.5 0 1 0-4.5-4.5A4.5 4.5 0 0 0 12 12Zm0 2.25c-4.14 0-7.5 2.02-7.5 4.5a.75.75 0 0 0 .75.75h13.5a.75.75 0 0 0 .75-.75c0-2.48-3.36-4.5-7.5-4.5Z" />
    </svg>
  );
}

export function MenuIcon({ size = 20 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="18" x2="20" y2="18" />
    </svg>
  );
}

export function RailToggleIcon({ collapsed, size = 16 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {collapsed ? (
        <polyline points="9 6 15 12 9 18" />
      ) : (
        <polyline points="15 6 9 12 15 18" />
      )}
    </svg>
  );
}

export function CaretIcon({ expanded = false, size = 10 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 12 12"
      fill="currentColor"
      aria-hidden="true"
      style={{
        transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
        transition: 'transform 160ms ease',
      }}
    >
      <path d="M4 2.2a.7.7 0 0 1 1.12-.56l4.6 3.5a.7.7 0 0 1 0 1.12l-4.6 3.5A.7.7 0 0 1 4 9.2V2.2Z" />
    </svg>
  );
}

export function ModeProductIcon({ mode, size = 15 }) {
  if (mode === 'dashboards') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <rect x="3.5" y="3.5" width="7.5" height="9.5" rx="2" />
        <rect x="13" y="3.5" width="7.5" height="5.5" rx="2" />
        <rect x="3.5" y="15" width="7.5" height="5.5" rx="2" />
        <rect x="13" y="11" width="7.5" height="9.5" rx="2" />
      </svg>
    );
  }
  if (mode === 'data') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <ellipse cx="12" cy="5.5" rx="7.5" ry="3" />
        <path d="M4.5 8.1v3.4c0 1.66 3.36 3 7.5 3s7.5-1.34 7.5-3V8.1c-1.56 1.28-4.36 2-7.5 2s-5.94-.72-7.5-2Z" />
        <path d="M4.5 14.1v3.4c0 1.66 3.36 3 7.5 3s7.5-1.34 7.5-3v-3.4c-1.56 1.28-4.36 2-7.5 2s-5.94-.72-7.5-2Z" />
      </svg>
    );
  }
  if (mode === 'analytics') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <rect x="4" y="11" width="4" height="9" rx="1.2" />
        <rect x="10" y="4" width="4" height="16" rx="1.2" />
        <rect x="16" y="8" width="4" height="12" rx="1.2" />
      </svg>
    );
  }
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M14.7 3.3a1 1 0 0 1 1.4 0l4.6 4.6a1 1 0 0 1 0 1.4l-2.3 2.3a1 1 0 0 1-1.4 0l-1.15-1.15-8.9 8.9a1.8 1.8 0 0 1-2.55 0l-.75-.75a1.8 1.8 0 0 1 0-2.55l8.9-8.9L11.4 5.9a1 1 0 0 1 0-1.4l1.1-1.1a3.6 3.6 0 0 1 2.2-.1Z" />
    </svg>
  );
}
