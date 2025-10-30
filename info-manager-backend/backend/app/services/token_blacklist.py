import hashlib
from datetime import datetime

from app.core.redis import async_redis_client, redis_client


class TokenBlacklistService:
    BLACKLIST_KEY = "token:blacklist"

    @staticmethod
    def _get_token_hash(token: str) -> str:
        """Generate SHA-256 hash of the token."""
        return hashlib.sha256(token.encode()).hexdigest()

    @staticmethod
    def _get_blacklist_key(token_hash: str) -> str:
        """Get the Redis key for a token hash."""
        return f"{TokenBlacklistService.BLACKLIST_KEY}:{token_hash}"

    @staticmethod
    def _calculate_ttl(expires_at: datetime) -> int:
        """Calculate TTL in seconds from expiration datetime."""
        return int(expires_at.timestamp()) - int(datetime.now().timestamp())

    # Synchronous methods
    @staticmethod
    def add_to_blacklist(token: str, expires_at: datetime) -> None:
        """Add a token to the blacklist with TTL matching token expiration (sync)."""
        token_hash = TokenBlacklistService._get_token_hash(token)
        ttl = TokenBlacklistService._calculate_ttl(expires_at)
        if ttl > 0:
            redis_client.setex(
                TokenBlacklistService._get_blacklist_key(token_hash), ttl, "1"
            )

    @staticmethod
    def is_token_blacklisted(token: str) -> bool:
        """Check if a token is in the blacklist (sync)."""
        token_hash = TokenBlacklistService._get_token_hash(token)
        return bool(
            redis_client.exists(TokenBlacklistService._get_blacklist_key(token_hash))
        )

    # Asynchronous methods
    @staticmethod
    async def async_add_to_blacklist(token: str, expires_at: datetime) -> None:
        """Add a token to the blacklist with TTL matching token expiration (async)."""
        token_hash = TokenBlacklistService._get_token_hash(token)
        ttl = TokenBlacklistService._calculate_ttl(expires_at)
        if ttl > 0:
            await async_redis_client.setex(
                TokenBlacklistService._get_blacklist_key(token_hash), ttl, "1"
            )

    @staticmethod
    async def async_is_token_blacklisted(token: str) -> bool:
        """Check if a token is in the blacklist (async)."""
        token_hash = TokenBlacklistService._get_token_hash(token)
        result = await async_redis_client.exists(
            TokenBlacklistService._get_blacklist_key(token_hash)
        )
        return bool(result)
