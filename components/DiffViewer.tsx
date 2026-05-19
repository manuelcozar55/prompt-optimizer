"use client";
import dynamic from "next/dynamic";

const ReactDiffViewer = dynamic(() => import("react-diff-viewer-continued"), { ssr: false });

export function DiffViewer({ before, after }: { before: string; after: string }) {
  return (
    <div className="text-xs font-mono rounded-lg overflow-hidden border border-zinc-800">
      <ReactDiffViewer
        oldValue={before}
        newValue={after}
        splitView={true}
        useDarkTheme={true}
        hideLineNumbers={false}
      />
    </div>
  );
}
