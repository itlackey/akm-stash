---
name: distill-feedback-into-lessons
description: Use when repeated feedback should be turned into a reusable lesson via akm distill and the proposal queue in akm-cli v0.7.0.
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

### 2. Distill the asset

```bash
akm distill <ref>
```

This creates a proposal instead of changing the live stash immediately.

### 3. Review the lesson proposal

```bash
akm proposal list
akm proposal show <id>
akm proposal diff <id>
```

Check that the lesson states when to use it, captures a repeated pattern, and
teaches how to solve the class of problem.

### 4. Promote or reject

```bash
akm proposal accept <id>
# or
akm proposal reject <id> --reason "why"
```

### 5. Confirm discoverability

```bash
akm index
akm search "<problem pattern>" --type lesson
akm show lesson:<name>
```
