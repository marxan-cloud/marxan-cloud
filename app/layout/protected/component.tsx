import React, { ReactNode, useEffect, useState } from 'react';

import { useSession } from 'next-auth/client';
import { useRouter } from 'next/router';

import { useMe } from 'hooks/me';

import Modal from 'components/modal';

import GuideRequest from 'layout/guide-request';

// const TIME_INTERVAL = 1000 * 60 * 10; // 10 min
// const SESSION_BUFFER_TIME = 30 * 60 * 1000; // 30 min

interface ProtectedProps {
  children: ReactNode
}

const Protected: React.FC = ({ children }: ProtectedProps) => {
  const router = useRouter();
  const { user } = useMe();
  const [session, loading] = useSession();
  const [modal, setModal] = useState(false);

  useEffect(() => {
    const { id: userId } = user;
    const helpUser = window.localStorage.getItem(`help-${userId}`);

    if (!helpUser) {
      setModal(true);
    }
  }, [user]);

  // Not display anything when session request is on progress
  if (loading) return null;

  // Redirect when session doesn't exist
  if (!loading && !session) {
    router.push(`/auth/sign-in?callbackUrl=${window.location.origin}${router.asPath}`);
    return null;
  }

  return (
    <>
      {children}
      <Modal
        dismissable={false}
        title="Hello"
        open={modal}
        size="narrow"
        onDismiss={() => setModal(false)}
      >
        <GuideRequest />
        {/* // le pasa por defecto */}
      </Modal>
    </>
  );
};

export default Protected;
