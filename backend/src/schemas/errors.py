class ApplicationError(Exception):
    """Base class for application-related errors."""


class MissingAppUrlError(ApplicationError, ValueError):
    """Raised when an application URL is required but missing."""


class QuestionNotFoundError(ApplicationError, ValueError):
    """Raised when a specific question cannot be found in the application fields."""
