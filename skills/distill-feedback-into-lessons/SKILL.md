---
name: distill-feedback-into-lessons
description: Use when repeated feedback should become a reusable lesson through akm improve and the proposal queue in akm-cli v0.8.0.
---

# Distill Feedback into Lessons

This skill turns repeated wins or misses into compact lesson assets that future
agents can retrieve.

## When to use

- The same asset keeps receiving similar negative feedback.
- An important workaround keeps reappearing in task notes.
- You want a reusable lesson instead of another one-off memory.

## Steps

### 1. Capture useful feedback first

```bash
akm feedback <ref> --negative --reason "too generic for docker-compose healthchecks"
# or
akm feedback <ref> --positive
```

### 2. Improve the asset with lesson distillation

```bash
akm improve <ref>
```

In 0.8.0, lesson distillation is part of `akm improve`. This still creates a
proposal instead of changing the live stash immediately.

### 3. Review the lesson proposal

```bash
akm proposals
akm show proposal:<id>
akm diff <id>
```

Check that the lesson states when to use it, captures a repeated pattern, and
teaches how to solve the class of problem.

### 4. Promote or reject

```bash
akm accept <id>
# or
akm reject <id> --reason "why"
```

### 5. Confirm discoverability

```bash
akm index
akm search "<problem pattern>" --type lesson
akm show lesson:<name>
```
