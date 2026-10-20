# Project architecture rules

- Implement account recovery as public React routes that use the managed auth client's standard email recovery and password update methods; keep role authorization server-enforced and separate from profile data.