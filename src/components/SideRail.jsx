import {
  HelpIcon,
  HouseIcon,
  SquareIcon,
  SuperAdminConsoleIcon,
  VersionHistoryIcon,
} from './Icons';

export const PRIMARY_NAV_ITEMS = [
  {
    id: 'home',
    shortLabel: 'All',
    label: 'All',
    group: 'top',
    icon: <HouseIcon size={16} />,
  },
  {
    id: 'iphone',
    shortLabel: 'Dir',
    label: 'Dir',
    group: 'shapes',
    icon: <SquareIcon size={16} rotation={0} />,
  },
  {
    id: 'imac',
    shortLabel: 'Ind',
    label: 'Ind',
    group: 'shapes',
    icon: <SquareIcon size={16} rotation={22.5} />,
  },
  {
    id: 'ipod',
    shortLabel: 'Out',
    label: 'Out',
    group: 'shapes',
    icon: <SquareIcon size={16} rotation={45} />,
  },
];

export const BOTTOM_NAV_ITEMS = [
  {
    id: 'super-admin-console',
    shortLabel: 'Cons',
    label: 'Console',
    tooltip: 'Super Admin — Console & User Tracking',
    superAdminOnly: true,
    icon: <SuperAdminConsoleIcon size={15} />,
  },
  {
    id: 'version-history',
    shortLabel: 'Vers',
    label: 'Version History',
    tooltip: 'Version History',
    superAdminOnly: false,
    icon: <VersionHistoryIcon size={15} />,
  },
  {
    id: 'help',
    shortLabel: 'Help',
    label: 'Help',
    tooltip: 'Help',
    superAdminOnly: false,
    icon: <HelpIcon size={15} />,
  },
];

export function SideRail({
  activeNav,
  onSelectNav,
  isSuperAdmin,
  mobileOpen,
  onCloseMobile,
}) {
  const homeItem = PRIMARY_NAV_ITEMS[0];
  const shapeItems = PRIMARY_NAV_ITEMS.slice(1);
  const visibleBottomItems = BOTTOM_NAV_ITEMS.filter(
    (item) => !item.superAdminOnly || isSuperAdmin
  );

  function handleSelect(id) {
    onSelectNav(id);
    onCloseMobile();
  }

  return (
    <>
      {mobileOpen && (
        <div
          className="rail-backdrop"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside
        className={`side-rail ${mobileOpen ? 'is-mobile-open' : ''}`}
        aria-label="Primary Navigation"
      >
        <div className="rail-section rail-section--primary">
          <button
            type="button"
            data-nav-id={homeItem.id}
            className={`rail-item ${activeNav === homeItem.id ? 'is-active' : ''}`}
            onClick={() => handleSelect(homeItem.id)}
            title={homeItem.label}
            aria-label={homeItem.label}
            aria-current={activeNav === homeItem.id ? 'page' : undefined}
          >
            <span className="rail-icon">{homeItem.icon}</span>
            <span className="rail-label">{homeItem.shortLabel}</span>
          </button>

          <hr className="rail-divider" />

          {shapeItems.map((item) => (
            <button
              key={item.id}
              type="button"
              data-nav-id={item.id}
              className={`rail-item ${activeNav === item.id ? 'is-active' : ''}`}
              onClick={() => handleSelect(item.id)}
              title={item.label}
              aria-label={item.label}
              aria-current={activeNav === item.id ? 'page' : undefined}
            >
              <span className="rail-icon">{item.icon}</span>
              <span className="rail-label">{item.shortLabel}</span>
            </button>
          ))}
        </div>

        <div className="rail-section rail-section--bottom">
          <hr className="rail-divider" />

          {visibleBottomItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`rail-item rail-item--utility ${
                activeNav === item.id ? 'is-active' : ''
              }`}
              onClick={() => handleSelect(item.id)}
              title={item.tooltip}
              aria-label={item.tooltip}
              aria-current={activeNav === item.id ? 'page' : undefined}
            >
              <span className="rail-icon">{item.icon}</span>
              <span className="rail-label">{item.shortLabel}</span>
            </button>
          ))}
        </div>
      </aside>
    </>
  );
}
