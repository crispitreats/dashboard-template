import { useMemo, useState } from 'react';
import { PRODUCT_CATALOG, SIDEBAR_MODES } from '../data/catalog';
import { MODE_META, PROFILE_DASHBOARDS } from '../data/landing';
import { ModeProductIcon } from './Icons';

function getResourceMeta(categoryTitle, modeId, itemId) {
  const ns = (categoryTitle || 'dir').toLowerCase();
  const slug = (itemId || 'dataset').replace(/-/g, '_');

  if (modeId === 'data') {
    return {
      source: `apple-isearch.${ns}_data.${slug}`,
      status: 'Live · BigQuery',
      freshness: 'Synced 12m ago',
      metric: '10 cols · Columnar',
    };
  }
  if (modeId === 'analytics') {
    return {
      source: `isearch://${ns}/analytics/${slug}`,
      status: 'Published',
      freshness: 'Updated today',
      metric: 'Interactive views',
    };
  }
  return {
    source: `pipeline://${ns}/workbench/${slug}`,
    status: 'Healthy',
    freshness: 'Last run 1h ago',
    metric: 'Automated job',
  };
}

export function ModeProductDirectory({
  categoryId,
  modeId,
  onSelectProduct,
}) {
  const [search, setSearch] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState('ALL');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'

  const category = PRODUCT_CATALOG[categoryId];
  const modeObj = SIDEBAR_MODES.find((m) => m.id === modeId);
  const modeMeta = MODE_META.find((m) => m.id === modeId) ?? MODE_META[0];
  const dashboard = PROFILE_DASHBOARDS[categoryId];
  const popularId = dashboard?.popularIds?.[modeId];

  const groups = category?.modes?.[modeId] ?? [];

  const totalProducts = useMemo(
    () => groups.reduce((sum, g) => sum + g.items.length, 0),
    [groups]
  );

  const visibleGroups = useMemo(() => {
    const q = search.trim().toLowerCase();
    return groups
      .filter((g) => selectedGroupId === 'ALL' || g.id === selectedGroupId)
      .map((g) => ({
        ...g,
        items: g.items.filter(
          (item) =>
            !q ||
            item.name.toLowerCase().includes(q) ||
            g.name.toLowerCase().includes(q)
        ),
      }))
      .filter((g) => g.items.length > 0);
  }, [groups, selectedGroupId, search]);

  const flatRows = useMemo(
    () =>
      visibleGroups.flatMap((g) =>
        g.items.map((item) => ({
          ...item,
          groupId: g.id,
          groupName: g.name,
          isPopular: item.id === popularId,
          meta: getResourceMeta(category?.title, modeId, item.id),
        }))
      ),
    [visibleGroups, popularId, category?.title, modeId]
  );

  if (!category || !modeObj) return null;

  return (
    <div className="dir-page">
      {/* Top Catalog Toolbar */}
      <div className="dir-toolbar">
        <div className="dir-toolbar-left">
          <input
            type="search"
            className="dir-search"
            placeholder={`Search ${category.title} ${modeObj.label.toLowerCase()}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search directory"
          />

          <div className="dir-filter-pills" role="tablist" aria-label="Filter by category">
            <button
              type="button"
              role="tab"
              aria-selected={selectedGroupId === 'ALL'}
              className={`dir-filter-pill ${
                selectedGroupId === 'ALL' ? 'is-active' : ''
              }`}
              onClick={() => setSelectedGroupId('ALL')}
            >
              All ({totalProducts})
            </button>
            {groups.map((g) => (
              <button
                key={g.id}
                type="button"
                role="tab"
                aria-selected={selectedGroupId === g.id}
                className={`dir-filter-pill ${
                  selectedGroupId === g.id ? 'is-active' : ''
                }`}
                onClick={() => setSelectedGroupId(g.id)}
              >
                {g.name}
              </button>
            ))}
          </div>
        </div>

        <div className="dir-toolbar-right">
          <div className="dir-view-toggle" role="tablist" aria-label="Layout view">
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === 'grid'}
              className={`dir-view-btn ${viewMode === 'grid' ? 'is-active' : ''}`}
              onClick={() => setViewMode('grid')}
            >
              Cards
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === 'list'}
              className={`dir-view-btn ${viewMode === 'list' ? 'is-active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              List
            </button>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {flatRows.length === 0 ? (
        <div className="dir-empty">
          No products match “{search}”.
        </div>
      ) : viewMode === 'grid' ? (
        /* Card Grid Grouped by Category */
        <div className="dir-groups">
          {visibleGroups.map((group) => (
            <section key={group.id} className="dir-group-section">
              <div className="dir-group-head">
                <span
                  className="dir-group-icon"
                  style={{
                    color: modeMeta.color,
                    backgroundColor: modeMeta.tint,
                  }}
                >
                  <ModeProductIcon mode={modeId} size={13} />
                </span>
                <h3 className="dir-group-title">{group.name}</h3>
                <span className="dir-group-count">
                  {group.items.length} {group.items.length === 1 ? 'item' : 'items'}
                </span>
              </div>

              <div className="dir-cards-grid">
                {group.items.map((item) => {
                  const isPopular = item.id === popularId;
                  const meta = getResourceMeta(category.title, modeId, item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      className="dir-product-card"
                      onClick={() => onSelectProduct(group.id, item.id)}
                    >
                      <div className="dir-card-header">
                        <span className="dir-card-status">
                          <span
                            className="dir-status-dot"
                            style={{ backgroundColor: modeMeta.color }}
                          />
                          {meta.status}
                        </span>
                        {isPopular && (
                          <span className="dir-popular-pill">Popular</span>
                        )}
                      </div>

                      <div className="dir-card-body">
                        <span className="dir-card-name">{item.name}</span>
                        <span className="dir-card-source" title={meta.source}>
                          {meta.source}
                        </span>
                      </div>

                      <div className="dir-card-footer">
                        <span className="dir-card-freshness">
                          {meta.metric} · {meta.freshness}
                        </span>
                        <span className="dir-card-open">
                          Open <span aria-hidden="true">›</span>
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      ) : (
        /* Clean Finder / BigQuery Catalog List View */
        <div className="dir-list-card">
          <table className="dir-list-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Resource</th>
                <th>Status</th>
                <th>Updated</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {flatRows.map((row) => (
                <tr
                  key={row.id}
                  className="dir-list-row"
                  onClick={() => onSelectProduct(row.groupId, row.id)}
                >
                  <td className="dir-list-name-cell">
                    <span
                      className="dir-list-icon"
                      style={{
                        color: modeMeta.color,
                        backgroundColor: modeMeta.tint,
                      }}
                    >
                      <ModeProductIcon mode={modeId} size={12} />
                    </span>
                    <span className="dir-list-name">{row.name}</span>
                    {row.isPopular && (
                      <span className="dir-popular-pill">Popular</span>
                    )}
                  </td>
                  <td className="dir-list-muted">{row.groupName}</td>
                  <td>
                    <span className="dir-list-code">{row.meta.source}</span>
                  </td>
                  <td>
                    <span className="dir-card-status">
                      <span
                        className="dir-status-dot"
                        style={{ backgroundColor: modeMeta.color }}
                      />
                      {row.meta.status}
                    </span>
                  </td>
                  <td className="dir-list-muted">{row.meta.freshness}</td>
                  <td className="dir-list-action">
                    <span className="dir-card-open">Open ›</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
