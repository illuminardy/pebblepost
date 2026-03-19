1. Creating a cursor rule for timeboxing and scope control

create a cursor rule in this workspace for this section

@project_brief.md (31-37) 

2. Plan Mode: Working with Cursor to plan implementation

Here is a project brief for an implementation that I have to do. @project_brief.md (1-37) This is going to behave similar to https://tinyurl.com/ but scoped for an 8 hour implementation. 

first step is for you to ask me questions as though I'm the product manager. Anything that is not 100% clear to you please ask me, don't make any assumptions. 

3. Answers to Plan Mode

### Which database would you like to use?

PostgreSQL (closer to production, requires running instance)
Should the app have any authentication? The brief doesn't mention it.

no auth but please capture it in the readme as stated here - Note any intentional simplifications in the README.

### What HTTP redirect status code should the short link redirect use? 301 (permanent) tells browsers to cache the redirect, which means repeat visits may skip our server and we lose analytics accuracy. 302 (temporary) ensures every click hits our server and gets recorded.

302 Temporary Redirect (every click is tracked accurately)

### What CRUD operations should be supported for links beyond creation?

focus on create and read but list it in readme that we are doing so to tackle depth vs breadth initially

### Should short links support expiration (auto-deactivation after a date)?

Yes — optional expiration date per link

### Any preference for the React setup?

Vite + React (lightweight SPA)

### For custom slugs: should there be constraints on length or allowed characters? For example, TinyURL allows alphanumeric + hyphens, 5-30 chars.

lets discuss the complexity of options a and b, also consider performance and the need for uniqeness in a production implementation

### For auto-generated slugs (when the user doesn't provide one), what length? Shorter is nicer but increases collision risk.

8 characters (e.g., /a1b2c3d4)

### For analytics: the brief says 'total clicks' and 'clicks grouped by day.' Should we also parse the user-agent into readable fields (browser, OS, device type) or just store the raw string?

Parse into browser + OS + device type and show in dashboard

### Should the daily analytics endpoint support date range filtering (e.g., last 7 days, last 30 days, custom range)?

Preset ranges (last 7d, 30d, 90d)

### Repository structure preference?

Monorepo — single repo with /backend and /frontend folders

### For the dashboard charts, any preference on charting library?

Recharts (popular, React-native, simple API)

### Based on the analysis above, which approach for custom slugs?

Alphanumeric + hyphens, normalized to lowercase (recommended)

### Should we document the case-sensitivity trade-off in the README as a design decision?

Yes — include it in design notes


### Backend framework preference?

Express (most widely known, large ecosystem)

### Database access layer?

Prisma (type-safe ORM, auto-generated client, migrations)

### Testing framework?

Vitest (fast, Vite-native, Jest-compatible API)

### The brief says 'runnable with a single command.' For Postgres, how should we handle setup?

Docker Compose (Postgres + app, most reproducible)

### How much seed data? The brief says 'a few links.' For analytics to look meaningful in charts, we need some click data too.

3-5 links, ~50 clicks spread across them

4. Begin implementation

ok lets start with a very basic e2e implementation nof one of the workflows. dont worry about beuatifying the ui at the moment focus on getting a simple e2e flow going

5. Complete implementation

Based on @.cursor/plans/url_shortener_implementation_16d9b24b.plan.md plan, and the progress achieved here @docs/PROGRESS.md please plan on implementing the remaining changes. Here's a screenshot of a potential UI design for the main functionaility.

(Included a screenshot of TinyURL's create form as UI design reference)

6. Post v1 updates

id like to now make sure that the analytics gets updated via websockets. also lets allow user to delete and maybe update their shortlinks 

7. Q&A for real time updates

### What should update in real-time via WebSockets?

Both — click counts on the links list AND analytics detail page

### WebSocket library preference?

ws (lightweight, native WebSocket protocol, no extras)

### For link updates, which fields should be editable?

Target URL + expiration date

### For link deletion, hard delete or soft delete?

Soft delete — mark as deleted, stop redirects, keep analytics data

