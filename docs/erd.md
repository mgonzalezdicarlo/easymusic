# Entity relationship diagram

Current database model (Epic 2, issue E2-02). The scale and exercise tables are added by E2-03 and
E2-04. Date storage rules are in [ADR-0006](./adr/0006-practice-session-date-storage.md).

```mermaid
erDiagram
  User ||--o{ PracticeSession : "logs"

  user {
    string id PK
    string email UK
    string name
    string timezone "IANA name, default UTC"
    int dailyGoalMinutes "1-1440, default 30"
    datetime createdAt
  }

  practice_sessions {
    string id PK
    string userId FK "cascade on delete"
    date date "local calendar date, indexed with userId"
    int durationMinutes "0-1440"
    string notes "optional"
    datetime createdAt
  }
```
