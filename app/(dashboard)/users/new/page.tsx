import { Metadata } from 'next';
import { CreateUserForm } from '@/components/users/CreateUserForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Novo Usuário - TClinic',
};

export default function NewUserPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/users">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Novo Usuário</h2>
          <p className="text-muted-foreground">
            Preencha os dados para cadastrar um novo usuário
          </p>
        </div>
      </div>

      <CreateUserForm />
    </div>
  );
}
