import { createFileRoute } from "@tanstack/react-router";
import { SkyClimb } from "@/components/SkyClimb";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "DLICOM Sky Climb — Answer. Climb. Conquer." },
      {
        name: "description",
        content:
          "DLICOM Sky Climb is an endless quiz-powered arcade platformer: answer questions to earn energy, then climb through increasingly challenging sky zones.",
      },
      { property: "og:title", content: "DLICOM Sky Climb — Answer. Climb. Conquer." },
      {
        property: "og:description",
        content:
          "Answer quiz questions to earn energy and climb an endless tower that becomes more challenging with height.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

function Index() {
  return <SkyClimb />;
}
