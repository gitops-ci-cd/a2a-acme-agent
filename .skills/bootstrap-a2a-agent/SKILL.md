---
name: bootstrap-a2a-agent
description: Automatically creates and populates a new A2A agent repository using GitHub templates and a cookiecutter workflow. Use when the user wants to create a new A2A agent.
argument-hint: "[repository-name]"
---

# Bootstrap A2A Agent Repository

## Description

Automatically creates and populates a new Agent-to-Agent (A2A) protocol agent repository using GitHub's template repository feature and a cookiecutter GitHub Actions workflow. The agent is built with TypeScript, Express, and the Vercel AI SDK. All configuration is convention-based, deriving values from the repository name.

## Instructions

### Step 1: Extract Information from Request

**Extracted from user request:**
- Repository name (must end with `-agent`, e.g., "travel-agent", "code-reviewer-agent")

**Derived by skill:**
- `organization`: Inferred from current GitHub organization context

**Derived by workflow (from cookiecutter.json defaults + repository name):**
- `project_name`: The repository name
- `description`: "A2A agent with MCP server support" (default, can be overridden)
- `agent_role`: "a helpful AI assistant" (default, can be overridden)

### Step 2: Confirm with User

Before taking any action, present the derived values and ask the user to confirm:

```
I'm about to create the following A2A agent repository:

- **Repository:** {organization}/{repository_name}
- **Template:** {organization}/acme-agent
- **Agent skill:** Derived from repository name (e.g., "travel-agent" → skill "travel")

Shall I proceed?
```

Do not continue until the user explicitly confirms.

### Step 3: Create Repository from Template

<!--
TODO: We can't currently create a repository from a template using the MCP server, so this is a placeholder for the actual API call that would be made. The implementation may require using the GitHub REST API directly or a custom MCP action.
-->

Use the GitHub MCP server to create a repository from the template:

```
mcp_github_create_repository(
    name="{repository_name}",
    organization="{organization}",
    description="A2A agent: {description}",
    template_owner="{organization}",
    template_repo="acme-agent"
)
```

### Step 4: Trigger Cookiecutter Workflow

Run the cookiecutter workflow to populate the repository:

```
mcp_github_run_workflow(
    owner="{organization}",
    repo="{repository_name}",
    workflow_id="Cookiecutter",
    ref="main"
)
```

### Step 5: Provide Summary

```markdown
Created A2A agent repository at https://github.com/{organization}/{repository_name}!

The repository has been populated with an A2A protocol agent. The structure includes:

- Express server with A2A protocol support
- Vercel AI SDK integration with configurable LLM provider
- MCP server support (stdio and HTTP transports)
- Docker and Compose configuration with watch mode
- Agent card, skills, and behavior defined in package.json
- Customizable model, tools, and MCP servers in src/agent/config.ts

Next steps:
1. Clone the repository
2. Update `package.json` with your agent's role, skills, and behavior
3. Configure your LLM provider and tools in `src/agent/config.ts`
4. Run `docker compose up` to start developing
```
