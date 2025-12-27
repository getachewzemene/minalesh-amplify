"use client";

import DisputeDetailPage from '@/page-components/DisputeDetail';

export default function Page({ params }: { params: { id: string } }) {
  return <DisputeDetailPage disputeId={params.id} />;
}
