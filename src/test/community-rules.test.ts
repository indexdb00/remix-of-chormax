import { describe, expect, it } from "vitest";
import { acceptedFriendIds, isValidPost } from "@/lib/community-rules";
describe("Community rules", () => {
  it("home includes only accepted friends in either direction, never pending or unrelated people", () => {
    expect(acceptedFriendIds([
      { requester_id: "me", addressee_id: "friend-a", status: "accepted" },
      { requester_id: "friend-b", addressee_id: "me", status: "accepted" },
      { requester_id: "me", addressee_id: "pending", status: "pending" },
      { requester_id: "stranger", addressee_id: "other", status: "accepted" },
    ], "me")).toEqual(["friend-a", "friend-b"]);
  });
  it("requires a nonempty post up to 500 characters", () => {
    expect(isValidPost("   ")).toBe(false);
    expect(isValidPost("a".repeat(500))).toBe(true);
    expect(isValidPost("a".repeat(501))).toBe(false);
  });
});