import { Suspense } from "react";
import { LoginContent } from "./login-content";

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen flex-col">
      <Suspense>
        <LoginContent />
      </Suspense>
      {/* Build identity — makes a stale deployment instantly visible, even
          before signing in (the stale-build bug that masked the cookie crash
          for weeks was only detectable from the login screen). */}
      <p
        className="absolute bottom-2 right-3 text-[9px] font-mono text-muted-foreground/60 select-none"
        title="Deployed build. If this doesn't match the latest commit on main, the deploy pipeline is broken."
      >
        build {process.env.NEXT_PUBLIC_BUILD_VERSION ?? "dev"}
      </p>
    </div>
  );
}
