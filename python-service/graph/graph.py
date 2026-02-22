from langgraph.graph import StateGraph, END
from graph.state import TutorState
from graph.supervisor_node import supervisor_node
from graph.researcher_node import researcher_node


def route_after_supervisor(state: TutorState) -> str:
    """Route to researcher if valid, else end."""
    return "researcher" if state["is_valid"] else END


def build_graph():
    workflow = StateGraph(TutorState)

    # Add nodes
    workflow.add_node("supervisor", supervisor_node)
    workflow.add_node("researcher", researcher_node)

    # Entry point
    workflow.set_entry_point("supervisor")

    # Conditional edge: supervisor → researcher or END
    workflow.add_conditional_edges(
        "supervisor",
        route_after_supervisor,
        {"researcher": "researcher", END: END},
    )

    # researcher → END (media handled by Node.js)
    workflow.add_edge("researcher", END)

    return workflow.compile()


# Compiled graph — imported by main.py
tutor_graph = build_graph()
