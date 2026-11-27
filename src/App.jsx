import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { DataPane } from './components/DataPane/DataPane';
import { DmcWorkbench } from './components/DmcWorkbench/DmcWorkbench';
import { SupplyDashboard } from './components/SupplyDashboard/SupplyDashboard';
import { Header } from './components/Header';
import { HomeLanding } from './components/HomeLanding';
import { ModeProductDirectory } from './components/ModeProductDirectory';
import {
  BOTTOM_NAV_ITEMS,
  PRIMARY_NAV_ITEMS,
  SideRail,
} from './components/SideRail';
import { SubSidebar } from './components/SubSidebar';
import {
  findProductSelection,
  getDefaultSelection,
  isSidebarCategory,
  PRODUCT_CATALOG,
  SIDEBAR_MODES,
} from './data/catalog';
import { getDatasetForProduct } from './data/datasets';
import { DEFAULT_ASSIGNED_ROLES } from './data/roles';

const ALL_NAV_ITEMS = [...PRIMARY_NAV_ITEMS, ...BOTTOM_NAV_ITEMS];

export default function App() {
  const initialSelection = getDefaultSelection('iphone', 'dashboards');

  const [activeNav, setActiveNav] = useState('home');
  // Remember last sidebar category so content stays visible while smoothly sliding closed
  const [lastSidebarCategory, setLastSidebarCategory] = useState('iphone');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeMode, setActiveMode] = useState('dashboards');
  const [expandedGroups, setExpandedGroups] = useState(() =>
    initialSelection.groupId ? [initialSelection.groupId] : []
  );
  // null = show in-frame Product Directory for (category, mode); string = open that specific product page
  const [activeProductId, setActiveProductId] = useState(null);
  const [assignedRoles, setAssignedRoles] = useState(DEFAULT_ASSIGNED_ROLES);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [handleTop, setHandleTop] = useState(66);
  const bodyRef = useRef(null);

  const isSuperAdmin = assignedRoles.includes('super-admin');

  useLayoutEffect(() => {
    function syncHandlePosition() {
      if (!bodyRef.current) return;
      const targetNav = isSidebarCategory(activeNav)
        ? activeNav
        : lastSidebarCategory;
      const activeBtn = bodyRef.current.querySelector(
        `button[data-nav-id="${targetNav}"]`
      );
      if (!activeBtn) return;
      const centerY = activeBtn.offsetTop + activeBtn.offsetHeight / 2;
      setHandleTop(Math.max(4, Math.round(centerY - 23)));
    }

    syncHandlePosition();
    window.addEventListener('resize', syncHandlePosition);
    return () => window.removeEventListener('resize', syncHandlePosition);
  }, [activeNav, lastSidebarCategory]);

  function openModeDirectory(navId, modeId) {
    const firstGroupId = PRODUCT_CATALOG[navId]?.modes?.[modeId]?.[0]?.id;
    setActiveProductId(null);
    setExpandedGroups(firstGroupId ? [firstGroupId] : []);
  }

  function handleSelectNav(navId) {
    if (isSidebarCategory(navId)) {
      if (navId === activeNav && sidebarOpen) {
        setSidebarOpen(false);
        return;
      }
      setLastSidebarCategory(navId);
      setActiveNav(navId);
      setSidebarOpen(true);
      if (navId !== activeNav) {
        openModeDirectory(navId, activeMode);
      }
    } else {
      setActiveNav(navId);
      setSidebarOpen(false);
    }
  }

  function handleNavigateTarget({ navId, modeId, groupId, itemId }) {
    setLastSidebarCategory(navId);
    setActiveNav(navId);
    setActiveMode(modeId);
    setExpandedGroups(groupId ? [groupId] : []);
    setActiveProductId(itemId);
    setSidebarOpen(false);
  }

  function handleSelectMode(modeId) {
    setActiveMode(modeId);
    if (isSidebarCategory(activeNav)) {
      openModeDirectory(activeNav, modeId);
    }
  }

  function handleSelectProduct(groupId, itemId) {
    setActiveProductId(itemId);
    setExpandedGroups((prev) =>
      prev.includes(groupId) ? prev : [...prev, groupId]
    );
  }

  function handleToggleGroup(groupId) {
    setExpandedGroups((prev) =>
      prev.includes(groupId)
        ? prev.filter((id) => id !== groupId)
        : [...prev, groupId]
    );
  }

  function handleToggleRole(roleId) {
    setAssignedRoles((prev) => {
      const next = prev.includes(roleId)
        ? prev.filter((id) => id !== roleId)
        : [...prev, roleId];

      if (
        roleId === 'super-admin' &&
        !next.includes('super-admin') &&
        activeNav === 'super-admin-console'
      ) {
        setActiveNav('home');
        setSidebarOpen(false);
      }

      return next;
    });
  }

  const isLandingView = activeNav === 'home';
  const isProductView = isSidebarCategory(activeNav);
  const activeCategory = isProductView ? PRODUCT_CATALOG[activeNav] : null;
  const activeModeObj = SIDEBAR_MODES.find((m) => m.id === activeMode);

  const selection =
    isProductView && activeProductId
      ? findProductSelection(activeNav, activeMode, activeProductId)
      : { group: null, item: null };

  const activeGroup = selection.group;
  const activeProduct = selection.item;

  const utilityItem =
    !isLandingView && !isProductView
      ? ALL_NAV_ITEMS.find((item) => item.id === activeNav)
      : null;

  const isDirectoryView = isProductView && !activeProduct;
  const isDataPane = isProductView && Boolean(activeProduct) && activeMode === 'data';
  const isSupplyDashboard =
    isProductView &&
    Boolean(activeProduct) &&
    activeNav === 'iphone' &&
    activeMode === 'dashboards';
  const dmcGrain =
    isProductView && activeProduct?.id === 'dir-prep-dmc-material'
      ? 'material'
      : isProductView && activeProduct?.id === 'dir-prep-dmc-pir'
      ? 'pir'
      : null;
  const isViewportLocked = isDataPane || Boolean(dmcGrain) || isSupplyDashboard;

  const workspaceTitle = activeProduct
    ? activeProduct.name
    : isDirectoryView && activeCategory && activeModeObj
    ? `${activeCategory.title} · ${activeModeObj.label}`
    : utilityItem?.label ?? 'All';

  const activeDataset = useMemo(
    () =>
      isDataPane
        ? getDatasetForProduct(
            activeProduct?.id,
            activeProduct?.name,
            activeCategory?.title
          )
        : null,
    [isDataPane, activeProduct?.id, activeProduct?.name, activeCategory?.title]
  );

  return (
    <div className="app-shell">
      <Header
        assignedRoles={assignedRoles}
        onToggleRole={handleToggleRole}
        onOpenMobileNav={() => setMobileNavOpen((open) => !open)}
      />

      <div className="app-body" ref={bodyRef}>
        <SideRail
          activeNav={activeNav}
          onSelectNav={handleSelectNav}
          isSuperAdmin={isSuperAdmin}
          mobileOpen={mobileNavOpen}
          onCloseMobile={() => setMobileNavOpen(false)}
        />

        {/* Always mounted for choreographed knob-out -> drawer-slide transitions */}
        <SubSidebar
          visible={isProductView}
          open={isProductView && sidebarOpen}
          categoryId={isProductView ? activeNav : lastSidebarCategory}
          activeMode={activeMode}
          onSelectMode={handleSelectMode}
          expandedGroups={expandedGroups}
          onToggleGroup={handleToggleGroup}
          activeProductId={activeProduct?.id ?? null}
          onSelectProduct={handleSelectProduct}
          onToggle={() => setSidebarOpen((open) => !open)}
          handleTop={handleTop}
        />

        <main className={`app-main ${isViewportLocked ? 'is-data-pane' : ''}`}>
          {isLandingView ? (
            <HomeLanding onNavigateTarget={handleNavigateTarget} />
          ) : (
            <>
              <div className="workspace-header-group">
                {isProductView && activeCategory && activeModeObj && (
                  <nav className="workspace-breadcrumb" aria-label="Hierarchy">
                    <button
                      type="button"
                      className="breadcrumb-link"
                      onClick={() => openModeDirectory(activeNav, activeMode)}
                    >
                      {activeCategory.title}
                    </button>
                    <span className="breadcrumb-sep" aria-hidden="true">
                      /
                    </span>
                    <button
                      type="button"
                      className={`breadcrumb-link ${
                        !activeProduct ? 'breadcrumb-current' : ''
                      }`}
                      onClick={() => openModeDirectory(activeNav, activeMode)}
                    >
                      {activeModeObj.label}
                    </button>

                    {activeGroup && activeProduct && (
                      <>
                        <span className="breadcrumb-sep" aria-hidden="true">
                          /
                        </span>
                        <span>{activeGroup.name}</span>
                        <span className="breadcrumb-sep" aria-hidden="true">
                          /
                        </span>
                        <span className="breadcrumb-current">
                          {activeProduct.name}
                        </span>
                      </>
                    )}
                  </nav>
                )}

                <div className="workspace-header">
                  <h2 className="workspace-title">{workspaceTitle}</h2>
                  <span className="workspace-accent-dot" aria-hidden="true" />
                </div>
              </div>

              {isDirectoryView ? (
                <ModeProductDirectory
                  categoryId={activeNav}
                  modeId={activeMode}
                  onSelectProduct={handleSelectProduct}
                />
              ) : isSupplyDashboard ? (
                <SupplyDashboard />
              ) : dmcGrain ? (
                <DmcWorkbench
                  key={dmcGrain}
                  grain={dmcGrain}
                  onSwitchGrain={(targetGrain) => {
                    const targetId =
                      targetGrain === 'pir'
                        ? 'dir-prep-dmc-pir'
                        : 'dir-prep-dmc-material';
                    handleSelectProduct('dir-prep-dmc', targetId);
                  }}
                />
              ) : isDataPane && activeDataset ? (
                <DataPane dataset={activeDataset} />
              ) : (
                <section className="workspace-frame" aria-label="Workspace Frame">
                  <span>Dummy</span>
                </section>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
