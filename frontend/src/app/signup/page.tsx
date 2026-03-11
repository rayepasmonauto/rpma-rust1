'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FormFeedback } from '@/components/ui/form-feedback';
import { FadeIn } from '@/shared/ui/animations/FadeIn';
import { UILoader } from '@/shared/ui/animations/UILoader';
import { ROUTES } from '@/constants';
import { PasswordStrengthMeter } from '@/domains/auth';
import { useSignupForm } from '@/domains/auth';

export default function SignupPage() {
  const {
    formData,
    error,
    isLoading,
    success,
    isPasswordValid,
    handleChange,
    handlePasswordValidationChange,
    handleSubmit,
    handleGoToLogin,
  } = useSignupForm();

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--rpma-surface))] py-8 px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <div className="max-w-md w-full space-y-6">
            <div className="rpma-shell p-8">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[hsl(var(--rpma-teal))]/20 mb-6">
                  <svg className="w-8 h-8 text-[hsl(var(--rpma-teal))]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Inscription réussie</h2>
                <p className="text-muted-foreground text-sm md:text-base">
                  Votre compte a été créé avec succès
                </p>
              </div>

              <div className="space-y-4">
                <div className="bg-[hsl(var(--rpma-teal))]/10 border border-[hsl(var(--rpma-teal))]/30 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-[hsl(var(--rpma-teal))]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-[hsl(var(--rpma-teal))] mb-1">Bienvenue sur RPMA</h4>
                      <p className="text-sm text-muted-foreground">Compte créé avec succès</p>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleGoToLogin}
                  className="w-full bg-[hsl(var(--rpma-teal))] hover:bg-[hsl(var(--rpma-teal))]/90 text-black"
                >
                  Aller à la connexion
                </Button>
              </div>
            </div>

            <div className="mt-8 text-center">
              <div className="inline-flex items-center gap-2 text-muted-foreground text-xs">
                <div className="w-6 h-6 bg-[hsl(var(--rpma-teal))]/20 rounded flex items-center justify-center">
                  <span className="text-[hsl(var(--rpma-teal))] font-bold text-xs">R</span>
                </div>
                <span>RPMA V2 - Système de gestion PPF</span>
              </div>
            </div>
          </div>
        </FadeIn>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--rpma-surface))] py-8 px-4 sm:px-6 lg:px-8">
      <FadeIn>
        <div className="max-w-md w-full space-y-6">
          <div className="rpma-shell p-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[hsl(var(--rpma-teal))]/20 mb-6">
                <svg className="w-8 h-8 text-[hsl(var(--rpma-teal))]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Créer un compte</h2>
              <p className="text-muted-foreground text-sm md:text-base">
                Rejoignez RPMA pour gérer vos interventions PPF
              </p>
            </div>

            {error && (
              <FormFeedback
                type="error"
                message={error}
                className="animate-in slide-in-from-top-2 duration-300"
              />
            )}

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="firstName" className="block text-sm font-semibold text-foreground">
                      Prénom
                    </label>
                    <input
                      id="firstName"
                      name="firstName"
                      type="text"
                      required
                      value={formData.firstName}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-white border border-[hsl(var(--rpma-border))] rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(var(--rpma-teal))]/20 focus:border-[hsl(var(--rpma-teal))] transition-all duration-200"
                      placeholder="Jean"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="lastName" className="block text-sm font-semibold text-foreground">
                      Nom
                    </label>
                    <input
                      id="lastName"
                      name="lastName"
                      type="text"
                      required
                      value={formData.lastName}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-white border border-[hsl(var(--rpma-border))] rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(var(--rpma-teal))]/20 focus:border-[hsl(var(--rpma-teal))] transition-all duration-200"
                      placeholder="Dupont"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="email" className="block text-sm font-semibold text-foreground">
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white border border-[hsl(var(--rpma-border))] rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(var(--rpma-teal))]/20 focus:border-[hsl(var(--rpma-teal))] transition-all duration-200"
                    placeholder="jean.dupont@exemple.fr"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="password" className="block text-sm font-semibold text-foreground">
                    Mot de passe
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white border border-[hsl(var(--rpma-border))] rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(var(--rpma-teal))]/20 focus:border-[hsl(var(--rpma-teal))] transition-all duration-200"
                    placeholder="••••••••"
                  />
                  <PasswordStrengthMeter
                    password={formData.password}
                    onValidationChange={handlePasswordValidationChange}
                    showFeedback={true}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="confirmPassword" className="block text-sm font-semibold text-foreground">
                    Confirmer le mot de passe
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 bg-white border rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 transition-all duration-200 ${
                      formData.confirmPassword && formData.password !== formData.confirmPassword
                        ? 'border-red-500/50 focus:ring-red-500/50 focus:border-red-500'
                        : 'border-[hsl(var(--rpma-border))] focus:ring-[hsl(var(--rpma-teal))]/20 focus:border-[hsl(var(--rpma-teal))]'
                    }`}
                    placeholder="••••••••"
                  />
                  {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                    <p className="text-xs text-red-400 mt-1">Les mots de passe ne correspondent pas</p>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <Button
                  type="submit"
                  disabled={isLoading || !isPasswordValid || (formData.confirmPassword.length > 0 && formData.password !== formData.confirmPassword)}
                  className="w-full flex justify-center items-center py-3 px-4 text-sm font-semibold rounded-xl bg-[hsl(var(--rpma-teal))] text-black hover:bg-[hsl(var(--rpma-teal))]/90 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--rpma-teal))]/20 focus:ring-offset-2 focus:ring-offset-background transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
                >
                  {isLoading ? (
                    <>
                      <UILoader size="sm" className="mr-3" />
                      Création du compte...
                    </>
                  ) : (
                    <>
                      Créer mon compte
                      <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </>
                  )}
                </Button>

                <div className="text-center">
                  <p className="text-muted-foreground text-sm">
                    Vous avez déjà un compte ?{' '}
                    <Link
                      href={ROUTES.LOGIN}
                      className="font-semibold text-[hsl(var(--rpma-teal))] hover:text-[hsl(var(--rpma-teal))]/80 transition-colors duration-150"
                    >
                      Se connecter
                    </Link>
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-[hsl(var(--rpma-border))]">
                <p className="text-center text-xs text-muted-foreground leading-relaxed">
                  En créant un compte, vous acceptez nos conditions d&apos;utilisation
                </p>
              </div>
            </form>
          </div>

          <div className="mt-8 text-center">
            <div className="inline-flex items-center gap-2 text-muted-foreground text-xs">
              <div className="w-6 h-6 bg-[hsl(var(--rpma-teal))]/20 rounded flex items-center justify-center">
                <span className="text-[hsl(var(--rpma-teal))] font-bold text-xs">R</span>
              </div>
              <span>RPMA V2 - Système de gestion PPF</span>
            </div>
          </div>
        </div>
      </FadeIn>
    </div>
  );
}
