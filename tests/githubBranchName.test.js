const {
  buildBranchName,
  normaliseBranchName,
  isValidBranchName,
} = require("../app/services/githubBranchName");
const { parseRepoUrl } = require("../app/services/githubUrl");

describe("buildBranchName", () => {

  it("uses the type prefix and a slugified title", () => {
    expect(buildBranchName({ id: 42, type: "FEATURE", title: "Fix the login redirect" }))
      .toBe("feature/fix-the-login-redirect");
  });


  it("maps BUG to bugfix and ENHANCEMENT to enhancement", () => {
    expect(buildBranchName({ id: 8, type: "BUG", title: "Users cannot login" }))
      .toBe("bugfix/users-cannot-login");

    expect(buildBranchName({ id: 9, type: "ENHANCEMENT", title: "Faster board" }))
      .toBe("enhancement/faster-board");
  });


  it("falls back to feature for an unknown or missing type", () => {
    expect(buildBranchName({ id: 1, type: "MYSTERY", title: "Thing" }))
      .toBe("feature/thing");

    expect(buildBranchName({ id: 1, title: "Thing" }))
      .toBe("feature/thing");
  });


  it("collapses punctuation and strips leading and trailing dashes", () => {
    expect(buildBranchName({ id: 3, type: "BUG", title: "  !!! Login: broken (again) ??? " }))
      .toBe("bugfix/login-broken-again");
  });


  it("ignores any name already on the ticket — that is the automation's job", () => {
    expect(buildBranchName({ id: 4, type: "BUG", title: "Thing", githubBranchName: "mine" }))
      .toBe("bugfix/thing");
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

    expect(branch.length).toBeLessThanOrEqual("feature/".length + 50);
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


  it("always produces a name that passes isValidBranchName", () => {
    const titles = [
      "Fix the login redirect",
      "",
      "!!!",
      "weird ~ ^ : ? * [ .. \\ chars",
      "   leading and trailing   ",
      "a".repeat(200),
      ".hidden start",
      "ends with a dot.",
      "x.lock",
    ];

    titles.forEach((title) => {
      ["FEATURE", "BUG", "ENHANCEMENT", undefined].forEach((type) => {
        const branch = buildBranchName({ id: 7, type: type, title: title });
        expect({ title, type, branch, valid: isValidBranchName(branch) })
          .toEqual({ title, type, branch, valid: true });
      });
    });
  });

});


describe("normaliseBranchName", () => {

  it("trims surrounding whitespace", () => {
    expect(normaliseBranchName("  feature/thing  ")).toBe("feature/thing");
  });


  it("strips a refs/heads/ prefix", () => {
    expect(normaliseBranchName("refs/heads/feature/thing")).toBe("feature/thing");
  });


  it("collapses repeated slashes", () => {
    expect(normaliseBranchName("feature//thing///x")).toBe("feature/thing/x");
  });


  it("returns an empty string for nothing usable", () => {
    expect(normaliseBranchName("")).toBe("");
    expect(normaliseBranchName("   ")).toBe("");
    expect(normaliseBranchName(null)).toBe("");
    expect(normaliseBranchName(undefined)).toBe("");
    expect(normaliseBranchName(42)).toBe("");
  });


  it("leaves an otherwise valid name exactly as typed", () => {
    expect(normaliseBranchName("JW/Spike_try-redis.2")).toBe("JW/Spike_try-redis.2");
  });

});


describe("isValidBranchName", () => {

  it.each([
    "feature/thing",
    "bugfix/users-cannot-login",
    "JW/Spike_try-redis.2",
    "release/2.0",
    "a",
  ])("accepts %s", (name) => {
    expect(isValidBranchName(name)).toBe(true);
  });


  it.each([
    ["empty", ""],
    ["not a string", null],
    ["a space", "my branch"],
    ["a tab", "my\tbranch"],
    ["a tilde", "feature/~x"],
    ["a caret", "feature/^x"],
    ["a colon", "feature/a:b"],
    ["a question mark", "feature/a?b"],
    ["an asterisk", "feature/a*b"],
    ["an open bracket", "feature/a[b"],
    ["a backslash", "feature/a\\b"],
    ["a double dot", "feature/a..b"],
    ["an at-brace", "feature/a@{b"],
    ["a lone at", "@"],
    ["a leading slash", "/feature/x"],
    ["a trailing slash", "feature/x/"],
    ["a trailing dot", "feature/x."],
    ["a .lock suffix", "feature/x.lock"],
    ["a component starting with a dot", "feature/.hidden"],
    ["an empty component", "feature//x"],
  ])("rejects %s", (_label, name) => {
    expect(isValidBranchName(name)).toBe(false);
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
