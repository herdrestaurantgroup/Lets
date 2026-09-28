import { accountsEnabled, signInWithGoogle, signOut } from "../data/auth";

interface AccountBarProps {
  name: string | null;
  sessionCode: string | null;
  onInvite: () => void;
}

export function AccountBar({ name, sessionCode, onInvite }: AccountBarProps) {
  if (!accountsEnabled()) {
    return (
      <span className="text-xs text-gray-400">Guest mode</span>
    );
  }
  if (!name) {
    return (
      <button
        onClick={() => signInWithGoogle().catch((err) => alert(err.message))}
        className="text-sm border border-gray-300 rounded px-2 py-1"
      >
        Sign in with Google
      </button>
    );
  }
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm">{name}</span>
      <button onClick={onInvite} className="text-sm border border-gray-300 rounded px-2 py-1">
        {sessionCode ? `Code ${sessionCode}` : "Invite friend"}
      </button>
      <button onClick={() => signOut()} className="text-xs text-gray-500">
        Sign out
      </button>
    </div>
  );
}
