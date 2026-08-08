const { buildBranchName } = require("../app/services/githubBranchName");
const { parseRepoUrl } = require("../app/services/githubUrl");

describe("buildBranchName", () => {

  it("uses the type prefix and a slugified title", () => {
    expect(buildBranchName({ id: 42, type: "FEATURE", title: "Fix the login redirect" }))
      .toBe("feature/ticket-42-fix-the-login-redirect");
  });


  it("maps BUG to bugfix and ENHANCEMENT to enhancement", () => {
    expect(buildBranchName({ id: 8, type: "BUG", title: "Users cannot login" }))
      .toBe("bugfix/ticket-8-users-cannot-login");

    expect(buildBranchName({ id: 9, type: "ENHANCEMENT", title: "Faster board" }))
      .toBe("enhancement/ticket-9-faster-board");
  });


  it("falls back to feature for an unknown or missing type", () => {
    expect(buildBranchName({ id: 1, type: "MYSTERY", title: "Thing" }))
      .toBe("feature/ticket-1-thing");

    expect(buildBranchName({ id: 1, title: "Thing" }))
      .toBe("feature/ticket-1-thing");
  });


  it("collapses punctuation and strips leading and trailing dashes", () => {
    expect(buildBranchName({ id: 3, type: "BUG", title: "  !!! Login: broken (again) ??? " }))
      .toBe("bugfix/ticket-3-login-broken-again");
  });


  it("produces a legal ref when the title is empty or symbols only", () => {
    expect(buildBranchName({ id: 5, type: "FEATURE", title: "" }))
      .toBe("feature/ticket-5");

    expect(buildBranchName({ id: 6, type: "FEATURE", title: "!!!" }))
      .toBe("feature/ticket-6");

    expect(buildBranchName({ id: 7, type: "FEATURE" }))
      .toBe("feature/ticket-7");
  });


  it("caps the slug and never ends on a dash", () => {
    const branch = buildBranchName({
      id: 11,
      type: "FEATURE",
      title: "A very long ticket title that goes on and on and on beyond the cap",
    });

    expect(branch.length).toBeLessThanOrEqual("feature/ticket-11-".length + 50);
    expect(branch).not.toMatch(/-$/);
  });


  it("never emits characters git rejects in a ref", () => {
    const branch = buildBranchName({
      id: 12,
      type: "BUG",
      title: "weird ~ ^ : ? * [ .. \\ chars",
    });

    expect(branch).not.toMatch(/[~^:?*[\\]/);
    expect(branch).not.toContain("..");
    expect(branch).not.toMatch(/\.lock$/);
  });

});


describe("parseRepoUrl", () => {

  it("parses a plain https url", () => {
    expect(parseRepoUrl("https://github.com/CynthiaNirere/sprintboard-system-backend"))
      .toEqual({ owner: "CynthiaNirere", repoName: "sprintboard-system-backend" });
  });


  it("tolerates a .git suffix and a trailing slash", () => {
    expect(parseRepoUrl("https://github.com/acme/widgets.git"))
      .toEqual({ owner: "acme", repoName: "widgets" });

    expect(parseRepoUrl("https://github.com/acme/widgets/"))
      .toEqual({ owner: "acme", repoName: "widgets" });
  });


  it("parses an ssh remote", () => {
    expect(parseRepoUrl("git@github.com:acme/widgets.git"))
      .toEqual({ owner: "acme", repoName: "widgets" });
  });


  it("parses a bare owner/repo", () => {
    expect(parseRepoUrl("acme/widgets"))
      .toEqual({ owner: "acme", repoName: "widgets" });
  });


  it("ignores extra path segments", () => {
    expect(parseRepoUrl("https://github.com/acme/widgets/tree/main"))
      .toEqual({ owner: "acme", repoName: "widgets" });
  });


  it("returns null for anything it cannot parse", () => {
    expect(parseRepoUrl("")).toBeNull();
    expect(parseRepoUrl("   ")).toBeNull();
    expect(parseRepoUrl(null)).toBeNull();
    expect(parseRepoUrl(undefined)).toBeNull();
    expect(parseRepoUrl(42)).toBeNull();
    expect(parseRepoUrl("https://github.com/acme")).toBeNull();
  });

});
