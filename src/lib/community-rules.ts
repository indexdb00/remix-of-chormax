export type Friendship = { requester_id: string; addressee_id: string; status: string };
export function acceptedFriendIds(rows: Friendship[], userId: string) {
  return [...new Set(rows.filter((r) => r.status === "accepted" && (r.requester_id === userId || r.addressee_id === userId)).map((r) => r.requester_id === userId ? r.addressee_id : r.requester_id))];
}
export function isValidPost(body: string) {
  return body.trim().length >= 1 && body.trim().length <= 500;
}