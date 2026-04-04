import { redirect } from 'next/navigation';
import { ROUTES } from '@/config/constants';

export default function SettingsPage() {
  redirect(ROUTES.SETTINGS_CLINICA);
}
