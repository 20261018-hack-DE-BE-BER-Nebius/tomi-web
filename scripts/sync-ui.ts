import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { dirname, resolve } from "node:path";

const root = resolve(import.meta.dir, "..");
const services = [
  "tomi-web-ui-chat",
  "tomi-web-ui-components",
  "tomi-web-ui-canvas",
  "tomi-web-ui-3d",
] as const;
const common = [
  "lib/types.ts",
  "lib/api/client.ts",
  "lib/i18n",
  "styles/globals.css",
  "features/shell",
  "features/evidence",
  "components/ui",
  "app/layout.tsx",
  "proxy.ts",
  "app/api/health/route.ts",
  "app/api/csp-report/route.ts",
];
const runtime = [
  "next.config.ts",
  "server.mjs",
  "runtime-config.mjs",
  "Dockerfile",
  ".dockerignore",
  ".env.example",
  "docker-compose.yml",
  ".pre-commit-config.yaml",
];
const modes = {
  "tomi-web-ui-components": "cards",
  "tomi-web-ui-canvas": "canvas",
  "tomi-web-ui-3d": "graph",
};
for (const service of services) {
  const target = resolve(root, "..", service);
  if (!existsSync(resolve(target, "package.json")))
    throw new Error(`Missing UI repository: ${service}`);
  const sources =
    service === "tomi-web-ui-chat"
      ? ["src", "public"]
      : [...common.map((path) => `src/${path}`), "public"];
  for (const path of [...sources, ...runtime]) {
    const destination = resolve(target, path);
    mkdirSync(dirname(destination), { recursive: true });
    cpSync(resolve(root, path), destination, { recursive: true });
  }
  const manifest = JSON.parse(
    readFileSync(resolve(root, "package.json"), "utf8"),
  );
  manifest.name = service;
  writeFileSync(
    resolve(target, "package.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );
  const page =
    service === "tomi-web-ui-chat"
      ? 'import {ChatWorkspace} from "@/features/chat/ChatWorkspace"; export default function Page(){return <ChatWorkspace/>;}\n'
      : `import {EvidenceLab} from "@/features/evidence/EvidenceLab"; export default function Page(){return <EvidenceLab mode="${modes[service]}" live={false}/>;}\n`;
  writeFileSync(resolve(target, "src/app/page.tsx"), page);
  const compose = readFileSync(
    resolve(target, "docker-compose.yml"),
    "utf8",
  ).replace("image: tomi-web:", `image: ${service}:`);
  writeFileSync(resolve(target, "docker-compose.yml"), compose);
  console.info(
    `Updated ${service}; install its dependencies and rerun verification.`,
  );
}
