'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useUserActions } from '../api/useUserActions';

interface ResetPasswordDialogProps {
  userId: string;
  userName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRefresh: () => void;
}

export function ResetPasswordDialog({
  userId,
  userName,
  open,
  onOpenChange,
  onRefresh,
}: ResetPasswordDialogProps) {
  const { adminResetPassword } = useUserActions();
  const [phase, setPhase] = useState<'confirm' | 'result'>('confirm');
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setPhase('confirm');
      setTempPassword(null);
      setCopied(false);
      if (phase === 'result') onRefresh();
    }
    onOpenChange(open);
  };

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      const pwd = await adminResetPassword(userId);
      if (!pwd) {
        toast.error('Échec de la réinitialisation du mot de passe.');
        return;
      }
      setTempPassword(pwd);
      setPhase('result');
    } catch (error) {
      toast.error('Erreur : ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (tempPassword) {
      navigator.clipboard.writeText(tempPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        {phase === 'confirm' ? (
          <>
            <DialogHeader>
              <DialogTitle>Réinitialiser le mot de passe</DialogTitle>
              <DialogDescription>
                Vous êtes sur le point de réinitialiser le mot de passe de{' '}
                <span className="font-semibold text-foreground">{userName}</span>. Un mot de passe
                temporaire sera généré et affiché une seule fois.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isLoading}>
                Annuler
              </Button>
              <Button variant="destructive" onClick={handleConfirm} disabled={isLoading}>
                {isLoading ? 'Réinitialisation...' : 'Réinitialiser'}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Mot de passe temporaire</DialogTitle>
              <DialogDescription>
                Communiquez ce mot de passe à{' '}
                <span className="font-semibold text-foreground">{userName}</span> par un canal
                sécurisé.
              </DialogDescription>
            </DialogHeader>
            <div className="my-4 space-y-3">
              <div className="flex items-center gap-2">
                <code className="flex-1 px-4 py-2 bg-muted rounded-lg font-mono text-sm text-foreground border border-[hsl(var(--rpma-border))]">
                  {tempPassword}
                </code>
                <Button variant="outline" size="sm" onClick={handleCopy}>
                  {copied ? 'Copié !' : 'Copier'}
                </Button>
              </div>
              <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                Ce mot de passe ne sera affiché qu&apos;une seule fois. Il ne peut pas être récupéré
                après fermeture de cette fenêtre.
              </p>
            </div>
            <DialogFooter>
              <Button onClick={() => handleOpenChange(false)}>Fermer</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
