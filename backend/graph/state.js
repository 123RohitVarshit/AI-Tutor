// Shared state schema for the LangGraph pipeline
// All nodes read from and write to this state object

export const initialState = {
    userQuery: "",
    duration: 3,        // minutes (2-5)
    isValid: false,
    rejectionReason: "",
    content: "",        // Generated markdown walkthrough
    imagePrompt: "",
    imageUrl: "",
    audioBase64: "",
    error: null,
};
