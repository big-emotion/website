import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const htaccess = readFileSync(join(process.cwd(), "public", ".htaccess"), "utf-8");

describe("public/.htaccess", () => {
  it("still forces HTTPS", () => {
    expect(htaccess).toMatch(/RewriteCond %\{HTTPS\} off/);
    expect(htaccess).toMatch(/RewriteRule \^ https:\/\/%\{HTTP_HOST\}%\{REQUEST_URI\} \[R=301,L\]/);
  });

  it("still redirects every legacy WordPress URL", () => {
    expect(htaccess).toMatch(/\^contactez-nous\/\?\$/);
    expect(htaccess).toMatch(/\^les-membres\/\?\$/);
    expect(htaccess).toMatch(/\^case-study-mamiezi\/\?\$/);
    expect(htaccess).toMatch(/\^case-study-adolebatisseur\/\?\$/);
  });

  it("still sets the production security headers", () => {
    expect(htaccess).toMatch(/Header set X-Content-Type-Options "nosniff"/);
    expect(htaccess).toMatch(/Header set X-Frame-Options "SAMEORIGIN"/);
    expect(htaccess).toMatch(/Header always set Strict-Transport-Security/);
  });

  it("tags /preview with X-Robots-Tag noindex, scoped by an env condition rather than unconditionally", () => {
    expect(htaccess).toMatch(/RewriteCond %\{REQUEST_URI\} \^\/preview/);
    expect(htaccess).toMatch(/Header set X-Robots-Tag "noindex[^"]*" env=\S+/);
  });

  it("does not set X-Robots-Tag unconditionally (would noindex production)", () => {
    expect(htaccess).not.toMatch(/^\s*Header set X-Robots-Tag(?! .*env=)/m);
  });
});
