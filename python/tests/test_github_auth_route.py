import pytest
import os

from dendro.api_helpers.routers.gui.github_auth_routes import github_auth, GithubAuthError

@pytest.mark.asyncio
async def test_github_auth():
    old_env = os.environ.copy()
    try:
        os.environ['VITE_GITHUB_CLIENT_ID'] = 'test-client-id'
        os.environ['GITHUB_CLIENT_SECRET'] = 'test-client-secret'
        with pytest.raises(GithubAuthError):
            await github_auth(code='test-code')
    finally:
        os.environ = old_env
