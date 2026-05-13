# High level steps for project


## Part 1: Plan

**Checklist:**
- [x] Review project requirements and technical decisions
- [x] Review existing frontend code and document in frontend/AGENTS.md
- [x] Enrich PLAN.md with detailed substeps and checklists for each part
- [x] Add tests and success criteria for each part
- [ ] Submit plan for user approval

**Tests & Success Criteria:**
- PLAN.md contains a clear, actionable checklist for each project part
- Each part includes test and success criteria
- frontend/AGENTS.md accurately describes the current frontend codebase

---

## Part 2: Scaffolding


## Part 2: Scaffolding

**Checklist:**
- [x] Set up Dockerfile and docker-compose for local development
- [x] Scaffold backend/ with FastAPI
- [x] Add start/stop scripts in scripts/ for Mac, PC, Linux
- [x] Serve example static HTML from FastAPI
- [x] Implement a test API endpoint
- [x] Verify local container runs and serves both static and API

**Tests & Success Criteria:**
- Running the container locally serves static HTML at /
- API endpoint returns expected response
- Start/stop scripts work on all platforms


## Part 3: Add in Frontend

**Checklist:**
- [ ] Configure FastAPI to serve built Next.js frontend
- [ ] Build and export static frontend
- [ ] Integrate static frontend into Docker image
- [ ] Verify Kanban board displays at /
- [ ] Write unit and integration tests for frontend

**Tests & Success Criteria:**
- Kanban board loads at /
- All columns and cards display as expected
- Unit/integration tests pass (target 80% coverage, meaningful tests only)


## Part 4: Add in a fake user sign in experience

**Checklist:**
- [ ] Add login page to frontend
- [ ] Require login before showing Kanban
- [ ] Use hardcoded credentials ("user", "password")
- [ ] Implement logout
- [ ] Write tests for login/logout flow

**Tests & Success Criteria:**
- Kanban is only visible after login
- Login/logout works as expected
- Tests cover all login/logout scenarios


## Part 5: Database modeling

**Checklist:**
- [ ] Propose ERD or markdown schema for Kanban
- [ ] Save schema as JSON example
- [ ] Document database approach in docs/
- [ ] Get user sign-off

**Tests & Success Criteria:**
- Schema is clear, normalized, and supports MVP features
- User approves schema and approach


## Part 6: Backend

**Checklist:**
- [ ] Implement API routes for Kanban CRUD
- [ ] Ensure DB is created if missing
- [ ] Write backend unit tests (pytest)

**Tests & Success Criteria:**
- All API routes work as expected
- Database persists and loads Kanban data
- Backend tests pass (target 80% coverage, meaningful tests only)


## Part 7: Frontend + Backend

**Checklist:**
- [ ] Update frontend to use backend API for Kanban
- [ ] Ensure board state is persistent
- [ ] Write integration tests

**Tests & Success Criteria:**
- Kanban changes persist across reloads
- Integration tests pass (target 80% coverage, meaningful tests only)


## Part 8: AI connectivity

**Checklist:**
- [ ] Add OpenRouter API key to backend
- [ ] Implement simple AI call (e.g., "2+2")
- [ ] Write test for AI connectivity

**Tests & Success Criteria:**
- Backend can call AI and receive response
- Test for AI call passes


## Part 9: AI Kanban integration

**Checklist:**
- [ ] Extend backend to send Kanban JSON and user question to AI
- [ ] Parse AI structured output
- [ ] Update Kanban if AI returns changes
- [ ] Write tests for AI-Kanban integration

**Tests & Success Criteria:**
- AI can update Kanban via structured output
- All integration tests pass


## Part 10: AI chat sidebar

**Checklist:**
- [ ] Add sidebar widget for AI chat (matching app theme)
- [ ] Integrate chat with backend AI endpoint
- [ ] Support Kanban updates from AI
- [ ] Auto-refresh UI on Kanban changes
- [ ] Write tests for sidebar and AI integration

**Tests & Success Criteria:**
- Sidebar chat works and matches theme
- Kanban updates automatically if changed by AI
- All sidebar/AI tests pass

## Testing Coverage and Quality

- Target a minimum of 80% testing coverage for both frontend and backend code.
- Only write meaningful and logical test cases that reflect real user scenarios and code logic.
- Do not write trivial or artificial tests just to meet the coverage target; quality and relevance of tests are more important than the raw coverage percentage.