import React from 'react';
import { BookOpen, CheckCircle, GitBranch, Key, Network, ShieldCheck, Sparkles, UploadCloud } from 'lucide-react';

function GuideSection({ number, icon: Icon, title, children }) {
  return (
    <section className="border-b border-zinc-200 dark:border-[#262626] pb-8">
      <div className="flex items-start gap-4">
        <div className="h-9 w-9 rounded-lg bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 flex items-center justify-center shrink-0">
          <Icon className="h-4.5 w-4.5" />
        </div>
        <div className="min-w-0">
          <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">Step {number}</div>
          <h2 className="mt-1 text-lg font-semibold tracking-tight text-zinc-950 dark:text-white">{title}</h2>
          <div className="mt-4 text-sm leading-7 text-zinc-600 dark:text-zinc-350 space-y-3">{children}</div>
        </div>
      </div>
    </section>
  );
}

export default function UserGuide() {
  return (
    <div className="flex-1 overflow-y-auto bg-transparent dark:bg-transparent text-zinc-900 dark:text-zinc-50">
      <div className="max-w-5xl mx-auto px-8 py-10 space-y-9">
        <header className="border-b border-zinc-200 dark:border-[#262626] pb-8">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 flex items-center justify-center">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">VibeCheck User Guide</h1>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">A complete step-by-step guide for running sandbox-first AI diagnostics safely.</p>
            </div>
          </div>
        </header>

        <GuideSection number="1" icon={Key} title="Configure AI and GitHub access">
          <p>Open <strong>Credentials</strong> and add your Gemini/OpenAI key if you want real AI diagnosis instead of offline simulation.</p>
          <p>Open <strong>Repositories</strong> and connect your GitHub profile. GitHub is required only when you want to push a verified fix as a pull request.</p>
        </GuideSection>

        <GuideSection number="2" icon={GitBranch} title="Clone a repository into isolation">
          <p>Go to <strong>Repositories</strong>, paste a GitHub HTTPS repository URL, choose the branch, and click <strong>Clone to Sandbox</strong>.</p>
          <p>VibeCheck clones the repository into a controlled workspace and immediately creates a sandbox copy. Untrusted code is not executed directly on your host flow.</p>
        </GuideSection>

        <GuideSection number="3" icon={Network} title="Let the knowledge graph build automatically">
          <p>After cloning, VibeCheck writes Graphify-compatible outputs inside the cloned workspace: <code>graphify-out/graph.json</code>, <code>graphify-out/graph.html</code>, and <code>graphify-out/GRAPH_REPORT.md</code>.</p>
          <p>The graph identifies central files, symbols, imports, documentation concepts, and high-impact nodes. AI diagnosis receives this graph report so it can understand multiple failures and cascading errors more accurately.</p>
        </GuideSection>

        <GuideSection number="4" icon={ShieldCheck} title="Run the sandbox pipeline first">
          <p>Open the <strong>Sandbox</strong> page for the cloned repository and click <strong>Run Sandbox</strong>. The console shows only the sandbox run first, keeping the workflow focused.</p>
          <p>If the sandbox pipeline passes, you can continue to the controlled repo verification stage. If it fails, run AI diagnosis before applying any changes.</p>
        </GuideSection>

        <GuideSection number="5" icon={Sparkles} title="Diagnose, review, chat, and patch">
          <p>When the sandbox fails, click <strong>Diagnose</strong>. VibeCheck sends the failed logs plus knowledge graph context to AI.</p>
          <p>Open the <strong>AI Patch</strong> tab to review root cause, impact, original code, and patched code. Open <strong>Chat</strong> to ask questions like whether errors are independent or caused by one shared module.</p>
          <p>Only after review, click <strong>Apply and Rerun</strong>. The patch is applied inside the sandbox, then the sandbox pipeline runs again.</p>
        </GuideSection>

        <GuideSection number="6" icon={UploadCloud} title="Promote only after verification">
          <p>When the sandbox is green, click <strong>Verify Repo</strong>. This copies the reviewed patch set into the controlled repo pipeline and runs the same install/build/test stages.</p>
          <p>After the repo pipeline passes, choose <strong>Create PR</strong> to push a GitHub pull request, or <strong>Download</strong> to export the verified repository archive.</p>
        </GuideSection>

        <div className="rounded-lg border border-emerald-500/25 bg-emerald-500/5 p-5 flex gap-3">
          <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
          <p className="text-sm leading-7 text-zinc-700 dark:text-zinc-300">
            The golden rule: clone, graph, sandbox, diagnose, patch, rerun sandbox, verify repo, then promote. Every risky step is gated by the previous successful step.
          </p>
        </div>
      </div>
    </div>
  );
}
