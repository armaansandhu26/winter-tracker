// ============================================================
// WINTER TRACKER - CONFIGURATION FILE
// ============================================================
// Edit this file to customize your tracker!
// ============================================================

const config = {
  // ----------------------------------------------------------
  // GENERAL SETTINGS
  // ----------------------------------------------------------
  title: "Winter *Deep* Work", // Wrap text in *asterisks* for emphasis
  subtitle: "January 6–31, 2026 // Building foundations",

  // Date range for your tracker
  startDate: new Date(2026, 0, 6), // Month is 0-indexed (0 = January)
  endDate: new Date(2026, 0, 31),

  // ----------------------------------------------------------
  // TRACKS
  // ----------------------------------------------------------
  tracks: [
    {
      id: "karpathy",
      name: "Karpathy's 0→Hero",
      icon: "🧠",
      color: "#10b981",
      hoursPerDay: 4,
      priority: 1,
      notes: "Complete the full neural networks series",
      startDay: 6,
      duration: 26, // Active until Jan 31 for logging
      targetEndDay: 19, // Target only counts until Jan 19 (original 14 days, 56 hours) to keep total at 290
      resources: [
        {
          name: "YouTube Playlist",
          url: "https://www.youtube.com/playlist?list=PLAqhIrjkxbuWI23v9cThsA9GvCAUhRvKZ",
        },
      ],
    },
    {
      id: "apply",
      name: "Research Outreach",
      icon: "📝",
      color: "#f97316",
      hoursPerDay: 2,
      priority: 1,
      notes: "",
      resources: [],
    },
    {
      id: "collab",
      name: "Project collaboration",
      icon: "🤝",
      color: "#eab308",
      hoursPerDay: 2,
      priority: 2,
      notes: "Research project collaboration",
      resources: [{ name: "Airtable", url: "https://airtable.com" }],
    },
    {
      id: "ytresources",
      name: "Learning from Curated Content",
      icon: "📺",
      color: "#06b6d4",
      hoursPerDay: 2,
      priority: 3,
      notes: "Stay updated with AI research content",
      resources: [
        {
          name: "Shaily99 Research",
          url: "https://github.com/shaily99/advice?tab=readme-ov-file#research",
        },
        { name: "Neel Nanda", url: "https://x.com/NeelNanda5" },
        {
          name: "No Priors Podcast",
          url: "https://www.youtube.com/@NoPriorsPodcast",
        },
        {
          name: "Dwarkesh Patel",
          url: "https://www.youtube.com/@DwarkeshPatel",
        },
        {
          name: "Noam Brown",
          url: "https://www.youtube.com/watch?v=3PT82ivnc9Y",
        },
      ],
    },
    {
      id: "posts",
      name: "Share Work & Updates",
      icon: "✨",
      color: "#a855f7",
      hoursPerDay: 1,
      priority: 4,
      notes: "Build in public, share learnings",
      resources: [],
    },
    {
      id: "courses",
      name: "Courses",
      icon: "📚",
      color: "#ec4899",
      hoursPerDay: 2,
      priority: 2,
      notes: "RL and deep learning fundamentals",
      resources: [
        {
          name: "RL Playlist",
          url: "https://www.youtube.com/playlist?list=PLir0BWtR5vRp5dqaouyMU-oTSzaU5LK9r",
        },
        {
          name: "Berkeley CS",
          url: "https://www.youtube.com/playlist?list=PLS01nW3RtgogGkm4UeqNeZLccW-OGc1fJ",
        },
        {
          name: "PyTorch Deep Learning",
          url: "https://www.coursera.org/professional-certificates/pytorch-for-deep-learning",
        },
        {
          name: "LM from Scratch",
          url: "https://www.youtube.com/playlist?list=PLoROMvodv4rOY23Y0BoGoBGgQ1zmU_MT_",
        },
      ],
    },
    {
      id: "ilya",
      name: "Ilya's Reading List (to start later)",
      icon: "📄",
      color: "#6366f1",
      hoursPerDay: 0, // Reference only, no daily target
      priority: 5,
      notes: "Classic papers to read when time permits",
      resources: [
        {
          name: "Top 30 Papers",
          url: "https://aman.ai/primers/ai/top-30-papers/",
        },
      ],
    },
  ],

  // ----------------------------------------------------------
  // THEME
  // ----------------------------------------------------------
  theme: {
    accent: "#ff1493",
    background: "#08090a",
    backgroundSecondary: "#0f1012",
    backgroundTertiary: "#161719",
    border: "#232527",
    textPrimary: "#f4f4f5",
    textSecondary: "#a1a1aa",
    textMuted: "#52525b",
  },

  // ----------------------------------------------------------
  // FEATURES
  // ----------------------------------------------------------
  features: {
    showSummaryCards: true,
    showTotalProgress: true,
    incrementAmount: 0.5,
    showPriority: false,
    showNotes: true,
  },
};

export default config;
