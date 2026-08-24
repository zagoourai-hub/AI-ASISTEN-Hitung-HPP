from __future__ import annotations

import json
import os
import sys
from pathlib import Path

project_root = Path(__file__).resolve().parents[1]
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))


def main() -> None:
    from app.main import app

    default_output = Path(__file__).resolve().parents[1] / "docs" / "openapi.json"
    output_path = Path(os.environ.get("HPP_OPENAPI_OUTPUT", str(default_output)))
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(
        json.dumps(app.openapi(), indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )
    print(f"OpenAPI exported to {output_path}")


if __name__ == "__main__":
    main()
