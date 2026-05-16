# Storyboard terminal aliases — auto-generated, do not edit
start() { if [ $# -eq 0 ]; then /opt/homebrew/Cellar/node@22/22.22.0/bin/node "/Users/dfosco/workspace/storyboard-core/worktrees/0.6.0/packages/storyboard/src/core/cli/index.js" terminal-welcome --branch "0.6.0" --canvas "storyboarding/terminal-widget-prompts" --name "teal-magpie"; else /opt/homebrew/Cellar/node@22/22.22.0/bin/node "/Users/dfosco/workspace/storyboard-core/worktrees/0.6.0/packages/storyboard/src/core/cli/index.js" terminal-welcome --branch "0.6.0" --canvas "storyboarding/terminal-widget-prompts" --name "teal-magpie" --startup "$*"; fi; }
copilot() { start copilot --remote --agent terminal-agent "$@"; }
claude() { start claude --agent terminal-agent --dangerously-skip-permissions "$@"; }
codex() { start codex --ask-for-approval never "$@"; }
