from typing import TypedDict, Optional


class TutorState(TypedDict):
    user_query: str
    duration: int             # 2–5 minutes
    is_valid: bool
    rejection_reason: str
    content: str              # Generated markdown walkthrough
    system_prompt: str        # System prompt for LLM
    user_message: str         # User message for LLM
    error: Optional[str]
