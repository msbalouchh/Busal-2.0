"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HrAgentNav } from "@/modules/ai-hr-agent-management/components/hr-agent-nav";
import type { CandidateEvaluation } from "@/services/ai-hr-candidate-evaluation.service";
import type { RecruitmentSnapshot } from "@/services/ai-hr-recruitment-analysis.service";

interface HrRecruitmentPanelProps {
  recruitment: RecruitmentSnapshot;
  candidates: CandidateEvaluation[];
}

export function HrRecruitmentPanel({ recruitment, candidates }: HrRecruitmentPanelProps) {
  return (
    <div className="space-y-8">
      <HrAgentNav />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending invitations</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{recruitment.pendingInvitations}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Expired</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{recruitment.expiredInvitations}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Accepted (month)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{recruitment.acceptedThisMonth}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Headcount gap</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{recruitment.openHeadcountGap}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Candidate evaluation</CardTitle>
        </CardHeader>
        <CardContent>
          {candidates.length === 0 ? (
            <p className="text-muted-foreground text-sm">No pending candidates.</p>
          ) : (
            <ul className="space-y-4">
              {candidates.map((candidate) => (
                <li key={candidate.invitationId} className="rounded-lg border p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{candidate.email}</p>
                      <p className="text-muted-foreground mt-1 text-sm">{candidate.assessment}</p>
                      <p className="mt-2 text-sm">{candidate.recommendation}</p>
                    </div>
                    <Badge variant="secondary">{candidate.status}</Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
