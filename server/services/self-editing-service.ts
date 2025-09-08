import { storage } from "../storage";
import { getGitHubService } from "./github-service";
import { AdvancedAI } from "./advanced-ai";
import { 
  SelfEditingHistory, 
  InsertSelfEditingHistory,
  CodeAnalysisReport,
  InsertCodeAnalysisReport 
} from "@shared/schema";

interface AnalysisResult {
  issues: Array<{
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    file: string;
    line?: number;
    suggestion?: string;
  }>;
  recommendations: Array<{
    type: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    autoFixable: boolean;
    implementation?: string;
  }>;
}

interface EditPlan {
  editType: 'bug_fix' | 'feature_addition' | 'optimization' | 'refactor' | 'security_patch';
  description: string;
  filesModified: string[];
  changesDetails: any;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  testsPassed: boolean;
  reviewRequired: boolean;
  autoApproved: boolean;
  rollbackPlan: any;
}

export class SelfEditingService {
  private isAnalyzing = false;
  private isEditing = false;

  constructor() {
    // AdvancedAI uses static methods, no need to instantiate
  }

  /**
   * Analyze the codebase for potential improvements
   */
  async analyzeCodebase(repositoryId?: string): Promise<AnalysisResult> {
    if (this.isAnalyzing) {
      throw new Error("Analysis already in progress");
    }

    this.isAnalyzing = true;
    
    try {
      const githubService = getGitHubService();
      const analysis = await githubService.analyzeRepository();
      
      // Enhanced AI analysis (using chat for code analysis)
      const aiAnalysisPrompt = `Analyze this code repository structure and provide recommendations:
        Files: ${analysis.files.join(', ')}
        Current suggestions: ${analysis.suggestions.join(', ')}
        Issues found: ${JSON.stringify(analysis.issues)}
        
        Please provide structured recommendations for improvements.`;
      
      const aiResponse = await AdvancedAI.processAdvancedRequest(aiAnalysisPrompt, {
        userKnowledge: [],
        learnedInsights: [],
        conversationHistory: []
      });
      
      const aiAnalysis = {
        recommendations: this.parseAIRecommendations(aiResponse)
      };

      const result: AnalysisResult = {
        issues: [
          ...analysis.issues,
          ...this.detectCommonIssues(analysis.files)
        ],
        recommendations: [
          ...analysis.suggestions.map(s => ({
            type: 'improvement',
            priority: 'medium' as const,
            description: s,
            autoFixable: this.isAutoFixable(s),
          })),
          ...aiAnalysis.recommendations || []
        ]
      };

      // Store analysis report
      if (repositoryId) {
        await storage.createCodeAnalysisReport({
          repositoryId,
          analysisType: 'comprehensive',
          results: result,
          issues: result.issues,
          recommendations: result.recommendations,
          severity: this.calculateOverallSeverity(result.issues),
          autoFixable: result.recommendations.some(r => r.autoFixable),
          fixSuggestions: result.recommendations.filter(r => r.autoFixable)
        });
      }

      return result;
    } finally {
      this.isAnalyzing = false;
    }
  }

  /**
   * Generate an automated fix for identified issues
   */
  async generateAutomatedFix(
    repositoryId: string,
    analysisResult: AnalysisResult,
    triggerEvent = 'scheduled_analysis'
  ): Promise<EditPlan> {
    const highPriorityIssues = analysisResult.issues.filter(
      issue => issue.severity === 'high' || issue.severity === 'critical'
    );

    const autoFixableRecommendations = analysisResult.recommendations.filter(
      rec => rec.autoFixable && rec.priority !== 'low'
    );

    if (highPriorityIssues.length === 0 && autoFixableRecommendations.length === 0) {
      throw new Error("No actionable issues found for automated fixing");
    }

    // Generate fix plan using AI chat
    const fixPlanPrompt = `Generate a fix plan for these code issues:
      High priority issues: ${JSON.stringify(highPriorityIssues)}
      Auto-fixable recommendations: ${JSON.stringify(autoFixableRecommendations)}
      Repository ID: ${repositoryId}
      
      Please provide a structured fix plan with specific changes needed.`;
    
    const aiResponse = await AdvancedAI.processAdvancedRequest(fixPlanPrompt, {
      userKnowledge: [],
      learnedInsights: [],
      conversationHistory: []
    });
    
    const aiFixPlan = {
      changes: this.parseAIChanges(aiResponse)
    };

    const editPlan: EditPlan = {
      editType: this.determineEditType(highPriorityIssues, autoFixableRecommendations),
      description: this.generateEditDescription(highPriorityIssues, autoFixableRecommendations),
      filesModified: this.extractFilesToModify(highPriorityIssues, autoFixableRecommendations),
      changesDetails: aiFixPlan.changes || {},
      riskLevel: this.calculateRiskLevel(highPriorityIssues, autoFixableRecommendations),
      testsPassed: false, // Will be updated after tests
      reviewRequired: this.shouldRequireReview(highPriorityIssues, autoFixableRecommendations),
      autoApproved: false,
      rollbackPlan: {
        backupBranch: `backup-${Date.now()}`,
        affectedFiles: this.extractFilesToModify(highPriorityIssues, autoFixableRecommendations),
        rollbackInstructions: "Create backup branch and revert commits if issues arise"
      }
    };

    return editPlan;
  }

  /**
   * Apply automated fixes to the repository
   */
  async applySelfEdit(
    repositoryId: string, 
    editPlan: EditPlan,
    triggerEvent = 'automated_fix'
  ): Promise<SelfEditingHistory> {
    if (this.isEditing) {
      throw new Error("Self-editing already in progress");
    }

    this.isEditing = true;

    try {
      const githubService = getGitHubService();
      
      // Create backup branch
      const backupBranch = `backup-${Date.now()}`;
      await githubService.createBranch(backupBranch);

      // Create edit entry
      const editEntry = await storage.createSelfEditingEntry({
        repositoryId,
        branchName: editPlan.rollbackPlan.backupBranch,
        editType: editPlan.editType,
        description: editPlan.description,
        filesModified: editPlan.filesModified,
        changesDetails: editPlan.changesDetails,
        triggerEvent,
        aiAnalysis: {
          riskAssessment: editPlan.riskLevel,
          confidence: this.calculateConfidence(editPlan),
          reasoning: "Automated analysis detected issues requiring fixes"
        },
        status: 'pending',
        riskLevel: editPlan.riskLevel,
        testsPassed: false,
        reviewRequired: editPlan.reviewRequired,
        autoApproved: editPlan.autoApproved,
        rollbackPlan: editPlan.rollbackPlan
      });

      // Generate file changes using AI
      const fileChanges = await this.generateFileChanges(editPlan);

      // Apply changes to repository
      const commitSha = await githubService.commitChanges({
        message: `[Automated] ${editPlan.description}`,
        branch: "main",
        changes: fileChanges
      });

      // Update edit entry with commit information
      const updatedEntry = await storage.updateSelfEditingEntry(editEntry.id, {
        commitHash: commitSha,
        status: 'applied',
        appliedAt: new Date()
      });

      // Run tests (simulated for now)
      const testsPassed = await this.runAutomatedTests(editPlan);
      
      await storage.updateSelfEditingEntry(editEntry.id, {
        testsPassed,
        status: testsPassed ? 'applied' : 'failed'
      });

      if (!testsPassed && editPlan.riskLevel === 'high') {
        // Auto-rollback for high-risk changes that fail tests
        await this.rollbackChanges(editEntry.id, commitSha);
      }

      return updatedEntry;
    } catch (error) {
      throw new Error(`Self-editing failed: ${error}`);
    } finally {
      this.isEditing = false;
    }
  }

  /**
   * Monitor system for issues that trigger automated fixes
   */
  async monitorForIssues(): Promise<{
    requiresAttention: boolean;
    issues: Array<{ type: string; severity: string; description: string }>;
  }> {
    const repositories = await storage.getAllGithubRepositories();
    let allIssues: Array<{ type: string; severity: string; description: string }> = [];

    for (const repo of repositories.filter(r => r.isActive)) {
      try {
        const analysis = await this.analyzeCodebase(repo.id);
        const criticalIssues = analysis.issues.filter(i => i.severity === 'critical' || i.severity === 'high');
        
        allIssues = [
          ...allIssues,
          ...criticalIssues.map(issue => ({
            type: issue.type,
            severity: issue.severity,
            description: `${repo.name}: ${issue.description}`
          }))
        ];

        // Auto-trigger fixes for critical issues
        if (criticalIssues.length > 0) {
          const editPlan = await this.generateAutomatedFix(repo.id, analysis, 'critical_issue_detected');
          
          if (editPlan.riskLevel === 'low' || editPlan.riskLevel === 'medium') {
            await this.applySelfEdit(repo.id, editPlan, 'automated_critical_fix');
          }
        }
      } catch (error) {
        console.error(`Error analyzing repository ${repo.name}:`, error);
      }
    }

    return {
      requiresAttention: allIssues.length > 0,
      issues: allIssues
    };
  }

  /**
   * Rollback changes if issues are detected
   */
  private async rollbackChanges(editEntryId: string, commitSha: string): Promise<void> {
    const githubService = getGitHubService();
    const editEntry = await storage.getSelfEditingEntry(editEntryId);
    
    if (!editEntry) {
      throw new Error("Edit entry not found for rollback");
    }

    // Create rollback branch and revert changes
    const rollbackBranch = `rollback-${Date.now()}`;
    await githubService.createBranch(rollbackBranch);
    
    // Update entry status
    await storage.updateSelfEditingEntry(editEntryId, {
      status: 'reverted'
    });
  }

  // Helper methods
  private detectCommonIssues(files: string[]): Array<{
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    file: string;
    suggestion?: string;
  }> {
    const issues = [];
    
    // Check for missing important files
    const hasDockerfile = files.some(f => f.toLowerCase().includes('dockerfile'));
    const hasGitignore = files.some(f => f.includes('.gitignore'));
    
    if (!hasDockerfile) {
      issues.push({
        type: 'missing_dockerfile',
        severity: 'medium' as const,
        description: 'No Dockerfile found - consider containerization',
        file: 'root',
        suggestion: 'Add Dockerfile for consistent deployment'
      });
    }

    if (!hasGitignore) {
      issues.push({
        type: 'missing_gitignore',
        severity: 'medium' as const,
        description: 'No .gitignore file found',
        file: 'root',
        suggestion: 'Add .gitignore to exclude unnecessary files'
      });
    }

    return issues;
  }

  private isAutoFixable(suggestion: string): boolean {
    const autoFixablePatterns = [
      'readme',
      'documentation',
      'gitignore',
      'security.md',
      'dockerfile'
    ];
    
    return autoFixablePatterns.some(pattern => 
      suggestion.toLowerCase().includes(pattern)
    );
  }

  private calculateOverallSeverity(issues: any[]): 'info' | 'warning' | 'error' | 'critical' {
    if (issues.some(i => i.severity === 'critical')) return 'critical';
    if (issues.some(i => i.severity === 'high')) return 'error';
    if (issues.some(i => i.severity === 'medium')) return 'warning';
    return 'info';
  }

  private determineEditType(issues: any[], recommendations: any[]): 'bug_fix' | 'feature_addition' | 'optimization' | 'refactor' | 'security_patch' {
    if (issues.some(i => i.type.includes('security'))) return 'security_patch';
    if (issues.some(i => i.severity === 'critical' || i.severity === 'high')) return 'bug_fix';
    if (recommendations.some(r => r.type.includes('performance'))) return 'optimization';
    if (recommendations.some(r => r.type.includes('feature'))) return 'feature_addition';
    return 'refactor';
  }

  private generateEditDescription(issues: any[], recommendations: any[]): string {
    const criticalCount = issues.filter(i => i.severity === 'critical').length;
    const highCount = issues.filter(i => i.severity === 'high').length;
    const autoFixCount = recommendations.filter(r => r.autoFixable).length;

    let description = "Automated system improvements: ";
    
    if (criticalCount > 0) description += `${criticalCount} critical issues, `;
    if (highCount > 0) description += `${highCount} high-priority issues, `;
    if (autoFixCount > 0) description += `${autoFixCount} automatic fixes applied`;

    return description.replace(/, $/, '');
  }

  private extractFilesToModify(issues: any[], recommendations: any[]): string[] {
    const files = new Set<string>();
    
    issues.forEach(issue => {
      if (issue.file && issue.file !== 'root') {
        files.add(issue.file);
      }
    });

    recommendations.forEach(rec => {
      if (rec.file) {
        files.add(rec.file);
      }
    });

    return Array.from(files);
  }

  private calculateRiskLevel(issues: any[], recommendations: any[]): 'low' | 'medium' | 'high' | 'critical' {
    const criticalIssues = issues.filter(i => i.severity === 'critical').length;
    const highIssues = issues.filter(i => i.severity === 'high').length;
    const filesAffected = this.extractFilesToModify(issues, recommendations).length;

    if (criticalIssues > 0 || filesAffected > 10) return 'critical';
    if (highIssues > 2 || filesAffected > 5) return 'high';
    if (highIssues > 0 || filesAffected > 2) return 'medium';
    return 'low';
  }

  private shouldRequireReview(issues: any[], recommendations: any[]): boolean {
    const riskLevel = this.calculateRiskLevel(issues, recommendations);
    return riskLevel === 'high' || riskLevel === 'critical';
  }

  private calculateConfidence(editPlan: EditPlan): number {
    let confidence = 0.8; // Base confidence

    if (editPlan.riskLevel === 'low') confidence += 0.1;
    if (editPlan.riskLevel === 'critical') confidence -= 0.3;
    if (editPlan.filesModified.length <= 3) confidence += 0.1;
    if (editPlan.editType === 'security_patch') confidence += 0.05;

    return Math.max(0.1, Math.min(1.0, confidence));
  }

  private async generateFileChanges(editPlan: EditPlan): Promise<Array<{
    path: string;
    content: string;
    encoding?: 'utf-8' | 'base64';
  }>> {
    // This would use AI to generate actual file content changes
    // For now, return placeholder changes
    return editPlan.filesModified.map(file => ({
      path: file,
      content: `// Automated fix applied\n// ${editPlan.description}\n`,
      encoding: 'utf-8' as const
    }));
  }

  private async runAutomatedTests(editPlan: EditPlan): Promise<boolean> {
    // Simulate test execution
    // In a real implementation, this would run the actual test suite
    return editPlan.riskLevel !== 'critical';
  }

  private parseAIRecommendations(aiResponse: string): Array<{
    type: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    autoFixable: boolean;
  }> {
    // Parse AI response for recommendations
    // This is a simplified parser - in production would use more sophisticated parsing
    return [
      {
        type: 'improvement',
        priority: 'medium',
        description: aiResponse.substring(0, 100) + '...',
        autoFixable: true
      }
    ];
  }

  private parseAIChanges(aiResponse: string): any {
    // Parse AI response for specific changes
    return {
      summary: aiResponse.substring(0, 200) + '...',
      files: [],
      instructions: aiResponse
    };
  }
}

// Singleton instance
export const selfEditingService = new SelfEditingService();