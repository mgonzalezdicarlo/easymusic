# Entity relationship diagram

Current database model (Epic 2, issues E2-02 to E2-04). Date storage rules are in
[ADR-0006](./adr/0006-practice-session-date-storage.md). How to add catalog exercises is in
[exercise-catalog.md](./exercise-catalog.md).

```mermaid
erDiagram
  users ||--o{ practice_sessions : "logs"
  users ||--o{ user_scales : "tracks"
  scales ||--o{ user_scales : "is tracked as"
  user_scales ||--o{ scale_practice_entries : "has history"
  practice_sessions ||--o{ scale_practice_entries : "contains"
  users ||--o{ exercises : "owns (custom and Czerny only)"
  users ||--o{ user_exercises : "tracks"
  exercises ||--o{ user_exercises : "is tracked as"
  user_exercises ||--o{ exercise_practice_entries : "has history"
  practice_sessions ||--o{ exercise_practice_entries : "contains"

  users {
    string id PK
    string email UK
    string name
    string timezone "IANA name, default UTC"
    int dailyGoalMinutes "1-1440, default 30"
    datetime onboardedAt "null until first-run setup is done"
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

  exercises {
    string id PK
    string source "HANON, CZERNY or CUSTOM"
    int number "optional; Hanon 1-60"
    string title
    string description "optional"
    int targetBpm "optional, 20-300"
    string ownerId FK "null for HANON, required otherwise; cascade on delete"
  }

  user_exercises {
    string id PK
    string userId FK "cascade on delete"
    string exerciseId FK "cascade on delete"
    int targetBpm "20-300"
    string status "ACTIVE or ARCHIVED"
    datetime createdAt
  }

  exercise_practice_entries {
    string id PK
    string userExerciseId FK "cascade on delete"
    string sessionId FK "cascade on delete"
    int cleanBpm "20-300"
    int maxBpm "20-300, >= cleanBpm"
    int durationMinutes "0-1440"
    string notes "optional"
    datetime practicedAt "UTC instant, ordering only"
  }
```

`user_scales` is unique on `(userId, scaleId, octaves, handsMode)`, and `scales` is unique on
`(tonic, mode)`. `user_exercises` is unique on `(userId, exerciseId)`. `exercises` is unique on
`(ownerId, source, number)` for owned rows, and a partial unique index on `(source, number)` covers
catalog rows, where `ownerId` is null.
