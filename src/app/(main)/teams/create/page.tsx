import { redirect } from "next/navigation";

// Back-compat route: some UI paths link to /teams/create
// The actual Create Team UI lives on /teams as a modal.
export default function TeamsCreateRedirectPage() {
  redirect("/teams?create=1");
}


