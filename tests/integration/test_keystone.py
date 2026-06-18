from gltest import get_contract_factory
from gltest.assertions import tx_execution_succeeded


def _states(milestones):
    return [m.get("state") for m in milestones]


def test_keystone_chart_and_unlock_flow():
    factory = get_contract_factory("Keystone")
    contract = factory.deploy(args=[])

    # 1. forge a goal (deterministic, no LLM)
    forge = contract.forge_goal(
        args=[
            "Ship a v1 mobile app",
            "Launch a polished v1 of a habit-tracking mobile app to the App Store within one quarter.",
        ]
    ).transact()
    assert tx_execution_succeeded(forge)

    goals = contract.get_goals(args=[0]).call()
    assert len(goals) >= 1
    goal_id = goals[0]["id"]
    assert goals[0]["status"] == "PLANNING"

    # 2. chart it (Strategist AI under consensus)
    chart = contract.chart(args=[goal_id]).transact()
    assert tx_execution_succeeded(chart)

    goal = contract.get_goal(args=[goal_id]).call()
    assert goal["status"] == "ACTIVE"

    feasibility = int(goal["feasibility"])
    assert 0 <= feasibility <= 100

    milestones = goal["milestones"]
    assert 4 <= len(milestones) <= 8

    # at least one UNLOCKED root milestone (no prereqs)
    roots = [m for m in milestones if len(m.get("prereqs", [])) == 0]
    assert len(roots) >= 1
    unlocked_roots = [m for m in roots if m.get("state") == "UNLOCKED"]
    assert len(unlocked_roots) >= 1

    # indices are assigned in order
    for i, m in enumerate(milestones):
        assert int(m["i"]) == i
        for p in m.get("prereqs", []):
            assert 0 <= int(p) < i

    # stats updated after charting
    stats = contract.get_stats().call()
    assert int(stats["goals"]) >= 1

    # 3. find a root that is a prerequisite for some dependent, complete it,
    #    and assert the dependent unlocks. If no dependent edge exists, just
    #    assert the root transitions to DONE.
    dependents_by_root = {}
    for m in milestones:
        for p in m.get("prereqs", []):
            dependents_by_root.setdefault(int(p), []).append(int(m["i"]))

    target_root = None
    for r in unlocked_roots:
        ri = int(r["i"])
        if ri in dependents_by_root:
            target_root = ri
            break
    if target_root is None:
        target_root = int(unlocked_roots[0]["i"])

    complete = contract.complete(args=[goal_id, target_root]).transact()
    assert tx_execution_succeeded(complete)

    after = contract.get_goal(args=[goal_id]).call()
    after_ms = after["milestones"]
    assert after_ms[target_root]["state"] == "DONE"

    # any dependent whose prereqs are now all DONE must be UNLOCKED (not LOCKED)
    for dep_idx in dependents_by_root.get(target_root, []):
        dep = after_ms[dep_idx]
        all_prereqs_done = all(
            after_ms[int(p)]["state"] == "DONE" for p in dep.get("prereqs", [])
        )
        if all_prereqs_done:
            assert dep["state"] in ("UNLOCKED", "DONE")
