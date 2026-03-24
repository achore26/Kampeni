# Kept for backward compatibility. New models import Base from shared.database directly.
from ..database import Base

__all__ = ["Base"]
