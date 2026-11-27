import { validateDmcOrder } from '../../data/dmcData';
import { DmcXmlEditor } from './DmcXmlEditor';

export function DmcOrdersDrawer({
  orders,
  open,
  fullscreen,
  onToggleOpen,
  onToggleFullscreen,
  activeOrderId,
  onSelectOrder,
  onChangeOrder,
  onSaveOrder,
  onDeleteOrder,
}) {
  const activeOrder =
    orders.find((o) => o.id === activeOrderId) ?? orders[0] ?? null;

  return (
    <div
      className={`dmc-drawer-shell ${open ? 'is-open' : 'is-minimized'} ${
        open && fullscreen ? 'is-fullscreen' : ''
      }`}
    >
      {/* Centered Horizontal Rounded Trapezium Pull-Tab (hidden in full screen) */}
      {!fullscreen && (
        <button
          type="button"
          className="dmc-drawer-trapezium"
          onClick={onToggleOpen}
          aria-expanded={open}
          title={
            open ? 'Collapse Staging Workbench' : 'Expand Staging Workbench'
          }
        >
          <svg
            className="dmc-trapezium-bg"
            width="244"
            height="32"
            viewBox="0 0 244 32"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M1 32 L18 7.5 C21.2 3 26.2 1 31.8 1 L212.2 1 C217.8 1 222.8 3 226 7.5 L243 32 Z"
              className="dmc-trapezium-shape"
            />
            <path
              d="M1 31.5 L18 7.5 C21.2 3 26.2 1 31.8 1 L212.2 1 C217.8 1 222.8 3 226 7.5 L243 31.5"
              className="dmc-trapezium-stroke"
              strokeWidth="1"
              strokeLinejoin="round"
            />
          </svg>
          <span className="dmc-trapezium-content">
            <span className="dmc-trapezium-arrow" aria-hidden="true">
              {open ? '▼' : '▲'}
            </span>
            <span className="dmc-trapezium-label">Staging Workbench</span>
            <span className="dmc-drawer-count">{orders.length}</span>
          </span>
        </button>
      )}

      {/* Slide-Up & Full-Screen Live XML Grid Workbench Panel */}
      <section
        className="dmc-drawer-panel"
        aria-label="Wrangled Preparation Orders"
        aria-hidden={!open}
      >
        <div className="dmc-drawer-bar">
          <div className="dmc-drawer-bar-left">
            {fullscreen && (
              <span className="dmc-fullscreen-title">Staging Workbench</span>
            )}
            {orders.length > 0 ? (
              <div
                className="dmc-order-tabs"
                role="tablist"
                aria-label="Staged Orders"
              >
                {orders.map((order) => {
                  const prog = validateDmcOrder(order);
                  const isSelected = activeOrder?.id === order.id;
                  return (
                    <button
                      key={order.id}
                      type="button"
                      role="tab"
                      aria-selected={isSelected}
                      className={`dmc-order-tab ${
                        isSelected ? 'is-active' : ''
                      }`}
                      onClick={() => onSelectOrder(order.id)}
                    >
                      <span className="dmc-order-tab-name">{order.name}</span>
                      <span className="dmc-order-tab-pct">{prog.pct}%</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <span className="dmc-drawer-hint">No staged orders yet</span>
            )}
          </div>

          <div className="dmc-drawer-bar-right">
            {activeOrder && (
              <span className="dmc-drawer-meta">
                {activeOrder.rows.length}{' '}
                {activeOrder.rows.length === 1 ? 'row' : 'rows'}
                {activeOrder.savedAt ? ` · Saved ${activeOrder.savedAt}` : ''}
              </span>
            )}

            <button
              type="button"
              className={`dmc-ghost-btn ${fullscreen ? 'is-toggled' : ''}`}
              onClick={onToggleFullscreen}
              title={
                fullscreen
                  ? 'Exit Full Screen (Esc)'
                  : 'Expand Staging Workbench to Full Screen'
              }
            >
              {fullscreen ? '◫ Exit Full Screen' : '⤢ Full Screen'}
            </button>

            {fullscreen && (
              <button
                type="button"
                className="dmc-close-btn"
                onClick={onToggleOpen}
                title="Collapse Staging Workbench"
                aria-label="Collapse Staging Workbench"
              >
                ×
              </button>
            )}
          </div>
        </div>

        <div className="dmc-drawer-editor-wrap">
          {!activeOrder ? (
            <div className="dmc-drawer-empty">
              Select rows in the Gantt table above and click{' '}
              <strong>+ Wrangle</strong> to slide up and edit the SAP DMC XML
              grid right here.
            </div>
          ) : (
            <DmcXmlEditor
              order={activeOrder}
              onChangeOrder={onChangeOrder}
              onSaveOrder={onSaveOrder}
              isModal={fullscreen}
              onToggleModal={onToggleFullscreen}
              onDeleteOrder={onDeleteOrder}
            />
          )}
        </div>
      </section>
    </div>
  );
}
