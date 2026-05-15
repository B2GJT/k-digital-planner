import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { repoRoot } from './lib/paths.js';

const projectsRoot = path.join(repoRoot, 'projects');

async function main() {
  const projects = findRunnableProjects();

  if (projects.length === 0) {
    console.log('실행 가능한 프로젝트가 없습니다.');
    console.log('');
    console.log('목록에 표시되려면 projects 하위 폴더에 다음 두 가지가 모두 있어야 합니다.');
    console.log('- inputs.txt');
    console.log('- .xlsx 파일(cr.xlsx 권장)');
    process.exit(1);
  }

  console.log('');
  console.log('실행 가능한 프로젝트 목록');
  console.log('');
  projects.forEach((project, index) => {
    console.log(`${index + 1}. ${project.name}`);
  });
  console.log('');

  const selected = await askSelection(projects);
  if (!selected) {
    console.log('선택을 취소했습니다.');
    process.exit(0);
  }

  console.log('');
  console.log(`선택한 프로젝트: ${selected.name}`);
  console.log(`기획서 구성을 시작합니다: ${selected.relativePath}`);
  console.log('');

  const result = spawnSync(process.execPath, ['scripts/run-project.js', selected.relativePath], {
    cwd: repoRoot,
    stdio: 'inherit',
    shell: false,
    env: process.env,
  });

  process.exit(result.status ?? 0);
}

function findRunnableProjects() {
  if (!fs.existsSync(projectsRoot)) return [];

  return fs
    .readdirSync(projectsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const projectDir = path.join(projectsRoot, entry.name);
      return {
        name: entry.name,
        projectDir,
        relativePath: path.relative(repoRoot, projectDir),
      };
    })
    .filter((project) => hasInputsFile(project.projectDir) && hasXlsxFile(project.projectDir))
    .sort((a, b) => a.name.localeCompare(b.name, 'ko'));
}

function hasInputsFile(projectDir) {
  return fs.existsSync(path.join(projectDir, 'inputs.txt'));
}

function hasXlsxFile(projectDir) {
  return fs
    .readdirSync(projectDir, { withFileTypes: true })
    .some((entry) => entry.isFile() && /\.xlsx$/i.test(entry.name) && !entry.name.startsWith('~$'));
}

async function askSelection(projects) {
  const rl = readline.createInterface({ input, output });
  try {
    while (true) {
      const answer = await rl.question('기획서를 구성할 프로젝트 번호를 선택하세요. 취소하려면 q 입력: ');
      const trimmed = answer.trim();
      if (/^q$/i.test(trimmed)) return null;

      const index = Number(trimmed);
      if (Number.isInteger(index) && index >= 1 && index <= projects.length) {
        return projects[index - 1];
      }

      console.log(`1부터 ${projects.length} 사이의 번호를 입력해주세요.`);
    }
  } finally {
    rl.close();
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
