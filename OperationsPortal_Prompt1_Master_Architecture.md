# Operations Portal - Master Architecture Prompt

Build a complete production-ready internal web application called Operations Portal.

Core modules (finalized):
1. Production Registry
2. Delivery Tracker
3. Resource Leave Tracker
4. Daily Team Status
5. Server / Asset Registry

Tech stack:
- React + TypeScript + Vite
- Tailwind CSS + shadcn/ui
- Google Apps Script backend
- Google Sheets database
- MCP-compatible architecture
- Vercel hosting

Module 1: Production Registry
Fields: Region, Project, Version, Updated Date, Remarks.
Features: Manual entry, history, region comparison.

Module 2: Delivery Tracker
Fields: Jira ID, Resource, Current Status, Expected Delivery Date, Live Date.
Views: Upcoming Deliveries, Upcoming Live Releases, Delayed Deliveries.
Statuses: Open, In Progress, UAT, Ready for Live, Completed, On Hold.

Module 3: Resource Leave Tracker
Leave Types: Planned Leave, Emergency Leave.
Calendar indicators:
P2 = 2 Planned Leaves
E3 = 3 Emergency Leaves
P2,E1 = Mixed
Hover/click shows resources and leave details.

Module 4: Daily Team Status
Fields: Date, Resource, Today's Focus, Remarks.
Integrates with leave tracker.
Summary: Working Count, Planned Leave Count, Emergency Leave Count.

Module 5: Server / Asset Registry
Region-wise cards.
Environments: Beta, Live, Meta, Google.
Types: Main, Utils, MainDB, Replication DB, LogDB.
Fields: Region, Environment, Asset Type, IP Address, Remarks.

Authentication:
Login, Signup, Forgot Password, Profile.

Database:
Google Sheets with sheets:
Users, ProductionRegistry, DeliveryTracker, LeaveTracker,
DailyTeamStatus, AssetRegistry.

Backend:
Google Apps Script with setupDatabase(), CRUD APIs,
doGet(), doPost(), routing, JSON responses.

UI/UX:
Modern enterprise design inspired by Linear, GitHub,
Jira Cloud, Notion and Vercel. Mobile responsive.
