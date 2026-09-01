import { APP_NAME } from "@/constants";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-foreground/10">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6 text-sm text-foreground/60">
        <p>
          &copy; {year} {APP_NAME}. All rights reserved.
        </p>
        <p>Built with Next.js 15</p>
      </div>
    </footer>
  );
}
