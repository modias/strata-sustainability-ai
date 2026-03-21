import { Outlet } from "react-router";

export function Root() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <Outlet />
    </div>
  );
}
