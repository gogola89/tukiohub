'use client';

import { useState } from 'react';
import { isAxiosError } from 'axios';
import { toast } from 'react-hot-toast';
import { analyticsAPI, ReconciliationReport } from '@/lib/api/endpoints/analytics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';

interface ReconciliationReportCardProps {
  eventId: string;
}

export default function ReconciliationReportCard({ eventId }: ReconciliationReportCardProps) {
  const [report, setReport] = useState<ReconciliationReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = async () => {
    setIsLoading(true);
    try {
      const result = await analyticsAPI.getReconciliationReport(eventId);
      setReport(result);
    } catch (error: unknown) {
      const message = isAxiosError<{ error?: string }>(error)
        ? error.response?.data?.error || 'Failed to generate report'
        : 'Failed to generate report';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reconciliation Report</CardTitle>
        <p className="text-sm text-muted-foreground">
          Matches confirmed registrations against completed payments for this event.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={handleGenerate} disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            'Generate Reconciliation Report'
          )}
        </Button>

        {report && (
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground uppercase">Registrations</p>
                <p className="text-xl font-bold">{report.registrations_total}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase">Payments Received</p>
                <p className="text-xl font-bold">KES {report.payments_total.toLocaleString()}</p>
              </div>
            </div>

            {report.payments_by_method.length > 0 && (
              <div className="space-y-1">
                {report.payments_by_method.map((row) => (
                  <div key={row.method} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{row.method_label} ({row.count})</span>
                    <span className="font-medium">KES {row.total.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}

            {report.reconciliation.is_clean ? (
              <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg p-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                <p className="text-sm text-green-900">
                  Clean — every confirmed booking has a matching payment, and vice versa.
                </p>
              </div>
            ) : (
              <div className="space-y-2 bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  <p className="text-sm font-medium text-red-900">Needs review</p>
                </div>
                {report.reconciliation.bookings_without_transaction_count > 0 && (
                  <p className="text-xs text-red-800">
                    {report.reconciliation.bookings_without_transaction_count} booking(s) without a matching payment:{' '}
                    <span className="font-mono">
                      {report.reconciliation.bookings_without_transaction.join(', ')}
                    </span>
                  </p>
                )}
                {report.reconciliation.transactions_without_booking_count > 0 && (
                  <p className="text-xs text-red-800">
                    {report.reconciliation.transactions_without_booking_count} payment(s) without a matching booking:{' '}
                    <span className="font-mono">
                      {report.reconciliation.transactions_without_booking.join(', ')}
                    </span>
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
