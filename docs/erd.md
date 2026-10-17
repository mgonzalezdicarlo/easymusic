# Entity relationship diagram

Current database model (Epic 2, issues E2-02 and E2-03). The exercise tables are added by E2-04. Date
storage rules are in [ADR-0006](./adr/0006-practice-session-date-storage.md).

```mermaid
erDiagram
  users ||--o{ practice_sessions : "logs"
  users ||--o{ user_scales : "tracks"
  scales ||--o{ user_scales : "is tracked as"
  user_scales ||--o{ scale_practice_entries : "has history"
  practice_sessions ||--o{ scale_practice_entries : "contains"

  users {
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

  scales {
    string id PK
    string tonic "A-G with optional # or b; UK with mode"
    string mode "major, minor variants, church modes"
  }

  user_scales {
    string id PK
    string userId FK "cascade on delete"
    string scaleId FK "restrict on delete"
    int octaves "1-4"
    string handsMode "SEPARATE or TOGETHER"
    int targetBpm "20-300"
    string status "ACTIVE or ARCHIVED"
    datetime createdAt
  }

  scale_practice_entries {
    string id PK
    string userScaleId FK "cascade on delete"
    string sessionId FK "cascade on delete"
    int cleanBpm "20-300"
    int maxBpm "20-300, >= cleanBpm"
    int durationMinutes "0-1440"
    string notes "optional"
    datetime practicedAt "UTC instant, ordering only"
  }
```

`user_scales` is unique on `(userId, scaleId, octaves, handsMode)`, and `scales` is unique on
`(tonic, mode)`.
