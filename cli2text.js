import fs from "node:fs/promises";
import path from "node:path";
import chalk from "chalk";

const IGNORE = [
  "node_modules",
  ".git",
  "package-lock.json",
  "output.txt",
];

const DEFAULT_OUTPUT = "output.txt";

/**
 * @param {number} bytes - Taille en bytes.
 * @returns {string} Taille formatée.
 */
function formatSize(bytes) {
  const units = ["B", "KB", "MB", "GB"];
  let unitIndex = 0;
  while (bytes >= 1024 && unitIndex < units.length - 1) {
    bytes /= 1024;
    unitIndex++;
  }
  return `${bytes.toFixed(1)} ${units[unitIndex]}`;
}

/**
 * @param {string} name - Nom de l'élément.
 * @returns {boolean} - Vrai si l'élément est dans la liste d'exclusion.
 */
function shouldIgnore(name) {
  return IGNORE.includes(name);
}

/**.
 * @param {string} dir - Chemin du répertoire.
 * @param {string} indent - Indentation pour afficher la hiérarchie.
 * @param {Array<string>} compiledContent - Résultat final.
 * @returns {Promise<Array<string>>} - Liste des éléments analysés.
 */
async function processTree(dir, indent = "", compiledContent = []) {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (shouldIgnore(entry.name)) continue;

      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        console.log(chalk.green(`${indent}📂 ${entry.name}`));
        compiledContent.push(`${indent}📂 ${entry.name}`);
        await processTree(fullPath, `${indent}   `, compiledContent);
      } else {
        const stats = await fs.stat(fullPath);
        const size = formatSize(stats.size);
        console.log(chalk.blue(`${indent}📄 ${entry.name} (${size})`));
        compiledContent.push(`${indent}📄 ${entry.name} (${size})`);
      }
    }
  } catch (error) {
    console.error(chalk.red(`Erreur lors de l'analyse de ${dir}: ${error.message}`));
  }
  return compiledContent;
}

/**
 * @param {string} directory - Chemin du répertoire.
 * @returns {Promise<boolean>} - Vrai si le chemin est valide.
 */
async function isValidDirectory(directory) {
  try {
    const stats = await fs.stat(directory);
    return stats.isDirectory();
  } catch {
    return false;
  }
}

async function main() {
  const directory = process.argv[2] || ".";
  console.log(chalk.yellow(`Analyzing directory: ${directory}\n`));

  if (!(await isValidDirectory(directory))) {
    console.error(chalk.red(`Erreur : Le chemin spécifié "${directory}" n'est pas un répertoire valide.`));
    return;
  }

  try {
    const compiledContent = await processTree(directory);
    await fs.writeFile(DEFAULT_OUTPUT, compiledContent.join("\n"));
    console.log(chalk.green(`\nAnalysis completed. Results saved in "${DEFAULT_OUTPUT}"`));
  } catch (error) {
    console.error(chalk.red(`Erreur : ${error.message}`));
  }
}

main();
