import sys
import unittest
from pathlib import Path


SERVICE_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SERVICE_ROOT))

from cors_config import get_cors_config  # noqa: E402


class CorsConfigTests(unittest.TestCase):
    def test_uses_configured_allowed_origins(self):
        config = get_cors_config(
            {
                "INTERVIEW_AI_ALLOWED_ORIGINS": (
                    "https://skillsphere.example, http://localhost:5174"
                ),
            }
        )

        self.assertEqual(
            config["allow_origins"],
            ["https://skillsphere.example", "http://localhost:5174"],
        )
        self.assertTrue(config["allow_credentials"])

    def test_rejects_wildcard_origin_when_credentials_are_enabled(self):
        with self.assertRaisesRegex(ValueError, "cannot include '\\*'"):
            get_cors_config(
                {
                    "INTERVIEW_AI_ALLOWED_ORIGINS": "*",
                    "INTERVIEW_AI_CORS_ALLOW_CREDENTIALS": "true",
                }
            )

    def test_allows_wildcard_only_when_credentials_are_disabled(self):
        config = get_cors_config(
            {
                "INTERVIEW_AI_ALLOWED_ORIGINS": "*",
                "INTERVIEW_AI_CORS_ALLOW_CREDENTIALS": "false",
            }
        )

        self.assertEqual(config["allow_origins"], ["*"])
        self.assertFalse(config["allow_credentials"])


if __name__ == "__main__":
    unittest.main()
