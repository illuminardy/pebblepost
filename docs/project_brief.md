# Project Brief: URL Shortener with Click Analytics

Design a simple link shortener with a small dashboard.

- Implement endpoint to create short links (slug or generated), store target URL, and redirect by slug.
- Record click events with timestamp and user agent when a redirect occurs.
- Provide analytics endpoints for total clicks and clicks grouped by day.
- Build a React UI to create and manage links and view simple charts or tables of click counts.
- Include seed data for a few links and a migration or schema setup script.
- Add tests around redirect behavior and daily aggregation.

## Standard Requirements and Guardrails

- Use a REST API with clear, versioned routes and consistent response shapes, emphasizing an API-first mindset. Alternatives like GraphQL are acceptable, provided complexity is timeboxed.
- Use a relational database (SQLite or Postgres). Include schema setup via migration or SQL script.
- Implement basic validation and error handling, with readable error messages in both API and UI.
- Consider application performance when designing API routes, and demonstrate how the app and design would scale with different data sizes.
- Ensure the app is functional.
- Demonstrate how you would prevent regressions for the primary workflow and a representative failure mode, using any approach you'd typically use in production.
- Include a concise README with architecture notes, assumptions, and future improvements. Include any LLM prompts used during coding or design.
- Candidates may use Java, JavaScript, or TypeScript on the backend. The frontend can be any React-like framework. Please add justification for the language and framework decision as part of the README.
- Usage of AI is allowed and encouraged; candidates should be able to explain prompts, generated code, and key decisions.

## Deliverables

- One week to submit after assignment.
- Repository or archive with backend and frontend, each runnable with a single command.
- Seed data and database initialization instructions or scripts if applicable.
- Short design notes on trade-offs, assumptions, and "next steps" if given more time.

## Suggested Timeboxing and Scope Control

- Target 8 hours. Favor an end-to-end vertical slice (a couple of key flows finished well) over breadth.
- Keep UI styling simple; focus on clarity, validation, empty states, and errors.
- Prefer pragmatic solutions: small migrations, a handful of endpoints, minimal dependencies.
- Note any intentional simplifications in the README.
