"use client"
import dynamic from 'next/dynamic';
import type { ComponentType } from 'react';
import { ReactElement, useEffect, useMemo, useState } from 'react';
import { useTheme } from "../providers/ThemeProvider";

/**
 * Field information associated with an application. If `multiple_choice`
 * is true, the `choices` array contains all possible options. The
 * `answer` string holds either the selected choice or free‑text answer.
 */
export interface Field {
  question: string;
  multiple_choice: boolean;
  choices: string[];
  answer: string;
}

/**
 * Application record returned from the `/apps/unapproved` endpoint.
 */
export interface ApplicationRecord {
  job_id: string;
  id: string;
  url: string;
  fields: Field[];
}

// Job types (mirrors jobs page)
type Review = {
  action?: string;
  classification?: "safety" | "target" | "reach" | "dream" | null;
} | null;

type Classification = "safety" | "target" | "reach" | "dream";

type JobRecord = {
  id: string;
  jobspy_id: string;
  title: string;
  company: string;
  location?: string | null;
  min_salary?: number | null;
  max_salary?: number | null;
  date_posted?: string | null;
  job_type?: string | null;
  linkedin_job_url?: string | null;
  direct_job_url?: string | null;
  description?: string | null;
  review?: Review;
  reviewed?: boolean;
  approved?: boolean;
  discarded?: boolean;
};

/**
 * Component for reviewing unapproved applications. It fetches data from
 * `/apps/unapproved` once on mount, and displays one application at a
 * time with controls to navigate, approve or discard each entry.
 */
export default function UnapprovedApps(): ReactElement {
  const { dark: darkMode } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  // Prevent horizontal scrolling on this page only
  useEffect(() => {
    const prev = document.body.style.overflowX;
    document.body.style.overflowX = 'hidden';
    return () => {
      document.body.style.overflowX = prev;
    };
  }, []);
  // State to hold the list of applications. Use explicit generic type.
  const [apps, setApps] = useState<ApplicationRecord[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  // Store initial textbox sizes (width) and heights for each app/field
  const [initialSizes, setInitialSizes] = useState<{ width: number, height: number }[][]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [jobs, setJobs] = useState<JobRecord[]>([]);
  // Save feedback state
  const [saving, setSaving] = useState(false);
  const [saveOk, setSaveOk] = useState(false);
  const [saveErr, setSaveErr] = useState<string | null>(null);

  // Determine API base URL from environment (defaults to empty string).
  const baseUrl: string = "http://localhost:8000";

  useEffect(() => {
    /**
     * Fetch the list of unapproved applications from the API. If the
     * response is not an array, an error will be thrown.
     */
    async function fetchData(): Promise<void> {
      try {
        const res = await fetch(`${baseUrl}/apps/unapproved`, {
          headers: {
            Accept: 'application/json',
          },
        });
        const json = await res.json();
        const data: ApplicationRecord[] = json.apps;
        if (Array.isArray(data)) {
          // Type assertion: assume each item conforms to ApplicationRecord
          setApps(data);
          // Compute initial sizes for all fields in all apps
          const sizes = data.map(app =>
            app.fields.map(field => {
              const answer = field.answer || '';
              // Estimate line count by splitting on newlines and wrapping at ~70 chars
              const lines = answer.split('\n').reduce((acc, line) => acc + Math.max(1, Math.ceil(line.length / 70)), 0);
              // Height: 32px per line, min 32, max 200
              const height = Math.max(32, Math.min(lines * 32 + 16, 200));
              // Width: max width for answers > 60 chars, else scale up to 600px
              let width;
              if (answer.length > 60) width = 600;
              else width = Math.max(160, Math.min(answer.length * 10 + 40, 600));
              return { width, height };
            })
          );
          setInitialSizes(sizes);
        } else {
          throw new Error('Response was not an array');
        }
      } catch (err) {
        console.error('Failed to fetch unapproved applications:', err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [baseUrl]);

  // Fetch jobs (for showing title/company/classification/description)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${baseUrl}/jobs`, { headers: { Accept: 'application/json' } });
        const json = await res.json();
        if (!cancelled) setJobs(Array.isArray(json.jobs) ? json.jobs : []);
      } catch (e) {
        // non-fatal for this page; keep silent
      }
    })();
    return () => { cancelled = true; };
  }, [baseUrl]);

  const jobById = useMemo(() => {
    const m = new Map<string, JobRecord>();
    for (const j of jobs) m.set(j.id, j);
    return m;
  }, [jobs]);

  // Markdown modal state and handlers (must be before any early returns)
  const [mdModal, setMdModal] = useState<{ open: boolean; content: string | null }>({ open: false, content: null });
  const openMarkdownModal = (markdown: string) => setMdModal({ open: true, content: markdown });
  const closeMarkdownModal = () => setMdModal({ open: false, content: null });
  useEffect(() => {
    if (!mdModal.open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeMarkdownModal(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mdModal.open]);

  /**
   * Move to the next application in the list. Wrap around at the end.
   */
  const handleNext = (): void => {
    setCurrentIndex((prev) => {
      if (apps.length === 0) return 0;
      return (prev + 1) % apps.length;
    });
  };

  /**
   * Move to the previous application in the list. Wrap around at the start.
   */
  const handlePrev = (): void => {
    setCurrentIndex((prev) => {
      if (apps.length === 0) return 0;
      return (prev - 1 + apps.length) % apps.length;
    });
  };

  // Save button handler: collect all current textbox answers for the current app
  const handleSave = () => {
    setSaving(true);
    setSaveErr(null);
    const currentApp = apps[currentIndex];
    if (!currentApp) return;

    const appData = {
      id: String(currentApp.id),
      job_id: String(currentApp.job_id),
      url: currentApp.url,
      fields: currentApp.fields.map(f => ({
        question: f.question,
        multiple_choice: f.multiple_choice,
        choices: f.choices,
        answer: f.answer,
      })),
    };

    fetch(`http://localhost:8000/app/${appData.id}/update`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(appData),
    })
      .then(async res => {
        if (!res.ok) {
          let errorText;
          try {
            errorText = await res.text();
            console.error("Error response:", errorText);
          } catch (e) {
            console.error("Failed to read error response", e);
          }
          setSaving(false);
          setSaveErr('Failed to save application');
          setTimeout(() => setSaveErr(null), 4000);
          alert("Failed to save application: Unprocessable Entity\n" + errorText);
        } else {
          console.log("Application saved successfully");
          setSaving(false);
          setSaveOk(true);
          setTimeout(() => setSaveOk(false), 2000);
        }
      })
      .catch(err => {
        console.error("Network or fetch error:", err);
        setSaving(false);
        setSaveErr((err as Error).message || 'Network error');
        setTimeout(() => setSaveErr(null), 4000);
        alert("Network error: " + (err as Error).message);
      });
  };

  /**
   * Send an approval request for the current application. Upon success
   * remove it from the local list and adjust the current index.
   */
  const handleApprove = async (): Promise<void> => {
    if (!apps.length) return;
    await handleSave();

    const currentApp = apps[currentIndex];
    fetch(`${baseUrl}/app/${currentApp.id}/approve`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then(async res => {
        if (!res.ok) {
          let errorText;
          try {
            errorText = await res.text();
            console.error("Error response:", errorText);
          } catch (e) {
            console.error("Failed to read error response", e);
          }
          alert("Failed to approve application: Unprocessable Entity\n" + errorText);
        } else {
          console.log("Application approved successfully");
        }
      })
      .catch(err => {
        console.error("Network or fetch error:", err);
        alert("Network error: " + (err as Error).message);
      });

    // Remove item and adjust index, and update initialSizes
    setApps((prevApps) => {
      const newApps = prevApps.filter((_, index) => index !== currentIndex);
      // Recompute initialSizes for newApps
      const newSizes = newApps.map(app =>
        app.fields.map(field => {
          const answer = field.answer || '';
          const lines = answer.split('\n').reduce((acc, line) => acc + Math.max(1, Math.ceil(line.length / 70)), 0);
          const height = Math.max(32, Math.min(lines * 32 + 16, 200));
          let width;
          if (answer.length > 60) width = 600;
          else width = Math.max(160, Math.min(answer.length * 10 + 40, 600));
          return { width, height };
        })
      );
      setInitialSizes(newSizes);
      return newApps;
    });
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : 0));
  };

  /**
   * Send a discard request for the current application. Upon success
   * remove it from the local list and adjust the current index.
   */
  const handleDiscard = async (): Promise<void> => {
    if (!apps.length) return;
    const currentApp = apps[currentIndex];
    fetch(`${baseUrl}/app/${currentApp.id}/discard`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    }).then(async res => {
      if (!res.ok) {
        let errorText;
        try {
          errorText = await res.text();
          console.error("Error response:", errorText);
        } catch (e) {
          console.error("Failed to read error response", e);
        }
        alert("Failed to discard application: Unprocessable Entity\n" + errorText);
      } else {
        console.log("Application discarded successfully");
      }
    })
      .catch(err => {
        console.error("Network or fetch error:", err);
        alert("Network error: " + (err as Error).message);
      });

    setApps((prevApps) => {
      const newApps = prevApps.filter((_, index) => index !== currentIndex);
      // Recompute initialSizes for newApps
      const newSizes = newApps.map(app =>
        app.fields.map(field => {
          const answer = field.answer || '';
          const lines = answer.split('\n').reduce((acc, line) => acc + Math.max(1, Math.ceil(line.length / 70)), 0);
          const height = Math.max(32, Math.min(lines * 32 + 16, 200));
          let width;
          if (answer.length > 60) width = 600;
          else width = Math.max(160, Math.min(answer.length * 10 + 40, 600));
          return { width, height };
        })
      );
      setInitialSizes(newSizes);
      return newApps;
    });
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : 0));
  };

  // Render loading state
  if (!mounted) {
    return <main style={{ padding: '1rem' }} />;
  }

  if (loading) {
    return <p style={{ padding: '1rem' }}>Loading unapproved applications…</p>;
  }

  // Render error state
  if (error) {
    return <p style={{ padding: '1rem', color: 'red' }}>Error: {error.message}</p>;
  }

  // Render empty state
  if (!apps || apps.length === 0) {
    return <p style={{ padding: '1rem' }}>No unapproved applications found.</p>;
  }

  // Current application to render
  const app = apps[currentIndex];

  // Theme styles
  const theme = {
    background: darkMode ? '#18181b' : '#f9f9f9',
    appBg: darkMode ? '#232326' : '#fff',
    border: darkMode ? '#333' : '#ccc',
    text: darkMode ? '#f3f3f3' : '#222',
    arrowBg: darkMode ? '#232326' : 'rgba(255,255,255,0.85)',
    arrowColor: darkMode ? '#f3f3f3' : '#222',
    approveBg: darkMode ? '#388e3c' : '#4caf50',
    discardBg: darkMode ? '#b71c1c' : '#f44336',
    buttonText: '#fff',
    link: darkMode ? '#90cdf4' : '#1976d2',
    muted: darkMode ? '#9ca3af' : '#6b7280',
  };

  // classification badge styling (mirrors jobs page)
  const classificationColors: Record<Classification, { bg: string; text: string; border: string }> = {
    safety: {
      bg: darkMode ? '#134e4a' : '#dcfce7',
      text: darkMode ? '#a7f3d0' : '#065f46',
      border: darkMode ? '#115e59' : '#86efac',
    },
    target: {
      bg: darkMode ? '#1e3a8a' : '#dbeafe',
      text: darkMode ? '#93c5fd' : '#1e40af',
      border: darkMode ? '#1d4ed8' : '#93c5fd',
    },
    reach: {
      bg: darkMode ? '#7c2d12' : '#ffedd5',
      text: darkMode ? '#fdba74' : '#9a3412',
      border: darkMode ? '#9a3412' : '#fdba74',
    },
    dream: {
      bg: darkMode ? '#4c1d95' : '#f3e8ff',
      text: darkMode ? '#d8b4fe' : '#6b21a8',
      border: darkMode ? '#6b21a8' : '#d8b4fe',
    },
  };

  const renderClassification = (c?: Classification | null) => {
    if (!c) return null;
    const colors = classificationColors[c];
    const label = c.charAt(0).toUpperCase() + c.slice(1);
    return (
      <span
        aria-label={`Classification ${label}`}
        title={`Classification: ${label}`}
        style={{
          display: 'inline-block',
          fontSize: 12,
          padding: '2px 8px',
          borderRadius: 999,
          background: colors.bg,
          color: colors.text,
          border: `1px solid ${colors.border}`,
          lineHeight: 1.6,
          textTransform: 'none',
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </span>
    );
  };

  // Markdown lazy component and description preview (mirrors jobs page)
  const Markdown = dynamic(() => import('../components/MarkdownRenderer'), { ssr: false });

  const preview = (md?: string | null, n = 240) => {
    if (!md) return '';
    const text = md
      .replace(/```[\s\S]*?```/g, '')
      .replace(/`[^`]*`/g, '')
      .replace(/\!\[[^\]]*\]\([^\)]*\)/g, '')
      .replace(/\[[^\]]*\]\([^\)]*\)/g, '$1')
      .replace(/[*_>#\-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return text.length > n ? text.slice(0, n) + '…' : text;
  };

  type SimpleTheme = { link: string; border: string; muted: string; text: string; appBg: string };
  function DescriptionSection({ markdown, darkMode, theme, Markdown, onOpen }: { markdown: string; darkMode: boolean; theme: SimpleTheme; Markdown: ComponentType<{ markdown: string; theme: SimpleTheme; darkMode: boolean }>; onOpen: (markdown: string) => void }) {
    const text = preview(markdown, 280);
    return (
      <div style={{ marginTop: 8 }}>
        <p style={{ margin: '8px 0', color: theme.text, lineHeight: 1.5 }}>{text}</p>
        {text.length < (markdown?.length || 0) && (
          <button
            type="button"
            onClick={() => onOpen(markdown)}
            style={{
              padding: '4px 8px',
              borderRadius: 6,
              border: `1px solid ${theme.border}`,
              background: theme.appBg,
              color: theme.link,
              cursor: 'pointer',
            }}
          >
            Open details
          </button>
        )}
      </div>
    );
  }


  return (
    <main style={{
      maxWidth: '800px',
      margin: '0 auto',
      padding: '1rem',
      paddingBottom: '5rem', // Prevent content from being hidden behind navbar
      position: 'relative',
      background: theme.background,
      minHeight: '100vh',
      color: theme.text,
  overflowX: 'hidden',
      transition: 'background 0.2s, color 0.2s',
    }}>
      <section style={{
        border: `1px solid ${theme.border}`,
        borderRadius: '8px',
        padding: '1rem',
        background: theme.appBg,
        color: theme.text,
        transition: 'background 0.2s, color 0.2s',
      }}>
        <h2 style={{ marginTop: 0, textAlign: 'center' }}>
          Application {currentIndex + 1} of {apps.length}
        </h2>
        <p><strong>App ID:</strong> {app.id}</p>
        <p style={{ marginBottom: '1rem' }}><strong>Job ID:</strong> {app.job_id}</p>
        {/* Job details (title, company, classification, description) */}
        {(() => {
          const j = jobById.get(app.job_id);
          if (!j) return null;
          const bestLink = j.direct_job_url || j.linkedin_job_url || undefined;
          return (
            <div style={{
              border: `1px solid ${theme.border}`,
              borderRadius: 8,
              padding: '0.75rem',
              background: theme.background,
              marginBottom: '0.75rem',
            }}>
              <header style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ margin: '0 0 4px 0' }}>
                    {bestLink ? (
                      <a href={bestLink} target="_blank" rel="noreferrer" style={{ color: theme.link, textDecoration: 'underline' }}>
                        {j.title}
                      </a>
                    ) : (
                      <span>{j.title}</span>
                    )}
                  </h3>
                  <div style={{ color: theme.muted, fontSize: 14, marginBottom: 6 }}>
                    {j.company}
                  </div>
                  <div style={{ marginTop: 4, display: 'flex', gap: 6, alignItems: 'center' }}>
                    {renderClassification(j.review?.classification ?? null)}
                  </div>
                </div>
              </header>
              {j.description ? (
                <DescriptionSection markdown={j.description} darkMode={darkMode} theme={theme} Markdown={Markdown} onOpen={openMarkdownModal} />
              ) : (
                <p style={{ marginTop: 8, marginBottom: 0, color: theme.muted }}>(No description provided)</p>
              )}
            </div>
          );
        })()}
        <div style={{ marginTop: '1rem' }}>
          {app.fields && app.fields.map((field, index) => {
            const initialSizeObj =
              initialSizes[currentIndex] && initialSizes[currentIndex][index]
                ? initialSizes[currentIndex][index]
                : { width: 10, height: 32 };
            // Special rendering for Resume field
            if (field.question.toLowerCase().includes('resume')) {
              return (
                <div key={index} style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <p style={{ margin: 0 }}>
                    <strong>{field.question}</strong>
                  </p>
                  {/* File attachment icon and answer as link/text */}
                  <a
                    href={field.answer}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: theme.text }}
                  >
                    <span role="img" aria-label="attachment" style={{ fontSize: '1.3em' }}>📎</span>
                    <span>{field.answer}</span>
                  </a>
                </div>
              );
            }
            return (
              <div key={index} style={{ marginBottom: '0.75rem' }}>
                <p style={{ margin: 0 }}>
                  <strong>{field.question}</strong>
                </p>
                {field.multiple_choice && Array.isArray(field.choices) ? (
                  <div style={{ margin: '0.25rem 0', paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    {field.choices.map((choice, i) => (
                      <label key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: choice === field.answer ? 600 : 400 }}>
                        <input
                          type="checkbox"
                          checked={choice === field.answer}
                          onChange={() => {
                            setApps(prev => prev.map((appItem, appIdx) =>
                              appIdx === currentIndex
                                ? {
                                  ...appItem,
                                  fields: appItem.fields.map((f, fIdx) =>
                                    fIdx === index ? { ...f, answer: choice } : f
                                  )
                                }
                                : appItem
                            ));
                          }}
                          style={{ accentColor: darkMode ? '#90cdf4' : '#1976d2' }}
                        />
                        {choice}
                      </label>
                    ))}
                  </div>
                ) : (
                  <textarea
                    value={field.answer ?? ""}
                    onChange={e => {
                      const newValue = e.target.value;
                      setApps(prev => prev.map((appItem, appIdx) =>
                        appIdx === currentIndex
                          ? {
                            ...appItem,
                            fields: appItem.fields.map((f, fIdx) =>
                              fIdx === index ? { ...f, answer: newValue } : f
                            )
                          }
                          : appItem
                      ));
                    }}
                    style={{
                      padding: '0.6rem 1rem',
                      borderRadius: '6px',
                      border: `1px solid ${theme.border}`,
                      background: darkMode ? '#232326' : '#fff',
                      color: theme.text,
                      fontSize: '1rem',
                      margin: 0,
                      minWidth: '160px',
                      maxWidth: '800px',
                      width:
                        initialSizeObj.width > 400
                          ? '100%'
                          : `${initialSizeObj.width}px`,
                      minHeight: '32px',
                      maxHeight: '400px',
                      height: `${initialSizeObj.height}px`,
                      boxSizing: 'border-box',
                      resize: 'none',
                      lineHeight: '1.5',
                      textAlign: 'left',
                      verticalAlign: 'top',
                      overflowY: 'auto',
                      whiteSpace: 'pre-wrap',
                    }}
                    rows={Math.max(1, Math.round(initialSizeObj.height / 24))}
                  />
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Save feedback toasts */}
      {(saveOk || saveErr) && (
        <div
          style={{
            position: 'fixed',
            right: 16,
            bottom: 88,
            zIndex: 2500,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 12px',
            borderRadius: 8,
            border: `1px solid ${saveErr ? theme.discardBg : theme.approveBg}`,
            background: theme.appBg,
            color: theme.text,
            boxShadow: '0 6px 20px rgba(0,0,0,0.2)'
          }}
          role="status"
          aria-live="polite"
        >
          <span style={{
            display: 'inline-flex',
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: saveErr ? theme.discardBg : theme.approveBg,
          }} />
          <span>{saveErr ? saveErr : 'Saved'}</span>
        </div>
      )}

      {/* Markdown Pop-out Modal */}
      {mdModal.open && (
        <div
          onClick={closeMarkdownModal}
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 3000,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: theme.appBg,
              color: theme.text,
              border: `1px solid ${theme.border}`,
              borderRadius: 8,
              boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
              width: 'min(900px, 92vw)',
              maxHeight: '82vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderBottom: `1px solid ${theme.border}` }}>
              <strong>Job Description</strong>
              <button
                aria-label="Close"
                onClick={closeMarkdownModal}
                style={{
                  background: 'transparent',
                  color: theme.text,
                  border: 'none',
                  fontSize: 20,
                  lineHeight: 1,
                  cursor: 'pointer',
                }}
              >
                ×
              </button>
            </div>
            <div style={{ padding: 12, overflow: 'auto' }}>
              {mdModal.content && (
                <div style={{ lineHeight: 1.6 }}>
                  <Markdown markdown={mdModal.content} theme={theme} darkMode={darkMode} />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Fixed Bottom Bar for Navigation & Actions */}
      <div
        style={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          background: theme.appBg,
          borderTop: `1px solid ${theme.border}`,
          boxShadow: '0 -2px 8px rgba(0,0,0,0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          padding: '0.75rem 2rem',
          boxSizing: 'border-box',
          overflowX: 'hidden',
          zIndex: 2000,
        }}
      >
        {/* Center: Navigation Arrows (absolutely centered) */}
        <div style={{ position: 'absolute', left: '50%', bottom: '0.75rem', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: '0.5rem', zIndex: 2100 }}>
          <button
            onClick={handlePrev}
            aria-label="Previous"
            style={{
              background: theme.arrowBg,
              color: theme.arrowColor,
              border: 'none',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
              fontSize: '1.5rem',
              cursor: 'pointer',
              transition: 'background 0.2s, color 0.2s',
            }}
          >
            &#8592;
          </button>
          <button
            onClick={handleNext}
            aria-label="Next"
            style={{
              background: theme.arrowBg,
              color: theme.arrowColor,
              border: 'none',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
              fontSize: '1.5rem',
              cursor: 'pointer',
              transition: 'background 0.2s, color 0.2s',
            }}
          >
            &#8594;
          </button>
        </div>

        {/* Right: Save, Approve/Discard */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              background: darkMode ? '#1976d2' : '#2196f3',
              color: theme.buttonText,
              padding: '0.5rem 1.25rem',
              border: 'none',
              borderRadius: '9999px',
              fontWeight: 500,
              fontSize: '1rem',
              boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
              cursor: saving ? 'not-allowed' : 'pointer',
              marginRight: '0.5rem',
              transition: 'background 0.2s',
              opacity: saving ? 0.8 : 1,
            }}
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button
            onClick={handleApprove}
            style={{
              background: theme.approveBg,
              color: theme.buttonText,
              padding: '0.5rem 1.25rem',
              border: 'none',
              borderRadius: '9999px',
              fontWeight: 500,
              fontSize: '1rem',
              boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
          >
            Approve
          </button>
          <button
            onClick={handleDiscard}
            style={{
              background: theme.discardBg,
              color: theme.buttonText,
              padding: '0.5rem 1.25rem',
              border: 'none',
              borderRadius: '9999px',
              fontWeight: 500,
              fontSize: '1rem',
              boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
          >
            Discard
          </button>
        </div>

      </div>
    </main>
  );
}
