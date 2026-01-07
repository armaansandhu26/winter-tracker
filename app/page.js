"use client";

import React, { useState, useEffect, useCallback } from "react";
import config from "./config";

// Generate dates from config
const generateDates = () => {
  const dates = [];
  const start = new Date(config.startDate);
  const end = new Date(config.endDate);

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const date = new Date(d);
    dates.push({
      day: date.getDate(),
      month: date.getMonth(),
      year: date.getFullYear(),
      date,
      dayName: date.toLocaleDateString("en-US", { weekday: "short" }),
      isWeekend: date.getDay() === 0 || date.getDay() === 6,
    });
  }
  return dates;
};

const dates = generateDates();

export default function WinterTracker() {
  // Data state
  const [hours, setHours] = useState({});
  const [notes, setNotes] = useState({});
  const [dailyHighlights, setDailyHighlights] = useState({});
  const [dailyMisc, setDailyMisc] = useState({});

  // UI state
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [editingCell, setEditingCell] = useState(null);
  const [noteInput, setNoteInput] = useState("");
  const [editingHighlight, setEditingHighlight] = useState(null);
  const [highlightInput, setHighlightInput] = useState("");
  const [editingMisc, setEditingMisc] = useState(null);
  const [miscTimeInput, setMiscTimeInput] = useState("");
  const [miscCommentInput, setMiscCommentInput] = useState("");

  // Auth state
  const [isEditMode, setIsEditMode] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const today = new Date();
  const todayDay = today.getDate();
  const todayMonth = today.getMonth();
  const todayYear = today.getFullYear();
  const theme = config.theme;

  // Load data and check auth on mount
  useEffect(() => {
    const init = async () => {
      try {
        // Check auth status
        const authRes = await fetch("/api/auth/check");
        const authData = await authRes.json();
        setIsEditMode(authData.authenticated);

        // Load tracker data
        const dataRes = await fetch("/api/data");
        const data = await dataRes.json();
        setHours(data.hours || {});
        setNotes(data.notes || {});
        setDailyHighlights(data.highlights || {});
        setDailyMisc(data.misc || {});
      } catch (error) {
        console.error("Failed to load:", error);
      } finally {
        setIsLoading(false);
        setMounted(true);
      }
    };

    init();
  }, []);

  // Auto-save when data changes (debounced)
  const saveData = useCallback(
    async (newHours, newNotes, newHighlights, newMisc) => {
      if (!isEditMode) return;

      setIsSaving(true);
      try {
        await fetch("/api/data", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            hours: newHours,
            notes: newNotes,
            highlights: newHighlights,
            misc: newMisc || dailyMisc,
          }),
        });
      } catch (error) {
        console.error("Failed to save:", error);
      } finally {
        setIsSaving(false);
      }
    },
    [isEditMode, dailyMisc]
  );

  // Login handler
  const handleLogin = async () => {
    setLoginError("");
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (data.success) {
        setIsEditMode(true);
        setShowLoginModal(false);
        setPassword("");
      } else {
        setLoginError("Invalid password");
      }
    } catch (error) {
      setLoginError("Login failed");
    }
  };

  // Logout handler
  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setIsEditMode(false);
  };

  // Data handlers
  const incrementHours = (trackId, day, maxHours) => {
    if (!isEditMode) return;

    const key = `${trackId}-${day}`;
    const current = hours[key] || 0;
    const next =
      current >= maxHours
        ? 0
        : current + (config.features?.incrementAmount || 0.5);
    const newHours = { ...hours, [key]: next };
    setHours(newHours);
    saveData(newHours, notes, dailyHighlights, dailyMisc);
  };

  const openNoteEditor = (trackId, day, e) => {
    if (!isEditMode) return;
    e.preventDefault();
    const key = `${trackId}-${day}`;
    setEditingCell({ trackId, day });
    setNoteInput(notes[key] || "");
  };

  const saveNote = () => {
    if (editingCell) {
      const key = `${editingCell.trackId}-${editingCell.day}`;
      const newNotes = { ...notes, [key]: noteInput };
      setNotes(newNotes);
      saveData(hours, newNotes, dailyHighlights, dailyMisc);
      setEditingCell(null);
      setNoteInput("");
    }
  };

  const closeNoteEditor = () => {
    setEditingCell(null);
    setNoteInput("");
  };

  const openHighlightEditor = (day) => {
    if (!isEditMode) return;
    setEditingHighlight(day);
    setHighlightInput(dailyHighlights[day] || "");
  };

  const saveHighlight = () => {
    if (editingHighlight) {
      const newHighlights = {
        ...dailyHighlights,
        [editingHighlight]: highlightInput,
      };
      setDailyHighlights(newHighlights);
      saveData(hours, notes, newHighlights, dailyMisc);
      setEditingHighlight(null);
      setHighlightInput("");
    }
  };

  const closeHighlightEditor = () => {
    setEditingHighlight(null);
    setHighlightInput("");
  };

  const openMiscEditor = (day) => {
    if (!isEditMode) {
      const miscData = dailyMisc[day];
      if (miscData && (miscData.time || miscData.comment)) {
        setViewingMisc({ ...miscData, day });
      }
      return;
    }
    setEditingMisc(day);
    const miscData = dailyMisc[day] || { time: "", comment: "" };
    setMiscTimeInput(miscData.time || "");
    setMiscCommentInput(miscData.comment || "");
  };

  const saveMisc = () => {
    if (editingMisc) {
      const newMisc = {
        ...dailyMisc,
        [editingMisc]: {
          time: miscTimeInput.trim(),
          comment: miscCommentInput.trim(),
        },
      };
      setDailyMisc(newMisc);
      saveData(hours, notes, dailyHighlights, newMisc);
      setEditingMisc(null);
      setMiscTimeInput("");
      setMiscCommentInput("");
    }
  };

  const closeMiscEditor = () => {
    setEditingMisc(null);
    setMiscTimeInput("");
    setMiscCommentInput("");
  };

  // Stats calculations
  const getTrackStats = (track) => {
    let totalTarget = 0,
      totalLogged = 0;
    dates.forEach(({ day }) => {
      if (track.startDay && day < track.startDay) return;
      if (track.duration && day >= track.startDay + track.duration) return;
      totalTarget += track.hoursPerDay;
      totalLogged += hours[`${track.id}-${day}`] || 0;
    });
    return { totalTarget, totalLogged };
  };

  const getTotalStats = () => {
    let totalTarget = 0,
      totalLogged = 0;
    config.tracks.forEach((track) => {
      const stats = getTrackStats(track);
      totalTarget += stats.totalTarget;
      totalLogged += stats.totalLogged;
    });
    return { totalTarget, totalLogged };
  };

  const getDailyStats = () => {
    let dailyTarget = 0,
      dailyLogged = 0;
    const today = todayDay;

    config.tracks.forEach((track) => {
      if (track.hoursPerDay > 0) {
        if (track.startDay && today < track.startDay) return;
        if (
          track.startDay &&
          track.duration &&
          today >= track.startDay + track.duration
        )
          return;
        dailyTarget += track.hoursPerDay;
        const key = `${track.id}-${today}`;
        dailyLogged += hours[key] || 0;
      }
    });

    // Add misc time for today
    const miscData = dailyMisc[today] || { time: "", comment: "" };
    if (miscData.time) {
      const miscTime = Number.parseFloat(miscData.time) || 0;
      dailyLogged += miscTime;
    }

    return { totalTarget: dailyTarget, totalLogged: dailyLogged };
  };

  // Calculate cumulative hours for graph
  const getCumulativeHours = () => {
    const data = [];
    let cumulativeIdeal = 0;
    let cumulativeActual = 0;

    dates.forEach(({ day }) => {
      // Calculate ideal hours for this day
      let dayIdeal = 0;
      config.tracks.forEach((track) => {
        if (track.hoursPerDay > 0) {
          if (track.startDay && day < track.startDay) return;
          if (
            track.startDay &&
            track.duration &&
            day >= track.startDay + track.duration
          )
            return;
          dayIdeal += track.hoursPerDay;
        }
      });

      // Calculate actual hours for this day
      let dayActual = 0;
      config.tracks.forEach((track) => {
        const key = `${track.id}-${day}`;
        dayActual += hours[key] || 0;
      });

      // Add misc time to actual hours (for productive hours tracking)
      const miscData = dailyMisc[day] || { time: "", comment: "" };
      if (miscData.time) {
        const miscTime = Number.parseFloat(miscData.time) || 0;
        dayActual += miscTime;
      }

      cumulativeIdeal += dayIdeal;
      cumulativeActual += dayActual;

      data.push({
        day,
        ideal: cumulativeIdeal,
        actual: cumulativeActual,
        ideal80: cumulativeIdeal * 0.8,
      });
    });

    return data;
  };

  const graphData = getCumulativeHours();
  const maxHours = 290; // Fixed y-axis range

  // Find today's index in graphData
  const todayIndex = graphData.findIndex((d) => d.day === todayDay);
  const todayData = todayIndex >= 0 ? graphData[todayIndex] : null;

  // Calculate lost hours only up to today
  const lostHours = todayData ? todayData.ideal - todayData.actual : 0;

  // State for viewing notes
  const [viewingNote, setViewingNote] = useState(null);
  const [viewingMisc, setViewingMisc] = useState(null);

  // Progress view toggle (total vs daily)
  const [isDailyProgressView, setIsDailyProgressView] = useState(true);

  // Calculate stats for display
  const totalStats = getTotalStats();
  const dailyStats = getDailyStats();
  const displayStats = isDailyProgressView ? dailyStats : totalStats;
  const totalPercentage = Math.round(
    (displayStats.totalLogged / displayStats.totalTarget || 0) * 100
  );

  // Helper to parse notes with clickable links
  const parseNote = (text) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
    return parts.map((part, i) =>
      part.match(urlRegex) ? (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: theme.accent, wordBreak: "break-all" }}
        >
          {part}
        </a>
      ) : (
        part
      )
    );
  };

  // Helper component for cells with notes - shows indicator, click to view
  const CellWithNote = ({ note, trackName, day, children }) => {
    if (!note) return children;

    return (
      <div
        style={{ position: "relative", cursor: "pointer" }}
        onClick={(e) => {
          e.stopPropagation();
          setViewingNote({ note, trackName, day });
        }}
      >
        {children}
        {/* Note indicator dot */}
        <div
          style={{
            position: "absolute",
            top: 2,
            right: 2,
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: theme.accent,
            boxShadow: `0 0 6px ${theme.accent}`,
          }}
        />
      </div>
    );
  };

  // Title renderer
  const renderTitle = () => {
    const parts = config.title.split(/(\*[^*]+\*)/g);
    return parts.map((part, i) =>
      part.startsWith("*") && part.endsWith("*") ? (
        <em key={i} style={{ fontStyle: "italic" }}>
          {part.slice(1, -1)}
        </em>
      ) : (
        part
      )
    );
  };

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: theme.background,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: theme.textMuted,
          fontFamily: "system-ui, sans-serif",
        }}
      >
        Loading...
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: theme.background,
        color: theme.textPrimary,
        fontFamily: "system-ui, -apple-system, sans-serif",
        padding: "40px 24px",
        position: "relative",
      }}
    >
      {/* Glow effect */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: 500,
          background: `radial-gradient(ellipse 80% 50% at 50% -20%, ${theme.accent}15 0%, transparent 70%)`,
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          maxWidth: 1440,
          margin: "0 auto",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Header */}
        <header
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: 24,
            flexWrap: "wrap",
            marginBottom: 40,
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0)" : "translateY(20px)",
            transition: "all 0.7s cubic-bezier(0.16,1,0.3,1)",
          }}
        >
          <div>
            <h1
              style={{
                fontFamily: "Georgia, serif",
                fontSize: "clamp(32px, 5vw, 44px)",
                fontWeight: 400,
                letterSpacing: "-0.02em",
                margin: 0,
              }}
            >
              {renderTitle()}
            </h1>
            <p style={{ fontSize: 14, color: theme.textMuted, marginTop: 8 }}>
              {config.subtitle}
            </p>
            {!isEditMode && (
              <p
                style={{
                  fontSize: 11,
                  color: theme.textSecondary,
                  marginTop: 6,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: theme.accent,
                    boxShadow: `0 0 6px ${theme.accent}`,
                  }}
                />
                click cells with a dot to view notes
              </p>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {/* Saving indicator */}
            {isSaving && (
              <span style={{ fontSize: 12, color: theme.textMuted }}>
                Saving...
              </span>
            )}

            {/* Edit mode badge */}
            {isEditMode && (
              <span
                style={{
                  fontSize: 10,
                  color: theme.accent,
                  background: `${theme.accent}15`,
                  padding: "4px 10px",
                  borderRadius: 99,
                  border: `1px solid ${theme.accent}30`,
                }}
              >
                ✏️ Edit Mode
              </span>
            )}

            {/* Progress pill */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                background: theme.backgroundSecondary,
                border: `1px solid ${theme.border}`,
                borderRadius: 99,
                padding: "10px 20px",
              }}
            >
              <div style={{ width: 40, height: 40, position: "relative" }}>
                <svg
                  width="40"
                  height="40"
                  viewBox="0 0 40 40"
                  style={{ transform: "rotate(-90deg)" }}
                >
                  <circle
                    cx="20"
                    cy="20"
                    r="16"
                    fill="none"
                    stroke={theme.border}
                    strokeWidth="3"
                  />
                  <circle
                    cx="20"
                    cy="20"
                    r="16"
                    fill="none"
                    stroke={theme.accent}
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 16}
                    strokeDashoffset={
                      2 *
                      Math.PI *
                      16 *
                      (1 - displayStats.totalLogged / displayStats.totalTarget)
                    }
                    style={{
                      transition:
                        "stroke-dashoffset 1s cubic-bezier(0.16,1,0.3,1)",
                    }}
                  />
                </svg>
                <span
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 10,
                    fontWeight: 600,
                  }}
                >
                  {totalPercentage}%
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    justifyContent: "space-between",
                  }}
                >
                  <span
                    style={{
                      fontSize: 10,
                      color: theme.textMuted,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    {isDailyProgressView ? "Daily Progress" : "Total Progress"}
                  </span>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      background: theme.backgroundTertiary,
                      borderRadius: 6,
                      padding: 2,
                      border: `1px solid ${theme.border}`,
                    }}
                  >
                    <button
                      onClick={() => setIsDailyProgressView(false)}
                      style={{
                        padding: "4px 8px",
                        borderRadius: 4,
                        fontSize: 9,
                        fontWeight: 500,
                        cursor: "pointer",
                        border: "none",
                        background: !isDailyProgressView
                          ? theme.accent
                          : "transparent",
                        color: !isDailyProgressView
                          ? "#000"
                          : theme.textSecondary,
                        transition: "all 0.2s",
                      }}
                    >
                      Total
                    </button>
                    <button
                      onClick={() => setIsDailyProgressView(true)}
                      style={{
                        padding: "4px 8px",
                        borderRadius: 4,
                        fontSize: 9,
                        fontWeight: 500,
                        cursor: "pointer",
                        border: "none",
                        background: isDailyProgressView
                          ? theme.accent
                          : "transparent",
                        color: isDailyProgressView
                          ? "#000"
                          : theme.textSecondary,
                        transition: "all 0.2s",
                      }}
                    >
                      Daily
                    </button>
                  </div>
                </div>
                <span style={{ fontSize: 14, fontWeight: 500 }}>
                  {displayStats.totalLogged}h / {displayStats.totalTarget}h
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Grid */}
        <div
          style={{
            background: theme.backgroundSecondary,
            border: `1px solid ${theme.border}`,
            borderRadius: 16,
            overflow: "hidden",
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0)" : "translateY(30px)",
            transition: "all 0.7s cubic-bezier(0.16,1,0.3,1) 0.1s",
          }}
        >
          <div style={{ overflowX: "auto", padding: 4 }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th
                    style={{
                      textAlign: "left",
                      padding: "14px 20px",
                      fontSize: 9,
                      fontWeight: 500,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      color: theme.textMuted,
                      minWidth: 200,
                    }}
                  >
                    Track
                  </th>
                  {dates.map(({ day, dayName, isWeekend, month, year }) => (
                    <th
                      key={day}
                      style={{
                        padding: "14px 6px",
                        fontSize: 9,
                        textAlign: "center",
                        minWidth: 40,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 8,
                          marginBottom: 3,
                          color: theme.textMuted,
                        }}
                      >
                        {dayName}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color:
                            month === todayMonth &&
                            year === todayYear &&
                            day === todayDay
                              ? theme.accent
                              : isWeekend
                              ? theme.textMuted
                              : theme.textSecondary,
                          opacity: isWeekend ? 0.4 : 1,
                        }}
                      >
                        {day}
                      </div>
                    </th>
                  ))}
                  <th
                    style={{
                      textAlign: "right",
                      padding: "14px 20px",
                      fontSize: 9,
                      fontWeight: 500,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      color: theme.textMuted,
                      minWidth: 110,
                    }}
                  >
                    Progress
                  </th>
                </tr>
              </thead>
              <tbody>
                {config.tracks.map((track, i) => {
                  const stats = getTrackStats(track);
                  const pct =
                    stats.totalTarget > 0
                      ? stats.totalLogged / stats.totalTarget
                      : 0;

                  return (
                    <tr
                      key={track.id}
                      style={{
                        opacity: mounted ? 1 : 0,
                        transform: mounted
                          ? "translateX(0)"
                          : "translateX(-20px)",
                        transition: `all 0.5s cubic-bezier(0.16,1,0.3,1) ${
                          0.04 * i
                        }s`,
                      }}
                    >
                      <td style={{ padding: "10px 20px" }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                          }}
                        >
                          <div
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: 10,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 16,
                              background: `${track.color}12`,
                              border: `1px solid ${track.color}25`,
                            }}
                          >
                            {track.icon}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                flexWrap: "wrap",
                              }}
                            >
                              <span style={{ fontSize: 13, fontWeight: 500 }}>
                                {track.name}
                              </span>
                              {track.hoursPerDay > 0 && (
                                <span
                                  style={{
                                    fontSize: 10,
                                    color: theme.textMuted,
                                    background: theme.backgroundTertiary,
                                    padding: "2px 7px",
                                    borderRadius: 99,
                                  }}
                                >
                                  {track.hoursPerDay}h/day
                                </span>
                              )}
                              {track.resources.length > 0 && (
                                <button
                                  onClick={() =>
                                    setSelectedTrack(
                                      selectedTrack === track.id
                                        ? null
                                        : track.id
                                    )
                                  }
                                  style={{
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    padding: "3px 7px",
                                    color: theme.textMuted,
                                    fontSize: 9,
                                    borderRadius: 4,
                                  }}
                                >
                                  {selectedTrack === track.id ? "▲" : "▼"} Links
                                </button>
                              )}
                            </div>
                            {selectedTrack === track.id &&
                              track.resources.length > 0 && (
                                <div
                                  style={{
                                    marginTop: 8,
                                    display: "flex",
                                    flexWrap: "wrap",
                                    gap: 5,
                                  }}
                                >
                                  {track.resources.map((r, j) => (
                                    <a
                                      key={j}
                                      href={r.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      style={{
                                        fontSize: 10,
                                        padding: "3px 8px",
                                        background: theme.backgroundTertiary,
                                        border: `1px solid ${theme.border}`,
                                        borderRadius: 5,
                                        color: theme.textSecondary,
                                        textDecoration: "none",
                                      }}
                                    >
                                      {r.name} ↗
                                    </a>
                                  ))}
                                </div>
                              )}
                          </div>
                        </div>
                      </td>
                      {dates.map(({ day }) => {
                        const key = `${track.id}-${day}`;
                        const logged = hours[key] || 0;
                        const cellNote = notes[key] || "";
                        const active =
                          track.hoursPerDay > 0 &&
                          (!track.startDay ||
                            (day >= track.startDay &&
                              (!track.duration ||
                                day < track.startDay + track.duration)));
                        const totalPixels = track.hoursPerDay;
                        const filledPixels = Math.floor(logged);
                        const halfFilled = logged % 1 >= 0.5;
                        const hasAnyProgress = logged > 0;

                        return (
                          <td key={day} style={{ padding: "5px 3px" }}>
                            <CellWithNote
                              note={cellNote}
                              trackName={track.name}
                              day={day}
                            >
                              <button
                                onClick={() =>
                                  active &&
                                  incrementHours(
                                    track.id,
                                    day,
                                    track.hoursPerDay
                                  )
                                }
                                onContextMenu={(e) =>
                                  active && openNoteEditor(track.id, day, e)
                                }
                                disabled={!active}
                                style={{
                                  minWidth: 38,
                                  height: 30,
                                  borderRadius: 6,
                                  border: "none",
                                  cursor: active
                                    ? isEditMode
                                      ? "pointer"
                                      : "default"
                                    : "default",
                                  background: !active
                                    ? theme.background
                                    : hasAnyProgress
                                    ? "rgba(255,255,255,0.04)"
                                    : theme.backgroundTertiary,
                                  opacity: !active ? 0.2 : 1,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  gap: 3,
                                  flexWrap: "wrap",
                                  padding: "6px 5px",
                                  transition: "all 0.2s",
                                  position: "relative",
                                  border: hasAnyProgress
                                    ? "1px solid rgba(255,255,255,0.06)"
                                    : "none",
                                }}
                              >
                                {active &&
                                  Array.from({ length: totalPixels }).map(
                                    (_, idx) => {
                                      const isFilled = idx < filledPixels;
                                      const isHalf =
                                        idx === filledPixels && halfFilled;
                                      return (
                                        <span
                                          key={idx}
                                          style={{
                                            width: 6,
                                            height: 6,
                                            borderRadius: 1,
                                            background:
                                              isFilled || isHalf
                                                ? track.color
                                                : theme.textMuted,
                                            opacity: isFilled
                                              ? 1
                                              : isHalf
                                              ? 0.5
                                              : 0.15,
                                            boxShadow: isFilled
                                              ? `0 0 6px ${track.color}`
                                              : isHalf
                                              ? `0 0 4px ${track.color}`
                                              : "none",
                                          }}
                                        />
                                      );
                                    }
                                  )}
                              </button>
                            </CellWithNote>
                          </td>
                        );
                      })}
                      <td style={{ padding: "10px 20px" }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "flex-end",
                            gap: 10,
                          }}
                        >
                          {stats.totalTarget > 0 ? (
                            <>
                              <div
                                style={{
                                  width: 55,
                                  height: 3,
                                  background: theme.backgroundTertiary,
                                  borderRadius: 2,
                                  overflow: "hidden",
                                }}
                              >
                                <div
                                  style={{
                                    width: `${pct * 100}%`,
                                    height: "100%",
                                    background: track.color,
                                    borderRadius: 2,
                                    transition: "width 0.5s",
                                  }}
                                />
                              </div>
                              <span
                                style={{
                                  fontSize: 11,
                                  color: theme.textSecondary,
                                  minWidth: 50,
                                  textAlign: "right",
                                  fontFamily: "monospace",
                                }}
                              >
                                {stats.totalLogged}/{stats.totalTarget}h
                              </span>
                            </>
                          ) : (
                            <span
                              style={{ fontSize: 11, color: theme.textMuted }}
                            >
                              —
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {/* Daily Highlights Row */}
                <tr
                  style={{
                    borderTop: `2px solid ${theme.border}`,
                    opacity: mounted ? 1 : 0,
                    transition: "all 0.5s cubic-bezier(0.16,1,0.3,1) 0.3s",
                  }}
                >
                  <td style={{ padding: "14px 20px" }}>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 12 }}
                    >
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 10,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 16,
                          background: `${theme.accent}12`,
                          border: `1px solid ${theme.accent}25`,
                        }}
                      >
                        💡
                      </div>
                      <div>
                        <span style={{ fontSize: 13, fontWeight: 500 }}>
                          Today's Highlights
                        </span>
                        <div
                          style={{
                            fontSize: 10,
                            color: theme.textMuted,
                            marginTop: 2,
                          }}
                        >
                          Interesting reads, watches, ideas
                        </div>
                      </div>
                    </div>
                  </td>
                  {dates.map(({ day }) => {
                    const highlight = dailyHighlights[day] || "";
                    const hasHighlight = highlight.length > 0;

                    return (
                      <td key={day} style={{ padding: "5px 3px" }}>
                        <CellWithNote
                          note={highlight}
                          trackName="Today's Highlight"
                          day={day}
                        >
                          <button
                            onClick={() => openHighlightEditor(day)}
                            style={{
                              minWidth: 38,
                              height: 30,
                              borderRadius: 6,
                              border: "none",
                              cursor: isEditMode ? "pointer" : "default",
                              background: hasHighlight
                                ? `${theme.accent}15`
                                : theme.backgroundTertiary,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              transition: "all 0.2s",
                              color: hasHighlight
                                ? theme.accent
                                : theme.textMuted,
                              fontSize: 14,
                              border: hasHighlight
                                ? `1px solid ${theme.accent}30`
                                : "none",
                            }}
                          >
                            {hasHighlight ? "✦" : isEditMode ? "+" : ""}
                          </button>
                        </CellWithNote>
                      </td>
                    );
                  })}
                  <td style={{ padding: "14px 20px" }}>
                    <span style={{ fontSize: 11, color: theme.textMuted }}>
                      —
                    </span>
                  </td>
                </tr>

                {/* Daily Misc Row */}
                <tr
                  style={{
                    borderTop: `2px solid ${theme.border}`,
                    opacity: mounted ? 1 : 0,
                    transition: "all 0.5s cubic-bezier(0.16,1,0.3,1) 0.3s",
                  }}
                >
                  <td style={{ padding: "14px 20px" }}>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 12 }}
                    >
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 10,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 16,
                          background: `${theme.accent}12`,
                          border: `1px solid ${theme.accent}25`,
                        }}
                      >
                        📌
                      </div>
                      <div>
                        <span style={{ fontSize: 13, fontWeight: 500 }}>
                          Misc
                        </span>
                        <div
                          style={{
                            fontSize: 10,
                            color: theme.textMuted,
                            marginTop: 2,
                          }}
                        >
                          Time & comments
                        </div>
                      </div>
                    </div>
                  </td>
                  {dates.map(({ day }) => {
                    const miscData = dailyMisc[day] || {
                      time: "",
                      comment: "",
                    };
                    const hasMisc = miscData.time || miscData.comment;

                    return (
                      <td key={day} style={{ padding: "5px 3px" }}>
                        <button
                          onClick={() => openMiscEditor(day)}
                          style={{
                            minWidth: 38,
                            height: 30,
                            borderRadius: 6,
                            border: hasMisc
                              ? `1px solid ${theme.accent}30`
                              : "none",
                            cursor: isEditMode ? "pointer" : "default",
                            background: hasMisc
                              ? `${theme.accent}15`
                              : theme.backgroundTertiary,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            transition: "all 0.2s",
                            color: hasMisc ? theme.accent : theme.textMuted,
                            fontSize: 14,
                          }}
                        >
                          {hasMisc ? "📌" : isEditMode ? "+" : ""}
                        </button>
                      </td>
                    );
                  })}
                  <td style={{ padding: "14px 20px" }}>
                    <span style={{ fontSize: 11, color: theme.textMuted }}>
                      —
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary Cards */}
        {config.features?.showSummaryCards && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
              gap: 10,
              marginTop: 20,
              opacity: mounted ? 1 : 0,
              transition: "all 0.7s cubic-bezier(0.16,1,0.3,1) 0.2s",
            }}
          >
            {config.tracks
              .filter((t) => t.hoursPerDay > 0)
              .map((track) => {
                const stats = getTrackStats(track);
                const pct =
                  stats.totalTarget > 0
                    ? Math.round((stats.totalLogged / stats.totalTarget) * 100)
                    : 0;

                return (
                  <div
                    key={track.id}
                    style={{
                      background: theme.backgroundSecondary,
                      border: `1px solid ${theme.border}`,
                      borderRadius: 14,
                      padding: 16,
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        height: 2,
                        background: track.color,
                        borderRadius: "14px 14px 0 0",
                      }}
                    />
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        marginBottom: 10,
                      }}
                    >
                      <span style={{ fontSize: 14 }}>{track.icon}</span>
                      <span style={{ fontSize: 11, color: theme.textMuted }}>
                        {track.name}
                      </span>
                    </div>
                    <div
                      style={{
                        fontFamily: "Georgia, serif",
                        fontSize: 32,
                        lineHeight: 1,
                        marginBottom: 2,
                        color: track.color,
                      }}
                    >
                      {pct}%
                    </div>
                    <div style={{ fontSize: 11, color: theme.textMuted }}>
                      {stats.totalLogged}h of {stats.totalTarget}h
                    </div>
                  </div>
                );
              })}
          </div>
        )}

        {/* Progress Graph */}
        <div
          style={{
            background: theme.backgroundSecondary,
            border: `1px solid ${theme.border}`,
            borderRadius: 16,
            padding: 24,
            marginTop: 20,
            opacity: mounted ? 1 : 0,
            transition: "all 0.7s cubic-bezier(0.16,1,0.3,1) 0.25s",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 20,
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <div>
              <h2
                style={{
                  fontSize: 18,
                  fontWeight: 500,
                  margin: 0,
                  marginBottom: 4,
                }}
              >
                Intent vs Action
              </h2>
              <p
                style={{
                  fontSize: 12,
                  color: theme.textMuted,
                  margin: 0,
                }}
              >
                Ideal vs actual cumulative productive hours
              </p>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                flexWrap: "wrap",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 12px",
                  background: theme.backgroundTertiary,
                  borderRadius: 8,
                  border: `1px solid ${theme.border}`,
                }}
              >
                <div
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    background: theme.accent,
                  }}
                />
                <span style={{ fontSize: 11, color: theme.textSecondary }}>
                  Actual:{" "}
                  {graphData.length > 0
                    ? graphData[graphData.length - 1].actual.toFixed(1)
                    : 0}
                  h
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 12px",
                  background: theme.backgroundTertiary,
                  borderRadius: 8,
                  border: `1px solid ${theme.border}`,
                }}
              >
                <div
                  style={{
                    width: 12,
                    height: 2,
                    background: "#10b981",
                    opacity: 0.6,
                  }}
                />
                <span style={{ fontSize: 11, color: theme.textSecondary }}>
                  80% Ideal:{" "}
                  {graphData.length > 0
                    ? graphData[graphData.length - 1].ideal80.toFixed(1)
                    : 0}
                  h
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 12px",
                  background: theme.backgroundTertiary,
                  borderRadius: 8,
                  border: `1px solid ${theme.border}`,
                }}
              >
                <div
                  style={{
                    width: 12,
                    height: 2,
                    background: "#6366f1",
                    opacity: 0.4,
                  }}
                />
                <span style={{ fontSize: 11, color: theme.textSecondary }}>
                  Ideal:{" "}
                  {graphData.length > 0
                    ? graphData[graphData.length - 1].ideal.toFixed(1)
                    : 0}
                  h
                </span>
              </div>
              {lostHours > 0 && (
                <div
                  style={{
                    padding: "8px 12px",
                    background: `${theme.accent}15`,
                    borderRadius: 8,
                    border: `1px solid ${theme.accent}30`,
                  }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      color: theme.accent,
                      fontWeight: 500,
                    }}
                  >
                    Avoidance Debt: {lostHours.toFixed(1)}h
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* SVG Graph */}
          <div
            style={{
              position: "relative",
              width: "100%",
              height: 300,
              overflow: "hidden",
            }}
          >
            <svg
              width="100%"
              height="300"
              style={{ display: "block" }}
              viewBox="0 0 1000 300"
              preserveAspectRatio="xMidYMid meet"
            >
              <defs>
                <linearGradient
                  id="actualGradient"
                  x1="0%"
                  y1="0%"
                  x2="0%"
                  y2="100%"
                >
                  <stop
                    offset="0%"
                    stopColor={theme.accent}
                    stopOpacity="0.2"
                  />
                  <stop
                    offset="100%"
                    stopColor={theme.accent}
                    stopOpacity="0"
                  />
                </linearGradient>
              </defs>

              {/* Grid lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
                <line
                  key={ratio}
                  x1="40"
                  y1={20 + 260 * (1 - ratio)}
                  x2="960"
                  y2={20 + 260 * (1 - ratio)}
                  stroke={theme.border}
                  strokeWidth="1"
                  opacity="0.3"
                  strokeDasharray="4 4"
                />
              ))}

              {/* Ideal line (dashed) */}
              {graphData.length > 0 && (
                <polyline
                  points={graphData
                    .map((d, i) => {
                      const x =
                        40 + (i / Math.max(1, graphData.length - 1)) * 920;
                      const y = 20 + 260 - (d.ideal / maxHours) * 260;
                      return `${x},${y}`;
                    })
                    .join(" ")}
                  fill="none"
                  stroke="#6366f1"
                  strokeWidth="2"
                  opacity="0.4"
                  strokeDasharray="6 4"
                />
              )}

              {/* 80% Ideal line (dashed) */}
              {graphData.length > 0 && (
                <polyline
                  points={graphData
                    .map((d, i) => {
                      const x =
                        40 + (i / Math.max(1, graphData.length - 1)) * 920;
                      const y = 20 + 260 - (d.ideal80 / maxHours) * 260;
                      return `${x},${y}`;
                    })
                    .join(" ")}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2"
                  opacity="0.6"
                  strokeDasharray="4 4"
                />
              )}

              {/* Actual line area fill - up to today */}
              {graphData.length > 1 && todayIndex >= 0 && (
                <polygon
                  points={`40,280 ${graphData
                    .slice(0, todayIndex + 1)
                    .map((d, i) => {
                      const x =
                        40 + (i / Math.max(1, graphData.length - 1)) * 920;
                      const y = 20 + 260 - (d.actual / maxHours) * 260;
                      return `${x},${y}`;
                    })
                    .join(" ")} ${
                    40 + (todayIndex / Math.max(1, graphData.length - 1)) * 920
                  },280`}
                  fill="url(#actualGradient)"
                />
              )}

              {/* Actual line area fill - if no today found, show all */}
              {graphData.length > 1 && todayIndex < 0 && (
                <polygon
                  points={`40,280 ${graphData
                    .map((d, i) => {
                      const x = 40 + (i / (graphData.length - 1)) * 920;
                      const y = 20 + 260 - (d.actual / maxHours) * 260;
                      return `${x},${y}`;
                    })
                    .join(" ")} 960,280`}
                  fill="url(#actualGradient)"
                />
              )}

              {/* Actual line (solid) - up to today (highlighted) */}
              {graphData.length > 0 && todayIndex >= 0 && (
                <polyline
                  points={graphData
                    .slice(0, todayIndex + 1)
                    .map((d, i) => {
                      const x =
                        40 + (i / Math.max(1, graphData.length - 1)) * 920;
                      const y = 20 + 260 - (d.actual / maxHours) * 260;
                      return `${x},${y}`;
                    })
                    .join(" ")}
                  fill="none"
                  stroke={theme.accent}
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Actual line (solid) - after today (faded) */}
              {graphData.length > 0 &&
                todayIndex >= 0 &&
                todayIndex < graphData.length - 1 && (
                  <polyline
                    points={graphData
                      .slice(todayIndex)
                      .map((d, i) => {
                        const x =
                          40 +
                          ((todayIndex + i) /
                            Math.max(1, graphData.length - 1)) *
                            920;
                        const y = 20 + 260 - (d.actual / maxHours) * 260;
                        return `${x},${y}`;
                      })
                      .join(" ")}
                    fill="none"
                    stroke={theme.accent}
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity="0.3"
                  />
                )}

              {/* Actual line (solid) - if no today found, show all */}
              {graphData.length > 0 && todayIndex < 0 && (
                <polyline
                  points={graphData
                    .map((d, i) => {
                      const x =
                        40 + (i / Math.max(1, graphData.length - 1)) * 920;
                      const y = 20 + 260 - (d.actual / maxHours) * 260;
                      return `${x},${y}`;
                    })
                    .join(" ")}
                  fill="none"
                  stroke={theme.accent}
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Data points for actual - up to today (highlighted) */}
              {graphData.map((d, i) => {
                const cx = 40 + (i / Math.max(1, graphData.length - 1)) * 920;
                const cy = 20 + 260 - (d.actual / maxHours) * 260;
                const isTodayOrBefore =
                  todayIndex >= 0 ? i <= todayIndex : true;
                return (
                  <circle
                    key={i}
                    cx={cx}
                    cy={cy}
                    r="4"
                    fill={theme.accent}
                    opacity={isTodayOrBefore ? 1 : 0.3}
                    style={{
                      filter: isTodayOrBefore
                        ? `drop-shadow(0 0 4px ${theme.accent})`
                        : "none",
                    }}
                  />
                );
              })}

              {/* Y-axis labels */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
                <text
                  key={ratio}
                  x="35"
                  y={20 + 260 * (1 - ratio) + 4}
                  fill={theme.textMuted}
                  fontSize="10"
                  textAnchor="end"
                >
                  {Math.round(maxHours * ratio)}h
                </text>
              ))}
              {/* Y-axis title */}
              <text
                x="15"
                y="150"
                fill={theme.textMuted}
                fontSize="9"
                textAnchor="middle"
                transform="rotate(-90, 15, 150)"
                style={{ fontWeight: 500 }}
              >
                Productive Hours
              </text>

              {/* X-axis labels */}
              {graphData.length > 0 &&
                graphData
                  .map((d, i) => ({ d, i }))
                  .filter(({ i }) => {
                    const step = Math.max(1, Math.floor(graphData.length / 8));
                    return i % step === 0 || i === graphData.length - 1;
                  })
                  .map(({ d, i }) => {
                    const xPos =
                      40 + (i / Math.max(1, graphData.length - 1)) * 920;
                    return (
                      <g key={i}>
                        <line
                          x1={xPos}
                          y1="280"
                          x2={xPos}
                          y2="285"
                          stroke={theme.border}
                          strokeWidth="1"
                        />
                        <text
                          x={xPos}
                          y="300"
                          fill={theme.textMuted}
                          fontSize="9"
                          textAnchor="middle"
                        >
                          Day {d.day}
                        </text>
                      </g>
                    );
                  })}
            </svg>
          </div>
        </div>

        {/* Footer */}
        <footer
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: 40,
            paddingTop: 24,
            borderTop: `1px solid ${theme.border}`,
            opacity: mounted ? 0.8 : 0,
          }}
        >
          <div>
            <p style={{ fontSize: 12, color: theme.textMuted }}>
              Deep work season 🌙
            </p>
            <p
              style={{
                fontSize: 10,
                color: theme.textMuted,
                marginTop: 4,
                opacity: 0.7,
              }}
            >
              {isEditMode
                ? "Click cells to log hours · Right-click to add notes"
                : "View only mode"}
            </p>
            <p
              style={{
                fontSize: 11,
                color: theme.textSecondary,
                marginTop: 10,
              }}
            >
              find more about me on:{" "}
              <a
                href="https://armaansandhu.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: theme.accent, textDecoration: "none" }}
              >
                armaansandhu.vercel.app
              </a>
            </p>
          </div>

          {/* Auth button */}
          <button
            onClick={() =>
              isEditMode ? handleLogout() : setShowLoginModal(true)
            }
            style={{
              background: "none",
              border: `1px solid ${theme.border}`,
              borderRadius: 6,
              padding: "6px 12px",
              color: theme.textMuted,
              fontSize: 11,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              transition: "all 0.2s",
            }}
          >
            {isEditMode ? "🔓 Logout" : "🔒 Login to Edit"}
          </button>
        </footer>

        {/* Login Modal */}
        {showLoginModal && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.8)",
              backdropFilter: "blur(4px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
              padding: 20,
            }}
            onClick={() => setShowLoginModal(false)}
          >
            <div
              style={{
                background: theme.backgroundSecondary,
                border: `1px solid ${theme.border}`,
                borderRadius: 16,
                padding: 24,
                width: "100%",
                maxWidth: 360,
                boxShadow: "0 25px 50px rgba(0,0,0,0.5)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 18, fontWeight: 500, marginBottom: 4 }}>
                  🔒 Enter Edit Mode
                </div>
                <div style={{ fontSize: 12, color: theme.textMuted }}>
                  Enter your password to make changes
                </div>
              </div>

              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                placeholder="Password"
                autoFocus
                style={{
                  width: "100%",
                  background: theme.backgroundTertiary,
                  border: `1px solid ${loginError ? "#ef4444" : theme.border}`,
                  borderRadius: 8,
                  padding: 12,
                  color: theme.textPrimary,
                  fontSize: 14,
                  marginBottom: 8,
                }}
              />

              {loginError && (
                <div
                  style={{ fontSize: 12, color: "#ef4444", marginBottom: 12 }}
                >
                  {loginError}
                </div>
              )}

              <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                <button
                  onClick={() => setShowLoginModal(false)}
                  style={{
                    flex: 1,
                    padding: "10px 16px",
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: "pointer",
                    background: theme.backgroundTertiary,
                    border: `1px solid ${theme.border}`,
                    color: theme.textSecondary,
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogin}
                  style={{
                    flex: 1,
                    padding: "10px 16px",
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: "pointer",
                    background: theme.accent,
                    border: `1px solid ${theme.accent}`,
                    color: "#000",
                  }}
                >
                  Login
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Note Editor Modal */}
        {editingCell && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.8)",
              backdropFilter: "blur(4px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
              padding: 20,
            }}
            onClick={closeNoteEditor}
          >
            <div
              style={{
                background: theme.backgroundSecondary,
                border: `1px solid ${theme.border}`,
                borderRadius: 16,
                padding: 24,
                width: "100%",
                maxWidth: 500,
                boxShadow: "0 25px 50px rgba(0,0,0,0.5)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 16,
                }}
              >
                <div>
                  <div style={{ fontSize: 16, fontWeight: 500 }}>Add Note</div>
                  <div
                    style={{
                      fontSize: 12,
                      color: theme.textMuted,
                      marginTop: 2,
                    }}
                  >
                    {
                      config.tracks.find((t) => t.id === editingCell.trackId)
                        ?.name
                    }{" "}
                    · Day {editingCell.day}
                  </div>
                </div>
                <button
                  onClick={closeNoteEditor}
                  style={{
                    background: "none",
                    border: "none",
                    color: theme.textMuted,
                    fontSize: 20,
                    cursor: "pointer",
                    padding: "4px 8px",
                  }}
                >
                  ×
                </button>
              </div>
              <textarea
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                placeholder="What did you work on? Add links, notes, or reflections..."
                autoFocus
                style={{
                  width: "100%",
                  background: theme.backgroundTertiary,
                  border: `1px solid ${theme.border}`,
                  borderRadius: 8,
                  padding: 12,
                  color: theme.textPrimary,
                  fontSize: 14,
                  fontFamily: "inherit",
                  resize: "vertical",
                  minHeight: 100,
                  marginBottom: 16,
                }}
              />
              <div
                style={{
                  fontSize: 11,
                  color: theme.textMuted,
                  marginBottom: 16,
                }}
              >
                💡 Tip: Paste URLs and they'll become clickable links
              </div>
              <div
                style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}
              >
                <button
                  onClick={closeNoteEditor}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 6,
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: "pointer",
                    background: theme.backgroundTertiary,
                    border: `1px solid ${theme.border}`,
                    color: theme.textSecondary,
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={saveNote}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 6,
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: "pointer",
                    background: theme.accent,
                    border: `1px solid ${theme.accent}`,
                    color: "#000",
                  }}
                >
                  Save Note
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Highlight Editor Modal */}
        {editingHighlight && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.8)",
              backdropFilter: "blur(4px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
              padding: 20,
            }}
            onClick={closeHighlightEditor}
          >
            <div
              style={{
                background: theme.backgroundSecondary,
                border: `1px solid ${theme.border}`,
                borderRadius: 16,
                padding: 24,
                width: "100%",
                maxWidth: 500,
                boxShadow: "0 25px 50px rgba(0,0,0,0.5)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 16,
                }}
              >
                <div>
                  <div style={{ fontSize: 16, fontWeight: 500 }}>
                    💡 Today's Highlight
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: theme.textMuted,
                      marginTop: 2,
                    }}
                  >
                    January {editingHighlight}, 2026
                  </div>
                </div>
                <button
                  onClick={closeHighlightEditor}
                  style={{
                    background: "none",
                    border: "none",
                    color: theme.textMuted,
                    fontSize: 20,
                    cursor: "pointer",
                    padding: "4px 8px",
                  }}
                >
                  ×
                </button>
              </div>
              <textarea
                value={highlightInput}
                onChange={(e) => setHighlightInput(e.target.value)}
                placeholder="What interesting thing did you read, watch, or discover today?"
                autoFocus
                style={{
                  width: "100%",
                  background: theme.backgroundTertiary,
                  border: `1px solid ${theme.border}`,
                  borderRadius: 8,
                  padding: 12,
                  color: theme.textPrimary,
                  fontSize: 14,
                  fontFamily: "inherit",
                  resize: "vertical",
                  minHeight: 100,
                  marginBottom: 16,
                }}
              />
              <div
                style={{
                  fontSize: 11,
                  color: theme.textMuted,
                  marginBottom: 16,
                }}
              >
                💡 Papers, podcasts, videos, articles — anything worth
                remembering
              </div>
              <div
                style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}
              >
                <button
                  onClick={closeHighlightEditor}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 6,
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: "pointer",
                    background: theme.backgroundTertiary,
                    border: `1px solid ${theme.border}`,
                    color: theme.textSecondary,
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={saveHighlight}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 6,
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: "pointer",
                    background: theme.accent,
                    border: `1px solid ${theme.accent}`,
                    color: "#000",
                  }}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Misc Editor Modal */}
        {editingMisc && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.8)",
              backdropFilter: "blur(4px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
              padding: 20,
            }}
            onClick={closeMiscEditor}
          >
            <div
              style={{
                background: theme.backgroundSecondary,
                border: `1px solid ${theme.border}`,
                borderRadius: 16,
                padding: 24,
                width: "100%",
                maxWidth: 500,
                boxShadow: "0 25px 50px rgba(0,0,0,0.5)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 16,
                }}
              >
                <div>
                  <div style={{ fontSize: 16, fontWeight: 500 }}>
                    📌 Misc Activity
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: theme.textMuted,
                      marginTop: 2,
                    }}
                  >
                    January {editingMisc}, 2026
                  </div>
                </div>
                <button
                  onClick={closeMiscEditor}
                  style={{
                    background: "none",
                    border: "none",
                    color: theme.textMuted,
                    fontSize: 20,
                    cursor: "pointer",
                    padding: "4px 8px",
                  }}
                >
                  ×
                </button>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label
                  style={{
                    display: "block",
                    fontSize: 12,
                    color: theme.textMuted,
                    marginBottom: 8,
                  }}
                >
                  Time (hours)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={miscTimeInput}
                  onChange={(e) => setMiscTimeInput(e.target.value)}
                  placeholder="e.g., 2.5"
                  autoFocus
                  style={{
                    width: "100%",
                    background: theme.backgroundTertiary,
                    border: `1px solid ${theme.border}`,
                    borderRadius: 8,
                    padding: 12,
                    color: theme.textPrimary,
                    fontSize: 14,
                  }}
                />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label
                  style={{
                    display: "block",
                    fontSize: 12,
                    color: theme.textMuted,
                    marginBottom: 8,
                  }}
                >
                  Comments
                </label>
                <textarea
                  value={miscCommentInput}
                  onChange={(e) => setMiscCommentInput(e.target.value)}
                  placeholder="What did you do? Add any notes or details..."
                  style={{
                    width: "100%",
                    background: theme.backgroundTertiary,
                    border: `1px solid ${theme.border}`,
                    borderRadius: 8,
                    padding: 12,
                    color: theme.textPrimary,
                    fontSize: 14,
                    fontFamily: "inherit",
                    resize: "vertical",
                    minHeight: 100,
                  }}
                />
              </div>
              <div
                style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}
              >
                <button
                  onClick={closeMiscEditor}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 6,
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: "pointer",
                    background: theme.backgroundTertiary,
                    border: `1px solid ${theme.border}`,
                    color: theme.textSecondary,
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={saveMisc}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 6,
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: "pointer",
                    background: theme.accent,
                    border: `1px solid ${theme.accent}`,
                    color: "#000",
                  }}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Note Viewer Modal */}
        {viewingNote && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.8)",
              backdropFilter: "blur(4px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
              padding: 20,
            }}
            onClick={() => setViewingNote(null)}
          >
            <div
              style={{
                background: theme.backgroundSecondary,
                border: `1px solid ${theme.border}`,
                borderRadius: 16,
                padding: 24,
                width: "100%",
                maxWidth: 500,
                maxHeight: "80vh",
                display: "flex",
                flexDirection: "column",
                boxShadow: "0 25px 50px rgba(0,0,0,0.5)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 16,
                }}
              >
                <div>
                  <div style={{ fontSize: 16, fontWeight: 500 }}>📝 Note</div>
                  <div
                    style={{
                      fontSize: 12,
                      color: theme.textMuted,
                      marginTop: 2,
                    }}
                  >
                    {viewingNote.trackName} · Day {viewingNote.day}
                  </div>
                </div>
                <button
                  onClick={() => setViewingNote(null)}
                  style={{
                    background: "none",
                    border: "none",
                    color: theme.textMuted,
                    fontSize: 20,
                    cursor: "pointer",
                    padding: "4px 8px",
                  }}
                >
                  ×
                </button>
              </div>
              <div
                style={{
                  background: theme.backgroundTertiary,
                  border: `1px solid ${theme.border}`,
                  borderRadius: 10,
                  padding: 16,
                  fontSize: 14,
                  lineHeight: 1.7,
                  color: theme.textPrimary,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  overflowY: "auto",
                  flex: 1,
                }}
              >
                {parseNote(viewingNote.note)}
              </div>
            </div>
          </div>
        )}

        {/* Misc Viewer Modal */}
        {viewingMisc && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.8)",
              backdropFilter: "blur(4px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
              padding: 20,
            }}
            onClick={() => setViewingMisc(null)}
          >
            <div
              style={{
                background: theme.backgroundSecondary,
                border: `1px solid ${theme.border}`,
                borderRadius: 16,
                padding: 24,
                width: "100%",
                maxWidth: 500,
                maxHeight: "80vh",
                display: "flex",
                flexDirection: "column",
                boxShadow: "0 25px 50px rgba(0,0,0,0.5)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 16,
                }}
              >
                <div>
                  <div style={{ fontSize: 16, fontWeight: 500 }}>
                    📌 Misc Activity
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: theme.textMuted,
                      marginTop: 2,
                    }}
                  >
                    Day {viewingMisc.day}
                  </div>
                </div>
                <button
                  onClick={() => setViewingMisc(null)}
                  style={{
                    background: "none",
                    border: "none",
                    color: theme.textMuted,
                    fontSize: 20,
                    cursor: "pointer",
                    padding: "4px 8px",
                  }}
                >
                  ×
                </button>
              </div>
              <div
                style={{
                  background: theme.backgroundTertiary,
                  border: `1px solid ${theme.border}`,
                  borderRadius: 10,
                  padding: 16,
                  fontSize: 14,
                  lineHeight: 1.7,
                  color: theme.textPrimary,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  overflowY: "auto",
                  flex: 1,
                }}
              >
                {viewingMisc.time && (
                  <div style={{ marginBottom: 12 }}>
                    <div
                      style={{
                        fontSize: 11,
                        color: theme.textMuted,
                        marginBottom: 4,
                      }}
                    >
                      Time
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 500 }}>
                      {viewingMisc.time}h
                    </div>
                  </div>
                )}
                {viewingMisc.comment && (
                  <div>
                    {viewingMisc.time && (
                      <div
                        style={{
                          fontSize: 11,
                          color: theme.textMuted,
                          marginBottom: 4,
                          marginTop: viewingMisc.time ? 12 : 0,
                        }}
                      >
                        Comments
                      </div>
                    )}
                    <div>{parseNote(viewingMisc.comment)}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
