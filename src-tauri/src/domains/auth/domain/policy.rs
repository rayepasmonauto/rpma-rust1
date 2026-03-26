use super::errors::AuthDomainError;

/// Policy that maps raw authentication errors to user-safe messages.
#[derive(Debug, Clone, Copy, Default)]
pub struct AuthErrorPolicy;

impl AuthErrorPolicy {
    /// Converts a raw login error into a sanitised authentication error.
    pub fn authentication_error(raw_error: &str) -> AuthDomainError {
        if raw_error.contains("Invalid email or password") {
            AuthDomainError::InvalidCredentials("Email ou mot de passe incorrect".to_string())
        } else if raw_error.contains("Account temporarily locked")
            || raw_error.contains("IP address temporarily locked")
        {
            AuthDomainError::InvalidCredentials(raw_error.to_string())
        } else {
            AuthDomainError::InvalidCredentials(
                "Erreur d'authentification. Veuillez reessayer.".to_string(),
            )
        }
    }

    /// Converts a raw signup error into a validation or internal domain error.
    pub fn signup_error(raw_error: &str) -> AuthDomainError {
        match raw_error {
            "Email is required"
            | "First name is required"
            | "Last name is required"
            | "Password is required"
            | "An account with this email already exists"
            | "Username is already taken" => AuthDomainError::Validation(raw_error.to_string()),
            _ => AuthDomainError::Internal("Account creation failed".to_string()),
        }
    }
}
