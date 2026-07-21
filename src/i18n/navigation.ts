import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

// Locale-aware replacements for `next/link` and the navigation hooks: they add the
// `/en` prefix when needed and leave FR paths bare, so components link to `/approach`
// and the current locale decides the rest.
export const { Link, redirect, permanentRedirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
