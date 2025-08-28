"use client"
import { ReactElement, useEffect, useState } from 'react';

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

/**
 * Component for reviewing unapproved applications. It fetches data from
 * `/apps/unapproved` once on mount, and displays one application at a
 * time with controls to navigate, approve or discard each entry.
 */
export default function UnapprovedApps(): ReactElement {
  // Persistent dark mode state
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark';
    }
    return false;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const handleToggleDarkMode = () => setDarkMode((prev) => !prev);
  // State to hold the list of applications. Use explicit generic type.
  const [apps, setApps] = useState<ApplicationRecord[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  // Store initial textbox sizes (width) and heights for each app/field
  const [initialSizes, setInitialSizes] = useState<{ width: number, height: number }[][]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

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
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [baseUrl]);

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

  // Save button handler (stub)
  // Save button handler: collect all current textbox answers for the current app
  const handleSave = () => {
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
          alert("Failed to save application: Unprocessable Entity\n" + errorText);
        } else {
          console.log("Application saved successfully");
        }
      })
      .catch(err => {
        console.error("Network or fetch error:", err);
        alert("Network error: " + err.message);
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
        alert("Network error: " + err.message);
      });

    // Remove item and adjust index
    setApps((prev) => prev.filter((_, index) => index !== currentIndex));
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
        alert("Network error: " + err.message);
      });

    setApps((prev) => prev.filter((_, index) => index !== currentIndex));
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : 0));
  };

  // Render loading state
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
  };

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
        <p style={{ marginTop: 0, textAlign: 'center' }}>
          <a
            href={app.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: darkMode ? '#90cdf4' : '#1976d2',
              textDecoration: 'underline',
              fontWeight: 500,
              wordBreak: 'break-all',
              transition: 'color 0.2s',
            }}
          >
            {app.url}
          </a>
        </p>
        <p><strong>App ID:</strong> {app.id}</p>
        <p><strong>Job ID:</strong> {app.job_id}</p>

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
                      maxHeight: '200px',
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

      {/* Fixed Bottom Bar for Navigation & Actions */}
      <div
        style={{
          position: 'fixed',
          left: 0,
          bottom: 0,
          width: '100vw',
          background: theme.appBg,
          borderTop: `1px solid ${theme.border}`,
          boxShadow: '0 -2px 8px rgba(0,0,0,0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.75rem 2rem',
          zIndex: 2000,
        }}
      >
        {/* Left: Dark/Light Mode Toggle */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <button
            onClick={handleToggleDarkMode}
            aria-label="Toggle dark mode"
            style={{
              background: darkMode ? '#232326' : '#fff',
              color: darkMode ? '#f3f3f3' : '#222',
              border: `1px solid ${theme.border}`,
              borderRadius: '9999px',
              padding: '0.5rem 1.25rem',
              boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
              fontWeight: 500,
              fontSize: '1rem',
              transition: 'background 0.2s, color 0.2s',
            }}
          >
            {darkMode ? 'Light Mode' : 'Dark Mode'}
          </button>
        </div>

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
            style={{
              background: darkMode ? '#1976d2' : '#2196f3',
              color: theme.buttonText,
              padding: '0.5rem 1.25rem',
              border: 'none',
              borderRadius: '9999px',
              fontWeight: 500,
              fontSize: '1rem',
              boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
              cursor: 'pointer',
              marginRight: '0.5rem',
              transition: 'background 0.2s',
            }}
          >
            Save
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
