from pathlib import Path
import sys

import pytest

# Ensure the application module is importable when tests are executed from the tests directory.
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import main  # noqa: E402  # pylint: disable=wrong-import-position


@pytest.fixture
def app_client(tmp_path, monkeypatch):
    """Provide a Flask test client with isolated upload storage."""
    uploads_dir = tmp_path / "uploads"
    uploads_dir.mkdir()
    monkeypatch.setitem(main.app.config, "UPLOAD_FOLDER", str(uploads_dir))
    main.app.config.update(TESTING=True, WTF_CSRF_ENABLED=False)

    with main.app.app_context():
        with main.app.test_client() as client:
            yield client, uploads_dir


def test_analyze_redirects_on_missing_file(app_client):
    """POSTing without a file should redirect users back to the index page."""
    client, _ = app_client

    response = client.post("/analyze", data={}, follow_redirects=False)

    assert response.status_code == 302
    assert response.headers["Location"].endswith("/")


def test_results_displays_real_stats(app_client):
    """The results page should surface the stats produced by the analysis."""
    client, uploads_dir = app_client

    filename = "example.xlsx"
    stats = {"total_clients": 42, "high_priority": 7, "vip_clients": 5}

    (uploads_dir / filename).write_text("dummy")

    with client.session_transaction() as session:
        session["analysis_stats"] = {filename: stats}

    response = client.get(f"/results/{filename}")

    assert response.status_code == 200
    body = response.get_data(as_text=True)
    for value in stats.values():
        assert str(value) in body
