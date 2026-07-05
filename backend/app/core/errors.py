class DomainError(Exception):
    """Base exception for application-level errors."""


class ValidationError(DomainError):
    def __init__(self, message: str) -> None:
        self.message = message
        super().__init__(message)


class ResourceNotFoundError(DomainError):
    def __init__(self, resource: str, resource_id: str) -> None:
        self.resource = resource
        self.resource_id = resource_id
        super().__init__(f"{resource} not found: {resource_id}")


class AuthenticationError(DomainError):
    def __init__(self, message: str = "invalid authentication credentials") -> None:
        self.message = message
        super().__init__(message)


class ConflictError(DomainError):
    def __init__(self, message: str) -> None:
        self.message = message
        super().__init__(message)


class PermissionDeniedError(DomainError):
    def __init__(self, message: str) -> None:
        self.message = message
        super().__init__(message)
