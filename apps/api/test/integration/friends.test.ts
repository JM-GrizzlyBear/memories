import { describe, expect, it } from "vitest";
import { USERS } from "./support/seed.js";
import { useTestApp } from "./support/testApp.js";

const t = useTestApp();

describe("friend requests", () => {
  it("send, then accept: both become friends and the asker is notified", async () => {
    const cara = await t.as("cara");
    const maria = await t.as("maria");

    expect(
      (await cara.post(`/api/friends/requests/${USERS.maria.id}`)).ok,
    ).toBe(true);
    const requests = await maria.get("/api/friends/requests");
    expect(
      requests.body.incoming.map((r: { username: string }) => r.username),
    ).toEqual(["cara"]);

    expect(
      (await maria.post(`/api/friends/requests/${USERS.cara.id}/accept`)).ok,
    ).toBe(true);
    const friends = await cara.get("/api/friends");
    expect(
      friends.body.friends.map((f: { username: string }) => f.username),
    ).toEqual(["maria"]);

    const notifications = await cara.get("/api/notifications");
    expect(notifications.body.notifications[0].type).toBe("friend_accepted");
  });

  it("a declined request leaves you not friends", async () => {
    const cara = await t.as("cara");
    const maria = await t.as("maria");
    await cara.post(`/api/friends/requests/${USERS.maria.id}`);
    expect(
      (await maria.post(`/api/friends/requests/${USERS.cara.id}/decline`)).ok,
    ).toBe(true);

    const profile = await cara.get("/api/users/maria");
    expect(profile.body.profile.friendship).toBe("none");
  });

  it("profiles say how you relate", async () => {
    const maria = await t.as("maria");
    expect((await maria.get("/api/users/ana")).body.profile.friendship).toBe(
      "friends",
    );
    expect((await maria.get("/api/users/cara")).body.profile.friendship).toBe(
      "none",
    );
    expect((await maria.get("/api/users/maria")).body.profile.friendship).toBe(
      "self",
    );
    expect((await maria.get("/api/users/nobody")).status).toBe(404);
  });
});
