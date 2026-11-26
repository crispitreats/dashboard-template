import { useEffect, useRef, useState } from 'react';
import { ROLES } from '../data/roles';
import { AppleLogoIcon, MenuIcon, UserIcon } from './Icons';

export function Header({ assignedRoles, onToggleRole, onOpenMobileNav }) {
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!roleMenuOpen) return;
    function handleOutsideClick(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setRoleMenuOpen(false);
      }
    }
    function handleEscape(event) {
      if (event.key === 'Escape') setRoleMenuOpen(false);
    }
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [roleMenuOpen]);

  const activeRoleObjects = ROLES.filter((role) =>
    assignedRoles.includes(role.id)
  );

  return (
    <header className="app-header">
      <div className="header-left">
        <button
          type="button"
          className="mobile-menu-btn"
          onClick={onOpenMobileNav}
          aria-label="Open navigation"
        >
          <MenuIcon size={20} />
        </button>

        <div className="logo-slot" title="Apple">
          <AppleLogoIcon size={17} />
        </div>

        <div className="header-divider" aria-hidden="true" />

        <div className="site-identity">
          <h1 className="site-code">iSearch</h1>
          <p className="site-subtitle">Search Portal</p>
        </div>
      </div>

      <div className="header-right" ref={menuRef}>
        <button
          type="button"
          className="user-pill"
          onClick={() => setRoleMenuOpen((open) => !open)}
          aria-expanded={roleMenuOpen}
          aria-haspopup="menu"
          title="Click to toggle assigned roles"
        >
          <span className="user-avatar" aria-hidden="true">
            <UserIcon size={12} />
          </span>

          <span className="user-name">Dummy</span>

          <span className="role-balls" aria-label="Assigned roles">
            {activeRoleObjects.length > 0 ? (
              activeRoleObjects.map((role) => (
                <span
                  key={role.id}
                  className="role-ball"
                  style={{ backgroundColor: role.color }}
                  title={role.label}
                />
              ))
            ) : (
              <span className="role-ball role-ball--empty" title="No role" />
            )}
          </span>
        </button>

        {roleMenuOpen && (
          <div className="role-popover" role="menu" aria-label="User Roles">
            <div className="role-popover-header">Roles</div>
            <div className="role-popover-list">
              {ROLES.map((role) => {
                const isSelected = assignedRoles.includes(role.id);
                return (
                  <button
                    key={role.id}
                    type="button"
                    role="menuitemcheckbox"
                    aria-checked={isSelected}
                    className={`role-option ${isSelected ? 'is-selected' : ''}`}
                    onClick={() => onToggleRole(role.id)}
                  >
                    <span
                      className="role-ball"
                      style={{ backgroundColor: role.color }}
                    />
                    <span className="role-option-label">{role.label}</span>
                    <span className="role-check" aria-hidden="true">
                      {isSelected ? '●' : '○'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
