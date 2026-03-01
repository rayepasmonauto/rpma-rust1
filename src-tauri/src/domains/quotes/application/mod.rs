//! Application layer for the Quotes bounded context.
//!
//! Re-exports request/response contracts for external consumers.

mod contracts;

pub use contracts::{
    QuoteAttachmentCreateRequest, QuoteAttachmentDeleteRequest, QuoteAttachmentUpdateRequest,
    QuoteAttachmentsGetRequest, QuoteCreateRequest, QuoteDeleteRequest, QuoteGetRequest,
    QuoteItemAddRequest, QuoteItemDeleteRequest, QuoteItemUpdateRequest, QuoteListRequest,
    QuoteStatusRequest, QuoteUpdateRequest,
};
