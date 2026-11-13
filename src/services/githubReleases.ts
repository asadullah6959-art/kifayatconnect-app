export interface GitHubReleaseStatus {
  status: 'AVAILABLE' | 'LATEST_INSTALLED' | 'OFFLINE';
  installedVersion: string;
  latestVersion: string;
  tagName: string;
  releaseTitle: string;
  releaseNotes: string[];
  apkUrl: string | null;
  releasePageUrl: string | null;
  repoUrl: string;
  publishedAt: string | null;
  checkedAt: string;
}

const GITHUB_REPO = 'asadullah6959-art/kifayatconnect-app';
const GITHUB_REPO_URL = `https://github.com/${GITHUB_REPO}`;
const CACHE_KEY = 'kifayat_github_release_cache_v1';
const CACHE_TTL_MS = 15 * 60 * 1000;
export const INSTALLED_APP_VERSION = '1.0.0';

function normalizeVersion(v: string): string {
  return v.replace(/^v/i, '').trim();
}

export function compareVersions(a: string, b: string): number {
  const pa = normalizeVersion(a).split('.').map(n => parseInt(n, 10) || 0);
  const pb = normalizeVersion(b).split('.').map(n => parseInt(n, 10) || 0);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const na = pa[i] || 0;
    const nb = pb[i] || 0;
    if (na > nb) return 1;
    if (na < nb) return -1;
  }
  return 0;
}

export async function fetchLatestGitHubRelease(forceRefresh = false): Promise<GitHubReleaseStatus> {
  const nowIso = new Date().toISOString();

  if (!forceRefresh) {
    try {
      const cachedRaw = localStorage.getItem(CACHE_KEY);
      if (cachedRaw) {
        const cached = JSON.parse(cachedRaw) as { timestamp: number; data: GitHubReleaseStatus };
        if (Date.now() - cached.timestamp < CACHE_TTL_MS && cached.data && cached.data.tagName) {
          return cached.data;
        }
      }
    } catch {
      // Ignore cache read error
    }
  }

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return {
      status: 'OFFLINE',
      installedVersion: INSTALLED_APP_VERSION,
      latestVersion: INSTALLED_APP_VERSION,
      tagName: `v${INSTALLED_APP_VERSION}`,
      releaseTitle: 'Latest Version Installed',
      releaseNotes: ['Offline mode active. Connected updates will sync automatically when online.'],
      apkUrl: null,
      releasePageUrl: null,
      repoUrl: GITHUB_REPO_URL,
      publishedAt: null,
      checkedAt: nowIso
    };
  }

  try {
    const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`, {
      headers: { Accept: 'application/vnd.github+json' }
    });

    if (!response.ok) {
      // 404 (no published release yet) or rate-limit: safely fall back without exposing broken links
      const fallback: GitHubReleaseStatus = {
        status: 'LATEST_INSTALLED',
        installedVersion: INSTALLED_APP_VERSION,
        latestVersion: INSTALLED_APP_VERSION,
        tagName: `v${INSTALLED_APP_VERSION}`,
        releaseTitle: 'Latest Version Installed',
        releaseNotes: ['You are running the latest verified build of Kifayat Connect.'],
        apkUrl: null,
        releasePageUrl: null,
        repoUrl: GITHUB_REPO_URL,
        publishedAt: null,
        checkedAt: nowIso
      };
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({ timestamp: Date.now(), data: fallback }));
      } catch {
        // Ignore
      }
      return fallback;
    }

    const release = await response.json();
    const rawTag = typeof release.tag_name === 'string' && release.tag_name.trim()
      ? release.tag_name.trim()
      : `v${INSTALLED_APP_VERSION}`;
    const tagVersion = normalizeVersion(rawTag);
    const assets: Array<{ name: string; browser_download_url: string }> = Array.isArray(release.assets)
      ? release.assets
      : [];
    const apkAsset = assets.find(
      a =>
        typeof a?.name === 'string' &&
        a.name.toLowerCase().endsWith('.apk') &&
        typeof a?.browser_download_url === 'string' &&
        a.browser_download_url.startsWith('https://')
    );

    const isNewer = compareVersions(tagVersion, INSTALLED_APP_VERSION) > 0;
    const notesRaw = typeof release.body === 'string' ? release.body : '';
    const releaseNotes = notesRaw
      .split('\n')
      .map((line: string) => line.replace(/^[-*•]\s*/, '').trim())
      .filter(Boolean)
      .slice(0, 6);

    const verifiedApkUrl = apkAsset?.browser_download_url || null;

    const result: GitHubReleaseStatus = {
      status: isNewer && verifiedApkUrl ? 'AVAILABLE' : 'LATEST_INSTALLED',
      installedVersion: INSTALLED_APP_VERSION,
      latestVersion: tagVersion,
      tagName: rawTag,
      releaseTitle: isNewer && verifiedApkUrl
        ? release.name || `Kifayat Connect ${rawTag}`
        : 'Latest Version Installed',
      releaseNotes:
        releaseNotes.length > 0
          ? releaseNotes
          : ['Verified Android APK & PWA build ready for installation.'],
      apkUrl: verifiedApkUrl,
      releasePageUrl: verifiedApkUrl && typeof release.html_url === 'string' ? release.html_url : null,
      repoUrl: GITHUB_REPO_URL,
      publishedAt: release.published_at || null,
      checkedAt: nowIso
    };

    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ timestamp: Date.now(), data: result }));
    } catch {
      // Ignore
    }

    return result;
  } catch {
    return {
      status: 'LATEST_INSTALLED',
      installedVersion: INSTALLED_APP_VERSION,
      latestVersion: INSTALLED_APP_VERSION,
      tagName: `v${INSTALLED_APP_VERSION}`,
      releaseTitle: 'Latest Version Installed',
      releaseNotes: ['You are running the latest verified build of Kifayat Connect.'],
      apkUrl: null,
      releasePageUrl: null,
      repoUrl: GITHUB_REPO_URL,
      publishedAt: null,
      checkedAt: nowIso
    };
  }
}
