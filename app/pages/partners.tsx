import React from 'react';
import Head from 'next/head';

import { useRouter } from 'next/router';

import Contact from 'layout/statics/contact';
import Header from 'layout/header';
import Hero from 'layout/statics/hero';
import Footer from 'layout/footer';
import MetaIcons from 'layout/meta-icons';
import MetaTags from 'layout/meta-tags';
import PartnersList from 'layout/partners';

import MARXAN_SOCIAL_MEDIA_IMG from 'images/social-media/marxan-social-media.png';

import { withUser } from 'hoc/auth';

export const getServerSideProps = withUser();

const Partners: React.FC = () => {
  const { asPath } = useRouter();

  const DESCRIPTION_TEXT = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.';
  const TITLE_TEXT = 'Let’s grow the platform together lorem ipsum.';

  return (
    <>
      <Head>
        <title>Partners</title>
      </Head>

      <MetaIcons />

      <MetaTags
        name="Marxan conservation Solutions"
        title={TITLE_TEXT}
        description={DESCRIPTION_TEXT}
        url={`${process.env.NEXT_PUBLIC_VERCEL_URL}${asPath}`}
        image={MARXAN_SOCIAL_MEDIA_IMG}
        type="article"
        twitterCard="summary"
        twitterSite="@Marxan_Planning"
      />

      <main className="flex flex-col h-full md:flex-grow">
        <Header size="base" />
        <Hero
          section="Partners"
          title={TITLE_TEXT}
          description={DESCRIPTION_TEXT}
        />
        <PartnersList />
        <Contact />
        <Footer />
      </main>
    </>
  );
};

export default Partners;
