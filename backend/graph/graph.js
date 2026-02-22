import { StateGraph, END } from "@langchain/langgraph";
import { supervisorNode } from "./supervisorNode.js";
import { researcherNode } from "./researcherNode.js";
import { mediaNode } from "./mediaNode.js";
import { initialState } from "./state.js";

// Routing function: after supervisor, go to researcher or end
function routeAfterSupervisor(state) {
    if (state.isValid) {
        return "researcher";
    }
    return END;
}

// Build and compile the LangGraph pipeline
function buildGraph() {
    const workflow = new StateGraph({
        channels: {
            userQuery: { value: (x, y) => y ?? x, default: () => "" },
            duration: { value: (x, y) => y ?? x, default: () => 3 },
            isValid: { value: (x, y) => y ?? x, default: () => false },
            rejectionReason: { value: (x, y) => y ?? x, default: () => "" },
            content: { value: (x, y) => y ?? x, default: () => "" },
            imagePrompt: { value: (x, y) => y ?? x, default: () => "" },
            imageUrl: { value: (x, y) => y ?? x, default: () => "" },
            audioBase64: { value: (x, y) => y ?? x, default: () => "" },
            error: { value: (x, y) => y ?? x, default: () => null },
        },
    });

    // Add nodes
    workflow.addNode("supervisor", supervisorNode);
    workflow.addNode("researcher", researcherNode);
    workflow.addNode("media", mediaNode);

    // Set entry point
    workflow.setEntryPoint("supervisor");

    // Add conditional edge from supervisor
    workflow.addConditionalEdges("supervisor", routeAfterSupervisor, {
        researcher: "researcher",
        [END]: END,
    });

    // researcher → media → END
    workflow.addEdge("researcher", "media");
    workflow.addEdge("media", END);

    return workflow.compile();
}

const graph = buildGraph();

export async function runTutorGraph({ userQuery, duration }) {
    const inputState = {
        ...initialState,
        userQuery,
        duration,
    };

    const finalState = await graph.invoke(inputState);

    return {
        isValid: finalState.isValid,
        rejectionReason: finalState.rejectionReason,
        content: finalState.content,
        imageUrl: finalState.imageUrl,
        audioBase64: finalState.audioBase64,
        duration: finalState.duration,
        error: finalState.error,
    };
}
