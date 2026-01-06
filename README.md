# 🌙 Winter Tracker

I wanted a simple way to stay accountable during my winter deep work season. Nothing fancy — just a visual grid where I could log hours across different focus areas and jot down notes as I go.

Built this in ~30 minutes using [Claude Opus 4.5](https://www.anthropic.com/) in Cursor. It's minimal, it works, and it keeps me honest.

**Live:** [winter-tracker.vercel.app](https://winter-tracker.vercel.app)

---

## Use it yourself

1. **Clone & deploy**

   ```bash
   git clone https://github.com/armaansandhu26/winter-tracker.git
   cd winter-tracker
   npm install
   ```

2. **Set up Vercel KV** — Create a KV database in your Vercel dashboard and connect it to the project

3. **Add your password** — Set `EDIT_PASSWORD` in Vercel environment variables

4. **Customize** — Edit `app/config.js` to set your own tracks, date range, and theme colors

5. **Deploy** — Push to GitHub and Vercel handles the rest

---

That's it. Happy deep work 🎯
