'use client';

import React from 'react';
import {
  Shield,
  Lock,
  Key,
  Monitor,
  AlertTriangle,
  CheckCircle,
  Eye,
  EyeOff,
  Trash2,
  Clock,
  MapPin
} from 'lucide-react';
import { UserSession } from '@/lib/backend';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { UserAccount } from '@/types';
import { useSecuritySettings } from '../hooks/useSecuritySettings';

interface SecuritySettingsTabProps {
  user?: UserSession;
  profile?: UserAccount;
}

export function SecurityTab({ user }: SecuritySettingsTabProps) {
  const {
    isLoading,
    isChangingPassword,
    passwordChangeSuccess,
    passwordChangeError,
    showCurrentPassword,
    showNewPassword,
    showConfirmPassword,
    loginSessions,
    sessionTimeout,
    passwordForm,
    onPasswordChange,
    handleRevokeSession,
    handleUpdateSessionTimeout,
    toggleShowCurrentPassword,
    toggleShowNewPassword,
    toggleShowConfirmPassword,
  } = useSecuritySettings(user);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Password Change Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Changer le mot de passe
          </CardTitle>
          <CardDescription>
            Mettez à jour votre mot de passe pour maintenir la sécurité de votre compte
          </CardDescription>
        </CardHeader>
        <CardContent>
          {passwordChangeSuccess && (
            <Alert className="mb-6 border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Mot de passe changé avec succès. Vous serez déconnecté de toutes les autres sessions.
              </AlertDescription>
            </Alert>
          )}

          {passwordChangeError && (
            <Alert variant="destructive" className="mb-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{passwordChangeError}</AlertDescription>
            </Alert>
          )}

          <Form {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit(onPasswordChange)} className="space-y-4">
              <FormField
                control={passwordForm.control}
                name="current_password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mot de passe actuel</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showCurrentPassword ? "text" : "password"}
                          placeholder="Votre mot de passe actuel"
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={toggleShowCurrentPassword}
                        >
                          {showCurrentPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={passwordForm.control}
                name="new_password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nouveau mot de passe</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showNewPassword ? "text" : "password"}
                          placeholder="Votre nouveau mot de passe"
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={toggleShowNewPassword}
                        >
                          {showNewPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormDescription>
                      Au moins 12 caractères avec majuscules, minuscules, chiffres et caractères spéciaux
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={passwordForm.control}
                name="confirm_password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmer le nouveau mot de passe</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Confirmer votre nouveau mot de passe"
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={toggleShowConfirmPassword}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={isChangingPassword} className="flex items-center gap-2">
                {isChangingPassword ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Key className="h-4 w-4" />
                )}
                Changer le mot de passe
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Session Management Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            Sessions actives
          </CardTitle>
          <CardDescription>
             Gérez vos sessions actives et la durée d&apos;inactivité avant déconnexion automatique
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Session Timeout */}
          <div className="space-y-2">
            <Label>Déconnexion automatique après inactivité</Label>
            <select
              value={sessionTimeout}
              onChange={(e) => handleUpdateSessionTimeout(parseInt(e.target.value))}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="60">1 heure</option>
              <option value="240">4 heures</option>
              <option value="480">8 heures</option>
              <option value="1440">24 heures</option>
            </select>
            <p className="text-sm text-muted-foreground">
               Durée d&apos;inactivité avant déconnexion automatique pour des raisons de sécurité
            </p>
          </div>

          <Separator />

          {/* Active Sessions */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Sessions actives</h4>
            <div className="space-y-3">
              {loginSessions.map((session) => (
                <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{session.device}</p>
                      {session.current_session && <Badge variant="outline">Session actuelle</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">{session.browser}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {session.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(session.last_active).toLocaleString('fr-FR')}
                      </span>
                    </div>
                  </div>
                  {!session.current_session && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRevokeSession(session.id)}
                      className="flex items-center gap-2 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                      Révoquer
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Recommandations de sécurité
          </CardTitle>
          <CardDescription>
            Conseils pour maintenir la sécurité de votre compte
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium">Mot de passe fort</p>
                <p className="text-sm text-muted-foreground">
                  Utilisez un mot de passe complexe avec au moins 12 caractères
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium">Surveillez vos sessions</p>
                <p className="text-sm text-muted-foreground">
                  Vérifiez régulièrement vos sessions actives et révoquez celles suspectes
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
