import { Users } from "lucide-react";
import { GroupData } from "../generators/types";

export default function BRGroupList({ groups }: { groups: GroupData[] }) {
  // Jangan render jika tidak ada grup yang valid
  if (!groups || groups.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="p-1.5 bg-indigo-500/10 rounded-lg">
          <Users size={18} className="text-indigo-400" />
        </div>
        <h3 className="text-lg font-bold text-white">Group Distribution</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {groups.map((group) => (
          <div
            key={group.name}
            className="flex flex-col bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden"
          >
            {/* Group Header */}
            <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex justify-between items-center">
              <span className="font-bold text-white">Group {group.name}</span>
              <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full border border-slate-700">
                {group.teams.length} Teams
              </span>
            </div>

            {/* Teams List */}
            <div className="p-2 flex-1">
              <ul className="space-y-1">
                {group.teams.map((team, idx) => (
                  <li
                    key={team.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors text-sm text-slate-300"
                  >
                    <span className="w-5 h-5 flex items-center justify-center bg-slate-800 rounded text-[10px] text-slate-500 font-mono">
                      {idx + 1}
                    </span>
                    <span className="truncate font-medium">{team.name}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
