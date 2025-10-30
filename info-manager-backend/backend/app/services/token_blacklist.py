import hashlib
from datetime import datetime

from app.core.redis import redis_client


class TokenBlacklistService:
    BLACKLIST_KEY = "token:blacklist"

    @staticmethod
    def add_to_blacklist(token: str, expires_at: datetime) -> None:
        """Add a token to the blacklist with TTL matching token expiration."""
        token_hash = hashlib.sha256(token.encode()).hexdigest()
        ttl = int(expires_at.timestamp()) - int(datetime.now().timestamp())
        if ttl > 0:
            redis_client.setex(
                f"{TokenBlacklistService.BLACKLIST_KEY}:{token_hash}", ttl, "1"
            )

    @staticmethod
    def is_token_blacklisted(token: str) -> bool:
        """Check if a token is in the blacklist."""
        token_hash = hashlib.sha256(token.encode()).hexdigest()
        return bool(
            redis_client.exists(f"{TokenBlacklistService.BLACKLIST_KEY}:{token_hash}")
        )
