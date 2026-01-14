/**
 * Provider Detector Service
 * Detects whether a repository is hosted on GitHub, Azure Repos, or other providers
 */

import type { GitProvider } from '../../types/github';

/**
 * Remote URL patterns for different providers
 */
const PROVIDER_PATTERNS = {
  github: [
    // HTTPS: https://github.com/owner/repo.git
    /^https?:\/\/github\.com\//i,
    // SSH: git@github.com:owner/repo.git
    /^git@github\.com:/i,
    // SSH URL: ssh://git@github.com/owner/repo.git
    /^ssh:\/\/git@github\.com\//i,
  ],
  azure: [
    // HTTPS: https://dev.azure.com/org/project/_git/repo
    /^https?:\/\/dev\.azure\.com\//i,
    // HTTPS (old): https://org.visualstudio.com/project/_git/repo
    /^https?:\/\/[^.]+\.visualstudio\.com\//i,
    // SSH: git@ssh.dev.azure.com:v3/org/project/repo
    /^git@ssh\.dev\.azure\.com:/i,
    // SSH (old): org@vs-ssh.visualstudio.com:v3/org/project/repo
    /^[^@]+@vs-ssh\.visualstudio\.com:/i,
  ],
};

/**
 * Parsed repository info
 */
export interface ParsedRepositoryInfo {
  provider: GitProvider;
  owner?: string;
  repo?: string;
  organization?: string;
  project?: string;
}

/**
 * Detect git provider from remote URL
 * @param remoteUrl Git remote URL
 * @returns Detected provider type
 */
export function detectProvider(remoteUrl: string): GitProvider {
  if (!remoteUrl) {
    return 'unknown';
  }

  for (const pattern of PROVIDER_PATTERNS.github) {
    if (pattern.test(remoteUrl)) {
      return 'github';
    }
  }

  for (const pattern of PROVIDER_PATTERNS.azure) {
    if (pattern.test(remoteUrl)) {
      return 'azure';
    }
  }

  return 'unknown';
}

/**
 * Parse GitHub URL to extract owner and repo
 */
export function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  // HTTPS format: https://github.com/owner/repo.git
  const httpsMatch = url.match(
    /^https?:\/\/github\.com\/([^/]+)\/([^/]+?)(?:\.git)?$/i
  );
  if (httpsMatch) {
    return { owner: httpsMatch[1], repo: httpsMatch[2] };
  }

  // SSH format: git@github.com:owner/repo.git
  const sshMatch = url.match(
    /^git@github\.com:([^/]+)\/([^/]+?)(?:\.git)?$/i
  );
  if (sshMatch) {
    return { owner: sshMatch[1], repo: sshMatch[2] };
  }

  // SSH URL format: ssh://git@github.com/owner/repo.git
  const sshUrlMatch = url.match(
    /^ssh:\/\/git@github\.com\/([^/]+)\/([^/]+?)(?:\.git)?$/i
  );
  if (sshUrlMatch) {
    return { owner: sshUrlMatch[1], repo: sshUrlMatch[2] };
  }

  return null;
}

/**
 * Parse Azure DevOps URL to extract organization, project, and repo
 */
export function parseAzureUrl(url: string): {
  organization: string;
  project: string;
  repo: string;
} | null {
  // HTTPS format: https://dev.azure.com/org/project/_git/repo
  const devAzureMatch = url.match(
    /^https?:\/\/dev\.azure\.com\/([^/]+)\/([^/]+)\/_git\/([^/]+?)(?:\.git)?$/i
  );
  if (devAzureMatch) {
    return {
      organization: devAzureMatch[1],
      project: devAzureMatch[2],
      repo: devAzureMatch[3],
    };
  }

  // Old HTTPS format: https://org.visualstudio.com/project/_git/repo
  const vsMatch = url.match(
    /^https?:\/\/([^.]+)\.visualstudio\.com\/([^/]+)\/_git\/([^/]+?)(?:\.git)?$/i
  );
  if (vsMatch) {
    return {
      organization: vsMatch[1],
      project: vsMatch[2],
      repo: vsMatch[3],
    };
  }

  // SSH format: git@ssh.dev.azure.com:v3/org/project/repo
  const sshMatch = url.match(
    /^git@ssh\.dev\.azure\.com:v3\/([^/]+)\/([^/]+)\/([^/]+?)(?:\.git)?$/i
  );
  if (sshMatch) {
    return {
      organization: sshMatch[1],
      project: sshMatch[2],
      repo: sshMatch[3],
    };
  }

  // Old SSH format: org@vs-ssh.visualstudio.com:v3/org/project/repo
  const oldSshMatch = url.match(
    /^([^@]+)@vs-ssh\.visualstudio\.com:v3\/[^/]+\/([^/]+)\/([^/]+?)(?:\.git)?$/i
  );
  if (oldSshMatch) {
    return {
      organization: oldSshMatch[1],
      project: oldSshMatch[2],
      repo: oldSshMatch[3],
    };
  }

  return null;
}

/**
 * Parse remote URL to get full repository info
 */
export function parseRemoteUrl(remoteUrl: string): ParsedRepositoryInfo {
  const provider = detectProvider(remoteUrl);

  if (provider === 'github') {
    const parsed = parseGitHubUrl(remoteUrl);
    if (parsed) {
      return {
        provider,
        owner: parsed.owner,
        repo: parsed.repo,
      };
    }
  }

  if (provider === 'azure') {
    const parsed = parseAzureUrl(remoteUrl);
    if (parsed) {
      return {
        provider,
        organization: parsed.organization,
        project: parsed.project,
        repo: parsed.repo,
      };
    }
  }

  return { provider };
}

/**
 * Check if URL is a GitHub URL
 */
export function isGitHubUrl(url: string): boolean {
  return detectProvider(url) === 'github';
}

/**
 * Check if URL is an Azure DevOps URL
 */
export function isAzureUrl(url: string): boolean {
  return detectProvider(url) === 'azure';
}

/**
 * Get display name for provider
 */
export function getProviderDisplayName(provider: GitProvider): string {
  switch (provider) {
    case 'github':
      return 'GitHub';
    case 'azure':
      return 'Azure DevOps';
    default:
      return 'Unknown';
  }
}

/**
 * Build GitHub URL from owner and repo
 */
export function buildGitHubUrl(owner: string, repo: string): string {
  return `https://github.com/${owner}/${repo}`;
}

/**
 * Build Azure DevOps URL from org, project, and repo
 */
export function buildAzureUrl(
  organization: string,
  project: string,
  repo: string
): string {
  return `https://dev.azure.com/${organization}/${project}/_git/${repo}`;
}

/**
 * Build PR URL for GitHub
 */
export function buildGitHubPrUrl(
  owner: string,
  repo: string,
  prNumber: number
): string {
  return `https://github.com/${owner}/${repo}/pull/${prNumber}`;
}

/**
 * Build PR URL for Azure DevOps
 */
export function buildAzurePrUrl(
  organization: string,
  project: string,
  repo: string,
  prId: number
): string {
  return `https://dev.azure.com/${organization}/${project}/_git/${repo}/pullrequest/${prId}`;
}
