import { Octokit } from "@octokit/rest";
import { storage } from "../storage";
import { GithubRepository, SelfEditingHistory } from "@shared/schema";

interface GitHubConfig {
  token: string;
  owner: string;
  repo: string;
}

interface FileChange {
  path: string;
  content: string;
  encoding?: 'utf-8' | 'base64';
}

interface CommitInfo {
  message: string;
  branch: string;
  changes: FileChange[];
}

export class GitHubService {
  private octokit: Octokit;
  private config: GitHubConfig;

  constructor(token: string, owner: string, repo: string) {
    this.octokit = new Octokit({ auth: token });
    this.config = { token, owner, repo };
  }

  /**
   * Initialize GitHub repository connection
   */
  async initializeRepository(): Promise<GithubRepository> {
    try {
      const { data: repo } = await this.octokit.repos.get({
        owner: this.config.owner,
        repo: this.config.repo,
      });

      return await storage.createGithubRepository({
        name: repo.name,
        fullName: repo.full_name,
        url: repo.html_url,
        description: repo.description || "",
        defaultBranch: repo.default_branch,
        isActive: true,
        accessToken: this.config.token, // Should be encrypted in production
        lastSync: new Date(),
      });
    } catch (error) {
      throw new Error(`Failed to initialize GitHub repository: ${error}`);
    }
  }

  /**
   * Get repository information
   */
  async getRepositoryInfo() {
    const { data } = await this.octokit.repos.get({
      owner: this.config.owner,
      repo: this.config.repo,
    });
    return data;
  }

  /**
   * Get file content from repository
   */
  async getFileContent(path: string, branch = "main"): Promise<string> {
    try {
      const { data } = await this.octokit.repos.getContent({
        owner: this.config.owner,
        repo: this.config.repo,
        path,
        ref: branch,
      });

      if (Array.isArray(data) || data.type !== 'file') {
        throw new Error('Path does not point to a file');
      }

      return Buffer.from(data.content, 'base64').toString('utf-8');
    } catch (error) {
      throw new Error(`Failed to get file content: ${error}`);
    }
  }

  /**
   * Update multiple files in a single commit
   */
  async commitChanges(commitInfo: CommitInfo): Promise<string> {
    try {
      // Get the latest commit SHA from the branch
      const { data: refData } = await this.octokit.git.getRef({
        owner: this.config.owner,
        repo: this.config.repo,
        ref: `heads/${commitInfo.branch}`,
      });

      const latestCommitSha = refData.object.sha;

      // Get the tree SHA from the latest commit
      const { data: commitData } = await this.octokit.git.getCommit({
        owner: this.config.owner,
        repo: this.config.repo,
        commit_sha: latestCommitSha,
      });

      const baseTreeSha = commitData.tree.sha;

      // Create blobs for each file change
      const treeItems = await Promise.all(
        commitInfo.changes.map(async (change) => {
          const { data: blob } = await this.octokit.git.createBlob({
            owner: this.config.owner,
            repo: this.config.repo,
            content: change.content,
            encoding: change.encoding || 'utf-8',
          });

          return {
            path: change.path,
            mode: '100644' as const,
            type: 'blob' as const,
            sha: blob.sha,
          };
        })
      );

      // Create a new tree
      const { data: newTree } = await this.octokit.git.createTree({
        owner: this.config.owner,
        repo: this.config.repo,
        base_tree: baseTreeSha,
        tree: treeItems,
      });

      // Create a new commit
      const { data: newCommit } = await this.octokit.git.createCommit({
        owner: this.config.owner,
        repo: this.config.repo,
        message: commitInfo.message,
        tree: newTree.sha,
        parents: [latestCommitSha],
      });

      // Update the branch reference
      await this.octokit.git.updateRef({
        owner: this.config.owner,
        repo: this.config.repo,
        ref: `heads/${commitInfo.branch}`,
        sha: newCommit.sha,
      });

      return newCommit.sha;
    } catch (error) {
      throw new Error(`Failed to commit changes: ${error}`);
    }
  }

  /**
   * Create a new branch
   */
  async createBranch(branchName: string, fromBranch = "main"): Promise<void> {
    try {
      const { data: refData } = await this.octokit.git.getRef({
        owner: this.config.owner,
        repo: this.config.repo,
        ref: `heads/${fromBranch}`,
      });

      await this.octokit.git.createRef({
        owner: this.config.owner,
        repo: this.config.repo,
        ref: `refs/heads/${branchName}`,
        sha: refData.object.sha,
      });
    } catch (error) {
      throw new Error(`Failed to create branch: ${error}`);
    }
  }

  /**
   * Create a pull request
   */
  async createPullRequest(
    title: string,
    body: string,
    headBranch: string,
    baseBranch = "main"
  ) {
    try {
      const { data } = await this.octokit.pulls.create({
        owner: this.config.owner,
        repo: this.config.repo,
        title,
        body,
        head: headBranch,
        base: baseBranch,
      });

      return data;
    } catch (error) {
      throw new Error(`Failed to create pull request: ${error}`);
    }
  }

  /**
   * Get repository file tree
   */
  async getFileTree(branch = "main"): Promise<any[]> {
    try {
      const { data } = await this.octokit.git.getTree({
        owner: this.config.owner,
        repo: this.config.repo,
        tree_sha: branch,
        recursive: "true",
      });

      return data.tree;
    } catch (error) {
      throw new Error(`Failed to get file tree: ${error}`);
    }
  }

  /**
   * Analyze repository for potential improvements
   */
  async analyzeRepository(): Promise<{
    files: string[];
    suggestions: string[];
    issues: any[];
  }> {
    try {
      const tree = await this.getFileTree();
      const files = tree.filter(item => item.type === 'blob').map(item => item.path);
      
      // Basic analysis - could be enhanced with AI
      const suggestions: string[] = [];
      const issues: any[] = [];

      // Check for common patterns
      const hasPackageJson = files.some(f => f.includes('package.json'));
      const hasReadme = files.some(f => f.toLowerCase().includes('readme'));
      const hasTsConfig = files.some(f => f.includes('tsconfig.json'));

      if (hasPackageJson && !hasReadme) {
        suggestions.push("Consider adding a README.md file for better documentation");
      }

      if (hasPackageJson && !hasTsConfig) {
        suggestions.push("Consider adding TypeScript configuration for better type safety");
      }

      // Check for security files
      const hasSecurityMd = files.some(f => f.toLowerCase().includes('security.md'));
      if (!hasSecurityMd) {
        suggestions.push("Consider adding SECURITY.md for security policy");
      }

      return { files, suggestions, issues };
    } catch (error) {
      throw new Error(`Failed to analyze repository: ${error}`);
    }
  }

  /**
   * Get recent commits
   */
  async getRecentCommits(limit = 10) {
    try {
      const { data } = await this.octokit.repos.listCommits({
        owner: this.config.owner,
        repo: this.config.repo,
        per_page: limit,
      });

      return data.map((commit: any) => ({
        sha: commit.sha,
        message: commit.commit.message,
        author: commit.commit.author?.name,
        date: commit.commit.author?.date,
        url: commit.html_url,
      }));
    } catch (error) {
      throw new Error(`Failed to get recent commits: ${error}`);
    }
  }
}

// Singleton instance for the main repository
let githubService: GitHubService | null = null;

export function initializeGitHubService(token: string, owner: string, repo: string): GitHubService {
  githubService = new GitHubService(token, owner, repo);
  return githubService;
}

export function getGitHubService(): GitHubService {
  if (!githubService) {
    throw new Error("GitHub service not initialized. Call initializeGitHubService first.");
  }
  return githubService;
}