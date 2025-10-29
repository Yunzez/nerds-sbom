# Editing tasks.json

This file controls the study tasks shown in the instance UI. You can safely edit it and reload the app.

Location: `/home/yunze/sbom-med/nerds-sbom/tasks.json`

## Schema

- `randomize` (bool): Randomize the order of tasks.
- `randomize_suggestions` (bool): Randomize suggestion order per task.
- `tasks` (array): List of task objects
  - `task_no` (int): 1-based unique identifier
  - `desc` (string): Description of the task. Supports HTML (`<h1>`, `<p>`, `<ul>`, etc.).
  - `suggestions` (array<string>): Optional hints/snippets. Use an empty array `[]` if not needed.
  - `fixed` (bool, optional): If true, renders as a final/summary page.

## Tips

- Prefer HTML in `desc` for consistent rendering and headings.
- Keep `suggestions` as `[]` when you don’t want any suggestions shown.
- Ensure valid JSON (double quotes; escape quotes inside strings).
- Keep `task_no` values unique and sequential (1, 2, 3…).

## Example

```json
{
  "randomize": true,
  "randomize_suggestions": true,
  "tasks": [
    {
      "task_no": 1,
      "desc": "<h1>Task 1 (Shrink SBOM)</h1><p>Validate/verify the components…</p>",
      "suggestions": []
    },
    {
      "task_no": 2,
      "desc": "<h1>Task 2 …</h1><p>…</p>",
      "suggestions": []
    }
  ]
}
```

## How to apply changes

- If the stack is running, changes take effect the next time a study instance reads the task file (typically on page load/refresh). No rebuild is required unless you’ve modified container code.
- If you want to rebuild and restart everything:
  1. `./dev-ob.sh configure` (copies generated tasks into the submit service)
  2. `./dev-ob.sh compose up -d --build`

## Troubleshooting

- JSON parse errors: Use a JSON linter/formatter to validate.
- HTML not rendering: Wrap content in `<p>`/`<ul>…</ul>`; avoid stray angle brackets.
- No tasks appear: Ensure tasks exist at `containers/submit/tasks/` after `configure`. Re-run `./dev-ob.sh configure`.
