/**
 * Security Scanner API
 * POST /api/security/scan — Run a real security scan
 * GET  /api/security/scan — Get last scan results
 * 
 * Performs real file integrity and security checks:
 * - Recently modified files in critical directories
 * - Suspicious file patterns (webshells, backdoors)
 * - World-writable files
 * - Open ports check
 * - SSL/TLS configuration
 */

import { NextResponse } from 'next/server'
import { execSync } from 'child_process'
import fs from 'fs/promises'

const SCAN_RESULTS_FILE = '/var/www/carphacom/current/admin-panel/.security-scan.json'
const BASE_DIR = '/var/www/carphacom/current'

function exec(cmd: string, timeout = 30000): string {
  try {
    return execSync(cmd, { encoding: 'utf-8', timeout }).trim()
  } catch {
    return ''
  }
}

interface ScanResult {
  timestamp: string
  duration: number
  score: number
  checks: {
    name: string
    status: 'pass' | 'warn' | 'fail'
    message: string
    details?: string[]
  }[]
}

function runScan(): ScanResult {
  const start = Date.now()
  const checks: ScanResult['checks'] = []

  // 1. Check for recently modified PHP/JS files that shouldn't change (potential backdoor injection)
  const recentlyModified = exec(
    `find ${BASE_DIR} -name '*.php' -o -name '*.sh' | xargs ls -lt --time-style='+%Y-%m-%d %H:%M' 2>/dev/null | head -10`
  )
  const suspiciousRecent = recentlyModified.split('\n').filter(l => l.trim()).slice(0, 5)
  checks.push({
    name: 'Recently modified files',
    status: suspiciousRecent.length > 3 ? 'warn' : 'pass',
    message: suspiciousRecent.length > 3 
      ? `${suspiciousRecent.length} .php/.sh files recently modified`
      : 'No suspicious modifications',
    details: suspiciousRecent,
  })

  // 2. Check for suspicious file patterns
  const suspiciousPatterns = exec(
    `find ${BASE_DIR} -type f \\( -name '*.php.bak' -o -name '*.suspected' -o -name 'c99.php' -o -name 'r57.php' -o -name 'shell.php' -o -name 'hack*' \\) 2>/dev/null | head -10`
  )
  const suspFiles = suspiciousPatterns.split('\n').filter(Boolean)
  checks.push({
    name: 'Suspicious files (webshell)',
    status: suspFiles.length > 0 ? 'fail' : 'pass',
    message: suspFiles.length > 0 
      ? `${suspFiles.length} suspicious files detected!` 
      : 'No suspicious files detected',
    details: suspFiles,
  })

  // 3. World-writable files
  const worldWritable = exec(
    `find ${BASE_DIR} -type f -perm -o+w 2>/dev/null | grep -v node_modules | grep -v '.next' | head -10`
  )
  const wwFiles = worldWritable.split('\n').filter(Boolean)
  checks.push({
    name: 'World-writable files',
    status: wwFiles.length > 0 ? 'warn' : 'pass',
    message: wwFiles.length > 0
      ? `${wwFiles.length} files with overly permissive permissions`
      : 'File permissions OK',
    details: wwFiles,
  })

  // 4. Check for eval/base64_decode suspicious patterns in server code
  const evalPatterns = exec(
    `grep -rl 'eval(base64_decode\\|exec(\\$_\\|system(\\$_\\|passthru(' ${BASE_DIR}/ --include='*.php' --include='*.js' 2>/dev/null | grep -v node_modules | grep -v .next | head -10`
  )
  const evalFiles = evalPatterns.split('\n').filter(Boolean)
  checks.push({
    name: 'Malicious code (eval/exec inject)',
    status: evalFiles.length > 0 ? 'fail' : 'pass',
    message: evalFiles.length > 0
      ? `${evalFiles.length} files with potentially malicious code!`
      : 'No code injections detected',
    details: evalFiles,
  })

  // 5. Open ports check
  const openPorts = exec(`ss -tlnp 2>/dev/null | grep LISTEN | awk '{print $4}' | sed 's/.*://'| sort -n | uniq`)
  const ports = openPorts.split('\n').filter(Boolean)
  const expectedPorts = ['22', '80', '443', '3000', '5432', '8000', '9000']
  const unexpectedPorts = ports.filter(p => !expectedPorts.includes(p))
  checks.push({
    name: 'Open ports',
    status: unexpectedPorts.length > 0 ? 'warn' : 'pass',
    message: unexpectedPorts.length > 0
      ? `Unexpected ports: ${unexpectedPorts.join(', ')}`
      : `${ports.length} open ports (all expected)`,
    details: ports.map(p => `Port ${p}: ${expectedPorts.includes(p) ? 'expected' : 'UNEXPECTED'}`),
  })

  // 6. SSL/TLS check
  const sslCheck = exec(
    `echo | openssl s_client -connect YOUR_PNI_USERNAMEtrafic.ro:443 -tls1_2 2>/dev/null | grep 'Protocol\\|Cipher'`
  )
  const hasTLS12 = sslCheck.includes('TLSv1.2') || sslCheck.includes('TLSv1.3')
  checks.push({
    name: 'SSL/TLS Configuration',
    status: hasTLS12 ? 'pass' : 'warn',
    message: hasTLS12 ? 'TLS 1.2/1.3 active' : 'SSL verification incomplete',
    details: sslCheck ? [sslCheck] : ['Could not verify'],
  })

  // 7. Nginx configuration check
  const nginxTest = exec('sudo nginx -t 2>&1')
  checks.push({
    name: 'Nginx Configuration',
    status: nginxTest.includes('successful') ? 'pass' : 'fail',
    message: nginxTest.includes('successful') ? 'Valid configuration' : 'Configuration errors!',
    details: nginxTest ? [nginxTest] : [],
  })

  // 8. Check for outdated packages with known vulnerabilities
  const npmAudit = exec(`cd ${BASE_DIR}/admin-panel && npm audit --json 2>/dev/null | node -e "d=require('fs').readFileSync('/dev/stdin','utf8');try{j=JSON.parse(d);console.log('high:'+((j.metadata||{}).vulnerabilities||{}).high+' critical:'+((j.metadata||{}).vulnerabilities||{}).critical)}catch(e){console.log('unavailable')}"`)
  checks.push({
    name: 'npm Vulnerabilities',
    status: npmAudit.includes('critical:0') && npmAudit.includes('high:0') ? 'pass' :
            npmAudit.includes('unavailable') ? 'warn' : 'warn',
    message: npmAudit || 'Could not verify',
    details: [],
  })

  // Calculate score
  const passCount = checks.filter(c => c.status === 'pass').length
  const warnCount = checks.filter(c => c.status === 'warn').length
  const failCount = checks.filter(c => c.status === 'fail').length
  const score = Math.round((passCount * 100 + warnCount * 50) / checks.length)

  return {
    timestamp: new Date().toISOString(),
    duration: Date.now() - start,
    score: Math.min(score, 100),
    checks,
  }
}

export async function POST() {
  try {
    const result = runScan()
    await fs.writeFile(SCAN_RESULTS_FILE, JSON.stringify(result, null, 2), 'utf-8')
    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: `Scan error: ${error instanceof Error ? error.message : 'Unknown'}`,
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    const content = await fs.readFile(SCAN_RESULTS_FILE, 'utf-8')
    return NextResponse.json({ success: true, ...JSON.parse(content) })
  } catch {
    return NextResponse.json({
      success: true,
      timestamp: null,
      message: 'No previous scan. Run a new scan.',
      checks: [],
    })
  }
}
