'use client';

import { useState } from 'react';
import { useTranslation } from '@/shared/hooks/useTranslation';
import { useAuth } from '@/domains/auth';

export function useMessagesPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('inbox');

  return {
    t,
    user,
    activeTab,
    setActiveTab,
  };
}
