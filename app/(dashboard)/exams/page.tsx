import { Metadata } from 'next';
import { ExamsPageContent } from '@/components/exams/ExamsPageContent';

export const metadata: Metadata = {
  title: 'Exames - TClinic',
};

export default function ExamsPage() {
  return <ExamsPageContent />;
}
