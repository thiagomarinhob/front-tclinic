import { ROUTES } from '@/config/constants';
import { redirect } from 'next/navigation';

export default function Home() {
  redirect(ROUTES.DASHBOARD);
}
