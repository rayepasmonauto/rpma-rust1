#!/usr/bin/env node
/**
 * Documentation Consistency Checker
 * 
 * Validates that architecture docs are in sync with the codebase.
 * Run as part of CI/CD or manually before commits.
 * 
 * Usage:
 *   node scripts/check-docs-consistency.js [--fix]
 * 
 * Options:
 *   --fix    Attempt to auto-fix minor issues (file references)
 *   --quiet  Only show errors
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const DOCS_DIR = path.join(ROOT_DIR, 'docs');
const ADR_DIR = path.join(DOCS_DIR, 'adr');

const args = process.argv.slice(2);
const shouldFix = args.includes('--fix');
const quiet = args.includes('--quiet');

let errors = 0;
let warnings = 0;
let fixes = 0;

function log(type, message) {
  if (quiet && type !== 'error') return;
  
  const colors = {
    error: '\x1b[31m',
    warn: '\x1b[33m',
    info: '\x1b[36m',
    success: '\x1b[32m',
    fix: '\x1b[35m',
    reset: '\x1b[0m'
  };
  
  const prefixes = {
    error: '✗ ERROR',
    warn: '⚠ WARN',
    info: 'ℹ INFO',
    success: '✓ OK',
    fix: '↻ FIX'
  };
  
  console.log(`${colors[type]}${prefixes[type]}${colors.reset} ${message}`);
}

function fileExists(relativePath) {
  const fullPath = path.join(ROOT_DIR, relativePath);
  return fs.existsSync(fullPath);
}

function extractFileReferences(content) {
  const references = [];
  
  // Match various file reference patterns
  const patterns = [
    /`([^`]+\.(?:rs|ts|tsx|js|jsx|md|sql))`/g,
    /Location:\s*`?([^`\n]+)`?/gi,
    /\[.*?\]\(([^)]+)\)/g,
    /src-tauri\/[^\s`\n)']+/g,
    /frontend\/src\/[^\s`\n)']+/g
  ];
  
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const ref = match[1] || match[0];
      // Clean up the reference
      let cleanRef = ref
        .replace(/^['"`]|['"`]$/g, '')
        .replace(/\.\.\/\.\.\//g, '')
        .split(/[,\s]/)[0]
        .trim();
      
      if (cleanRef && !cleanRef.startsWith('http') && !cleanRef.includes('${')) {
        references.push(cleanRef);
      }
    }
  }
  
  return [...new Set(references)];
}

function extractADRReferences(content) {
  const adrRefs = [];
  const pattern = /\[ADR-(\d+)\]|\[adr\/(\d+)-[^\]]+\]|ADR-(\d+)/gi;
  
  let match;
  while ((match = pattern.exec(content)) !== null) {
    const num = match[1] || match[2] || match[3];
    if (num) {
      adrRefs.push(parseInt(num, 10));
    }
  }
  
  return [...new Set(adrRefs)];
}

function getExistingADRs() {
  const adrFiles = fs.readdirSync(ADR_DIR)
    .filter(f => f.match(/^\d+-.*\.md$/))
    .map(f => parseInt(f.split('-')[0], 10));
  return adrFiles;
}

function validateDocFile(docPath) {
  const content = fs.readFileSync(docPath, 'utf-8');
  const relativeDocPath = path.relative(ROOT_DIR, docPath);
  const docErrors = [];
  const docWarnings = [];
  
  // Check frontmatter
  if (!content.startsWith('---')) {
    docErrors.push('Missing YAML frontmatter');
  } else {
    const frontmatterEnd = content.indexOf('---', 3);
    if (frontmatterEnd === -1) {
      docErrors.push('Malformed YAML frontmatter (missing closing ---)');
    } else {
      const frontmatter = content.substring(0, frontmatterEnd);
      
      if (!frontmatter.includes('title:')) {
        docErrors.push('Missing "title" in frontmatter');
      }
      if (!frontmatter.includes('summary:')) {
        docErrors.push('Missing "summary" in frontmatter');
      }
      if (!frontmatter.includes('read_when:')) {
        docWarnings.push('Missing "read_when" in frontmatter');
      }
    }
  }
  
  // Check file references
  const fileRefs = extractFileReferences(content);
  for (const ref of fileRefs) {
    // Skip documentation references
    if (ref.startsWith('docs/') || ref.startsWith('./') || ref.startsWith('../docs')) {
      continue;
    }
    
    // Normalize path
    let normalizedRef = ref;
    if (!normalizedRef.startsWith('src-tauri') && !normalizedRef.startsWith('frontend')) {
      // Try common prefixes
      const prefixes = [
        'src-tauri/src/',
        'src-tauri/',
        'frontend/src/'
      ];
      
      let found = false;
      for (const prefix of prefixes) {
        if (fileExists(prefix + normalizedRef)) {
          found = true;
          break;
        }
      }
      
      if (!found && !fileExists(normalizedRef)) {
        docWarnings.push(`File reference may be broken: ${ref}`);
      }
    } else if (!fileExists(normalizedRef)) {
      docWarnings.push(`File reference not found: ${ref}`);
    }
  }
  
  // Check ADR references
  const adrRefs = extractADRReferences(content);
  const existingADRs = getExistingADRs();
  
  for (const adrNum of adrRefs) {
    if (!existingADRs.includes(adrNum)) {
      docWarnings.push(`ADR-${adrNum.toString().padStart(3, '0')} referenced but not found`);
    }
  }
  
  // Check for code blocks without language
  const codeBlocks = content.match(/```\n/g);
  if (codeBlocks) {
    docWarnings.push(`${codeBlocks.length} code block(s) without language specifier`);
  }
  
  return { errors: docErrors, warnings: docWarnings };
}

function checkDomainStructure() {
  const checks = [];
  
  // Check backend domains
  const backendDomainsPath = path.join(ROOT_DIR, 'src-tauri/src/domains');
  if (fs.existsSync(backendDomainsPath)) {
    const domains = fs.readdirSync(backendDomainsPath, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name);
    
    checks.push({
      name: 'Backend domains',
      expected: ['auth', 'tasks', 'clients', 'inventory', 'interventions', 'users', 'settings', 'calendar', 'quotes', 'reports', 'documents', 'notifications'],
      actual: domains
    });
  }
  
  // Check frontend domains
  const frontendDomainsPath = path.join(ROOT_DIR, 'frontend/src/domains');
  if (fs.existsSync(frontendDomainsPath)) {
    const domains = fs.readdirSync(frontendDomainsPath, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name);
    
    checks.push({
      name: 'Frontend domains',
      expected: ['auth', 'tasks', 'clients', 'inventory', 'interventions', 'users', 'settings'],
      actual: domains
    });
  }
  
  // Check IPC structure
  const ipcPath = path.join(ROOT_DIR, 'frontend/src/lib/ipc');
  if (fs.existsSync(ipcPath)) {
    const ipcFiles = fs.readdirSync(ipcPath, { withFileTypes: true })
      .map(f => f.name);
    
    checks.push({
      name: 'IPC core files',
      expected: ['core', 'utils.ts', 'cache.ts', 'commands.ts', 'client.ts'],
      actual: ipcFiles
    });
  }
  
  return checks;
}

function checkADRIndex() {
  const indexPath = path.join(ADR_DIR, 'README.md');
  if (!fs.existsSync(indexPath)) {
    log('error', 'ADR index not found: docs/adr/README.md');
    errors++;
    return;
  }
  
  const content = fs.readFileSync(indexPath, 'utf-8');
  const existingADRs = getExistingADRs();
  
  for (const adrNum of existingADRs) {
    const padded = adrNum.toString().padStart(3, '0');
    if (!content.includes(`[${padded}]`) && !content.includes(`./${padded}-`)) {
      log('warn', `ADR-${padded} exists but may not be listed in index`);
      warnings++;
    }
  }
}

function checkAGENTSAlignment() {
  const agentsPath = path.join(ROOT_DIR, 'AGENTS.md');
  if (!fs.existsSync(agentsPath)) {
    log('warn', 'AGENTS.md not found');
    warnings++;
    return;
  }
  
  const content = fs.readFileSync(agentsPath, 'utf-8');
  
  // Check that key sections exist
  const requiredSections = [
    'Stack',
    'Commands',
    'Non-negotiable',
    'Testing'
  ];
  
  for (const section of requiredSections) {
    if (!content.includes(section)) {
      log('warn', `AGENTS.md may be missing section: ${section}`);
      warnings++;
    }
  }
}

function generateReport() {
  console.log('\n' + '='.repeat(60));
  console.log('DOCUMENTATION CONSISTENCY REPORT');
  console.log('='.repeat(60) + '\n');
  
  // Get all doc files
  const docFiles = fs.readdirSync(DOCS_DIR)
    .filter(f => f.endsWith('.md') && f !== 'README.md')
    .map(f => path.join(DOCS_DIR, f));
  
  // Validate each doc
  for (const docPath of docFiles) {
    const relativePath = path.basename(docPath);
    const result = validateDocFile(docPath);
    
    if (result.errors.length > 0) {
      errors += result.errors.length;
      log('error', `${relativePath}:`);
      result.errors.forEach(e => log('error', `  - ${e}`));
    }
    
    if (result.warnings.length > 0) {
      warnings += result.warnings.length;
      log('warn', `${relativePath}:`);
      result.warnings.forEach(w => log('warn', `  - ${w}`));
    }
    
    if (result.errors.length === 0 && result.warnings.length === 0) {
      log('success', relativePath);
    }
  }
  
  // Check domain structure
  console.log('\n--- Domain Structure ---\n');
  const domainChecks = checkDomainStructure();
  for (const check of domainChecks) {
    const missing = check.expected.filter(e => !check.actual.includes(e));
    if (missing.length > 0) {
      log('warn', `${check.name}: Missing domains: ${missing.join(', ')}`);
      warnings++;
    } else {
      log('success', `${check.name}: All expected domains present`);
    }
  }
  
  // Check ADR index
  console.log('\n--- ADR Index ---\n');
  checkADRIndex();
  
  // Check AGENTS.md alignment
  console.log('\n--- AGENTS.md Alignment ---\n');
  checkAGENTSAlignment();
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log(`SUMMARY: ${errors} errors, ${warnings} warnings${fixes > 0 ? `, ${fixes} fixes applied` : ''}`);
  console.log('='.repeat(60) + '\n');
  
  return errors === 0;
}

// Main
const success = generateReport();
process.exit(success ? 0 : 1);
