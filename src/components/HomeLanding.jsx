import { useEffect, useState } from 'react';
import { PRODUCT_CATALOG } from '../data/catalog';
import {
  HERO_SLIDES,
  MODE_META,
  PROFILE_DASHBOARDS,
  PROFILE_PILLS,
  SLIDE_DURATION_MS,
} from '../data/landing';
import { ModeProductIcon } from './Icons';

function getInitialExpandedForProfile(profileId) {
  const catalog = PRODUCT_CATALOG[profileId];
  const expanded = {};
  for (const mode of MODE_META) {
    const firstGroupId = catalog?.modes?.[mode.id]?.[0]?.id;
    if (firstGroupId) expanded[firstGroupId] = true;
  }
  return expanded;
}

export function HomeLanding({ onNavigateTarget }) {
  const [slideIndex, setSlideIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState('iphone');
  const [expandedGroups, setExpandedGroups] = useState(() =>
    getInitialExpandedForProfile('iphone')
  );

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setSlideIndex((idx) => (idx + 1) % HERO_SLIDES.length);
    }, SLIDE_DURATION_MS);
    return () => clearInterval(timer);
  }, [isPaused, slideIndex]);

  const activeSlide = HERO_SLIDES[slideIndex];
  const activeDashboard =
    PROFILE_DASHBOARDS[selectedProfile] ?? PROFILE_DASHBOARDS.iphone;
  const activeCatalog = PRODUCT_CATALOG[selectedProfile];

  function goPrev() {
    setSlideIndex((idx) => (idx - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
  }

  function goNext() {
    setSlideIndex((idx) => (idx + 1) % HERO_SLIDES.length);
  }

  function handleSelectProfile(profileId) {
    setSelectedProfile(profileId);
    setExpandedGroups(getInitialExpandedForProfile(profileId));
  }

  function handleToggleGroup(groupId) {
    setExpandedGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  }

  function handleToggleAllInMode(groups, shouldExpand) {
    setExpandedGroups((prev) => {
      const next = { ...prev };
      for (const g of groups) {
        next[g.id] = shouldExpand;
      }
      return next;
    });
  }

  return (
    <div className="landing-page">
      {/* 1. Full-Bleed Fixed-Height Apple Keynote Hero */}
      <section
        className="landing-hero"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        aria-label="Portal announcements"
      >
        <img
          key={activeSlide.id}
          src={activeSlide.image}
          alt={activeSlide.imageAlt}
          className="landing-hero-bg-img"
        />
        <div className="landing-hero-scrim" aria-hidden="true" />

        <div className="landing-hero-overlay">
          <div className="landing-hero-content">
            <span
              className="landing-hero-eyebrow"
              style={{ color: activeSlide.accent }}
            >
              {activeSlide.eyebrow}
            </span>
            <h2 className="landing-hero-title">{activeSlide.title}</h2>
            <p className="landing-hero-subtitle">{activeSlide.subtitle}</p>
            <div className="landing-hero-actions">
              <button
                type="button"
                className="landing-hero-cta"
                onClick={() => onNavigateTarget(activeSlide.target)}
              >
                <span>{activeSlide.ctaLabel}</span>
                <span aria-hidden="true">›</span>
              </button>
            </div>
          </div>

          <div className="landing-hero-footer">
            <div className="landing-hero-timer-bar" aria-hidden="true">
              <div
                key={`${activeSlide.id}-${isPaused ? 'paused' : 'playing'}`}
                className={`landing-hero-timer-fill ${
                  isPaused ? 'is-paused' : ''
                }`}
                style={{
                  animationDuration: `${SLIDE_DURATION_MS}ms`,
                  backgroundColor: activeSlide.accent,
                }}
              />
            </div>

            <div className="landing-hero-controls">
              <button
                type="button"
                className="landing-slide-arrow"
                onClick={() => setIsPaused((p) => !p)}
                aria-label={isPaused ? 'Resume slideshow' : 'Pause slideshow'}
                title={isPaused ? 'Resume slideshow' : 'Pause slideshow'}
              >
                {isPaused ? '▶' : '❚❚'}
              </button>

              <button
                type="button"
                className="landing-slide-arrow"
                onClick={goPrev}
                aria-label="Previous announcement"
              >
                ‹
              </button>

              <div
                className="landing-slide-dots"
                role="tablist"
                aria-label="Slides"
              >
                {HERO_SLIDES.map((slide, idx) => (
                  <button
                    key={slide.id}
                    type="button"
                    role="tab"
                    aria-selected={idx === slideIndex}
                    aria-label={`Slide ${idx + 1}: ${slide.title}`}
                    className={`landing-slide-dot ${
                      idx === slideIndex ? 'is-active' : ''
                    }`}
                    onClick={() => setSlideIndex(idx)}
                  />
                ))}
              </div>

              <button
                type="button"
                className="landing-slide-arrow"
                onClick={goNext}
                aria-label="Next announcement"
              >
                ›
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Team Selector Bar: Which Team are You From? (Dir | Ind | Out) */}
      <section className="landing-directory-header" aria-label="Team selection">
        <div className="landing-profile-copy">
          <span className="landing-profile-kicker">
            Which Team are You From?
          </span>
          <h3 className="landing-profile-heading">{activeDashboard.heading}</h3>
          <p className="landing-profile-tagline">{activeDashboard.tagline}</p>
        </div>

        <div
          className="landing-profile-pills"
          role="tablist"
          aria-label="Select team"
        >
          {PROFILE_PILLS.map((pill) => {
            const isSelected = selectedProfile === pill.id;
            return (
              <button
                key={pill.id}
                type="button"
                role="tab"
                aria-selected={isSelected}
                className={`landing-profile-pill ${
                  isSelected ? 'is-active' : ''
                }`}
                onClick={() => handleSelectProfile(pill.id)}
              >
                {pill.code}
              </button>
            );
          })}
        </div>
      </section>

      {/* 3. Data, Analytics & Workbench Side-by-Side (Sidebar Tree Design) */}
      <section
        className="landing-pillars-grid"
        aria-label={`${activeDashboard.heading} products`}
      >
        {MODE_META.map((mode) => {
          const groups = activeCatalog?.modes?.[mode.id] ?? [];
          const totalCount = groups.reduce((sum, g) => sum + g.items.length, 0);
          const popularId = activeDashboard.popularIds?.[mode.id];
          const allExpanded =
            groups.length > 0 && groups.every((g) => Boolean(expandedGroups[g.id]));

          return (
            <article key={mode.id} className="landing-pillar-card">
              <div className="landing-pillar-head">
                <span
                  className="landing-pillar-icon"
                  style={{ backgroundColor: mode.tint, color: mode.color }}
                >
                  <ModeProductIcon mode={mode.id} size={14} />
                </span>
                <h4 className="landing-pillar-title">{mode.label}</h4>
                <span className="landing-pillar-badge">
                  {totalCount} products
                </span>
              </div>

              <div className="landing-pillar-tree">
                {groups.map((group) => {
                  const isExpanded = Boolean(expandedGroups[group.id]);
                  return (
                    <div key={group.id} className="sub-group">
                      <button
                        type="button"
                        className={`sub-group-trigger ${
                          isExpanded ? 'is-expanded' : ''
                        }`}
                        onClick={() => handleToggleGroup(group.id)}
                        aria-expanded={isExpanded}
                      >
                        <span className="sub-product-icon">
                          <ModeProductIcon mode={mode.id} size={13} />
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
                            const isPopular = item.id === popularId;
                            return (
                              <div key={item.id} className="sub-child-row">
                                <button
                                  type="button"
                                  className="sub-child-item landing-tree-item"
                                  onClick={() =>
                                    onNavigateTarget({
                                      navId: selectedProfile,
                                      modeId: mode.id,
                                      groupId: group.id,
                                      itemId: item.id,
                                    })
                                  }
                                >
                                  <span className="sub-child-name">
                                    {item.name}
                                  </span>
                                  {isPopular && (
                                    <span className="landing-tree-popular">
                                      Popular
                                    </span>
                                  )}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="landing-pillar-foot">
                <button
                  type="button"
                  className="landing-pillar-foot-btn"
                  onClick={() => handleToggleAllInMode(groups, !allExpanded)}
                >
                  {allExpanded ? 'Collapse all' : 'Expand all'}
                </button>
                <button
                  type="button"
                  className="landing-pillar-foot-link"
                  onClick={() =>
                    onNavigateTarget({
                      navId: selectedProfile,
                      modeId: mode.id,
                      groupId: groups[0]?.id ?? null,
                      itemId: null,
                    })
                  }
                >
                  View directory <span aria-hidden="true">›</span>
                </button>
              </div>
            </article>
          );
        })}
      </section>

      {/* 4. Clean Scrollable Sequential What's New Release Feed */}
      <section className="landing-releases-card" aria-label="What's New">
        <div className="landing-releases-head">
          <h4 className="landing-releases-title">What’s New</h4>
          <span className="landing-releases-sub">
            {activeDashboard.heading} · {activeDashboard.updates.length}{' '}
            releases
          </span>
        </div>

        <div className="landing-releases-scroll">
          <ul className="landing-release-list">
            {activeDashboard.updates.map((u, idx) => (
              <li key={u.version + idx} className="landing-release-row">
                <div className="landing-release-left">
                  <span className="landing-release-version">{u.version}</span>
                  <span className="landing-release-date">{u.date}</span>
                </div>

                <div className="landing-release-main">
                  <div className="landing-release-heading">
                    <span className="landing-release-name">{u.title}</span>
                    <span className="landing-release-tag">{u.tag}</span>
                  </div>
                  <p className="landing-release-desc">{u.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
