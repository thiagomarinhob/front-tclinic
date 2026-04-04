'use client'

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getUserDetailAction } from '@/actions/user-actions';
import { UserForm } from '@/components/users/UserForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import type { UserDetailResponse } from '@/types';

export default function EditUserPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const [user, setUser] = useState<UserDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      try {
        const result = await getUserDetailAction(userId);
        if (result.success && result.data) {
          setUser(result.data);
        } else {
          toast.error(result.error || 'Usuário não encontrado');
          router.push('/users');
        }
      } catch {
        toast.error('Erro ao carregar dados do usuário');
        router.push('/users');
      } finally {
        setIsLoading(false);
      }
    }

    if (userId) {
      loadUser();
    }
  }, [userId, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/users/${userId}`}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Editar Usuário</h2>
          <p className="text-muted-foreground">
            Atualize os dados de {fullName}
          </p>
        </div>
      </div>

      <UserForm
        user={user}
        onSuccess={() => router.push(`/users/${userId}`)}
      />
    </div>
  );
}
