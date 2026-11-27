import { useState } from 'react';
import { PRODUCT_CATALOG, SIDEBAR_MODES } from '../data/catalog';
import { ModeProductIcon, RailToggleIcon } from './Icons';

export function SubSidebar({
  visible,
  open,
  categoryId,
  activeMode,
  onSelectMode,
  expandedGroups,
  onToggleGroup,
  activeProductId,
  onSelectProduct,
  onToggle,
  handleTop = 10,
}) {
  const [hoveredModeId, setHoveredModeId] = useState(null);
  const category = PRODUCT_CATALOG[categoryId];
  const productGroups = category?.modes?.[activeMode] ?? [];
  const activeModeObj = SIDEBAR_MODES.find((m) => m.id === activeMode);

  return (
    <div
      className={`sub-sidebar-shell ${visible ? 'is-visible' : 'is-hidden'} ${
        visible && open ? 'is-open' : 'is-collapsed'
      }`}
      aria-hidden={!visible}
    >
      <aside
        className="sub-sidebar"
        aria-label={`${category?.title ?? 'Category'} Sub-categories`}
        aria-hidden={!visible || !open}
      >
        <div className="sub-sidebar-inner">
          <div className="sub-sidebar-head">
            <span className="sub-sidebar-category">
              {category?.title ?? ''}
            </span>
            {activeModeObj && (
              <span className="sub-sidebar-mode-tag">
                {activeModeObj.label}
              </span>
            )}
          </div>

          <div
            className="sub-mode-wrap"
            onMouseLeave={() => setHoveredModeId(null)}
          >
            <div
              className="sub-mode-selector"
              role="tablist"
              aria-label="Workspace mode"
            >
              {SIDEBAR_MODES.map((mode) => {
                const isActive = activeMode === mode.id;
                return (
                  <button
                    key={mode.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    aria-label={mode.label}
                    tabIndex={visible && open ? 0 : -1}
                    className={`sub-mode-btn ${isActive ? 'is-active' : ''}`}
                    onMouseEnter={() => setHoveredModeId(mode.id)}
                    onFocus={() => setHoveredModeId(mode.id)}
                    onBlur={() => setHoveredModeId(null)}
                    onClick={() => onSelectMode(mode.id)}
                  >
                    <ModeProductIcon mode={mode.id} size={15} />
                    {hoveredModeId === mode.id && (
                      <span className="sub-mode-tooltip" role="tooltip">
                        {mode.label}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <hr className="sub-sidebar-divider" />

          <nav className="sub-product-list" aria-label="Product categories">
            {productGroups.map((group) => {
              const isExpanded = expandedGroups.includes(group.id);
              const hasActiveChild = group.items.some(
                (item) => item.id === activeProductId
              );

              return (
                <div key={group.id} className="sub-group">
                  <button
                    type="button"
                    tabIndex={visible && open ? 0 : -1}
                    className={`sub-group-trigger ${
                      hasActiveChild ? 'has-active' : ''
                    } ${isExpanded ? 'is-expanded' : ''}`}
                    onClick={() => onToggleGroup(group.id)}
                    aria-expanded={isExpanded}
                  >
                    <span className="sub-product-icon">
                      <ModeProductIcon mode={activeMode} size={13} />
                    </span>
                    <span className="sub-group-name">{group.name}</span>
                    <span className="sub-group-count">
                      {group.items.length}
                    </span>
                  </button>

                  {isExpanded && (
                    <div
                      className="sub-group-children"
                      role="group"
                      aria-label={group.name}
                    >
                      {group.items.map((item) => {
                        const isSelected = activeProductId === item.id;
                        return (
                          <div
                            key={item.id}
                            className={`sub-child-row ${
                              isSelected ? 'is-active' : ''
                            }`}
                          >
                            <button
                              type="button"
                              tabIndex={visible && open ? 0 : -1}
                              className={`sub-child-item ${
                                isSelected ? 'is-active' : ''
                              }`}
                              onClick={() => onSelectProduct(group.id, item.id)}
                              aria-current={isSelected ? 'page' : undefined}
                            >
                              <span className="sub-child-name">
                                {item.name}
                              </span>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>
      </aside>

      <button
        type="button"
        className="sub-sidebar-handle"
        style={{ top: `${handleTop}px` }}
        onClick={onToggle}
        tabIndex={visible ? 0 : -1}
        title={
          open
            ? 'Collapse sidebar'
            : `Expand ${category?.title ?? ''} sidebar`
        }
        aria-label={
          open
            ? 'Collapse sidebar'
            : `Expand ${category?.title ?? ''} sidebar`
        }
        aria-expanded={visible && open}
      >
        <svg
          className="sub-sidebar-handle-bg"
          width="17"
          height="46"
          viewBox="0 0 17 46"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M0 1 L11.5 6.5 C14.2 7.8 16 10.4 16 13.4 L16 32.6 C16 35.6 14.2 38.2 11.5 39.5 L0 45 Z"
            className="sub-sidebar-handle-shape"
          />
          <path
            d="M0.5 1 L11.5 6.5 C14.2 7.8 16 10.4 16 13.4 L16 32.6 C16 35.6 14.2 38.2 11.5 39.5 L0.5 45"
            className="sub-sidebar-handle-stroke"
            strokeWidth="1"
            strokeLinejoin="round"
          />
        </svg>
        <span className="sub-sidebar-handle-icon">
          <RailToggleIcon collapsed={!(visible && open)} size={11} />
        </span>
      </button>
    </div>
  );
}
