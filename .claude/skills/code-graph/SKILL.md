---
name: code-graph
description: Build and query a knowledge graph of your codebase using code-review-graph for efficient code analysis and reviews.
---

# Instructions

## Setup (One-time)
1. If not installed, run: `pip install code-review-graph`
2. Build the graph: `code-review-graph build`

## Available Commands

- `code-review-graph build` - Parse entire codebase into graph
- `code-review-graph update` - Incremental update (changed files only)
- `code-review-graph status` - Show graph statistics
- `code-review-graph detect-changes` - Risk-scored change impact analysis
- `code-review-graph visualize` - Generate interactive HTML graph

## MCP Integration (if available)
- Use `/code-review-graph:build-graph` to build/update
- Use `/code-review-graph:review-delta` for changed files
- Use `/code-review-graph:review-pr` for full PR review

## Usage
- Before analyzing code changes, run `code-review-graph build` if graph doesn't exist
- Use `detect-changes` to get blast radius of modifications
- Query specific files with `query_graph_tool` for callers/callees