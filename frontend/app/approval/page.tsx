"use client"
import { ReactElement, useEffect, useMemo, useState } from 'react';
import JobPreviewCard from '../components/JobPreviewCard';
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

type Classification = "safety" | "target" | "reach" | "dream"; // retained for existing job data

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

  // Fetch only the specific jobs we need via /job/{job_id}
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!apps || apps.length === 0) return;
      // Determine which job IDs we still need to fetch
      const have = new Set(jobs.map((j) => j.id));
      const needed = Array.from(new Set(apps.map((a) => a.job_id))).filter(
        (id) => !have.has(id)
      );
      if (needed.length === 0) return;

      try {
        const results = await Promise.all(
          needed.map(async (id) => {
            try {
              const res = await fetch(`${baseUrl}/job/${id}`, {
                headers: { Accept: 'application/json' },
              });
              if (!res.ok) throw new Error(`HTTP ${res.status}`);
              return (await res.json()) as JobRecord;
            } catch (err) {
              // non-fatal; skip this job
              return null as unknown as JobRecord;
            }
          })
        );
        if (cancelled) return;
        const valid = results.filter(Boolean) as JobRecord[];
        if (valid.length > 0) {
          setJobs((prev) => {
            const byId = new Map(prev.map((j) => [j.id, j] as const));
            for (const j of valid) byId.set(j.id, j);
            return Array.from(byId.values());
          });
        }
      } catch {
        // ignore batch errors
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [apps, baseUrl, jobs]);

  const jobById = useMemo(() => {
    const m = new Map<string, JobRecord>();
    for (const j of jobs) m.set(j.id, j);
    return m;
  }, [jobs]);

  // External markdown modal removed; JobPreviewCard provides internal expand dialog.

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

  // Removed bespoke classification markup & dynamic import; JobPreviewCard handles badge + description modal.
  
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
        {/* Job details via unified JobPreviewCard (job mode, no action buttons) */}
        {(() => {
          const j = jobById.get(app.job_id);
          if (!j) return null;
          return (
            <div style={{ marginBottom: '0.75rem' }}>
              <JobPreviewCard
                job={j}
                theme={theme}
                darkMode={darkMode}
                previewLength={280}
              />
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

  {/* External markdown modal removed; internal expand handled inside JobPreviewCard */}

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
