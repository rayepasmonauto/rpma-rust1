/// Generates a new UUID v4 string. Returns the canonical hyphenated representation.
pub fn generate_uuid_string() -> String {
    uuid::Uuid::new_v4().to_string()
}

/// Returns `true` if `s` is a valid UUID string (any version/variant).
pub fn is_valid_uuid(s: &str) -> bool {
    uuid::Uuid::parse_str(s).is_ok()
}

#[cfg(test)]
mod tests {
    use super::{generate_uuid_string, is_valid_uuid};

    #[test]
    fn generates_unique_uuid_strings() {
        let first = generate_uuid_string();
        let second = generate_uuid_string();

        assert_ne!(first, second);
        assert!(is_valid_uuid(&first));
        assert!(is_valid_uuid(&second));
    }

    #[test]
    fn validates_uuid_format() {
        assert!(is_valid_uuid("550e8400-e29b-41d4-a716-446655440000"));
        assert!(!is_valid_uuid("not-a-uuid"));
        assert!(!is_valid_uuid(""));
    }
}
