'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Image, Loader2, Upload, CheckCircle2, X, FileImage } from 'lucide-react';
import { toast } from 'sonner';
import {
  getTenantInfoAction,
  getLogoUploadUrlAction,
  confirmLogoUploadAction,
} from '@/actions/clinic-logo-actions';

const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
const MAX_SIZE_MB = 2;

export function SettingsDocuments() {
  const [logoObjectKey, setLogoObjectKey] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingPreview, setPendingPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loadingInfo, setLoadingInfo] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadTenantInfo = useCallback(async () => {
    setLoadingInfo(true);
    const result = await getTenantInfoAction();
    if (result.success && result.data) {
      setLogoObjectKey(result.data.logoObjectKey ?? null);
    }
    setLoadingInfo(false);
  }, []);

  useEffect(() => {
    loadTenantInfo();
  }, [loadTenantInfo]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error('Formato inválido. Use PNG, JPG ou WEBP.');
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast.error(`Imagem muito grande. Máximo ${MAX_SIZE_MB}MB.`);
      return;
    }

    setPendingFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPendingPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!pendingFile) return;
    setUploading(true);

    try {
      // 1. Obtém URL pré-assinada
      const urlResult = await getLogoUploadUrlAction(pendingFile.name);
      if (!urlResult.success || !urlResult.data) {
        toast.error(urlResult.error ?? 'Erro ao gerar URL de upload');
        return;
      }

      // 2. Faz upload direto para o R2
      const uploadRes = await fetch(urlResult.data.uploadUrl, {
        method: 'PUT',
        body: pendingFile,
        headers: { 'Content-Type': pendingFile.type },
      });
      if (!uploadRes.ok) {
        toast.error('Erro ao enviar imagem para o servidor');
        return;
      }

      // 3. Confirma no backend
      const confirmResult = await confirmLogoUploadAction(urlResult.data.objectKey);
      if (!confirmResult.success) {
        toast.error(confirmResult.error ?? 'Erro ao salvar logo');
        return;
      }

      setLogoObjectKey(urlResult.data.objectKey);
      setPreviewUrl(pendingPreview);
      setPendingFile(null);
      setPendingPreview(null);
      toast.success('Logo salvo com sucesso! Aparecerá nos documentos gerados.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleCancelPending = () => {
    setPendingFile(null);
    setPendingPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  if (loadingInfo) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-10">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <FileImage className="h-4 w-4" />
          Logo da Clínica
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          O logo será exibido no cabeçalho esquerdo e como marca d&apos;água nos documentos gerados (receituário, atestado, etc.).
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Preview atual ou pendente */}
        <div className="flex items-start gap-6">
          {/* Logo atual */}
          <div className="flex flex-col items-center gap-1">
            <p className="text-xs text-muted-foreground mb-1">Logo atual</p>
            <div className="w-32 h-20 border rounded-md flex items-center justify-center bg-muted/30">
              {previewUrl || logoObjectKey ? (
                previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Logo atual"
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-1 text-muted-foreground">
                    <CheckCircle2 className="h-6 w-6 text-success" />
                    <span className="text-xs text-center">Logo salvo</span>
                  </div>
                )
              ) : (
                <div className="flex flex-col items-center gap-1 text-muted-foreground">
                  <Image className="h-6 w-6" />
                  <span className="text-xs">Sem logo</span>
                </div>
              )}
            </div>
          </div>

          {/* Logo pendente */}
          {pendingPreview && (
            <div className="flex flex-col items-center gap-1">
              <p className="text-xs text-muted-foreground mb-1">Novo logo (pendente)</p>
              <div className="w-32 h-20 border-2 border-primary rounded-md flex items-center justify-center bg-primary/5 relative">
                <img
                  src={pendingPreview}
                  alt="Novo logo"
                  className="max-w-full max-h-full object-contain"
                />
                <button
                  type="button"
                  onClick={handleCancelPending}
                  className="absolute -top-2 -right-2 rounded-full bg-background border shadow-sm p-0.5 hover:text-destructive"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Instruções */}
        <div className="bg-muted/40 rounded-md p-3 text-sm text-muted-foreground space-y-1">
          <p>&#8226; Formatos aceitos: PNG, JPG, WEBP</p>
          <p>&#8226; Tamanho máximo: {MAX_SIZE_MB}MB</p>
          <p>&#8226; Recomendado: fundo transparente (PNG), proporção entre 2:1 e 4:1</p>
        </div>

        {/* Ações */}
        <div className="flex items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_TYPES.join(',')}
            className="hidden"
            onChange={handleFileSelect}
          />
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            <Upload className="mr-2 h-4 w-4" />
            {logoObjectKey ? 'Trocar logo' : 'Selecionar logo'}
          </Button>

          {pendingFile && (
            <Button onClick={handleUpload} disabled={uploading}>
              {uploading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="mr-2 h-4 w-4" />
              )}
              {uploading ? 'Enviando...' : 'Salvar logo'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
