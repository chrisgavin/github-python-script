# GitHub Python Script Action
An action similar to actions/github-script that lets you use Python as the scripting language.

## Authors

* [Chris Gavin](https://github.com/chrisgavin)
* [Robin Neatherway](https://github.com/rneatherway)

## Example

```yaml
on:
  push:
    branches: [ "main" ]
  pull_request:
    branches: [ "main" ]

  workflow_dispatch:

jobs:
  job:
    runs-on: ubuntu-latest

    steps:
      - uses: chrisgavin/github-python-script@0.0.1
        with:
          script: |
            repository.create_issue(
                title=f"New {context.event_name} event on {repository.full_name}.",
                body="```json\n" + json.dumps(context.payload, indent="\t") + "\n```",
            )
```
